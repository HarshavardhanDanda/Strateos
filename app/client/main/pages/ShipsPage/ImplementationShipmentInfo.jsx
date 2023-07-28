import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';
import { LabeledInput, TextArea, DragDropFilePicker, Select, Validated } from '@transcriptic/amino';
import _ from 'lodash';
import AjaxButton from 'main/components/AjaxButton';
import FileUpload from 'main/components/upload';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import { ShipmentModel } from 'main/stores/ShipmentStore';
import { shipmentPropTypes } from 'main/models/Shipment/Shipment';

function PackingSlipAttachment(props) {
  // if a pre-existing shipment was provided, and an attachement was included
  // render a link to the attachement
  const onPSUploaded = props.onPSUploaded;
  const onPSUploadAborted = props.onPSUploadAborted;
  if (props.shipment && props.shipment.packingUrl()) {
    return (
      <div className="file-viewer">
        <a
          className="file-viewer__action"
          target="_blank"
          rel="noopener noreferrer"
          href={`/upload/url_for?key=${
            encodeURIComponent(props.package.ps_attachment_url)
          }`}
        >
          View File
        </a>
      </div>
    );
  }

  // if there is a file uploading, or a file present, present the file upload component
  if (props.package.uploading || props.package.psFile) {
    return (
      <div className="files">
        <FileUpload
          file={props.package.psFile}
          onUploadDone={(file, key) => onPSUploaded(file, key)}
          onUploadAborted={(file, key) => onPSUploadAborted(file, key)}
        />
      </div>
    );
  }
  // if there was no file uploading or present present the file picker
  return (
    <DragDropFilePicker
      onDrop={files => props.onPSAttached(files)}
      files={[]}
      multiple={false}
      size="small"
      fileType="files"
    />
  );
}

PackingSlipAttachment.propTypes = {
  shipment: PropTypes.instanceOf(ShipmentModel).isRequired,
  package: PropTypes.shape({
    title: PropTypes.string,
    note: PropTypes.string,
    receiving_note: PropTypes.string,
    ps_attachment_url: PropTypes.string,
    force_validate: PropTypes.bool,
    psFile: PropTypes.object,
    uploading: PropTypes.bool
  }).isRequired,
  onPSAttached: PropTypes.func.isRequired,
  onPSUploadAborted: PropTypes.func.isRequired,
  onPSUploaded: PropTypes.func.isRequired
};

class ImplementationShipmentInfo extends React.Component {

  static get propTypes() {
    return {
      onTextInput: PropTypes.func.isRequired,
      updateShipment: PropTypes.func.isRequired,
      saveShipment: PropTypes.func.isRequired,
      package: PropTypes.shape({
        title: PropTypes.string,
        note: PropTypes.string,
        receiving_note: PropTypes.string,
        ps_attachment_url: PropTypes.string,
        force_validate: PropTypes.bool,
        psFile: PropTypes.object,
        uploading: PropTypes.bool
      }).isRequired,
      checkingIn: PropTypes.bool.isRequired,
      shipment: shipmentPropTypes,
      onPSUploaded: PropTypes.func.isRequired,
      onPSUploadAborted: PropTypes.func.isRequired,
      onPSAttached: PropTypes.func.isRequired,
      disableSave: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      disableSave: false
    };
  }

  static validator() {
    return SimpleInputsValidator({
      lab_id: {
        validators: [validators.non_empty]
      }
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      forceValidate: false,
    };
  }

  getLabs() {
    const { shipment, labs, checkingIn } = this.props;
    if (shipment && checkingIn) {
      return labs.filter(lab => lab.value  === shipment.labId());
    } else {
      return labs;
    }
  }

  render() {
    let error;
    if (this.state.forceValidate) {
      error = ImplementationShipmentInfo.validator().errors(Immutable.Map(this.state));
    }
    return (
      <form
        className="implementation-shipment-info row col-md-12"
        onSubmit={(e) => { e.preventDefault(); return false; }}
      >
        <div className="col-md-3">
          <LabeledInput label="Packing Slip">
            <div className="attachment-uploader">
              {PackingSlipAttachment({
                shipment: this.props.shipment,
                package: this.props.package,
                onPSAttached: this.props.onPSAttached,
                onPSUploadAborted: this.props.onPSUploadAborted,
                onPSUploaded: this.props.onPSUploaded
              })}
            </div>
          </LabeledInput>
        </div>
        <div className="col-md-9" style={{ display: 'flex', flexDirection: 'row' }}>
          <LabeledInput label="Shipment Notes">
            <TextArea
              onChange={e => this.props.onTextInput('note', e.target.value)}
              onBlur={e => (!this.props.checkingIn && this.props.updateShipment('note', e.target.value))}
              value={this.props.package.note}
              className="implementation-shipment-info__notes"
              readOnly={this.props.checkingIn}
            />
          </LabeledInput>
          <div className="col-md-12">
            <LabeledInput label="Lab">
              <Validated force_validate={this.state.forceValidate} error={error && error.lab_id}>
                <Select
                  placeholder="Select any lab"
                  options={this.getLabs()}
                  value={this.props.package.lab_id}
                  id="id"
                  name="Lab"
                  onChange={e => {
                    const val = e.target.value;
                    this.props.onLabInput('lab_id', val, () => this.props.updateShipment('lab_id', val));
                  }}
                />
              </Validated>
            </LabeledInput>
          </div>
        </div>
        {
          (this.props.checkingIn || this.props.shipment) && (
            <div className="col-md-12">
              <LabeledInput label="Checkin Notes">
                <TextArea
                  onChange={e => this.props.onTextInput('receiving_note', e.target.value)}
                  onBlur={e => (this.props.checkingIn && this.props.updateShipment('receiving_note', e.target.value))}
                  value={this.props.package.receiving_note}
                  className="implementation-shipment-info__notes"
                  readOnly={!this.props.checkingIn}
                />
              </LabeledInput>
            </div>
          )}
        {(!this.props.checkingIn && !this.props.shipment) && (
          <AjaxButton
            type="primary"
            className="implementation-shipment-info__submit"
            action={() => {
              this.setState({ forceValidate: _.isUndefined(this.props.package.lab_id) }, () => {
                if (!this.state.forceValidate) {
                  this.props.saveShipment();
                }
              });
            }}
            disabled={this.props.disableSave}
          >
            <span>Save</span>
          </AjaxButton>
        )}
      </form>
    );
  }
}

export default ImplementationShipmentInfo;
