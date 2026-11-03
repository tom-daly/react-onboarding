import * as React from 'react';
import { DefaultButton, Icon, IconButton, PrimaryButton, Spinner, SpinnerSize, css } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { ISection, ITask } from '../data/types';
import { groupBySection } from '../data/checklist';
import { toneOf, tones } from './tone';
import { inWords } from '../data/text';
import { TASKS_PAGE } from '../strings/tasks';

export interface ITasksPageProps {
  tasks: ITask[];
  sections: ISection[];
  /** Opens the form: undefined to add a task. */
  onEdit: (task?: ITask) => void;
  onAddSamples: () => void;
  /** The starter set is going in. */
  addingSamples: boolean;
}

/* The checklist every new starter gets, by part of the month, for the Onboarding Team to change. */
const TasksPage: React.FC<ITasksPageProps> = ({ tasks, sections, onEdit, onAddSamples, addingSamples }) => {
  if (tasks.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{TASKS_PAGE.emptyTitle}</h2>
          <p>{TASKS_PAGE.emptyBody}</p>
          {addingSamples ? (
            <Spinner size={SpinnerSize.medium} label={TASKS_PAGE.addingSamples} labelPosition="right" />
          ) : (
            <div className={styles.actions}>
              <PrimaryButton text={TASKS_PAGE.addSamples} onClick={onAddSamples} />
              <DefaultButton text={TASKS_PAGE.add} onClick={() => onEdit()} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h2>{TASKS_PAGE.title}</h2>
          <p className={styles.intro}>{TASKS_PAGE.intro}</p>
        </div>
        <PrimaryButton iconProps={{ iconName: 'Add' }} text={TASKS_PAGE.add} onClick={() => onEdit()} />
      </div>

      {groupBySection(tasks, sections).map(g => (
        <section key={g.section ? g.section.id : '-'} className={css(styles.when, toneOf(g.section))}>
          <h3>
            <span className={tones.pill}>{g.section ? g.section.name : TASKS_PAGE.noSection}</span>
            <span className={styles.small}>{TASKS_PAGE.count(g.tasks.length)}</span>
          </h3>
          <ul className={styles.taskList}>
            {g.tasks.map(t => (
              <li key={t.id} className={css(styles.taskRow, !t.active && styles.taskOff)}>
                <span className={styles.taskOrder}>{t.order}</span>
                <span className={styles.taskText}>
                  <span className={styles.name}>{t.title}</span>
                  {!t.active && <span className={styles.tag} title={TASKS_PAGE.inactiveHint}>{TASKS_PAGE.inactive}</span>}
                  {t.link && (
                    <Icon
                      iconName="Link" className={styles.tag} title={TASKS_PAGE.hasLink} aria-label={TASKS_PAGE.hasLink}
                    />
                  )}
                  {t.owners.length > 0 && (
                    <span className={styles.hint}>{TASKS_PAGE.ownedBy(inWords(t.owners.map(o => o.name)))}</span>
                  )}
                  {t.details && <span className={styles.hint}>{t.details}</span>}
                </span>
                <IconButton
                  iconProps={{ iconName: 'Edit' }} title={TASKS_PAGE.editLabel(t.title)}
                  ariaLabel={TASKS_PAGE.editLabel(t.title)} onClick={() => onEdit(t)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default TasksPage;
