import type { ITaskDraft } from './taskForm';
import type { ISection } from './types';
import type { IPersonPick } from './starterForm';
import type { ISectionDraft } from './setupForms';
import { STARTER_SECTIONS } from '../setup/schema';
import { SAMPLE_TASKS } from '../strings/samples';

const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The starting sections the starter set needs that the site doesn't have,
 * like Before they start on a site set up before it existed. Each goes in
 * ahead of the sections already there.
 */
export function sectionsForSamples(sections: ISection[]): ISectionDraft[] {
  const first = sections.reduce((least, s) => Math.min(least, s.order), Infinity);
  const order = isFinite(first) ? Math.max(first - 1, 0) : 1;
  return STARTER_SECTIONS
    .filter(x => SAMPLE_TASKS.some(t => sameName(t.when, x.name)) && !sections.some(s => sameName(s.name, x.name)))
    .map(x => ({ name: x.name, days: String(x.days), before: x.before, colour: x.colour, order }));
}

/**
 * The starter set of tasks as forms ready to save, numbered 1, 2, 3… within
 * each section in the order they're written. Each goes in the section with
 * the name it gives, or none if the team has renamed or taken that one away.
 * The jobs before they start are done by `you`, whoever is adding them.
 */
export function sampleDrafts(sections: ISection[], you?: IPersonPick): ITaskDraft[] {
  const counts: Record<string, number> = {};
  const sectionFor = (name: string): number | undefined =>
    sections.filter(s => sameName(s.name, name)).map(s => s.id)[0];
  return SAMPLE_TASKS.map(s => {
    counts[s.when] = (counts[s.when] || 0) + 1;
    return {
      title: s.title,
      details: s.details,
      sectionId: sectionFor(s.when),
      order: String(counts[s.when]),
      link: s.link,
      active: true,
      owners: s.byYou && you ? [{ ...you }] : []
    };
  });
}
