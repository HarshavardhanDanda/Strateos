import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import {
  Card,
  DataTable,
  Divider,
  Section
} from '@transcriptic/amino';

import InteractivePlate from 'main/components/InteractivePlate';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';

class DataObjectMeasureVolume extends React.Component {
  static get propTypes() {
    return {
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data:       PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.getWellData = this.getWellData.bind(this);
  }

  getWellMap() {
    let wellMap = Immutable.Map();

    // TODO: We should update the way we store this data to be one per ref.
    // In practive this seems to be the case, so we pull out the first.
    const refData = this.props.data[0];
    const wells   = refData.wells;

    wells.forEach((wellData) => {
      const wellIndex = wellData.well_index;

      wellMap = wellMap.set(wellIndex, Immutable.Map({ hasVolume: true, selected: false }));
    });

    return Immutable.fromJS(wellMap);
  }

  getInitialDomain() {
    const refData = this.props.data[0];
    const volumes = _.map(refData.wells, wellData => parseFloat(wellData.volume.split(':')[0]));

    return [_.min(volumes), _.max(volumes)];
  }

  getWellData(wellIndex) {
    const refData = this.props.data[0];
    const well    = _.find(refData.wells, wellData => wellData.well_index == wellIndex);
    const value   = well.volume.split(':')[0];

    return InteractivePlate.formatData(value);
  }

  getTableData() {
    const rows = [
    ];

    const refData = this.props.data[0];
    const wells   = refData.wells;

    wells.forEach((wellData) => {
      const volume = wellData.volume.split(':')[0];

      rows.push({
        index: wellData.well,
        'volume ul': volume
      });
    });

    return rows;
  }

  render() {
    const { container, dataObject } = this.props;

    const containerType = container.get('container_type');

    return (
      <Card container>
        <DataObjectContainerHeader container={container} dataObject={dataObject} />
        <Divider />

        <div className="row">
          <div className="col-xs-12 col-lg-9">
            <Section title="Plate Map">
              <InteractivePlate
                containerType={containerType}
                wellMap={this.getWellMap()}
                getWellData={this.getWellData}
                initialDomain={this.getInitialDomain()}
                units=""
              />
            </Section>
          </div>
          <div className="col-xs-12 col-lg-3">
            <Section title="Aliquot Info">
              <DataTable
                headers={['index', 'volume ul']}
                data={this.getTableData()}
              />
            </Section>
          </div>
        </div>
      </Card>
    );
  }
}

export default DataObjectMeasureVolume;
