import PropTypes from 'prop-types';
import _ from 'lodash';
import React from 'react';

import {
  Button,
  ButtonGroup,
  LabeledInput,
  TextArea
} from '@transcriptic/amino';
import Urls from 'main/util/urls';
import ContainerActions from 'main/actions/ContainerActions';
import IntakeKitActions from 'main/actions/IntakeKitActions';

import './ShipmentConfirmationPage.scss';

class ShipmentConfirmationPage extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      notes: props.intakeKitNotes
    };

    this.onDownloadClick = this.onDownloadClick.bind(this);
    this.onProcessKit = this.onProcessKit.bind(this);
  }

  async onDownloadClick() {
    const { name, easy_post_label_url } = this.props.intakeKit;
    const response = await fetch(easy_post_label_url);
    response.blob().then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.png`;
      link.click();
    });
  }

  onProcessKit() {
    const { id, name, lab_id, organization_id } = this.props.intakeKit;
    const { containerIds } = this.props;
    const intakeKit = {
      id: id,
      notes: this.state.notes || null
    };
    if (!confirm(`Ship ${name} kit to customers?`)) {
      return;
    }

    ContainerActions.updateMany(containerIds, { location_id: '', lab_id: lab_id, organization_id: organization_id })
      .done(() => {
        IntakeKitActions.update(intakeKit, true).done(() => {
          this.props.history.push({ pathname: Urls.lab_intake_kits() });
        });
      });
  }

  render() {
    const { easy_post_label_url } = this.props.intakeKit;

    return (
      <div>
        <h3 className="shipment-confirmation-page__item-header">
          Your shipment instructions
        </h3>
        <ul className="shipment-confirmation-page__list-header">
          <li  className="shipment-confirmation-page__list-item"><span className="shipment-confirmation-page__list-item-text">Ensure that there are no other tracking labels attached to your package. If you are shipping a non-hazardous item, completely remove or cover any hazardous materials markings.</span></li>
          <li  className="shipment-confirmation-page__list-item"><span className="shipment-confirmation-page__list-item-text">Affix the mailing label squarely onto the address side of the parcel, covering up any previous delivery address and barcode without overlapping any adjacent side.</span></li>
        </ul>

        <img className="shipment-confirmation-page__label" src={easy_post_label_url} alt="Barcode label" />
        <div>
          <LabeledInput label="Notes to customer">
            <TextArea
              name="note"
              value={this.state.notes}
              onChange={(e) => this.setState({ notes: e.target.value })}
            />
          </LabeledInput>
        </div>

        <div className="shipment-confirmation-page__buttons">

          <ButtonGroup orientation="horizontal">
            <Button
              type="primary"
              invert
              link
              onClick={this.onDownloadClick}
            >
              Download label
            </Button>
            <Button
              type="primary"
              height="tall"
              invert
              to={easy_post_label_url}
              tagLink
              newTab
            >
              Print label
            </Button>
            <Button
              type="primary"
              height="tall"
              onClick={this.onProcessKit}
            >
              Ship to customer
            </Button>
          </ButtonGroup>
        </div>
      </div>
    );
  }
}

ShipmentConfirmationPage.propTypes = {
  containerIds: PropTypes.array.isRequired,
  intakeKit: PropTypes.object.isRequired
};

export default ShipmentConfirmationPage;
