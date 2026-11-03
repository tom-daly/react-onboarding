import { SECTION_COLOURS, STARTER_COLUMNS, STARTER_SECTIONS, TOOL_LISTS, xmlEscape, listDef } from './schema';

const IDS = {
  sections: 'aaaaaaaa-2222-3333-4444-555555555555',
  columns: 'bbbbbbbb-2222-3333-4444-555555555555',
  tasks: '11111111-2222-3333-4444-555555555555',
  starters: '66666666-7777-8888-9999-000000000000'
};
const BUILT_IN = ['LinkTitle', 'Title', 'Author', 'Created', 'ID'];

describe('the list definitions', () => {
  it('give every column XML SharePoint can read, under the name the tool expects', () => {
    for (const def of TOOL_LISTS) {
      for (const f of def.fields) {
        const doc = new DOMParser().parseFromString(f.xml(IDS), 'application/xml');
        expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
        const el = doc.documentElement;
        expect(el.getAttribute('Name')).toBe(f.name);
        expect(el.getAttribute('StaticName')).toBe(f.name);
        expect(el.getAttribute('DisplayName')).toBe(f.title);
      }
    }
  });

  it('never repeat a column name within a list, or the name of its title column', () => {
    for (const def of TOOL_LISTS) {
      const names = def.fields.map(f => f.name);
      expect(new Set(names).size).toBe(names.length);
      const titles = [def.titleColumn, ...def.fields.map(f => f.title)];
      expect(new Set(titles).size).toBe(titles.length);
    }
  });

  it('only show columns in views that exist', () => {
    for (const def of TOOL_LISTS) {
      const known = [...BUILT_IN, ...def.fields.map(f => f.name)];
      for (const v of def.views) {
        for (const f of v.fields) expect(known).toContain(f);
      }
    }
  });

  it('make each list before any list that points at it', () => {
    const order = TOOL_LISTS.map(def => def.key);
    expect(order.indexOf('tasks')).toBeLessThan(order.indexOf('progress'));
    expect(order.indexOf('sections')).toBeLessThan(order.indexOf('tasks'));
    expect(order.indexOf('columns')).toBeLessThan(order.indexOf('progress'));
    expect(order.indexOf('starters')).toBeLessThan(order.indexOf('progress'));
  });

  it('point each tick at its new starter and its task by their lists\' IDs', () => {
    const progress = listDef('progress');
    expect(progress.fields.find(f => f.name === 'ProgressStarter')?.xml(IDS)).toContain(`List="{${IDS.starters}}"`);
    expect(progress.fields.find(f => f.name === 'ProgressTask')?.xml(IDS)).toContain(`List="{${IDS.tasks}}"`);
    expect(() => progress.fields[0].xml({})).toThrow('The New starters list has to exist before New starter');
  });

  it('pick only people, never groups, for a new starter and their manager', () => {
    const starters = listDef('starters');
    for (const name of ['StarterPerson', 'StarterManager']) {
      const xml = starters.fields.find(f => f.name === name)?.xml(IDS) || '';
      expect(xml).toContain('Type="User"');
      expect(xml).toContain('UserSelectionMode="PeopleOnly"');
    }
  });

  it('start a new site with Before they start, First day, First week and First month, each in its own colour', () => {
    expect(STARTER_SECTIONS.map(s => [s.name, s.days, s.before])).toEqual([
      ['Before they start', 7, true], ['First day', 0, false], ['First week', 7, false], ['First month', 30, false]
    ]);
    STARTER_SECTIONS.forEach(s => expect(SECTION_COLOURS).toContain(s.colour));
    expect(new Set(STARTER_SECTIONS.map(s => s.colour)).size).toBe(STARTER_SECTIONS.length);
    expect(listDef('sections').starterRows).toHaveLength(4);
    expect(listDef('sections').starterRows?.[0].SectionBefore).toBe(true);
  });

  it('start a new board with To do, Doing and Done, only Done counting as finished', () => {
    expect(STARTER_COLUMNS.map(c => [c.name, c.finished])).toEqual([['To do', false], ['Doing', false], ['Done', true]]);
    expect(listDef('columns').starterRows?.map(r => r.ColumnOrder)).toEqual([1, 2, 3]);
  });

  it('let a task be owned by any number of people, never groups', () => {
    const xml = listDef('tasks').fields.find(f => f.name === 'TaskOwners')?.xml(IDS) || '';
    expect(xml).toContain('Type="UserMulti"');
    expect(xml).toContain('Mult="TRUE"');
    expect(xml).toContain('UserSelectionMode="PeopleOnly"');
  });

  it('point each task at its section, and each tick at its board column', () => {
    expect(listDef('tasks').fields.find(f => f.name === 'TaskSection')?.xml(IDS)).toContain(`List="{${IDS.sections}}"`);
    expect(listDef('progress').fields.find(f => f.name === 'ProgressColumn')?.xml(IDS)).toContain(`List="{${IDS.columns}}"`);
  });

  it('let staff add to the progress list only, and the team change every list', () => {
    expect(TOOL_LISTS.filter(def => def.access === 'addOwn').map(def => def.key)).toEqual(['progress']);
    expect(TOOL_LISTS.every(def => def.team)).toBe(true);
  });

  it('escape characters that would break the XML', () => {
    expect(xmlEscape('Fish & "chips" <hot>')).toBe('Fish &amp; &quot;chips&quot; &lt;hot&gt;');
  });
});
