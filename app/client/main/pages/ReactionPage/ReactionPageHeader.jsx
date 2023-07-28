import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import { Profile, Breadcrumbs, StatusPill, DateTime } from '@transcriptic/amino';
import { PageHeader } from 'main/components/PageLayout';
import Urls from 'main/util/urls';
import { Link } from 'react-router-dom';
import './ReactionPageHeader.scss';

const statusTextMap = {
  MATERIALS_UNRESOLVED: 'Materials Unresolved',
  MATERIALS_RESOLVED: 'Materials Resolved',
  SUBMITTED_WITH_ERRORS: 'Submitted With Errors',
  SUBMITTED: 'Submitted',
  RUN_CREATED: 'Run Created'
};

const statusTypeMap = {
  MATERIALS_UNRESOLVED: 'warning',
  MATERIALS_RESOLVED: 'primary',
  SUBMITTED_WITH_ERRORS: 'danger',
  SUBMITTED: 'primary',
  RUN_CREATED: 'success'
};

const submitSource = 'eln';

const getStatusType = (status) => {
  return statusTypeMap[status];
};

const getStatusText = (status) => {
  return statusTextMap[status];
};

const HeaderPrimary = (props) => {
  let status;
  if (props.status === 'SUBMITTED_WITH_ERRORS' || props.status === 'SUBMITTED' || props.status === 'RUN_CREATED') {
    status = props.status;
  } else if (props.materialsResolved) {
    status = 'MATERIALS_RESOLVED';
  } else {
    status = 'MATERIALS_UNRESOLVED';
  }

  return [
    <StatusPill
      key="status-pill-key"
      type={getStatusType(status)}
      text={getStatusText(status)}
    />,
    <Profile
      key="profile-key"
      name={props.user.name}
      imgSrc={props.user.profile_img_url}
    />,
    <span className="reaction-page-header__source" key="submission-src-key">
      Submitted via {submitSource} on&nbsp;
    </span>,
    <DateTime
      key="submission-time-key"
      timestamp={Moment.utc(props.timestamp).local()}
      format="absolute-format"
    />
  ];
};

const renderBreadcrumbs = (props) => {

  return (
    <Breadcrumbs>
      <Link to={Urls.projects()}>Projects</Link>
      <If condition={props.project && props.run}>
        <Link to={Urls.project(props.project.id)}>{props.project.name}</Link>
        <Link to={Urls.run(props.project.id, props.run.id)}>{props.run.title}</Link>
      </If>
      <If condition={!props.run && props.project}>
        <Link to={Urls.project(props.project.id)}>{props.project.name}</Link>
      </If>
    </Breadcrumbs>
  );
};

function ReactionPageHeader(props) {
  return (
    <PageHeader
      titleArea={renderBreadcrumbs(props)}
      primaryInfoArea={HeaderPrimary(props)}
    />
  );
}

ReactionPageHeader.propTypes = {
  status: PropTypes.string.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    profile_img_url: PropTypes.string
  }).isRequired,
  run: PropTypes.shape({
    title: PropTypes.string,
    id: PropTypes.string
  }),
  project: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.string
  }),
  timestamp: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string]).isRequired,  // timestamp or string
  materialsResolved: PropTypes.bool.isRequired
};

export default ReactionPageHeader;
