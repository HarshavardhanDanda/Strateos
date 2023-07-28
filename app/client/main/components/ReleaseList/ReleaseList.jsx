import { inflect } from 'inflection';
import PropTypes   from 'prop-types';
import React       from 'react';

import { Card, Spinner, DateTime } from '@transcriptic/amino';
import ReleaseActions    from 'main/actions/ReleaseActions';
import RowWrappedGrid    from 'main/components/grid';
import ConnectToStores   from 'main/containers/ConnectToStoresHOC';
import ReleaseStore      from 'main/stores/ReleaseStore';
import Urls              from 'main/util/urls';

class ReleaseList extends React.Component  {

  constructor(props) {
    super(props);

    this.renderReleaseCard = this.renderReleaseCard.bind(this);

    this.state = { loading: true };
  }

  componentWillMount() {
    return ReleaseActions.loadAllForPackage(this.props.packageId).always(() => {
      this.setState({
        loading: false
      });
    });
  }

  renderReleaseCard(release) {
    const version = release.get('version');
    const num_protocols = release.get('num_protocols');

    return (
      <Card
        className="container-rect grid-element release-list__card"
        to={Urls.release(this.props.packageId, release.get('id'))}
        key={release.get('id')}
      >
        <div className="card__header">
          <p className="card__title">
            <span>
              Uploaded <DateTime
                timestamp={release.get('created_at')}
                format="absolute-format"
              />
            </span>
          </p>
        </div>
        <div className="card__footer">
          <div className="detail">
            <span className="desc">{`${num_protocols} ${inflect(
              'protocol',
              num_protocols
            )}`}
            </span>
          </div>
          <div className="detail">
            <span className="desc">{release.get('id')}</span>
          </div>
          <If condition={version}>
            <div className="detail">
              <span className="desc">{`Version ${version}`}</span>
            </div>
          </If>
        </div>
      </Card>
    );
  }

  render() {
    const releases = ReleaseStore.getAllForPackage(this.props.packageId);
    return (
      <div className="wrapped-card-page release-list">
        <RowWrappedGrid>
          <Choose>
            <When condition={releases.count()}>
              {releases
                .sortBy(release => release.get('created_at'))
                .reverse()
                .valueSeq()
                .map(this.renderReleaseCard)}
            </When>
            <When condition={this.state.loading}><Spinner /></When>
            <Otherwise>
              <div className="empty">There are no releases to display.</div>
            </Otherwise>
          </Choose>
        </RowWrappedGrid>
      </div>
    );
  }
}

ReleaseList.propTypes = {
  packageId: PropTypes.string.isRequired
};

export default ConnectToStores(ReleaseList, () => {});
