import * as React from 'react';
import {
  DefaultButton, Dialog, DialogFooter, DialogType, Dropdown, IDropdownOption, MessageBar, MessageBarType,
  PrimaryButton, TextField, Toggle
} from '@fluentui/react';
import styles from './Pages.module.scss';
import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { ISection, ITask } from '../data/types';
import { inOrder } from '../data/checklist';
import { ITaskDraft, blankTask, checkTask, draftFromTask, nextOrder } from '../data/taskForm';
import { deleteTask, saveTask } from '../data/board';
import { explain } from '../setup/errors';
import { COMMON } from '../strings/common';
import { CHECKLIST } from '../strings/checklist';
import { TASK_FORM } from '../strings/tasks';
import BackLink from './BackLink';
import { PeopleBox } from './PersonBox';

export interface ITaskEditorProps {
  sp: SPFI;
  ids: ListIds;
  tasks: ITask[];
  sections: ISection[];
  /** The task to change. Undefined to add a new one. */
  taskId?: number;
  onSaved: (title: string, added: boolean) => void;
  onDeleted: (title: string) => void;
  onCancel: () => void;
}

/* Adding a task to the checklist, or changing or deleting one. */
const TaskEditor: React.FC<ITaskEditorProps> = ({ sp, ids, tasks, sections, taskId, onSaved, onDeleted, onCancel }) => {
  const existing = taskId === undefined ? undefined : tasks.filter(t => t.id === taskId)[0];
  const sorted = inOrder(sections);
  // A new task starts in the first section.
  const [draft, setDraft] = React.useState<ITaskDraft>(() =>
    (existing ? draftFromTask(existing) : blankTask(tasks, sorted.length ? sorted[0].id : undefined)));
  const [busy, setBusy] = React.useState<'saving' | 'deleting' | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [confirming, setConfirming] = React.useState(false);
  const alive = React.useRef(true);

  React.useEffect(() => () => { alive.current = false; }, []);

  // Every section, then none. A task whose section was taken away shows as none.
  const NONE = 'none';
  const known = sorted.some(s => s.id === draft.sectionId);
  const sectionOptions: IDropdownOption[] = sorted.map(s => ({ key: String(s.id), text: s.name }))
    .concat([{ key: NONE, text: TASK_FORM.noSection }]);

  const change = (patch: Partial<ITaskDraft>): void => {
    setDraft(d => ({ ...d, ...patch }));
    setError(undefined);
  };

  const save = async (): Promise<void> => {
    const problem = checkTask(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('saving');
    setError(undefined);
    try {
      await saveTask(sp, ids, draft);
      if (alive.current) onSaved(draft.title.trim(), draft.id === undefined);
    } catch (e) {
      if (alive.current) {
        setError(TASK_FORM.saveFailed(explain(e)));
        setBusy(undefined);
      }
    }
  };

  const remove = async (): Promise<void> => {
    if (!existing) return;
    setConfirming(false);
    setBusy('deleting');
    setError(undefined);
    try {
      await deleteTask(sp, ids, existing.id);
      if (alive.current) onDeleted(existing.title);
    } catch (e) {
      if (alive.current) {
        setError(TASK_FORM.deleteFailed(explain(e)));
        setBusy(undefined);
      }
    }
  };

  return (
    <div className={styles.page}>
      <BackLink text={CHECKLIST.back} onClick={onCancel} />
      <h2>{existing ? TASK_FORM.editTitle : TASK_FORM.addTitle}</h2>

      <form
        className={styles.form}
        onSubmit={e => {
          e.preventDefault();
          save().catch(() => undefined);
        }}
      >
        <TextField
          label={TASK_FORM.name} description={TASK_FORM.nameHint} required autoFocus={!existing}
          value={draft.title} maxLength={255} disabled={!!busy}
          onChange={(e, v) => change({ title: v || '' })}
        />
        <Dropdown
          label={TASK_FORM.section} options={sectionOptions} disabled={!!busy}
          selectedKey={known ? String(draft.sectionId) : NONE}
          onChange={(e, o) => {
            if (!o) return;
            const sectionId = o.key === NONE ? undefined : Number(o.key);
            // A new task moves to the end of the section it's moved to.
            change(existing ? { sectionId } : { sectionId, order: String(nextOrder(tasks, sectionId)) });
          }}
        />
        <PeopleBox
          sp={sp} label={TASK_FORM.owners} hint={TASK_FORM.ownersHint}
          value={draft.owners} onChange={owners => change({ owners })} disabled={!!busy}
        />
        <TextField
          label={TASK_FORM.order} description={TASK_FORM.orderHint} inputMode="numeric"
          value={draft.order} disabled={!!busy} onChange={(e, v) => change({ order: v || '' })}
        />
        <TextField
          label={TASK_FORM.details} description={TASK_FORM.detailsHint} multiline autoAdjustHeight rows={3}
          value={draft.details} disabled={!!busy} onChange={(e, v) => change({ details: v || '' })}
        />
        <TextField
          label={TASK_FORM.link} description={TASK_FORM.linkHint} type="url"
          value={draft.link} disabled={!!busy} onChange={(e, v) => change({ link: v || '' })}
        />
        <Toggle
          label={TASK_FORM.active} checked={draft.active} disabled={!!busy}
          onChange={(e, on) => change({ active: !!on })}
        />
        <span className={styles.hint}>{TASK_FORM.activeHint}</span>

        {error && <MessageBar messageBarType={MessageBarType.error} isMultiline>{error}</MessageBar>}

        <div className={styles.actions}>
          <PrimaryButton type="submit" text={busy === 'saving' ? COMMON.saving : COMMON.save} disabled={!!busy} />
          <DefaultButton text={COMMON.cancel} onClick={onCancel} disabled={!!busy} />
          {existing && (
            <DefaultButton
              iconProps={{ iconName: 'Delete' }} text={busy === 'deleting' ? COMMON.deleting : COMMON.delete}
              disabled={!!busy} onClick={() => setConfirming(true)}
            />
          )}
        </div>
      </form>

      <Dialog
        hidden={!confirming}
        onDismiss={() => setConfirming(false)}
        dialogContentProps={{ type: DialogType.normal, title: TASK_FORM.confirmTitle, subText: TASK_FORM.confirmBody }}
      >
        <DialogFooter>
          <PrimaryButton text={TASK_FORM.confirmDelete} onClick={() => { remove().catch(() => undefined); }} />
          <DefaultButton text={COMMON.cancel} onClick={() => setConfirming(false)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default TaskEditor;
