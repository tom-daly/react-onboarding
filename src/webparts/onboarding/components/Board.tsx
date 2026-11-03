import * as React from 'react';
import { Icon, MessageBar, MessageBarType, Spinner, SpinnerSize, css } from '@fluentui/react';
import styles from './Checklist.module.scss';
import type { IBoardColumn } from '../data/types';
import { IChecklistItem, rankAt } from '../data/checklist';
import { dayText } from '../data/dates';
import { isWebAddress } from '../data/taskForm';
import { explain } from '../setup/errors';
import { CHECKLIST } from '../strings/checklist';
import { COMMON } from '../strings/common';
import { toneOf, tones } from './tone';

/** One card on a board: a task for one new starter, in the words it shows with. */
export interface IBoardCard<T extends IChecklistItem = IChecklistItem> {
  /** Different for every card on the board. */
  key: string;
  item: T;
  title: string;
  details: string;
  /** A short line under the title, like who it's for or who does it. */
  note?: string;
}

export interface IBoardProps<T extends IChecklistItem> {
  /** The columns, left to right, each with its cards in place order. */
  lanes: { column: IBoardColumn; cards: IBoardCard<T>[] }[];
  /** Makes the column headings' IDs different from any other board on the page. */
  idPrefix: string;
  canMove: (card: IBoardCard<T>) => boolean;
  /** Moves a card to a column, at `rank` within it (see rankAt). */
  onMove: (card: IBoardCard<T>, to: IBoardColumn, rank: number) => Promise<void>;
}

/*
 * The columns and their cards. Cards move by dragging or with the buttons on
 * each one, and each move saves straight away.
 */
function Board<T extends IChecklistItem>({ lanes, idPrefix, canMove, onMove }: IBoardProps<T>): JSX.Element {
  // The cards whose move is saving right now, by key.
  const [saving, setSaving] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | undefined>();
  // What the last move did, for screen readers.
  const [said, setSaid] = React.useState('');
  // The card being dragged, and where it would land: the column, and how
  // many of the other cards there it would go below.
  const [dragging, setDragging] = React.useState<string | undefined>();
  const [over, setOver] = React.useState<{ column: number; index: number } | undefined>();
  const alive = React.useRef(true);

  React.useEffect(() => () => { alive.current = false; }, []);

  const order = lanes.map(l => l.column.id);
  const all = lanes.reduce<IBoardCard<T>[]>((out, l) => out.concat(l.cards), []);
  const anyMovable = all.some(canMove);

  const cardsIn = (column: IBoardColumn): IBoardCard<T>[] =>
    (lanes.filter(l => l.column === column)[0] || { cards: [] }).cards;

  /* Moves a card to `index` among the other cards in a column; a button puts it at the bottom. */
  const move = async (card: IBoardCard<T>, to: IBoardColumn, index?: number): Promise<void> => {
    if (saving[card.key]) return;
    const here = cardsIn(to);
    const others = here.filter(c => c !== card);
    const at = index === undefined ? others.length : index;
    // Dropped back where it already was.
    if (card.item.column === to && here.indexOf(card) === at) return;
    setSaving(s => ({ ...s, [card.key]: true }));
    setError(undefined);
    setSaid('');
    try {
      await onMove(card, to, rankAt(others.map(c => c.item), at));
      if (alive.current) setSaid(CHECKLIST.moved(card.title, to.name));
    } catch (e) {
      if (alive.current) setError(CHECKLIST.saveFailed(card.title, explain(e)));
    } finally {
      if (alive.current) setSaving(s => ({ ...s, [card.key]: false }));
    }
  };

  const dropOn = (to: IBoardColumn): void => {
    const card = all.filter(c => c.key === dragging)[0];
    const index = over && over.column === to.id ? over.index : undefined;
    setDragging(undefined);
    setOver(undefined);
    if (card) move(card, to, index).catch(() => undefined);
  };

  /* How many of the other cards in a column sit above the pointer: the first whose middle is below it. */
  const indexAt = (column: HTMLElement, y: number): number => {
    const cards = Array.prototype.slice.call(column.querySelectorAll('[data-card]')) as HTMLElement[];
    const others = cards.filter(c => c.getAttribute('data-card') !== dragging);
    for (let i = 0; i < others.length; i++) {
      const box = others[i].getBoundingClientRect();
      if (y < box.top + box.height / 2) return i;
    }
    return others.length;
  };

  const cardView = (card: IBoardCard<T>): JSX.Element => {
    const { section, column, due, overdue, done } = card.item;
    const link = card.item.task.link;
    const allowed = canMove(card);
    const movable = allowed && !saving[card.key];
    const at = column ? order.indexOf(column.id) : -1;
    // Buttons for the columns either side, so a long board doesn't fill every card with buttons.
    const sides = [lanes[at - 1], lanes[at + 1]].filter(l => !!l).map(l => l.column);
    return (
      <li
        key={card.key}
        data-card={card.key}
        className={css(styles.card, toneOf(section), done && styles.done, dragging === card.key && styles.lifted)}
        draggable={movable}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = 'move';
          // Firefox won't start a drag without something in it.
          e.dataTransfer.setData('text/plain', card.key);
          setDragging(card.key);
        }}
        onDragEnd={() => { setDragging(undefined); setOver(undefined); }}
      >
        <div className={styles.cardHead}>
          <span className={styles.title}>{card.title}</span>
          {saving[card.key] && <Spinner size={SpinnerSize.xSmall} />}
        </div>
        {card.note && <p className={styles.note}>{card.note}</p>}
        <div className={styles.when}>
          <span className={tones.pill}>{section ? section.name : CHECKLIST.noSection}</span>
          {due && <span className={css(styles.due, overdue && styles.dueLate)}>{CHECKLIST.due(dayText(due))}</span>}
          {overdue && <span className={css(styles.tag, styles.tagLate)}>{CHECKLIST.lateTag}</span>}
        </div>
        {card.details && <p className={styles.details}>{card.details}</p>}
        {isWebAddress(link) && (
          <a
            className={styles.link} href={link} target="_blank" rel="noopener noreferrer"
            aria-label={CHECKLIST.openLinkLabel(card.title)}
          >
            {CHECKLIST.openLink}
            <Icon iconName="OpenInNewTab" aria-hidden="true" />
          </a>
        )}
        {allowed && sides.length > 0 && (
          <div className={styles.moves}>
            {sides.map(c => {
              const left = order.indexOf(c.id) < at;
              return (
                <button
                  key={c.id} type="button" className={styles.moveButton} disabled={!movable}
                  aria-label={CHECKLIST.moveLabel(card.title, c.name)}
                  onClick={() => { move(card, c).catch(() => undefined); }}
                >
                  {left && <Icon iconName="ChevronLeft" aria-hidden="true" />}
                  {c.name}
                  {!left && <Icon iconName="ChevronRight" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </li>
    );
  };

  /* A column's cards, with the line showing where the dragged one would land. */
  const cardsWithLine = (column: IBoardColumn, cards: IBoardCard<T>[]): JSX.Element[] => {
    const line = <li key="drop-line" className={styles.dropLine} aria-hidden="true" />;
    if (!over || over.column !== column.id || dragging === undefined) return cards.map(cardView);
    const out: JSX.Element[] = [];
    let others = 0;
    cards.forEach(c => {
      if (c.key !== dragging && others === over.index) out.push(line);
      out.push(cardView(c));
      if (c.key !== dragging) others++;
    });
    if (others === over.index && out.indexOf(line) < 0) out.push(line);
    return out;
  };

  return (
    <>
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error} isMultiline
          onDismiss={() => setError(undefined)} dismissButtonAriaLabel={COMMON.close}
        >
          {error}
        </MessageBar>
      )}

      {anyMovable && <p className={styles.hint}>{CHECKLIST.howToMove}</p>}

      <div className={styles.board} style={{ ['--columns' as string]: lanes.length }}>
        {lanes.map(({ column, cards }) => (
          <section
            key={column.id}
            className={css(styles.column, over && over.column === column.id && dragging !== undefined && styles.dropHere)}
            aria-labelledby={`${idPrefix}-${column.id}`}
            onDragOver={e => {
              if (dragging === undefined) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              const index = indexAt(e.currentTarget, e.clientY);
              if (!over || over.column !== column.id || over.index !== index) setOver({ column: column.id, index });
            }}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(undefined);
            }}
            onDrop={e => { e.preventDefault(); dropOn(column); }}
          >
            <h3 id={`${idPrefix}-${column.id}`} className={styles.columnHead}>
              {column.name}
              <span className={styles.count}>{cards.length}</span>
            </h3>
            {cards.length === 0 && !(over && over.column === column.id)
              ? <p className={styles.empty}>{CHECKLIST.emptyColumn}</p>
              : <ul className={styles.cards}>{cardsWithLine(column, cards)}</ul>}
          </section>
        ))}
      </div>

      {/* Always there, so screen readers hear it when it changes. */}
      <span className={styles.srOnly} role="status">{said}</span>
    </>
  );
}

export default Board;
