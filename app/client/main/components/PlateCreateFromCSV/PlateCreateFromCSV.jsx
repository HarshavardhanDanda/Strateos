import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';

import { CSVUploadWithInstructions } from 'main/inventory/components/CSVUpload';
import ContainerTypeHelper   from 'main/helpers/ContainerType';
import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';
import reduceCSVRow from 'main/util/ReduceCSVRow';

const csvHeaderNames = {
  index: 'Well Index',
  name: 'Well Label',
  volume: 'Vol (uL)',
  mass: 'Mass (mg)'
};

function containerHelper(containerType) {
  return new ContainerTypeHelper({
    well_count: containerType.get('well_count'),
    col_count: containerType.get('col_count')
  });
}

const hasError = (name, volume, mass, maxVolume) => {
  const nameError = PlateCreateLogic.nameError(name);
  const { volumeError, massError } = PlateCreateLogic.massVolumeError(mass, volume, maxVolume);
  return nameError || volumeError || massError;
};

function createWellMap(csvRows, containerType) {
  let wellMap = Immutable.Map();
  const helper = containerHelper(containerType);

  csvRows.forEach((row) => {
    const index = row[csvHeaderNames.index];
    let name = row[csvHeaderNames.name];
    let volume = row[csvHeaderNames.volume];
    let mass = row[csvHeaderNames.mass];

    // We prefer to store null over the empty string.
    name = _.isEmpty(name) ? undefined : name.trim();
    volume = _.isEmpty(volume) ? undefined : `${volume.trim()}:microliter`;
    mass = _.isEmpty(mass) ? undefined : `${mass.trim()}:milligram`;

    const maxVolume = containerType.get('well_volume_ul');
    const wellIndex = helper.robotWell(index);

    if (
      wellIndex >= 0 &&
      wellIndex < containerType.get('well_count') &&
      (name != undefined || volume != undefined || mass != undefined)
    ) {
      const properties = reduceCSVRow(row, Object.values(csvHeaderNames));

      const well = Immutable.Map({
        name,
        volume,
        properties: Immutable.fromJS(properties),
        hasError: hasError(name, volume, mass, maxVolume),
        hasVolume: true,
        mass
      });
      wellMap = wellMap.set(wellIndex, well);
      return wellMap;
    }
    return undefined;
  });

  return wellMap;
}

function payload(containerType) {
  const header = _.values(csvHeaderNames).join(',');
  const helper = containerHelper(containerType);
  const entries = _.range(containerType.get('well_count'))
    .map((i) => {
      return [helper.humanWell(i), undefined, undefined, undefined].join(',');
    })
    .join('\n');

  return [header, entries].join('\n');
}

class PlateCreateFromCSV extends React.Component {
  static get propTypes() {
    return {
      containerType: PropTypes.instanceOf(Immutable.Map).isRequired,
      onCSVChange: PropTypes.func.isRequired
    };
  }

  render() {
    const { containerType } = this.props;
    const wellCount = containerType.get('well_count');
    return (
      <div className="plate-create-from-csv">
        <CSVUploadWithInstructions
          instruction={`A ${wellCount}-well CSV template is downloading.`}
          payload={payload(containerType)}
          downloadName="plate.csv"
          downloadOnMount
          onCSVChange={data => this.props.onCSVChange(createWellMap(data, containerType))}
        />
      </div>
    );
  }
}

export default PlateCreateFromCSV;
export { createWellMap, payload };
