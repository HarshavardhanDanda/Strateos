import HTTPUtil from 'main/util/HTTPUtil';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';

const CategoryActions = {
  loadCategories(options) {
    return HTTPUtil.get(Urls.categories(), { options })
      .fail((xhr, status, text) => {
        NotificationActions.handleError(xhr, status, text);
      });
  }
};

export default CategoryActions;
