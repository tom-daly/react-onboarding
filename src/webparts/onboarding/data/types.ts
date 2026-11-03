/*
 * The checklist's data as the page uses it, read out of the lists' rows.
 */

/** A part of the checklist, like First day, and when its tasks are due. */
export interface ISection {
  id: number;
  name: string;
  /** Days from the first day it's due: 0 is the first day itself. Undefined for no due date. */
  days?: number;
  /** The days count back from the first day, so 7 is a week before they start. */
  before: boolean;
  /** One of SECTION_COLOURS, or anything typed in by hand. */
  colour: string;
  /** Lower comes first. */
  order: number;
}

/** A column on every new starter's board. Tasks start in the first one. */
export interface IBoardColumn {
  id: number;
  name: string;
  /** Lower sits further left. */
  order: number;
  /** Tasks here count as done. Never true of the first column, where tasks start. */
  finished: boolean;
}

/**
 * One thing done for every new starter: by the new starter themselves, or,
 * when it has owners, by them, like IT ordering a laptop.
 */
export interface ITask {
  id: number;
  title: string;
  details: string;
  /** Its section, by ID. Undefined when it hasn't got one. */
  sectionId?: number;
  /** Lower comes first within the same section. */
  order: number;
  /** A web address to open, or empty. */
  link: string;
  /** Off takes it off every checklist without deleting it. */
  active: boolean;
  /**
   * Who does it for each new starter. Empty: the new starter does it
   * themselves. Owned tasks never show on the new starter's own board.
   */
  owners: IPersonRef[];
}

/** Someone on the site, as a person column holds them. */
export interface IPersonRef {
  /** Their ID on this site. */
  id: number;
  name: string;
  email: string;
}

/** Someone starting, and the row that says so. */
export interface IStarter {
  id: number;
  /** The row's Name: the person's name when they were added. */
  name: string;
  /** Undefined if the person has been taken out of the row by hand. */
  person?: IPersonRef;
  manager?: IPersonRef;
  /** Their first day, like 2026-10-15. Empty if it hasn't been filled in. */
  startDate: string;
  archived: boolean;
}

/**
 * A task a new starter has moved out of the first column. One still in the
 * first column has no tick at all.
 */
export interface ITick {
  id: number;
  starterId: number;
  taskId: number;
  /** Who moved it, by their ID on this site. Only they and the Onboarding Team can move it again. */
  byId: number;
  /** The board column it's in, by ID. Undefined for a tick from before the board had columns, which counts as finished. */
  columnId?: number;
  /** Where it was dropped within its column: lower is higher up. Undefined keeps it in checklist order. */
  rank?: number;
}

/** Everything the page shows, loaded together. */
export interface IBoard {
  sections: ISection[];
  columns: IBoardColumn[];
  tasks: ITask[];
  starters: IStarter[];
  ticks: ITick[];
}
