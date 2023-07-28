import PropTypes from 'prop-types';
import React from 'react';
import { Button, DropDown } from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

class CompoundCreationDropDown extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  hideDismissable() {
    this.setState({ isOpen: false });
  }

  render() {
    return (
      <span style={{ position: 'relative' }} ref={(el) => { this.parentNode = el; }}>
        {(AcsControls.isFeatureEnabled(FeatureConstants.REGISTER_COMPOUND) || AcsControls.isFeatureEnabled(FeatureConstants.REGISTER_PUBLIC_COMPOUND)) && (
          <Button
            onClick={() => {
              this.setState({ isOpen: true });
            }}
            icon="fa-plus"
          >
            Register Compound
          </Button>
        )}
        <DropDown
          isOpen={this.state.isOpen}
          align={this.props.alignment}
          parentAlignment={this.props.alignment}
          excludedParentNode={this.parentNode}
          hideDismissable={() => this.hideDismissable()}
          hideTooltip
        >
          <div className="tx-stack">
            <div className="tx-stack__block--xxxs">
              <Button
                noPadding
                type="secondary"
                link
                onClick={() => ModalActions.open('CompoundRegistrationModal')}
                icon={'fal fa-pencil'}
                iconSize={'small'}
              >
                Draw a Structure
              </Button>
            </div>
            <div className="tx-stack__block--xxxs">
              <Button
                noPadding
                type="secondary"
                link
                onClick={() => ModalActions.open('BulkCompoundRegistrationModal')}
                icon={'fal fa-upload'}
                iconSize={'small'}
              >
                Upload from a File
              </Button>
            </div>
          </div>
        </DropDown>
      </span>
    );
  }
}

CompoundCreationDropDown.propTypes = {
  alignment: PropTypes.string
};

export default CompoundCreationDropDown;
