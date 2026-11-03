/*
 * Messages from loading and saving the tool's data. A reason in brackets is
 * SharePoint's own words.
 */

export const TOOL_DATA = {
  listsNotSetUp: 'The onboarding lists are not set up.',
  // Adding the starter set of tasks stopped part way.
  someTasksAdded: (added: number, total: number, reason: string): string =>
    `${added} of ${total} tasks were added before one wouldn't go in. (${reason})`,
  // A person in a box who can't be looked up on the site. Shouldn't happen; picking them again fixes it.
  whoIsThis: (name: string): string => `We couldn't find ${name} on this site. Pick them again.`
};
