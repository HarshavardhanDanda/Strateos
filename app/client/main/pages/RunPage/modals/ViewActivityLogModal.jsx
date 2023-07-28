import React, { useState } from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import {
  Table,
  Column,
  Button,
  StatusPill,
  Profile,
  Tooltip,
} from '@transcriptic/amino';

import ModalActions from 'main/actions/ModalActions';
import UserActions from 'main/actions/UserActions';
import AuditActions from 'main/actions/AuditActions';
import DatasetActions from 'main/actions/DatasetActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import { SinglePaneModal } from 'main/components/Modal';
import './ViewActivityLogModal.scss';
import DatasetStore from 'main/stores/DatasetStore';
import AuditStore from 'main/stores/AuditStore';

function ViewActivityLogModal({ runId }) {

  const [fileActivities, setFileActivities] = useState([]);
  const [users, setUsers] = useState({});
  const [loaded, setLoaded] = useState(false);

  const onOpenModal = async () => {
    await AuditActions.loadAll({ filters: { associated_id: runId }, limit: 12 });
    const audits = AuditStore.getAll().toJS();
    const datasetIds = _.uniq(audits.map(audit => audit.auditable_id));
    await DatasetActions.loadAll(datasetIds);
    setFileActivities(audits);
    setLoaded(true);
    const users = await getUsers();
    setUsers(users);
  };

  const getUsers = async () => {
    const userIds = await AccessControlActions.loadPermissions({});
    const filteredUserIds = _.uniqBy(userIds, 'userId');
    const allUsers = await UserActions.loadUsers(_.map(filteredUserIds, 'userId'));
    const filteredUsers = _.uniqBy(allUsers, 'name');
    const result = filteredUsers.reduce((users, user) => {
      return { ...users, [user.id]: user.name };
    }, {});
    return result;
  };

  const onSortChange = (id, directions) => {
    const sortedData = _.sortBy(fileActivities, [id]);
    const result = directions === 'asc' ? sortedData : sortedData.reverse();
    setFileActivities(result);
  };

  const renderFileName = (activity) => {
    const dataset = DatasetStore.getById(activity.get('auditable_id')).toJS();
    const fileName = dataset.title || activity.get('id');
    return (
      <Tooltip
        placement="bottom"
        title={fileName}
      >
        <p>
          {fileName}
        </p>
      </Tooltip>
    );
  };

  const renderId = (activity) => {
    const id = activity.get('id');
    return (
      <Tooltip
        placement="bottom"
        title={id}
      >
        <p>
          {id}
        </p>
      </Tooltip>
    );
  };

  const renderDataType = (activity) => {
    const dataset = DatasetStore.getById(activity.get('auditable_id')).toJS();
    const dataType = dataset.is_analysis ? 'Analysis' : 'Measurement';
    return (
      <Tooltip
        placement="bottom"
        title={dataType}
      >
        <p>
          {dataType}
        </p>
      </Tooltip>
    );
  };

  const renderSize = (activity) => {
    const dataset = DatasetStore.getById(activity.get('auditable_id')).toJS();
    const size = dataset.metadata.size;
    return (
      <Tooltip
        placement="bottom"
        title={size}
      >
        <p>
          {size}
        </p>
      </Tooltip>
    );
  };

  const renderActivity = (activity) => {
    const type = (activity.get('action') === 'create' || activity.get('action') === 'update') ? 'action' : 'danger';
    const text = (activity.get('action') === 'create' || activity.get('action') === 'update') ? 'Uploaded file' : 'Deleted';
    return (
      <Tooltip
        placement="bottom"
        title={text}
      >
        <StatusPill
          type={type}
          text={text}
          shape="tag"
        />
      </Tooltip>
    );
  };

  const renderDate = (activity) => {
    const date = moment(activity.get('date')).format('L');
    return (
      <Tooltip
        placement="bottom"
        title={date}
      >
        <p>
          {date}
        </p>
      </Tooltip>
    );
  };

  const getNote = (comment) => {
    switch (comment) {
      case 'incorrect':
        return 'Attached data is incorrect';
      case 'outdated':
        return 'Analysis is outdated';
      case 'unnecessary':
        return 'Dataset is no longer needed';
      case 'wrong_dataset':
        return 'Wrong dataset was uploaded to an instruction';
      case 'incomplete':
        return 'Incomplete dataset was uploaded';
      case 'incorrect_format':
        return 'Dataset had a wrong format';
      case 'required_correction':
        return 'Dataset required manual review and correction';
      default:
        return comment;
    }
  };

  const renderNote = (activity) => {
    const comment = activity.get('comment');
    const note = getNote(comment);
    return (
      <Tooltip
        placement="bottom"
        title={note}
      >
        <p>
          {note}
        </p>
      </Tooltip>
    );
  };

  const renderProfile = (activity) => {
    return <Profile name={users[activity.get('user_id')]} />;
  };

  return (
    <SinglePaneModal
      modalId="VIEW_ACTIVITY_LOG_MODAL"
      title="File Activity Log"
      modalBodyClass="view-activity-log-modal"
      modalSize="xlg"
      onOpen={() => onOpenModal()}
    >
      <div className="view-activity-log__content">
        <Table
          data={Immutable.fromJS(fileActivities)}
          loaded={loaded}
          disableCard
          disabledSelection
          disableBorder
          popoverOnHeader
          id="file-activity-log"
        >
          <Column
            renderCellContent={renderFileName}
            header="File name"
            id="title"
          />
          <Column
            renderCellContent={renderId}
            header="Id"
            id="id"
          />
          <Column
            renderCellContent={renderDataType}
            header="Data type"
            id="is_analysis"
            sortable
            onSortChange={onSortChange}
          />
          <Column
            renderCellContent={renderSize}
            header="Size"
            id="size"
          />
          <Column
            renderCellContent={renderActivity}
            header="Activity"
            id="activity"
          />
          <Column
            renderCellContent={renderDate}
            header="Date"
            id="date"
            sortable
            onSortChange={onSortChange}
          />
          <Column
            renderCellContent={renderNote}
            header="Notes"
            id="note"
          />
          <Column
            renderCellContent={renderProfile}
            header="User"
            id="user_id"
          />
        </Table>
        <Button
          type="secondary"
          size="small"
          className="view-activity-log__button"
          onClick={() => ModalActions.close('VIEW_ACTIVITY_LOG_MODAL')}
        >
          Close
        </Button>
      </div>
    </SinglePaneModal>
  );
}

export default ViewActivityLogModal;
