import {
  addDays, checklistFor, columnOf, columnsFor, dueDay, fractionDone, groupBySection, inOrder, isFinished,
  jobsFor, progressFor, progressOf, rankAt, stageOf
} from './checklist';
import {
  COLUMNS, DAY, DOING, DONE, MEGAN, MONTH, SECTIONS, TASKS, TODO, WEEK, board, lee, megan, tick
} from './__fixtures__/board';
import type { IBoard, ITick } from './types';

describe('working out days', () => {
  it('counts days on, across the end of a month', () => {
    expect(addDays('2026-10-05', 7)).toBe('2026-10-12');
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04');
    expect(addDays('not a day', 7)).toBeUndefined();
  });

  it('puts each section due its number of days after the first day', () => {
    expect(dueDay('2026-10-05', DAY)).toBe('2026-10-05');
    expect(dueDay('2026-10-05', WEEK)).toBe('2026-10-12');
    expect(dueDay('2026-10-05', MONTH)).toBe('2026-11-04');
  });

  it('counts back from the first day for a section before they start', () => {
    expect(dueDay('2026-10-05', { ...WEEK, before: true })).toBe('2026-09-28');
    expect(dueDay('2026-10-01', { ...WEEK, days: 3, before: true })).toBe('2026-09-28');
  });

  it('has no due day without a start date, a section, or a section with no due date', () => {
    expect(dueDay('', DAY)).toBeUndefined();
    expect(dueDay('2026-10-05', undefined)).toBeUndefined();
    expect(dueDay('2026-10-05', { ...WEEK, days: undefined })).toBeUndefined();
  });
});

describe('groupBySection', () => {
  it('groups by section in their order, then by order number', () => {
    const shuffled = [TASKS[3], TASKS[1], TASKS[2], TASKS[0]];
    expect(groupBySection(shuffled, [MONTH, DAY, WEEK]).map(g => [g.section?.name, g.tasks.map(t => t.id)])).toEqual([
      ['First day', [1, 2]],
      ['First week', [3]],
      ['First month', [4]]
    ]);
  });

  it('follows the team\'s order of sections', () => {
    const reordered = [{ ...MONTH, order: 1 }, { ...DAY, order: 2 }, { ...WEEK, order: 3 }];
    expect(groupBySection(TASKS.slice(0, 4), reordered).map(g => g.section?.name))
      .toEqual(['First month', 'First day', 'First week']);
  });

  it('puts tasks with no section, or one taken away, last, and leaves out empty sections', () => {
    const extra = [{ ...TASKS[0], id: 8, sectionId: undefined }, { ...TASKS[0], id: 9, sectionId: 99 }, TASKS[3]];
    expect(groupBySection(extra, SECTIONS).map(g => [g.section?.name, g.tasks.map(t => t.id)]))
      .toEqual([['First month', [4]], [undefined, [8, 9]]]);
  });
});

describe('the board\'s columns', () => {
  it('puts a task with no tick in the first column, and one with a tick in its own column', () => {
    expect(columnOf(undefined, COLUMNS)).toBe(TODO);
    expect(columnOf(tick(1, 100, 1, DOING), COLUMNS)).toBe(DOING);
    expect(columnOf(tick(1, 100, 1, DONE), COLUMNS)).toBe(DONE);
  });

  it('counts a tick from before the board had columns, or whose column has gone, as finished', () => {
    expect(columnOf(tick(1, 100, 1, undefined), COLUMNS)).toBe(DONE);
    expect(columnOf({ ...tick(1, 100, 1), columnId: 999 }, COLUMNS)).toBe(DONE);
    // With nothing marked finished, it goes in the last column.
    const none = COLUMNS.map(c => ({ ...c, finished: false }));
    expect(columnOf(tick(1, 100, 1, undefined), none)).toBe(none[2]);
  });

  it('never counts the first column as finished, even if it is marked so', () => {
    const odd = [{ ...TODO, finished: true }, DOING, DONE];
    expect(isFinished(odd[0], odd)).toBe(false);
    expect(isFinished(DONE, odd)).toBe(true);
  });

  it('sorts columns by their order', () => {
    expect(inOrder([DONE, TODO, DOING]).map(c => c.name)).toEqual(['To do', 'Doing', 'Done']);
  });

  it('splits the checklist into the columns, each in checklist order', () => {
    const list = checklistFor(megan(), board([tick(1, 100, 4, DOING), tick(2, 100, 2), tick(3, 100, 3, DOING)]),
      '2026-10-05');
    expect(columnsFor(list, COLUMNS).map(c => [c.column.name, c.items.map(i => i.task.id)])).toEqual([
      ['To do', [1]],
      ['Doing', [3, 4]],
      ['Done', [2]]
    ]);
  });

  it('goes by the newest row when a task has more than one', () => {
    // The team put it in Done; the new starter then moved it back to Doing with a row of their own.
    const list = checklistFor(megan(), board([tick(7, 100, 1, DONE), tick(9, 100, 1, DOING)]), '2026-10-05');
    expect(list.groups[0].items[0].column).toBe(DOING);
    const back = checklistFor(megan(), board([tick(9, 100, 1, DONE), tick(7, 100, 1, TODO)]), '2026-10-05');
    expect(back.groups[0].items[0].column).toBe(DONE);
  });

  it('keeps a dropped card where it was dropped, and the rest in checklist order', () => {
    // Task 4 dropped at the top of To do; task 2 dropped below task 3 in Doing.
    const list = checklistFor(megan(), board([
      { ...tick(1, 100, 4, TODO), rank: -1 },
      tick(2, 100, 3, DOING),
      { ...tick(3, 100, 2, DOING), rank: 2.5 }
    ]), '2026-10-05');
    expect(columnsFor(list, COLUMNS).map(c => c.items.map(i => i.task.id))).toEqual([[4, 1], [3, 2], []]);
  });

  it('works out a place between the cards a card is dropped between', () => {
    const list = checklistFor(megan(), board(), '2026-10-05');
    const todo = columnsFor(list, COLUMNS)[0].items; // places 0, 1, 2, 3
    expect(rankAt(todo, 0)).toBe(-1);
    expect(rankAt(todo, 2)).toBe(1.5);
    expect(rankAt(todo, 4)).toBe(4);
    expect(rankAt([], 0)).toBe(0);
  });

  it('copes with a column the team added in the middle', () => {
    const waiting = { id: 60, name: 'Waiting on IT', order: 2, finished: false };
    const columns = [TODO, waiting, { ...DOING, order: 3 }, { ...DONE, order: 4 }];
    const list = checklistFor(megan(), board([tick(1, 100, 1, waiting)], { columns }), '2026-10-05');
    expect(columnsFor(list, columns).map(c => c.items.length)).toEqual([3, 1, 0, 0]);
    expect(list.done).toBe(0);
  });
});

describe('checklistFor', () => {
  it('leaves switched-off tasks off and counts what is done', () => {
    const list = checklistFor(megan(), board([tick(1, 100, 1), tick(2, 999, 2)]), '2026-10-05');
    expect(list.total).toBe(4);
    expect(list.done).toBe(1);
    expect(list.groups[0].items.map(i => i.done)).toEqual([true, false]);
  });

  it('only counts a task as late once its day has passed', () => {
    expect(checklistFor(megan(), board(), '2026-10-05').overdue).toBe(0);
    const dayAfter = checklistFor(megan(), board(), '2026-10-06');
    expect(dayAfter.overdue).toBe(2);
    expect(dayAfter.groups[0].items.every(i => i.overdue)).toBe(true);
    expect(checklistFor(megan(), board(), '2026-10-13').overdue).toBe(3);
  });

  it('never counts a finished task as late, but does a started one', () => {
    expect(checklistFor(megan(), board([tick(1, 100, 1), tick(2, 100, 2)]), '2026-10-06').overdue).toBe(0);
    const started = checklistFor(megan(), board([tick(1, 100, 1, DOING)]), '2026-10-06');
    expect(started.overdue).toBe(2);
    expect(started.done).toBe(0);
  });

  it('gives each group and each card its due day', () => {
    const list = checklistFor(megan(), board(), '2026-10-01');
    expect(list.groups.map(g => g.due)).toEqual(['2026-10-05', '2026-10-12', '2026-11-04']);
    expect(list.groups[1].items[0].due).toBe('2026-10-12');
    expect(list.groups[1].items[0].section).toBe(WEEK);
  });

  it('counts nothing as late without a start date', () => {
    expect(checklistFor(megan({ startDate: '' }), board(), '2027-01-01').overdue).toBe(0);
  });
});

describe('where a new starter is', () => {
  it('has not started before their first day, has once it comes, and is finished with everything done', () => {
    const p = progressFor(lee(), board(), '2026-10-21');
    expect(stageOf(lee(), p, '2026-10-21')).toBe('upcoming');
    expect(stageOf(lee(), p, '2026-11-02')).toBe('started');
    const all = [1, 2, 3, 4].map(id => tick(id, 101, id));
    const done = progressFor(lee(), board(all), '2026-11-02');
    expect(done).toEqual({ done: 4, total: 4, overdue: 0 });
    expect(stageOf(lee(), done, '2026-11-02')).toBe('finished');
  });

  it('counts as started when there is no first day to go by', () => {
    const s = megan({ startDate: '' });
    expect(stageOf(s, progressFor(s, board(), '2026-10-21'), '2026-10-21')).toBe('started');
  });

  it('gives a fraction for the progress bar, 0 when there are no tasks', () => {
    expect(fractionDone({ done: 1, total: 4, overdue: 0 })).toBe(0.25);
    expect(fractionDone({ done: 0, total: 0, overdue: 0 })).toBe(0);
  });
});

describe('tasks someone else does for the new starter', () => {
  const IT = { id: 20, name: 'Isaac Tan', email: 'isaac@example.com' };
  const BEFORE = { id: 4, name: 'Before they start', days: 7, before: true, colour: 'Orange', order: 0 };
  const laptop = { ...TASKS[0], id: 6, title: 'Order a laptop for {{onboardee}}', sectionId: 4, owners: [IT] };
  const withJob = (ticks: ITick[] = []): IBoard =>
    board(ticks, { sections: SECTIONS.concat(BEFORE), tasks: TASKS.concat(laptop) });

  it('stay off the new starter\'s own board, and count for everyone following along', () => {
    expect(checklistFor(megan(), withJob(), '2026-10-01', 'own').total).toBe(4);
    expect(checklistFor(megan(), withJob(), '2026-10-01', 'all').total).toBe(5);
    expect(progressFor(megan(), withJob(), '2026-10-01').total).toBe(5);
  });

  it('show on the owner\'s board once for each new starter, soonest due first', () => {
    const jobs = jobsFor(IT.id, withJob(), [lee(), megan()], '2026-09-01');
    expect(jobs.map(j => [j.starter.name, j.due])).toEqual([['Megan Bowen', '2026-09-28'], ['Lee Gu', '2026-10-26']]);
    expect(jobsFor(MEGAN.id, withJob(), [megan()], '2026-09-01')).toEqual([]);
  });

  it('are late once their day has passed, and done once moved to Done', () => {
    expect(jobsFor(IT.id, withJob(), [megan()], '2026-09-29')[0].overdue).toBe(true);
    const done = jobsFor(IT.id, withJob([tick(1, 100, 6)]), [megan(), lee()], '2026-09-29');
    expect(progressOf(done)).toEqual({ done: 1, total: 2, overdue: 0 });
  });
});
