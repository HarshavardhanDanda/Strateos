import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { inflect } from 'inflection';
import FeatureConstants from '@strateos/features';

import LabConsumerStore from 'main/stores/LabConsumerStore';
import AcsControls from 'main/util/AcsControls';
import {
  MultiStepModalWrapper,
  MultiStepModalPane
} from 'main/components/Modal';
import CreateContainerPane from 'main/pages/ReactionPage/CompoundSourceSelector/CreateContainerPane';
import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import LabConsumerActions from 'main/actions/LabConsumerActions';
import ShipmentCreatedSuccess from 'main/components/ShipmentCreatedSuccess';
import ShippingInstructions from 'main/components/ShippingInstructions';
import IntakeKitsAcknowledge from './IntakeKitsAcknowledge';

const MODAL_ID = 'ADD_CONTAINER_MODAL';

// In this modal you create containers by:
//   1. Acknowledge that you already have Transcriptic containers.
//   2. Describe the plates and tubes that you will be shipping.
//   3. In the end, the success page shows your created containers.
class AddContainerModal extends React.Component {

  static get defaultState() {
    return {
      createdContainers: Immutable.List(),
      createdShipment: undefined,
      testMode: false
    };
  }

  constructor(props, context) {
    super(props, context);
    this.onContainerCreation = this.onContainerCreation.bind(this);
    this.resetState = this.resetState.bind(this);

    this.state = AddContainerModal.defaultState;
    this.tubeCounter = 1;
  }

  componentWillMount() {
    if (Transcriptic.current_user.system_admin || this.state.testMode) {
      ContainerTypeActions.loadAll();
    } else {
      ContainerTypeActions.loadOrgShippable(this.props.subdomain);
    }
  }

  componentDidMount() {
    LabConsumerActions.loadLabsForCurrentOrg().done(() => {
      const firstLabConsumer = LabConsumerStore.getAllForCurrentOrg().first();
      if (firstLabConsumer) {
        this.setState({
          labOperatorName: firstLabConsumer.getIn(['lab', 'operated_by_name']),
          labAddress: firstLabConsumer.getIn(['lab', 'address']),
          lab_id: firstLabConsumer.getIn(['lab', 'id'])
        });
      }
    });
  }

  navigation() {
    return ['Setup', 'Create', 'Success'];
  }

  onContainerCreation(containers, shipment) {
    this.setState({
      createdContainers: containers,
      createdShipment: shipment
    });
    this.props.onContainerCreation(containers);
  }

  resetState() {
    this.setState(AddContainerModal.defaultState);
  }

  renderAcknowledge() {
    return (
      <MultiStepModalPane key="renderAcknowledge" renderFooter={false}>
        <If condition={AcsControls.isFeatureEnabled(FeatureConstants.CREATE_SAMPLE_SHIPMENTS) || AcsControls.isFeatureEnabled(FeatureConstants.CREATE_TEST_CONTAINERS)}>
          <IntakeKitsAcknowledge
            labOperatorName={this.state.labOperatorName}
            onSetNonTestMode={onNext =>
              this.setState(
                {
                  testMode: false
                },
                onNext()
              )}
            onSetTestMode={onNext =>
              this.setState(
                {
                  testMode: true
                },
                onNext()
              )}
            canBeTestMode={this.props.canBeTestMode}
            test_mode={this.props.test_mode}
          />
        </If>
      </MultiStepModalPane>
    );
  }

  renderCreateContainers() {
    return (
      <CreateContainerPane
        key="create-container-pane"
        onContainerCreation={this.onContainerCreation}
        testMode={this.state.testMode}
      />
    );
  }

  renderSuccess() {
    return (
      <MultiStepModalPane
        key="renderSuccess"
        isFinalPane
        renderFooter={false}
      >
        <Choose>
          <When condition={this.state.testMode}>
            <ShipmentCreatedSuccess
              containers={this.state.createdContainers}
              headerMessage={`Created ${
                this.state.createdContainers.count()
              } test-mode ${
                inflect('container', this.state.createdContainers.count())
              }.`}
            />
          </When>
          <Otherwise>
            <If condition={this.state.createdShipment && this.state.createdContainers}>
              <ShipmentCreatedSuccess
                shipment={this.state.createdShipment}
                containers={this.state.createdContainers}
                instructionContent={
                  <ShippingInstructions shipment={this.state.createdShipment} address={this.state.labAddress} labOperatorName={this.state.labOperatorName} />
                }
              />
            </If>
          </Otherwise>
        </Choose>
      </MultiStepModalPane>
    );
  }

  render() {
    return (
      <MultiStepModalWrapper
        modalId={MODAL_ID}
        modalSize="large"
        title="Add New Samples"
        paneTitles={Immutable.List(this.navigation())}
        beforeDismiss={this.resetState}
        closeOnClickOut={false}
      >
        {[
          this.renderAcknowledge(),
          this.renderCreateContainers(),
          this.renderSuccess()
        ]}
      </MultiStepModalWrapper>
    );
  }
}

AddContainerModal.propTypes = {
  onContainerCreation: PropTypes.func.isRequired,
  subdomain: PropTypes.string.isRequired,
  canBeTestMode: PropTypes.bool,
  test_mode: PropTypes.bool
};

AddContainerModal.MODAL_ID = MODAL_ID;

export default AddContainerModal;
