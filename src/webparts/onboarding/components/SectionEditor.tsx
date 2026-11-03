import * as React from 'react';
import {
  DefaultButton, Dialog, DialogFooter, DialogType, MessageBar, MessageBarType, PrimaryButton, TextField, Toggle, css
} from '@fluentui/react';
import pageStyles from './Pages.module.scss';
import styles from './BoardSetup.module.scss';
import type { SPFI } from '../sp';
import { ListIds, SECTION_COLOURS } from '../setup/schema';
import type { IBoard } from '../data/types';
import { ISectionDraft, blankSection, checkSection, draftFromSection } from '../data/setupForms';
import { deleteSection, saveSection } from '../data/board';
import { explain } from '../setup/errors';
import { COMMON } from '../strings/common';
import { CHECKLIST } from '../strings/checklist';
import { COLOUR_NAMES, SECTION_FORM } from '../strings/boardSetup';
import { toneFor, tones } from './tone';
import BackLink from './BackLink';

export interface ISectionEditorProps {
  sp: SPFI;
  ids: ListIds;
  board: IBoard;
  /** The section to change. Undefined to add a new one. */
  sectionId?: number;
  onSaved: (text: string) => void;
  onCancel: () => void;
}

/* Adding a section to the checklist, or changing or deleting one. */
const SectionEditor: React.FC<ISectionEditorProps> = ({ sp, ids, board, sectionId, onSaved, onCancel }) => {
  const existing = sectionId === undefined ? undefined : board.sections.filter(s => s.id === sectionId)[0];
  const [draft, setDraft] = React.useState<ISectionDraft>(() =>
    (existing ? draftFromSection(existing) : blankSection(board.sections)));
  const [busy, setBusy] = React.useState<'saving' | 'deleting' | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [confirming, setConfirming] = React.useState(false);
  const alive = React.useRef(true);

  React.useEffect(() => () => { alive.current = false; }, []);

  // A colour typed in by hand stays on offer for the section that has it.
  const colours = SECTION_COLOURS.indexOf(draft.colour) > -1 || !draft.colour
    ? SECTION_COLOURS : SECTION_COLOURS.concat(draft.colour);
  const tasksIn = existing ? board.tasks.filter(t => t.sectionId === existing.id).length : 0;

  const change = (patch: Partial<ISectionDraft>): void => {
    setDraft(d => ({ ...d, ...patch }));
    setError(undefined);
  };

  const save = async (): Promise<void> => {
    const problem = checkSection(draft, board.sections);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('saving');
    setError(undefined);
    try {
      await saveSection(sp, ids, draft);
      const name = draft.name.trim();
      if (alive.current) onSaved(existing ? SECTION_FORM.saved(name) : SECTION_FORM.added(name));
    } catch (e) {
      if (alive.current) {
        setError(SECTION_FORM.saveFailed(explain(e)));
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
      await deleteSection(sp, ids, existing);
      if (alive.current) onSaved(SECTION_FORM.deleted(existing.name));
    } catch (e) {
      if (alive.current) {
        setError(SECTION_FORM.deleteFailed(explain(e)));
        setBusy(undefined);
      }
    }
  };

  return (
    <div className={pageStyles.page}>
      <BackLink text={CHECKLIST.back} onClick={onCancel} />
      <h2>{existing ? SECTION_FORM.editTitle : SECTION_FORM.addTitle}</h2>

      <form
        className={pageStyles.form}
        onSubmit={e => {
          e.preventDefault();
          save().catch(() => undefined);
        }}
      >
        <TextField
          label={SECTION_FORM.name} description={SECTION_FORM.nameHint} required autoFocus={!existing}
          value={draft.name} maxLength={255} disabled={!!busy}
          onChange={(e, v) => change({ name: v || '' })}
        />
        <TextField
          label={SECTION_FORM.days} description={SECTION_FORM.daysHint} inputMode="numeric"
          value={draft.days} disabled={!!busy} onChange={(e, v) => change({ days: v || '' })}
        />
        <Toggle
          label={SECTION_FORM.before} checked={draft.before} disabled={!!busy}
          onChange={(e, on) => change({ before: !!on })}
        />
        <span className={pageStyles.hint}>{SECTION_FORM.beforeHint}</span>
        <div>
          <span className={styles.label} id="section-colour">{SECTION_FORM.colour}</span>
          <div className={styles.colours} role="radiogroup" aria-labelledby="section-colour">
            {colours.map(c => (
              <button
                key={c} type="button" role="radio" aria-checked={draft.colour === c} disabled={!!busy}
                className={css(styles.colour, toneFor(c))}
                onClick={() => change({ colour: c })}
              >
                <span className={tones.swatch} aria-hidden="true" />
                {COLOUR_NAMES[c] || c}
              </button>
            ))}
          </div>
        </div>

        {error && <MessageBar messageBarType={MessageBarType.error} isMultiline>{error}</MessageBar>}

        <div className={pageStyles.actions}>
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
        dialogContentProps={{
          type: DialogType.normal, title: SECTION_FORM.confirmTitle, subText: SECTION_FORM.confirmBody(tasksIn)
        }}
      >
        <DialogFooter>
          <PrimaryButton text={SECTION_FORM.confirmDelete} onClick={() => { remove().catch(() => undefined); }} />
          <DefaultButton text={COMMON.cancel} onClick={() => setConfirming(false)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default SectionEditor;
