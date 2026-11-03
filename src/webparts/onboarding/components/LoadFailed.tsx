import * as React from 'react';
import { DefaultButton, MessageBar, MessageBarType } from '@fluentui/react';
import styles from './Pages.module.scss';
import { COMMON } from '../strings/common';
import { LOAD_FAILED } from '../strings/home';

export interface ILoadFailedProps {
  /** What didn't load, like "The tasks could not load." */
  lead: string;
  /** Why, in plain words. */
  error: string;
  onRetry: () => void;
}

/* Something didn't load: what, why, and a Try again button. */
const LoadFailed: React.FC<ILoadFailedProps> = ({ lead, error, onRetry }) => (
  <MessageBar messageBarType={MessageBarType.error} isMultiline>
    {LOAD_FAILED.message(lead, error)}
    <div className={styles.actions}>
      <DefaultButton text={COMMON.tryAgain} onClick={onRetry} />
    </div>
  </MessageBar>
);

export default LoadFailed;
