import * as React from 'react';
import { css } from '@fluentui/react';
import styles from './Checklist.module.scss';
import type { IBoard, IBoardColumn, IStarter } from '../data/types';
import { IJob, fractionDone, jobsFor, lanesFor, progressOf } from '../data/checklist';
import { dayText } from '../data/dates';
import { forStarter } from '../data/taskForm';
import { CHECKLIST, MY_TASKS } from '../strings/checklist';
import Board, { IBoardCard } from './Board';

export interface IMyTasksPageProps {
  board: IBoard;
  /** The person looking, by their ID on this site. */
  userId: number;
  /** Everyone still being onboarded. */
  starters: IStarter[];
  /** Like 2026-10-15, for what's late. */
  today: string;
  onMove: (job: IJob, to: IBoardColumn, rank: number) => Promise<void>;
}

/*
 * The jobs someone does for new starters, like ordering a laptop, on one board
 * across everyone being onboarded: soonest due first.
 */
const MyTasksPage: React.FC<IMyTasksPageProps> = ({ board, userId, starters, today, onMove }) => {
  const jobs = jobsFor(userId, board, starters, today);
  const progress = progressOf(jobs);
  const finished = progress.total > 0 && progress.done >= progress.total;
  const lanes = lanesFor(jobs, board.columns).map(({ column, items }) => ({
    column,
    cards: items.map((job): IBoardCard<IJob> => {
      const start = dayText(job.starter.startDate);
      return {
        key: `${job.starter.id}-${job.task.id}`,
        item: job,
        title: forStarter(job.task.title, job.starter.name),
        details: forStarter(job.task.details, job.starter.name),
        note: start ? MY_TASKS.forWhoStarting(job.starter.name, start) : MY_TASKS.forWho(job.starter.name)
      };
    })
  }));

  return (
    <div className={styles.checklist}>
      <h2>{MY_TASKS.title}</h2>
      <div className={styles.meta}><span>{MY_TASKS.intro}</span></div>

      {jobs.length === 0 ? (
        <p>{MY_TASKS.none}</p>
      ) : lanes.length === 0 ? (
        <p>{CHECKLIST.noColumns}</p>
      ) : (
        <>
          <div className={css(styles.summary, finished && styles.barDone)}>
            <div className={styles.summaryLine}>
              <span>{finished ? MY_TASKS.allDone : CHECKLIST.progress(progress.done, progress.total)}</span>
              {progress.overdue > 0 && <span className={styles.lateCount}>{CHECKLIST.late(progress.overdue)}</span>}
            </div>
            <div
              className={styles.bar} role="progressbar" aria-label={CHECKLIST.progress(progress.done, progress.total)}
              aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}
            >
              <div className={styles.barFill} style={{ width: `${Math.round(fractionDone(progress) * 100)}%` }} />
            </div>
          </div>

          <Board
            lanes={lanes} idPrefix="my-tasks" canMove={() => true}
            onMove={(card, to, rank) => onMove(card.item, to, rank)}
          />
        </>
      )}
    </div>
  );
};

export default MyTasksPage;
