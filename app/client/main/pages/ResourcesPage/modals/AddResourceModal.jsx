import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import ResourceStore from 'main/stores/ResourceStore';
import ContainerStore from 'main/stores/ContainerStore';
import ResourceActions from 'main/actions/ResourceActions';
import EditResource from 'main/pages/ResourcesPage/modals/EditResource';
import { SinglePaneModal } from 'main/components/Modal';
import Dispatcher from 'main/dispatcher';
import CompoundSelectorDrawer from 'main/components/Compounds/CompoundSelector/CompoundSelectorDrawer';
import { ResourceSearchStore } from 'main/stores/search';
import { Button } from '@transcriptic/amino';
import { validators } from 'main/components/validation';

class AddResourceModal extends React.Component {

  static get MODAL_ID() {
    return 'CREATE_RESOURCE_MODAL';
  }

  constructor(props) {
    super(props);

    this.create = this.create.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.updatedCompound = this.updatedCompound.bind(this);
    this.onAccept = this.onAccept.bind(this);
    this.getEditResource = this.getEditResource.bind(this);
    this.toggleCompoundSelector = this.toggleCompoundSelector.bind(this);
    this.isFormInvalid = this.isFormInvalid.bind(this);

    this.state = this.defaultState();
  }

  defaultState() {
    return {
      resource: {
        name: '',
        kind: ResourceStore.defaultKind,
        storage_condition: ContainerStore.defaultStorageCondition,
        sensitivities: [],
        purity: 0,
        compound_id: undefined,
        compound: null
      },
      mode: 'create',
      selectingCompound: false,
      readOnly: false
    };
  }

  onUpdate(resource) {
    this.setState({ resource: Object.assign(this.state.resource, resource) });
  }

  toggleCompoundSelector() {
    this.setState(prevState => ({ selectingCompound: !prevState.selectingCompound }));
  }

  getEditResource(data) {
    this.setState({
      data: data,
      readOnly: data.readOnly || false,
      resource: data.resource || this.defaultState().resource
    }, () => {
      if (data && data.readOnly) {
        this.setState({ mode: undefined });
      } else {
        this.setState({ mode: this.state.data.resource ? 'edit' : 'create' });
      }
    });
  }

  updatedCompound(compound) {
    const resourceCopy = { ...this.state.resource };
    const id = compound ? compound.get('compound_id') : null;
    resourceCopy.compound_id = id;
    resourceCopy.compound = compound;
    this.setState({ resource: resourceCopy });
  }

  onAccept() {
    const params = ['name', 'kind', 'storage_condition', 'sensitivities', 'compound_id', 'purity'];
    const resource = _.pick(this.state.resource, params);
    if (resource.kind !== 'ChemicalStructure') {
      resource.purity = null;
      resource.compound_id = null;
    }

    if (this.state.mode === 'create') {
      this.create(resource);
    } else {
      ResourceActions.update(Immutable.fromJS(this.state.data.resource), resource);
    }
  }

  isFormInvalid() {
    const { resource } = this.state;
    return validators.non_empty(resource.name);
  }

  create(resource) {
    return ResourceActions.create(resource)
      .done((data) => {
        Dispatcher.dispatch({ type: 'RESOURCE_DATA', resource: data });
        if (this.props.onDone) {
          this.props.onDone(data);
        }
        const currResource = Immutable.Map(data);
        ResourceSearchStore.prependResult(currResource);
        this.setState(this.defaultState());
      })
      .fail((xhr, status, text) => {
        return alert(`Failed to create resource: ${text}. ${xhr.responseText}`);
      });
  }

  renderFooter(onDismiss) {
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button link onClick={onDismiss}>Close</Button>
      </div>
    );
  }

  render() {
    const title = this.state.readOnly ? this.state.resource.name : this.state.mode === 'create' ? 'New resource' : 'Edit resource';
    const acceptText = this.state.readOnly ? undefined : this.state.mode === 'create' ? 'Add' : 'Done';
    return (
      <SinglePaneModal
        title={title}
        modalId={AddResourceModal.MODAL_ID}
        modalSize="large"
        closeOnClickOut={false}
        onAccept={this.state.readOnly ? undefined : this.onAccept}
        acceptText={acceptText}
        dismissText="Close"
        footerRenderer={this.state.readOnly ?  this.renderFooter : undefined}
        acceptBtnDisabled={this.isFormInvalid()}
      >
        <EditResource
          resource={this.state.resource}
          update={this.onUpdate}
          getCompound={this.updatedCompound}
          onSelectCompound={this.toggleCompoundSelector}
          getEditResource={this.getEditResource}
        />
        <CompoundSelectorDrawer
          open={this.state.selectingCompound}
          isSingleSelect
          onCompoundSelected={this.updatedCompound}
          closeDrawer={this.toggleCompoundSelector}
        />
      </SinglePaneModal>
    );
  }
}

export default AddResourceModal;
