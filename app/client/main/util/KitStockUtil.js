const KitStockUtil = {
  kitShortageFromMaxStock(kitItem) {
    if (!kitItem.get('maximum_stock')) {
      return undefined;
    }

    const shortage = parseFloat(kitItem.get('maximum_stock')) - this.onHandQuantity(kitItem);

    if (kitItem.get('reservable')) {
      return Math.ceil(shortage / kitItem.get('amount'));
    } else {
      return Math.ceil(shortage / parseFloat(kitItem.get('volume_ul') / kitItem.get('amount')));
    }
  },

  onHandQuantity(kitItem) {
    if (kitItem.get('reservable')) {
      // Currently only agar plates are reservable, and all agar plates are stored by count not volume.
      const count = kitItem.get('stock_count');

      return parseFloat((count != undefined) ? count : 0);
    } else {
      const volume = kitItem.get('stock_volume');

      return parseFloat((volume != undefined) ? volume : 0);
    }
  }
};

export default KitStockUtil;
