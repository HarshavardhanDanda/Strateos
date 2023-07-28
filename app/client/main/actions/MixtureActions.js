import _ from 'lodash';

import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import Dispatcher from 'main/dispatcher';

const MixtureActions = {

  getMixtureById(mixtureId) {
    return ajax.get(Urls.mixtures(mixtureId))
      .done(response => {
        const mixture = {
          id: response.data.id,
          ...response.data.attributes
        };
        Dispatcher.dispatch({
          type: 'MIXTURES_LIST',
          mixtures: [mixture]
        });
      });
  }
};

export default MixtureActions;
