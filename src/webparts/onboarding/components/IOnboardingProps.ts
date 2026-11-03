import type { SPFI } from '../sp';
import type { ISiteInfo } from '../setup/problems';

export interface IOnboardingProps {
  sp: SPFI;
  site: ISiteInfo;
}
