/* eslint-disable consistent-return, no-underscore-dangle, camelcase */
import _ from 'lodash';

import Dispatcher from 'main/dispatcher';
import CRUDStore from 'main/util/CRUDStore';

const ProjectStore = _.extend({}, CRUDStore('projects'), {
  act(action) {
    switch (action.type) {
      case 'PROJECT_DATA':
        return this._receiveData([action.project]);

      case 'PROJECT_LIST':
        return this._receiveData(action.projects);

      case 'PROJECTS_SEARCH_RESULTS':
        return this._receiveData(action.results);

      case 'PROJECTS_API_LIST':
        return this._receiveData(action.entities);

      default:

    }
  },

  findByName(name) {
    return this.getAll().find(project => project.get('name') === name);
  },

  findByOrganizationId(organizationId) {
    return this.getAll().find(project => project.get('organization_id') === organizationId);
  }
});

ProjectStore._register(Dispatcher);

export default ProjectStore;
