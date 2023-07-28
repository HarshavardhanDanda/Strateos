import _         from 'lodash';
import Moment    from 'moment';
import PropTypes from 'prop-types';
import React     from 'react';

import DeviceInfoModal from 'main/DeviceInfoModal';
import SessionStore from 'main/stores/SessionStore';
import ModalActions from 'main/actions/ModalActions';

import { Param, DateTime } from '@transcriptic/amino';

class ExecutionTime extends React.Component {

  static get propTypes() {
    return {
      instruction: PropTypes.object.isRequired
    };
  }

  execution() {
    const execution = {};

    this.props.instruction.warps.forEach((w) => {
      let value;

      if (execution[w.device_id] == undefined) {
        execution[w.device_id] = 0;
      }

      if (w.reported_started_at != undefined && w.reported_completed_at != undefined) {
        value = Moment(w.reported_completed_at) - Moment(w.reported_started_at);
        execution[w.device_id] = value;
      }
    });

    return execution;
  }

  modalId(deviceId) {
    return `${DeviceInfoModal.MODAL_ID}_${this.props.instruction.id}_${deviceId}`;
  }

  render() {
    if (_.isEmpty(this.execution())) {
      return false;
    }

    return (
      <Param
        label="Execution"
        value={_.map(this.execution(), (time, device) => {
          return (
            <span key={device}>
              <Choose>
                <When condition={SessionStore.isAdmin()}>
                  <a onClick={() => (ModalActions.open(this.modalId(device)))}>
                    {device}
                  </a>
                  <DeviceInfoModal
                    device_id={device}
                    modalId={this.modalId(device)}
                  />
                </When>
                <Otherwise><span>{device}</span></Otherwise>
              </Choose>
              {' '}
              <DateTime format="human-duration" timestamp={time} />
            </span>
          );
        })}
      />
    );
  }
}

export default ExecutionTime;
