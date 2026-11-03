import tones from './Tones.module.scss';
import type { ISection } from '../data/types';

const BY_COLOUR: Record<string, string> = {
  teal: tones.teal,
  purple: tones.purple,
  blue: tones.blue,
  orange: tones.orange,
  pink: tones.pink,
  green: tones.green,
  grey: tones.grey
};

/** The tone class for a section's colour. No section, or a colour typed in by hand, is grey. */
export const toneOf = (section: ISection | undefined): string =>
  (section && BY_COLOUR[section.colour.trim().toLowerCase()]) || tones.grey;

/** The tone class for a colour by name, for the colour picker. */
export const toneFor = (colour: string): string => BY_COLOUR[colour.trim().toLowerCase()] || tones.grey;

export { tones };
