import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import PathActions from 'main/inventory/locations/PathActions';

function ContainersList({ containers }) {
  if (containers.size > 0) {
    return (
      <div className="master-detail-list">
        {
          containers.map((container) => {
            const clickHandler = () => {
              PathActions.showContainer(container.get('id'), container.get('location_id'));
            };
            return (
              <button className="item clear" onClick={clickHandler} tabIndex={0} key={container.get('id')}>
                <h3>
                  {container.get('label') || container.get('id')}
                  <span className="detail">
                    {container.get('container_type_id')}
                  </span>
                  <span className="detail">
                    {container.get('barcode')}
                  </span>
                </h3>
              </button>
            );
          })
        }
      </div>
    );
  }
  return <div><em>No Containers</em></div>;
}

ContainersList.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable)
};

export default ContainersList;
