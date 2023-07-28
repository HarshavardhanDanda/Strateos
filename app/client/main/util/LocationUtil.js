import Immutable from 'immutable';

const LocationUtil = {
  categories: {
    box: 'box',
    box_cell: 'box_cell',
    rack: 'rack',
    tiso_column: 'tiso_column'
  },

  defaultTubeBoxConfig() {
    return {
      rows: 9,
      cols: 9
    };
  },

  defaultRackConfig() {
    return {
      rows: 2,
      cols: 3,
      cellHeightMM: 116.84
    };
  },

  // A map from parent category to a Set of categories that we allow
  // the user to add to that category.
  // Note that you cannot add new plate_rack_cells or box_cells to their parents.
  // This is because these children may only be created when their parent is created.
  addableChildCategories(category) {
    const defaultedCategory = category || 'Root';
    const rootCategories = ['freezer', 'workcell', 'refrigerator', 'Unknown', 'shelf'];

    const all = Immutable.Map({
      Root:          Immutable.Set([...rootCategories, 'region']),
      region:        Immutable.Set([...rootCategories]),
      Unknown:       Immutable.Set(['box', 'rack', 'tube_box_rack', 'Unknown']),
      freezer:       Immutable.Set(['Unknown', 'rack', 'tube_box_rack', 'shelf']),
      refrigerator:  Immutable.Set(['Unknown', 'rack', 'tube_box_rack', 'shelf']),
      shelf:         Immutable.Set(['rack', 'tube_box_rack']),
      tiso:          Immutable.Set(['tiso_column', 'Unknown']),
      tube_box_rack: Immutable.Set(['box']),
      workcell:      Immutable.Set(['tiso', 'shelf'])
    });

    return all.get(defaultedCategory, Immutable.Set([]));
  }
};

export default LocationUtil;
