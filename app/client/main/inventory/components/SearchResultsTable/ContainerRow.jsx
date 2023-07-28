import Immutable                  from 'immutable';
import PropTypes                  from 'prop-types';
import React, { PureComponent }   from 'react';
import classNames from 'classnames';
import ContainerRowCard from 'main/components/ContainerRowCard';

import 'main/components/PageWithSearchAndList/SearchResultsTable.scss';

class ContainerRow extends PureComponent {
  render() {
    return (
      <div className={classNames(
        'search-results-table__container-row',
        { 'search-results-table__container-row--clickable': !this.props.onModal }
      )}
      >
        <ContainerRowCard
          className={this.props.className}
          container={this.props.container}
          allowedColumns={this.props.allowedColumns}
          containerTypeId={this.props.containerTypeId}
          isTube={this.props.isTube}
          justCreated={this.props.justCreated}
          onViewDetailsClicked={this.props.onViewDetailsClicked}
          shipment={this.props.shipment}
          isSelected={this.props.isSelected}
          isSelectable={this.props.isSelectable}
          onContainerSelected={this.props.onContainerSelected}
          onAllWellsSelected={this.props.onAllWellsSelected}
          selectionType={this.props.selectionType}
          onModal={this.props.onModal}
        />
      </div>
    );
  }
}

ContainerRow.propTypes = {
  className:            PropTypes.string,
  container:            PropTypes.instanceOf(Immutable.Map),
  containerTypeId:      PropTypes.string.isRequired,
  isTube:               PropTypes.bool,
  shipment:             PropTypes.instanceOf(Immutable.Map),
  onViewDetailsClicked: PropTypes.func,
  justCreated:          PropTypes.bool,
  isSelected:           PropTypes.bool,
  isSelectable:         PropTypes.bool,
  onContainerSelected:  PropTypes.func,
  selectionType:        PropTypes.string,
  onAllWellsSelected:   PropTypes.func,
  allowedColumns:       PropTypes.arrayOf(PropTypes.string)
};

export default ContainerRow;
