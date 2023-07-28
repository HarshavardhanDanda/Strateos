import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';
import Immutable from 'immutable';

const FavoriteStore = _.extend({}, CRUDStore('favorites'), {
  act(action) {
    switch (action.type) {
      case 'FAVORITES_API_LIST':
        this._receiveData(action.entities);
        break;
      case 'FAVORITE_DESTROYED':
        this._remove(action.id);
        break;

      default:
        return undefined;
    }
  },

  getByFavorableId(favorableId) {
    if (!this.hasFavorableId(favorableId)) return Immutable.Map();
    return this.getAll()
      .filter(fav => fav.get('favorable_id') === favorableId).first();
  },

  hasFavorableId(favorableId) {
    return !!this.getAll().filter(fav => fav.get('favorable_id') === favorableId).toJS().length;
  },

  getFavoriteProtocols() {
    return this.getAll().filter(fav => fav.get('favorable_type') === 'Protocol');
  }
});

FavoriteStore._register(Dispatcher);

export default FavoriteStore;
