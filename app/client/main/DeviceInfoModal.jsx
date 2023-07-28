import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import Urls from 'main/util/urls';
import { SinglePaneModal } from 'main/components/Modal';
import { Spinner, DateTime } from '@transcriptic/amino';
import ajax from 'main/util/ajax';

const MODAL_ID = 'DEVICE_INFO_MODAL';

class DeviceInfoModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = { device: undefined };
  }

  fetchDevice() {
    ajax
      .get(Urls.device(this.props.device_id))
      .then((device) => {
        this.setState({
          device
        });
      })
      .fail(() =>
        this.setState({
          error: 'Could not load device'
        })
      );
  }

  renderLastQCEvent() {
    if (!this.state.device) return <div />;

    const qc_events = _.filter(
      this.state.device.device_events,
      event => event.event_type === 'qc'
    );
    const last_qc_event = qc_events.length > 0 ? _.maxBy(qc_events, event => Date.parse(event.date)) : undefined;

    if (!last_qc_event) return <div />;

    return (
      <div className="section">
        <h3 className="section-title">Last Calibrated</h3>
        <dl className="dl-horizontal">
          <dt>Date</dt>
          <dd>
            <DateTime
              timestamp={last_qc_event.date}
              format="absolute-format"
            />
          </dd>
          <dt />
          <dd>
            <a href={Urls.s3_file(last_qc_event.report_url)}>
              Download Report
            </a>
          </dd>
        </dl>
      </div>
    );
  }

  render() {
    const device = this.state.device;

    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="large"
        title={`Device: ${(device ? device.name : undefined) || ''}`}
        onOpen={() => this.fetchDevice()}
      >

        {!device ?
          <Spinner />
          : (
            <div>
              <dl className="dl-horizontal">
                <dt>ID</dt>
                <dd>
                  {device.id}
                </dd>
                <dt>Name</dt>
                <dd>

                  {device.name ?
                    `${device.name}`
                    :
                    '—' }
                </dd>
                <dt>Manufacturer</dt>
                <dd>

                  {device.manufacturer ?
                    `${device.manufacturer}`
                    :
                    '—'}

                </dd>
                <dt>Model</dt>
                <dd>

                  {device.model ?
                    `${device.model}`
                    : '—'}

                </dd>
                <dt>Date of Manufacture</dt>
                <dd>

                  {device.manufactured_at ? (
                    <DateTime
                      timestamp={device.manufactured_at}
                      format="absolute-format"
                    />
                  )
                    :
                    '—' }
                </dd>
              </dl>
              {this.renderLastQCEvent()}
            </div>
          )}

      </SinglePaneModal>
    );
  }
}

DeviceInfoModal.propTypes = {
  device_id: PropTypes.string.isRequired,
  modalId: PropTypes.string.isRequired
};

DeviceInfoModal.MODAL_ID = MODAL_ID;

export default DeviceInfoModal;
