/*
 * Adding or changing a task: the form's contents, and what stops it saving.
 * Plain logic, nothing that talks to the site.
 */
import type { ITask } from './types';
import type { IPersonPick } from './starterForm';
import { TASK_CHECKS } from '../strings/tasks';

export interface ITaskDraft {
  /** Its row. Undefined for a new task. */
  id?: number;
  title: string;
  details: string;
  /** Its section, by ID. Undefined for none. */
  sectionId?: number;
  /** As typed, so the box can be empty while someone changes it. */
  order: string;
  link: string;
  active: boolean;
  /** Who does it for each new starter. Empty for the new starter themselves. */
  owners: IPersonPick[];
}

/** One more than the highest order number in that section, so a new task goes at the end. */
export function nextOrder(tasks: ITask[], sectionId: number | undefined): number {
  return tasks.filter(t => t.sectionId === sectionId).reduce((most, t) => Math.max(most, t.order), 0) + 1;
}

/** A new task in the given section. */
export const blankTask = (tasks: ITask[], sectionId?: number): ITaskDraft => ({
  title: '',
  details: '',
  sectionId,
  order: String(nextOrder(tasks, sectionId)),
  link: '',
  active: true,
  owners: []
});

export const draftFromTask = (t: ITask): ITaskDraft => ({
  id: t.id,
  title: t.title,
  details: t.details,
  sectionId: t.sectionId,
  order: String(t.order),
  link: t.link,
  active: t.active,
  owners: t.owners.map(o => ({ ...o }))
});

/** A web address someone can open: starts with http:// or https://. */
export const isWebAddress = (v: string): boolean => /^https?:\/\/\S+$/i.test(v.trim());

/** Why the form can't save as it is, or undefined if it can. */
export function checkTask(draft: ITaskDraft): string | undefined {
  if (!draft.title.trim()) return TASK_CHECKS.nameIt;
  if (draft.title.trim().length > 255) return TASK_CHECKS.nameTooLong;
  if (!/^\d+$/.test(draft.order.trim())) return TASK_CHECKS.orderNumber;
  if (draft.link.trim() && !isWebAddress(draft.link)) return TASK_CHECKS.linkAddress;
  if (draft.link.trim().length > 255) return TASK_CHECKS.linkTooLong;
  return undefined;
}

/** The row to save, from a form that passed checkTask, with its owners' IDs on this site. */
export const rowFromDraft = (draft: ITaskDraft, ownerIds: number[]): Record<string, unknown> => ({
  Title: draft.title.trim(),
  TaskDetails: draft.details.trim(),
  TaskSectionId: draft.sectionId ?? null,
  TaskOrder: Number(draft.order.trim()),
  TaskLink: draft.link.trim(),
  TaskActive: draft.active,
  TaskOwnersId: ownerIds
});

/** The task's own words for one new starter: {{onboardee}} becomes their name. */
export const forStarter = (words: string, name: string): string =>
  words.replace(/\{\{\s*onboardee\s*\}\}/gi, name);
