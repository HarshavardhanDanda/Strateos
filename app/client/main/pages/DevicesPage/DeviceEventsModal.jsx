import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Moment from 'moment';
import Immutable from 'immutable';
import Urls from 'main/util/urls';
import { SinglePaneModal } from 'main/components/Modal';
import FilePickUpload from 'main/components/FilePickUpload';
import ajax from 'main/util/ajax';
import { DatePicker, Button, ButtonGroup, Select, LabeledInput, Table, Column, Card, DateTime } from '@transcriptic/amino';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import DeviceStore from 'main/stores/DeviceStore';
import WorkUnitStore from '../../stores/WorkUnitStore';

const dateFormatStr = DeviceStore.getDateFormatStr();

const DEVICE_EVENTS_MODAL_ID = 'DEVICE_EVENTS_MODAL';
const EVENT_EDITOR_MODAL_ID = 'EVENT_EDITOR_MODAL';

const DEFAULT_EVENT_NAME = 'Quality Control';
const DEFAULT_EVENT_TYPE = 'qc';

class EventEditorModal extends React.Component {
  static get propTypes() {
    const { shape, string, bool, func, number } = PropTypes;

    return {
      device:  shape({ id: string.isRequired }).isRequired,
      modalId: string.isRequired,
      event:   shape({ id: number, event_type: string }).isRequired,
      onSave:  func.isRequired,
      new:     bool
    };
  }

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.state = {
      reportUrl: undefined,
      date: undefined,
      eventType: props.event.event_type || DEFAULT_EVENT_TYPE
    };
  }

  save(done) {
    const newEvent = {
      type: 'device_events',
      id: this.props.event.id,
      attributes: {
        device_id: this.props.device.id,
        date: this.state.date && Moment(this.state.date).format(dateFormatStr),
        event_type: this.state.eventType,
        report_url: this.state.reportUrl
      }
    };

    const eventsUrl = Urls.device_events(this.props.device.id);
    const url = this.props.new ? eventsUrl : `${eventsUrl}/${this.props.event.id}`;

    const data = { data: newEvent };

    const request = this.props.new ? ajax.post(url, data) : ajax.put(url, data);

    return request.done((res) => {
      this.props.onSave(res);
      ModalActions.close(this.props.modalId);
      window.location.reload();
    })
      .fail(NotificationActions.handleError.bind(NotificationActions))
      .always(done);
  }

  render() {
    const heading = this.props.new ? 'New Event' : 'Edit Event';
    const { reportUrl, date } = this.state;
    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        title={heading}
        onAccept={this.save}
        acceptBtnDisabled={!(reportUrl && date)}
      >
        <div className="tx-stack tx-stack--xxs">
          <LabeledInput label="Date">
            <DatePicker
              date={this.state.date}
              popperPlacement="right"
              shouldNotCloseOnOutsideClick
              onChange={(e) => this.setState({ date: e.target.value.date })}
            />
          </LabeledInput>
          <LabeledInput label="Type">
            <Select
              id="event-type-selection"
              ref={(node) => {
                this.eventTypeNode = node;
              }}
              value={this.state.eventType}
              options={[
                { value: DEFAULT_EVENT_TYPE, name: DEFAULT_EVENT_NAME },
                { value: 'service', name: 'Servicing' }
              ]}
              onChange={(e) => this.setState({ eventType: e.target.value })}
            />
          </LabeledInput>
          <LabeledInput label="Report">
            <FilePickUpload
              id="event-report-file-upload"
              accept="application/pdf"
              title="Event Report File"
              fileType="PDF"
              onAllUploadsDone={(fileInfos) => {
                this.setState({ reportUrl: fileInfos[0].key });
              }}
            />
          </LabeledInput>
        </div>
      </SinglePaneModal>
    );
  }
}

EventEditorModal.MODAL_ID = EVENT_EDITOR_MODAL_ID;

class DeviceEventsModal extends React.Component {
  static get propTypes() {
    const { shape, string, array } = PropTypes;

    return {
      modalId: string.isRequired,
      device: shape({
        id: string.isRequired,
        device_events: array
      })
    };
  }

  constructor(props) {
    super(props);
    this.renderActions = this.renderActions.bind(this);
    this.showNewEventModal = this.showNewEventModal.bind(this);
    this.eventWasCreated = this.eventWasCreated.bind(this);
    this.eventWasDeleted = this.eventWasDeleted.bind(this);
    this.eventWasEdited = this.eventWasEdited.bind(this);

    const device = { ...props.device };
    device.device_events = this.sort(device.device_events);
    this.state = device;
  }

  sort(events) {
    return events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }

  eventWasDeleted(event) {
    const newEvents = this.state.device_events.filter(x => x.id !== event.id);
    this.state.device_events = this.sort(newEvents);
    this.setState({ device_events: newEvents });
  }

  eventWasCreated(event) {
    this.state.device_events = this.sort(this.state.device_events.concat(event));
    return this.setState(this.state);
  }

  eventWasEdited(event) {
    const newEvents = [...this.state.device_events];
    const idx = newEvents.findIndex(x => x.id === event.id);
    newEvents[idx] = event;

    this.state.device_events = this.sort(newEvents);
    return this.setState({ device_events: newEvents });
  }

  showNewEventModal() {
    ModalActions.open(this.eventEditorId());
  }

  eventEditorId() {
    return `${EventEditorModal.MODAL_ID}_${this.props.device.id}`;
  }

  renderType(event) {
    function humanize(event_type) {
      switch (event_type) {
        case 'qc':
          return 'Quality Control';
        case 'service':
          return 'Servicing';
        default:
          return undefined;
      }
    }
    return humanize(event.get('event_type'));
  }

  renderReport(event) {
    return (
      <a href={Urls.s3_file(event.get('report_url'))}>Download</a>
    );
  }

  renderActions(event) {
    const device = this.state;
    const eventWasDeleted = this.eventWasDeleted;

    function destroy() {
      if (confirm(`Delete event of ${event.get('date')}?`)) {
        const url = `${Urls.device_events(device.id)}/${event.get('id')}`;
        ajax.delete(url)
          .then(() => eventWasDeleted(event.toJS()))
          .fail((xhr, text) => alert(`Could not delete event. ${text}`));
      }
    }

    function eventEditorModalId() {
      return `${EventEditorModal.MODAL_ID}_${event.get('id')}`;
    }

    function showEditEventModal() {
      ModalActions.open(eventEditorModalId());
    }
    return (
      <div>
        <EventEditorModal
          modalId={eventEditorModalId()}
          device={device}
          event={event.toJS()}
          onSave={this.eventWasEdited}
        />
        <ButtonGroup orientation="horizontal">
          <Button
            type="default"
            size="small"
            link
            onClick={showEditEventModal}
            icon="fa-edit"
            label="Edit Event"
          />
          <Button
            type="danger"
            size="small"
            link
            onClick={destroy}
            icon="fa-trash-alt"
            label="Remove Event"
          />
        </ButtonGroup>
      </div>
    );
  }

  render() {
    const device = this.state;
    const events = device.device_events;
    const lab_id =  WorkUnitStore.getById(this.props.device.work_unit_id).get('lab_id');

    return (
      <SinglePaneModal
        modalId={this.props.modalId}
        modalClass="device-events"
        modalSize="large"
        title={`${device.id} Events`}
      >
        <div
          className="row"
          style={{ marginBottom: '20px' }}
        >
          <div className="col-md-2">
            <EventEditorModal
              modalId={this.eventEditorId()}
              event={{}}
              device={this.props.device}
              new
              onSave={this.eventWasCreated}
            />
            {FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_DEVICE_EVENTS, lab_id) && (
            <Button
              type="primary"
              size="medium"
              icon="fa-plus"
              onClick={this.showNewEventModal}
            >
              New Event
            </Button>
            )}
          </div>
        </div>
        <Card allowOverflow>
          <Choose>
            <When condition={events.length === 0}>
              <tr>
                <td className="text-center">
                  <em>No Events</em>
                </td>
              </tr>
            </When>
            <Otherwise>
              <Table
                data={Immutable.fromJS(events)}
                loaded
                id="table table-striped records"
                disabledSelection
              >
                <Column renderCellContent={(event) => <DateTime timestamp={event.get('date')} />} header="Date" id="date-column" />
                <Column renderCellContent={this.renderType} header="Type" id="type-column" />
                <Column renderCellContent={this.renderReport} header="Report" id="report-column" />
                {FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_DEVICE_EVENTS, lab_id) && (
                  <Column renderCellContent={this.renderActions} id="actions-column" />
                )}
              </Table>
            </Otherwise>
          </Choose>
        </Card>
      </SinglePaneModal>
    );
  }
}

DeviceEventsModal.MODAL_ID = DEVICE_EVENTS_MODAL_ID;

export default DeviceEventsModal;
export { EventEditorModal };
