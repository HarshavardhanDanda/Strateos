import _ from 'lodash';
import Immutable from 'immutable';

import rootNode from 'main/state/rootNode';

// Factor out some common logic for CRUD-ish stores. To use:
//
//   WidgetStore = _.extend {}, CRUDStore('widgets'),  # 'widgets' is the key under rootNode to use
//     act: (action) ->
//       switch action.type
//         when 'WIDGETS_LIST'
//           @_receiveData action.widgets  # action.widgets should be of the form [{id: 'string', ...}]
//         when 'WIDGET_REMOVE'
//           @_remove action.widget_id
//
//     getAllCoolWidgets: ->
//       @getAll()
//         .valueSeq()
//         .filter (x) -> x.get('cool')
//         .toList()
//
//   WidgetStore._register(Dispatcher)
const CRUDStore = function(key, useSessionStore) {
  return {
    act(_action) {},
    // By default ignore all actions.

    _objects: rootNode.sub(key, Immutable.Map()),

    // Call this with a list of objects (POJOs) that have an `id` key to add them
    // to the store. Shallow-merges over existing data.
    _receiveData(objects, replace = false) {
      this._objects.update((x) => {
        let updatedObj = x;
        objects.forEach((object) => {
          // unlike javascript, immutable js stores numeric keys as a different key than
          // a string. JSON api stringifys ids, while our rails controllers do not.

          let id;
          if (object.id != undefined) {
            id = object.id.toString();
          } else {
            // the LocationPane relies on a null id for the root
            id = object.id;
          }

          const imm_obj = Immutable.fromJS(object).set('id', id);

          if (replace) {
            updatedObj = updatedObj.set(id, imm_obj);
          } else {
            updatedObj = updatedObj.update(id, Immutable.Map(), b => b.merge(imm_obj));
          }
        });
        return updatedObj;
      });

      if (rootNode.get(key) == undefined) {
        rootNode.setIn([key], Immutable.Map());
      }

      if (useSessionStore) {
        this.saveToSessionStorage();
      }
    },

    _remove(id) {
      this._objects.removeIn(id);

      if (useSessionStore) {
        this.saveToSessionStorage();
      }
    },

    initialize(data) {
      if (useSessionStore) {
        this.loadFromSessionStorage();
      }

      if (data != undefined) {
        this._receiveData(data);
      }
    },

    has(id) {
      return this._objects.has(id);
    },

    getById(id, defaultValue) {
      return this._objects.getIn([id], defaultValue);
    },

    getByIds(ids) {
      return ids.map(id => this.getById(id))
        .filter(obj => obj != undefined);
    },

    getAll() {
      return this._objects.get().valueSeq();
    },

    size() {
      return this._objects.size();
    },

    _register(dispatcher) {
      this.dispatchToken = dispatcher.register(this.act.bind(this));
    },

    isLoaded() {
      return rootNode.get().get(key) != undefined;
    },

    find(predicate) {
      return this.getAll().find(predicate);
    },

    first() {
      const all = this.getAll();
      if (all == undefined) return undefined;

      return all.first();
    },

    last() {
      const all = this.getAll();
      if (all == undefined) return undefined;

      return all.last();
    },

    _empty() {
      this._objects.empty();

      if (useSessionStore) {
        this.saveToSessionStorage();
      }
    },

    keys() {
      return this._objects.keys();
    },

    sessionStorageKey() {
      return `stores/${key}`;
    },

    loadFromSessionStorage() {
      try {
        const localData = JSON.parse(sessionStorage.getItem(this.sessionStorageKey()));

        if (localData != undefined && localData.length) {
          this._receiveData(localData);
        }
      } catch (error) {
        console.warn('Unable to load data from session storage');
      }
    },

    saveToSessionStorage() {
      try {
        return sessionStorage.setItem(this.sessionStorageKey(), JSON.stringify(this.getAll().toJS()));
      } catch (e) {
        switch (e.name) {
          case 'QuotaExceededError':
          case 'NS_ERROR_DOM_QUOTA_REACHED':
            // chrome, firefox
            return sessionStorage.clear();
          default:
            return console.warn('Unable to save data to sessionStorage');
        }
      }
    }
  };
};

export default CRUDStore;
