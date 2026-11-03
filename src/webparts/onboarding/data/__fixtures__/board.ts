import type { IBoard, IBoardColumn, ISection, IStarter, ITask, ITick } from '../types';

/* The three sections a new site starts with. */
export const DAY: ISection = { id: 1, name: 'First day', days: 0, before: false, colour: 'Teal', order: 1 };
export const WEEK: ISection = { id: 2, name: 'First week', days: 7, before: false, colour: 'Purple', order: 2 };
export const MONTH: ISection = { id: 3, name: 'First month', days: 30, before: false, colour: 'Blue', order: 3 };
export const SECTIONS = [DAY, WEEK, MONTH];

/* The three columns a new site starts with. */
export const TODO: IBoardColumn = { id: 51, name: 'To do', order: 1, finished: false };
export const DOING: IBoardColumn = { id: 52, name: 'Doing', order: 2, finished: false };
export const DONE: IBoardColumn = { id: 53, name: 'Done', order: 3, finished: true };
export const COLUMNS = [TODO, DOING, DONE];

/* A small checklist: two tasks on the first day, one in the first week, one in the first month, one switched off. */
export const TASKS: ITask[] = [
  { id: 1, title: 'Collect your laptop', details: '', sectionId: 1, order: 1, link: '', active: true, owners: [] },
  { id: 2, title: 'Meet your manager', details: '', sectionId: 1, order: 2, link: '', active: true, owners: [] },
  { id: 3, title: 'Read the handbook', details: '', sectionId: 2, order: 1, link: '', active: true, owners: [] },
  { id: 4, title: 'Agree your goals', details: '', sectionId: 3, order: 1, link: '', active: true, owners: [] },
  { id: 5, title: 'Old task', details: '', sectionId: 1, order: 3, link: '', active: false, owners: [] }
];

export const MEGAN = { id: 11, name: 'Megan Bowen', email: 'megan@example.com' };
export const ALEX = { id: 12, name: 'Alex Wilber', email: 'alex@example.com' };
export const LEE = { id: 13, name: 'Lee Gu', email: 'lee@example.com' };

/* Megan starts on 5 October 2026 and Alex is her manager. */
export const megan = (patch: Partial<IStarter> = {}): IStarter =>
  ({ id: 100, name: MEGAN.name, person: MEGAN, manager: ALEX, startDate: '2026-10-05', archived: false, ...patch });

/* Lee starts later, on 2 November 2026, also under Alex. */
export const lee = (patch: Partial<IStarter> = {}): IStarter =>
  ({ id: 101, name: LEE.name, person: LEE, manager: ALEX, startDate: '2026-11-02', archived: false, ...patch });

/* A task moved out of To do: into Done unless another column is given. */
export const tick = (id: number, starterId: number, taskId: number, column: IBoardColumn | undefined = DONE): ITick =>
  ({ id, starterId, taskId, byId: 0, columnId: column ? column.id : undefined });

/* Everything loaded, with these ticks. */
export const board = (ticks: ITick[] = [], patch: Partial<IBoard> = {}): IBoard =>
  ({ sections: SECTIONS, columns: COLUMNS, tasks: TASKS, starters: [megan(), lee()], ticks, ...patch });
