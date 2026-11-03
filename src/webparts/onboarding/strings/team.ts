/*
 * Words on the Team page: who is in the Onboarding Team, and adding or
 * taking people off.
 */

export const TEAM_PAGE = {
  title: 'Onboarding Team',
  intro: 'The Onboarding Team can add new starters, tick things off for them and change the checklist. ' +
    'Site owners always can.',
  loading: 'Loading the Onboarding Team…',
  loadFailed: (error: string): string => `The Onboarding Team couldn't be loaded. ${error}`,
  // An older site that hasn't had Fix it run. Names the setup screen's button.
  noGroup: 'Run Fix it to turn on the Onboarding Team.',
  none: 'There isn\'t anyone in the Onboarding Team yet.',
  removeLabel: (name: string): string => `Remove ${name}`,
  // The search box for adding someone, and what its list of suggestions says.
  addLabel: 'Add a person',
  pickerHeader: 'People',
  pickerNoResults: 'No one found',
  pickerSearching: 'Searching…',
  // For team members, who can see the list but not change it.
  askOwner: 'Ask a site owner to add or remove people.',
  adding: (name: string): string => `Adding ${name}…`,
  added: (name: string): string => `${name} is in the Onboarding Team now.`,
  removing: (name: string): string => `Removing ${name}…`,
  removed: (name: string): string => `${name} isn't in the Onboarding Team any more.`,
  searchFailed: (error: string): string => `Searching for people didn't work. ${error}`,
  addFailed: (name: string, error: string): string => `${name} couldn't be added. ${error}`,
  removeFailed: (name: string, error: string): string => `${name} couldn't be removed. ${error}`
};
