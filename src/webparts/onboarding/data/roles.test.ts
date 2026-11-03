import { current, rolesFor, tabsFor } from './roles';
import { ALEX, LEE, MEGAN, TASKS, lee, megan } from './__fixtures__/board';

describe('rolesFor', () => {
  const starters = [lee(), megan(), megan({ id: 102, archived: true })];

  it('gives a new starter their own checklist', () => {
    const r = rolesFor(starters, MEGAN.id, false);
    expect(r.me?.id).toBe(100);
    expect(r.myTeam).toEqual([]);
    expect(tabsFor(r)).toEqual(['mine']);
  });

  it('gives a manager the new starters they manage, soonest first, archived ones left out', () => {
    const r = rolesFor(starters, ALEX.id, false);
    expect(r.me).toBeUndefined();
    expect(r.myTeam.map(s => s.id)).toEqual([100, 101]);
    expect(tabsFor(r)).toEqual(['myTeam']);
  });

  it('gives the Onboarding Team the pages for running it, after anything of their own', () => {
    expect(tabsFor(rolesFor(starters, 999, true))).toEqual(['starters', 'tasks', 'setup', 'team']);
    expect(tabsFor(rolesFor(starters, LEE.id, true))).toEqual(['mine', 'starters', 'tasks', 'setup', 'team']);
  });

  it('gives someone who owns a task My tasks', () => {
    const IT = { id: 20, name: 'Isaac Tan', email: 'isaac@example.com' };
    const tasks = TASKS.concat({ ...TASKS[0], id: 6, title: 'Order a laptop', owners: [IT] });
    expect(tabsFor(rolesFor(starters, IT.id, false, tasks))).toEqual(['myTasks']);
    expect(tabsFor(rolesFor(starters, MEGAN.id, false, tasks))).toEqual(['mine']);
    // A task switched off gives nobody anything to do.
    const off = TASKS.concat({ ...TASKS[0], id: 6, active: false, owners: [IT] });
    expect(tabsFor(rolesFor(starters, IT.id, false, off))).toEqual([]);
  });

  it('gives someone with nothing here nothing', () => {
    expect(tabsFor(rolesFor(starters, 999, false))).toEqual([]);
  });

  it('never counts an archived new starter as a checklist of their own', () => {
    expect(rolesFor([megan({ archived: true })], MEGAN.id, false).me).toBeUndefined();
  });

  it('never puts someone on their own team', () => {
    expect(rolesFor([megan({ manager: MEGAN })], MEGAN.id, false).myTeam).toEqual([]);
  });
});

describe('current', () => {
  it('puts the soonest start first and anyone without a start date last', () => {
    const list = current([megan({ id: 1, startDate: '' }), lee({ id: 2 }), megan({ id: 3 })]);
    expect(list.map(s => s.id)).toEqual([3, 2, 1]);
  });
});
