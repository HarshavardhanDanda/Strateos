import PropTypes from 'prop-types';
import React     from 'react';

import { LabeledInput, ButtonGroup, Button, Select } from '@transcriptic/amino';
import ModalActions from 'main/actions/ModalActions';
import { SinglePaneModal } from 'main/components/Modal';
import Autocomplete  from 'main/components/Autocomplete';
import './TransferModal.scss';

class TransferModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      receivingId: this.props.receivingId || '',
      transferContainers: true,
      selectedOrgId: ''
    };
    this.onRecipientChange = this.onRecipientChange.bind(this);
    this.onTransferContainersChange = this.onTransferContainersChange.bind(this);
    this.beforeDismiss = this.beforeDismiss.bind(this);
    this.closeDrawer = this.closeDrawer.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.renderDestinationOrgs = this.renderDestinationOrgs.bind(this);
    this.renderOrgName = this.renderOrgName.bind(this);
    this.getOrgName = this.getOrgName.bind(this);
  }

  onRecipientChange(receivingId) { this.setState({ receivingId }); }

  beforeDismiss() {
    if (!this.props.isProjectTransferModal) {
      this.setState({ receivingId: '' });
    }
    this.closeDrawer();
  }

  onTransferContainersChange(tc) { this.setState({ transferContainers: tc.target.checked }); }

  closeDrawer() {
    this.props.setIsDrawerOpen(false);
  }

  closeModal() {
    ModalActions.close(this.props.modalId);
  }

  getOrgName(orgId) {
    if (this.props.destinationOrgs.length == 1 && orgId == '') {
      return this.props.destinationOrgs[0].name;
    }
    const filteredData = this.props.destinationOrgs.filter((destOrg) => destOrg.value === orgId);
    return filteredData[0] && filteredData[0].name;
  }

  renderDrawerContent() {
    if (this.props.type === 'project') {
      return (
        <p>
          If the runs in the project are linked with runs in different projects, those links will be removed. Do you want to continue?
        </p>
      );
    } else if (this.props.type === 'container') {
      return (
        <p>
          Are you sure you want to transfer the selected containers to {this.getOrgName(this.state.selectedOrgId)}?
        </p>
      );
    } else {
      return (
        <p>
          Are you sure you want to transfer the selected {this.props.type}s to {this.props.receivingId}?
        </p>
      );
    }
  }

  renderDestinationOrgs() {
    if (this.props.destinationOrgs.length === 1) {
      return (<p className="transfer-modal__org-label">{this.props.destinationOrgs[0].name}</p>);
    } else {
      return (
        <Select
          options={this.props.destinationOrgs}
          value={this.state.selectedOrgId}
          onChange={e => { this.setState({ selectedOrgId: e.target.value }); }}
        />
      );
    }
  }

  renderOrgName() {
    return (
      this.props.type === 'container' ?
        (this.renderDestinationOrgs())
        : (<p className="transfer-modal__org-label">{this.props.receivingId}</p>)
    );
  }

  renderFooter() {
    const entityName = this.props.type === 'container' ? this.getOrgName(this.state.selectedOrgId) : this.state.receivingId;
    const disableButton = this.props.type === 'container' ? (this.state.selectedOrgId === '' && this.props.destinationOrgs.length !== 1) : false;
    return (
      <div className="modal__footer">
        <ButtonGroup>
          <Button type="info" link onClick={this.closeModal}>
            Cancel
          </Button>
          <Button
            size="medium"
            className="btn btn-primary transfer-btn"
            disabled={disableButton}
            onClick={() => {
              this.props.onTransfer(
                entityName,
                this.state.transferContainers);
            }}
          >
            Transfer
          </Button>
        </ButtonGroup>
      </div>
    );
  }

  render() {
    let entityOrgId = '';
    if (this.props.type === 'container') {
      if (this.props.destinationOrgs.length === 1 && this.state.selectedOrgId === '') {
        entityOrgId = this.props.destinationOrgs[0].value;
      } else {
        entityOrgId = this.state.selectedOrgId;
      }
    } else {
      entityOrgId = this.props.receivingId;
    }
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title={`Transfer ${this.props.type}s`}
        footerRenderer={this.renderFooter}
        beforeDismiss={this.beforeDismiss}
        hasDrawer={this.props.enableDrawer}
        drawerState={this.props.isDrawerOpen}
        drawerTitle="Are you sure?"
        drawerHeight={'250px'}
        drawerBodyProportion={'55%'}
        drawerChildren={this.renderDrawerContent()}
        drawerFooterChildren={
          this.props.renderDrawerFooter(
            entityOrgId,
            this.state.transferContainers
          )
        }
        onDrawerClose={this.closeDrawer}
      >
        <div className="tx-stack tx-stack--sm">
          <LabeledInput label={`Selected ${this.props.type}s`}>
            {this.props.selectionDescription}
          </LabeledInput>
          <LabeledInput label={`Transfer to ${this.props.entity}`}>
            { this.props.disableOrgSearch ?
              this.renderOrgName()
              :
              (
                <Autocomplete
                  id="transfer-id"
                  value={this.state.receivingId}
                  onChange={this.onRecipientChange}
                  onSearch={this.props.onSearch}
                />
              )
            }
          </LabeledInput>
          { this.props.type == 'project' &&
              (
              <LabeledInput label="Transfer all containers with project?">
                <input
                  id="transfer-containers"
                  type="checkbox"
                  onChange={this.onTransferContainersChange}
                  checked={this.state.transferContainers}
                />
              </LabeledInput>
              )
          }
        </div>
      </SinglePaneModal>
    );
  }
}

TransferModal.propTypes = {
  modalId:    PropTypes.string.isRequired,
  // the type of the items being transferred
  type:       PropTypes.string.isRequired,
  // the type of the receiving entity
  entity:     PropTypes.string.isRequired,
  // a text describing the items to be transferred
  selectionDescription: PropTypes.string,
  onSearch:   PropTypes.func.isRequired,
  onTransfer: PropTypes.func.isRequired,
  // the id of the entity recieving the items
  receivingId: PropTypes.string,
  // boolean to disable the organization search
  disableOrgSearch: PropTypes.bool,
  // boolean to check if project transfer modal
  isProjectTransferModal: PropTypes.bool,
  setIsDrawerOpen: PropTypes.func,
  renderDrawerFooter: PropTypes.func,
  isDrawerOpen: PropTypes.bool,
  enableDrawer: PropTypes.bool,
  destinationOrgs: PropTypes.arrayOf(PropTypes.object)
};

TransferModal.defaultProps = {
  renderDrawerFooter: () => {}
};

export default TransferModal;
