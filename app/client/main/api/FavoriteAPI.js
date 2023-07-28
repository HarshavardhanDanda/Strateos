import API from 'main/api/API';
import Dispatcher from 'main/dispatcher';

class FavoriteAPI extends API {
  constructor() {
    super('favorites');
  }

  destroy(id) {
    return super.destroy(id).done(() => {
      Dispatcher.dispatch({ type: 'FAVORITE_DESTROYED', id });
    });
  }
}

export default new FavoriteAPI();
