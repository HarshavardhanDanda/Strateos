import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import { ModalHeader, matches, Spinner, SearchField, SearchFilterBar, SearchFilter, SearchFilterWrapper, ControlBox } from '@transcriptic/amino';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import ProtocolStore from 'main/stores/ProtocolStore';
import ProtocolActions from 'main/actions/ProtocolActions';
import ModalActions from 'main/actions/ModalActions';
import { BSLRunBanner } from 'main/components/Banners';
import ProBroMoNoResult from 'main/project/ProBroMoNoResult';
import { TabLayout, TabLayoutSidebar } from 'main/components/TabLayout';

import ajax from 'main/util/ajax';

import FavoriteAPI from 'main/api/FavoriteAPI';
import FavoriteStore  from 'main/stores/FavoriteStore';
import ProtocolCard from './ProtocolCard';
import {
  LaunchProtocolOverviewHeader,
  LaunchProtocolOverviewFooter,
  LaunchProtocolOverviewBody
} from './LaunchProtocolOverview';

import './ProBroMo.scss';

const MODAL_ID = 'PROTOCOL_BROWSER_MODAL';

class ProtocolBrowserModal extends React.Component {
  static get MODAL_ID() {
    return MODAL_ID;
  }

  constructor(props, context) {
    super(props, context);
    this.bannerRenderer = this.bannerRenderer.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.currentlyFilteredProtocols = this.currentlyFilteredProtocols.bind(this);
    this.filterProtocolsBySearch = this.filterProtocolsBySearch.bind(this);
    this.navigateToProtocol = this.navigateToProtocol.bind(this);
    this.onSelectProtocol = this.onSelectProtocol.bind(this);
    this.setQuery = this.setQuery.bind(this);
    this.filterProtocolsByCategory = this.filterProtocolsByCategory.bind(this);
    this.launch = this.launch.bind(this);
    this.renderCards = this.renderCards.bind(this);
    this.filters = this.filters.bind(this);

    this.state = {
      currentProtocolFilter: 'all',
      currentProtocolCategories: [],
      lastSelectedFilter: 'all',
      query: '',
      loadingProtocols: Immutable.Set(),
      loadingProjectProtocols: true,
      projectProtocolIds: undefined,
      protocolId: undefined
    };
  }

  filters() {
    return {
      all: {
        display: 'All',
        protocols: () => {
          const protocols = ProtocolStore.getAll();
          const filteredProtocols = ProtocolStore.filterForOrg(protocols, this.props.project.get('organization_id'));
          return ProtocolStore.filterLatest(filteredProtocols).toJS();
        }
      },
      organization: {
        display: 'In this organization',
        protocols: () => {
          const publishedProtocols = ProtocolStore.getAllPrivate().filter(pr =>
            pr.get('published')
          );
          const filteredProtocols = ProtocolStore.filterForOrg(publishedProtocols, this.props.project.get('organization_id'));

          return ProtocolStore.filterLatest(filteredProtocols).toJS();
        }
      },
      project: {
        display: 'In this project',
        protocols: (protocolIds) => {
          // SUPER HACK
          // These categories should be part of the BrowserModal component
          // so that we don't have to pass arbitary data to each of the categories.
          // Only this category's protocol function requires args.
          const protocols = ProtocolStore.getByIds(protocolIds || Immutable.List());
          const filteredProtocols = ProtocolStore.filterForOrg(protocols, this.props.project.get('organization_id'));

          return ProtocolStore.filterLatest(filteredProtocols).toJS();
        }
      },

      favorites: {
        display: 'Favorites',
        protocols: () => {
          const protocolIds = FavoriteStore.getFavoriteProtocols().map((fav) => fav.get('favorable_id'));
          const protocols = ProtocolStore.getByIds(protocolIds || Immutable.List());
          const filteredProtocols = ProtocolStore.filterForOrg(protocols, this.props.project.get('organization_id'));
          return ProtocolStore.filterLatest(filteredProtocols).toJS();
        }
      }
    };
  }

  onOpen() {
    const isImplementation = this.props.project.get('is_implementation');
    const projectOrgId = this.props.project.get('organization_id');
    const options = {};
    if (isImplementation) {
      options.filter = { implementation_org: projectOrgId };
    }
    const promise1 = ProtocolActions.loadList(options);
    const promise2 = ProtocolActions.loadProjectProtocols(
      this.props.project.get('id'),
      true
    );
    const promise3 = FavoriteAPI.index({
      filters: {
        favorable_type: 'Protocol'
      }
    });
    ajax.when(promise1, promise2, promise3).then((res1, protocols) => {
      const ids = protocols[0].map(p => p.id);

      this.setState({
        loadingProjectProtocols: false,
        projectProtocolIds: Immutable.fromJS(ids)
      });
    });
  }

  onSelectProtocol() {
    this.props.onSelectProtocol(this.state.protocolId);
    return this.dismiss();
  }

  setQuery(q) {
    this.setState({
      query: q
    });

    if (q.length === 0) {
      // The user cleared the search query, so jump them back to the last
      // category they explicitly selected.
      this.setState({
        currentProtocolFilter: this.state.lastSelectedFilter
      });
    }
  }

  dismiss() {
    ModalActions.close(MODAL_ID);
  }

  filterProtocolsByCategory() {
    const protocols = this.currentlyFilteredProtocols();
    if (!this.state.currentProtocolCategories.length) {
      return protocols;
    }

    return _.filter(protocols, (p) => {
      return _.intersection(this.state.currentProtocolCategories, p.categories).length;
    });
  }

  // input: js array of protocols
  // output: js array of protocols
  filterProtocolsBySearch(protocols) {
    const q = this.state.query;
    if (!q) return protocols;

    return protocols.filter((pr) => {
      return _.some([
        matches(pr.display_name, q),
        matches(pr.name, q),
        matches(pr.description, q),
        matches(pr.package_name, q)
      ]);
    });
  }

  navigateToProtocol(protocol) {
    const hasRequiredData =
      protocol.inputs &&
      protocol.manifest &&
      protocol.description;

    if (hasRequiredData) {
      this.launch(protocol);
    } else {
      const loadingProtocols = this.state.loadingProtocols.add(
        protocol.id
      );
      this.setState(
        {
          loadingProtocols
        },
        () => {
          ProtocolActions.load(protocol.id).done((protocolData) => {
            this.launch(Immutable.fromJS(protocolData));
          });
        }
      );
    }
  }

  launch(protocol) {
    const loadingProtocols = this.state.loadingProtocols.remove(
      protocol.get('id')
    );
    return this.setState({
      protocolId: protocol.get('id'),
      loadingProtocols
    });
  }

  bannerRenderer() {
    return (
      <If condition={this.props.project.get('bsl') === 2}>
        <BSLRunBanner bsl={2} />
      </If>
    );
  }

  // output: array of JS objects
  currentlyFilteredProtocols() {
    const filter = this.filters()[this.state.currentProtocolFilter];

    return this.filterProtocolsBySearch(
      filter.protocols(this.state.projectProtocolIds)
    );
  }

  currentlyDisplayedProtocols() {
    return this.filterProtocolsByCategory();
  }

  categoriesForProtocols(protocols) {
    return _.compact(
      _.uniq(
        protocols.reduce((acc, p) => {
          return acc.concat(p.categories);
        }, [])
      )
    ).map((cat) => {
      return {
        queryTerm: cat,
        display: cat
      };
    });
  }

  renderCards() {
    const isReady =
      ProtocolStore.isLoaded() && !this.state.loadingProjectProtocols;
    if (!isReady) return <Spinner />;

    const protocols = this.currentlyDisplayedProtocols();
    return (
      <div className="protocol-tiles">
        <Choose>
          <When condition={protocols.length > 0}>
            {protocols.map((protocol) => {
              return (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
                  onClick={() => this.navigateToProtocol(protocol)}
                  searchText={this.state.query}
                  isFetching={this.state.loadingProtocols.has(
                    protocol.id
                  )}
                />
              );
            })}
          </When>
          <Otherwise>
            <ProBroMoNoResult />
          </Otherwise>
        </Choose>
      </div>
    );
  }

  renderHeader(protocol) {
    return (
      <Choose>
        <When condition={protocol}>
          <LaunchProtocolOverviewHeader
            manifest={protocol}
            onBackToProtocols={() =>
              this.setState({
                protocolId: undefined
              })}
            dismiss={this.dismiss}
          />
        </When>
        <Otherwise>
          <ModalHeader
            onDismiss={this.dismiss}
            titleContent={'Protocols'}
          />
        </Otherwise>
      </Choose>
    );
  }

  renderFooter(protocol) {
    return (
      <If condition={protocol}>
        <LaunchProtocolOverviewFooter
          onBackToProtocols={() =>
            this.setState({
              protocolId: undefined
            })}
          onSelectProtocol={() => this.onSelectProtocol()}
        />
      </If>
    );
  }

  render() {
    let protocol;
    const protocolIm = this.props.getProtocol(this.state.protocolId);
    if (protocolIm) {
      protocol = protocolIm.toJS();
    }

    const categoryOptions = this.categoriesForProtocols(this.currentlyFilteredProtocols());

    return (
      <SinglePaneModal
        onOpen={this.onOpen}
        modalSize="large"
        modalClass={protocol ? 'multi-step-modal' : 'probromo'}
        modalBodyClass={protocol ? 'protocol-overview' : ''}
        modalId={MODAL_ID}
        headerRenderer={() => this.renderHeader(protocol)}
        bannerRenderer={this.bannerRenderer}
        footerRenderer={() => this.renderFooter(protocol)}
      >
        <Choose>
          <When condition={protocol}>
            <LaunchProtocolOverviewBody manifest={protocol} />
          </When>
          <Otherwise>
            <TabLayout contextType="modal" wideSidebar>
              <TabLayoutSidebar>
                <div className="tx-stack tx-stack--sm">
                  <SearchFilterBar orientation="vertical">
                    <SearchFilterWrapper
                      id="search"
                      alwaysOpen
                      controlBoxPills={(
                        <ControlBox.Pill
                          id="pro-bro-mo-search"
                          value={this.state.query}
                          onReset={() => {
                            this.setQuery('');
                          }}
                        />
                      )}
                    >
                      <SearchField
                        value={this.state.query}
                        onChange={e => this.setQuery(e.target.value)}
                        reset={() => this.setQuery('')}
                        searchType="Protocol name"
                      />
                    </SearchFilterWrapper>
                    <SearchFilter
                      id="protocols"
                      title="Protocols"
                      options={
                        _.toPairs(this.filters()).map((pair) => {
                          return {
                            queryTerm: pair[0],
                            display: pair[1].display,
                            allOption: pair[1].display === 'All'
                          };
                        })
                      }
                      alwaysOpen
                      currentSelection={this.state.currentProtocolFilter}
                      onSelectOption={(filter) => {
                        const filteredProtocols = this.filters()[filter].protocols();
                        const categoriesForFilteredProtocols = this.categoriesForProtocols(filteredProtocols);

                        const newState = {
                          currentProtocolFilter: filter,
                          lastSelectedFilter: filter
                        };

                        if (!categoriesForFilteredProtocols.length) {
                          newState.currentProtocolCategories = [];
                        }

                        this.setState(newState);
                      }}
                    />
                    <If condition={categoryOptions.length > 1 || this.state.currentProtocolCategories.length}>
                      <SearchFilter
                        id="categories"
                        title="Categories"
                        options={categoryOptions}
                        isMultiSelect
                        alwaysOpen
                        currentSelection={this.state.currentProtocolCategories}
                        onSelectOption={(selections) => {
                          this.setState({
                            currentProtocolCategories: selections
                          });
                        }}
                      />
                    </If>
                  </SearchFilterBar>
                </div>
              </TabLayoutSidebar>
              <div>
                {this.renderCards()}
              </div>
            </TabLayout>
          </Otherwise>
        </Choose>
      </SinglePaneModal>
    );
  }
}

ProtocolBrowserModal.displayName = 'ProtocolBrowserModal';

ProtocolBrowserModal.launchModal = function() {
  ModalActions.open(MODAL_ID);
};

ProtocolBrowserModal.propTypes = {
  project: PropTypes.instanceOf(Immutable.Map),
  onSelectProtocol: PropTypes.func.isRequired,
  getProtocol: PropTypes.func.isRequired
};

const ConnectedProBroMo = ConnectToStores(ProtocolBrowserModal, () => {
  return {
    getProtocol: id => ProtocolStore.getById(id)
  };
});

ConnectedProBroMo.launchModal = ProtocolBrowserModal.launchModal;

export default ConnectedProBroMo;
