/*
 * One new starter's checklist: the active tasks by section, when each section
 * is due, which board column each task sits in, what is done and what is
 * late. Plain logic, nothing that talks to the site, so it can be tested on
 * its own.
 */
import type { IBoard, IBoardColumn, ISection, IStarter, ITask, ITick } from './types';
import { fromIsoDate, isoDate } from './dates';

export interface IChecklistItem {
  task: ITask;
  /** Its section, when it has one that's still there. */
  section?: ISection;
  /** Its tick, once it has been moved out of the first column. */
  tick?: ITick;
  /** The board column it sits in. Undefined only when the board has no columns. */
  column?: IBoardColumn;
  /** The day its section is due, like 2026-10-15, when there is one. */
  due?: string;
  done: boolean;
  overdue: boolean;
  /**
   * Its place in its column: lower is higher up. Where it was dropped, or
   * else its place in the checklist, so cards never dropped keep checklist order.
   */
  rank: number;
}

export interface IChecklistGroup {
  /** Undefined for tasks with no section. */
  section?: ISection;
  /** The day it is all due, like 2026-10-15. Undefined without a start date, or for a section with no due date. */
  due?: string;
  items: IChecklistItem[];
}

export interface IProgress {
  done: number;
  total: number;
  /** Tasks not done whose day has passed, wherever they sit. */
  overdue: number;
}

export interface IChecklist extends IProgress {
  groups: IChecklistGroup[];
}

/** The day, a number of days on, like 2026-10-15. */
export function addDays(day: string, days: number): string | undefined {
  const d = fromIsoDate(day);
  if (!d) return undefined;
  return isoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/**
 * When a section's tasks are due: the section's days after the first day, or
 * before it for a section before they start. Undefined without a real start
 * date, or for a section with no due date.
 */
export function dueDay(startDate: string, section: ISection | undefined): string | undefined {
  if (!section || section.days === undefined) return undefined;
  return addDays(startDate, section.before ? -section.days : section.days);
}

/** The new starter does it themselves: nobody else owns it. */
export const isStartersOwn = (task: ITask): boolean => task.owners.length === 0;

/** The person is one of the task's owners. */
export const ownsTask = (task: ITask, userId: number): boolean => task.owners.some(o => o.id === userId);

/**
 * Which tasks a board shows: only what the new starter does themselves, for
 * their own board, or everything done for them, for those following along.
 */
export type Whose = 'own' | 'all';

/* Days written like 2026-10-15 sort the same as text and as dates. */
const isPast = (day: string | undefined, today: string): boolean => !!day && day < today;

/** Sections or columns in their order, then by name, then by when they were made. */
export function inOrder<T extends { id: number; name: string; order: number }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name) || a.id - b.id);
}

/** Tasks grouped by section, sections in order, then any with no section. Every group has at least one. */
export function groupBySection(tasks: ITask[], sections: ISection[]): { section?: ISection; tasks: ITask[] }[] {
  const sorted = inOrder(sections);
  const known = (t: ITask): ISection | undefined => sorted.filter(s => s.id === t.sectionId)[0];
  const byOrder = (a: ITask, b: ITask): number => a.order - b.order || a.title.localeCompare(b.title);
  const groups: { section?: ISection; tasks: ITask[] }[] = sorted
    .map(section => ({ section, tasks: tasks.filter(t => t.sectionId === section.id).sort(byOrder) }));
  groups.push({ section: undefined, tasks: tasks.filter(t => !known(t)).sort(byOrder) });
  return groups.filter(g => g.tasks.length > 0);
}

/** Whether a column counts as finished. The first one, where tasks start, never does. */
export const isFinished = (column: IBoardColumn | undefined, columns: IBoardColumn[]): boolean =>
  !!column && column.finished && inOrder(columns)[0] !== column;

/**
 * The column a task sits in. With no tick it's the first. A tick from before
 * the board had columns, or whose column has been taken away, counts as
 * finished: it goes in the first finished column, or the last if none is.
 */
export function columnOf(tick: ITick | undefined, columns: IBoardColumn[]): IBoardColumn | undefined {
  const sorted = inOrder(columns);
  if (!tick) return sorted[0];
  const own = sorted.filter(c => c.id === tick.columnId)[0];
  if (own) return own;
  return sorted.filter(c => isFinished(c, sorted))[0] || sorted[sorted.length - 1];
}

/**
 * The new starter's checklist as it stands today. Only active tasks are on it:
 * every one for `all`, or only their own for `own`.
 */
export function checklistFor(starter: IStarter, board: IBoard, today: string, whose: Whose = 'all'): IChecklist {
  const mine = board.ticks.filter(t => t.starterId === starter.id);
  let done = 0;
  let total = 0;
  let overdue = 0;
  let place = 0;
  const shown = board.tasks.filter(t => t.active && (whose === 'all' || isStartersOwn(t)));
  const groups = groupBySection(shown, board.sections).map((g): IChecklistGroup => {
    const due = dueDay(starter.startDate, g.section);
    const items = g.tasks.map((task): IChecklistItem => {
      // The newest row for a task says where it is.
      const tick = mine.filter(t => t.taskId === task.id).sort((a, b) => b.id - a.id)[0];
      const column = columnOf(tick, board.columns);
      const finished = isFinished(column, board.columns);
      const late = !finished && isPast(due, today);
      total++;
      if (finished) done++;
      if (late) overdue++;
      const rank = tick && tick.rank !== undefined ? tick.rank : place;
      place++;
      return { task, section: g.section, tick, column, due, done: finished, overdue: late, rank };
    });
    return { section: g.section, due, items };
  });
  return { groups, done, total, overdue };
}

/** The board's columns, left to right, each with its cards in place order (checklist order breaks a tie). */
export function columnsFor(list: IChecklist, columns: IBoardColumn[]): { column: IBoardColumn; items: IChecklistItem[] }[] {
  return lanesFor(list.groups.reduce<IChecklistItem[]>((out, g) => out.concat(g.items), []), columns);
}

/** Cards sorted into the board's columns, left to right, in place order (the order given breaks a tie). */
export function lanesFor<T extends IChecklistItem>(all: T[], columns: IBoardColumn[]): { column: IBoardColumn; items: T[] }[] {
  return inOrder(columns).map(column => ({
    column,
    items: all.map((item, at) => ({ item, at }))
      .filter(x => x.item.column === column)
      .sort((a, b) => a.item.rank - b.item.rank || a.at - b.at)
      .map(x => x.item)
  }));
}

/**
 * The place for a card dropped into a column so it lands at `index` among the
 * cards already there (not counting itself): halfway between its new
 * neighbours, or one past the end it's dropped at.
 */
export function rankAt(others: IChecklistItem[], index: number): number {
  const before = others[index - 1];
  const after = others[index];
  if (before && after) return (before.rank + after.rank) / 2;
  if (after) return after.rank - 1;
  if (before) return before.rank + 1;
  return 0;
}

/** How far along a new starter is. */
export function progressFor(starter: IStarter, board: IBoard, today: string): IProgress {
  const { done, total, overdue } = checklistFor(starter, board, today);
  return { done, total, overdue };
}

/** Done as a fraction from 0 to 1, for a progress bar. */
export const fractionDone = (p: IProgress): number => (p.total ? p.done / p.total : 0);

/** Where a new starter is: not started yet, part way, or all done. */
export type Stage = 'upcoming' | 'started' | 'finished';

export function stageOf(starter: IStarter, p: IProgress, today: string): Stage {
  if (p.total > 0 && p.done >= p.total) return 'finished';
  // Without a real start date there's no telling, so they count as started.
  const start = fromIsoDate(starter.startDate) ? starter.startDate.trim() : '';
  return start && today < start ? 'upcoming' : 'started';
}

/** One of someone's jobs: a task they own, for one new starter. */
export interface IJob extends IChecklistItem {
  starter: IStarter;
}

/**
 * Everything someone owns, for every new starter still being onboarded: soonest
 * due first, then by who starts first. Jobs with no due day come last.
 */
export function jobsFor(userId: number, board: IBoard, starters: IStarter[], today: string): IJob[] {
  const jobs: IJob[] = [];
  starters.forEach(starter => {
    checklistFor(starter, board, today).groups.forEach(g => g.items.forEach(item => {
      if (ownsTask(item.task, userId)) jobs.push({ ...item, starter });
    }));
  });
  const keyOf = (j: IJob): string => j.due || '9999';
  return jobs
    .map((job, at) => ({ job, at }))
    .sort((a, b) => keyOf(a.job).localeCompare(keyOf(b.job)) || a.at - b.at)
    .map(({ job }, place) => ({ ...job, rank: job.tick && job.tick.rank !== undefined ? job.tick.rank : place }));
}

/** How far along a list of jobs is. */
export function progressOf(items: IChecklistItem[]): IProgress {
  return {
    done: items.filter(i => i.done).length,
    total: items.length,
    overdue: items.filter(i => i.overdue).length
  };
}
