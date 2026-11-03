/*
 * The lists the onboarding checklist keeps its data in, written down once.
 * Setup builds them from this; the health check compares the site against it.
 *
 * Lists are found by their web address (Lists/OnboardingTasks), never by
 * their title, so they can be renamed without breaking anything.
 *
 * Column internal names never change once shipped. Titles, descriptions and
 * views are only applied when a list is first created, so anything adjusted
 * by hand afterwards is left alone.
 */
import { SETUP_ERRORS } from '../strings/setup';

export type ListKey = 'sections' | 'columns' | 'tasks' | 'starters' | 'progress';

/**
 * Who can do what in a list.
 *  site   - staff read, owners edit.
 *  addOwn - any staff member can add rows, everyone sees every row, and each
 *           person changes only their own. The ticks on a checklist, so a
 *           manager can follow along.
 *
 * On top of that, a list marked `team` lets the Onboarding Team group change
 * every row, so the people a site owner picks can run onboarding.
 */
export type Access = 'site' | 'addOwn';

export type ListIds = Partial<Record<ListKey, string>>;

/** What each list is called, as people see it in SharePoint. */
const TITLES: Record<ListKey, string> = {
  sections: 'Onboarding sections',
  columns: 'Board columns',
  tasks: 'Onboarding tasks',
  starters: 'New starters',
  progress: 'Onboarding progress'
};

export interface IFieldDef {
  name: string;
  title: string;
  inDefaultView: boolean;
  xml: (ids: ListIds) => string;
  /** A choice column's choices, so setup can add any a newer version brings. */
  choices?: string[];
}

export interface IViewDef {
  title: string;
  fields: string[];
  query: string;
  rowLimit: number;
}

export interface IListDef {
  key: ListKey;
  urlName: string;
  title: string;
  description: string;
  titleColumn: string;
  hidden: boolean;
  searchable: boolean;
  keepVersions: boolean;
  access: Access;
  /** The Onboarding Team can change every row (Edit), so they can run onboarding without being site owners. */
  team: boolean;
  fields: IFieldDef[];
  /** The first view is applied to the list's own default view. */
  views: IViewDef[];
  /** Rows put in when setup makes the list, so it's ready to use. */
  starterRows?: Record<string, unknown>[];
}

/* ------------------------------------------------------------ column XML */

export const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface IFieldOptions {
  hint?: string;
  required?: boolean;
  inDefaultView?: boolean;
  hidden?: boolean;
}

function field(
  name: string, title: string, type: string, extra: string, inner: string, o: IFieldOptions
): IFieldDef {
  const attrs =
    `Type="${type}" Name="${name}" StaticName="${name}" DisplayName="${xmlEscape(title)}"` +
    (o.hint ? ` Description="${xmlEscape(o.hint)}"` : '') +
    (o.required ? ' Required="TRUE"' : '') +
    (o.hidden ? ' Hidden="TRUE"' : '') +
    extra;
  const xml = `<Field ${attrs}${inner ? `>${inner}</Field>` : ' />'}`;
  return { name, title, inDefaultView: o.inDefaultView !== false && !o.hidden, xml: () => xml };
}

const text = (name: string, title: string, maxLength: number, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Text', ` MaxLength="${maxLength}"`, '', o);

const note = (name: string, title: string, lines: number, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Note', ` NumLines="${lines}" RichText="FALSE"`, '', o);

const count = (name: string, title: string, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Number', ' Decimals="0" Min="0"', '<Default>0</Default>', o);

/* A number that can have a fraction and be left empty. */
const decimal = (name: string, title: string, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Number', '', '', o);

/* A whole number that can be left empty. */
const optionalCount = (name: string, title: string, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Number', ' Decimals="0" Min="0"', '', o);

const yesNo = (name: string, title: string, byDefault: boolean, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'Boolean', '', `<Default>${byDefault ? 1 : 0}</Default>`, o);

/* One person from the organisation, never a group. */
const person = (name: string, title: string, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'User', ' List="UserInfo" ShowField="ImnName" UserSelectionMode="PeopleOnly" UserSelectionScope="0"',
    '', o);

/* Any number of people from the organisation, never groups. */
const people = (name: string, title: string, o: IFieldOptions = {}): IFieldDef =>
  field(name, title, 'UserMulti',
    ' List="UserInfo" ShowField="ImnName" UserSelectionMode="PeopleOnly" UserSelectionScope="0" Mult="TRUE"', '', o);

function choice(name: string, title: string, choices: string[], byDefault: string, o: IFieldOptions = {}): IFieldDef {
  const list = choices.map(c => `<CHOICE>${xmlEscape(c)}</CHOICE>`).join('');
  return {
    ...field(name, title, 'Choice', ' Format="Dropdown"',
      `<CHOICES>${list}</CHOICES><Default>${xmlEscape(byDefault)}</Default>`, o),
    choices
  };
}

/* A lookup has to name the list it points at by its ID, which only exists once
   that list has been made — so its XML is built at install time. */
function lookup(name: string, title: string, to: ListKey, o: IFieldOptions = {}): IFieldDef {
  const base = field(name, title, 'Lookup', '', '', o);
  return {
    ...base,
    xml: (ids) => {
      const id = ids[to];
      if (!id) throw new Error(SETUP_ERRORS.lookupBeforeList(TITLES[to], title));
      return base.xml(ids).replace(' />', ` List="{${id}}" ShowField="Title" />`);
    }
  };
}

/* ------------------------------------------------------------------ lists */

/** The colours a section can have. Each has its own look on the page. */
export const SECTION_COLOURS = ['Teal', 'Purple', 'Blue', 'Orange', 'Pink', 'Green', 'Grey'];

/**
 * The sections a new site starts with, and the column each task used to say
 * it was in before sections had a list of their own.
 */
export const STARTER_SECTIONS: { name: string; days: number; before: boolean; colour: string }[] = [
  { name: 'Before they start', days: 7, before: true, colour: 'Orange' },
  { name: 'First day', days: 0, colour: 'Teal' },
  { name: 'First week', days: 7, colour: 'Purple' },
  { name: 'First month', days: 30, colour: 'Blue' }
].map(x => ({ before: false, ...x }));

/** The board columns a new site starts with. Tasks start in the first; the last counts as finished. */
export const STARTER_COLUMNS = [
  { name: 'To do', finished: false },
  { name: 'Doing', finished: false },
  { name: 'Done', finished: true }
];

/** The SharePoint group whose people run onboarding. Site owners add and remove them from the Team page. */
export const TEAM_GROUP = 'Onboarding Team';

/** What the Onboarding Team group says it is for, in SharePoint's own group pages. */
export const TEAM_DESCRIPTION = 'People who run onboarding: new starters and the checklist. ' +
  'Site owners add people from the onboarding page\'s Team tab.';

export const TOOL_LISTS: IListDef[] = [
  {
    key: 'sections',
    urlName: 'OnboardingSections',
    title: TITLES.sections,
    description: 'The parts of a new starter\'s checklist, like First day or First week, and when each is due. ' +
      'One row per section.',
    titleColumn: 'Section',
    hidden: true,
    searchable: false,
    keepVersions: true,
    access: 'site',
    team: true,
    fields: [
      optionalCount('SectionDays', 'Due after', {
        hint: 'Days after their first day it is due. 0 is the first day itself. Empty for no due date.'
      }),
      yesNo('SectionBefore', 'Before they start', false, {
        hint: 'Turn on to count the days back from their first day, so 7 is a week before they start.'
      }),
      choice('SectionColour', 'Colour', SECTION_COLOURS, SECTION_COLOURS[0]),
      count('SectionOrder', 'Order', { hint: 'Lower numbers come first.' })
    ],
    views: [{
      title: 'All sections',
      fields: ['LinkTitle', 'SectionDays', 'SectionBefore', 'SectionColour', 'SectionOrder'],
      query: '<OrderBy><FieldRef Name="SectionOrder" /></OrderBy>',
      rowLimit: 100
    }],
    starterRows: STARTER_SECTIONS.map((x, i) => ({
      Title: x.name, SectionDays: x.days, SectionBefore: x.before, SectionColour: x.colour, SectionOrder: i + 1
    }))
  },
  {
    key: 'columns',
    urlName: 'OnboardingColumns',
    title: TITLES.columns,
    description: 'The columns on every new starter\'s board, left to right. Tasks start in the first. ' +
      'One row per column.',
    titleColumn: 'Column',
    hidden: true,
    searchable: false,
    keepVersions: true,
    access: 'site',
    team: true,
    fields: [
      count('ColumnOrder', 'Order', { hint: 'Lower numbers sit further left.' }),
      yesNo('ColumnFinished', 'Counts as finished', false, { hint: 'Tasks here count as done.' })
    ],
    views: [{
      title: 'All columns',
      fields: ['LinkTitle', 'ColumnOrder', 'ColumnFinished'],
      query: '<OrderBy><FieldRef Name="ColumnOrder" /></OrderBy>',
      rowLimit: 100
    }],
    starterRows: STARTER_COLUMNS.map((x, i) => ({ Title: x.name, ColumnOrder: i + 1, ColumnFinished: x.finished }))
  },
  {
    key: 'tasks',
    urlName: 'OnboardingTasks',
    title: TITLES.tasks,
    description: 'What every new starter does, and the jobs others do for them, like ordering a laptop. ' +
      'One row per task.',
    titleColumn: 'Task',
    hidden: true,
    searchable: false,
    keepVersions: true,
    access: 'site',
    team: true,
    fields: [
      note('TaskDetails', 'Details', 4),
      lookup('TaskSection', 'Section', 'sections', { hint: 'Which part of the checklist it is in.' }),
      count('TaskOrder', 'Order', { hint: 'Lower numbers come first within the same section.' }),
      text('TaskLink', 'Link', 255, { hint: 'A web address to open, if there is one.' }),
      yesNo('TaskActive', 'Active', true, { hint: 'Turn off to take it off the checklist without deleting it.' }),
      people('TaskOwners', 'Owners', {
        hint: 'Who does it for each new starter, like someone in IT. Empty for the new starter to do it themselves.'
      })
    ],
    views: [{
      title: 'All tasks',
      fields: ['LinkTitle', 'TaskSection', 'TaskOrder', 'TaskOwners', 'TaskLink', 'TaskActive'],
      query: '<OrderBy><FieldRef Name="TaskOrder" /><FieldRef Name="Title" /></OrderBy>',
      rowLimit: 100
    }]
  },
  {
    key: 'starters',
    urlName: 'OnboardingStarters',
    title: TITLES.starters,
    description: 'Who is starting, who their manager is and when they start. One row per person.',
    titleColumn: 'Name',
    hidden: true,
    searchable: false,
    keepVersions: true,
    access: 'site',
    team: true,
    fields: [
      person('StarterPerson', 'Person', { required: true }),
      person('StarterManager', 'Manager'),
      // Days are kept as text like 2026-10-15, so one never moves a day for someone in another time zone.
      text('StartDate', 'Start date', 10, { hint: 'Their first day, written like 2026-10-15.' }),
      yesNo('StarterArchived', 'Archived', false, { hint: 'Turn on to take them off the onboarding page.' })
    ],
    views: [{
      title: 'All starters',
      fields: ['LinkTitle', 'StarterPerson', 'StarterManager', 'StartDate', 'StarterArchived'],
      query: '<OrderBy><FieldRef Name="StartDate" Ascending="FALSE" /></OrderBy>',
      rowLimit: 100
    }]
  },
  {
    key: 'progress',
    urlName: 'OnboardingProgress',
    title: TITLES.progress,
    description: 'Where each task sits on each new starter\'s board. The newest row for a task counts. The task ' +
      'name is as it was at the time.',
    titleColumn: 'Task',
    hidden: true,
    searchable: false,
    // Old copies of each move would only fill the list.
    keepVersions: false,
    access: 'addOwn',
    team: true,
    fields: [
      lookup('ProgressStarter', 'New starter', 'starters', { required: true }),
      lookup('ProgressTask', 'Checklist task', 'tasks', { required: true }),
      // Empty counts as finished: rows from before the board had columns were all ticks.
      lookup('ProgressColumn', 'Board column', 'columns', { hint: 'Where the task sits on their board.' }),
      // Where it was dropped within its column. Empty keeps it in checklist order.
      decimal('ProgressRank', 'Place in column', { hidden: true })
    ],
    views: [{
      title: 'All progress',
      fields: ['ProgressStarter', 'LinkTitle', 'ProgressColumn', 'Author', 'Created'],
      query: '<OrderBy><FieldRef Name="ID" Ascending="FALSE" /></OrderBy>',
      rowLimit: 100
    }]
  }
];

export const listDef = (key: ListKey): IListDef => {
  const def = TOOL_LISTS.find(l => l.key === key);
  if (!def) throw new Error(`No list called ${key}`);
  return def;
};
