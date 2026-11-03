import * as React from 'react';
import { DefaultButton, Icon } from '@fluentui/react';
import confetti from 'canvas-confetti';
import styles from './Checklist.module.scss';
import { CHECKLIST } from '../strings/checklist';

export interface ICelebrationProps {
  /** Their first name or full name, to say well done to. */
  name: string;
  /** Puts the board back, in case something was moved by mistake. */
  onShowBoard: () => void;
}

/* One burst. The library hands back a promise for when it settles, which nothing waits on. */
const fire = (o: confetti.Options): void => {
  const settled = confetti(o);
  if (settled) settled.catch(() => undefined);
};

/* Bursts from both sides, then a shower from the top, over about a second and a half. */
function burst(): () => void {
  // Above SharePoint's own bars and panels. Skipped for anyone whose computer asks for less motion.
  const base = { disableForReducedMotion: true, zIndex: 1000000, ticks: 260 };
  const timers = [
    window.setTimeout(() => {
      fire({ ...base, particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } });
      fire({ ...base, particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } });
    }, 0),
    window.setTimeout(() => fire({ ...base, particleCount: 140, spread: 120, startVelocity: 45, origin: { y: 0.35 } }), 350),
    window.setTimeout(() => fire({ ...base, particleCount: 120, spread: 160, gravity: 0.8, origin: { y: 0 } }), 800)
  ];
  return () => {
    timers.forEach(t => window.clearTimeout(t));
    confetti.reset();
  };
}

/*
 * What a new starter sees once every task is done: well done, with confetti,
 * in place of the board.
 */
const Celebration: React.FC<ICelebrationProps> = ({ name, onShowBoard }) => {
  React.useEffect(() => burst(), []);

  return (
    <div className={styles.celebrate} role="status">
      <Icon iconName="Trophy2" className={styles.celebrateIcon} aria-hidden="true" />
      <h3 className={styles.celebrateTitle}>{CHECKLIST.celebrateTitle}</h3>
      <p className={styles.celebrateBody}>{CHECKLIST.celebrateBody(name)}</p>
      <DefaultButton text={CHECKLIST.showBoard} onClick={onShowBoard} />
    </div>
  );
};

export default Celebration;
