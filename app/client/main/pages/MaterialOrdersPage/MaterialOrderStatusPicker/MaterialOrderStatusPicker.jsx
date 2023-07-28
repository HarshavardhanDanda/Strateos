import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import { RadioGroup, Radio } from '@transcriptic/amino';
import MaterialOrderStatus from 'main/util/MaterialOrderStatus';

const OrderStatuses = [
  MaterialOrderStatus.PENDING,
  MaterialOrderStatus.PURCHASED,
  MaterialOrderStatus.SHIPPED,
  MaterialOrderStatus.ARRIVED
];

class MaterialOrderStatusPicker extends React.Component {

  static get MODAL_ID() {
    return 'MATERIAL_ORDER_STATUS_PICKER';
  }

  constructor(props) {
    super(props);

    this.state = {
      value: undefined
    };

    this.onDismiss = this.onDismiss.bind(this);
    this.onAccept = this.onAccept.bind(this);
  }

  onDismiss() {
    this.setState({ value: undefined });
  }

  onAccept() {
    this.props.onSelected(this.state.value);
  }

  onChange(value) {
    this.setState({ value });
  }

  renderStatuses() {
    return (
      <RadioGroup
        name="order-status"
        value={this.state.value}
        onChange={e => this.onChange(e.target.value)}
      >
        {OrderStatuses.map((state) => (
          <Radio key={state} id={state} value={state} label={state} />
        ))}
      </RadioGroup>
    );
  }

  render() {
    return (
      <SinglePaneModal
        modalId={MaterialOrderStatusPicker.MODAL_ID}
        title={`Status(${this.props.selected.length})`}
        acceptText="Save"
        acceptBtnDisabled={!this.state.value}
        beforeDismiss={this.onDismiss}
        onAccept={this.onAccept}
      >
        {this.renderStatuses()}
      </SinglePaneModal>
    );
  }
}

MaterialOrderStatusPicker.propTypes = {
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelected: PropTypes.func.isRequired
};

export default MaterialOrderStatusPicker;
