import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import CompoundSourceSelector from 'main/pages/ReactionPage/CompoundSourceSelector';
import { CompoundSourceSelectorModalState, ContainerSearchDefaults, EMoleculesStateDefaults, CommonStateDefaults } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import { CompoundSourceSelectorContainerModalActions } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceContainerActions';
import { CompoundSourceSelectorModalActions } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceActions';
import InventoryDetails from 'main/inventory/InventorySelector/InventoryDetails';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import ContainerStore from 'main/stores/ContainerStore';
import { Button, ButtonGroup } from '@transcriptic/amino';
import Immutable from 'immutable';
import SetupPane from 'main/pages/ReactionPage/CompoundSourceSelector/SetupPane';
import CreateContainerPane from 'main/pages/ReactionPage/CompoundSourceSelector/CreateContainerPane';
import SuccessPane from 'main/pages/ReactionPage/CompoundSourceSelector/SuccessPane';
import ShippingInstructions from 'main/components/ShippingInstructions';
import MaterialStore from 'main/stores/MaterialStore';

class CompoundSourceSelectorModal extends React.Component {

  static get MODAL_ID() {
    return 'SEARCH_COMPOUND_LINKED_CONTAINER_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = {
      drawerOpen: false,
      disabled: true,
      isMulti: false,
      currDrawerPaneIndex: 0
    };
    _.bindAll(
      this,
      'beforeDismiss',
      'onSelectMaterial',
      'onSelectRow',
      'onRowClick',
      'closeDrawer',
      'onAddContainerClick',
      'onContainerCreation'
    );
    this.fetchContainersDebounced = _.debounce(this.fetchContainersDebounced, 400).bind(this);
  }

  updateReactant(id) {
    const { reactionId, reactantId } = this.props;
    const { searchSource } = CompoundSourceSelectorModalState.get();
    let requestData;
    if (searchSource === 'user_inventory') {
      const container = ContainerStore.getById(id);
      requestData = [
        {
          op: 'add',
          path: '/source',
          value: {
            type: 'CONTAINER',
            value: {
              id: id,
              attributes: {
                label: container.get('label'),
                containerTypeId: container.get('container_type_id'),
                containerTypeShortname: container.get('container_type_shortname')
              }
            }
          }
        }
      ];
    } else if (searchSource === 'e_molecules') {
      const { eMoleculesData, eMoleculesSearchType, compound_smiles } = CompoundSourceSelectorModalState.get();
      const eMoleculesResource = eMoleculesData.getIn([eMoleculesSearchType, compound_smiles]).find(supplier => supplier.get('id') === id);
      requestData = [
        {
          op: 'add',
          path: '/source',
          value: {
            type: 'MATERIAL',
            value: {
              attributes: {
                smiles: eMoleculesResource.get('smiles'),
                vendor: 'eMolecules',
                supplier: eMoleculesResource.get('supplierName'),
                tier: eMoleculesResource.get('tierText'),
                estimatedCost: eMoleculesResource.get('estimatedCost'),
                pricePoints: eMoleculesResource.get('pricePoints'),
                name: eMoleculesResource.get('name'),
                casNumber: eMoleculesResource.get('casNumber')
              }
            }
          }
        }
      ];
    } else if (searchSource === 'strateos') {
      const material = MaterialStore.getById(id);
      requestData = [
        {
          op: 'add',
          path: '/source',
          value: {
            type: 'RESOURCE',
            value: {
              attributes: {
                resource: material.getIn(['material_components', 0, 'resource', 'id']),
                vendor: material.get('vendor').get('name'),
                supplier: material.get('supplier').get('name')
              }
            }
          }
        }
      ];
    } else {
      return;
    }

    return ReactionAPI.updateReactant(reactionId, reactantId, requestData).then(
      () => {
        this.props.onSourceSelected(requestData[0].value);
        ModalActions.close(CompoundSourceSelectorModal.MODAL_ID);
      },
      (...e) => {
        NotificationActions.handleError(...e);
      }
    );
  }

  onSelectMaterial() {
    const { selected } = CompoundSourceSelectorModalState.get();
    const selectedId = selected.length && selected[0];
    return this.updateReactant(selectedId);
  }

  beforeDismiss() {
    this.setState({ disabled: true });
    CompoundSourceSelectorModalActions.updateState(_.extend({}, ContainerSearchDefaults, CommonStateDefaults,  _.omit(EMoleculesStateDefaults, 'eMoleculesData')));
  }

  getDrawerFooterButtonLabel() {
    return 'Select';
  }

  onRowClick(container) {
    const containerId = container.get('id');
    this.setState({
      isMulti: false,
      drawerOpen: true,
      drawerTitle: container.get('label'),
      drawerChildren: this.renderInventoryDetails(containerId),
      drawerFooterChildren: this.renderInventoryDetailsDrawerFooter(containerId)
    });
  }

  onSelectRow(selectedRows) {
    this.setState({ disabled: _.size(_.keys(selectedRows)) === 0 });
  }

  closeDrawer() {
    this.setState({ drawerOpen: false });
  }

  onDrawerButtonSelect(containerId) {
    CompoundSourceSelectorModalActions.updateState({
      selected: [containerId]
    });
    this.closeDrawer();
  }

  onAddContainerClick() {
    this.setState({
      isMulti: true,
      drawerOpen: true,
      drawerChildren: this.renderContainerCreation(),
      drawerTitle: 'Add New Samples',
      drawerPaneTitles: Immutable.List(['SETUP', 'CREATE', 'SUCCESS'])
    });
  }

  onContainerCreation(containers, shipment, labAddress, labOperatorName) {
    this.setState({
      isMulti: true,
      drawerOpen: true,
      drawerChildren: this.renderContainerCreation(shipment, labAddress, labOperatorName),
      drawerTitle: 'Add New Samples',
      drawerPaneTitles: Immutable.List(['SETUP', 'CREATE', 'SUCCESS'])
    });
    this.fetchContainersDebounced();
  }

  fetchContainersDebounced() {
    CompoundSourceSelectorContainerModalActions.onReSearch();
  }

  renderInventoryDetails(id) {
    return (
      <InventoryDetails
        containerId={id}
        onSelectedWellsChange={() => { }}
        isSingleSelect
        editable={false}
        disableButton={() => this.setState({ disabled: true })}
      />
    );
  }

  renderInventoryDetailsDrawerFooter(id) {
    return (
      <ButtonGroup>
        <Button
          type="secondary"
          size="small"
          onClick={this.closeDrawer}
        >
          Close
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() => this.onDrawerButtonSelect(id)}
        >
          {this.getDrawerFooterButtonLabel()}
        </Button>
      </ButtonGroup>
    );
  }

  renderContainerCreation(createdShipment, labAddress, labOperatorName) {
    const { compound_link_id, mass, volume } = CompoundSourceSelectorModalState.get();
    return [
      (<SetupPane key="setup-pane" />),
      (<CreateContainerPane
        key="create-container-pane"
        compoundLinkId={[compound_link_id]}
        onContainerCreation={this.onContainerCreation}
        mass={mass}
        volume={volume}
        filterContainerTypes={Immutable.fromJS(['a1-vial', 'd1-vial'])}
        hideCompoundLink
        hideBulkUpload
      />),
      (<SuccessPane
        key="success-pane"
        onAcknowledge={this.closeDrawer}
        instructionContent={createdShipment && (
          <ShippingInstructions
            shipment={createdShipment}
            address={labAddress}
            labOperatorName={labOperatorName}
          />
        )}
      />)
    ];
  }

  render() {
    const { title } = this.props;

    return (
      <SinglePaneModal
        modalId={CompoundSourceSelectorModal.MODAL_ID}
        title={title}
        acceptText="Select"
        onAccept={this.onSelectMaterial}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
        acceptBtnDisabled={this.state.disabled}
        hasDrawer
        isMulti={this.state.isMulti}
        drawerTitle={this.state.drawerTitle}
        drawerState={this.state.drawerOpen}
        onDrawerClose={this.closeDrawer}
        drawerChildren={this.state.drawerChildren}
        drawerFooterChildren={this.state.drawerFooterChildren}
        drawerPaneTitles={this.state.drawerPaneTitles}
      >
        <CompoundSourceSelector
          onRowClick={this.onRowClick}
          onSelectRow={this.onSelectRow}
          disableSelectButton={() => this.setState({ disabled: true })}
          onAddContainerClick={this.onAddContainerClick}
          wideSidebar
        />
      </SinglePaneModal>
    );
  }
}

CompoundSourceSelectorModal.propTypes = {
  title: PropTypes.string.isRequired,
  onSelectionChange: PropTypes.func
};

export default CompoundSourceSelectorModal;
