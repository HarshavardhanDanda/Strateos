import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import PathActions from 'main/inventory/locations/PathActions';

function LocationsList({ locations }) {
  if (locations.size > 0) {
    const locationsSorted = locations.sortBy(l => l.get('name', '').toLowerCase());
    return (
      <div className="master-detail-list">
        {
          locationsSorted.map((location) => {
            const name = location.get('name');
            const clickHandler = () => PathActions.navigate(location.get('id'));
            return (
              <button className="item clear" onClick={clickHandler} key={location.get('id')} tabIndex={0}>
                <h3>
                  {name || 'No Name'}
                  <span className="detail">
                    {location.getIn(['location_type', 'name'])}
                  </span>
                </h3>
              </button>
            );
          })
        }
      </div>
    );
  }
  return <div><em>No Locations</em></div>;
}

LocationsList.propTypes = {
  locations: PropTypes.instanceOf(Immutable.List).isRequired
};

export default LocationsList;
