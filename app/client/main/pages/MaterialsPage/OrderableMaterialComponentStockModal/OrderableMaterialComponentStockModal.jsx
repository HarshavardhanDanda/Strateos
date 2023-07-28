import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { SinglePaneModal } from 'main/components/Modal';
import PagedStockView from 'main/pages/PagedStockView';
import ContainerActions from 'main/actions/ContainerActions';
import { StockContainerSearchStore } from 'main/stores/search';
import { getMeasurementMode, getMeasurementUnitFromMode } from 'main/util/MeasurementUtil';

class OrderableMaterialComponentStockModal extends React.Component {
  static get propTypes() {
    return {
      orderableMaterialComponent: PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  static get MODAL_ID() {
    return 'ORDERABLE_MATERIAL_COMPONENT_STOCK_MODAL';
  }

  constructor(props, context) {
    super(props, context);

    this.onActionClicked = this.onActionClicked.bind(this);
    this.onChangeSelectedContainers = this.onChangeSelectedContainers.bind(this);
    this.onRefresh = this.onRefresh.bind(this);

    this.state = {
      selectedContainerIds: Immutable.fromJS({}),
      refreshStock: false
    };
  }

  isConfirm(message) {
    return confirm(message);
  }

  onActionClicked() {
    if (this.isConfirm(`Are you sure you want to permanently delete these ${this.state.selectedContainerIds.size} items?`)) {
      this.onDestroyContainer(this.state.selectedContainerIds);
    }
  }

  onChangeSelectedContainers(selectedContainerIds) {
    this.setState({ selectedContainerIds: Immutable.fromJS(selectedContainerIds) });
  }

  onDestroyContainer() {
    const containerIds = Object.keys(this.state.selectedContainerIds.toJS());
    ContainerActions.destroyBulkContainer(containerIds).done(() => {
      this.setState({
        selectedContainerIds: Immutable.fromJS({})
      }, () => this.onRefresh());
    });
  }

  onRefresh() {
    this.setState({ refreshStock: true });
  }

  render() {
    const mode = getMeasurementMode(this.props.orderableMaterialComponent);
    const units = getMeasurementUnitFromMode(mode);
    return (
      <SinglePaneModal
        modalSize="xlg"
        modalId={`${OrderableMaterialComponentStockModal.MODAL_ID}_${this.props.orderableMaterialComponent.get('id', '')}`}
        title="Stock"
      >
        <div>
          <PagedStockView
            selectedContainerIds={this.state.selectedContainerIds}
            onChangeSelectedContainers={this.onChangeSelectedContainers}
            loadStockAction={ContainerActions.loadStock}
            searchStore={StockContainerSearchStore}
            searchStoreQuery={this.props.orderableMaterialComponent.getIn(['resource', 'id'])}
            searchParams={{
              resource_id: this.props.orderableMaterialComponent.getIn(['resource', 'id']),
              include_plates: true,
              include_expired: true,
              measurement_unit: units
            }}
            measurementMode={mode}
            refresh={this.state.refreshStock}
            onRefresh={() => this.setState({ refreshStock: false })}
            actions={[{
              title: 'Destroy',
              action: this.onActionClicked
            }]}
          />
        </div>
      </SinglePaneModal>
    );
  }
}

export default OrderableMaterialComponentStockModal;
