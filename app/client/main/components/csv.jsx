import Papa      from 'papaparse';
import PropTypes from 'prop-types';
import React     from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';

const MODAL_ID = 'BULK_INPUT_MODAL';

// Generic modal for uploading free text.  Gives affordance for downloading csv data passed as props
class BulkInputModal extends React.Component {

  static get propTypes() {
    return {
      onImport:         PropTypes.func,
      title:            PropTypes.string.isRequired,
      href:             PropTypes.string,
      download:         PropTypes.string,
      placeholder_text: PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.import = this.import.bind(this);
    this.parse  = this.parse.bind(this);

    this.state = {
      errors: undefined
    };
  }

  modalDidShow() {
    return this.textArea.focus();
  }

  parse() {
    const parsed = Papa.parse(this.textArea.value);
    const data   = parsed.data;
    const errors = parsed.errors.filter(e => e.code !== 'UndetectableDelimiter');

    this.setState({
      errors
    });

    return {
      data,
      errors
    };
  }

  import() {
    const { data, errors } = this.parse();
    if (!errors.length) {
      if (this.props.onImport) {
        this.props.onImport(data);
      }

      ModalActions.close(MODAL_ID);
    }
  }

  render() {
    return (
      <SinglePaneModal
        modalId={MODAL_ID}
        title={this.props.title}
        onAccept={this.import}
        acceptText="Import"
        acceptBtnDisabled={this.state.errors != undefined ? this.state.errors.length : undefined}
      >
        <div>
          <If condition={this.props.href != undefined && this.props.download != undefined}>
            <a href={this.props.href} download={this.props.download}>
              <i className="fa fa-download" /> Download CSV template
            </a>
          </If>
          <div className="alert alert-warning">
            Paste CSV content in the box below
          </div>
          <textarea
            ref={(node) => { this.textArea = node; }}
            className="form-control"
            style={{ marginTop: 20 }}
            rows={10}
            placeholder={this.props.placeholder_text}
            onChange={this.parse}
          />
          <If condition={this.state.errors != undefined ? this.state.errors.length : undefined}>
            <div className="errors" style={{ marginTop: 10 }}>
              {this.state.errors.map((e) => {
                return (
                  <div key={`csv-error-${e.row}`} className="alert alert-danger">
                    <strong>Error</strong>
                    {` ${e.message} on row ${e.row}`}
                  </div>
                );
              })}
            </div>
          </If>
        </div>
      </SinglePaneModal>
    );
  }
}

BulkInputModal.MODAL_ID = MODAL_ID;

export default BulkInputModal;
