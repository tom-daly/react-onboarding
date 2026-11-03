import * as React from 'react';
import { DefaultButton, IconButton, css } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { IBoard, IStarter } from '../data/types';
import { fractionDone, progressFor, stageOf } from '../data/checklist';
import { dayText } from '../data/dates';
import { CHECKLIST } from '../strings/checklist';
import { COMMON } from '../strings/common';
import { STARTER_COLUMNS } from '../strings/starters';

export interface IStarterTableProps {
  starters: IStarter[];
  board: IBoard;
  /** Like 2026-10-15, for what's late. */
  today: string;
  /** Show who manages each one. Left out on My team, where it's always the person looking. */
  showManager: boolean;
  onOpen: (s: IStarter) => void;
  /** The Onboarding Team's buttons: change and archive. Missing on My team. */
  onEdit?: (s: IStarter) => void;
  onArchive?: (s: IStarter, archived: boolean) => void;
  /** A row whose archiving is saving, so its buttons wait. */
  busyId?: number;
}

/* New starters in a table: who, when they start, how far along and how much is late. */
const StarterTable: React.FC<IStarterTableProps> = ({
  starters, board, today, showManager, onOpen, onEdit, onArchive, busyId
}) => (
  <div className={styles.tableScroll}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">{STARTER_COLUMNS.name}</th>
          {showManager && <th scope="col">{STARTER_COLUMNS.manager}</th>}
          <th scope="col">{STARTER_COLUMNS.starts}</th>
          <th scope="col">{STARTER_COLUMNS.progress}</th>
          <th scope="col">{STARTER_COLUMNS.overdue}</th>
          {(onEdit || onArchive) && <th scope="col"><span className={styles.srOnly}>{STARTER_COLUMNS.actions}</span></th>}
        </tr>
      </thead>
      <tbody>
        {starters.map(s => {
          const p = progressFor(s, board, today);
          const stage = stageOf(s, p, today);
          return (
            <tr key={s.id}>
              <td className={styles.nameCell}>
                <button
                  type="button" className={css(styles.linkButton, styles.name)}
                  aria-label={STARTER_COLUMNS.open(s.name)} onClick={() => onOpen(s)}
                >
                  {s.name}
                </button>
                {s.person && s.person.email && <div className={styles.small}>{s.person.email}</div>}
              </td>
              {showManager && <td>{s.manager ? s.manager.name : COMMON.none}</td>}
              <td>{dayText(s.startDate) || COMMON.none}</td>
              <td className={styles.progressCell}>
                <span className={css(styles.bar, stage === 'finished' && styles.barDone)} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${Math.round(fractionDone(p) * 100)}%` }} />
                </span>
                <span className={styles.small}>
                  {stage === 'finished' ? STARTER_COLUMNS.finished
                    : stage === 'upcoming' && p.done === 0 ? STARTER_COLUMNS.upcoming
                    : CHECKLIST.progress(p.done, p.total)}
                </span>
              </td>
              <td>
                <span className={css(styles.badge, p.overdue > 0 && styles.badgeLate)}>
                  {p.overdue > 0 ? p.overdue : STARTER_COLUMNS.nothingLate}
                </span>
              </td>
              {(onEdit || onArchive) && (
                <td>
                  <div className={styles.rowActions}>
                    {onEdit && (
                      <IconButton
                        iconProps={{ iconName: 'Edit' }} title={STARTER_COLUMNS.edit(s.name)}
                        ariaLabel={STARTER_COLUMNS.edit(s.name)} disabled={busyId === s.id}
                        onClick={() => onEdit(s)}
                      />
                    )}
                    {onArchive && (
                      <DefaultButton
                        text={s.archived ? STARTER_COLUMNS.bringBack : STARTER_COLUMNS.archive}
                        ariaLabel={s.archived ? STARTER_COLUMNS.bringBackLabel(s.name) : STARTER_COLUMNS.archiveLabel(s.name)}
                        disabled={busyId === s.id}
                        onClick={() => onArchive(s, !s.archived)}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default StarterTable;
