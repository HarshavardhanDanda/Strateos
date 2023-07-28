import Immutable   from 'immutable';
import { bindAll } from 'lodash';
import PropTypes   from 'prop-types';
import React       from 'react';
import { Link }    from 'react-router-dom';
import PackageActions             from 'main/actions/PackageActions';
import ProtocolActions            from 'main/actions/ProtocolActions';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import ReleaseList                from 'main/components/ReleaseList';
import SearchableProtocolList     from 'main/components/SearchableProtocolList';
import { TabLayout }              from 'main/components/TabLayout';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import PackageStore               from 'main/stores/PackageStore';
import SessionStore               from 'main/stores/SessionStore';
import String                     from 'main/util/String';
import ajax                       from 'main/util/ajax';
import Urls                       from 'main/util/urls';

import {
  Page,
  Breadcrumbs,
  Spinner
} from '@transcriptic/amino';

import PackageHeader from './PackageHeader';

class PackageOverviewPage extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      statusCode: undefined,
      publishedProtocols: Immutable.List(),
      unpublishedProtocols: Immutable.List()
    };
    bindAll(
      this,
      'handleOnCardClicked'
    );
  }

  componentDidMount() {
    const { packageId } = this.props.match.params;
    const latestOnly = false;

    if (window.intercomSettings) {
      window.intercomSettings.package_id = packageId;
    }

    const protocolsRequest = ProtocolActions.loadPackageProtocols(packageId, undefined, latestOnly);
    const pkgRequest       = PackageActions.loadShortJson(packageId);

    // This query is very custom, so we store it in state instead of the gloabl store.
    protocolsRequest.then((protocols) => {
      const latestProtocols = Immutable.fromJS(protocols).reduce((accumulator, protocol) => {
        if (accumulator.get(protocol.get('name'))) {
          // if protocol.version > accumulator.get(protocol.get('name')).get('version'))
          if (String.semanticCompare(protocol.get('version'), accumulator.get(protocol.get('name')).get('version')) === 1) {
            return accumulator.set(protocol.get('name'), protocol);
          }
          return accumulator;
        }
        return accumulator.set(protocol.get('name'), protocol);
      }, Immutable.Map());

      const publishedProtocols = latestProtocols.filter((protocol) => {
        return protocol.get('published');
      }).valueSeq();

      const unpublishedProtocols = latestProtocols.filter((protocol) => {
        return !protocol.get('published');
      }).valueSeq();

      this.setState({ publishedProtocols, unpublishedProtocols });
    });

    return ajax
      .when([pkgRequest, protocolsRequest])
      .always(() => {
        this.setState({ loading: false });
      })
      .fail(() =>
        this.setState({ statusCode: 400 })
      );
  }

  componentWillUnmount() {
    if (window.intercomSettings) {
      window.intercomSettings.package_id = undefined;
    }
  }

  handleOnCardClicked(protocolName) {
    return this.context.router.history.push(
      Urls.package_protocol(this.props.match.params.packageId, protocolName)
    );
  }

  render() {
    const subdomain = SessionStore.getOrg() ? SessionStore.getOrg().get('subdomain') : undefined;
    const { packageId } = this.props.match.params;
    return (
      <Page statusCode={this.state.statusCode}>
        <Choose>
          <When condition={!this.props.package}>
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
                    </Breadcrumbs>
                  )}
                  primaryInfoArea={(
                    <p className="hint tx-type--invert">
                      <i className="far fa-question-circle" />
                      {' Have questions? Check out the '}
                      <a
                        href="https://developers.strateos.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >developer docs
                      </a>
                      {' or view the '}
                      <a href={`/${subdomain}/vendor/materials`}>
                        provisionable resources
                      </a>.
                    </p>
                  )}
                />
              )}
            >
              <TabLayout>
                <div className="package">
                  <Choose>
                    <When condition={!this.props.package}>
                      <Spinner />
                    </When>

                    <Otherwise>
                      <PackageHeader package={this.props.package} />
                    </Otherwise>
                  </Choose>
                  <div>
                    <SearchableProtocolList
                      title="Published Protocols"
                      protocols={this.state.publishedProtocols}
                      loading={this.state.loading}
                    />
                    <SearchableProtocolList
                      title="Unpublished Protocols"
                      protocols={this.state.unpublishedProtocols}
                      loading={this.state.loading}
                    />
                    <div className="node-group-section">
                      <div className="card-group-header">
                        <h2>Releases</h2>
                      </div>
                      <ReleaseList packageId={packageId} />
                    </div>
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

PackageOverviewPage.contextTypes = {
  router: PropTypes.object.isRequired
};

PackageOverviewPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      packageId: PropTypes.string
    })
  }),
  package: PropTypes.instanceOf(Immutable.Map)
};

const getStateFromStores = (props) => {
  return {
    package: PackageStore.getById(props.match.params.packageId)
  };
};

export default ConnectToStores(PackageOverviewPage, getStateFromStores);
