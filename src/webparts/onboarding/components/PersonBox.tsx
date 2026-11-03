import * as React from 'react';
import { IPersonaProps, Label, NormalPeoplePicker, getId } from '@fluentui/react';
import styles from './Pages.module.scss';
import type { SPFI } from '../sp';
import type { IPersonPick } from '../data/starterForm';
import { searchPeople } from '../data/team';
import { explain } from '../setup/errors';
import { STARTER_FORM } from '../strings/starters';

export interface IPersonBoxProps {
  sp: SPFI;
  label: string;
  hint?: string;
  required?: boolean;
  value?: IPersonPick;
  onChange: (person: IPersonPick | undefined) => void;
  disabled?: boolean;
}

/* A search result or the person in the box, carrying who they are. */
interface IPickPersona extends IPersonaProps {
  person: IPersonPick;
}

const personaOf = (p: IPersonPick): IPickPersona =>
  ({ key: p.login || String(p.id), text: p.name, secondaryText: p.email, person: p });

export interface IPeopleBoxProps extends Omit<IPersonBoxProps, 'value' | 'onChange'> {
  value: IPersonPick[];
  onChange: (people: IPersonPick[]) => void;
}

/* The same person, by email, so nobody can be picked twice. */
const sameEmail = (a: IPersonPick, b: IPersonPick): boolean => !!a.email && a.email.toLowerCase() === b.email.toLowerCase();

/* A box that holds any number of people from the organisation, found by typing their names. */
export const PeopleBox: React.FC<IPeopleBoxProps & { limit?: number }> = props => {
  const { sp, label, hint, required, value, onChange, disabled, limit } = props;
  const [error, setError] = React.useState<string | undefined>();
  const [id] = React.useState(() => getId('person'));

  const suggest = async (text: string): Promise<IPersonaProps[]> => {
    const typed = text.trim();
    if (typed.length < 2) return [];
    setError(undefined);
    try {
      const found = await searchPeople(sp, typed);
      return found
        .map(f => ({ login: f.login, name: f.name, email: f.email }))
        .filter(p => !value.some(v => sameEmail(v, p)))
        .map(personaOf);
    } catch (e) {
      setError(STARTER_FORM.searchFailed(explain(e)));
      return [];
    }
  };

  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <NormalPeoplePicker
        inputProps={{ id }}
        itemLimit={limit}
        selectedItems={value.map(personaOf)}
        onResolveSuggestions={suggest}
        onChange={items => onChange((items || []).map(i => (i as IPickPersona).person))}
        resolveDelay={300}
        disabled={disabled}
        removeButtonAriaLabel={STARTER_FORM.removePerson}
        pickerSuggestionsProps={{
          suggestionsHeaderText: STARTER_FORM.pickerHeader,
          noResultsFoundText: STARTER_FORM.pickerNoResults,
          loadingText: STARTER_FORM.pickerSearching
        }}
      />
      {hint && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.hint} role="alert">{error}</span>}
    </div>
  );
};

/* A box that holds one person from the organisation, found by typing their name. */
const PersonBox: React.FC<IPersonBoxProps> = ({ value, onChange, ...rest }) => (
  <PeopleBox {...rest} limit={1} value={value ? [value] : []} onChange={people => onChange(people[0])} />
);

export default PersonBox;
