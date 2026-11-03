/*
 * The lists' rows, as REST hands them back, turned into what the page uses,
 * and back again for saving. Nothing in here talks to the site.
 */
import type { IBoardColumn, IPersonRef, ISection, IStarter, ITask, ITick } from './types';
import { maybeNum, num, text } from './rowValues';

/* The columns each read asks for, so a row always has what the readers below look at. */
export const SECTION_FIELDS = ['Id', 'Title', 'SectionDays', 'SectionBefore', 'SectionColour', 'SectionOrder'];
export const COLUMN_FIELDS = ['Id', 'Title', 'ColumnOrder', 'ColumnFinished'];
export const TASK_FIELDS = [
  'Id', 'Title', 'TaskDetails', 'TaskSectionId', 'TaskOrder', 'TaskLink', 'TaskActive',
  'TaskOwners/Id', 'TaskOwners/Title', 'TaskOwners/EMail'
];
export const TASK_PEOPLE = ['TaskOwners'];
export const TICK_FIELDS = ['Id', 'ProgressStarterId', 'ProgressTaskId', 'ProgressColumnId', 'ProgressRank', 'AuthorId'];
export const STARTER_FIELDS = [
  'Id', 'Title', 'StartDate', 'StarterArchived',
  'StarterPerson/Id', 'StarterPerson/Title', 'StarterPerson/EMail',
  'StarterManager/Id', 'StarterManager/Title', 'StarterManager/EMail'
];
export const STARTER_PEOPLE = ['StarterPerson', 'StarterManager'];

export type Row = Record<string, unknown>;

/* A yes/no column: only a real yes counts, and an empty one takes the column's default. */
const yes = (v: unknown, byDefault: boolean): boolean => (typeof v === 'boolean' ? v : byDefault);

export const sectionFromRow = (r: Row): ISection => ({
  id: num(r.Id),
  name: text(r.Title),
  days: maybeNum(r.SectionDays),
  before: yes(r.SectionBefore, false),
  colour: text(r.SectionColour),
  order: num(r.SectionOrder)
});

export const columnFromRow = (r: Row): IBoardColumn => ({
  id: num(r.Id),
  name: text(r.Title),
  order: num(r.ColumnOrder),
  finished: yes(r.ColumnFinished, false)
});

export const taskFromRow = (r: Row): ITask => ({
  id: num(r.Id),
  title: text(r.Title),
  details: text(r.TaskDetails),
  sectionId: maybeNum(r.TaskSectionId),
  order: num(r.TaskOrder),
  link: text(r.TaskLink),
  active: yes(r.TaskActive, true),
  owners: peopleFrom(r.TaskOwners)
});

/** A person column as REST expands it, or undefined when it's empty. */
export function personFrom(v: unknown): IPersonRef | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const p = v as Row;
  const id = maybeNum(p.Id);
  if (id === undefined) return undefined;
  return { id, name: text(p.Title), email: text(p.EMail) };
}

/** A column of several people as REST expands it: a plain list, or one wrapped in results. Empty when there are none. */
export function peopleFrom(v: unknown): IPersonRef[] {
  const list = Array.isArray(v) ? v
    : v && typeof v === 'object' && Array.isArray((v as Row).results) ? (v as Row).results as unknown[]
    : [];
  return list.map(personFrom).filter((p): p is IPersonRef => !!p);
}

export function starterFromRow(r: Row): IStarter {
  const person = personFrom(r.StarterPerson);
  return {
    id: num(r.Id),
    name: text(r.Title) || (person ? person.name : ''),
    person,
    manager: personFrom(r.StarterManager),
    startDate: text(r.StartDate),
    archived: yes(r.StarterArchived, false)
  };
}

/** A tick, or undefined if its new starter or task has been taken out of it. */
export function tickFromRow(r: Row): ITick | undefined {
  const starterId = maybeNum(r.ProgressStarterId);
  const taskId = maybeNum(r.ProgressTaskId);
  if (starterId === undefined || taskId === undefined) return undefined;
  return {
    id: num(r.Id), starterId, taskId, byId: num(r.AuthorId),
    columnId: maybeNum(r.ProgressColumnId), rank: maybeNum(r.ProgressRank)
  };
}
