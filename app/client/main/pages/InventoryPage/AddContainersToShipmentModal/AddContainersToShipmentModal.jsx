import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import ReturnShipmentActions     from 'main/actions/ReturnShipmentActions';
import { MultiStepModalWrapper } from 'main/components/Modal';
import ContainerStore            from 'main/stores/ContainerStore';

import OverviewPane from './OverviewPane';
import SuccessPane  from './SuccessPane';

class AddContainersToShipmentModal extends React.Component {
  static get propTypes() {
    return {
      ids: PropTypes.array.isRequired
    };
  }

  static get defaultState() {
    return {
      isLoading: false,

      // Structured as so:
      //   { errors: {containerId: errorStr }}
      shipabilityInfo: undefined
    };
  }

  static get modalId() {
    return 'AddContainersToShipmentModal';
  }

  constructor(props, context) {
    super(props, context);

    this.onOpen = this.onOpen.bind(this);

    this.state = AddContainersToShipmentModal.defaultState;
  }

  onOpen() {
    // prevent duplicate calls as onOpen seems to get called multiple times
    if (this.state.isLoading || this.state.shipabilityInfo) {
      return;
    }

    this.setState({ isLoading: true }, () => {
      const promise = ReturnShipmentActions.shipabilityInfo(this.props.ids);

      promise.done((shipabilityInfo) => {
        this.setState({ isLoading: false, shipabilityInfo });
      });
    });
  }

  defaultedInfo() {
    return this.state.shipabilityInfo || { errors: {} };
  }

  validContainers() {
    const info = this.defaultedInfo();
    const ids  = this.props.ids.filter(id => !info.errors[id]);
    return ContainerStore.getByIds(ids);
  }

  invalidContainers() {
    const info = this.defaultedInfo();
    const ids  = this.props.ids.filter(id => info.errors[id]);
    return ContainerStore.getByIds(ids);
  }

  resetState() {
    this.setState(AddContainersToShipmentModal.defaultState);
  }

  render() {
    const dataReady = !this.state.isLoading && !!this.state.shipabilityInfo;
    const validContainers = this.validContainers();
    const invalidContainers = this.invalidContainers();

    return (
      <MultiStepModalWrapper
        modalId={AddContainersToShipmentModal.modalId}
        modalSize="large"
        title="Add Containers to Shipping Cart"
        modalClass="add-containers-to-shipment-modal"
        paneTitles={Immutable.List(['OVERVIEW'])}
        beforeDismiss={() => this.resetState()}
        closeOnClickOut={false}
        stepHeaderIsClickable={_navIndex => false}
        onOpen={this.onOpen}
      >
        <OverviewPane
          dataReady={dataReady}
          validContainers={validContainers}
          invalidContainers={invalidContainers}
          alertTexts={this.defaultedInfo().errors}
        />

        <SuccessPane
          validContainers={validContainers}
        />
      </MultiStepModalWrapper>
    );
  }
}

export default AddContainersToShipmentModal;
