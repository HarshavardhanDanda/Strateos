import PropTypes from 'prop-types';
import React     from 'react';

import Urls                     from 'main/util/urls';
import RunStore                 from 'main/stores/RunStore';
import ProjectStore             from 'main/stores/ProjectStore';
import RunActions               from 'main/actions/RunActions';
import ProjectActions           from 'main/actions/ProjectActions';
import TransferModal            from './TransferModal';

const getRunName = (id) => {
  const run = RunStore.getById(id);
  return run.get('title') || `Run ${id}`;
};

const searchProjects = (value) => {
  const subdomain = Urls.organization().slice(1);
  return ProjectActions.search(subdomain, { query: value, per_page: 5 })
    .then(response => response.results.map(project => project.name));
};

function RunTransferModal(props) {
  const runNames = props.selection.map(getRunName).join(', ');
  return (
    <TransferModal
      modalId="RunTransferModal"
      type="run"
      entity="Project"
      selectionDescription={runNames}
      onSearch={searchProjects}
      onTransfer={(name) => {
        const id = ProjectStore.findByName(name).get('id');
        return (
          RunActions.multiTransfer(props.selection, id).then(() => {
            ProjectActions.load(id);
            ProjectActions.load(props.sourceProjectId);
            props.onTransfer();
          }));
      }}
      receivingId={undefined}
    />
  );
}

RunTransferModal.propTypes = {
  selection:  PropTypes.arrayOf(PropTypes.string),
  sourceProjectId: PropTypes.string,

  // PropType is used, react/eslint bug
  // eslint-disable-next-line react/no-unused-prop-types
  onTransfer: PropTypes.func
};

RunTransferModal.defaultProps = {
  onTransfer() {}
};

export default RunTransferModal;
