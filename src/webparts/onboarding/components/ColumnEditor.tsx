import * as React from 'react';
import {
  DefaultButton, Dialog, DialogFooter, DialogType, MessageBar, MessageBarType, PrimaryButton, TextField, Toggle
} from '@fluentui/react';
import pageStyles from './Pages.module.scss';
import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { IBoard } from '../data/types';
import { inOrder } from '../data/checklist';
import { IColumnDraft, blankColumn, checkColumn, draftFromColumn, whereTasksGo } from '../data/setupForms';
import { deleteColumn, saveColumn } from '../data/board';
import { explain } from '../setup/errors';
import { COMMON } from '../strings/common';
import { CHECKLIST } from '../strings/checklist';
import { COLUMN_FORM } from '../strings/boardSetup';
import BackLink from './BackLink';

export interface IColumnEditorProps {
  sp: SPFI;
  ids: ListIds;
  board: IBoard;
  /** The column to change. Undefined to add a new one. */
  columnId?: number;
  onSaved: (text: string) => void;
  onCancel: () => void;
}

/* Adding a column to every new starter's board, or changing or deleting one. */
const ColumnEditor: React.FC<IColumnEditorProps> = ({ sp, ids, board, columnId, onSaved, onCancel }) => {
  const existing = columnId === undefined ? undefined : board.columns.filter(c => c.id === columnId)[0];
  const [draft, setDraft] = React.useState<IColumnDraft>(() =>
    (existing ? draftFromColumn(existing) : blankColumn(board.columns)));
  const [busy, setBusy] = React.useState<'saving' | 'deleting' | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [confirming, setConfirming] = React.useState(false);
  const alive = React.useRef(true);

  React.useEffect(() => () => { alive.current = false; }, []);

  const sorted = inOrder(board.columns);
  // Tasks start in the first column, so it can't count as finished. A new column goes at the end.
  const isFirst = existing ? sorted[0] === existing : sorted.length === 0;
  const canDelete = board.columns.length > 2;
  const ticksIn = existing ? board.ticks.filter(t => t.columnId === existing.id) : [];
  const moveTo = existing ? whereTasksGo(board.columns, existing.id) : undefined;
  const firstAfter = sorted.filter(c => c !== existing)[0];
  const moveToName = moveTo ? moveTo.name : firstAfter ? firstAfter.name : '';

  const change = (patch: Partial<IColumnDraft>): void => {
    setDraft(d => ({ ...d, ...patch }));
    setError(undefined);
  };

  const save = async (): Promise<void> => {
    const problem = checkColumn(draft, board.columns);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('saving');
    setError(undefined);
    try {
      await saveColumn(sp, ids, { ...draft, finished: draft.finished && !isFirst });
      const name = draft.name.trim();
      if (alive.current) onSaved(existing ? COLUMN_FORM.saved(name) : COLUMN_FORM.added(name));
    } catch (e) {
      if (alive.current) {
        setError(COLUMN_FORM.saveFailed(explain(e)));
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
      await deleteColumn(sp, ids, existing, board.ticks, moveTo);
      if (alive.current) onSaved(COLUMN_FORM.deleted(existing.name));
    } catch (e) {
      if (alive.current) {
        setError(COLUMN_FORM.deleteFailed(explain(e)));
        setBusy(undefined);
      }
    }
  };

  return (
    <div className={pageStyles.page}>
      <BackLink text={CHECKLIST.back} onClick={onCancel} />
      <h2>{existing ? COLUMN_FORM.editTitle : COLUMN_FORM.addTitle}</h2>

      <form
        className={pageStyles.form}
        onSubmit={e => {
          e.preventDefault();
          save().catch(() => undefined);
        }}
      >
        <TextField
          label={COLUMN_FORM.name} description={COLUMN_FORM.nameHint} required autoFocus={!existing}
          value={draft.name} maxLength={255} disabled={!!busy}
          onChange={(e, v) => change({ name: v || '' })}
        />
        <Toggle
          label={COLUMN_FORM.finished} checked={draft.finished && !isFirst} disabled={!!busy || isFirst}
          onChange={(e, on) => change({ finished: !!on })}
        />
        <span className={pageStyles.hint}>{isFirst ? COLUMN_FORM.firstCantFinish : COLUMN_FORM.finishedHint}</span>

        {error && <MessageBar messageBarType={MessageBarType.error} isMultiline>{error}</MessageBar>}

        <div className={pageStyles.actions}>
          <PrimaryButton type="submit" text={busy === 'saving' ? COMMON.saving : COMMON.save} disabled={!!busy} />
          <DefaultButton text={COMMON.cancel} onClick={onCancel} disabled={!!busy} />
          {existing && (
            <DefaultButton
              iconProps={{ iconName: 'Delete' }} text={busy === 'deleting' ? COMMON.deleting : COMMON.delete}
              disabled={!!busy || !canDelete} onClick={() => setConfirming(true)}
            />
          )}
        </div>
        {existing && !canDelete && <span className={pageStyles.hint}>{COLUMN_FORM.keepTwo}</span>}
      </form>

      <Dialog
        hidden={!confirming}
        onDismiss={() => setConfirming(false)}
        dialogContentProps={{
          type: DialogType.normal, title: COLUMN_FORM.confirmTitle,
          subText: COLUMN_FORM.confirmMove(ticksIn.length, moveToName)
        }}
      >
        <DialogFooter>
          <PrimaryButton text={COLUMN_FORM.confirmDelete} onClick={() => { remove().catch(() => undefined); }} />
          <DefaultButton text={COMMON.cancel} onClick={() => setConfirming(false)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default ColumnEditor;
