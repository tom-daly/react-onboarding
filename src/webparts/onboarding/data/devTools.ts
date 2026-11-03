/*
 * Developer tools, only offered while the web part runs from a developer's
 * own machine: empty every list, put the starting data back, and make a
 * sample new starter with tasks spread across the board.
 */
import type { SPFI } from '../sp';
import type { ListIds, ListKey } from '../setup/schema';
import { listDef } from '../setup/schema';
import type { IBoard, IBoardColumn, ITask } from './types';
import type { IStarterDraft } from './starterForm';
import { listOf } from './lists';
import { addTasks, addTick, saveStarter } from './board';
import { groupBySection, inOrder } from './checklist';
import { sampleDrafts } from './samples';

export type OnProgress = (done: number, total: number) => void;

/* Ticks first, then what they point at, so nothing is left pointing at a row that's gone. */
const CLEAR_ORDER: ListKey[] = ['progress', 'starters', 'tasks', 'columns', 'sections'];

/** Sends every row of every onboarding list to the site's recycle bin. The lists themselves stay. */
export async function clearAll(sp: SPFI, ids: ListIds, onProgress: OnProgress): Promise<number> {
  const rows: { key: ListKey; id: number }[] = [];
  for (const key of CLEAR_ORDER) {
    const found = await listOf(sp, ids, key).items.select('Id').top(5000)();
    found.forEach(r => rows.push({ key, id: r.Id }));
  }
  onProgress(0, rows.length);
  for (let i = 0; i < rows.length; i++) {
    await listOf(sp, ids, rows[i].key).items.getById(rows[i].id).recycle();
    onProgress(i + 1, rows.length);
  }
  return rows.length;
}

/** What `fillStarting` put in. */
export interface IFilled {
  sections: number;
  columns: number;
  tasks: number;
}

/**
 * Puts the starting sections, columns and sample tasks into any of those
 * lists that is empty. Lists with something in them are left alone.
 */
export async function fillStarting(sp: SPFI, ids: ListIds, board: IBoard, youId: number): Promise<IFilled> {
  const filled: IFilled = { sections: 0, columns: 0, tasks: 0 };
  let sections = board.sections;
  if (!sections.length) {
    const list = listOf(sp, ids, 'sections');
    for (const row of listDef('sections').starterRows || []) await list.items.add(row);
    const got = await list.items.select('Id', 'Title').top(5000)();
    sections = got.map(r => ({ id: r.Id as number, name: String(r.Title || ''), before: false, colour: '', order: 0 }));
    filled.sections = sections.length;
  }
  if (!board.columns.length) {
    const list = listOf(sp, ids, 'columns');
    const rows = listDef('columns').starterRows || [];
    for (const row of rows) await list.items.add(row);
    filled.columns = rows.length;
  }
  if (!board.tasks.length) {
    const drafts = sampleDrafts(sections, { id: youId, name: '', email: '' });
    await addTasks(sp, ids, drafts);
    filled.tasks = drafts.length;
  }
  return filled;
}

/**
 * Where each task goes on a sample new starter's board: the earliest tasks
 * furthest along, the latest still in the first column, the rest spread
 * across the columns in between. Plain logic, for testing.
 */
export function spreadAcross(tasks: ITask[], columns: IBoardColumn[]): { task: ITask; column: IBoardColumn }[] {
  const cols = inOrder(columns);
  const n = tasks.length;
  if (!cols.length || !n) return [];
  return tasks.map((task, i) => ({ task, column: cols[cols.length - 1 - Math.floor((i * cols.length) / n)] }));
}

/**
 * Adds a new starter from a form that passed checkStarter, then moves their
 * tasks along the board so it has something in every column. Returns how many
 * tasks were moved.
 */
export async function makeSampleStarter(
  sp: SPFI, ids: ListIds, board: IBoard, draft: IStarterDraft, byId: number
): Promise<number> {
  const id = await saveStarter(sp, ids, draft);
  const starter = { id, name: draft.person ? draft.person.name : '', startDate: draft.startDate, archived: false };
  const first = inOrder(board.columns)[0];
  const tasks = groupBySection(board.tasks.filter(t => t.active), board.sections)
    .reduce<ITask[]>((all, g) => all.concat(g.tasks), []);
  let moved = 0;
  for (const { task, column } of spreadAcross(tasks, board.columns)) {
    if (column === first) continue;
    await addTick(sp, ids, starter, task, byId, column.id);
    moved++;
  }
  return moved;
}
