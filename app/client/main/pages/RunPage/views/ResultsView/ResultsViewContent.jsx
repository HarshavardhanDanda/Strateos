import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import DataObjectAutopickInfo                 from 'main/components/datasets/DataObjectAutopickInfo';
import DataObjectCsv                          from 'main/components/datasets/DataObjectCsv';
import DataObjectEnvisionPlateReader          from 'main/components/datasets/DataObjectEnvisionPlateReader';
import DataObjectFile                         from 'main/components/datasets/DataObjectFile';
import DataObjectImage                        from 'main/components/datasets/DataObjectImage';
import DataObjectJson                         from 'main/components/datasets/DataObjectJson';
import DataObjectLcmsRm                       from 'main/components/datasets/DataObjectLcms/DataObjectLcmsRm';
import DataObjectMeasureConcentration         from 'main/components/datasets/DataObjectMeasureConcentration';
import DataObjectMeasureMass                  from 'main/components/datasets/DataObjectMeasureMass';
import DataObjectMeasureVolume                from 'main/components/datasets/DataObjectMeasureVolume';
import DataObjectMesoscalePlateReader         from 'main/components/datasets/DataObjectMesoscalePlateReader';
import DataObjectPlateReader                  from 'main/components/datasets/DataObjectPlateReader';
import DataObjectQPCR                         from 'main/components/datasets/DataObjectQPCR';
import DataObjectSpectrophotometryPlateReader from 'main/components/datasets/DataObjectSpectrophotometryPlateReader';
import DataObjectWrapper                      from 'main/components/datasets/DataObjectWrapper';
import DataObjectPdf                          from 'main/components/datasets/DataObjectPdf';
import DataObjectLcmsFs                       from 'main/components/datasets/DataObjectLcms/DataObjectLcmsFs';
import DataObjectLcmsSpe                      from 'main/components/datasets/DataObjectLcms/DataObjectLcmsSpe';

import DataObjectAPI      from 'main/api/DataObjectAPI';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import DataObjectStore    from 'main/stores/DataObjectStore';
import DataObjectLcmsDa from 'main/components/datasets/DataObjectLcms/DataObjectLcmsDa/DataObjectLcmsDa';
import DataObjectLcmrm from 'main/components/datasets/DataObjectLcmrm/DataObjectLcmrm';

import ResultsViewContentHeader from './ResultsViewContentHeader';

import './ResultsViewContent.scss';

// Since datasets/data objects are immutable and can also be empty,
// we store here if a request to fetch them has ever been made to prevent duplicate fetching.
const fetchedDataObjects = new Set();

class ResultsViewContent extends React.Component {
  static get propTypes() {
    return {
      name:        PropTypes.string,
      dataset:     PropTypes.instanceOf(Immutable.Map).isRequired,
      dataObjects: PropTypes.instanceOf(Immutable.Seq).isRequired,
      run:         PropTypes.instanceOf(Immutable.Map).isRequired
    };
  }

  static get opToDataObjectFormats() {
    return {
      absorbance:            ['platereader'],
      autopick:              ['autopick_info', 'image'],
      count_cells:           ['csv', 'count_cells'],
      envision:              ['envision_platereader'],
      fluorescence:          ['platereader'],
      gel_purify:            ['image'],
      gel_separate:          ['image'],
      lcmrm:                 ['lcmrm', 'csv'],
      luminescence:          ['platereader'],
      measure_concentration: ['measure_concentration'],
      measure_mass:          ['csv', 'measure_mass'],
      measure_volume:        ['measure_volume'],
      mesoscale_sectors600:  ['mesoscale_platereader'],
      spectrophotometry:     ['spectrophotometry_platereader', 'csv'],
      thermocycle:           ['qpcr']
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      rawCsvData: undefined,
      csvData: undefined,
      csvName: undefined
    };
  }

  componentDidMount() {
    this.fetch(this.props.dataset.get('id'));
  }

  componentDidUpdate(prevProps, _prevState) {

    const prevId = prevProps.dataset.get('id');
    const currId = this.props.dataset.get('id');

    if (prevId !== currId) {
      this.fetch(currId);
    }
  }

  // We assume that the datasets are loading via the loading of the run.
  // This component is responsible for loading the DataObjects, but not loading the actual data from S3.
  fetch(datasetId) {
    if (fetchedDataObjects.has(datasetId)) {
      return;
    }

    DataObjectAPI.indexAll({
      filters: {
        dataset_id: datasetId
      }
    }).then((_d) => {
      fetchedDataObjects.add(datasetId);
    });
  }

  sortDataObjects(op, dataObjects) {
    if (op == undefined) {
      return dataObjects;
    }

    const ordering = ResultsViewContent.opToDataObjectFormats[op] || [];

    return dataObjects.sort((dobj1, dobj2) => {
      const format1 = dobj1.get('format');
      const format2 = dobj2.get('format');
      let index1    = ordering.indexOf(format1);
      let index2    = ordering.indexOf(format2);

      // if not found return maximum value
      if (index1 === -1) {
        index1 = ordering.length + 1;
      }
      if (index2 === -1) {
        index2 = ordering.length + 1;
      }

      if (index1 === index2) {
        // sort by time if index is the same
        return dobj1.get('created_at').localeCompare(dobj2.get('created_at'));
      } else {
        // otherwise sort by index
        return index1 - index2;
      }
    });
  }

  render() {

    const { name, dataset, dataObjects, run } = this.props;

    const inst       = run.get('instructions').find(i => i.get('id') == dataset.get('instruction_id'));
    const refs       = run.get('refs').filter(r => r.get('container_id'));
    const containers = refs.map(r => r.get('container')).filter(c => c !== undefined);

    let op;
    if (inst) {
      op = inst.get('op');
    }

    const sortedDataObjects = this.sortDataObjects(op, dataObjects);

    return (
      <div className="results-view-content">
        <ResultsViewContentHeader
          name={name}
          dataset={dataset}
          instruction={inst}
          run={run}
        />

        {sortedDataObjects.map((dobj) => {

          const format      = dobj.get('format');
          const contentType = dobj.get('content_type');
          const containerId = dobj.get('container_id');
          const container   = containers.find(c => c.get('id') == containerId);
          const imageContentTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/tif', 'image/tiff'];

          if (format == 'csv' || contentType == 'text/csv') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectCsv}
                dataObject={dobj}
                shouldFetchRaw
                updatedCsvData={this.state.csvData}
                csvName={this.state.csvName}
                updateCsv={(csvData) => this.setState({ csvData })}
                setRawCsvData={(rawCsvData) => this.setState({ rawCsvData })}
              />
            );
          } else if (format == 'autopick_info') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectAutopickInfo}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'envision_platereader') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectEnvisionPlateReader}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'image' || imageContentTypes.includes(contentType)) {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectImage}
                dataObject={dobj}
                shouldFetch={false}
                shouldFetchRaw
              />
            );
          } else if (format == 'json') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectJson}
                dataObject={dobj}
                shouldFetchRaw
              />
            );
          } else if (format == 'measure_concentration') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectMeasureConcentration}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'measure_mass') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectMeasureMass}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'measure_volume') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectMeasureVolume}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'mesoscale_platereader') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectMesoscalePlateReader}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format == 'platereader') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectPlateReader}
                container={container}
                dataObject={dobj}
                op={op}
              />
            );
          } else if (format == 'qpcr') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectQPCR}
                container={container}
                dataObject={dobj}
                updateCsv={(csvData) => this.setState({ csvData })}
                updateCsvName={(csvName) => this.setState({ csvName })}
                csvName={this.state.csvName}
                runID={run.get('id')}
                updatedCsvData={this.state.csvData}
                rawCsvData={this.state.rawCsvData}
              />
            );
          } else if (format == 'spectrophotometry_platereader') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectSpectrophotometryPlateReader}
                container={container}
                dataObject={dobj}
              />
            );
          } else if (format === 'pdf' || contentType === 'application/pdf') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectPdf}
                dataObject={dobj}
                shouldFetch={false}
              />
            );
          } else if (format === 'lcms_rm') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectLcmsRm}
                dataObject={dobj}
              />
            );
          } else if (format === 'lcms_fs') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectLcmsFs}
                dataObject={dobj}
              />
            );
          } else if (format === 'lcms_spe') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectLcmsSpe}
                dataObject={dobj}
              />
            );
          } else if (format === 'lcms_da') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectLcmsDa}
                dataObject={dobj}
              />
            );
          } else if (format === 'lcmrm') {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectLcmrm}
                dataObject={dobj}
                runID={run.get('id')}
              />
            );
          } else {
            return (
              <DataObjectWrapper
                key={dobj.get('id')}
                Component={DataObjectFile}
                dataObject={dobj}
                shouldFetch={false}
                shouldFetchRaw
              />
            );
          }
        })}
      </div>
    );
  }
}

const getStateFromStores = (props) => {
  const datasetId   = props.dataset.get('id');
  const dataObjects = DataObjectStore.getAll().filter(dobj => dobj.get('dataset_id') == datasetId);

  return {
    dataObjects
  };
};

const ConnectedResultsViewContent = ConnectToStoresHOC(ResultsViewContent, getStateFromStores);

ConnectedResultsViewContent.propTypes = {
  name:    PropTypes.string,
  dataset: PropTypes.instanceOf(Immutable.Map).isRequired,
  run:     PropTypes.instanceOf(Immutable.Map).isRequired
};

export default ConnectedResultsViewContent;
