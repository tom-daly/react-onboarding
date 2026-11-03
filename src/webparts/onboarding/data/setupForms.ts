/*
 * Adding or changing a section or a board column: the forms' contents, what
 * stops them saving, and moving one up or down. Plain logic, nothing that
 * talks to the site.
 */
import type { IBoardColumn, ISection } from './types';
import { inOrder } from './checklist';
import { SECTION_COLOURS } from '../setup/schema';
import { SETUP_CHECKS } from '../strings/boardSetup';

export interface ISectionDraft {
  /** Its row. Undefined for a new section. */
  id?: number;
  name: string;
  /** Days from the first day, as typed. Empty for no due date. */
  days: string;
  /** The days count back from the first day. */
  before: boolean;
  colour: string;
  order: number;
}

export interface IColumnDraft {
  /** Its row. Undefined for a new column. */
  id?: number;
  name: string;
  finished: boolean;
  order: number;
}

/** A new order number for a section or column. */
export interface IOrderChange {
  id: number;
  order: number;
}

/* Ten years is far more than any onboarding needs, and stops a typo of 70000. */
const MOST_DAYS = 3650;

const nextOrder = (rows: { order: number }[]): number => rows.reduce((most, r) => Math.max(most, r.order), 0) + 1;

/** A new section at the end, in the first colour no other section has yet. */
export function blankSection(sections: ISection[]): ISectionDraft {
  const used = sections.map(s => s.colour);
  return {
    name: '',
    days: '',
    before: false,
    colour: SECTION_COLOURS.filter(c => used.indexOf(c) < 0)[0] || SECTION_COLOURS[0],
    order: nextOrder(sections)
  };
}

export const draftFromSection = (s: ISection): ISectionDraft => ({
  id: s.id,
  name: s.name,
  days: s.days === undefined ? '' : String(s.days),
  before: s.before,
  colour: s.colour,
  order: s.order
});

/** A new column at the right-hand end. */
export const blankColumn = (columns: IBoardColumn[]): IColumnDraft =>
  ({ name: '', finished: false, order: nextOrder(columns) });

export const draftFromColumn = (c: IBoardColumn): IColumnDraft =>
  ({ id: c.id, name: c.name, finished: c.finished, order: c.order });

const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Why the section form can't save as it is, or undefined if it can. */
export function checkSection(draft: ISectionDraft, sections: ISection[]): string | undefined {
  const name = draft.name.trim();
  if (!name) return SETUP_CHECKS.nameSection;
  if (name.length > 255) return SETUP_CHECKS.nameTooLong;
  if (sections.some(s => s.id !== draft.id && sameName(s.name, name))) return SETUP_CHECKS.sectionTaken(name);
  const days = draft.days.trim();
  if (days && !/^\d+$/.test(days)) return SETUP_CHECKS.daysNumber;
  if (days && Number(days) > MOST_DAYS) return SETUP_CHECKS.daysTooMany(MOST_DAYS);
  return undefined;
}

/** Why the column form can't save as it is, or undefined if it can. */
export function checkColumn(draft: IColumnDraft, columns: IBoardColumn[]): string | undefined {
  const name = draft.name.trim();
  if (!name) return SETUP_CHECKS.nameColumn;
  if (name.length > 255) return SETUP_CHECKS.nameTooLong;
  if (columns.some(c => c.id !== draft.id && sameName(c.name, name))) return SETUP_CHECKS.columnTaken(name);
  return undefined;
}

/** The row to save, from a form that passed checkSection. */
export const sectionRow = (d: ISectionDraft): Record<string, unknown> => ({
  Title: d.name.trim(),
  SectionDays: d.days.trim() ? Number(d.days.trim()) : null,
  SectionBefore: d.before,
  SectionColour: d.colour,
  SectionOrder: d.order
});

/** The row to save, from a form that passed checkColumn. */
export const columnRow = (d: IColumnDraft): Record<string, unknown> => ({
  Title: d.name.trim(),
  ColumnOrder: d.order,
  ColumnFinished: d.finished
});

/**
 * New order numbers after one row moves a place up (-1) or down (+1): all of
 * them numbered 1, 2, 3… in their new order, keeping only those that change.
 * Empty when it's already at that end.
 */
export function moveRow<T extends { id: number; name: string; order: number }>(
  rows: T[], id: number, by: -1 | 1
): IOrderChange[] {
  const sorted = inOrder(rows);
  const at = sorted.map(r => r.id).indexOf(id);
  const to = at + by;
  if (at < 0 || to < 0 || to >= sorted.length) return [];
  const moved = sorted.slice();
  moved.splice(to, 0, moved.splice(at, 1)[0]);
  return moved
    .map((r, i) => ({ id: r.id, order: i + 1, was: r.order }))
    .filter(r => r.order !== r.was)
    .map(({ id: rowId, order }) => ({ id: rowId, order }));
}

/**
 * Where the tasks in a column go when it's taken away: the column to its
 * left, or for the first column the one that takes its place. Undefined means
 * back to the first column, which needs no row at all.
 */
export function whereTasksGo(columns: IBoardColumn[], id: number): IBoardColumn | undefined {
  const sorted = inOrder(columns);
  const at = sorted.map(c => c.id).indexOf(id);
  const rest = sorted.filter(c => c.id !== id);
  const to = at > 0 ? sorted[at - 1] : rest[0];
  return to && to !== rest[0] ? to : undefined;
}

/** True when some column other than the first counts as finished, so the progress bar can fill. */
export const hasFinishLine = (columns: IBoardColumn[]): boolean =>
  inOrder(columns).slice(1).some(c => c.finished);
