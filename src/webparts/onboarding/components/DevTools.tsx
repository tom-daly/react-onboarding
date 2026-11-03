import * as React from 'react';
import {
  DefaultButton, Dialog, DialogFooter, DialogType, MessageBar, MessageBarType, Panel, PanelType, PrimaryButton,
  TextField, css
} from '@fluentui/react';
import pageStyles from './Pages.module.scss';
import setupStyles from './BoardSetup.module.scss';
import type { SPFI } from '../sp';
import type { ListIds } from '../setup/schema';
import type { IBoard } from '../data/types';
import { IStarterDraft, blankStarter, checkStarter } from '../data/starterForm';
import { clearAll, fillStarting, makeSampleStarter } from '../data/devTools';
import { today } from '../data/dates';
import { explain } from '../setup/errors';
import { COMMON } from '../strings/common';
import { DEV_TOOLS } from '../strings/devTools';
import PersonBox from './PersonBox';

export interface IDevToolsProps {
  sp: SPFI;
  ids: ListIds;
  board: IBoard;
  /** The developer, by their ID on this site. */
  userId: number;
  open: boolean;
  onClose: () => void;
  /** Something changed: load everything again and say what happened. */
  onChanged: (text: string) => Promise<void>;
}

type Busy = 'fill' | 'sample' | 'clear' | undefined;

/*
 * The developer tools behind the gear: fill in the starting data, make a
 * sample new starter, or clear every list. Only shown while the web part runs
 * from the local dev server.
 */
const DevTools: React.FC<IDevToolsProps> = ({ sp, ids, board, userId, open, onClose, onChanged }) => {
  const [busy, setBusy] = React.useState<Busy>();
  const [progress, setProgress] = React.useState('');
  const [note, setNote] = React.useState<{ ok: boolean; text: string } | undefined>();
  const [draft, setDraft] = React.useState<IStarterDraft>(() => blankStarter(today()));
  const [confirming, setConfirming] = React.useState(false);

  const run = async (kind: Busy, work: () => Promise<string>): Promise<void> => {
    setBusy(kind);
    setNote(undefined);
    try {
      const text = await work();
      await onChanged(text);
      setNote({ ok: true, text });
    } catch (e) {
      setNote({ ok: false, text: DEV_TOOLS.failed(explain(e)) });
    } finally {
      setBusy(undefined);
      setProgress('');
    }
  };

  const fill = (): Promise<void> => run('fill', async () => {
    const f = await fillStarting(sp, ids, board, userId);
    return DEV_TOOLS.filled(f.sections, f.columns, f.tasks);
  });

  const sample = (): Promise<void> => {
    const problem = checkStarter(draft, board.starters);
    if (problem) {
      setNote({ ok: false, text: problem });
      return Promise.resolve();
    }
    if (!board.columns.length || !board.tasks.length) {
      setNote({ ok: false, text: DEV_TOOLS.needsSetup });
      return Promise.resolve();
    }
    return run('sample', async () => {
      const moved = await makeSampleStarter(sp, ids, board, draft, userId);
      const name = draft.person ? draft.person.name : '';
      setDraft(blankStarter(today()));
      return DEV_TOOLS.made(name, moved);
    });
  };

  const clear = (): Promise<void> => {
    setConfirming(false);
    return run('clear', async () => {
      const n = await clearAll(sp, ids, (done, total) => setProgress(DEV_TOOLS.clearing(done, total)));
      return DEV_TOOLS.cleared(n);
    });
  };

  return (
    <Panel
      isOpen={open} onDismiss={onClose} type={PanelType.medium} headerText={DEV_TOOLS.title}
      closeButtonAriaLabel={COMMON.close} isBlocking={!!busy}
    >
      <p className={css(pageStyles.intro, setupStyles.block)}>{DEV_TOOLS.intro}</p>

      {note && (
        <MessageBar
          messageBarType={note.ok ? MessageBarType.success : MessageBarType.error} isMultiline
          onDismiss={() => setNote(undefined)} dismissButtonAriaLabel={COMMON.close}
        >
          {note.text}
        </MessageBar>
      )}

      <section className={css(pageStyles.section, setupStyles.block)}>
        <h3>{DEV_TOOLS.fillTitle}</h3>
        <p>{DEV_TOOLS.fillBody}</p>
        <PrimaryButton
          text={busy === 'fill' ? DEV_TOOLS.filling : DEV_TOOLS.fill} disabled={!!busy}
          onClick={() => { fill().catch(() => undefined); }}
        />
      </section>

      <section className={css(pageStyles.section, setupStyles.block)}>
        <h3>{DEV_TOOLS.sampleTitle}</h3>
        <p>{DEV_TOOLS.sampleBody}</p>
        <div className={pageStyles.form}>
          <PersonBox
            sp={sp} label={DEV_TOOLS.person} required value={draft.person} disabled={!!busy}
            onChange={person => setDraft(d => ({ ...d, person }))}
          />
          <PersonBox
            sp={sp} label={DEV_TOOLS.manager} value={draft.manager} disabled={!!busy}
            onChange={manager => setDraft(d => ({ ...d, manager }))}
          />
          <TextField
            label={DEV_TOOLS.firstDay} description={DEV_TOOLS.firstDayHint} value={draft.startDate} disabled={!!busy}
            onChange={(e, v) => setDraft(d => ({ ...d, startDate: v || '' }))}
          />
          <div>
            <PrimaryButton
              text={busy === 'sample' ? DEV_TOOLS.making : DEV_TOOLS.make} disabled={!!busy}
              onClick={() => { sample().catch(() => undefined); }}
            />
          </div>
        </div>
      </section>

      <section className={css(pageStyles.section, setupStyles.block)}>
        <h3>{DEV_TOOLS.clearTitle}</h3>
        <p>{DEV_TOOLS.clearBody}</p>
        <DefaultButton
          iconProps={{ iconName: 'Delete' }} text={busy === 'clear' ? progress || DEV_TOOLS.clearing(0, 0) : DEV_TOOLS.clear}
          disabled={!!busy} onClick={() => setConfirming(true)}
        />
      </section>

      <Dialog
        hidden={!confirming}
        onDismiss={() => setConfirming(false)}
        dialogContentProps={{ type: DialogType.normal, title: DEV_TOOLS.confirmTitle, subText: DEV_TOOLS.confirmBody }}
      >
        <DialogFooter>
          <PrimaryButton text={DEV_TOOLS.confirm} onClick={() => { clear().catch(() => undefined); }} />
          <DefaultButton text={COMMON.cancel} onClick={() => setConfirming(false)} />
        </DialogFooter>
      </Dialog>
    </Panel>
  );
};

export default DevTools;
