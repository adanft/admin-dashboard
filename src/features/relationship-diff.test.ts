import { describe, expect, it } from 'vitest';

import { diffSelectedIds } from './relationship-diff';

describe('diffSelectedIds', () => {
  it('returns ids to assign and remove while preserving submitted order', () => {
    expect(diffSelectedIds(['role-1', 'role-2'], ['role-2', 'role-3'])).toEqual({
      idsToAssign: ['role-3'],
      idsToRemove: ['role-1'],
    });
  });

  it('returns empty changes when current and selected ids match', () => {
    expect(
      diffSelectedIds(['permission-1', 'permission-2'], ['permission-1', 'permission-2']),
    ).toEqual({
      idsToAssign: [],
      idsToRemove: [],
    });
  });
});
