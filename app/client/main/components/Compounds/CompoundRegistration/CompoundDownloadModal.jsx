import React     from 'react';
import PropTypes from 'prop-types';
import _         from 'lodash';
import { Button, Checkbox, TextBody } from '@transcriptic/amino';
import { SinglePaneModal }   from 'main/components/Modal';

class CompoundDownloadModal extends React.Component {
  static get MODAL_ID() {
    return 'CompoundDownloadModal';
  }

  renderFooter() {
    const { closeModal, onDownloadClicked } = this.props;
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button invert type="secondary" onClick={() => closeModal()}>Cancel</Button>
        <Button type="primary" onClick={() => onDownloadClicked()}>Download</Button>
      </div>
    );
  }

  render() {
    const { onDownloadOptionChange, downloadOption } = this.props;
    return (
      <SinglePaneModal
        title={'Download'}
        modalId={CompoundDownloadModal.MODAL_ID}
        footerRenderer={() => this.renderFooter()}
        modalSize="medium"
      >
        <div className="tx-stack tx-stack--sm">
          <TextBody variant="body" color="secondary">
            {this.props.text}
          </TextBody>
          <Checkbox
            id="compound-csv-download"
            onChange={onDownloadOptionChange}
            checked={downloadOption.csv ? 'checked' : 'unchecked'}
            label="Data Summary"
            name="csv"
          />
          <Checkbox
            id="compound-sdf-download"
            onChange={onDownloadOptionChange}
            checked={downloadOption.sdf ? 'checked' : 'unchecked'}
            label="SDF"
            disableFormatLabel
            name="sdf"
          />
        </div>
      </SinglePaneModal>
    );
  }
}

CompoundDownloadModal.propTypes = {
  text: PropTypes.string,
  onDownloadClicked: PropTypes.func,
  closeModal: PropTypes.func
};

export default CompoundDownloadModal;
