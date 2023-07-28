import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import PackageActions             from 'main/actions/PackageActions';
import ProtocolActions            from 'main/actions/ProtocolActions';
import ReleaseActions             from 'main/actions/ReleaseActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import SearchableProtocolList     from 'main/components/SearchableProtocolList';
import { TabLayout }              from 'main/components/TabLayout';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import { PackageHeader }          from 'main/pages/PackageOverviewPage';
import ManageRelease              from 'main/protocols/ManageRelease';
import PackageStore               from 'main/stores/PackageStore';
import ProtocolStore              from 'main/stores/ProtocolStore';
import ReleaseStore               from 'main/stores/ReleaseStore';
import ajax                       from 'main/util/ajax';
import Urls                       from 'main/util/urls';
import FeatureConstants           from '@strateos/features';
import AcsControls                from  'main/util/AcsControls';

import { Page, Breadcrumbs, Spinner, DateTime } from '@transcriptic/amino';

class Release extends React.Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        params: PropTypes.shape({
          packageId: PropTypes.string,
          releaseId: PropTypes.string
        })
      }),
      package: PropTypes.instanceOf(Immutable.Map),
      protocols: PropTypes.instanceOf(Immutable.Iterable),
      release: PropTypes.instanceOf(Immutable.Map),
      isLoading: PropTypes.bool
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor() {
    super();

    this.state = {
      loading: true,
      statusCode: undefined
    };
  }

  componentDidMount() {
    const { packageId, releaseId } = this.props.match.params;
    return ajax
      .when(
        PackageActions.loadShortJson(packageId),
        ReleaseActions.load(packageId, releaseId),
        ProtocolActions.loadReleaseProtocols(releaseId)
      )
      .fail(() => this.setState({ statusCode: 400 }))
      .always(() => this.setState({ loading: false }));
  }

  render() {
    const { protocols, release, match } = this.props;
    const { packageId, releaseId } = match.params;
    return (
      <Page statusCode={this.state.statusCode}>
        <Choose>
          <When condition={this.props.isLoading}>
            <Spinner />
          </When>
          <Otherwise>
            <PageLayout
              theme="gray"
              PageHeader={(
                <PageHeader
                  titleArea={(
                    <Breadcrumbs>
                      <Link to={Urls.packages()}>Packages</Link>
                      <Link
                        to={Urls.package(this.props.package.get('id'))}
                      >{this.props.package.get('name')}
                      </Link>
                      <Link
                        to={Urls.release(this.props.package.get('id'), this.props.release.get('id'))}
                      >
                        <DateTime timestamp={(this.props.release.get('created_at'))} />
                      </Link>
                    </Breadcrumbs>
                  )}
                />
              )}
            >
              <TabLayout>
                <div className="package release-page tx-stack tx-stack--sm">
                  <h2>{`Release ${releaseId}`}</h2>
                  <PackageHeader package={this.props.package} />
                  <div>
                    <div className="panel page-header-panel">
                      <h3>{`Release ${releaseId}`}</h3>
                      { (release && AcsControls.isFeatureEnabled(FeatureConstants.PUBLISH_RELEASE_PACKAGE_PROTOCOL)) &&
                        <ManageRelease packageId={packageId} release={release} />
                      }
                    </div>
                    <SearchableProtocolList
                      title="Protocols"
                      packageId={packageId}
                      protocols={protocols}
                      loading={this.state.loading}
                      onCardClicked={protocolId => (
                        this.context.router.history.push(
                          Urls.package_protocol(packageId, protocolId)
                        )
                      )}
                    />
                  </div>
                </div>
              </TabLayout>
            </PageLayout>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

const getStateFromStores = (props) => {
  const { packageId, releaseId } = props.match.params;

  const protocols = ProtocolStore.protocolsForRelease({
    package_id: packageId,
    release_id: releaseId
  });
  const release = ReleaseStore.getById(releaseId);
  const _package = PackageStore.getById(packageId); // eslint-disable-line no-underscore-dangle

  return {
    package: _package,
    protocols,
    release,
    packageId,
    isLoading: !_package || !release
  };
};

const ConnectedRelease = ConnectToStores(Release, getStateFromStores);

ConnectedRelease.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      packageId: PropTypes.string,
      releaseId: PropTypes.string
    })
  })
};

export default ConnectedRelease;
