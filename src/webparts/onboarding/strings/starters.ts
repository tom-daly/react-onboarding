/*
 * Words for the new starters: the list of them, the form for adding or
 * changing one, and what stops that form saving.
 */
import { STARTERS } from './common';
import { countText } from './plural';

// The Starters page, for the Onboarding Team and site owners.
export const STARTERS_PAGE = {
  title: 'New starters',
  intro: 'Everyone being onboarded, soonest start first. Open someone to see their checklist and tick things off ' +
    'for them.',
  add: 'Add a new starter',
  showArchived: 'Show archived',
  none: 'No one is being onboarded right now.',
  noneArchived: 'No one has been archived yet.',
  // Above the table, like "3 new starters".
  count: (n: number): string => countText(n, STARTERS),
  loadFailed: 'The new starters could not load.'
};

// The My team page, for line managers.
export const MY_TEAM_PAGE = {
  title: 'My team',
  intro: 'The new starters you manage, and how far they\'ve got.'
};

// The columns of the table of new starters, on both pages.
export const STARTER_COLUMNS = {
  name: 'Name',
  manager: 'Manager',
  starts: 'Start date',
  progress: 'Progress',
  overdue: 'Late',
  // Read out for the buttons in each row.
  actions: 'Actions',
  open: (name: string): string => `Open ${name}'s checklist`,
  edit: (name: string): string => `Change ${name}`,
  archive: 'Archive',
  archiveLabel: (name: string): string => `Archive ${name}`,
  bringBack: 'Bring back',
  bringBackLabel: (name: string): string => `Bring ${name} back`,
  // In the Late column when nothing is late.
  nothingLate: 'None',
  // Instead of the progress for someone who hasn't started yet, and someone all done.
  upcoming: 'Not started yet',
  finished: 'All done',
  archived: (name: string): string => `${name} is archived.`,
  broughtBack: (name: string): string => `${name} is back on the list.`,
  archiveFailed: (name: string, reason: string): string => `${name} couldn't be changed. ${reason}`
};

// The form for adding or changing a new starter.
export const STARTER_FORM = {
  addTitle: 'Add a new starter',
  editTitle: (name: string): string => `Change ${name}`,
  person: 'New starter',
  personHint: 'Start typing their name. They need a work account already.',
  manager: 'Their manager',
  managerHint: 'Their manager sees how far along they are on the onboarding page.',
  startDate: 'First day',
  pickDay: 'Pick a day',
  archived: 'Archived',
  archivedHint: 'Takes them off the onboarding page. Their ticks are kept.',
  pickerHeader: 'People',
  pickerNoResults: 'No one found',
  pickerSearching: 'Searching…',
  searchFailed: (error: string): string => `Searching for people didn't work. ${error}`,
  removePerson: 'Remove',
  added: (name: string): string => `${name} added. Their checklist is ready for them.`,
  saved: (name: string): string => `${name} saved.`,
  saveFailed: (reason: string): string => `The new starter couldn't be saved. ${reason}`
};

// Why the starter form can't save yet.
export const STARTER_CHECKS = {
  pickPerson: 'Pick the new starter.',
  pickStartDate: 'Pick their first day.',
  ownManager: 'Someone can\'t be their own manager.',
  alreadyStarting: (name: string): string => `${name} is already on the list of new starters.`
};
