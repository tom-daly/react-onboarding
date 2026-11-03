/*
 * Words for the Sections & columns page, where the Onboarding Team sets up the
 * parts of the checklist and the columns on every new starter's board, and
 * the forms for adding or changing one.
 */
import { TASKS } from './common';
import { countText } from './plural';

export const BOARD_SETUP = {
  title: 'Sections & columns',
  intro: 'How every new starter\'s checklist is laid out. Changes show on every board straight away.',

  sectionsTitle: 'Sections',
  sectionsIntro: 'The parts of the checklist, like First day. Each task goes in one, and its colour shows on the card.',
  addSection: 'Add a section',
  noSections: 'No sections yet. Tasks show without one until you add some.',
  // How a section's due date reads in the list.
  dueOnDay: 'Due on their first day',
  dueAfter: (days: number): string => `Due ${days === 1 ? '1 day' : `${days} days`} after their first day`,
  dueBefore: (days: number): string => `Due ${days === 1 ? '1 day' : `${days} days`} before their first day`,
  noDue: 'No due date',
  // Beside each section, like "4 tasks".
  taskCount: (n: number): string => countText(n, TASKS),

  columnsTitle: 'Board columns',
  columnsIntro: 'The columns on every new starter\'s board, left to right. Tasks start in the first column. ' +
    'Tasks in a column that counts as finished count as done.',
  addColumn: 'Add a column',
  noColumns: 'No columns yet. Add at least two so new starters can move their tasks along.',
  startsHere: 'Tasks start here',
  finishedTag: 'Counts as finished',
  // When nothing past the first column counts as finished.
  noFinishLine: 'No column counts as finished yet, so nobody\'s progress bar will fill. Change a column to ' +
    'count as finished.',

  moveUp: (name: string): string => `Move ${name} up`,
  moveDown: (name: string): string => `Move ${name} down`,
  moveLeft: (name: string): string => `Move ${name} left`,
  moveRight: (name: string): string => `Move ${name} right`,
  edit: (name: string): string => `Change ${name}`,
  moveFailed: (reason: string): string => `That couldn't be moved. ${reason}`
};

// The form for adding or changing a section.
export const SECTION_FORM = {
  addTitle: 'Add a section',
  editTitle: 'Change a section',
  name: 'Name',
  nameHint: 'Like "First day" or "Before they start".',
  days: 'Due (days)',
  daysHint: 'How many days from their first day its tasks are due. 0 is the first day itself. Leave empty for ' +
    'no due date.',
  before: 'Before they start',
  beforeHint: 'Count the days back from their first day, so 7 is a week before they start. Good for jobs like ' +
    'ordering a laptop.',
  colour: 'Colour',
  added: (name: string): string => `${name} added.`,
  saved: (name: string): string => `${name} saved.`,
  deleted: (name: string): string => `${name} deleted.`,
  saveFailed: (reason: string): string => `The section couldn't be saved. ${reason}`,
  deleteFailed: (reason: string): string => `The section couldn't be deleted. ${reason}`,
  confirmTitle: 'Delete this section?',
  confirmBody: (tasks: number): string => (tasks
    ? `Its ${countText(tasks, TASKS)} stay on the checklist without a section until you move them to another one.`
    : 'No tasks are in it.'),
  confirmDelete: 'Delete it'
};

// The colours a section can have, as people see them. Keyed by what's saved.
export const COLOUR_NAMES: Record<string, string> = {
  Teal: 'Teal',
  Purple: 'Purple',
  Blue: 'Blue',
  Orange: 'Orange',
  Pink: 'Pink',
  Green: 'Green',
  Grey: 'Grey'
};

// The form for adding or changing a board column.
export const COLUMN_FORM = {
  addTitle: 'Add a column',
  editTitle: 'Change a column',
  name: 'Name',
  nameHint: 'Like "Waiting on IT" or "Done".',
  finished: 'Counts as finished',
  finishedHint: 'Tasks in this column count as done, and are never late.',
  // The first column, which can't count as finished.
  firstCantFinish: 'This is the first column, where tasks start, so it can\'t count as finished. Move it along ' +
    'first if it should.',
  added: (name: string): string => `${name} added.`,
  saved: (name: string): string => `${name} saved.`,
  deleted: (name: string): string => `${name} deleted.`,
  saveFailed: (reason: string): string => `The column couldn't be saved. ${reason}`,
  deleteFailed: (reason: string): string => `The column couldn't be deleted. ${reason}`,
  // Each board needs somewhere to start and somewhere to move to.
  keepTwo: 'A board needs at least two columns, so this one can\'t be deleted.',
  confirmTitle: 'Delete this column?',
  confirmMove: (tasks: number, to: string): string => (tasks
    ? `${countText(tasks, TASKS)} on new starters' boards ${tasks === 1 ? 'is' : 'are'} in it. They move to ${to}.`
    : 'No tasks are in it on anyone\'s board.'),
  confirmDelete: 'Delete it'
};

// Why a section or column form can't save yet.
export const SETUP_CHECKS = {
  nameSection: 'Give the section a name.',
  nameColumn: 'Give the column a name.',
  nameTooLong: 'Keep the name under 255 characters.',
  sectionTaken: (name: string): string => `There's already a section called ${name}.`,
  columnTaken: (name: string): string => `There's already a column called ${name}.`,
  daysNumber: 'Due needs to be a whole number of days, like 0 or 7, or left empty.',
  daysTooMany: (most: number): string => `Due can be at most ${most} days away.`
};
