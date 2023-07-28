import React, { useState } from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import uuidv4 from 'uuid/v4';
import { InputsController, CheckboxGroup, Toggle, Column, Table, TextBody, TextDescription } from '@transcriptic/amino';
import {
  NotificationGroups,
  projectNotificationsGroup,
  shipmentNotificationsGroup,
  inventoryNotificationsGroup,
} from './NotificationGroups';

import './NotificationPreferences.scss';

interface Expanded {
  [rowNumber: number]: boolean;
}

interface InputState {
  [childPropsName: string]:  string | boolean | InputState;
}

interface NotificationPreferencesProps {
  onEmailToggleClicked: (name: string, currentValue: 'on' | 'off') => {},
  onCheckboxChange: (state: InputState, name: string) => {},
  selectedCheckboxes: string[],
  disabledCategories: string[],
  isExpanded?: boolean
}

function NotificationPreferences(props: NotificationPreferencesProps) {

  const { onCheckboxChange, selectedCheckboxes, isExpanded } = props;

  const [expanded, setExpanded] = useState<Expanded>({
    1: !_.isUndefined(isExpanded),
    2: !_.isUndefined(isExpanded),
    3: !_.isUndefined(isExpanded)
  });

  const tableData = Immutable.fromJS([
    {
      id: 1,
      title: 'Projects',
      caption:
        'Notifications related to projects and runs in your organization',
      name: projectNotificationsGroup,
      checkboxOptions: {
        notify_for_my_run_status: {
          value: NotificationGroups[projectNotificationsGroup][0],
          label: "Notify me when my run's status changes",
          name: NotificationGroups[projectNotificationsGroup][0],
          disabled: NotificationGroups[projectNotificationsGroup].disabled,
        },
        notify_for_org_run_status: {
          value: NotificationGroups[projectNotificationsGroup][1],
          label: 'Notify me when a run in my organization status changes',
          name: NotificationGroups[projectNotificationsGroup][1],
          disabled: NotificationGroups[projectNotificationsGroup].disabled,
        },
        notify_for_my_run_schedule: {
          value: NotificationGroups[projectNotificationsGroup][2],
          label: 'Notify me when my run is scheduled',
          name: NotificationGroups[projectNotificationsGroup][2],
          disabled: NotificationGroups[projectNotificationsGroup].disabled,
        },
        notify_for_org_run_schedule: {
          value: NotificationGroups[projectNotificationsGroup][3],
          label: 'Notify me when a run in my organization is scheduled',
          name: NotificationGroups[projectNotificationsGroup][3],
          disabled: NotificationGroups[projectNotificationsGroup].disabled,
        },
      },
    },
    {
      id: 2,
      title: 'Inventory',
      caption:
        'These are the notifications related to your Inventory, containers, resources',
      name: inventoryNotificationsGroup,
      checkboxOptions: {
        notify_for_stale_container: {
          value: NotificationGroups[inventoryNotificationsGroup][0],
          label: 'Notify me when a container is flagged as stale',
          name: NotificationGroups[inventoryNotificationsGroup][0],
          disabled: NotificationGroups[inventoryNotificationsGroup].disabled,
        },
      },
    },
    {
      id: 3,
      title: 'Shipment',
      caption:
        'These are the notifications related to shipmens, orders and kits',
      name: shipmentNotificationsGroup,
      checkboxOptions: {
        notify_for_my_intake_kit_shipped: {
          value: NotificationGroups[shipmentNotificationsGroup][0],
          label: 'Notify me when my intake kit is shipped',
          name: NotificationGroups[shipmentNotificationsGroup][0],
          disabled: NotificationGroups[shipmentNotificationsGroup].disabled,
        },
        notify_for_intake_kit_shipped: {
          value: NotificationGroups[shipmentNotificationsGroup][1],
          label: 'Notify me when an intake kit in my organization is shipped',
          name: NotificationGroups[shipmentNotificationsGroup][1],
          disabled: NotificationGroups[shipmentNotificationsGroup].disabled,
        },
        notify_for_my_shipment_checked_in: {
          value: NotificationGroups[shipmentNotificationsGroup][2],
          label: 'Notify me when my shipment is checked in',
          name: NotificationGroups[shipmentNotificationsGroup][2],
          disabled: NotificationGroups[shipmentNotificationsGroup].disabled,
        },
        notify_for_shipment_checked_in: {
          value: NotificationGroups[shipmentNotificationsGroup][3],
          label: 'Notify me when a shipment in my organization is checked in',
          name: NotificationGroups[shipmentNotificationsGroup][3],
          disabled: NotificationGroups[shipmentNotificationsGroup].disabled,
        },
      },
    },
  ]);

  const renderCheckboxGroup = (record) => {
    const name = record.get('name');
    const onNotifications = getValuesForNotificationGroup(name);
    return (
      <div className="notification-preferences__body">
        <InputsController
          values={onNotifications}
          inputChangeCallback={(state) => onCheckboxChange(state, name)}
        >
          <div className="notification-preferences__checkbox-group">
            <CheckboxGroup
              name={name}
              options={record.get('checkboxOptions').toJS()}
              value={onNotifications[name]}
            />
          </div>
        </InputsController>
      </div>
    );
  };

  const renderTitleAndCaption = (record) => {
    return (
      <div className="notification-preferences__head">
        <div className="notification-preferences__title-wrapper">
          <TextBody branded={false}>{record.get('title')}</TextBody>
          <TextDescription
            branded={false}
            color="secondary"
          >
            {record.get('caption')}
          </TextDescription>
        </div>
      </div>
    );
  };

  const renderToggleButtons = (record) => {
    const name = record.get('name');
    const toggleValue = NotificationGroups[name].disabled ? 'off' : 'on';
    return (
      <div className="notification-preferences__toggle-buttons">
        <Toggle
          name={`${name}-email-toggle`}
          value={toggleValue}
          size="small"
          label="Email"
          onChange={() => onChangeToggleButtons(name, toggleValue)}
        />
      </div>
    );
  };

  const onChangeToggleButtons = (name, toggleValue) => {
    props.onEmailToggleClicked(name, toggleValue === 'off' ? 'on' : 'off');
  };

  const getValuesForNotificationGroup = (name) => {
    const selectedNotificationTypes = NotificationGroups[name].filter(type => selectedCheckboxes.includes(type));
    const values = {};
    values[name] = selectedNotificationTypes;
    return values;
  };

  return (
    <div className="notification-preferences">
      <Table
        id={'notification-view-table'}
        renderExpandedRow={renderCheckboxGroup}
        tallRows
        disabledSelection
        disableBorder
        data={tableData}
        loaded
        onExpandRow={(
          record,
          willBeExpanded: boolean,
          expandedRows: Expanded
        ) => {
          setExpanded(expandedRows);
        }}
        expanded={expanded}
      >
        <Column key={`${uuidv4()}-title-caption`} renderCellContent={renderTitleAndCaption} />
        <Column key={`${uuidv4()}-toggle`} renderCellContent={renderToggleButtons} />
      </Table>
    </div>
  );
}

export default NotificationPreferences;
