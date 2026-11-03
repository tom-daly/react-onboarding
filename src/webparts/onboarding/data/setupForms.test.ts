import {
  blankColumn, blankSection, checkColumn, checkSection, columnRow, draftFromSection, hasFinishLine, moveRow,
  sectionRow, whereTasksGo
} from './setupForms';
import { COLUMNS, DAY, DOING, DONE, SECTIONS, TODO, WEEK } from './__fixtures__/board';

describe('the section form', () => {
  it('starts a new section at the end, in a colour no other section has', () => {
    expect(blankSection(SECTIONS)).toEqual({ name: '', days: '', before: false, colour: 'Orange', order: 4 });
    expect(blankSection([]).colour).toBe('Teal');
  });

  it('asks for a name no other section has', () => {
    const d = blankSection(SECTIONS);
    expect(checkSection(d, SECTIONS)).toBe('Give the section a name.');
    expect(checkSection({ ...d, name: ' first WEEK ' }, SECTIONS)).toBe('There\'s already a section called first WEEK.');
    // Saving a section under its own name is fine.
    expect(checkSection(draftFromSection(WEEK), SECTIONS)).toBeUndefined();
  });

  it('takes a whole number of days, or none', () => {
    const d = { ...blankSection(SECTIONS), name: 'Before they start' };
    expect(checkSection(d, SECTIONS)).toBeUndefined();
    expect(checkSection({ ...d, days: '14' }, SECTIONS)).toBeUndefined();
    expect(checkSection({ ...d, days: '1.5' }, SECTIONS)).toMatch(/whole number/);
    expect(checkSection({ ...d, days: '-3' }, SECTIONS)).toMatch(/whole number/);
    expect(checkSection({ ...d, days: '99999' }, SECTIONS)).toMatch(/at most/);
  });

  it('saves no due date as an empty column, and the name trimmed', () => {
    expect(sectionRow({ name: ' Later ', days: ' ', before: false, colour: 'Pink', order: 4 }))
      .toEqual({ Title: 'Later', SectionDays: null, SectionBefore: false, SectionColour: 'Pink', SectionOrder: 4 });
    expect(sectionRow(draftFromSection(DAY)).SectionDays).toBe(0);
    expect(sectionRow({ ...draftFromSection(DAY), days: '7', before: true }).SectionBefore).toBe(true);
  });
});

describe('the column form', () => {
  it('starts a new column at the right-hand end', () => {
    expect(blankColumn(COLUMNS)).toEqual({ name: '', finished: false, order: 4 });
  });

  it('asks for a name no other column has', () => {
    expect(checkColumn(blankColumn(COLUMNS), COLUMNS)).toBe('Give the column a name.');
    expect(checkColumn({ ...blankColumn(COLUMNS), name: 'done' }, COLUMNS)).toBe('There\'s already a column called done.');
    expect(checkColumn({ ...blankColumn(COLUMNS), name: 'Waiting on IT' }, COLUMNS)).toBeUndefined();
  });

  it('saves the row', () => {
    expect(columnRow({ name: ' Waiting ', finished: false, order: 2 }))
      .toEqual({ Title: 'Waiting', ColumnOrder: 2, ColumnFinished: false });
  });

  it('notices when nothing past the first column counts as finished', () => {
    expect(hasFinishLine(COLUMNS)).toBe(true);
    expect(hasFinishLine([{ ...TODO, finished: true }, DOING, { ...DONE, finished: false }])).toBe(false);
  });
});

describe('moving a section or column', () => {
  it('swaps it with its neighbour and numbers them all 1, 2, 3, keeping only what changes', () => {
    expect(moveRow(COLUMNS, DONE.id, -1)).toEqual([{ id: DONE.id, order: 2 }, { id: DOING.id, order: 3 }]);
    expect(moveRow(SECTIONS, DAY.id, 1)).toEqual([{ id: WEEK.id, order: 1 }, { id: DAY.id, order: 2 }]);
  });

  it('does nothing at either end', () => {
    expect(moveRow(COLUMNS, TODO.id, -1)).toEqual([]);
    expect(moveRow(COLUMNS, DONE.id, 1)).toEqual([]);
  });

  it('tidies up order numbers that had gaps or repeats, breaking a tie by name', () => {
    const messy = [{ ...TODO, order: 5 }, { ...DOING, order: 5 }, { ...DONE, order: 9 }];
    // Doing and To do share 5, so Doing comes first; Done then moves in front of To do.
    expect(moveRow(messy, DONE.id, -1)).toEqual([
      { id: DOING.id, order: 1 }, { id: DONE.id, order: 2 }, { id: TODO.id, order: 3 }
    ]);
  });
});

describe('where tasks go when a column is deleted', () => {
  it('moves them to the column on the left', () => {
    expect(whereTasksGo(COLUMNS, DONE.id)).toBe(DOING);
  });

  it('sends them back to the first column, which needs no row, when that is on the left', () => {
    expect(whereTasksGo(COLUMNS, DOING.id)).toBeUndefined();
  });

  it('sends them to the start when the first column itself goes', () => {
    expect(whereTasksGo(COLUMNS, TODO.id)).toBeUndefined();
  });
});
