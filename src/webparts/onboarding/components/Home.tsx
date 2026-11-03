import * as React from 'react';
import { MessageBar, MessageBarType, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './Onboarding.module.scss';
import pageStyles from './Pages.module.scss';
import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { ISiteInfo, IProblem } from '../setup/problems';
import type { IBoard, IBoardColumn, IStarter, ITask, ITick } from '../data/types';
import { Tab, current, rolesFor, tabsFor } from '../data/roles';
import { isStartersOwn, ownsTask } from '../data/checklist';
import { addTasks, addTick, loadBoard, saveOrders, saveSection, setArchived, setTickColumn } from '../data/board';
import { moveRow } from '../data/setupForms';
import { sampleDrafts, sectionsForSamples } from '../data/samples';
import { today as todayIs } from '../data/dates';
import { explain } from '../setup/errors';
import { useLoad } from './useLoad';
import type { INotice } from './notice';
import { scrollToTopIfPast } from './scrollToTopIfPast';
import Nav from './Nav';
import Checklist from './Checklist';
import MyTasksPage from './MyTasksPage';
import StarterTable from './StarterTable';
import StartersPage from './StartersPage';
import StarterEditor from './StarterEditor';
import TasksPage from './TasksPage';
import TaskEditor from './TaskEditor';
import TeamPage from './TeamPage';
import BoardSetupPage from './BoardSetupPage';
import SectionEditor from './SectionEditor';
import ColumnEditor from './ColumnEditor';
import DevTools from './DevTools';
import LoadFailed from './LoadFailed';
import { LOAD_FAILED, NEEDS_IT, NOTHING_HERE } from '../strings/home';
import { MY_TEAM_PAGE, STARTER_COLUMNS, STARTER_FORM } from '../strings/starters';
import { TASKS_PAGE, TASK_FORM } from '../strings/tasks';
import { BOARD_SETUP } from '../strings/boardSetup';

export interface IHomeProps {
  sp: SPFI;
  site: ISiteInfo;
  ids: ListIds;
  /** Site owners and the Onboarding Team: they get the pages for running onboarding. */
  canRun: boolean;
  /** Only ever has anything for site owners. */
  needsIT: IProblem[];
  /** Shown once, straight after setup. */
  notice?: string;
}

/* What shows under the row of pages. */
type View =
  | { page: Tab }
  | { page: 'person'; starterId: number; back: Tab }
  | { page: 'starterEditor'; starterId?: number }
  | { page: 'taskEditor'; taskId?: number }
  | { page: 'sectionEditor'; sectionId?: number }
  | { page: 'columnEditor'; columnId?: number };

/* The page each view belongs under, so that one stays picked in the row. */
const tabOf = (view: View): Tab =>
  view.page === 'person' ? view.back
    : view.page === 'starterEditor' ? 'starters'
    : view.page === 'taskEditor' ? 'tasks'
    : view.page === 'sectionEditor' || view.page === 'columnEditor' ? 'setup'
    : view.page;

/* Changes whenever a different page shows, for the effect that brings it into view. */
const pageKey = (view: View | undefined): string =>
  !view ? '' : view.page === 'person' ? `person-${view.starterId}`
    : view.page === 'starterEditor' ? `starter-${String(view.starterId)}`
    : view.page === 'taskEditor' ? `task-${String(view.taskId)}`
    : view.page === 'sectionEditor' ? `section-${String(view.sectionId)}`
    : view.page === 'columnEditor' ? `column-${String(view.columnId)}`
    : view.page;

/*
 * Onboarding itself. Each person gets what applies to them: their own
 * checklist, the new starters they manage, and — for the Onboarding Team and
 * site owners — the pages for running it. The row of pages along the top only
 * shows when there's more than one.
 */
const Home: React.FC<IHomeProps> = ({ sp, site, ids, canRun, needsIT, notice }) => {
  const load = React.useCallback(() => loadBoard(sp, ids), [sp, ids]);
  const { data: board, error, setData: setBoard, reload } = useLoad<IBoard>(load);
  const [chosen, setChosen] = React.useState<View | undefined>();
  const [message, setMessage] = React.useState<INotice | undefined>(
    notice ? { type: MessageBarType.success, text: notice } : undefined);
  const [archiving, setArchiving] = React.useState<number | undefined>();
  const [addingSamples, setAddingSamples] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);
  const [gearOpen, setGearOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const focusContent = React.useRef(false);
  const today = todayIs();

  const roles = board ? rolesFor(board.starters, site.currentUserId, canRun, board.tasks) : undefined;
  const tabs = roles ? tabsFor(roles) : [];
  // Until someone picks a page, the first one they get.
  const view: View | undefined = chosen || (tabs.length ? { page: tabs[0] } : undefined);

  /* A new page starts at its top if the page had been scrolled past it. When it
     opened from anywhere but the row of pages, the button pressed has gone, so
     focus moves to the new page instead of getting lost. */
  const key = pageKey(view);
  React.useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    scrollToTopIfPast(root);
    if (!focusContent.current) return;
    focusContent.current = false;
    const active = document.activeElement;
    const placed = active instanceof HTMLElement && active !== content && content.contains(active) &&
      active.offsetParent !== null;
    if (!placed) content.focus({ preventScroll: true });
  }, [key]);

  const show = (next: View, fromNav = false): void => {
    focusContent.current = !fromNav;
    setMessage(undefined);
    setChosen(next);
  };

  /* Back to a page with a note on what just happened. */
  const showWith = (next: View, text: string): void => {
    show(next);
    setMessage({ type: MessageBarType.success, text });
  };

  /*
   * Moves a task to another column on a new starter's board. The newest row
   * for a task says where it is. Staff can only change rows they made, so a
   * new starter moving a card someone else placed adds a row of their own,
   * which then wins. Rows are never taken away here, so an older one never
   * comes back into play and the place a card was dropped at is kept, even
   * back in the first column.
   */
  const move = async (
    starter: IStarter, task: ITask, tick: ITick | undefined, to: IBoardColumn, rank: number
  ): Promise<void> => {
    if (!board) return;
    const canChange = !!tick && (canRun || tick.byId === site.currentUserId);

    if (tick && canChange) {
      await setTickColumn(sp, ids, tick.id, to.id, rank);
      setBoard(b => (b ? {
        ...b, ticks: b.ticks.map(t => (t.id === tick.id ? { ...t, columnId: to.id, rank } : t))
      } : b));
    } else {
      const added = await addTick(sp, ids, starter, task, site.currentUserId, to.id, rank);
      // Newest first, so the board picks this one.
      setBoard(b => (b ? { ...b, ticks: [added].concat(b.ticks) } : b));
    }
  };

  /* Moves a section up or down, or a column left or right, saving the new order. */
  const reorder = async (key: 'sections' | 'columns', id: number, by: -1 | 1): Promise<void> => {
    if (!board) return;
    const changes = key === 'sections' ? moveRow(board.sections, id, by) : moveRow(board.columns, id, by);
    if (!changes.length) return;
    setReordering(true);
    setMessage(undefined);
    try {
      await saveOrders(sp, ids, key, changes);
      const orderOf = (rowId: number, was: number): number => {
        const c = changes.filter(x => x.id === rowId)[0];
        return c ? c.order : was;
      };
      setBoard(b => (b ? {
        ...b,
        sections: key === 'sections' ? b.sections.map(s => ({ ...s, order: orderOf(s.id, s.order) })) : b.sections,
        columns: key === 'columns' ? b.columns.map(c => ({ ...c, order: orderOf(c.id, c.order) })) : b.columns
      } : b));
    } catch (e) {
      // Some may have saved, so show what's there now.
      await reload();
      setMessage({ type: MessageBarType.error, text: BOARD_SETUP.moveFailed(explain(e)) });
    } finally {
      setReordering(false);
    }
  };

  const archive = async (starter: IStarter, archived: boolean): Promise<void> => {
    setArchiving(starter.id);
    setMessage(undefined);
    try {
      await setArchived(sp, ids, starter.id, archived);
      setBoard(b => (b ? { ...b, starters: b.starters.map(s => (s.id === starter.id ? { ...s, archived } : s)) } : b));
      setMessage({
        type: MessageBarType.success,
        text: archived ? STARTER_COLUMNS.archived(starter.name) : STARTER_COLUMNS.broughtBack(starter.name)
      });
    } catch (e) {
      setMessage({ type: MessageBarType.error, text: STARTER_COLUMNS.archiveFailed(starter.name, explain(e)) });
    } finally {
      setArchiving(undefined);
    }
  };

  const addSamples = async (): Promise<void> => {
    setAddingSamples(true);
    setMessage(undefined);
    try {
      // A site set up before Before they start existed gets it first, so its jobs have a due day.
      let sections = board ? board.sections : [];
      const missing = sectionsForSamples(sections);
      for (const s of missing) await saveSection(sp, ids, s);
      if (missing.length) sections = (await loadBoard(sp, ids)).sections;
      // The jobs before they start are the person adding them's, so My tasks shows straight away.
      const you = { id: site.currentUserId, name: site.user.name, email: site.user.email };
      const drafts = sampleDrafts(sections, you);
      await addTasks(sp, ids, drafts);
      await reload();
      const jobs = drafts.filter(d => d.owners.length > 0).length;
      setMessage({ type: MessageBarType.success, text: TASKS_PAGE.samplesAdded(drafts.length, jobs) });
    } catch (e) {
      // Some may have gone in, so show what's there now.
      await reload();
      setMessage({ type: MessageBarType.error, text: explain(e) });
    } finally {
      setAddingSamples(false);
    }
  };

  /* Saved somewhere else on the page: load everything again, then go back with a note. */
  const savedThen = (next: View, text: string): void => {
    reload().then(() => showWith(next, text)).catch(() => undefined);
  };

  const openStarter = (s: IStarter, back: Tab): void => show({ page: 'person', starterId: s.id, back });

  const page = (b: IBoard, v: View): JSX.Element | undefined => {
    if (!roles) return undefined;
    switch (v.page) {
      case 'mine':
        return roles.me && (
          <Checklist
            starter={roles.me} board={b} today={today} isMine whose="own" canMove={() => true}
            onMove={(task, tick, to, rank) => move(roles.me as IStarter, task, tick, to, rank)}
          />
        );
      case 'myTasks':
        return (
          <MyTasksPage
            board={b} userId={site.currentUserId} starters={current(b.starters)} today={today}
            onMove={(job, to, rank) => move(job.starter, job.task, job.tick, to, rank)}
          />
        );
      case 'myTeam':
        return (
          <div className={pageStyles.page}>
            <div className={pageStyles.head}>
              <div>
                <h2>{MY_TEAM_PAGE.title}</h2>
                <p className={pageStyles.intro}>{MY_TEAM_PAGE.intro}</p>
              </div>
            </div>
            <StarterTable
              starters={roles.myTeam} board={b} today={today} showManager={false}
              onOpen={s => openStarter(s, 'myTeam')}
            />
          </div>
        );
      case 'starters':
        return (
          <StartersPage
            board={b} today={today} busyId={archiving}
            onOpen={s => openStarter(s, 'starters')}
            onAdd={() => show({ page: 'starterEditor' })}
            onEdit={s => show({ page: 'starterEditor', starterId: s.id })}
            onArchive={(s, archived) => { archive(s, archived).catch(() => undefined); }}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            tasks={b.tasks} sections={b.sections} addingSamples={addingSamples}
            onEdit={t => show({ page: 'taskEditor', taskId: t ? t.id : undefined })}
            onAddSamples={() => { addSamples().catch(() => undefined); }}
          />
        );
      case 'setup':
        return (
          <BoardSetupPage
            board={b} busy={reordering}
            onEditSection={s => show({ page: 'sectionEditor', sectionId: s ? s.id : undefined })}
            onEditColumn={c => show({ page: 'columnEditor', columnId: c ? c.id : undefined })}
            onMove={(key, id, by) => { reorder(key, id, by).catch(() => undefined); }}
          />
        );
      case 'team':
        return <TeamPage sp={sp} site={site} />;
      case 'person': {
        const starter = b.starters.filter(s => s.id === v.starterId)[0];
        if (!starter) return undefined;
        const isMe = !!starter.person && starter.person.id === site.currentUserId;
        // Their own board keeps the jobs others do for them out of sight, even here.
        return (
          <Checklist
            starter={starter} board={b} today={today} isMine={false} whose={isMe ? 'own' : 'all'}
            canMove={task => roles.canRun || (isMe && isStartersOwn(task)) || ownsTask(task, site.currentUserId)}
            onMove={(task, tick, to, rank) => move(starter, task, tick, to, rank)}
            onBack={() => show({ page: v.back })}
          />
        );
      }
      case 'starterEditor':
        return (
          <StarterEditor
            sp={sp} ids={ids} board={b} today={today} starterId={v.starterId}
            onSaved={(name, added) => savedThen({ page: 'starters' }, added ? STARTER_FORM.added(name) : STARTER_FORM.saved(name))}
            onCancel={() => show({ page: 'starters' })}
          />
        );
      case 'taskEditor':
        return (
          <TaskEditor
            sp={sp} ids={ids} tasks={b.tasks} sections={b.sections} taskId={v.taskId}
            onSaved={(title, added) => savedThen({ page: 'tasks' }, added ? TASK_FORM.added(title) : TASK_FORM.saved(title))}
            onDeleted={title => savedThen({ page: 'tasks' }, TASK_FORM.deleted(title))}
            onCancel={() => show({ page: 'tasks' })}
          />
        );
      case 'sectionEditor':
        return (
          <SectionEditor
            sp={sp} ids={ids} board={b} sectionId={v.sectionId}
            onSaved={text => savedThen({ page: 'setup' }, text)}
            onCancel={() => show({ page: 'setup' })}
          />
        );
      case 'columnEditor':
        return (
          <ColumnEditor
            sp={sp} ids={ids} board={b} columnId={v.columnId}
            onSaved={text => savedThen({ page: 'setup' }, text)}
            onCancel={() => show({ page: 'setup' })}
          />
        );
    }
  };

  return (
    <div ref={rootRef}>
      {view && (tabs.length > 1 || site.devTools) && (
        <Nav
          tabs={tabs.length > 1 ? tabs : []} current={tabOf(view)} onGo={t => show({ page: t }, true)}
          onGear={site.devTools ? () => setGearOpen(true) : undefined}
        />
      )}

      {site.devTools && board && (
        <DevTools
          sp={sp} ids={ids} board={board} userId={site.currentUserId}
          open={gearOpen} onClose={() => setGearOpen(false)}
          onChanged={async text => {
            await reload();
            setMessage({ type: MessageBarType.success, text });
          }}
        />
      )}

      {site.isOwner && needsIT.length > 0 && (
        <MessageBar messageBarType={MessageBarType.warning} isMultiline>
          <strong>{NEEDS_IT.lead}</strong>{' '}{NEEDS_IT.ask}
          <ul>{needsIT.map((p, i) => <li key={i}>{p.text}</li>)}</ul>
        </MessageBar>
      )}

      {message && (
        <MessageBar messageBarType={message.type} isMultiline onDismiss={() => setMessage(undefined)}>
          {message.text}
        </MessageBar>
      )}

      <div ref={contentRef} tabIndex={-1} className={pageStyles.content}>
        {!board && !error && <Spinner size={SpinnerSize.medium} />}
        {!board && error && (
          <LoadFailed lead={LOAD_FAILED.board} error={error} onRetry={() => { reload().catch(() => undefined); }} />
        )}
        {/* Loaded before, but not this time: what's showing may be out of date. */}
        {board && error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline>{LOAD_FAILED.message(LOAD_FAILED.board, error)}</MessageBar>
        )}
        {board && view && page(board, view)}
        {board && !view && (
          <div className={styles.notice}>
            <h2>{NOTHING_HERE.title}</h2>
            <p>{NOTHING_HERE.body}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
