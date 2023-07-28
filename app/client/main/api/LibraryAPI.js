import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import API from './API';

class LibraryAPI extends API {

  constructor() {
    super('libraries');
  }

  getLibraries(filters) {
    const options = {
      version: 'v1',
      filters,
    };
    const url = this.createUrl('', options);
    return ajax.get(url)
      .fail((...response) => NotificationActions.handleError(...response));
  }

  createLibrary(payload) {
    const url = this.createUrl('', { version: 'v1' });
    return ajax.post(url, payload);
  }

  addCompoundsToLibrary(compoundIds, libraryId, options = { version: 'v1' }) {
    const url = this.createUrl(`${libraryId}/relationships/compounds`, options);
    const data = compoundIds.map(id => {
      return {
        type: 'compounds',
        id,
      };
    });
    const payload = { data };
    return ajax.post(url, payload);
  }

  removeCompoundsFromLibrary(compoundIds, libraryId, options = { version: 'v1' }) {
    const url = this.createUrl(`${libraryId}/relationships/compounds`, options);
    const data = compoundIds.map(id => {
      return {
        type: 'compounds',
        id,
      };
    });
    const payload = { data };
    return ajax.delete(url, payload);
  }

}

export default new LibraryAPI();
