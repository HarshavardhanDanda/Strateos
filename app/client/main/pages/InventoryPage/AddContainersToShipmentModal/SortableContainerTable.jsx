import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import ContainerRowCard   from 'main/components/ContainerRowCard';
import HeaderRow          from 'main/inventory/components/SearchResultsTable/HeaderRow';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

class SortableContainerTable extends React.Component {
  static get propTypes() {
    return {
      containers: PropTypes.arrayOf(Immutable.Map).isRequired,
      alertTexts: PropTypes.object
    };
  }

  static get defaultState() {
    return {
      searchOptions: HeaderRow.defaultProps.searchOptions
    };
  }

  constructor(props, context) {
    super(props, context);

    this.onSearchFilterChange = this.onSearchFilterChange.bind(this);

    this.state = SortableContainerTable.defaultState;
  }

  onSearchFilterChange(searchOptions) {
    this.setState({ searchOptions });
  }

  resetState() {
    this.setState(SortableContainerTable.defaultState);
  }

  sortedContainers() {
    const sortBy = this.state.searchOptions.get('searchSortBy', 'last used');
    const desc   = this.state.searchOptions.get('descending', false);

    // The sort field is not always the same as the container attribute
    let sortAttribute;
    if (sortBy === 'last used') {
      sortAttribute = 'updated_at';
    } else {
      sortAttribute = sortBy;
    }

    const results = _.sortBy(this.props.containers, c => c.get(sortAttribute));

    return desc ? _.reverse(results) : results;
  }

  render() {
    const containers = this.sortedContainers();

    return (
      <div className="tx-stack__block--xxlg">

        <HeaderRow
          searchOptions={this.state.searchOptions}
          onSearchFilterChange={this.onSearchFilterChange}
          allowedColumns={['name', 'id', 'type', 'contents', 'last used']}
        />

        <div className="tx-stack">
          {containers.map((container) => {
            const id            = container.get('id');
            const cTypeId       = container.get('container_type_id');
            const containerType = ContainerTypeStore.getById(cTypeId);
            const isTube        = containerType && containerType.get('is_tube');
            const alertText     = (this.props.alertTexts || {})[id];

            return (
              <ContainerRowCard
                key={id}
                className="tx-stack__block--md"
                containerTypeId={cTypeId}
                container={container}
                onViewDetailsClicked={(_container) => { /* do nothing */ }}
                isTube={isTube}
                allowedColumns={['name', 'id', 'type', 'contents', 'last used']}
                alertText={alertText}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

export default SortableContainerTable;
