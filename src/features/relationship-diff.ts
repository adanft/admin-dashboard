export type RelationshipDiff = {
  idsToAssign: string[];
  idsToRemove: string[];
};

export function diffSelectedIds(currentIds: string[], selectedIds: string[]): RelationshipDiff {
  const currentIdSet = new Set(currentIds);
  const selectedIdSet = new Set(selectedIds);

  return {
    idsToAssign: selectedIds.filter((id) => !currentIdSet.has(id)),
    idsToRemove: currentIds.filter((id) => !selectedIdSet.has(id)),
  };
}
