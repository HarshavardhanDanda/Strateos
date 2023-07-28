import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Banner } from '@transcriptic/amino';
import { CSVUploadWithInstructions } from 'main/inventory/components/CSVUpload';
import reduceCSVRow from 'main/util/ReduceCSVRow';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';

const csvHeaderNames = {
  name: 'Well name',
  volume: 'Vol (uL)',
  mass: 'Mass (mg)',
  storage: 'Storage (C)',
  containerType: 'Container Type',
  compoundIds: 'Compound Ids',
  emptyMassMg: 'Empty Mass (mg)'
};

const csvEntries = [
  ['Tube 1', '10', undefined, 'cold_4', 'micro-1.5', 'cmpl1d8ynztkrtfc7 cmpl1d8ynztfnn4dd', '2'],
  ['Tube 2', '20', undefined, 'cold_20', 'micro-1.5', '', '3'],
  ['Tube 3', '30', undefined, 'cold_80', 'micro-2.0', 'cmpl1d8ynzst5sses', ''],
  ['Tube 4', '40', undefined, 'ambient', 'micro-2.0', 'cmpl1d8ynztfnn4dd cmpl1d8ynzst5sses', '4']
];

function payload() {
  let header = _.values(csvHeaderNames).join(',');
  let entries = _.cloneDeep(csvEntries);
  if (!FeatureStore.hasFeature(FeatureConstants.LINK_COMPOUND_RESOURCE)) {
    header = _.values(_.omit(csvHeaderNames, 'compoundIds')).join(',');
    entries.forEach(entry => {
      entry.splice(5, 1);
    });
  }
  entries = entries.map(entry => entry.join(','));
  return [header, ...entries].join('\n');
}

function createInputValues(data) {
  let inputValues = Immutable.List();
  data.forEach((d) => {
    let name = d[csvHeaderNames.name];
    let volume = d[csvHeaderNames.volume];
    let storage = d[csvHeaderNames.storage];
    let containerType = d[csvHeaderNames.containerType];
    let compoundIds = d[csvHeaderNames.compoundIds];
    let mass = d[csvHeaderNames.mass];
    let emptyMassMg = d[csvHeaderNames.emptyMassMg];

    // We prefer to store null over the empty string.
    name = _.isEmpty(name) ? undefined : name;
    volume = _.isEmpty(volume) ? undefined : `${volume}:microliter`;
    storage = _.isEmpty(storage) ? undefined : storage;
    containerType = _.isEmpty(containerType) ? undefined : containerType;
    if (FeatureStore.hasFeature(FeatureConstants.LINK_COMPOUND_RESOURCE)) {
      compoundIds = _.isEmpty(compoundIds) ? undefined : compoundIds;
    } else {
      compoundIds = undefined;
    }

    mass = _.isEmpty(mass) ? undefined : `${mass}:milligram`;
    emptyMassMg = _.isEmpty(emptyMassMg) ? undefined : `${emptyMassMg}:milligram`;

    const properties = reduceCSVRow(d, Object.values(csvHeaderNames));

    inputValues = inputValues.push(
      Immutable.Map({
        name,
        volume,
        storage,
        containerType,
        compoundIds,
        mass,
        emptyMassMg,
        properties: Immutable.fromJS(properties)
      })
    );
  });
  return inputValues;
}

class TubesCreateFromCSV extends React.Component {
  static get propTypes() {
    return {
      onCSVChange: PropTypes.func,
      errors: PropTypes.instanceOf(Immutable.List),
      onFilesDelete: PropTypes.func
    };
  }

  getErrorsByFileName = () => {
    const errorsWithErrorMsg = this.props.errors.toJS().map((error) => ({
      ...error,
      errorMsg: _.entries(_.omit(error, 'index', 'fileName')).map((entry) => entry.join(' '))
    }));
    return _.groupBy(errorsWithErrorMsg, 'fileName');
  };

  render() {
    const hasError = this.props.errors && this.props.errors.size > 0;
    return (
      <div className="tubes-create-from-csv tx-stack tx-stack--md">
        {hasError && _.map(this.getErrorsByFileName(), (errors, fileName) => {
          const key = `banner-${fileName}`;

          return (
            <Banner
              key={key}
              bannerType="error"
              bannerTitle={`The following errors were found in your csv: ${fileName}`}
              bannerMessage={(
                <ul>
                  {errors.map((error) => {
                    const { index, errorMsg } = error;

                    return (
                      <li key={`${key}-${index}`}>{`Line ${index}: ${_.capitalize(errorMsg)}`}</li>
                    );
                  })}
                </ul>
              )}
            />
          );
        })}
        <CSVUploadWithInstructions
          instruction="A bulk tube CSV template is downloading."
          payload={payload()}
          downloadName="tubes.csv"
          downloadOnMount={!hasError}
          onCSVChange={(data, fileName, fileId) =>  this.props.onCSVChange(createInputValues(data), fileName, fileId)}
          onFilesDelete={this.props.onFilesDelete}
        />
      </div>
    );
  }
}

export { TubesCreateFromCSV, csvHeaderNames, createInputValues, payload };
