import { hasLevel, hasStaff, everyoneClaim, RoleType, CAN_CHANGE_LIST } from './permissions';
import { TEAM_GROUP } from './schema';
import { EVERYONE } from './__fixtures__/states';

describe('everyoneClaim', () => {
  it('names everyone in the organisation, guests left out', () => {
    expect(everyoneClaim('abc')).toBe('c:0-.f|rolemanager|spo-grid-all-users/abc');
  });
});

describe('hasStaff', () => {
  it('finds everyone in the organisation whatever the case of the login', () => {
    expect(hasStaff([{ principalId: 9, loginName: EVERYONE.toUpperCase() }], EVERYONE)).toBe(true);
    expect(hasStaff([{ principalId: 4, loginName: 'Site Members' }], EVERYONE)).toBe(false);
  });
});

describe('hasLevel', () => {
  const access = [
    { principalId: 20, loginName: 'Renamed by hand', roles: [RoleType.editor] },
    { principalId: 21, loginName: TEAM_GROUP, roles: [RoleType.guest] }
  ];

  it('finds a group by its ID, not its name', () => {
    expect(hasLevel(access, 20, CAN_CHANGE_LIST)).toBe(true);
    expect(hasLevel(access, 21, CAN_CHANGE_LIST)).toBe(false);
  });

  it('doesn\'t count Contribute as enough to run a list', () => {
    expect(hasLevel([{ principalId: 20, loginName: 'x', roles: [RoleType.contributor] }], 20, CAN_CHANGE_LIST))
      .toBe(false);
  });
});
