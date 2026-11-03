import { spreadAcross } from './devTools';
import { COLUMNS, DONE, TASKS, TODO } from './__fixtures__/board';

describe('spreading a sample new starter\'s tasks across the board', () => {
  it('puts the earliest tasks furthest along and the latest in the first column, with every column used', () => {
    const six = [1, 2, 3, 4, 5, 6].map(id => ({ ...TASKS[0], id }));
    expect(spreadAcross(six, COLUMNS).map(s => s.column.name)).toEqual(['Done', 'Done', 'Doing', 'Doing', 'To do', 'To do']);
  });

  it('copes with fewer tasks than columns', () => {
    expect(spreadAcross([TASKS[0]], COLUMNS).map(s => s.column)).toEqual([DONE]);
    expect(spreadAcross(TASKS.slice(0, 2), COLUMNS).map(s => s.column)[1]).not.toBe(TODO);
  });

  it('does nothing with no columns or no tasks', () => {
    expect(spreadAcross(TASKS, [])).toEqual([]);
    expect(spreadAcross([], COLUMNS)).toEqual([]);
  });
});
