import * as React from 'react';
import { Icon } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { Tab } from '../data/roles';
import { NAV } from '../strings/home';
import { DEV_TOOLS } from '../strings/devTools';

export interface INavProps {
  /** The pages this person gets, in order. */
  tabs: Tab[];
  /** The page showing now. */
  current: Tab;
  onGo: (tab: Tab) => void;
  /** Opens the developer tools. Only given while the web part runs from the local dev server. */
  onGear?: () => void;
}

/* The row of pages along the top, for anyone who gets more than one, and the developer's gear at its end. */
const Nav: React.FC<INavProps> = ({ tabs, current, onGo, onGear }) => (
  <nav className={styles.nav} aria-label={NAV.label}>
    {tabs.map(t => (
      <button
        key={t}
        type="button"
        className={styles.tab}
        data-label={NAV.tabs[t]}
        aria-current={t === current ? 'page' : undefined}
        onClick={() => onGo(t)}
      >
        {NAV.tabs[t]}
      </button>
    ))}
    {onGear && (
      <button type="button" className={styles.gear} title={DEV_TOOLS.gear} aria-label={DEV_TOOLS.gear} onClick={onGear}>
        <Icon iconName="Settings" aria-hidden="true" />
      </button>
    )}
  </nav>
);

export default Nav;
