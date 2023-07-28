import _ from 'lodash';

import Dispatcher          from 'main/dispatcher';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls                from 'main/util/urls';
import MaterialAPI from 'main/api/MaterialAPI';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

const MATERIALS_API_URL = Urls.materials();

const MaterialActions = {
  search(options) {
    const data = _.extend({}, options);
    const finalData = _.omit(data, 'q');
    return MaterialAPI.index(finalData)
      .fail((...response) => NotificationActions.handleError(...response));
  },

  bulkCreate(materials, options) {
    const data = { data: materials, include: options.includes };
    return ajax.post(Urls.bulk_create_materials(), data)
      .done((materials) => {
        JsonAPIIngestor.ingest(materials);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  update(material, options) {
    const data = { data: material, include: options.includes };
    return ajax.put(Urls.update_material(material.id), data)
      .done((material) => {
        JsonAPIIngestor.ingest(material);
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroyDependent(materialId) {
    return ajax.delete(`${MATERIALS_API_URL}/${materialId}`)
      .done(() => {
        Dispatcher.dispatch({ type: 'MATERIALS_DELETED', materialId });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  materialStats(materialId) {
    return ajax.get(`${Urls.material_stats(materialId)}`)
      .fail((...response) => NotificationActions.handleError(...response));
  }
};

export default MaterialActions;
