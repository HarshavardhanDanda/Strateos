import Dispatcher from 'main/dispatcher';
import AdminUrls from 'main/admin/urls';
import ajax from 'main/util/ajax';

const AdminActions = {
  load() {
    return ajax.get(AdminUrls.admins())
      .done((admins) => {
        Dispatcher.dispatch({
          type: 'ADMIN_LIST',
          admins
        });
      });
  },

  getSchedulerStats() {
    return ajax.get(AdminUrls.scheduler_stats());
  },

  create({ email, name }) {
    const promise = ajax.post(AdminUrls.admins(), { email, name });
    promise.done((admin) => {
      Dispatcher.dispatch({
        type: 'ADMIN_LIST',
        admins: [admin]
      });
    });
    return promise;
  },

  search(options) {
    const promise = ajax.get(AdminUrls.search_admins(), options);
    promise.done((response) => {
      Dispatcher.dispatch({
        type: 'ADMIN_LIST',
        admins: response.results
      });
    });
    return promise;
  }
};

export default AdminActions;
