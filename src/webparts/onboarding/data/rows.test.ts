import { columnFromRow, personFrom, sectionFromRow, starterFromRow, taskFromRow, tickFromRow } from './rows';
import { inWords } from './text';

describe('reading rows', () => {
  it('reads a task, taking an empty Active as on', () => {
    expect(taskFromRow({ Id: 4, Title: ' Read it ', TaskSectionId: 2, TaskOrder: 2, TaskLink: null }))
      .toEqual({ id: 4, title: 'Read it', details: '', sectionId: 2, order: 2, link: '', active: true, owners: [] });
    expect(taskFromRow({ Id: 4, TaskSectionId: null }).sectionId).toBeUndefined();
    expect(taskFromRow({ Id: 4, TaskActive: false }).active).toBe(false);
  });

  it('reads a task\'s owners, however SharePoint wraps them', () => {
    const lee = { Id: 13, Title: 'Lee Gu', EMail: 'lee@example.com' };
    const owners = [{ id: 13, name: 'Lee Gu', email: 'lee@example.com' }];
    expect(taskFromRow({ Id: 4, TaskOwners: [lee] }).owners).toEqual(owners);
    expect(taskFromRow({ Id: 4, TaskOwners: { results: [lee] } }).owners).toEqual(owners);
    expect(taskFromRow({ Id: 4, TaskOwners: null }).owners).toEqual([]);
  });

  it('reads a new starter with their person and manager', () => {
    const s = starterFromRow({
      Id: 7, Title: 'Megan Bowen', StartDate: '2026-10-05', StarterArchived: null,
      StarterPerson: { Id: 11, Title: 'Megan Bowen', EMail: 'megan@example.com' },
      StarterManager: { Id: 12, Title: 'Alex Wilber', EMail: 'alex@example.com' }
    });
    expect(s).toEqual({
      id: 7, name: 'Megan Bowen', startDate: '2026-10-05', archived: false,
      person: { id: 11, name: 'Megan Bowen', email: 'megan@example.com' },
      manager: { id: 12, name: 'Alex Wilber', email: 'alex@example.com' }
    });
  });

  it('takes the person\'s name when the row has none, and copes with an empty person column', () => {
    expect(starterFromRow({ Id: 7, StarterPerson: { Id: 11, Title: 'Megan Bowen' } }).name).toBe('Megan Bowen');
    expect(personFrom(null)).toBeUndefined();
    expect(personFrom({ Title: 'No ID' })).toBeUndefined();
  });

  it('reads a tick with the board column it is in', () => {
    expect(tickFromRow({ Id: 1, ProgressStarterId: 7, ProgressTaskId: 4, AuthorId: 11, ProgressColumnId: 52 }))
      .toEqual({ id: 1, starterId: 7, taskId: 4, byId: 11, columnId: 52 });
  });

  it('reads a tick from before the board had columns with no column', () => {
    expect(tickFromRow({ Id: 1, ProgressStarterId: 7, ProgressTaskId: 4, AuthorId: 11 })?.columnId).toBeUndefined();
  });

  it('reads a section, with an empty due date as none', () => {
    expect(sectionFromRow({ Id: 2, Title: 'First week', SectionDays: 7, SectionColour: 'Purple', SectionOrder: 2 }))
      .toEqual({ id: 2, name: 'First week', days: 7, before: false, colour: 'Purple', order: 2 });
    expect(sectionFromRow({ Id: 4, SectionDays: 7, SectionBefore: true }).before).toBe(true);
    expect(sectionFromRow({ Id: 3, Title: 'Later', SectionDays: null }).days).toBeUndefined();
    expect(sectionFromRow({ Id: 1, SectionDays: 0 }).days).toBe(0);
  });

  it('reads a board column, taking an empty Counts as finished as no', () => {
    expect(columnFromRow({ Id: 53, Title: 'Done', ColumnOrder: 3, ColumnFinished: true }))
      .toEqual({ id: 53, name: 'Done', order: 3, finished: true });
    expect(columnFromRow({ Id: 51, Title: 'To do', ColumnOrder: 1 }).finished).toBe(false);
  });

  it('skips a tick whose new starter or task has gone', () => {
    expect(tickFromRow({ Id: 1, ProgressStarterId: null, ProgressTaskId: 4 })).toBeUndefined();
  });
});

describe('inWords', () => {
  it('joins a few things the way a person would say them', () => {
    expect(inWords([])).toBe('');
    expect(inWords(['a'])).toBe('a');
    expect(inWords(['a', 'b'])).toBe('a and b');
    expect(inWords(['a', 'b', 'c'], 'or')).toBe('a, b or c');
  });
});
