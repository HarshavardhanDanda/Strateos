import Immutable from 'immutable';
import _ from 'lodash';
import Moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';

import { SinglePaneModal } from 'main/components/Modal';
import { LabeledInput, DatePicker, TextInput, Select } from '@transcriptic/amino';
import DeviceActions from 'main/actions/DeviceActions';
import ModalActions from 'main/actions/ModalActions';
import DeviceStore from 'main/stores/DeviceStore';

const dateFormatStr = DeviceStore.getDateFormatStr();

const MODAL_ID = 'DEVICE_EDITOR_MODAL';

class DeviceEditorModal extends React.Component {
  constructor(props, context) {
    super(props, context);
    const device = Immutable.fromJS(props.device);
    this.state = {
      device: device,
      id: device.get('id'),
      name: device.get('name'),
      manufacturer: device.get('manufacturer'),
      model: device.get('model'),
      serial_number: device.get('serial_number'),
      work_unit_name: device.get('work_unit_name')
    };

    if (this.state.device.get('manufactured_at')) {
      this.state.device = this.state.device.set(
        'manufactured_at',
        Moment(this.state.device.get('manufactured_at')).toDate()
      );
    }

    if (this.state.device.get('purchased_at')) {
      this.state.device = this.state.device.set(
        'purchased_at',
        Moment(this.state.device.get('purchased_at')).toDate()
      );
    }
  }

  save(done) {

    const device = {};

    device.name = this.state.name;

    device.manufacturer = this.state.manufacturer;

    device.model = this.state.model;

    device.serial_number = this.state.serial_number;

    device.work_unit_id = this.getWorkUnitId();

    device.manufactured_at = this.state.device.get('manufactured_at') &&
      Moment(this.state.device.get('manufactured_at')).format(dateFormatStr);

    device.purchased_at = this.state.device.get('purchased_at') &&
      Moment(this.state.device.get('purchased_at')).format(dateFormatStr);

    const promise = this.isNew()
      ? DeviceActions.create(this.state.id, device)
      : DeviceActions.update(this.state.id, device);
    return promise
      .done(() => {
        window.location.reload();
        ModalActions.close(this.props.modalId);
      })
      .always(done);
  }

  getWorkUnitId() {
    return !this.isNew() || this.state.work_unit_name
      ? this.props.workUnits.filter(workUnit => {
        return this.state.work_unit_name === workUnit.get('name');
      }).toJS()[0].id
      : this.props.workUnits.toJS()[0].id;
  }

  isNew() {
    return !this.props.device || !this.props.device.id;
  }

  deviceProp(propName) {
    return {
      value: this.state.device.get(propName),
      requestChange: (val) => {
        return this.setState({
          device: this.state.device.set(propName, val)
        });
      }
    };
  }

  render() {
    const heading = this.isNew() ? 'New Device' : 'Edit Device';

    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalSize="large"
        title={heading}
        onAccept={done => this.save(done)}
      >
        <LabeledInput label="ID">
          <TextInput
            value={this.state.id}
            onChange={e => this.setState({ id: e.target.value })}
            disabled={!this.isNew()}
            placeholder="e.g. wc1-infinite3"
          />
        </LabeledInput>
        <LabeledInput label="Name">
          <TextInput
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
            placeholder="Device Name"
          />
        </LabeledInput>
        <LabeledInput label="Device Sets">
          <Select
            id="work-unit-select"
            name="work-unit-select"
            value={this.state.work_unit_name}
            onChange={e => this.setState({ work_unit_name: e.target.value })}
            options={
              this.props.workUnits.map(workUnit => {
                return {
                  value: workUnit.get('name'),
                  name: workUnit.get('name')
                };
              }).sort((a, b) => { return (a.name > b.name) ? 1 : -1; })
            }
          />
        </LabeledInput>
        <div className="row">
          <div className="col-xs-4">
            <LabeledInput label="Manufacturer">
              <TextInput
                value={this.state.manufacturer}
                onChange={e => this.setState({ manufacturer: e.target.value })}
                placeholder="e.g. Tecan"
              />
            </LabeledInput>
          </div>
          <div className="col-xs-4">
            <LabeledInput label="Model">
              <TextInput
                value={this.state.model}
                onChange={e => this.setState({ model: e.target.value })}
                placeholder="e.g. Infinite M200 Pro"
              />
            </LabeledInput>
          </div>
          <div className="col-xs-4">
            <LabeledInput label="Serial No.">
              <TextInput
                value={this.state.serial_number}
                onChange={e => this.setState({ serial_number: e.target.value })}
                placeholder="e.g. 123ABC"
              />
            </LabeledInput>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-6">
            <div>
              <h4>Date of Purchase</h4>
              <DatePicker
                date={this.state.device.get('purchased_at')}
                popperPlacement="right"
                shouldNotCloseOnOutsideClick
                onChange={(e) => {
                  return this.setState({
                    device: this.state.device.set(
                      'purchased_at',
                      e.target.value.date
                    )
                  });
                }}
              />
            </div>
          </div>
          <div className="col-xs-6">
            <div>
              <h4>Date of Manufacture</h4>
              <DatePicker
                date={this.state.device.get('manufactured_at')}
                popperPlacement="right"
                shouldNotCloseOnOutsideClick
                onChange={(e) => {
                  return this.setState({
                    device: this.state.device.set(
                      'manufactured_at',
                      e.target.value.date
                    )
                  });
                }}
              />
            </div>
          </div>
        </div>
      </SinglePaneModal>
    );
  }
}

DeviceEditorModal.propTypes = {
  device: PropTypes.object,
  workUnits: PropTypes.instanceOf(Immutable.Iterable),
  modalId: PropTypes.string
};

DeviceEditorModal.MODAL_ID = MODAL_ID;

export default DeviceEditorModal;
