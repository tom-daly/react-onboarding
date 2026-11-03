/*
 * Words for the developer tools behind the gear, which only show while the
 * web part runs from a developer's own machine.
 */
import { TASKS } from './common';
import { countText } from './plural';

export const DEV_TOOLS = {
  gear: 'Developer tools',
  title: 'Developer tools',
  intro: 'Only here because this page is running from your local dev server. Nobody else sees this.',

  fillTitle: 'Fill in the starting data',
  fillBody: 'Adds the starting sections, board columns and sample tasks to whichever of those lists are empty. ' +
    'Lists with something in them are left alone.',
  fill: 'Fill in',
  filling: 'Filling in…',
  filled: (sections: number, columns: number, tasks: number): string =>
    sections + columns + tasks === 0
      ? 'Nothing needed filling in: sections, columns and tasks all have something in them.'
      : `Added ${sections} sections, ${columns} columns and ${tasks} tasks.`,

  sampleTitle: 'Make a sample new starter',
  sampleBody: 'Adds them to New starters, then moves their tasks along the board so every column has something in it.',
  person: 'New starter',
  manager: 'Manager',
  firstDay: 'First day',
  firstDayHint: 'Written like 2026-11-02.',
  make: 'Make them',
  making: 'Making them…',
  made: (name: string, moved: number): string => `${name} added, with ${countText(moved, TASKS)} moved along their board.`,
  needsSetup: 'Fill in the starting data first, so there are columns and tasks to spread across.',

  clearTitle: 'Clear every list',
  clearBody: 'Sends every section, column, task, new starter and tick on this site to the recycle bin. The lists ' +
    'themselves stay.',
  clear: 'Clear every list',
  clearing: (done: number, total: number): string => `Clearing… ${done} of ${total}`,
  cleared: (n: number): string => (n === 0 ? 'The lists were already empty.' : `${n} rows sent to the recycle bin.`),
  confirmTitle: 'Clear every list?',
  confirmBody: 'Every section, column, task, new starter and tick on this site goes to the recycle bin. You can ' +
    'get them back from there, one by one.',
  confirm: 'Clear them',

  failed: (reason: string): string => `That didn't work. ${reason}`
};
