import { findProblems, allListsExist, listIds } from './problems';
import { EVERYONE, LIMITED_TEAM, OWNERS, STAFF, TEAM, healthy, empty, change } from './__fixtures__/states';

describe('findProblems', () => {
  it('finds nothing wrong with a site exactly as setup leaves it', () => {
    expect(findProblems(healthy(), EVERYONE)).toEqual([]);
    expect(allListsExist(healthy())).toBe(true);
  });

  it('says every list and the Onboarding Team are still to make on an empty site, and that the owner can do it', () => {
    const problems = findProblems(empty(), EVERYONE);
    expect(problems.map(p => p.list)).toEqual(['sections', 'columns', 'tasks', 'starters', 'progress', undefined]);
    expect(problems[5].text).toBe('The Onboarding Team group hasn\'t been made yet.');
    expect(problems.every(p => p.fixable)).toBe(true);
    expect(allListsExist(empty())).toBe(false);
  });

  it('names a missing column by the name people see', () => {
    const state = change(healthy(), 'starters', { fields: ['Title', 'StarterPerson'] });
    const [first] = findProblems(state, EVERYONE);
    expect(first.text).toBe('New starters is missing 3 columns: Manager, Start date, Archived.');
    expect(first.fixable).toBe(true);
  });

  it('hands a list the owner can\'t change to IT', () => {
    const state = change(healthy(), 'tasks', { fields: ['Title'], canManage: false });
    const problems = findProblems(state, EVERYONE);
    expect(problems).toHaveLength(1);
    expect(problems[0].fixable).toBe(false);
  });

  it('catches staff being able to change each other\'s ticks', () => {
    const state = change(healthy(), 'progress', { writeSecurity: 1 });
    expect(findProblems(state, EVERYONE).map(p => p.text))
      .toEqual(["Staff could change each other's rows in Onboarding progress."]);
  });

  it('catches managers being kept from their new starters\' ticks', () => {
    const state = change(healthy(), 'progress', { readSecurity: 2 });
    expect(findProblems(state, EVERYONE).map(p => p.text)).toEqual([
      "Staff can only see their own rows in Onboarding progress, so managers can't follow their new starters."
    ]);
  });

  it('catches a progress list that still follows the site, so staff cannot tick anything off', () => {
    const state = change(healthy(), 'progress', { uniquePermissions: false });
    expect(findProblems(state, EVERYONE).map(p => p.text)).toEqual(["Staff can't add to Onboarding progress yet."]);
  });

  it('catches a progress list that shows, is searchable or keeps old copies', () => {
    const state = change(healthy(), 'progress', { hidden: false, noCrawl: false, versioning: true });
    expect(findProblems(state, EVERYONE).map(p => p.text)).toEqual([
      'Onboarding progress still shows in the site contents.',
      'Onboarding progress still shows up in search.',
      'Onboarding progress keeps old copies of every change.'
    ]);
  });

  it('notices a Colour column that lacks a colour a newer version brings', () => {
    const state = change(healthy(), 'sections', { choices: { SectionColour: ['Teal', 'Blue', 'Orange', 'Pink', 'Green', 'Grey'] } });
    expect(findProblems(state, EVERYONE).map(p => p.text))
      .toEqual(['The Colour column in Onboarding sections is missing 1 choice: Purple.']);
  });

  it('catches the Onboarding Team not being able to change a list, counting Limited Access as no way in', () => {
    const state = change(change(healthy(), 'tasks', { access: [OWNERS, LIMITED_TEAM] }), 'progress',
      { access: [OWNERS, STAFF] });
    expect(findProblems(state, EVERYONE).map(p => p.text)).toEqual([
      'The Onboarding Team can\'t change Onboarding tasks yet.',
      'The Onboarding Team can\'t change Onboarding progress yet.'
    ]);
  });

  it('finds the group by its ID, so renaming it by hand changes nothing', () => {
    const renamed = { ...TEAM, loginName: 'People team' };
    expect(findProblems(change(healthy(), 'starters', { access: [OWNERS, renamed] }), EVERYONE)).toEqual([]);
  });

  it('leaves the team alone when the check for staff didn\'t look at it', () => {
    expect(findProblems({ ...healthy(), team: undefined }, EVERYONE)).toEqual([]);
  });
});

describe('listIds', () => {
  it('keeps the IDs of the lists that are there', () => {
    const state = change(healthy(), 'progress', { exists: false, id: undefined });
    expect(listIds(state)).toEqual({ sections: 'sections', columns: 'columns', tasks: 'tasks', starters: 'starters' });
  });
});
