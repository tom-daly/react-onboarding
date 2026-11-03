/*
 * Words for setting the tool up: the first-time and fix-it screens, the
 * progress list and its step names, the problems the check finds, and why a
 * step didn't work. The list, column and view names themselves stay with the
 * list definitions in setup/schema.ts, as SharePoint is given those.
 */
import type { ListKey } from '../setup/schema';
import type { StepState } from '../setup/plan';
import { IPlural, countText, plural } from './plural';

// Counting words for a list's columns: "1 column", "3 columns".
export const COLUMNS: IPlural = { one: 'column', other: 'columns' };

// Counting words for a column's choices: "1 choice", "3 choices".
export const CHOICES: IPlural = { one: 'choice', other: 'choices' };

// Counting words for a list's views: "view", "views".
export const LIST_VIEWS: IPlural = { one: 'view', other: 'views' };

// While the page checks the site, and what staff see before the tool is set up.
export const TOOL_OPENING = {
  // Spinner while the page checks the site.
  opening: 'Opening onboarding…',
  // The check itself failed; the reason is SharePoint's own words.
  couldNotOpen: (reason: string): string => `Onboarding could not open. ${reason}`,
  // Staff, when the lists aren't there yet.
  notOpenTitle: 'Onboarding isn\'t set up yet',
  checkBackSoon: 'Check back soon.',
  // Shown once, after setup has finished.
  setUpNotice: 'Onboarding is set up. Next, add the tasks every new starter does.'
};

// The site owner's setup screen, the first time and when something needs fixing.
export const SETUP_SCREEN = {
  // First time: heading and button.
  firstTitle: 'Set up onboarding',
  run: 'Set up onboarding',
  firstIntro: (listCount: number): string =>
    `This makes ${listCount} lists and an Onboarding Team group on this site, and decides who can see what. ` +
    'It only needs doing once.',
  // What each list is for and who can see it, in the words a site owner needs.
  whoSees: {
    sections: 'The parts of the checklist, like First day, with when each is due. Staff can look; site owners ' +
      'and the Onboarding Team change them. Hidden from the site contents.',
    columns: 'The columns on every new starter\'s board, like To do and Done. Staff can look; site owners and ' +
      'the Onboarding Team change them. Hidden from the site contents.',
    tasks: 'The checklist every new starter works through. Staff can look; site owners and the Onboarding Team ' +
      'change it. Hidden from the site contents.',
    starters: 'Who is starting, their manager and their first day. Staff can look; site owners and the ' +
      'Onboarding Team add people. Hidden from the site contents.',
    progress: 'A row for each task someone has moved on their board. Everyone can see these, so managers can ' +
      'follow along, but each person can only change their own. Hidden from the site contents.'
  } as Record<ListKey, string>,
  // The group setup makes, said the same way as the lists.
  teamTerm: 'Onboarding Team',
  teamSay: 'The people who run onboarding day to day: they add new starters and change the checklist. ' +
    'You add them on the Team tab once it\'s set up.',
  // When something is missing or was changed by hand.
  fixTitle: 'Onboarding needs a fix',
  fixIntro: 'Something is missing or has been changed by hand. New starters may not be able to tick off tasks ' +
    'until it is put right.',
  fix: 'Fix it',
  // Problems the person looking hasn't the rights to fix.
  needsItTitle: 'Needs IT',
  needsItIntro: 'You don\'t have the rights to change these. Ask IT (a site collection administrator) to open ' +
    'this page — they\'ll see the same button and it will put these right too.'
};

// Read out by screen readers in place of each step's coloured mark.
export const STEP_STATES: Record<StepState, string> = {
  waiting: 'to do',
  running: 'in progress',
  done: 'done',
  failed: 'failed',
  skipped: 'skipped'
};

// The list of steps as setup works through them.
export const SETUP_PROGRESS = {
  // Spinner while setup works out what to do.
  checking: 'Checking what is already there…',
  // Headings: still going, finished with some not done, all done.
  workingTitle: 'Setting up onboarding',
  notFinishedTitle: 'Setup didn\'t finish',
  doneTitle: 'Onboarding is set up',
  stepOf: (current: number, total: number): string => `Step ${current} of ${total}`,
  allDone: (total: number): string => (total === 1 ? 'The step is done.' : `All ${total} steps are done.`),
  nothingToDo: 'Nothing needed doing.',
  someFailed: (failed: number, total: number): string =>
    `${failed} of ${total} steps didn't work. Trying again picks up where it stopped.`,
  // After each step's name, for screen readers, like " — done".
  stepState: (state: StepState): string => ` — ${STEP_STATES[state]}`,
  openTool: 'Open onboarding'
};

// The name of each setup step, as the progress list shows it.
export const SETUP_STEPS = {
  makeList: (list: string): string => `Make the ${list} list`,
  addColumn: (column: string, list: string): string => `Add the ${column} column to ${list}`,
  addColumns: (count: number, list: string): string => `Add ${countText(count, COLUMNS)} to ${list}`,
  // `choices` already in words, like "First week and First month".
  addChoices: (choices: string, column: string, list: string): string =>
    `Add ${choices} to the ${column} column in ${list}`,
  // Rows a new list starts with, already in words: "Add First day, First week and First month to Onboarding sections".
  seed: (rows: string, list: string): string => `Add ${rows} to ${list}`,
  linkTasks: 'Put each task in its section',
  setUpViews: (views: string[]): string =>
    `Set up the ${views.map(v => `"${v}"`).join(' and ')} ${plural(views.length, LIST_VIEWS)}`,
  // A list's settings: "Onboarding progress: hide it from the site contents and keep it out of search".
  settings: (list: string, changes: string): string => `${list}: ${changes}`,
  // The pieces of that, lower case, as they sit in the middle of it.
  hide: 'hide it from the site contents',
  show: 'show it in the site contents',
  noSearch: 'keep it out of search',
  noVersions: 'stop keeping old copies',
  ownRows: 'let each person change only their own rows',
  staffAddOwn: (list: string): string => `Let staff add their own rows to ${list}`,
  makeGroup: 'Make the Onboarding Team group',
  teamAccess: (list: string): string => `Let the Onboarding Team change ${list}`
};

// What the check finds wrong with the site, on the setup and fix-it screens.
export const SETUP_PROBLEMS = {
  listMissing: (list: string): string => `${list} hasn't been made yet.`,
  columnsMissing: (list: string, columns: string[]): string =>
    `${list} is missing ${countText(columns.length, COLUMNS)}: ${columns.join(', ')}.`,
  choicesMissing: (column: string, list: string, choices: string[]): string =>
    `The ${column} column in ${list} is missing ${countText(choices.length, CHOICES)}: ${choices.join(', ')}.`,
  stillShows: (list: string): string => `${list} still shows in the site contents.`,
  hidden: (list: string): string => `${list} is hidden from the site contents.`,
  inSearch: (list: string): string => `${list} still shows up in search.`,
  keepsVersions: (list: string): string => `${list} keeps old copies of every change.`,
  staffCantAdd: (list: string): string => `Staff can't add to ${list} yet.`,
  staffChangeOthers: (list: string): string => `Staff could change each other's rows in ${list}.`,
  staffCantSeeAll: (list: string): string =>
    `Staff can only see their own rows in ${list}, so managers can't follow their new starters.`,
  noTeamGroup: 'The Onboarding Team group hasn\'t been made yet.',
  teamCantChange: (list: string): string => `The Onboarding Team can't change ${list} yet.`
};

// Why a setup step didn't happen, shown under it on the progress list.
export const SETUP_ERRORS = {
  // Skipped, because an earlier step failed to make what it needs.
  skippedNoList: (list: string): string => `Skipped because ${list} wasn't made.`,
  skippedNoGroup: 'Skipped because the Onboarding Team group couldn\'t be made.',
  noTeamGroup: 'The Onboarding Team group isn\'t there.',
  listGone: (list: string): string => `${list} isn't there.`,
  // One column that wouldn't go in, and SharePoint's reason.
  columnFailed: (column: string, reason: string): string => `${column} (${reason})`,
  columnsNotAdded: (failed: string[]): string => `Couldn't add ${failed.join('; ')}`,
  // A column that points at another list, made before that list.
  lookupBeforeList: (list: string, column: string): string =>
    `The ${list} list has to exist before ${column} can point at it.`,
  noOwnersGroup: 'This site has no Owners group to look after the Onboarding Team group.'
};
