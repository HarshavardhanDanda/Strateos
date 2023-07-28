import PropTypes from 'prop-types';
import React from 'react';
import { SinglePaneModal } from 'main/components/Modal';
import { LabeledInput, TextInput } from '@transcriptic/amino';

class MaterialOrderAssignOrderIdModal extends React.Component {

  static get MODAL_ID() {
    return 'MATERIAL_ORDER_ASSIGN_ORDER_ID_MODAL';
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      orderId: ''
    };

    this.onAccept = this.onAccept.bind(this);
    this.resetOrderId = this.resetOrderId.bind(this);
    this.onChangeOrderId = this.onChangeOrderId.bind(this);
  }

  onAccept() {
    this.props.onAssignOrderId(this.state.orderId);
  }

  onChangeOrderId(e) {
    this.setState({ orderId: e.target.value });
  }

  resetOrderId() {
    this.setState({ orderId: '' });
  }

  render() {
    return (
      <SinglePaneModal
        modalSize="large"
        title={`Assign Order ID(${this.props.selected.length})`}
        modalId={MaterialOrderAssignOrderIdModal.MODAL_ID}
        closeOnClickOut={false}
        onAccept={this.onAccept}
        acceptText="Submit"
        acceptBtnDisabled={!this.state.orderId}
        beforeDismiss={this.resetOrderId}
      >
        <LabeledInput label="Order ID">
          <TextInput
            placeholder="Order ID"
            value={this.state.orderId}
            onChange={this.onChangeOrderId}
            autoFocus
          />
        </LabeledInput>
      </SinglePaneModal>
    );
  }
}

MaterialOrderAssignOrderIdModal.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAssignOrderId: PropTypes.func.isRequired
};

export default MaterialOrderAssignOrderIdModal;
