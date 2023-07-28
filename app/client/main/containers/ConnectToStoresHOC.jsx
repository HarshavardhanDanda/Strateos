import _ from 'lodash';
import React from 'react';

import getDisplayName from 'main/containers/getDisplayName';
import { eventEmitter } from 'main/state';

const ConnectToStores = (Component, getStateFromStores) => {
  class ConnectedComponent extends React.Component {
    static get internalComponent() {
      return Component;
    }

    constructor(props) {
      super(props);
      this.mounted = false;

      this.handleStoresChanged = this.handleStoresChanged.bind(this);
    }

    componentDidMount() {
      this.mounted = true;
      eventEmitter.on('change', this.handleStoresChanged);
    }

    componentWillUnmount() {
      this.mounted = false;
      eventEmitter.removeListener('change', this.handleStoresChanged);
    }

    handleStoresChanged() {
      if (this.mounted) {
        this.forceUpdate();
      }
    }

    render() {
      const storeProps = getStateFromStores(this.props);
      const props = _.extend({}, storeProps, this.props);
      return <Component {...props} />;
    }
  }

  ConnectedComponent.displayName = `Connected${getDisplayName(Component)}`;

  return ConnectedComponent;
};

export default ConnectToStores;
