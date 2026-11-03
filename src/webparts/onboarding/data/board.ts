import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { IBoard, IBoardColumn, ISection, IStarter, ITask, ITick } from './types';
import type { ITaskDraft } from './taskForm';
import type { IStarterDraft, IPersonPick } from './starterForm';
import {
  COLUMN_FIELDS, Row, SECTION_FIELDS, STARTER_FIELDS, STARTER_PEOPLE, TASK_FIELDS, TASK_PEOPLE, TICK_FIELDS,
  columnFromRow, sectionFromRow, starterFromRow, taskFromRow, tickFromRow
} from './rows';
import { rowFromDraft } from './taskForm';
import { IColumnDraft, IOrderChange, ISectionDraft, columnRow, sectionRow } from './setupForms';
import { listOf } from './lists';
import { explain } from '../setup/errors';
import { TOOL_DATA } from '../strings/data';

/*
 * Reading and writing the lists. Each list is read whole: the sections,
 * columns, checklist, everyone being onboarded and every tick fit easily in
 * one go.
 */

/* The most ticks read at once. The newest come first, so an old list that
   outgrows it drops the ticks of people onboarded long ago. */
const MOST_TICKS = 5000;

export async function loadBoard(sp: SPFI, ids: ListIds): Promise<IBoard> {
  const [sections, columns, tasks, starters, ticks] = await Promise.all([
    listOf(sp, ids, 'sections').items.select(...SECTION_FIELDS).top(5000)(),
    listOf(sp, ids, 'columns').items.select(...COLUMN_FIELDS).top(5000)(),
    listOf(sp, ids, 'tasks').items.select(...TASK_FIELDS).expand(...TASK_PEOPLE).top(5000)(),
    listOf(sp, ids, 'starters').items.select(...STARTER_FIELDS).expand(...STARTER_PEOPLE).top(5000)(),
    listOf(sp, ids, 'progress').items.select(...TICK_FIELDS).orderBy('Id', false).top(MOST_TICKS)()
  ]);
  return {
    sections: (sections as Row[]).map(sectionFromRow),
    columns: (columns as Row[]).map(columnFromRow),
    tasks: (tasks as Row[]).map(taskFromRow),
    starters: (starters as Row[]).map(starterFromRow),
    ticks: (ticks as Row[]).map(tickFromRow).filter((t): t is ITick => !!t)
  };
}

/* ------------------------------------------------------------------ ticks */

/**
 * Puts a task in a column for a new starter, at a place in it when `rank` is
 * given. The row keeps the task's name as it is now.
 */
export async function addTick(
  sp: SPFI, ids: ListIds, starter: Pick<IStarter, 'id'>, task: ITask, byId: number, columnId: number, rank?: number
): Promise<ITick> {
  const added = await listOf(sp, ids, 'progress').items.add({
    Title: task.title.slice(0, 255),
    ProgressStarterId: starter.id,
    ProgressTaskId: task.id,
    ProgressColumnId: columnId,
    ...(rank === undefined ? {} : { ProgressRank: rank })
  });
  const id: number = added.Id ?? added.ID;
  return { id, starterId: starter.id, taskId: task.id, byId, columnId, rank };
}

/** Moves a task that already has a row to another column, or another place in one when `rank` is given. */
export async function setTickColumn(
  sp: SPFI, ids: ListIds, tickId: number, columnId: number, rank?: number
): Promise<void> {
  await listOf(sp, ids, 'progress').items.getById(tickId)
    .update({ ProgressColumnId: columnId, ...(rank === undefined ? {} : { ProgressRank: rank }) });
}

export async function removeTick(sp: SPFI, ids: ListIds, tickId: number): Promise<void> {
  await listOf(sp, ids, 'progress').items.getById(tickId).delete();
}

/* ------------------------------------------------------------------ tasks */

/** Saves a task that passed checkTask. Returns its row's ID. */
export async function saveTask(sp: SPFI, ids: ListIds, draft: ITaskDraft): Promise<number> {
  const list = listOf(sp, ids, 'tasks');
  const ownerIds = await Promise.all(draft.owners.map(o => siteUserId(sp, o)));
  const row = rowFromDraft(draft, ownerIds.filter((id): id is number => id !== undefined));
  if (draft.id !== undefined) {
    await list.items.getById(draft.id).update(row);
    return draft.id;
  }
  const added = await list.items.add(row);
  return added.Id ?? added.ID;
}

export async function deleteTask(sp: SPFI, ids: ListIds, taskId: number): Promise<void> {
  await listOf(sp, ids, 'tasks').items.getById(taskId).delete();
}

/** Adds each task in turn. Stops at the first that won't go in, saying how many did. */
export async function addTasks(sp: SPFI, ids: ListIds, drafts: ITaskDraft[]): Promise<void> {
  for (let i = 0; i < drafts.length; i++) {
    try {
      await saveTask(sp, ids, drafts[i]);
    } catch (e) {
      throw new Error(TOOL_DATA.someTasksAdded(i, drafts.length, explain(e)));
    }
  }
}

/* ------------------------------------------------- sections and columns */

/** Saves a section that passed checkSection. */
export async function saveSection(sp: SPFI, ids: ListIds, draft: ISectionDraft): Promise<void> {
  const list = listOf(sp, ids, 'sections');
  if (draft.id !== undefined) await list.items.getById(draft.id).update(sectionRow(draft));
  else await list.items.add(sectionRow(draft));
}

/** Takes a section away. Its tasks stay, with no section. */
export async function deleteSection(sp: SPFI, ids: ListIds, section: ISection): Promise<void> {
  await listOf(sp, ids, 'sections').items.getById(section.id).delete();
}

/** Saves a column that passed checkColumn. */
export async function saveColumn(sp: SPFI, ids: ListIds, draft: IColumnDraft): Promise<void> {
  const list = listOf(sp, ids, 'columns');
  if (draft.id !== undefined) await list.items.getById(draft.id).update(columnRow(draft));
  else await list.items.add(columnRow(draft));
}

/**
 * Takes a column away. The tasks in it move to `moveTo` first, or back to the
 * first column when `moveTo` is undefined, so they don't end up nowhere.
 */
export async function deleteColumn(
  sp: SPFI, ids: ListIds, column: IBoardColumn, ticks: ITick[], moveTo: IBoardColumn | undefined
): Promise<void> {
  for (const t of ticks.filter(x => x.columnId === column.id)) {
    if (moveTo) await setTickColumn(sp, ids, t.id, moveTo.id);
    else await removeTick(sp, ids, t.id);
  }
  await listOf(sp, ids, 'columns').items.getById(column.id).delete();
}

/** Saves new order numbers for sections or columns after one moves. */
export async function saveOrders(
  sp: SPFI, ids: ListIds, key: 'sections' | 'columns', changes: IOrderChange[]
): Promise<void> {
  const list = listOf(sp, ids, key);
  const field = key === 'sections' ? 'SectionOrder' : 'ColumnOrder';
  for (const c of changes) await list.items.getById(c.id).update({ [field]: c.order });
}

/* --------------------------------------------------------------- starters */

/* The person's ID on this site, adding them to the site's people if they've never been to it. */
async function siteUserId(sp: SPFI, pick: IPersonPick | undefined): Promise<number | undefined> {
  if (!pick) return undefined;
  if (pick.id !== undefined) return pick.id;
  if (!pick.login) throw new Error(TOOL_DATA.whoIsThis(pick.name));
  const user = await sp.web.ensureUser(pick.login);
  return user.Id;
}

/** Saves a new starter that passed checkStarter. Returns their row's ID. */
export async function saveStarter(sp: SPFI, ids: ListIds, draft: IStarterDraft): Promise<number> {
  const list = listOf(sp, ids, 'starters');
  const [personId, managerId] = await Promise.all([siteUserId(sp, draft.person), siteUserId(sp, draft.manager)]);
  const row = {
    Title: draft.person ? draft.person.name.slice(0, 255) : '',
    StarterPersonId: personId ?? null,
    StarterManagerId: managerId ?? null,
    StartDate: draft.startDate.trim(),
    StarterArchived: draft.archived
  };
  if (draft.id !== undefined) {
    await list.items.getById(draft.id).update(row);
    return draft.id;
  }
  const added = await list.items.add(row);
  return added.Id ?? added.ID;
}

/** Takes a new starter off the onboarding page, or puts them back. Their ticks stay. */
export async function setArchived(sp: SPFI, ids: ListIds, starterId: number, archived: boolean): Promise<void> {
  await listOf(sp, ids, 'starters').items.getById(starterId).update({ StarterArchived: archived });
}
