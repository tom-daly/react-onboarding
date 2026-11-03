import * as React from 'react';
import { Icon } from '@fluentui/react';
import styles from './Pages.module.scss';

export interface IBackLinkProps {
  text: string;
  onClick: () => void;
}

/* "← Back", with SharePoint's own back arrow. Read-out text comes from the words alone. */
const BackLink: React.FC<IBackLinkProps> = ({ text, onClick }) => (
  <button type="button" className={styles.back} onClick={onClick}>
    <Icon iconName="Back" className={styles.backArrow} aria-hidden="true" />
    {text}
  </button>
);

export default BackLink;
