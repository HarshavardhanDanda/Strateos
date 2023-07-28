import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import RunActions      from 'main/actions/RunActions';
import { Page, Spinner }        from '@transcriptic/amino';
import RunInstructions from 'main/components/RunInstructions';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';

class RunPreviewPage extends React.Component {

  static get propTypes() {
    return {
      previewId: PropTypes.string
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      statusCode: undefined,
      run: undefined
    };
  }

  componentWillMount() {
    if (this.props.previewId) {
      RunActions.loadPreview(this.props.previewId)
        .fail(() => this.setState({ statusCode: 400 }))
        .done((run) => {
          if (run.errors) {
            this.setState({ statusCode: 400 });
          } else {
            this.setState({ run: Immutable.fromJS(run), isLoading: false });
          }
        });
    }
  }

  render() {
    return (
      <Page title="Run Preview" statusCode={this.state.statusCode}>
        <Choose>
          <When condition={this.state.isLoading}>
            <Spinner />
          </When>
          <Otherwise>
            <RunInstructions run={this.state.run} />
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const previewId = props.match.params.previewId;

  return { previewId };
};

export default ConnectToStores(RunPreviewPage, getStateFromStores);
