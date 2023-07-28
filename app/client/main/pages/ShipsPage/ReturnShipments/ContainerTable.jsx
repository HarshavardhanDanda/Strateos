import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Column, Table } from '@transcriptic/amino';

import Urls from 'main/util/urls';
import LocationPath from 'main/components/LocationPath';
import locationSort from 'main/util/Location';

const HEADERS = ['Container ID', 'Label', 'Barcode', 'Type', 'Location'];

const sortContainers = (a, b) => {
  const aLocation = a.get('location');
  const bLocation = b.get('location');

  if (!aLocation) {
    return -1;
  }
  if (!bLocation) {
    return 1;
  }

  return locationSort(aLocation, bLocation);
};

function ContainerTable({ containers }) {
  const [ID, LABEL, BARCODE, CONTAINER_TYPE, LOCATION] = HEADERS;
  return (
    <Table
      id="container-table"
      data={containers.sort(sortContainers)}
      loaded
      disableBorder
      disabledSelection
    >
      <Column
        id={ID}
        key={ID}
        header={ID}
        disableFormatHeader
        renderCellContent={(container) => (
          <a
            target="_blank"
            rel="noreferrer"
            href={Urls.container(container.get('id'))}
          >
            {container.get('id')}
          </a>
        )}
      />
      <Column
        id={LABEL}
        key={LABEL}
        header={LABEL}
        renderCellContent={(container) => container.get('label')}
      />
      <Column
        id={BARCODE}
        key={BARCODE}
        header={BARCODE}
        renderCellContent={(container) => container.get('barcode')}
      />
      <Column
        id={CONTAINER_TYPE}
        key={CONTAINER_TYPE}
        header={CONTAINER_TYPE}
        renderCellContent={(container) => container.get('container_type_id')}
      />
      <Column
        id={LOCATION}
        key={LOCATION}
        header={LOCATION}
        renderCellContent={(container) => (
          container.get('location') ? (
            <LocationPath
              location={container.get('location')}
              position={container.getIn(['slot', 'row'])}
              containerId={container.get('id')}
            />
          ) : 'No location'
        )}
      />
    </Table>
  );
}

ContainerTable.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired
};

export { ContainerTable, HEADERS as headers };
