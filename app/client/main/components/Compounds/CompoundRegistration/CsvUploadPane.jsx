import React      from 'react';
import PropTypes  from 'prop-types';
import _          from 'lodash';

import CSVUtil      from 'main/util/CSVUtil';
import SessionStore from 'main/stores/SessionStore';
import CompoundAPI  from 'main/api/CompoundAPI';
import UserActions  from 'main/actions/UserActions';
import { Molecule as OCLMolecule }    from 'openchemlib';
import { MultiStepModalPane }         from 'main/components/Modal';
import { parseAndSanitizeCSV }        from 'main/inventory/components/CSVUpload';
import { DragDropFilePicker, Banner, Toggle } from '@transcriptic/amino';

import './CsvUploadPane.scss';

const bannerMessage = `Please select a SMILES file (.txt) or a CSV (.csv) file for uploading compounds 
with additional properties (download example CSV file for reference).`;

const emptyFileMessage = 'Empty CSV/text file, please check your CSV/text file and retry.';
const missingSmilesMsg = 'Mandatory smiles column missing in CSV file.';
const csvFormatErrorMsg = 'CSV Format error, please check you CSV file and retry.';

class CsvUploadPane extends React.Component {
  constructor(props) {
    super(props);
    _.bindAll(
      this,
      'summarizeCompounds',
      'updateValidation',
      'updateRegisteredCompounds'
    );
    this.state = {
      uploadStatus: 'none',
      compounds: [],
      files: [],
      disableNext: true,
      waitingOnResponse: false,
      loadFailure: false,
      bannerMessage: bannerMessage,
      bannerType: 'info'
    };
  }

  componentWillMount() {
    // Reset the prop if its true before mounting the first modal window
    if (this.props.isPublicCompound && this.props.onTogglePublicCompound && !this.props.disableToggle) {
      this.props.onTogglePublicCompound();
    }
  }

  processDuplicates(compoundSmiles, records, compoundValidations) {
    const { compounds } = this.state;
    const duplicates = new Map();
    compounds.forEach(compound => {
      const { reference_id, name, labels } = compound;
      const smiles = compoundSmiles.get(compound.smiles) || compound.smiles;
      if (duplicates.has(smiles)) {
        duplicates.get(smiles).push({ reference_id, name, labels });
      } else {
        duplicates.set(smiles, [{ reference_id, name, labels }]);
      }
    });

    records.forEach(record => {
      if (duplicates.get(record.smiles).length > 1) {
        compoundValidations.get(record.smiles).push('Duplicates');
      }
    });
    return duplicates;
  }

  async updateRegisteredCompounds(records, compoundValidations) {
    const registeredLabels = new Map();
    const orgId = this.props.isPublicCompound ? null : SessionStore.getOrg().get('id');
    // get array of responses with registered compound information.
    const searchResponse = await CompoundAPI.indexAll({
      filters: {
        smiles: records.map(compound => compound.smiles).join(','),
        organization_id: SessionStore.getOrg().get('id')
      },
      doIngest: false
    });
    // pre-emptively load the user since we know we'll need them after registration in compoundpage
    UserActions.loadCurrentUser();

    // concatinating all the responses into single array.
    const registeredInfo = Array.concat(...searchResponse.map(resp => resp.data));

    const existingInfo = registeredInfo.filter((compound) => compound.attributes.organization_id == orgId);
    // creating a map of registered smiles to their corresponding attributes.
    const registeredSmiles = new Map(existingInfo.map(search => [search.attributes.smiles, search.attributes]));

    // if the record is already registered overwriting the compound info with registered one.
    const updatedRecords = records.map((summerizedCompound) => {
      if (registeredSmiles.has(summerizedCompound.smiles)) {
        const validation = compoundValidations.get(summerizedCompound.smiles);
        validation.push('Registered');
        validation.shift();
        const registeredCompound = registeredSmiles.get(summerizedCompound.smiles);
        registeredLabels.set(summerizedCompound.smiles, registeredCompound.labels);
        // appends labels and override other parameters

        return Object.assign(
          summerizedCompound,
          registeredCompound,
          { labels: _.uniqWith([...registeredCompound.labels, ...summerizedCompound.labels], _.isEqual) }
        );
      }
      return summerizedCompound;
    });
    this.setState({ registeredLabels });
    return updatedRecords;
  }

  addInvalidCompounds(invalidCompounds, records) {
    invalidCompounds
      .forEach((compound, index) => {
        records.push(Object.assign(compound, { id: records.length + index }));
      });
  }

  updateValidation(uniqueCompounds, compoundValidations) {
    uniqueCompounds.forEach((compound) => {
      const validation = [];
      try {
        OCLMolecule.fromSmiles(compound.smiles);
        if (compound.smiles.indexOf(' ') !== -1 || !compound.smiles) {
          validation.push('Invalid');
        } else {
          validation.push('Valid');
        }
      } catch (err) {
        validation.push('Invalid');
      } finally {
        compoundValidations.set(compound.smiles, validation);
      }
    });
  }

  async summarizeCompounds(next) {
    const { compounds } = this.state;
    if (compounds.length > 0) {
      const uniqueCompounds = _.uniqBy(compounds, 'smiles');
      // map to keep track of relation between uploaded smiles and summerized smiles
      const compoundSmiles = new Map();
      const compoundValidations = new Map();

      this.setState({ waitingOnResponse: true });

      // fills validation info, if a compound is Valid or Invalid.
      this.updateValidation(uniqueCompounds, compoundValidations);

      const validCompounds = uniqueCompounds
        .filter(compound => compoundValidations.get(compound.smiles).includes('Valid'));

      const invalidCompounds = uniqueCompounds
        .filter(compound => compoundValidations.get(compound.smiles).includes('Invalid'));

      // generate request for bulk compound creation API of only valid compounds with dry_run param true.
      const bulkCompoundRequest = CSVUtil.generateBulkUploadRequest(validCompounds, true, this.props.isPublicCompound);

      try {
        let data;

        if (this.props.isPublicCompound) {
          data = await CompoundAPI.createManyPublic(bulkCompoundRequest, false);
        } else {
          data = await CompoundAPI.createMany(bulkCompoundRequest, false);
        }
        // filtering valid compounds summarized info.
        const summarizeCompounds = validCompounds.map((compound, index) => {
          const summarizedCompound = data.compounds[index].data.attributes;
          const summerizedSmiles = summarizedCompound.smiles;
          const uploadedSmiles = compound.smiles;

          if (uploadedSmiles !== summerizedSmiles) {
            compoundSmiles.set(uploadedSmiles, summerizedSmiles);
            compoundValidations.set(summerizedSmiles, compoundValidations.get(uploadedSmiles));
            compoundValidations.delete(uploadedSmiles);
          }

          return Object.assign(summarizedCompound, { id: index, labels: compound.labels });
        });

        // update compoundVaidations in case they are registered.
        const records = await this.updateRegisteredCompounds(summarizeCompounds, compoundValidations);
        // add invalid compounds to records
        this.addInvalidCompounds(invalidCompounds, records);

        const duplicates = this.processDuplicates(compoundSmiles, records, compoundValidations);
        this.props.setCompounds(records, duplicates, compoundValidations, this.state.registeredLabels);
        next();

      } catch (e) {
        this.setState({
          bannerType: 'error',
          waitingOnResponse: false,
          bannerMessage: 'Failed to process please try again.'
        });
      }
    }
  }

  onDrop(files) {
    if (this.state.uploadStatus === 'none') {
      this.setState({ files: files, uploadStatus: 'uploading' }, () => {
        const [file] = this.state.files;
        const uploadFile = file.file;
        if (uploadFile.name.includes('.csv')) {
          this.handleCsv(file);
        } else if (uploadFile.name.includes('.txt')) {
          this.handleTextFile(file);
        } else {
          this.handleFailure(file);
        }
      });
    }
  }

  handleSuccess(file) {
    const updatedFile = { ...file, status: 'success', file: file.file };
    this.setState({ uploadStatus: 'success', disableNext: false, files: [updatedFile] });
  }

  handleFailure(file) {
    const updatedFile = { ...file, status: 'fail', file: file.file };
    this.setState({ uploadStatus: 'fail', disableNext: true, files: [updatedFile] });
  }

  showBannerError(msg) {
    this.setState({
      bannerType: 'error',
      waitingOnResponse: false,
      bannerMessage: msg
    });
  }

  handleCsv(csv) {
    return parseAndSanitizeCSV(csv.file).then((data) => {
      if (!data.length) {
        this.showBannerError(emptyFileMessage);
        throw new Error(emptyFileMessage);
      }
      const compounds = data.map(row => {
        let labels;
        if (row.smiles === undefined) {
          this.showBannerError(missingSmilesMsg);
          throw new Error(missingSmilesMsg);
        }
        if (row.labels && row.labels !== '') {
          labels = row.labels.split(',').map((label) => {
            return { name: label.trim(), organization_id: SessionStore.getOrg().get('id') };
          });
        }
        return {
          smiles: row.smiles,
          labels: labels || [],
          name: row.name || '',
          reference_id: row.reference_id || ''
        };
      });
      this.setCompounds(compounds);
    }).then(() => {
      this.handleSuccess(csv);
    }).catch((e) => {
      if (e.toString() !== `Error: ${missingSmilesMsg}` && e.toString() !== `Error: ${emptyFileMessage}`) {
        this.showBannerError(csvFormatErrorMsg);
      }
      this.handleFailure(csv);
    });
  }

  setCompounds(compounds) {
    this.setState({
      compounds,
      bannerType: 'info',
      bannerMessage: bannerMessage
    });
  }

  // Promisified FileReader
  readFile(file, callback) {
    const reader = new window.FileReader();
    return new Promise((resolve, reject) => {
      reader.readAsText(file);
      reader.onloadend = () => {
        callback(reader);
        resolve(reader);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  handleTextFile(file, delimiter = '\n') {
    return this.readFile(file.file,  (reader) => {
      const smilesList = _.remove(reader.result.split(delimiter));
      const compounds = smilesList.map(smiles => {
        return {
          labels: [],
          reference_id: '',
          smiles: smiles.trim(),
          name: ''
        };
      });
      if (compounds.length) {
        this.setCompounds(compounds);
        this.handleSuccess(file);
      } else {
        this.showBannerError(emptyFileMessage);
        this.handleFailure(file);
      }
    });
  }

  onRetryAndAbort() {
    this.setState({ uploadStatus: 'none', files: [], disableNext: true, bannerMessage, bannerType: 'info' });
  }

  getExampleCompounds() {
    return [
      {
        smiles: 'C',
        name: 'example-1',
        reference_id: '1',
        labels: ''
      },
      {
        smiles: 'CC',
        name: 'example-2',
        reference_id: '2',
        labels: 'label-1'
      },
      {
        smiles: 'CCC',
        name: 'example-3',
        reference_id: '3',
        labels: 'label-1,label-2'
      }
    ];
  }

  downloadTextFile() {
    const link = document.createElement('a');
    link.download = 'SMILES.txt';
    link.href = `data:text/csvcharset=utf-16,${encodeURIComponent('C\nCCC\nCCCC')}`;
    link.click();
  }

  renderPublicCompundToggle() {
    const { onTogglePublicCompound, isPublicCompound, disableToggle } = this.props;
    return (
      <div className="toggle-with-label">
        <Toggle
          name="public-compound-toggle"
          value={isPublicCompound ? 'on' : 'off'}
          onChange={onTogglePublicCompound}
          readOnly={disableToggle}
        />
        <span>Register as a public compound </span>
      </div>
    );
  }

  render() {
    const { onTogglePublicCompound } = this.props;
    return (
      <MultiStepModalPane
        {...this.props}
        key="BulkCompoundRegistrationModalUpload"
        showBackButton={false}
        showCancel
        cancelBtnClass="btn-medium btn-heavy btn-link btn-secondary"
        nextBtnClass="btn-medium btn-heavy"
        nextBtnDisabled={this.state.disableNext}
        beforeNavigateNext={this.summarizeCompounds}
        waitingOnResponse={this.state.waitingOnResponse}
        classNames={{ 'csv-upload-pane__body': true }}
      >
        {onTogglePublicCompound ? this.renderPublicCompundToggle() : <div />}
        <div className="csv-upload-pane__banner">
          <Banner
            bannerType={this.state.bannerType}
            bannerMessage={this.state.bannerMessage}
          />
        </div>
        <div className="csv-upload-pane__dragdrop">
          <DragDropFilePicker
            onDrop={(files) => {
              this.onDrop(files);
            }}
            files={this.state.files}
            uploadStatus={this.state.uploadStatus}
            retryUpload={() => this.onRetryAndAbort()}
            abortUpload={() => this.onRetryAndAbort()}
            multiple={false}
            size="auto"
          />
          <div className="tx-inline">
            <a
              className="tx-inline__item--xxs  bulk-upload-link"
              onClick={() =>  CSVUtil.downloadCSVFromJSON(this.getExampleCompounds(), 'compounds')}
            >
              <i className="csv-upload-pane__download-icon fa fa-cloud-upload-alt" />
              Download the expected csv format
            </a>
            <a
              className="bulk-upload-link"
              onClick={() =>  this.downloadTextFile()}
            >
              <i className="csv-upload-pane__download-icon fa fa-cloud-upload-alt" />
              Download the expected text file format
            </a>
          </div>
        </div>

      </MultiStepModalPane>
    );
  }
}

CsvUploadPane.propTypes = {
  setCompounds: PropTypes.func,
  onTogglePublicCompound: PropTypes.func
};

export default CsvUploadPane;
