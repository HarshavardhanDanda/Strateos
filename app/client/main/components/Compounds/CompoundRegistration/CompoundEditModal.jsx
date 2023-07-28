import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';

import { SinglePaneModal }   from 'main/components/Modal';
import ModalActions          from 'main/actions/ModalActions';
import CompoundAPI           from 'main/api/CompoundAPI';
import CompoundEditForm      from 'main/components/Compounds/CompoundRegistration/CompoundEditForm';
import Hazards from 'main/util/Hazards';
import NotificationActions from 'main/actions/NotificationActions';
import { fromXHR } from 'main/util/ajax/Errors/Errors';

import {
  Button,
  ButtonGroup
} from '@transcriptic/amino';

import LibraryDrawer from './LibraryDrawer';

class CompoundEditModal extends React.Component {
  static get MODAL_ID() {
    return 'CompoundEditModal';
  }

  constructor(props) {
    super(props);
    const { compound } = props;
    const externalId = compound.getIn(['external_system_ids', 0, 'external_system_id']);
    this.state = {
      compoundLabels: compound.get('labels').toJS(),
      compoundReferenceId: compound.get('reference_id', ''),
      compoundExternalId: externalId,
      compoundName: compound.get('name', ''),
      hazardFlags: this.getFlagsFromCompound(compound),
      libraryDrawerOpen: false,
      librariesSelected: []
    };
  }

  getFlagsFromCompound(compound) {
    const flags = [];

    Hazards.forEach(hazard => {
      if (compound.get(hazard.queryTerm)) {
        flags.push(hazard.display);
      }
    });

    return flags;
  }

  createCompoundUpdateSchema(addFlags, removeFlags) {
    const compound = {};

    addFlags.forEach(addFlag => {
      compound[Hazards.find(hazard => hazard.display === addFlag).queryTerm] = true;
    });

    removeFlags.forEach(removeFlag => {
      compound[Hazards.find(hazard => hazard.display === removeFlag).queryTerm] = false;
    });

    return compound;
  }

  reset() {
    const { compound } = this.props;
    const externalId = compound.getIn(['external_system_ids', 0, 'external_system_id']);
    this.setState({
      compoundLabels: compound.get('labels').toJS(),
      compoundReferenceId: compound.get('reference_id', ''),
      compoundExternalId: externalId,
      compoundName: compound.get('name', ''),
      hazardFlags: this.getFlagsFromCompound(compound),
      error: undefined
    });
  }

  onCancel() {
    ModalActions.close(CompoundEditModal.MODAL_ID);
    this.reset();
  }

  updateCompound() {
    this.setState({ error: undefined, pending: true }, async () => {
      const { compoundLabels, compoundName, compoundReferenceId, compoundExternalId, hazardFlags } = this.state;
      const { compound, canEditExternalSystemId } = this.props;

      const currentLabels = compound.get('labels').toJS();
      const addLabels = _.differenceWith(compoundLabels, currentLabels, _.isEqual);
      const removeLabels = _.differenceWith(currentLabels, compoundLabels, _.isEqual);

      const currentFlags = this.getFlagsFromCompound(compound);
      const addFlags = _.difference(hazardFlags, currentFlags);
      const removeFlags = _.difference(currentFlags, hazardFlags);

      try {
        const attributes = {
          name: (compoundName && compoundName.trim()) || '',
          reference_id: (compoundReferenceId && compoundReferenceId.trim()) || '',
          labels: compoundLabels,
          compound: this.createCompoundUpdateSchema(addFlags, removeFlags)
        };

        if (canEditExternalSystemId) {
          attributes.external_system_id = (compoundExternalId && compoundExternalId.trim()) || '';
        }

        const actions = {
          add_labels: addLabels,
          delete_labels: removeLabels
        };

        await CompoundAPI.update(compound.get('id'), attributes, {}, actions);
        ModalActions.close(CompoundEditModal.MODAL_ID);
      } catch (e) {
        this.setState({
          error: {
            title: 'Failed to save changes',
            message: `${fromXHR(e)}`
          }
        });
        throw e;
      } finally {
        this.setState({ pending: false });
      }
    });
  }

  openLibraryDrawer() {
    this.setState({ libraryDrawerOpen: true });
  }

  closeLibraryDrawer() {
    this.setState({ libraryDrawerOpen: false, librariesSelected: [] });
  }

  renderFooter() {
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button link="true" onClick={() => this.onCancel()}>Cancel</Button>
        <Button type="primary" onClick={() => this.updateCompound()}>Save Changes</Button>
      </div>
    );
  }

  renderLibraryDrawer(libraries) {
    const updateLibrariesSelected = (librariesSelected) => {
      this.setState({ librariesSelected });
    };

    return (
      <LibraryDrawer
        libraries={libraries}
        updateLibrariesSelected={updateLibrariesSelected}
      />
    );
  }

  renderLibraryDrawerFooter() {

    const updateCompoundWithLibraries = async () => {
      const compoundId = this.props.compound.get('id');
      const existingLibraries = _.map(this.props.libraries, 'id');
      const librariesToBeAdded = _.difference(this.state.librariesSelected, existingLibraries);
      const librariesToBeRemoved = _.difference(existingLibraries, this.state.librariesSelected);
      let isError = false;

      const onUpdateLibraries = (response) => {
        const  updatedLibraries = (response.included || []).filter(included => included.type === 'libraries')
          .map((lib) => ({ id: lib.id, ...lib.attributes }));
        this.props.onUpdateLibraries && this.props.onUpdateLibraries(updatedLibraries);
      };

      if (librariesToBeAdded.length) {
        try {
          const response = await CompoundAPI.addLibrariesToCompound(librariesToBeAdded, compoundId);
          onUpdateLibraries(response);
        } catch (e) {
          isError = true;
        }
      }

      if (librariesToBeRemoved.length) {
        try {
          const response = await CompoundAPI.removeLibrariesFromCompound(librariesToBeRemoved, compoundId);
          onUpdateLibraries(response);
        } catch (e) {
          isError = true;
        }
      }
      if (!isError) {
        this.closeLibraryDrawer();
        NotificationActions.createNotification({
          text: 'Libraries updated',
          isSuccess: true
        });
      }
    };

    const resetLibrariesSelected = () => {
      this.setState({ librariesSelected: [] });
      this.closeLibraryDrawer();
    };

    return (
      <ButtonGroup>
        <Button type="secondary" size="small" onClick={() => resetLibrariesSelected()}>Cancel</Button>
        <Button type="primary" size="medium"  onClick={() => updateCompoundWithLibraries()}>Looks Good</Button>
      </ButtonGroup>
    );
  }

  render() {
    const { compound, canEditHazards, canEditCompound, libraries, canEditLibrary, canEditExternalSystemId } = this.props;
    const { compoundLabels, compoundName, compoundReferenceId, compoundExternalId, error, hazardFlags } = this.state;

    const libraryDrawerProps = canEditLibrary && {
      hasDrawer: true,
      drawerTitle: 'Linked libraries',
      drawerState: this.state.libraryDrawerOpen,
      onDrawerClose: () => this.closeLibraryDrawer(),
      drawerChildren: libraries && this.renderLibraryDrawer(libraries),
      drawerFooterChildren: this.renderLibraryDrawerFooter()
    };

    return (
      <SinglePaneModal
        title={'Edit Compound'}
        onDismissed={() => this.reset()}
        modalId={CompoundEditModal.MODAL_ID}
        footerRenderer={() => this.renderFooter()}
        modalSize="large"
        {...libraryDrawerProps}
      >
        <CompoundEditForm
          compound={compound}
          compoundLabels={compoundLabels}
          compoundName={compoundName}
          compoundReferenceId={compoundReferenceId}
          compoundExternalId={compoundExternalId}
          canEditExternalSystemId={canEditExternalSystemId}
          error={error}
          onChange={(update) => this.setState(update)}
          canEditHazards={canEditHazards}
          canEditCompound={canEditCompound}
          hazardFlags={hazardFlags}
          libraries={libraries}
          canEditLibrary={canEditLibrary}
          openLibraryDrawer={() => this.openLibraryDrawer()}
        />
      </SinglePaneModal>
    );
  }
}

CompoundEditModal.propTypes = {
  compound: PropTypes.any,
  canEditLibrary: PropTypes.bool,
  libraries: PropTypes.arrayOf(PropTypes.object),
  canEditExternalSystemId: PropTypes.bool,
  onUpdateLibraries: PropTypes.func
};

export default CompoundEditModal;
