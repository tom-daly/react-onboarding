/*
 * What the person looking gets, from who they are: their own checklist if
 * they're a new starter, their people if they manage any, and the pages for
 * running onboarding if they're on the Onboarding Team or own the site.
 * Someone can be several at once.
 */
import type { IStarter, ITask } from './types';

/** The pages along the top, in the order they show. */
export type Tab = 'mine' | 'myTasks' | 'myTeam' | 'starters' | 'tasks' | 'setup' | 'team';

export interface IRoles {
  /** Their own new starter row, when they have one that isn't archived. */
  me?: IStarter;
  /** The new starters they manage, not archived, in start date order. */
  myTeam: IStarter[];
  /** They own a task on the checklist, like someone in IT who orders laptops, so they get My tasks. */
  hasJobs: boolean;
  /** Site owners and the Onboarding Team: they add new starters and change the checklist. */
  canRun: boolean;
}

/** New starters still being onboarded, soonest start first; those with no start date at the end. */
export function current(starters: IStarter[]): IStarter[] {
  return starters.filter(s => !s.archived).sort((a, b) =>
    (a.startDate || '9999').localeCompare(b.startDate || '9999') || a.name.localeCompare(b.name));
}

export function rolesFor(starters: IStarter[], userId: number, canRun: boolean, tasks: ITask[] = []): IRoles {
  const active = current(starters);
  // Someone on twice, say after coming back, gets the checklist that started last.
  const mine = active.filter(s => !!s.person && s.person.id === userId);
  return {
    me: mine.length ? mine[mine.length - 1] : undefined,
    myTeam: active.filter(s => !!s.manager && s.manager.id === userId && !(s.person && s.person.id === userId)),
    hasJobs: tasks.some(t => t.active && t.owners.some(o => o.id === userId)),
    canRun
  };
}

/** The pages this person gets. Empty means there's nothing here for them. */
export function tabsFor(roles: IRoles): Tab[] {
  const tabs: Tab[] = [];
  if (roles.me) tabs.push('mine');
  if (roles.hasJobs) tabs.push('myTasks');
  if (roles.myTeam.length) tabs.push('myTeam');
  if (roles.canRun) tabs.push('starters', 'tasks', 'setup', 'team');
  return tabs;
}
