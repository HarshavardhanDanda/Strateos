import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import ContainerAPI from 'main/api/ContainerAPI';
import ConnectedRunRef from 'main/components/RunRef/ConnectedRunRef';

// Manages fetching the Container for the given RunRef
class RunRefContainer extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      fetching: false
    };
  }

  componentWillMount() {
    return this.fetchContainerIfExists(this.props.runRef);
  }

  componentDidUpdate(prevProps) {
    if (this.props.runRef.get('name') !== prevProps.runRef.get('name')) {
      this.fetchContainerIfExists(this.props.runRef);
    }
  }

  // The Container could be removed from our db
  fetchContainerIfExists(runRef) {
    if (runRef.get('container')) {
      this.fetch(runRef.get('container_id'));
    }
  }

  fetch(containerId) {
    this.setState({
      fetching: true
    });

    return ContainerAPI.get(containerId, {
      includes: ['aliquots', 'shipment']
    }).always(() =>
      this.setState({
        fetching: false
      })
    );
  }

  render() {
    return (
      <ConnectedRunRef
        runView={this.props.runView}
        runStatus={this.props.runStatus}
        runRef={this.props.runRef}
        run={this.props.run}
        showAppearsIn={this.props.showAppearsIn}
        fetchingContainer={this.state.fetching}
      />
    );
  }
}

RunRefContainer.propTypes = {
  run: PropTypes.instanceOf(Immutable.Map).isRequired,
  runRef: PropTypes.instanceOf(Immutable.Map).isRequired,
  showAppearsIn: PropTypes.bool,
  runView: PropTypes.string,
  runStatus: PropTypes.string
};

export default RunRefContainer;
