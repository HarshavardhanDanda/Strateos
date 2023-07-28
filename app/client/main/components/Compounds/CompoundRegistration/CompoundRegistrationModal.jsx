import React     from 'react';
import Immutable from 'immutable';

import { MultiStepModalWrapper }   from 'main/components/Modal';

import { DrawPane, SpecifyPane } from './panes';

class CompoundRegistrationModal extends React.Component {
  static get MODAL_ID() {
    return 'CompoundRegistrationModal';
  }

  constructor(props) {
    super(props);

    this.state = {
      /** Modal pane index
       * @member {number} */
      navIndex: 0,
      /** ID of the compound or compound_summary produced by the drawpane
       * @member {string} */
      compoundId: undefined,
      /** Whether the ID refers to a compound summary (false) or existing compound (true)
       * @member {boolean} */
      compoundExists: undefined,
      /** Type of source from which the compound(summary) was generated
       * @member {('smiles'|'sdf')} */
      compoundSource: undefined
    };
  }

  render() {
    return (
      <MultiStepModalWrapper
        currPaneIndex={this.state.navIndex}
        paneTitles={Immutable.List(['Draw', 'Specify'])}
        title="Register Compound"
        modalId={CompoundRegistrationModal.MODAL_ID}
        modalSize="large"
      >
        <DrawPane
          setCompound={(compoundId, compoundExists, compoundSource) =>
            this.setState({ compoundId, compoundExists, compoundSource })}
          onTogglePublicCompound={this.props.onTogglePublicCompound}
          isPublicCompound={this.props.isPublicCompound}
          disableToggle={this.props.disableToggle}
        />
        { this.state.compoundId && (
          <SpecifyPane
            compoundId={this.state.compoundId}
            compoundExists={this.state.compoundExists}
            compoundSource={this.state.compoundSource}
            isPublicCompound={this.props.isPublicCompound}
          />
        )}
      </MultiStepModalWrapper>
    );
  }
}

CompoundRegistrationModal.propTypes = {};
CompoundRegistrationModal.defaultProps = {};

export default CompoundRegistrationModal;
