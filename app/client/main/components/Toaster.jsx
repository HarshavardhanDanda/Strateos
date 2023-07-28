import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import NotificationStore from 'main/stores/NotificationStore';
import connectToStoresHOC from 'main/containers/ConnectToStoresHOC';

import { Toast } from '@transcriptic/amino';

class Toaster extends React.Component {
  render() {
    return (
      <div className="notifications-layer">
        <div className="notifications">
          {
            this.props.notifications.map((notification) => {
              return <Toast key={notification.get('id')} notification={notification.toJS()} />;
            })
          }
        </div>
      </div>
    );
  }
}

Toaster.propTypes = {
  notifications: PropTypes.instanceOf(Immutable.Iterable)
};

const getStateFromStores = () => {
  return {
    notifications: NotificationStore.getAll()
  };
};

export default connectToStoresHOC(Toaster, getStateFromStores);
