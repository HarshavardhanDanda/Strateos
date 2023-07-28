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

import InteractivePlate         from 'main/components/InteractivePlate';
import ContainerTypeHelper      from 'main/helpers/ContainerType';
import { average, toPrecision } from 'main/util/Numbers';

import DataObjectContainerHeader from 'main/components/datasets/DataObjectContainerHeader';

class DataObjectPlateReader extends React.Component {
  static get propTypes() {
    return {
      op:         PropTypes.string.isRequired,
      container:  PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObject: PropTypes.instanceOf(Immutable.Map).isRequired,
      data:       PropTypes.object.isRequired
    };
  }

  static getColorsForOpType(type) {
    switch (type) {
      case 'absorbance':
        return 'PiYG';
      case 'luminescence':
        return 'RdBu';
      case 'fluorescence':
        return 'RdYlGn';
      default:
        return 'Spectral';
    }
  }

  static getPlateWellAverages(data) {
    // Filter out the 'id', and 'gain' key from the data object, then map the remaining keys
    const averages = Object.keys(data).filter((k) => { return !(['id', 'gain'].includes(k)); }).map((k) => {
      const v = data[k];
      return average(v);
    });
    return averages;
  }

  constructor(props, context) {
    super(props, context);

    const containerType = this.props.container.get('container_type');

    this.ctypeHelper   = new ContainerTypeHelper({
      col_count: containerType.get('col_count'),
      well_count: containerType.get('well_count'),
      shortname: containerType.get('shortname')
    });

    this.dataForWell      = this.dataForWell.bind(this);
    this.getInitialDomain = this.getInitialDomain.bind(this);
  }

  getInitialDomain() {
    const averages = DataObjectPlateReader.getPlateWellAverages(this.props.data);
    const opType   = this.props.op;

    let min = _.min(averages);
    let max = _.max(averages);

    // We want to clamp absorbance to whole numbers for easy visualizing
    if (opType == 'absorbance') {
      min = Math.floor(min);
      max = Math.ceil(max);
    }

    return [max, min];
  }

  dataForWell(wellIndex) {
    const wellName = this.ctypeHelper.humanWell(wellIndex).toLowerCase();
    return this.props.data[wellName];
  }

  render() {
    const { container, dataObject, op }  = this.props;

    const containerType = container.get('container_type');

    let wellMap;

    if (this.props.data) {
      const wellCount = containerType.get('well_count');

      // merge aliquots with empty wells so that we can assign color for all wells
      wellMap = Immutable.Map(_.range(wellCount).map(index => [index, undefined])).mapEntries(([index]) => {
        const wellData  = this.dataForWell(index);
        const hasVolume = (wellData !== undefined);

        return [index, Immutable.Map({ hasVolume, selected: false })];
      });
    }

    return (
      <Card container>
        <DataObjectContainerHeader container={container} dataObject={dataObject} />
        <Divider />

        <div className="row">
          <div className="col-xs-12 col-lg-9">
            <Section title="Plate Map">
              <InteractivePlate
                containerType={containerType}
                wellMap={wellMap}
                getWellData={wellIndex => InteractivePlate.formatData(this.dataForWell(wellIndex))}
                colorScale={DataObjectPlateReader.getColorsForOpType(op)}
                initialDomain={this.getInitialDomain()}
                units=""
                allowOverride
              />
            </Section>
          </div>
          <div className="col-xs-12 col-lg-3">
            <Section title="Aliquot Info">
              <DataTable
                headers={['index', 'value']}
                data={_.map(this.props.data, (v, k) => {
                  return { index: k, value: toPrecision(v[0], 3) };
                })}
              />
            </Section>
          </div>
        </div>
      </Card>
    );
  }
}

export default DataObjectPlateReader;
