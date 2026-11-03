import type { SPFI } from '../sp';
import type { IList } from '@pnp/sp/lists';
import type { ListIds } from '../setup/schema';
import { TOOL_DATA } from '../strings/data';

/** One of the tool's lists, found by the ID setup recorded. */
export const listOf = (sp: SPFI, ids: ListIds, key: keyof ListIds): IList => {
  const id = ids[key];
  if (!id) throw new Error(TOOL_DATA.listsNotSetUp);
  return sp.web.lists.getById(id);
};
