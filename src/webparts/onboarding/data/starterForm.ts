/*
 * Adding or changing a new starter: the form's contents, and what stops it
 * saving. Plain logic, nothing that talks to the site.
 */
import type { IStarter } from './types';
import { isIsoDate } from './dates';
import { STARTER_CHECKS } from '../strings/starters';

/** Someone picked in a person box. A person already on the row has their site ID; a new pick has a login. */
export interface IPersonPick {
  id?: number;
  /** How SharePoint knows them, like i:0#.f|membership|megan@example.com. Only for someone just picked. */
  login?: string;
  name: string;
  email: string;
}

export interface IStarterDraft {
  /** Their row. Undefined for someone new. */
  id?: number;
  person?: IPersonPick;
  manager?: IPersonPick;
  /** Like 2026-10-15. */
  startDate: string;
  archived: boolean;
}

export const blankStarter = (startDate: string): IStarterDraft => ({ startDate, archived: false });

export const draftFromStarter = (s: IStarter): IStarterDraft => ({
  id: s.id,
  person: s.person ? { ...s.person } : undefined,
  manager: s.manager ? { ...s.manager } : undefined,
  startDate: s.startDate,
  archived: s.archived
});

/** The same person, by their site ID when both have one, otherwise by email. */
export function samePerson(a: IPersonPick | undefined, b: IPersonPick | undefined): boolean {
  if (!a || !b) return false;
  if (a.id !== undefined && b.id !== undefined) return a.id === b.id;
  return !!a.email && a.email.toLowerCase() === (b.email || '').toLowerCase();
}

/** Why the form can't save as it is, or undefined if it can. `starters` is everyone already on the list. */
export function checkStarter(draft: IStarterDraft, starters: IStarter[]): string | undefined {
  if (!draft.person) return STARTER_CHECKS.pickPerson;
  if (!isIsoDate(draft.startDate)) return STARTER_CHECKS.pickStartDate;
  if (samePerson(draft.person, draft.manager)) return STARTER_CHECKS.ownManager;
  const already = starters.filter(s => s.id !== draft.id && !s.archived && samePerson(s.person, draft.person))[0];
  if (already && !draft.archived) return STARTER_CHECKS.alreadyStarting(draft.person.name);
  return undefined;
}
