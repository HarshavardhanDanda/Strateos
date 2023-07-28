import React     from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';

import { MultiStepModalWrapper }   from 'main/components/Modal';
import CsvUploadPane from './CsvUploadPane';
import CsvTablePane from './CsvTablePane';

class BulkCompoundRegistrationModal extends React.Component {
  static get MODAL_ID() {
    return 'BulkCompoundRegistrationModal';
  }

  constructor(props) {
    super(props);

    this.state = {
      /** Modal pane index
       * @member {number} */
      navIndex: 0,
      drawer: false
    };
  }

  render() {
    return (
      <MultiStepModalWrapper
        currPaneIndex={this.state.navIndex}
        paneTitles={Immutable.List(['Upload', 'Specify'])}
        title="Register Compounds"
        modalId={BulkCompoundRegistrationModal.MODAL_ID}
        modalSize="xlg"
        hasDrawer
        drawerTitle={this.state.drawerTitle}
        drawerChildren={this.state.drawerChildren}
        onDrawerClose={() => this.setState({ drawer: false })}
        drawerState={this.state.drawer}
        beforeDismiss={() => this.setState({ drawer: false })}
        closeOnClickOut={false}
      >
        <CsvUploadPane
          setCompounds={
            (records, duplicates, compoundValidations, registeredLabels) =>
              this.setState({ records, duplicates, compoundValidations, registeredLabels })
          }
          isPublicCompound={this.props.isPublicCompound}
          onTogglePublicCompound={this.props.onTogglePublicCompound}
          disableToggle={this.props.disableToggle}
        />
        <CsvTablePane
          records={this.state.records}
          compoundValidations={this.state.compoundValidations}
          duplicates={this.state.duplicates}
          registeredLabels={this.state.registeredLabels}
          drawer={this.state.drawer}
          setDrawer={(drawerChildren, drawerTitle) => this.setState({ drawer: true, drawerChildren, drawerTitle })}
          closeDrawer={() => this.setState({ drawer: false })}
          onCompoundCreation={this.props.onCompoundCreation}
          isPublicCompound={this.props.isPublicCompound}
        />
      </MultiStepModalWrapper>
    );
  }
}

BulkCompoundRegistrationModal.propTypes = {
  onCompoundCreation: PropTypes.func
};

export default BulkCompoundRegistrationModal;
