const DeleteUtil = {
  deleteItemFromGroup(groups, itemPath, selectedItemPath) {
    // Deletes an item from the group mapping.
    // Also calculates the groupId and index of the item to be selected next.
    //
    // When selecting the next item to be selected it will prefer items in the current
    // group before choosing from another.
    //
    // groups:   Immutable.Map(groupId -> [item1, item2])
    // itemPath: [groupId, index] of item to be deleted
    // selectedItemPath: [groupId, index] of item that is currently selected.

    const groupId         = itemPath[0];
    const selectedGroupId = selectedItemPath[0];
    const selectedIndex   = selectedItemPath[1];

    const globalIndex        = this.globalIndex(groups, itemPath);
    const currentGlobalIndex = this.globalIndex(groups, selectedItemPath);
    const prevGroupId        = this.globalIndexToGroupId(groups, globalIndex - 1);
    const nextGroupId        = this.globalIndexToGroupId(groups, globalIndex + 1);

    // delete item
    const filteredGroups = groups.deleteIn(itemPath);

    // check that we are deleting the currently selected item.
    const deletingCurrentItem = globalIndex === currentGlobalIndex;

    // Calculate the next item to select.
    let nextPath = selectedItemPath.slice(0);
    if (deletingCurrentItem) {
      if (nextGroupId === groupId) {
        nextPath = [groupId, selectedIndex];
      } else if (prevGroupId === groupId) {
        nextPath = [groupId, selectedIndex - 1];
      } else if (nextGroupId != undefined) {
        nextPath = [nextGroupId, 0];
      } else if (prevGroupId != undefined) {
        nextPath = [prevGroupId, filteredGroups.get(prevGroupId).size - 1];
      } else {
        nextPath = [undefined, undefined];
      }
    } else if (
      globalIndex < currentGlobalIndex &&
      groupId === selectedGroupId
    ) {
      // Update the nextPath if an item beneath it is deleted.
      nextPath = [groupId, selectedIndex - 1];
    }

    return [filteredGroups, nextPath];
  },

  allItems(groups) {
    return groups.valueSeq().flatten(true).toList();
  },

  globalIndex(groups, itemPath) {
    const item = groups.getIn(itemPath);

    return this.allItems(groups).findIndex(_item => _item === item);
  },

  globalIndexToGroupId(groups, index) {
    let groupId;
    let remaining = index;

    if (remaining < 0) {
      return undefined;
    }

    groups.forEach((items, _groupId) => {
      if (remaining < items.size && groupId == undefined) {
        groupId = _groupId;
      }

      remaining -= items.size;
    });

    return groupId;
  }
};

export default DeleteUtil;
