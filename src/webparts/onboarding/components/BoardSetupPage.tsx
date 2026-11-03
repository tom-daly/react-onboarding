import * as React from 'react';
import { IconButton, MessageBar, MessageBarType, PrimaryButton, DefaultButton, css } from '@fluentui/react';
import pageStyles from './Pages.module.scss';
import styles from './BoardSetup.module.scss';
import type { IBoard, IBoardColumn, ISection } from '../data/types';
import { inOrder, isFinished } from '../data/checklist';
import { hasFinishLine } from '../data/setupForms';
import { BOARD_SETUP } from '../strings/boardSetup';
import { toneOf, tones } from './tone';

export interface IBoardSetupPageProps {
  board: IBoard;
  /** A section or column is moving, so the arrows wait. */
  busy: boolean;
  /** Opens the form: undefined to add one. */
  onEditSection: (section?: ISection) => void;
  onEditColumn: (column?: IBoardColumn) => void;
  /** Moves a section up (-1) or down (+1), or a column left (-1) or right (+1). */
  onMove: (key: 'sections' | 'columns', id: number, by: -1 | 1) => void;
}

/* Where the Onboarding Team sets up the parts of the checklist and the columns on every board. */
const BoardSetupPage: React.FC<IBoardSetupPageProps> = ({ board, busy, onEditSection, onEditColumn, onMove }) => {
  const sections = inOrder(board.sections);
  const columns = inOrder(board.columns);
  const taskCount = (s: ISection): number => board.tasks.filter(t => t.sectionId === s.id).length;
  const dueText = (s: ISection): string =>
    s.days === undefined ? BOARD_SETUP.noDue : s.days === 0 ? BOARD_SETUP.dueOnDay
      : s.before ? BOARD_SETUP.dueBefore(s.days) : BOARD_SETUP.dueAfter(s.days);

  return (
    <div className={css(pageStyles.page, styles.setup)}>
      <div className={pageStyles.head}>
        <div>
          <h2>{BOARD_SETUP.title}</h2>
          <p className={pageStyles.intro}>{BOARD_SETUP.intro}</p>
        </div>
      </div>

      <section className={styles.block} aria-labelledby="setup-sections">
        <div className={styles.blockHead}>
          <div>
            <h3 id="setup-sections">{BOARD_SETUP.sectionsTitle}</h3>
            <p>{BOARD_SETUP.sectionsIntro}</p>
          </div>
          <PrimaryButton iconProps={{ iconName: 'Add' }} text={BOARD_SETUP.addSection} onClick={() => onEditSection()} />
        </div>
        {sections.length === 0 ? (
          <p className={styles.empty}>{BOARD_SETUP.noSections}</p>
        ) : (
          <ul className={styles.rows}>
            {sections.map((s, i) => (
              <li key={s.id} className={css(styles.row, toneOf(s))}>
                <span className={styles.rowName}><span className={tones.pill}>{s.name}</span></span>
                <span className={styles.small}>{dueText(s)}</span>
                <span className={styles.small}>{BOARD_SETUP.taskCount(taskCount(s))}</span>
                <span className={styles.rowActions}>
                  <IconButton
                    iconProps={{ iconName: 'ChevronUp' }} disabled={busy || i === 0}
                    title={BOARD_SETUP.moveUp(s.name)} ariaLabel={BOARD_SETUP.moveUp(s.name)}
                    onClick={() => onMove('sections', s.id, -1)}
                  />
                  <IconButton
                    iconProps={{ iconName: 'ChevronDown' }} disabled={busy || i === sections.length - 1}
                    title={BOARD_SETUP.moveDown(s.name)} ariaLabel={BOARD_SETUP.moveDown(s.name)}
                    onClick={() => onMove('sections', s.id, 1)}
                  />
                  <IconButton
                    iconProps={{ iconName: 'Edit' }} title={BOARD_SETUP.edit(s.name)} ariaLabel={BOARD_SETUP.edit(s.name)}
                    onClick={() => onEditSection(s)}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.block} aria-labelledby="setup-columns">
        <div className={styles.blockHead}>
          <div>
            <h3 id="setup-columns">{BOARD_SETUP.columnsTitle}</h3>
            <p>{BOARD_SETUP.columnsIntro}</p>
          </div>
          <DefaultButton iconProps={{ iconName: 'Add' }} text={BOARD_SETUP.addColumn} onClick={() => onEditColumn()} />
        </div>
        {columns.length === 0 ? (
          <p className={styles.empty}>{BOARD_SETUP.noColumns}</p>
        ) : (
          <ol className={styles.lane}>
            {columns.map((c, i) => (
              <li key={c.id} className={styles.laneColumn}>
                <span className={styles.laneName}>{c.name}</span>
                <span className={styles.laneTags}>
                  {i === 0 && <span className={styles.tag}>{BOARD_SETUP.startsHere}</span>}
                  {isFinished(c, columns) && (
                    <span className={css(styles.tag, styles.tagFinished)}>{BOARD_SETUP.finishedTag}</span>
                  )}
                </span>
                <span className={styles.laneActions}>
                  <IconButton
                    iconProps={{ iconName: 'ChevronLeft' }} disabled={busy || i === 0}
                    title={BOARD_SETUP.moveLeft(c.name)} ariaLabel={BOARD_SETUP.moveLeft(c.name)}
                    onClick={() => onMove('columns', c.id, -1)}
                  />
                  <IconButton
                    iconProps={{ iconName: 'Edit' }} title={BOARD_SETUP.edit(c.name)} ariaLabel={BOARD_SETUP.edit(c.name)}
                    onClick={() => onEditColumn(c)}
                  />
                  <IconButton
                    iconProps={{ iconName: 'ChevronRight' }} disabled={busy || i === columns.length - 1}
                    title={BOARD_SETUP.moveRight(c.name)} ariaLabel={BOARD_SETUP.moveRight(c.name)}
                    onClick={() => onMove('columns', c.id, 1)}
                  />
                </span>
              </li>
            ))}
          </ol>
        )}
        {columns.length > 1 && !hasFinishLine(columns) && (
          <MessageBar messageBarType={MessageBarType.warning} isMultiline className={styles.warning}>
            {BOARD_SETUP.noFinishLine}
          </MessageBar>
        )}
      </section>
    </div>
  );
};

export default BoardSetupPage;
