import classNames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';
import { Link }   from 'react-router-dom';

import PackageActions             from 'main/actions/PackageActions';
import ProtocolActions            from 'main/actions/ProtocolActions';
import RunAPI                     from 'main/api/RunAPI';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout }              from 'main/components/TabLayout';
import ConnectToStores            from 'main/containers/ConnectToStoresHOC';
import { PackageHeader }          from 'main/pages/PackageOverviewPage';
import ProtocolDetails            from 'main/protocols/ProtocolDetails';
import PackageStore               from 'main/stores/PackageStore';
import ProtocolStore              from 'main/stores/ProtocolStore';
import Urls                       from 'main/util/urls';

import { Page, Breadcrumbs, Spinner } from '@transcriptic/amino';

// Allows a User to view and manage a Protocol
class PackageProtocol extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statusCode: undefined
    };
  }

  componentDidMount() {
    const { packageId, protocolName } = this.props.match.params;

    if (window.intercomSettings) {
      window.intercomSettings.package_id = packageId;
      window.intercomSettings.protocol_name = protocolName;
    }

    PackageActions.loadShortJson(packageId)
      .fail(xhr =>
        this.setState({ statusCode: xhr.status })
      );

    ProtocolActions.loadPackageProtocols(packageId, protocolName);
  }

  componentWillUnmount() {
    if (window.intercomSettings) {
      window.intercomSettings.package_id = undefined;
      window.intercomSettings.protocol_name = undefined;
    }
  }

  render() {
    const { packageId, protocolName } = this.props.match.params;
    return (
      <Page statusCode={this.state.statusCode}>
        <Choose>
          <When condition={!this.props.package}>
            <Spinner />
          </When>
          <Otherwise>
            <PageLayout
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
                        to={Urls.package_protocol(this.props.package.get('id'), protocolName)}
                      >{protocolName}
                      </Link>
                    </Breadcrumbs>
                  )}
                />
              )}
            >
              <TabLayout>
                <Choose>
                  <When condition={this.props.protocols.size == 0}>
                    <Spinner />
                  </When>
                  <Otherwise>
                    <div className="package-node protocol-node">
                      <PackageHeader package={this.props.package} />
                      <div>
                        <h2>{protocolName}</h2>
                        <ProtocolTabsAndDetail
                          packageId={packageId}
                          package={this.props.package}
                          protocols={this.props.protocols}
                        />
                      </div>
                    </div>
                  </Otherwise>
                </Choose>
              </TabLayout>
            </PageLayout>
          </Otherwise>
        </Choose>
      </Page>
    );
  }
}

PackageProtocol.contextTypes = {
  router: PropTypes.object.isRequired
};

PackageProtocol.propTypes = {
  package: PropTypes.instanceOf(Immutable.Map),
  protocols: PropTypes.instanceOf(Immutable.Iterable),
  match: PropTypes.shape({
    params: PropTypes.shape({
      packageId: PropTypes.string,
      protocolName: PropTypes.string
    })
  })
};

class ProtocolTabsAndDetail extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedId: undefined,
      loadingRuns: true,
      hasMore: false,
      offset: 0
    };
  }

  componentDidMount() {
    const selectedId = this.calcTabToShow();
    this.fetchRuns(selectedId);
  }

  fetchRuns(selectedId, cb) {
    const LIMIT = 25;
    // Fetch the data required for RunList component
    const request = {
      filters: {
        protocol_id: selectedId
      },
      includes: ['owner'],
      fields: {
        runs: [
          'created_at', 'status', 'progress', 'billing_valid?',
          'title', 'project_id', 'owner_id', 'protocol_id'
        ],
        projects: ['name'],
        users: ['name']
      },
      sortBy: ['-created_at'],
      order: ['desc'],
      limit: LIMIT,
      offset: this.state.offset
    };

    RunAPI.index(request)
      .done((payload) => {
        this.setState({
          loadingRuns: false,
          hasMore: (this.state.offset + payload.data.length) < payload.meta.record_count &&
            payload.data.length == LIMIT,
          offset: this.state.offset + payload.data.length
        });
        if (cb) {
          cb();
        }
      });
  }

  calcTabToShow() {
    const { selectedId } = this.state;
    const { protocols } = this.props;

    if (selectedId) {
      return selectedId;
    } else if (protocols.count()) {
      return protocols.first().get('id');
    } else {
      return undefined;
    }
  }

  render() {
    const { protocols } = this.props;

    const selectedId       = this.calcTabToShow();
    const selectedProtocol = protocols.find(p => p.get('id') === selectedId);
    return (
      <section className="section">
        <div className="row">
          <div className="versions col-xs-3">
            <ul className="nav-bar-vertical tab-style space-left">
              { protocols.map((protocol) => {
                const selected = protocol.get('id') === selectedId;
                return (
                  <ProtocolTab
                    key={protocol.get('id')}
                    protocol={protocol}
                    selected={selected}
                    onClick={() => {
                      const protocolId = protocol.get('id');
                      this.setState({
                        selectedId: protocolId,
                        loadingRuns: true,
                        offset: 0,
                        hasMore: false
                      });
                      this.fetchRuns(protocolId);
                    }
                    }
                  />
                );
              }) }
            </ul>
          </div>
          <Choose>
            <When condition={this.calcTabToShow() != undefined}>
              <div className="version-detail col-xs-9 protocol-version-detail">
                <ProtocolDetails
                  protocol={selectedProtocol}
                  packageId={this.props.packageId}
                  ownerId={this.props.package.getIn(['owner', 'id'])}
                  loadingRuns={this.state.loadingRuns}
                  hasMore={this.state.hasMore}
                  loadMore={cb => this.fetchRuns(this.calcTabToShow(), cb)}
                />
              </div>
            </When>
            <Otherwise>
              <Spinner />
            </Otherwise>
          </Choose>
        </div>
      </section>
    );
  }
}

ProtocolTabsAndDetail.propTypes = {
  packageId: PropTypes.string.isRequired,
  package: PropTypes.instanceOf(Immutable.Map),
  protocols: PropTypes.instanceOf(Immutable.Iterable)
};

// A tab inside a tab bar showing Protocol info
function ProtocolTab({ protocol, onClick, selected }) {
  const version = protocol.get('version');
  const published = protocol.get('published');

  return (
    <li // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
      onClick={onClick}
      key={protocol.get('id')}
    >
      <a className={selected ? 'active' : undefined}>
        <i
          className={classNames({
            fa: true,
            'pull-right': true,
            'fa-globe': published,
            'fa-lock': !published
          })}
        />
        {version}
      </a>
    </li>
  );
}

ProtocolTab.propTypes = {
  protocol: PropTypes.instanceOf(Immutable.Map).isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

const getStateFromStores = (props) => {
  const { packageId, protocolName } = props.match.params;

  const pkg = PackageStore.getById(packageId);

  const protocols = ProtocolStore.getAllForName(packageId, protocolName)
    .valueSeq()
    .reverse();

  return {
    package: pkg,
    protocols
  };
};

// TODO Add prop types to this component that is created by ConnectToStores
export default ConnectToStores(PackageProtocol, getStateFromStores);
