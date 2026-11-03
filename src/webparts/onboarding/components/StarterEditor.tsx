import * as React from 'react';
import { DatePicker, DefaultButton, MessageBar, MessageBarType, PrimaryButton, Toggle } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { IBoard } from '../data/types';
import { IStarterDraft, blankStarter, checkStarter, draftFromStarter } from '../data/starterForm';
import { saveStarter } from '../data/board';
import { dayText, fromIsoDate, isoDate } from '../data/dates';
import { explain } from '../setup/errors';
import { COMMON } from '../strings/common';
import { CHECKLIST } from '../strings/checklist';
import { STARTER_FORM } from '../strings/starters';
import PersonBox from './PersonBox';
import BackLink from './BackLink';

export interface IStarterEditorProps {
  sp: SPFI;
  ids: ListIds;
  board: IBoard;
  /** Like 2026-10-15: a new starter's first day until one is picked. */
  today: string;
  /** Their row, to change them. Undefined to add someone new. */
  starterId?: number;
  onSaved: (name: string, added: boolean) => void;
  onCancel: () => void;
}

/* Adding a new starter, or changing one: who, their manager and their first day. */
const StarterEditor: React.FC<IStarterEditorProps> = ({ sp, ids, board, today, starterId, onSaved, onCancel }) => {
  const existing = starterId === undefined ? undefined : board.starters.filter(s => s.id === starterId)[0];
  const [draft, setDraft] = React.useState<IStarterDraft>(
    () => (existing ? draftFromStarter(existing) : blankStarter(today)));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const alive = React.useRef(true);

  React.useEffect(() => () => { alive.current = false; }, []);

  const change = (patch: Partial<IStarterDraft>): void => {
    setDraft(d => ({ ...d, ...patch }));
    setError(undefined);
  };

  const save = async (): Promise<void> => {
    const problem = checkStarter(draft, board.starters);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await saveStarter(sp, ids, draft);
      if (alive.current) onSaved(draft.person ? draft.person.name : '', draft.id === undefined);
    } catch (e) {
      if (alive.current) {
        setError(STARTER_FORM.saveFailed(explain(e)));
        setSaving(false);
      }
    }
  };

  return (
    <div className={styles.page}>
      <BackLink text={CHECKLIST.back} onClick={onCancel} />
      <h2>{existing ? STARTER_FORM.editTitle(existing.name) : STARTER_FORM.addTitle}</h2>

      <form
        className={styles.form}
        onSubmit={e => {
          e.preventDefault();
          save().catch(() => undefined);
        }}
      >
        <PersonBox
          sp={sp} label={STARTER_FORM.person} hint={STARTER_FORM.personHint} required
          value={draft.person} onChange={person => change({ person })} disabled={saving}
        />
        <PersonBox
          sp={sp} label={STARTER_FORM.manager} hint={STARTER_FORM.managerHint}
          value={draft.manager} onChange={manager => change({ manager })} disabled={saving}
        />
        <DatePicker
          label={STARTER_FORM.startDate}
          isRequired
          placeholder={STARTER_FORM.pickDay}
          value={fromIsoDate(draft.startDate)}
          onSelectDate={d => change({ startDate: d ? isoDate(d) : '' })}
          formatDate={d => (d ? dayText(isoDate(d)) : '')}
          disabled={saving}
        />
        {existing && (
          <Toggle
            label={STARTER_FORM.archived} checked={draft.archived} disabled={saving}
            onChange={(e, on) => change({ archived: !!on })}
          />
        )}
        {existing && <span className={styles.hint}>{STARTER_FORM.archivedHint}</span>}

        {error && <MessageBar messageBarType={MessageBarType.error} isMultiline>{error}</MessageBar>}

        <div className={styles.actions}>
          <PrimaryButton type="submit" text={saving ? COMMON.saving : COMMON.save} disabled={saving} />
          <DefaultButton text={COMMON.cancel} onClick={onCancel} disabled={saving} />
        </div>
      </form>
    </div>
  );
};

export default StarterEditor;
