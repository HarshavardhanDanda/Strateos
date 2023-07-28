import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, LabeledInput } from '@transcriptic/amino';

import './LocationKey.scss';

// Shows a current and suggested location. Rendered by LocationSelectorModal.
class LocationKey extends React.PureComponent {
  static get propTypes() {
    return {
      current: PropTypes.object,
      suggested: PropTypes.object,
      loading: PropTypes.bool,
      onClickId: PropTypes.func.isRequired,
      selectedId: PropTypes.string
    };
  }

  render() {
    const { suggested, loading, selectedId, current } = this.props;
    const currentLocation = current && { id: current.data.id, ...current.data.attributes };

    return (
      <div className="location-key tx-inline tx-inline--xxlg">
        <LabeledInput label="Suggested location">
          <div className="tx-stack tx-stack--xxxs">
            <LocationDescription
              location={suggested}
              loading={loading}
            />
            {suggested && (
              <div>
                {suggested.id === selectedId ? (
                  <div className="location-key__selected-label tx-type--success tx-inline tx-inline--xxxs">
                    <Icon icon="fa fa-check" color="inherit" />
                    <span>Selected</span>
                  </div>
                ) : (
                  <Button
                    link
                    onClick={() => this.props.onClickId(suggested.id)}
                  >
                    Select this location
                  </Button>
                )}
              </div>
            )}
          </div>
        </LabeledInput>
        {currentLocation && (
          <LabeledInput label="Moving from">
            <LocationDescription
              location={currentLocation}
              loading={loading}
            />
          </LabeledInput>
        )}
      </div>
    );
  }
}

class LocationDescription extends React.PureComponent {
  static get propTypes() {
    return {
      loading: PropTypes.bool,
      location: PropTypes.object
    };
  }

  getSuggestedLocationId() {
    const { location } = this.props;
    if (location) {
      return location.id;
    } else if (this.props.loading) {
      return 'Calculating...';
    } else {
      return 'None';
    }
  }

  render() {
    const { location } = this.props;
    return (
      <div>
        {this.getSuggestedLocationId()}
        {location && (
          <div>{location.human_path}</div>
        )}
      </div>
    );
  }
}

export default LocationKey;
