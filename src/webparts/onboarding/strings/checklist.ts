/*
 * Words on a new starter's checklist: their own, or someone else's opened
 * from the list of new starters.
 */

export const CHECKLIST = {
  // Their own checklist.
  myTitle: 'My checklist',
  welcome: (name: string): string => `Welcome, ${name}. Here's what to do in your first month.`,
  // Someone else's, opened from a list.
  theirTitle: (name: string): string => `${name}'s checklist`,
  managedBy: (manager: string): string => `Manager: ${manager}`,
  // On a card someone else does for the new starter, like "Done by Lee Gu" or "Done by Lee Gu and Alex Wilber".
  ownedBy: (people: string): string => `Done by ${people}`,
  startsOn: (day: string): string => `First day: ${day}`,
  started: (day: string): string => `Started ${day}`,
  noStartDate: 'No first day set yet.',
  back: 'Back',
  // "6 of 14 done".
  progress: (done: number, total: number): string => `${done} of ${total} done`,
  allDone: 'All done. Nice work!',
  // A new starter's own board, once every task is done.
  celebrateTitle: 'Congratulations, you\'re all done!',
  celebrateBody: (name: string): string =>
    `You've finished every task on your checklist, ${name}. Welcome aboard!`,
  showBoard: 'Show my board',
  // How many are late, after the progress, like "2 late".
  late: (n: number): string => `${n} late`,
  // On each card, after its part of the month, like "Due Thu 15 Oct 2026".
  due: (day: string): string => `Due ${day}`,
  // A task that's late, said after its name for screen readers and shown as a tag.
  lateTag: 'Late',
  openLink: 'Open',
  openLinkLabel: (task: string): string => `Open the link for ${task} (opens in a new tab)`,
  emptyColumn: 'Nothing here.',
  // On a card whose task isn't in any section.
  noSection: 'No section',
  // The board has no columns to show.
  noColumns: 'The board hasn\'t been set up yet. Ask the Onboarding Team to add its columns.',
  howToMove: 'Drag a task to another column, or use the buttons on it.',
  // Read out for each button on a card, like "Move Collect your laptop to Doing".
  moveLabel: (task: string, column: string): string => `Move ${task} to ${column}`,
  // Someone looking at a checklist they can't change.
  readOnly: 'You can see this checklist, but only the people doing each task and the Onboarding Team can move ' +
    'them.',
  noTasks: 'There aren\'t any tasks on the checklist yet.',
  saveFailed: (task: string, reason: string): string => `${task} couldn't be updated. ${reason}`,
  // For screen readers, after a move saves.
  moved: (task: string, column: string): string => `${task} moved to ${column}.`
};

// My tasks: the jobs someone does for new starters, like ordering a laptop.
export const MY_TASKS = {
  title: 'My tasks',
  intro: 'What you do for each new starter, soonest due first. Move each one along as you go.',
  none: 'Nothing to do right now. Your tasks show here when someone new is added.',
  allDone: 'All done for now. Nice work!',
  // On each card, so it's clear who it's for.
  forWho: (name: string): string => `For ${name}`,
  forWhoStarting: (name: string, day: string): string => `For ${name}, starting ${day}`
};
