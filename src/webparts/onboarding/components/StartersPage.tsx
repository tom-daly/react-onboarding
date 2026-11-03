import * as React from 'react';
import { PrimaryButton, Toggle } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { IBoard, IStarter } from '../data/types';
import { current } from '../data/roles';
import { STARTERS_PAGE } from '../strings/starters';
import StarterTable from './StarterTable';

export interface IStartersPageProps {
  board: IBoard;
  today: string;
  onOpen: (s: IStarter) => void;
  onAdd: () => void;
  onEdit: (s: IStarter) => void;
  onArchive: (s: IStarter, archived: boolean) => void;
  busyId?: number;
}

/* Archived, newest first: the people most likely to be looked for again. */
const archivedOnes = (starters: IStarter[]): IStarter[] =>
  starters.filter(s => s.archived).sort((a, b) => b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name));

/* Everyone being onboarded, for the Onboarding Team: add, change, archive, open. */
const StartersPage: React.FC<IStartersPageProps> = ({ board, today, onOpen, onAdd, onEdit, onArchive, busyId }) => {
  const [showArchived, setShowArchived] = React.useState(false);
  const shown = showArchived ? archivedOnes(board.starters) : current(board.starters);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h2>{STARTERS_PAGE.title}</h2>
          <p className={styles.intro}>{STARTERS_PAGE.intro}</p>
        </div>
        <PrimaryButton iconProps={{ iconName: 'AddFriend' }} text={STARTERS_PAGE.add} onClick={onAdd} />
      </div>

      <div className={styles.tools}>
        <span>{STARTERS_PAGE.count(shown.length)}</span>
        <Toggle
          inlineLabel label={STARTERS_PAGE.showArchived} checked={showArchived}
          onChange={(e, on) => setShowArchived(!!on)}
        />
      </div>

      {shown.length === 0 ? (
        <p className={styles.nothing}>{showArchived ? STARTERS_PAGE.noneArchived : STARTERS_PAGE.none}</p>
      ) : (
        <StarterTable
          starters={shown} board={board} today={today} showManager
          onOpen={onOpen} onEdit={onEdit} onArchive={onArchive} busyId={busyId}
        />
      )}
    </div>
  );
};

export default StartersPage;
