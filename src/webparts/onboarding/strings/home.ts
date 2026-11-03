/*
 * Words on the onboarding home: the row of pages along the top, what someone
 * with nothing here sees, and the bar saying something didn't load.
 */
import type { Tab } from '../data/roles';
import { MY_TEAM_PAGE, STARTERS_PAGE } from './starters';
import { TASKS_PAGE } from './tasks';
import { CHECKLIST, MY_TASKS } from './checklist';
import { BOARD_SETUP } from './boardSetup';

// The row of pages along the top. Shown when someone gets more than one.
export const NAV = {
  // Read out for the row as a whole.
  label: 'Onboarding pages',
  tabs: {
    mine: CHECKLIST.myTitle,
    myTasks: MY_TASKS.title,
    myTeam: MY_TEAM_PAGE.title,
    starters: STARTERS_PAGE.title,
    tasks: TASKS_PAGE.title,
    setup: BOARD_SETUP.title,
    team: 'Team'
  } as Record<Tab, string>
};

// Someone who isn't a new starter, doesn't manage one, and doesn't run onboarding.
export const NOTHING_HERE = {
  title: 'No checklist for you',
  body: 'There\'s no onboarding checklist for you here. If you\'ve just joined, ask your manager to add you.'
};

// Site owners, when something needs IT.
export const NEEDS_IT = {
  // "Needs IT. Ask a site collection administrator…" with the first sentence in bold, then a list of problems:
  lead: 'Needs IT.',
  ask: 'Ask a site collection administrator to open this page and fix:'
};

// The bar saying something didn't load, like "The tasks could not load." and why.
export const LOAD_FAILED = {
  message: (lead: string, why: string): string => `${lead} ${why}`,
  board: 'Onboarding could not load.'
};
