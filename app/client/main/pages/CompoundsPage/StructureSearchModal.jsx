import React     from 'react';
import _         from 'lodash';
import PropTypes from 'prop-types';

import { MoleculeViewer }  from '@transcriptic/amino';
import { SinglePaneModal } from 'main/components/Modal';

class StructureSearchModal extends React.Component {

  static get MODAL_ID() {
    return 'STRUCTURE SEARCH MODAL';
  }

  static get propTypes() {
    return {
      onSave: PropTypes.func.isRequired,
      SMILES: PropTypes.string.isRequired
    };
  }

  constructor(props) {
    super(props);
    this.state = { SMILES: '' };
    this.triggerAction = this.triggerAction.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.SMILES !== prevProps.SMILES) {
      this.fetch();
    }
  }

  fetch() {
    this.setState({ SMILES: this.props.SMILES });
  }

  triggerAction() {
    this.props.onSave(this.state.SMILES);
  }

  render() {
    return (
      <SinglePaneModal
        modalId={StructureSearchModal.MODAL_ID}
        title="Structure Search"
        renderFooter
        acceptText="Search"
        modalSize="large"
        onAccept={this.triggerAction}
      >
        <MoleculeViewer
          editable
          SMILES={this.state.SMILES}
          onChange={(SMILES) =>  this.setState({ SMILES })}
        />
      </SinglePaneModal>
    );
  }
}

export default StructureSearchModal;
