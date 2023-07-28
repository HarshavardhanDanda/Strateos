import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import Urls from 'main/util/urls';
import ReleaseActions from 'main/actions/ReleaseActions';
import ModalActions from 'main/actions/ModalActions';
import ReleaseLogModal from 'main/protocols/ReleaseLogModal';

// TODO The UX for publishing/retracting/deleting is terrible.  We just show
// a the text 'Publishing...' while the xhr is out and then don't present any confirmation.

// CRUD on a Release
class ManageRelease extends React.Component {
  static get propTypes() {
    return {
      release: PropTypes.instanceOf(Immutable.Map).isRequired,
      packageId: PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      retracting: false,
      publishing: false
    };
  }

  publish() {
    this.setState({ publishing: true });

    return ReleaseActions.publish(
      this.props.packageId,
      this.props.release.get('id')
    )
      .always(() => this.setState({ publishing: false }));
  }

  retract() {
    this.setState({ retracting: true });

    return ReleaseActions.retract(
      this.props.packageId,
      this.props.release.get('id')
    )
      .always(() => this.setState({ retracting: false }));
  }

  showLog() {
    ModalActions.open(ReleaseLogModal.MODAL_ID);
  }

  renderDelete() {
    const { release } = this.props;
    const canDelete = release.get('protocols') ? release.get('protocols').count() == 0 : undefined;
    return (
      <span>
        {' '}-{' '}
        <DeleteButton
          canDelete={canDelete}
          releaseId={release.get('id')}
          packageId={this.props.packageId}
        />
      </span>
    );
  }

  render() {
    const { release } = this.props;

    return (
      <div className="release-actions">
        <span>
          <ReleaseLogModal release={release} />
          <Choose>
            <When condition={release.get('validation_progress') < 100}>
              <span>
                validating: <a onClick={() => this.showLog()}>Show Log</a>
              </span>
            </When>
            <When condition={release.get('validation_errors').size}>
              <span>
                failed: <a onClick={() => this.showLog()}>Show Log</a>
                { this.renderDelete() }
              </span>
            </When>
            <Otherwise>
              <span>
                <Choose>
                  <When condition={this.state.publishing}>
                    <span>Publishing...</span>
                  </When>
                  <Otherwise>
                    <a onClick={() => this.publish()}>Publish</a>
                  </Otherwise>
                </Choose>
                {' '} - {' '}
                <Choose>
                  <When condition={this.state.retracting}>
                    <span>Retracting...</span>
                  </When>
                  <Otherwise>
                    <a onClick={() => this.retract()}>Retract</a>
                  </Otherwise>
                </Choose>
                { this.renderDelete() }
              </span>
            </Otherwise>
          </Choose>
        </span>
      </div>
    );
  }
}

class DeleteButton extends React.Component {
  static get propTypes() {
    return {
      canDelete: PropTypes.bool,
      releaseId: PropTypes.string.isRequired,
      packageId: PropTypes.string.isRequired
    };
  }

  static get defaultProps() {
    return {
      canDelete: false
    };
  }

  constructor() {
    super();
    this.state = {
      deleting: false
    };
  }

  delete() {
    this.setState({ deleting: true });

    return ReleaseActions.delete(this.props.packageId, this.props.releaseId)
      .done(() => { window.location = Urls.package(this.props.packageId); })
      .fail(() => this.setState({ deleting: false }));
  }

  render() {
    if (this.props.canDelete) {
      if (this.state.deleting) {
        return <span>Deleting...</span>;
      } else {
        return <a onClick={() => this.delete()}>Delete Release</a>;
      }
    } else {
      return <span>Cannot Delete (contains protocols)</span>;
    }
  }
}

export default ManageRelease;
