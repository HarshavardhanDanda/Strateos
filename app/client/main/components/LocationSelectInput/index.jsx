import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ModalActions from 'main/actions/ModalActions';
import { LocationAssignmentModal } from 'main/models/LocationSelectorModal/LocationSelectorModal';
import BubbledSegmentedInput from 'main/components/inputs';
import LocationStore from 'main/stores/LocationStore';

// Form Input Field for launching the LocationSelector.
class LocationSelectInput extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.presentModal = this.presentModal.bind(this);
  }

  segments() {
    if (this.props.locationId == undefined) {
      return Immutable.Map();
    }

    const location = LocationStore.getById(this.props.locationId);
    const name = location.get('name') || location.get('id');
    return Immutable.Map([[this.props.locationId, name]]);
  }

  presentModal() {
    return ModalActions.open(LocationAssignmentModal.MODAL_ID);
  }

  render() {
    return (
      <div className="location-select-input">
        <LocationAssignmentModal
          labIdForFilter={this.props.labIdForFilter}
          initialLocationId={this.props.locationId || this.props.defaultLocationId}
          prohibitedLocations={this.props.prohibitedLocations}
          onLocationSelected={this.props.onLocationSelected}
        />
        <BubbledSegmentedInput
          segments={this.segments()}
          emptyText="Choose Location..."
          onSegmentDeleted={() => this.props.onLocationSelected()}
          onClick={this.presentModal}
        />
      </div>
    );
  }
}

LocationSelectInput.propTypes = {
  locationId: PropTypes.string,
  defaultLocationId: PropTypes.string,
  onLocationSelected: PropTypes.func.isRequired,
  prohibitedLocations: PropTypes.instanceOf(Immutable.Set),
  labIdForFilter: PropTypes.string
};

export default LocationSelectInput;
