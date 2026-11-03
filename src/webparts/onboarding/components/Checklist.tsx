import * as React from 'react';
import { MessageBar, MessageBarType, css } from '@fluentui/react';
import styles from './Checklist.module.scss';
import type { IBoard, IBoardColumn, IStarter, ITask, ITick } from '../data/types';
import { Whose, checklistFor, columnsFor, fractionDone } from '../data/checklist';
import { dayText } from '../data/dates';
import { forStarter } from '../data/taskForm';
import { inWords } from '../data/text';
import { CHECKLIST } from '../strings/checklist';
import Board, { IBoardCard } from './Board';
import BackLink from './BackLink';
import Celebration from './Celebration';

export interface IChecklistProps {
  starter: IStarter;
  board: IBoard;
  /** Like 2026-10-15, for what's late. */
  today: string;
  /** Their own checklist, rather than someone else's opened from a list. */
  isMine: boolean;
  /** Only what the new starter does themselves, or everything done for them. */
  whose: Whose;
  /** Whether the person looking can move this task. Everyone else only looks. */
  canMove: (task: ITask) => boolean;
  /**
   * Moves a task to a column, at `rank` within it (see rankAt). `tick` is
   * undefined for one that has never been moved.
   */
  onMove: (task: ITask, tick: ITick | undefined, to: IBoardColumn, rank: number) => Promise<void>;
  /** Back to the list it was opened from. Missing on someone's own checklist. */
  onBack?: () => void;
}

/*
 * A new starter's checklist as a board: how far along they are, then the
 * columns the Onboarding Team set up.
 */
const Checklist: React.FC<IChecklistProps> = props => {
  const { starter, board, today, isMine, whose, canMove, onMove, onBack } = props;
  // A finished new starter can bring their board back after the celebration.
  const [showBoard, setShowBoard] = React.useState(false);

  const list = checklistFor(starter, board, today, whose);
  const lanes = columnsFor(list, board.columns).map(({ column, items }) => ({
    column,
    cards: items.map((item): IBoardCard => ({
      key: String(item.task.id),
      item,
      title: forStarter(item.task.title, starter.name),
      details: forStarter(item.task.details, starter.name),
      note: item.task.owners.length ? CHECKLIST.ownedBy(inWords(item.task.owners.map(o => o.name))) : undefined
    }))
  }));
  const anyMovable = list.groups.some(g => g.items.some(i => canMove(i.task)));
  const finished = list.total > 0 && list.done >= list.total;
  const start = dayText(starter.startDate);

  return (
    <div className={styles.checklist}>
      {onBack && <BackLink text={CHECKLIST.back} onClick={onBack} />}

      <h2>{isMine ? CHECKLIST.myTitle : CHECKLIST.theirTitle(starter.name)}</h2>
      <div className={styles.meta}>
        {isMine && <span>{CHECKLIST.welcome(starter.name)}</span>}
        <span>
          {!start ? CHECKLIST.noStartDate : today < starter.startDate ? CHECKLIST.startsOn(start) : CHECKLIST.started(start)}
        </span>
        {!isMine && starter.manager && <span>{CHECKLIST.managedBy(starter.manager.name)}</span>}
      </div>

      {!anyMovable && list.total > 0 && <MessageBar messageBarType={MessageBarType.info}>{CHECKLIST.readOnly}</MessageBar>}

      {list.total === 0 ? (
        <p>{CHECKLIST.noTasks}</p>
      ) : isMine && finished && !showBoard ? (
        <Celebration name={starter.name} onShowBoard={() => setShowBoard(true)} />
      ) : lanes.length === 0 ? (
        <p>{CHECKLIST.noColumns}</p>
      ) : (
        <>
          <div className={css(styles.summary, finished && styles.barDone)}>
            <div className={styles.summaryLine}>
              <span>{finished ? CHECKLIST.allDone : CHECKLIST.progress(list.done, list.total)}</span>
              {list.overdue > 0 && <span className={styles.lateCount}>{CHECKLIST.late(list.overdue)}</span>}
            </div>
            <div
              className={styles.bar} role="progressbar" aria-label={CHECKLIST.progress(list.done, list.total)}
              aria-valuemin={0} aria-valuemax={list.total} aria-valuenow={list.done}
            >
              <div className={styles.barFill} style={{ width: `${Math.round(fractionDone(list) * 100)}%` }} />
            </div>
          </div>

          <Board
            lanes={lanes} idPrefix={`col-${starter.id}`}
            canMove={card => canMove(card.item.task)}
            onMove={(card, to, rank) => onMove(card.item.task, card.item.tick, to, rank)}
          />
        </>
      )}
    </div>
  );
};

export default Checklist;
