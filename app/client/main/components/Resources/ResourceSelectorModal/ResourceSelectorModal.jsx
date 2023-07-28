import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import ResourceStore from 'main/stores/ResourceStore';
import { ResourceSelectorModalState, ResourceSelectorModalDefaults } from 'main/pages/ResourcesPage/ResourcesState';
import { ResourceSelectorModalActions } from 'main/pages/ResourcesPage/ResourcesSearchActions';
import ResourceSelector from '../ResourceSelector';

class ResourceSelectorModal extends React.Component {

  static get MODAL_ID() {
    return 'SEARCH_RESOURCE_MODAL';
  }

  constructor(props) {
    super(props);
    this.state = { disabled: true };

    _.bindAll(
      this,
      'onResourceSelected',
      'onSelectRow',
      'beforeDismiss'
    );
  }

  beforeDismiss() {
    this.setState({ disabled: true });
    ResourceSelectorModalActions.updateState({ ...ResourceSelectorModalDefaults, selected: [] });
  }

  onSelectRow(selectedRows) {
    this.setState({ disabled: _.size(_.keys(selectedRows)) === 0 }, () => {
      if (this.props.isSingleSelect && !this.state.disabled) {
        this.onResourceSelected();
      }
    });
  }

  onResourceSelected() {
    const { selected: selectedIds } = ResourceSelectorModalState.get();
    const selected = [];
    selectedIds.forEach((id) => {
      const resource = ResourceStore.getById(id);
      if (resource) {
        selected.push(resource);
      }
    });
    this.props.onResourceSelected(selectedIds, selected);
    this.beforeDismiss();
    ModalActions.close(ResourceSelectorModal.MODAL_ID);
  }

  render() {
    return (
      <SinglePaneModal
        modalId={ResourceSelectorModal.MODAL_ID}
        title={this.props.title}
        renderFooter={!this.props.isSingleSelect}
        acceptText="Select"
        onAccept={this.onResourceSelected}
        acceptBtnDisabled={this.state.disabled}
        beforeDismiss={this.beforeDismiss}
        modalSize="xlg"
      >
        <ResourceSelector
          onSelectRow={this.onSelectRow}
          visibleColumns={this.props.visibleColumns}
          disableCard
        />
      </SinglePaneModal>
    );
  }
}

ResourceSelectorModal.propTypes = {
  onResourceSelected: PropTypes.func.isRequired,
  title: PropTypes.string,
  isSingleSelect: PropTypes.bool,
  visibleColumns: PropTypes.instanceOf(Array)
};

ResourceSelectorModal.defaultProps = {
  title: 'Select Resource'
};

export default ResourceSelectorModal;
