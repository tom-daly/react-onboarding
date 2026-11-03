import { IStep, Unmade, mergeChoices, planSetup, skipReason } from './plan';
import { EVERYONE, LIMITED_TEAM, OWNERS, healthy, empty, change } from './__fixtures__/states';

describe('planSetup', () => {
  it('spells out every step on a fresh site, in the order they run', () => {
    expect(planSetup(empty(), EVERYONE).map(s => s.label)).toEqual([
      'Make the Onboarding sections list',
      'Add 4 columns to Onboarding sections',
      'Set up the "All sections" view',
      'Add Before they start, First day, First week and First month to Onboarding sections',
      'Onboarding sections: hide it from the site contents and keep it out of search',

      'Make the Board columns list',
      'Add 2 columns to Board columns',
      'Set up the "All columns" view',
      'Add To do, Doing and Done to Board columns',
      'Board columns: hide it from the site contents and keep it out of search',

      'Make the Onboarding tasks list',
      'Add 6 columns to Onboarding tasks',
      'Set up the "All tasks" view',
      'Onboarding tasks: hide it from the site contents and keep it out of search',

      'Make the New starters list',
      'Add 4 columns to New starters',
      'Set up the "All starters" view',
      'New starters: hide it from the site contents and keep it out of search',

      'Make the Onboarding progress list',
      'Add 4 columns to Onboarding progress',
      'Set up the "All progress" view',
      'Onboarding progress: hide it from the site contents, keep it out of search, ' +
        'stop keeping old copies and let each person change only their own rows',
      'Let staff add their own rows to Onboarding progress',

      'Make the Onboarding Team group',
      'Let the Onboarding Team change Onboarding sections',
      'Let the Onboarding Team change Board columns',
      'Let the Onboarding Team change Onboarding tasks',
      'Let the Onboarding Team change New starters',
      'Let the Onboarding Team change Onboarding progress'
    ]);
  });

  it('starts every step as waiting, with an id the page can key on', () => {
    const steps = planSetup(empty(), EVERYONE);
    expect(steps.every(s => s.state === 'waiting')).toBe(true);
    expect(new Set(steps.map(s => s.id)).size).toBe(steps.length);
  });

  it('has nothing to do on a site exactly as setup leaves it', () => {
    expect(planSetup(healthy(), EVERYONE)).toEqual([]);
  });

  it('adds only the one missing column, by the name people see', () => {
    const fields = healthy().tasks.fields?.filter(f => f !== 'TaskLink');
    const steps = planSetup(change(healthy(), 'tasks', { fields }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual(['Add the Link column to Onboarding tasks']);
    expect(steps[0].fields).toEqual(['TaskLink']);
  });

  it('leaves views alone on a list that already exists', () => {
    const steps = planSetup(change(healthy(), 'progress', { hidden: false }), EVERYONE);
    expect(steps.map(s => s.kind)).toEqual(['settings']);
    expect(steps[0].settings).toEqual({ Hidden: true });
  });

  it('puts back who sees and changes which ticks, both at once', () => {
    const steps = planSetup(change(healthy(), 'progress', { writeSecurity: 1 }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual(['Onboarding progress: let each person change only their own rows']);
    expect(steps[0].settings).toEqual({ ReadSecurity: 1, WriteSecurity: 2 });
  });

  it('plans nothing for a list the owner can\'t change — that is IT\'s job', () => {
    expect(planSetup(change(healthy(), 'tasks', { fields: ['Title'], canManage: false }), EVERYONE)).toEqual([]);
  });

  it('lets staff back into a progress list that lost its own permissions', () => {
    const steps = planSetup(change(healthy(), 'progress', { uniquePermissions: false }), EVERYONE);
    expect(steps.map(s => s.kind)).toEqual(['staffAccess']);
  });

  it('adds a missing colour to the Colour column, keeping what it had', () => {
    const had = ['Teal', 'Blue', 'Orange', 'Pink', 'Green', 'Grey', 'Gold'];
    const steps = planSetup(change(healthy(), 'sections', { choices: { SectionColour: had } }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual(['Add Purple to the Colour column in Onboarding sections']);
    expect(steps[0].choices).toEqual({
      field: 'SectionColour', all: ['Teal', 'Purple', 'Blue', 'Orange', 'Pink', 'Green', 'Grey', 'Gold']
    });
  });

  it('puts old tasks into their sections when it adds the Section column to tasks', () => {
    const fields = ['TaskDetails', 'TaskOrder', 'TaskLink', 'TaskActive', 'TaskOwners'];
    const steps = planSetup(change(healthy(), 'tasks', { fields }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual(['Add the Section column to Onboarding tasks', 'Put each task in its section']);
  });

  it('adds task owners and Before they start to a site set up before they existed', () => {
    const tasks = healthy().tasks.fields?.filter(f => f !== 'TaskOwners');
    const sections = healthy().sections.fields?.filter(f => f !== 'SectionBefore');
    const steps = planSetup(change(change(healthy(), 'tasks', { fields: tasks }), 'sections', { fields: sections }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual([
      'Add the Before they start column to Onboarding sections',
      'Add the Owners column to Onboarding tasks'
    ]);
  });

  it('lets the Onboarding Team into a list they only have Limited Access to', () => {
    const steps = planSetup(change(healthy(), 'starters', { access: [OWNERS, LIMITED_TEAM] }), EVERYONE);
    expect(steps.map(s => s.label)).toEqual(['Let the Onboarding Team change New starters']);
    expect(steps[0].list).toBe('starters');
  });

  it('makes the group, then lets it in everywhere, when it has gone', () => {
    const steps = planSetup({ ...healthy(), team: { exists: false } }, EVERYONE);
    expect(steps.map(s => s.kind)).toEqual(['makeGroup', 'teamAccess', 'teamAccess', 'teamAccess', 'teamAccess', 'teamAccess']);
  });

  it('leaves the team alone when the full check didn\'t look at it', () => {
    expect(planSetup({ ...healthy(), team: undefined }, EVERYONE)).toEqual([]);
  });
});

describe('skipReason', () => {
  const step = (patch: Partial<IStep>): IStep =>
    ({ id: 'x', kind: 'teamAccess', label: 'x', state: 'waiting', ...patch });

  it('skips a list\'s steps when the list wasn\'t made, the team\'s one included', () => {
    const unmade = new Set<Unmade>(['tasks']);
    expect(skipReason(step({ list: 'tasks' }), unmade)).toBe('Skipped because Onboarding tasks wasn\'t made.');
    expect(skipReason(step({ list: 'starters' }), unmade)).toBeUndefined();
  });

  it('skips every team step when the group couldn\'t be made', () => {
    const unmade = new Set<Unmade>(['team']);
    expect(skipReason(step({ list: 'progress' }), unmade))
      .toBe('Skipped because the Onboarding Team group couldn\'t be made.');
    expect(skipReason(step({ kind: 'addColumns', list: 'progress' }), unmade)).toBeUndefined();
  });
});

describe('mergeChoices', () => {
  it('puts each new choice in after the one before it, keeping choices added by hand', () => {
    expect(mergeChoices(['First day', 'First month', 'Later'], ['First day', 'First week', 'First month']))
      .toEqual(['First day', 'First week', 'First month', 'Later']);
  });

  it('puts a new first choice first', () => {
    expect(mergeChoices(['B'], ['A', 'B'])).toEqual(['A', 'B']);
  });
});
