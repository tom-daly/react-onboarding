import { blankStarter, checkStarter, draftFromStarter, samePerson } from './starterForm';
import { blankTask, checkTask, forStarter, isWebAddress, nextOrder, rowFromDraft } from './taskForm';
import { sampleDrafts, sectionsForSamples } from './samples';
import { ALEX, DAY, MEGAN, SECTIONS, TASKS, WEEK, lee, megan } from './__fixtures__/board';

describe('checkStarter', () => {
  const picked = { login: 'i:0#.f|membership|new@example.com', name: 'New Person', email: 'new@example.com' };

  it('asks for the person, then the first day', () => {
    expect(checkStarter(blankStarter('2026-10-21'), [])).toBe('Pick the new starter.');
    expect(checkStarter({ ...blankStarter(''), person: picked }, [])).toBe('Pick their first day.');
    expect(checkStarter({ ...blankStarter('2026-02-31'), person: picked }, [])).toBe('Pick their first day.');
  });

  it('is happy with a person and a first day, manager or not', () => {
    expect(checkStarter({ ...blankStarter('2026-10-21'), person: picked }, [megan()])).toBeUndefined();
    expect(checkStarter({ ...blankStarter('2026-10-21'), person: picked, manager: ALEX }, [])).toBeUndefined();
  });

  it('won\'t let someone be their own manager', () => {
    expect(checkStarter({ ...blankStarter('2026-10-21'), person: picked, manager: { ...picked } }, []))
      .toBe('Someone can\'t be their own manager.');
  });

  it('won\'t add someone twice, matching a fresh pick to the list by email', () => {
    const again = { login: 'i:0#.f|membership|megan@example.com', name: MEGAN.name, email: 'MEGAN@example.com' };
    expect(checkStarter({ ...blankStarter('2026-10-21'), person: again }, [megan()]))
      .toBe('Megan Bowen is already on the list of new starters.');
  });

  it('lets someone archived come back as a new starter, and lets a row be saved as itself', () => {
    expect(checkStarter({ ...blankStarter('2026-10-21'), person: MEGAN }, [megan({ archived: true })])).toBeUndefined();
    expect(checkStarter(draftFromStarter(megan()), [megan(), lee()])).toBeUndefined();
  });
});

describe('samePerson', () => {
  it('goes by site ID when both have one, otherwise by email', () => {
    expect(samePerson(MEGAN, { ...MEGAN, email: 'other@example.com' })).toBe(true);
    expect(samePerson(MEGAN, { ...MEGAN, id: 99 })).toBe(false);
    expect(samePerson({ name: 'x', email: '' }, { name: 'y', email: '' })).toBe(false);
    expect(samePerson(undefined, MEGAN)).toBe(false);
  });
});

describe('checkTask', () => {
  const good = { ...blankTask(TASKS, DAY.id), title: 'Read the handbook' };

  it('is happy with a named task', () => {
    expect(checkTask(good)).toBeUndefined();
    expect(checkTask({ ...good, link: 'https://example.com/handbook' })).toBeUndefined();
  });

  it('asks for a name, a whole number order and a full web address', () => {
    expect(checkTask({ ...good, title: '  ' })).toBe('Give the task a name.');
    expect(checkTask({ ...good, order: '1.5' })).toBe('Order needs to be a whole number, like 1 or 10.');
    expect(checkTask({ ...good, order: '' })).toBe('Order needs to be a whole number, like 1 or 10.');
    expect(checkTask({ ...good, link: 'example.com' }))
      .toBe('The link needs to be a full web address, starting with https://');
  });

  it('tells a web address from something else', () => {
    expect(isWebAddress('http://intranet/handbook')).toBe(true);
    expect(isWebAddress('mailto:it@example.com')).toBe(false);
    expect(isWebAddress('https://has a space')).toBe(false);
  });

  it('puts a new task at the end of its section', () => {
    expect(nextOrder(TASKS, DAY.id)).toBe(4);
    expect(nextOrder(TASKS, WEEK.id)).toBe(2);
    expect(nextOrder(TASKS, undefined)).toBe(1);
    expect(nextOrder([], WEEK.id)).toBe(1);
    expect(blankTask(TASKS, DAY.id).order).toBe('4');
  });

  it('saves no section as an empty column', () => {
    expect(rowFromDraft({ ...good, sectionId: undefined }, []).TaskSectionId).toBeNull();
  });

  it('saves the row with the text trimmed and the order as a number', () => {
    expect(rowFromDraft({ ...good, title: ' Read it ', order: ' 7 ', link: ' https://x.example ' }, [12, 13])).toEqual({
      Title: 'Read it',
      TaskDetails: '',
      TaskSectionId: DAY.id,
      TaskOrder: 7,
      TaskLink: 'https://x.example',
      TaskActive: true,
      TaskOwnersId: [12, 13]
    });
  });

  it('starts a new task as the new starter\'s own, with no owners', () => {
    expect(blankTask(TASKS, DAY.id).owners).toEqual([]);
  });

  it('puts the new starter\'s name wherever {{onboardee}} is written', () => {
    expect(forStarter('Order a laptop for {{onboardee}}', 'Megan Bowen')).toBe('Order a laptop for Megan Bowen');
    expect(forStarter('{{ Onboardee }} and {{onboardee}}', 'Lee')).toBe('Lee and Lee');
    expect(forStarter('Read the handbook', 'Lee')).toBe('Read the handbook');
  });
});

describe('the starter set of tasks', () => {
  const BEFORE = { id: 4, name: 'Before they start', days: 7, before: true, colour: 'Orange', order: 0 };
  const YOU = { id: 20, name: 'Isaac Tan', email: 'isaac@example.com' };
  const drafts = sampleDrafts(SECTIONS.concat(BEFORE), YOU);

  it('has about fifteen tasks that all save as they are', () => {
    expect(drafts.length).toBeGreaterThanOrEqual(12);
    expect(drafts.length).toBeLessThanOrEqual(20);
    drafts.forEach(d => expect(checkTask(d)).toBeUndefined());
  });

  it('covers every starting section with tasks of its own, numbered from 1', () => {
    SECTIONS.concat(BEFORE).forEach(section => {
      const orders = drafts.filter(d => d.sectionId === section.id).map(d => d.order);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0]).toBe('1');
    });
    drafts.forEach(d => expect(d.sectionId).toBeDefined());
  });

  it('leaves a task without a section when the team has renamed that one', () => {
    const renamed = sampleDrafts([{ ...DAY, name: 'Day one' }]);
    expect(renamed.every(d => d.sectionId === undefined)).toBe(true);
  });

  it('never names two tasks the same', () => {
    expect(new Set(drafts.map(d => d.title)).size).toBe(drafts.length);
  });

  it('gives the jobs before they start to whoever adds the set, and every other task to the new starter', () => {
    const jobs = drafts.filter(d => d.owners.length > 0);
    expect(jobs.length).toBeGreaterThanOrEqual(3);
    jobs.forEach(d => {
      expect(d.sectionId).toBe(BEFORE.id);
      expect(d.owners).toEqual([YOU]);
      expect(d.title).toContain('{{onboardee}}');
    });
    expect(sampleDrafts(SECTIONS.concat(BEFORE)).every(d => d.owners.length === 0)).toBe(true);
  });

  it('adds Before they start ahead of the other sections when the site hasn\'t got it', () => {
    expect(sectionsForSamples(SECTIONS)).toEqual([
      { name: 'Before they start', days: '7', before: true, colour: 'Orange', order: 0 }
    ]);
    expect(sectionsForSamples(SECTIONS.concat(BEFORE))).toEqual([]);
    expect(sectionsForSamples([]).map(s => s.name)).toEqual(['Before they start', 'First day', 'First week', 'First month']);
  });
});
