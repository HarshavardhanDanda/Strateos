import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { Spinner } from '@transcriptic/amino';
import _ from 'lodash';

import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import ContainerStore from 'main/stores/ContainerStore';
import ShipmentCheckinActions from 'main/actions/ShipmentCheckinActions';
import ShipmentsCheckin from 'main/pages/ShipmentsCheckin/ShipmentsCheckin';
import ShipmentCheckinStore from 'main/stores/ShipmentCheckinStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import ShipmentAPI from 'main/api/ShipmentAPI';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import { CheckinShipmentSearchStore } from 'main/stores/search';
import LabStore from 'main/stores/LabStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import SessionStore from 'main/stores/SessionStore';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import ajax from 'main/util/ajax';
import { checkinShipmentPageActions } from './checkinShipmentActions';
import { checkinShipmentStateDefaults } from './checkinShipmentState';

export class ShipmentsCheckinPage extends React.Component {
  static get propTypes() {
    return {
      shipments: PropTypes.instanceOf(Immutable.Iterable),
      history: PropTypes.object,
      match: PropTypes.object
    };
  }

  constructor(props) {
    super(props);
    this.onPageChange = this.onPageChange.bind(this);
    this.getShipments = this.getShipments.bind(this);
    this.onSelectFilter = this.onSelectFilter.bind(this);
    this.page = this.page.bind(this);
    this.numPages = this.numPages.bind(this);
    this.loadShipments = this.loadShipments.bind(this);
    this.state = { loading: true, isShipmentSelected: true };
  }

  componentDidMount() {
    const { match } = this.props;
    const shipmentId = match  && match.params && match.params.shipmentId;
    ShipmentStore._empty();
    if (!shipmentId) {
      this.loadShipments()
        .done(() => {
          this.setState({ loading: false });
        });
    } else {
      if (ShipmentStore.getById(shipmentId) == undefined) {
        this.setState({ isShipmentSelected: false });

        ajax.when(ContainerTypeActions.loadAll(), ShipmentAPI.get(shipmentId, { includes: ['containers', 'containers.location'] })).then(() => {

          this.setState({ isShipmentSelected: true });
        });
      }
      this.setState({ isShipmentSelected: true });
    }
    const labIds = FeatureStore.getLabIds();
    LabConsumerActions.loadLabConsumersByLab(labIds.join());
  }

  componentDidUpdate({ match }) {
    const previousShipmentId = match && match.params && match.params.shipmentId;

    const currentMatch = this.props.match;
    const shipmentId = currentMatch && currentMatch.params && currentMatch.params.shipmentId;

    if (previousShipmentId !== shipmentId) {
      ShipmentCheckinActions.selectShipment(shipmentId);
    }
  }

  componentWillUnmount() {
    ShipmentCheckinActions.selectShipment(undefined);
    checkinShipmentPageActions.resetState();
  }

  loadShipments() {
    checkinShipmentPageActions.loadLabs(this.props.lab_ids);
    return checkinShipmentPageActions
      .doSearch({ ...checkinShipmentStateDefaults, lab_id: this.props.lab_ids.join() });
  }

  onSelectFilter(options) {
    const { organization_id, shipment_type } = options;

    if (organization_id === 'All Organizations') {
      options = _.extend(options, { organization_id: undefined });
    }

    if (shipment_type === 'All') {
      options =  _.extend(options, { shipment_type: undefined });
    }

    this.setState({ loading: true }, () => {
      checkinShipmentPageActions.onSearchFilterChange(options).done(() => {
        this.setState({  loading: false });
      });
    });
  }

  onPageChange(page) {
    this.setState({ loading: true }, () => {
      checkinShipmentPageActions.onSearchPageChange(page).done(() => {
        this.setState({  loading: false });
      });
    });
  }

  getSelectedShipment() {
    const selectedShipment = ShipmentCheckinStore.selectedShipment();

    if (selectedShipment) {
      return selectedShipment;
    }

    const { match } = this.props;
    const shipmentId =  match && match.params && match.params.shipmentId;
    return ShipmentStore.shipmentModelForId(shipmentId);
  }

  page() {
    return this.props.search.get('page', 1);
  }

  numPages() {
    return this.props.search.get('num_pages', 1);
  }

  getShipments() {
    if (!this.state.loading) {
      const shipments = this.props.search.get('results').map(shipment => {
        return ShipmentStore.shipmentModelForId(shipment.get('id'));
      });
      return Immutable.fromJS(shipments.filter(s => s));
    }
    return Immutable.List();
  }

  render() {
    const shipmentToContainers = !this.state.loading ?
      this.getShipments().toMap().mapEntries(([, s]) => {
        return [s.id(), s.containerIds().map(id => ContainerStore.getById(id))];
      }) : undefined;
    const selectedShipment = this.getSelectedShipment();

    return (
      <div>
        {this.state.isShipmentSelected ? (
          <ShipmentsCheckin
            locationSearchResults={ShipmentCheckinStore.locationSearchResults.get()}
            selectedBoxPosition={ShipmentCheckinStore.selectedBoxPosition.get()}
            selectedContainer={ShipmentCheckinStore.selectedContainer()}
            selectedLocation={ShipmentCheckinStore.selectedLocation.get()}
            selectedShipment={selectedShipment}
            shipmentToContainers={shipmentToContainers}
            shipments={this.getShipments()}
            loading={this.state.loading}
            onPageChange={this.onPageChange}
            numPages={this.numPages()}
            page={this.page()}
            onSelectFilter={this.onSelectFilter}
            history={this.props.history}
            labs={this.props.labs}
            loadShipments={this.loadShipments}
            showOrgFilter={this.props.showOrgFilter}
          />
        ) : <Spinner />}
      </div>
    );
  }
}

const getStateFromStores = () => {
  const searchOptions = checkinShipmentPageActions.searchOptions();
  let search = CheckinShipmentSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = CheckinShipmentSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const checkInLabs = FeatureStore.getLabIdsWithFeatures(
    FeatureConstants.CHECKIN_SAMPLE_SHIPMENTS
  ).toJS();

  const implementationShipmentLabs = FeatureStore.getLabIdsWithFeatures(
    FeatureConstants.MANAGE_IMPLEMENTATION_SHIPMENTS
  ).toJS();

  const lab_ids = _.uniq([
    ...checkInLabs,
    ...implementationShipmentLabs
  ]);

  const org = OrganizationStore.findBySubdomain(SessionStore.getOrg().get('subdomain'));
  const orgId = org ? org.get('id') : undefined;
  const showOrgFilter = LabConsumerStore.isOrgFilterApplicable(orgId);
  const labs = LabStore.getByIds(implementationShipmentLabs).map((lab) => {
    return {
      name: lab.get('name'),
      value: lab.get('id')
    };
  });

  return {
    searchOptions,
    search,
    labs,
    lab_ids,
    showOrgFilter
  };
};

export default ConnectToStoresHOC(ShipmentsCheckinPage, getStateFromStores);
