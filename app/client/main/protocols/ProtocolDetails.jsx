import classNames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';
import { Link }   from 'react-router-dom';

import Urls from 'main/util/urls';
import ProtocolActions from 'main/actions/ProtocolActions';
import RelatedRuns from 'main/pages/PackageProtocolPage/RelatedRuns';

import FeatureConstants from '@strateos/features';
import AcsControls      from  'main/util/AcsControls';
import { Button } from '@transcriptic/amino';

import './ProtocolDetails.scss';

// Shows details of a Protocol
class ProtocolDetails extends React.Component {

  retract(id, done) {
    return ProtocolActions.retract(id).always(done);
  }

  publish(id, done) {
    return ProtocolActions.publish(id).always(done);
  }

  render() {
    const published = this.props.protocol.get('published');
    return (
      <div className="protocol-details">
        <div className="detail">
          <h4>explanation</h4>
          <p>
            {this.props.protocol.get('description')}
          </p>
        </div>
        <div className="detail">
          <h4>identifier</h4>
          <p>
            {this.props.protocol.get('id')}
          </p>
        </div>
        <div className="detail">
          <h4>release</h4>
          <Link
            to={Urls.release(
              this.props.packageId,
              this.props.protocol.get('release_id')
            )}
          >
            {this.props.protocol.get('release_id')}
          </Link>
        </div>
        <div className="detail">
          <h4>version</h4>
          <p>
            {this.props.protocol.get('version')}
          </p>
        </div>
        <If
          condition={this.props.protocol.get('display_name')}
        >
          <div className="detail">
            <h4>display name</h4>
            <p>
              {this.props.protocol.get('display_name')}
            </p>
          </div>
        </If>
        <div className="detail published-info">
          <div className="published-status-container">
            <span>
              <i
                className={classNames('fa', {
                  'fa-globe': published,
                  'fa-lock': !published
                })}
              />
              <Choose>
                <When condition={published}> Published</When>
                <Otherwise> Unpublished</Otherwise>
              </Choose>
            </span>
          </div>
          <div className="publish-copy">
            <div className="hint">
              Only published protocols are able to be launched.
            </div>
          </div>
          <If
            condition={AcsControls.isFeatureEnabled(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL) ||
              Transcriptic.current_user.system_admin
            }
          >
            <Button
              waitForAction
              type="default"
              onClick={(done) => {
                const id = this.props.protocol.get('id');
                if (published) {
                  return this.retract(id, done);
                } else {
                  return this.publish(id, done);
                }
              }}
            >
              <Choose>
                <When condition={published}>Retract this Protocol</When>
                <Otherwise>Publish this Protocol</Otherwise>
              </Choose>
            </Button>
          </If>
        </div>
        <div className="tx-stack">
          <div className="tx-stack__block--xlg">
            <h2>Runs of this Version</h2>
          </div>
          <div className="tx-stack__block--xlg">
            <RelatedRuns
              protocolId={this.props.protocol.get('id')}
              loadingRuns={this.props.loadingRuns}
            />
          </div>
          <If condition={this.props.hasMore}>
            <div className="protocol-details__load-more">
              <Button
                type="primary"
                onClick={cb => this.props.loadMore(cb)}
                waitForAction
              >
                Load Older Runs
              </Button>
            </div>
          </If>
        </div>
      </div>
    );
  }
}

ProtocolDetails.propTypes = {
  ownerId: PropTypes.string,
  protocol: PropTypes.instanceOf(Immutable.Map).isRequired,
  packageId: PropTypes.string.isRequired,
  loadingRuns: PropTypes.bool,
  hasMore: PropTypes.bool,
  loadMore: PropTypes.func
};

export default ProtocolDetails;
