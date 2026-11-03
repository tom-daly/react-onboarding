/*
 * Words used on more than one screen. Words used on one screen only live in
 * that screen's own strings file beside this one.
 */
import type { IPlural } from './plural';

export const COMMON = {
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  close: 'Close',
  edit: 'Edit',
  delete: 'Delete',
  deleting: 'Deleting…',
  tryAgain: 'Try again',
  loading: 'Loading…',
  // A column or detail with nothing in it.
  none: '—'
};

// Joining a few things into one phrase: "a, b and c".
export const LIST_WORDS = {
  between: ', ',
  and: (rest: string, last: string): string => `${rest} and ${last}`,
  or: (rest: string, last: string): string => `${rest} or ${last}`
};

export const TASKS: IPlural = { one: 'task', other: 'tasks' };
export const STARTERS: IPlural = { one: 'new starter', other: 'new starters' };
