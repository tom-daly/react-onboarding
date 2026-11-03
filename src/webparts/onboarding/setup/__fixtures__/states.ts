import { TOOL_LISTS, ListKey, TEAM_GROUP } from '../schema';
import { RoleType, everyoneClaim } from '../permissions';
import { IListState, ToolState, ALL_ROWS, OWN_ROWS } from '../problems';

export const EVERYONE = everyoneClaim('tenant');
export const OWNERS = { principalId: 3, loginName: 'Onboarding Owners', roles: [RoleType.administrator] };
export const STAFF = { principalId: 9, loginName: EVERYONE, roles: [RoleType.contributor] };
export const TEAM = { principalId: 20, loginName: TEAM_GROUP, roles: [RoleType.editor] };

/* The Onboarding Team with only the Limited Access SharePoint hands out on its own, which opens nothing. */
export const LIMITED_TEAM = { ...TEAM, roles: [RoleType.guest] };

/* A site exactly as setup leaves it, seen by a site owner who is not IT. */
export function healthy(): ToolState {
  const state = {} as ToolState;
  for (const def of TOOL_LISTS) {
    const s: IListState = {
      exists: true,
      id: def.key,
      hidden: def.hidden,
      noCrawl: !def.searchable,
      versioning: def.keepVersions,
      readSecurity: ALL_ROWS,
      writeSecurity: def.access === 'addOwn' ? OWN_ROWS : ALL_ROWS,
      // Lists the team runs have permissions of their own, even ones that otherwise follow the site.
      uniquePermissions: def.access !== 'site' || def.team,
      canManage: true,
      fields: def.fields.map(f => f.name),
      choices: def.fields.reduce<Record<string, string[]>>((all, f) => {
        if (f.choices) all[f.name] = f.choices;
        return all;
      }, {}),
      access: [OWNERS, ...(def.access === 'site' ? [] : [STAFF]), ...(def.team ? [TEAM] : [])]
    };
    state[def.key] = s;
  }
  state.team = { exists: true, id: TEAM.principalId };
  return state;
}

export function empty(): ToolState {
  const state = {} as ToolState;
  TOOL_LISTS.forEach(def => { state[def.key] = { exists: false }; });
  state.team = { exists: false };
  return state;
}

export const change = (state: ToolState, key: ListKey, patch: Partial<IListState>): ToolState =>
  ({ ...state, [key]: { ...state[key], ...patch } });
