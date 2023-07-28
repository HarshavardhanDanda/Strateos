import PropTypes from 'prop-types';
import React     from 'react';

import QuickLaunchPanel   from 'main/project/QuickLaunchPanel';
import QuickLaunchActions from 'main/actions/QuickLaunchActions';
import QuickLaunchStore   from 'main/stores/QuickLaunchStore';
import ConnectToStores    from 'main/containers/ConnectToStoresHOC';
import { Page }           from '@transcriptic/amino';

const propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      quickLaunchId: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired
    })
  }),
  quickLaunch: PropTypes.object
};

class QuickLaunchPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusCode: undefined
    };
  }

  componentDidMount() {
    const { projectId, quickLaunchId } = this.props.match.params;

    QuickLaunchActions.load(projectId, quickLaunchId)
      .always(xhr => this.setState({ statusCode: xhr.status }));
  }

  render() {
    return (
      <Page title="Quick Launch" statusCode={this.state.statusCode}>
        <If condition={this.props.quickLaunch}>
          <QuickLaunchPanel
            projectId={this.props.match.params.projectId}
            quickLaunch={this.props.quickLaunch}
          />
        </If>
      </Page>
    );
  }
}
QuickLaunchPage.propTypes = propTypes;

const getStateFromStores = (props) => {
  const quickLaunch = QuickLaunchStore.getById(props.match.params.quickLaunchId);

  return { quickLaunch };
};

export default ConnectToStores(QuickLaunchPage, getStateFromStores);
