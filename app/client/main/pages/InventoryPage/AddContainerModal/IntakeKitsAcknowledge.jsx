import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import SessionStore from 'main/stores/SessionStore';
import AcknowledgeContainers  from 'main/components/AcknowledgeContainers';

function IntakeKitsAcknowledge(props) {
  const canAddTestMode =
    SessionStore.isDeveloper() ||
    SessionStore.isAdmin();

  const newProps = _.extend({}, props, {
    onSetTestMode: canAddTestMode ? props.onSetTestMode : undefined
  });
  return (
    <div className="intake-kits-acknowledge">
      <AcknowledgeContainers {...newProps} />
    </div>
  );
}

IntakeKitsAcknowledge.propTypes = {
  onSetTestMode: PropTypes.func,
  onDismiss: PropTypes.func,
  labOperatorName: PropTypes.string
};

export default IntakeKitsAcknowledge;
