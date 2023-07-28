import * as Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { Spinner } from '@transcriptic/amino';
import IntakeKitAPI from 'main/api/IntakeKitsAPI';
import ShipmentActions from 'main/actions/ShipmentActions';
import { TabLayout } from 'main/components/TabLayout';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import IntakeKitStore from 'main/stores/IntakeKitStore';
import SessionStore from 'main/stores/SessionStore';
import { ShipmentStore } from 'main/stores/ShipmentStore';
import ajax from 'main/util/ajax';
import Urls from 'main/util/urls';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import Querystring from 'query-string';

import LabConsumerStore from 'main/stores/LabConsumerStore';

import RequestIntakeKitModal from 'main/inventory/inventory/RequestIntakeKitModal';
import ShipmentList from '../../components/ShipmentList';

import './IntakeKitsView.scss';

class IntakeKitsView extends React.Component {
  static get propTypes() {
    return {
      history: PropTypes.object,
      intakeKits: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      shipments: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      org: PropTypes.instanceOf(Immutable.Iterable).isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      statusCode: undefined,
      loading: true
    };

    this.onNavigateToContainer = this.onNavigateToContainer.bind(this);
  }

  componentDidMount() {
    ajax.when(
      IntakeKitAPI.indexAll(),
      ShipmentActions.loadAll()
    )
      .fail(() => this.setState({ statusCode: 400 }));

    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({
          labOperatorName: firstLabConsumer.getIn(['lab', 'operated_by_name']),
          labAddress: firstLabConsumer.getIn(['lab', 'address']),
        });
      }
      this.setState({ loading: false });
    });
  }

  onNavigateToContainer(containerId) {
    return this.props.history.push(Urls.container(containerId));
  }

  render() {
    return (
      <TabLayout theme="gray">
        {this.state.loading ? (
          <Spinner />
        ) : (
          <div className="inventory-modern">
            <div className="inventory-content">
              <div className="intake-kits">
                <ShipmentList
                  intakeKits={this.props.intakeKits}
                  shipments={this.props.shipments}
                  onNavigateToContainer={this.onNavigateToContainer}
                  labOperatorName={this.state.labOperatorName}
                  inTransitToYou={this.props.inTransitToYou}
                />
                <RequestIntakeKitModal {...this.props} />
              </div>
            </div>
          </div>
        )}
      </TabLayout>
    );
  }
}

const getStateFromStores = () => {
  const org = SessionStore.getOrg();
  const orgId = org && org.get('id');
  const inTransitToYou = Querystring.parse(window.location.search.substring(1)).in_transit_to_you;

  const intakeKits = IntakeKitStore.getByOrgId(orgId);
  const shipments  = ShipmentStore.getByOrgId(orgId);

  return { intakeKits, shipments, org, inTransitToYou };
};

export default ConnectToStores(IntakeKitsView, getStateFromStores);
