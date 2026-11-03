/*
 * Words for the checklist's tasks: the Tasks page, the form for adding or
 * changing one, and what stops that form saving.
 */
import { TASKS } from './common';
import { countText } from './plural';

// The Tasks page, for the Onboarding Team and site owners.
export const TASKS_PAGE = {
  title: 'Tasks',
  intro: 'What every new starter works through, by section. Changes show on every checklist straight away.',
  add: 'Add a task',
  // When there aren't any tasks yet.
  emptyTitle: 'No tasks yet',
  emptyBody: 'Start from a set of common ones and change them to suit, or add your own one at a time.',
  addSamples: 'Add a starter set of tasks',
  addingSamples: 'Adding tasks…',
  samplesAdded: (n: number, jobs: number): string => `${countText(n, TASKS)} added. Change any of them to suit.` +
    (jobs ? ` The jobs before they start are yours for now: open each one and change "Done by" to the right ` +
      'people, like someone in IT or HR.' : ''),
  // Under each part of the month, like "4 tasks".
  count: (n: number): string => countText(n, TASKS),
  // The heading over tasks that aren't in any section.
  noSection: 'No section',
  inactive: 'Off',
  inactiveHint: 'Not on anyone\'s checklist',
  hasLink: 'Has a link',
  // Beside a task someone else does, like "Done by Lee Gu".
  ownedBy: (people: string): string => `Done by ${people}`,
  editLabel: (task: string): string => `Change ${task}`,
  loadFailed: 'The tasks could not load.'
};

// The form for adding or changing a task.
export const TASK_FORM = {
  addTitle: 'Add a task',
  editTitle: 'Change a task',
  name: 'Task',
  nameHint: 'What to do, starting with a verb, like "Read the staff handbook". Write {{onboardee}} for the new ' +
    'starter\'s name, like "Order a laptop for {{onboardee}}".',
  owners: 'Done by',
  ownersHint: 'Leave empty for the new starter to do it themselves. Pick people, like someone in IT, to make it ' +
    'their job for every new starter. They see it on their own My tasks page, and the new starter doesn\'t see it.',
  details: 'Details',
  detailsHint: 'Anything that helps: where to go, who to ask, how long it takes.',
  section: 'Section',
  noSection: 'No section',
  order: 'Order',
  orderHint: 'Lower numbers come first within the same section.',
  link: 'Link',
  linkHint: 'A web address to open, if there is one, starting with https://',
  active: 'On the checklist',
  activeHint: 'Turn off to take it off every checklist without losing who has done it.',
  added: (task: string): string => `${task} added.`,
  saved: (task: string): string => `${task} saved.`,
  deleted: (task: string): string => `${task} deleted.`,
  saveFailed: (reason: string): string => `The task couldn't be saved. ${reason}`,
  deleteFailed: (reason: string): string => `The task couldn't be deleted. ${reason}`,
  // The question before deleting.
  confirmTitle: 'Delete this task?',
  confirmBody: 'It comes off every checklist, and the ticks against it no longer count. To keep the record of who ' +
    'has done it, turn off "On the checklist" instead.',
  confirmDelete: 'Delete it'
};

// Why the task form can't save yet.
export const TASK_CHECKS = {
  nameIt: 'Give the task a name.',
  nameTooLong: 'Keep the task\'s name under 255 characters. Put the rest in Details.',
  orderNumber: 'Order needs to be a whole number, like 1 or 10.',
  linkAddress: 'The link needs to be a full web address, starting with https://',
  linkTooLong: 'The link is too long. SharePoint keeps links up to 255 characters.'
};
