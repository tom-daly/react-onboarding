import type { SPFI } from '../sp';
import type { IList } from '@pnp/sp/lists';
import type { IView } from '@pnp/sp/views';
import { AddFieldOptions } from '@pnp/sp/fields';
import { IListDef, IViewDef, ListIds, TEAM_DESCRIPTION, TEAM_GROUP, listDef } from './schema';
import { RoleType, RoleTypeValue } from './permissions';
import { ISiteInfo, listIds, teamGroupId } from './problems';
import { IStep, Unmade, planSetup, skipReason } from './plan';
import { findTeamGroup, readToolState } from './toolState';
import { explain } from './errors';
import { SETUP_ERRORS } from '../strings/setup';

export type OnSteps = (steps: IStep[]) => void;

/* The Onboarding Team group, once there is one, for the steps that let it in. */
interface IGroupRef {
  id?: number;
}

/**
 * Works out what setup has to do, then does it one step at a time, reporting
 * every change so the page can tick the steps off. Safe to run again: the plan
 * only holds what is missing or wrong, so a half-finished run is picked up
 * where it stopped.
 *
 * Returns the steps as they ended. Any with state 'failed' did not happen.
 */
export async function runSetup(sp: SPFI, site: ISiteInfo, onSteps: OnSteps): Promise<IStep[]> {
  const state = await readToolState(sp, site, true);
  const steps = planSetup(state, site.everyoneLogin);
  const report = (): void => onSteps(steps.map(s => ({ ...s })));
  report();

  const ids = listIds(state);
  const group: IGroupRef = { id: teamGroupId(state) };
  const unmade = new Set<Unmade>();

  for (const step of steps) {
    const skip = skipReason(step, unmade);
    if (skip) {
      step.state = 'skipped';
      step.error = skip;
      report();
      continue;
    }
    step.state = 'running';
    report();
    try {
      await runStep(sp, site, step, ids, group);
      step.state = 'done';
    } catch (e) {
      step.state = 'failed';
      step.error = explain(e);
      if (step.kind === 'makeList' && step.list) unmade.add(step.list);
      if (step.kind === 'makeGroup') unmade.add('team');
    }
    report();
  }
  return steps.map(s => ({ ...s }));
}

const groupIdOf = (group: IGroupRef): number => {
  if (group.id === undefined) throw new Error(SETUP_ERRORS.noTeamGroup);
  return group.id;
};

async function runStep(sp: SPFI, site: ISiteInfo, step: IStep, ids: ListIds, group: IGroupRef): Promise<void> {
  if (step.kind === 'makeGroup') {
    group.id = await makeTeamGroup(sp, site);
    return;
  }

  if (!step.list) throw new Error(`"${step.label}" doesn't say which list it is for.`);
  const def = listDef(step.list);

  if (step.kind === 'makeList') {
    ids[def.key] = await createList(sp, def);
    return;
  }

  const id = ids[def.key];
  if (!id) throw new Error(SETUP_ERRORS.listGone(def.title));
  const list = sp.web.lists.getById(id);

  switch (step.kind) {
    case 'addColumns': {
      // Try every column, then report the ones that would not go in.
      const failed: string[] = [];
      for (const name of step.fields || []) {
        const f = def.fields.filter(x => x.name === name)[0];
        try {
          await list.fields.createFieldAsXml({
            SchemaXml: f.xml(ids),
            // Keep the internal name we gave it, and put it in the default view if it belongs there.
            Options: AddFieldOptions.AddFieldInternalNameHint |
              (f.inDefaultView ? AddFieldOptions.AddFieldToDefaultView : AddFieldOptions.DefaultValue)
          });
        } catch (e) {
          failed.push(SETUP_ERRORS.columnFailed(f.title, explain(e)));
        }
      }
      if (failed.length) throw new Error(SETUP_ERRORS.columnsNotAdded(failed));
      return;
    }
    case 'addChoices': {
      // Keeps every choice the column has, including any added by hand, and adds the new ones.
      const c = step.choices;
      if (c) await list.fields.getByInternalNameOrTitle(c.field).update({ Choices: c.all }, 'SP.FieldChoice');
      return;
    }
    case 'views':
      for (let i = 0; i < def.views.length; i++) await applyView(list, def.views[i], i === 0);
      return;
    case 'seed':
      for (const row of def.starterRows || []) await list.items.add(row);
      return;
    case 'linkTasks':
      await linkTasks(sp, list, ids);
      return;
    case 'settings':
      await list.update(step.settings || {});
      return;
    case 'staffAccess':
      await letStaffIn(sp, list, site);
      return;
    case 'teamAccess':
      // Edit: every row and the list's own settings, but not who gets in.
      await grant(sp, list, await hasOwnPermissions(list), groupIdOf(group), RoleType.editor);
      return;
  }
}

/*
 * Puts each task without a section into the section named the same as its old
 * When column. Read without picking columns, as that one may not be there.
 */
async function linkTasks(sp: SPFI, tasks: IList, ids: ListIds): Promise<void> {
  if (!ids.sections) throw new Error(SETUP_ERRORS.listGone(listDef('sections').title));
  const sections = await sp.web.lists.getById(ids.sections).items.select('Id', 'Title').top(5000)();
  const byName: Record<string, number> = {};
  sections.forEach(s => { byName[String(s.Title || '').trim().toLowerCase()] = s.Id; });
  const rows = await tasks.items.top(5000)();
  for (const r of rows) {
    const when = String(r.TaskWhen || '').trim().toLowerCase();
    if (r.TaskSectionId || !when || byName[when] === undefined) continue;
    await tasks.items.getById(r.Id).update({ TaskSectionId: byName[when] });
  }
}

/* Made with the web address as its title, so the address comes out clean, then renamed. */
async function createList(sp: SPFI, def: IListDef): Promise<string> {
  const info = await sp.web.lists.add(def.urlName, def.description, 100, false);
  const list = sp.web.lists.getById(info.Id);
  try {
    await list.update({ Title: def.title });
  } catch {
    // Another list already has that title. The tool finds its lists by address, so it still works.
  }
  await list.fields.getByInternalNameOrTitle('Title').update({ Title: def.titleColumn });
  return info.Id;
}

async function applyView(list: IList, v: IViewDef, isDefault: boolean): Promise<void> {
  let view: IView;
  if (isDefault) {
    view = list.defaultView;
    await view.update({ Title: v.title, ViewQuery: v.query, RowLimit: v.rowLimit });
  } else {
    const info = await list.views.add(v.title, false, { ViewQuery: v.query, RowLimit: v.rowLimit });
    view = list.views.getById(info.Id);
  }
  await view.fields.removeAll();
  for (const f of v.fields) await view.fields.add(f);
}

async function hasOwnPermissions(list: IList): Promise<boolean> {
  const info = await list.select('HasUniqueRoleAssignments')();
  return (info as unknown as { HasUniqueRoleAssignments: boolean }).HasUniqueRoleAssignments;
}

/*
 * Lets a person or group into a list at a permission level. A list that still
 * follows the site gets permissions of its own first, copied from the site, so
 * everyone who could get in still can.
 */
async function grant(
  sp: SPFI, list: IList, hasOwn: boolean, principalId: number, level: RoleTypeValue
): Promise<void> {
  if (!hasOwn) await list.breakRoleInheritance(true, false);
  const role = await sp.web.roleDefinitions.getByType(level)();
  await list.roleAssignments.add(principalId, role.Id);
}

/* The list gets its own permissions, copied from the site, and everyone in the
   organisation can add to it. */
async function letStaffIn(sp: SPFI, list: IList, site: ISiteInfo): Promise<void> {
  const hasOwn = await hasOwnPermissions(list);
  const everyone = await sp.web.ensureUser(site.everyoneLogin);
  await grant(sp, list, hasOwn, everyone.Id, RoleType.contributor);
}

/*
 * The group whose people run onboarding. The site's Owners group owns it, so
 * every site owner can add and take people off, not just whoever ran setup.
 * One already there by that name is used as it is.
 */
async function makeTeamGroup(sp: SPFI, site: ISiteInfo): Promise<number> {
  const existing = await findTeamGroup(sp);
  if (existing !== undefined) return existing;

  const owners = await sp.web.associatedOwnerGroup.select('Id')();
  if (!owners || typeof owners.Id !== 'number') {
    throw new Error(SETUP_ERRORS.noOwnersGroup);
  }
  const made = await sp.web.siteGroups.add({
    Title: TEAM_GROUP,
    Description: TEAM_DESCRIPTION,
    OnlyAllowMembersViewMembership: false,
    AllowMembersEditMembership: false,
    AllowRequestToJoinLeave: false
  });
  const group = sp.web.siteGroups.getById(made.Id);
  try {
    await group.setUserAsOwner(owners.Id);
  } catch (e) {
    // Left as it is, only whoever ran setup could change it. Gone again, the next run starts clean.
    await sp.web.siteGroups.removeById(made.Id).catch(() => undefined);
    throw e;
  }
  // SharePoint puts whoever makes a group in it. Site owners can run onboarding anyway, so they come back out.
  await group.users.removeById(site.currentUserId).catch(() => undefined);
  return made.Id;
}
