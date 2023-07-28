import NotificationActions from 'main/actions/NotificationActions';
import IdtOrderAPI from 'main/api/IdtOrderAPI';

const IdtOrderActions = {

  loadAll() {
    return IdtOrderAPI.indexAll()
      .fail((...args) => {
        NotificationActions.handleError(...(args || []));
      });
  }
};

export default IdtOrderActions;
