import ajax       from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import API from './API';

class OrganizationAPI extends API {
  constructor() {
    super('organizations');
  }

  create(attributes, options = {}) {
    const data = ajax.snakecase(attributes);
    return super.create(data, options).done(() => {
      NotificationActions.createNotification({
        text: 'Organization created successfully'
      });
    }).fail((...response) => {
      NotificationActions.handleError(...response);
    });
  }
}

export default new OrganizationAPI();
