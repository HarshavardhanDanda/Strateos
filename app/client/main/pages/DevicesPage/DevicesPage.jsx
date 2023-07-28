import React from 'react';
import moment from 'moment';
import Immutable from 'immutable';
import { NavLink, Link } from 'react-router-dom';

import { PageLayout, PageHeader } from 'main/components/PageLayout';
import DeviceActions from 'main/actions/DeviceActions';
import WorkUnitActions from 'main/actions/WorkUnitActions';
import ModalActions from 'main/actions/ModalActions';
import { TabLayout } from 'main/components/TabLayout';
import DeviceStore from 'main/stores/DeviceStore';
import WorkUnitStore from 'main/stores/WorkUnitStore';
import Urls from 'main/util/urls.js';
import { Button, ButtonGroup, List, Column, Breadcrumbs, Spinner, DateTime, Subtabs } from '@transcriptic/amino';
import { pubSub } from '@strateos/micro-apps-utils';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import DeviceEventsModal from './DeviceEventsModal';
import DeviceEditorModal from './DeviceEditorModal';
import FederatedWrapper from '../../components/FederatedWrapper';

/* eslint-disable import/no-unresolved */
const DeviceManager = React.lazy(() => import('ams_device_manager/App'));
const HeaderButton = React.lazy(() => import('ams_device_manager/HeaderButton'));
const DeviceManagerBreadCrumbs = React.lazy(() => import('ams_device_manager/DeviceManagerBreadCrumbs'));
/* eslint-enable import/no-unresolved */

const getDeviceManagerBase = () => `${Urls.devices()}/manager`;

class DevicesPage extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.onSortChange = this.onSortChange.bind(this);
    this.onColumnsSelection = this.onColumnsSelection.bind(this);
    this.fetchAll = this.fetchAll.bind(this);
    this.renderActions = this.renderActions.bind(this);
    this.updateDevices = this.updateDevices.bind(this);
    this.showDeviceManager = this.showDeviceManager.bind(this);

    this.state = {
      isDevicesLoaded: false,
      sortKey: 'id',
      sortDirection: 'asc',
      devices: Immutable.Iterable(),
      workUnits: Immutable.List(),
      visibleColumns: ['ID', 'NAME', 'Manufacturer', 'Last QC', 'Device Sets', 'actions']
    };
  }

  componentDidMount() {
    this.fetchAll();
  }

  fetchAll() {
    DeviceActions.loadAll().done(() => {
      this.setState({ devices: DeviceStore.getAll(), isDevicesLoaded: true });
    });
    WorkUnitActions.loadAllWorkUnits().done(() => {
      this.setState({ workUnits: WorkUnitStore.getAll() });
    });
  }

  updateDevices(deviceId, newDevice) {
    const newDevices = this.state.devices.map(device => {
      return device.get('id') === deviceId ? newDevice : device;
    });
    this.setState({ devices: newDevices });
  }

  showEditorModal() {
    ModalActions.open(DeviceEditorModal.MODAL_ID);
  }

  onColumnsSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onLastQCSortChange(sortDirection) {
    const sortLqc = (device) => {
      const qc_events = device.get('device_events').filter(
        ev => ev.get('event_type') === 'qc'
      );
      return qc_events.map(qc_event => qc_event.get('date')).get(qc_events.size - 1);
    };
    const { devices } = this.props;
    const sortedDevices = sortDirection === 'asc'
      ? devices.sort((x, y) => moment.utc(sortLqc(x)).diff(moment.utc(sortLqc(y))))
      : devices.sort((x, y) => moment.utc(sortLqc(y)).diff(moment.utc(sortLqc(x))));
    return sortedDevices;
  }

  onSortChange(sortKey, sortDirection) {
    let sortedDevices;
    if (sortKey === 'last-qc') {
      sortedDevices = this.onLastQCSortChange(sortDirection);
    } else {
      const { devices } = this.props;
      sortedDevices = devices.sortBy(device => device.get(sortKey));
      if (sortDirection === 'desc') sortedDevices = sortedDevices.reverse();
    }
    this.setState({ sortKey: sortKey, sortDirection: sortDirection, devices: sortedDevices });
  }

  showDeviceManager() {
    return AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PROVISIONED_DEVICES);
  }

  isDeviceManagerTab() {
    const match = this.props.match && this.props.match.path.match(/^\/.+\/.+\/(.+)/);
    return !!(match && match[1] === 'manager' && this.showDeviceManager());
  }

  renderLastQC(device) {
    const qc_events = device.get('device_events').filter(
      ev => ev.get('event_type') === 'qc'
    );
    const last_qc = qc_events.size > 0 ? qc_events.sortBy(ev => ev.get('date')).last().get('date') : undefined;
    return (
      last_qc ? <DateTime timestamp={last_qc} format="absolute-format" /> : '—'
    );
  }

  renderActions(device) {
    const lab_id = WorkUnitStore.getById(device.get('work_unit_id')).get('lab_id');

    function deviceEditorModalId() {
      return `${DeviceEditorModal.MODAL_ID}_${device.get('id')}`;
    }
    function showDeviceEditor() {
      ModalActions.open(deviceEditorModalId());
    }

    function deviceEventsModalId() {
      return `${DeviceEventsModal.MODAL_ID}_${device.get('id')}`;
    }

    function showDeviceEvents() {
      ModalActions.open(deviceEventsModalId());
    }
    function onDestroy(done) {
      if (window.confirm(`Delete device ${device.get('id')}?`)) {
        DeviceActions.destroy(device.get('id')).done(() => window.location.reload());
      } else {
        done();
      }
    }
    return (
      <div>
        <DeviceEventsModal
          device={device.toJS()}
          modalId={deviceEventsModalId()}
        />
        <DeviceEditorModal
          device={device.toJS()}
          workUnits={this.state.workUnits || Immutable.List()}
          modalId={deviceEditorModalId()}
          updateDevices={this.updateDevices}
        />
        <ButtonGroup orientation="horizontal">
          {FeatureStore.hasFeatureInLab(FeatureConstants.VIEW_DEVICES, lab_id) && (
            <Button
              type="default"
              size="small"
              height="short"
              sortedContainers
              onClick={showDeviceEvents}
              link
              icon="fa-calendar-alt"
              label="Show Events"
            />
          )}
          {FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_DEVICES, lab_id) && (
            <Button
              type="default"
              size="small"
              height="short"
              link
              onClick={() => showDeviceEditor()}
              icon="fa-edit"
              label="Edit Device"
            />
          )}
          {FeatureStore.hasFeatureInLab(FeatureConstants.MANAGE_DEVICES, lab_id) && (
            <Button
              waitForAction
              type="danger"
              size="small"
              height="short"
              link
              icon="fa-trash-alt"
              onClick={onDestroy}
              label="Remove Device"
            />
          )}
        </ButtonGroup>
      </div>
    );
  }

  renderTabs() {
    if (!this.showDeviceManager()) {
      return null;
    }
    return (
      <Subtabs>
        <NavLink
          isActive={() => !this.isDeviceManagerTab()}
          to={`${Urls.devices()}`}
        >
          Devices
        </NavLink>
        <NavLink
          onClick={() => pubSub.publish('DEVICE_MANAGER_NAVIGATE', { version: 1, to: getDeviceManagerBase() })}
          to={getDeviceManagerBase()}
        >
          Workcells
        </NavLink>
      </Subtabs>
    );
  }

  renderManufacturer(device) {
    return (
      <div>
        {device.get('manufacturer')}
        {' / '}
        <strong>
          {device.get('model')}
        </strong>
      </div>
    );
  }

  renderNewDeviceButton() {
    const buttons = [];
    const showDeviceManagerHeaderButtons = AcsControls.isFeatureEnabled(FeatureConstants.PROVISION_NEW_DEVICE) || AcsControls.isFeatureEnabled(FeatureConstants.DEPLOY_DEVICE_DRIVERS);
    if (this.isDeviceManagerTab()) {
      if (showDeviceManagerHeaderButtons) {
        buttons.push(
          <FederatedWrapper delayed={<div />} error={<div />} key="header-button">
            <HeaderButton />
          </FederatedWrapper>);
      }
    } else if (AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_DEVICES)) {
      buttons.push((
        <Button
          key="new-device"
          style={{ marginRight: '10px' }}
          type="primary"
          size="medium"
          icon="fa-plus"
          onClick={() => this.showEditorModal()}
        >
          New Device
        </Button>
      ));
    }

    return buttons.length > 0 && (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {buttons}
      </div>
    );
  }

  renderTitle() {
    if (this.isDeviceManagerTab()) {
      return (
        <FederatedWrapper delayed={<div />} error={<div />}>
          <DeviceManagerBreadCrumbs />
        </FederatedWrapper>
      );
    }
    return (
      <Breadcrumbs>
        <Link
          to={Urls.devices()}
        >
          Devices
        </Link>
      </Breadcrumbs>
    );
  }

  renderDeviceManager() {
    return (
      <TabLayout>
        <FederatedWrapper error={<div>Unable to load Device Manager.</div>}>
          <DeviceManager
            key="device-manager"
            fetchLabsUrl="/api/labs?filter[feature]=VIEW_PROVISIONED_DEVICES"
            amsBase="/service/ams"
            acsPermissions={FeatureStore.getACSPermissions()}
            features={FeatureConstants}
            routeBase={getDeviceManagerBase()}
          />
        </FederatedWrapper>
      </TabLayout>
    );
  }

  renderDeviceList() {
    return (
      <TabLayout>
        <div
          className="row"
        >
          <div className="col-md-2">
            <DeviceEditorModal
              device={{}}
              workUnits={this.state.workUnits || []}
              updateDevices={this.updateDevices}
              modalId={DeviceEditorModal.MODAL_ID}
            />
          </div>
          <div className="col-md-10" />
        </div>
        {this.state.isDevicesLoaded ? (
          <List
            id={KeyRegistry.DEVICES_TABLE}
            data={this.state.devices}
            disabledSelection
            showPagination={false}
            pageSizeOptions={[]}
            loaded
            visibleColumns={this.state.visibleColumns}
            persistKeyInfo={UserPreference.packInfo(KeyRegistry.DEVICES_TABLE)}
            onChangeSelection={selectedColumns => this.onColumnsSelection(selectedColumns)}
            showColumnFilter
          >
            <Column
              renderCellContent={(device) => device.get('id')}
              sortable
              onSortChange={this.onSortChange}
              header="ID"
              id="id"
              key="colum-id"
              disableFormatHeader
            />
            <Column
              renderCellContent={(device) => device.get('name')}
              sortable
              onSortChange={this.onSortChange}
              header="NAME"
              id="name"
              key="colum-name"
            />
            <Column
              sortable
              onSortChange={this.onSortChange}
              renderCellContent={this.renderManufacturer}
              header="Manufacturer"
              id="manufacturer"
              key="colum-manufacturer"
            />
            <Column
              renderCellContent={this.renderLastQC}
              sortable
              onSortChange={this.onSortChange}
              header="Last QC"
              id="last-qc"
              key="colum-last-qc"
            />
            <Column
              renderCellContent={(device) => device.get('work_unit_name')}
              header="Device Sets"
              id="work-unit"
              key="colum-work-unit"
            />
            <Column
              renderCellContent={this.renderActions}
              header="actions"
              id="actions"
              key="colum-actions"
            />
          </List>
        )
          :
          <Spinner />}
      </TabLayout>
    );
  }

  render() {
    const content = this.isDeviceManagerTab() ? this.renderDeviceManager() : this.renderDeviceList();
    return (
      <div id="devices">
        <PageLayout
          Subtabs={this.renderTabs()}
          PageHeader={(
            <PageHeader
              titleArea={this.renderTitle()}
              primaryInfoArea={this.renderNewDeviceButton()}
            />
          )}
        >
          {content}
        </PageLayout>
      </div>
    );
  }
}

DevicesPage.displayName = 'DevicesPage';
export { DevicesPage };
