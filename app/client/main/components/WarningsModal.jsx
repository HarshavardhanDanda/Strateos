import PropTypes from 'prop-types';
import React     from 'react';
import moment    from 'moment';

import { SinglePaneModal } from 'main/components/Modal';
import TimeConstraint from 'main/components/TimeConstraint';

function TimeConstraintWarning({ runId, warnings }) {
  const description =
    (
      <span>
        Time constraints whose timing points are not both in the sub run can not
        be enforced by the system. <strong>This risks violating the protocol</strong>.
        The below time constraints will not be enforced.
      </span>
    );

  const getTimeConstraintKey = (timeConstraint, index) => {
    const time = timeConstraint.more_than || timeConstraint.less_than || timeConstraint.ideal.value;
    return `${time}-${index}`;
  };

  return (
    <Warning title="Time Constraint Warning" description={description}>
      {warnings.map((warning, index) =>
        <TimeConstraint key={getTimeConstraintKey(warning, index)} runId={runId} timeConstraint={warning} />
      )}
    </Warning>
  );
}

TimeConstraintWarning.propTypes = {
  runId: PropTypes.string.isRequired,
  warnings: PropTypes.arrayOf(PropTypes.shape({
    from: PropTypes.object,
    to: PropTypes.object
  }).isRequired)
};

function RecentlyScheduledWarning({ warnings }) {
  const timeAgo = moment(warnings).fromNow();

  const description = (
    <span>This run has already been submitted {timeAgo}. Are you sure you want to continue?</span>
  );

  return (
    <Warning title="Run was recently scheduled" description={description} />
  );
}

RecentlyScheduledWarning.propTypes = {
  warnings: PropTypes.string.isRequired
};

// Mapping of warning to component
const warningComponent = {
  time_constraint: TimeConstraintWarning,
  recently_scheduled: RecentlyScheduledWarning
};

// currently we only have time constraint warnings
const propTypes = {
  runId:    PropTypes.string.isRequired,
  onAccept: PropTypes.func.isRequired,
  warnings: PropTypes.shape({
    time_constraint: PropTypes.arrayOf(PropTypes.shape({
      from: PropTypes.object,
      to: PropTypes.object
    })),
    recently_scheduled: PropTypes.string
  })
};

function WarningsModal({ runId, onAccept, warnings }) {
  return (
    <SinglePaneModal
      modalId="WarningsModal"
      title="Warning"
      onAccept={onAccept}
      acceptText="Continue"
    >
      <div className="alert alert-danger" role="alert">
        <strong>Warning! </strong>
        This run has generated warnings. Please confirm you would like to proceed.
      </div>
      {Object.keys(warnings).map((warningType) => {
        const WarningComponent = warningComponent[warningType];
        const typeWarnings     = warnings[warningType];
        return (
          <WarningComponent key={warningType} warnings={typeWarnings} runId={runId} />
        );
      })}
    </SinglePaneModal>
  );
}

WarningsModal.propTypes = propTypes;

// THE BELOW ARE PRIVATE -- USED INTERNALLY BY WARNINGS MODAL

// Generic Warning Template
function Warning({ title, description, children }) {
  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <strong className="panel-title">{title}</strong>
      </div>
      <div className="panel-body">
        <div className="alert alert-danger" role="alert">{description}</div>
        {children}
      </div>
    </div>
  );
}

Warning.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired
};

export default WarningsModal;
