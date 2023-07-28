import React, { PureComponent } from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import Classnames from 'classnames';
import FeatureConstants   from '@strateos/features';
import AcsControls        from 'main/util/AcsControls';

class SortableContainerRowHeader extends PureComponent {
  static get propTypes() {
    return {
      displayName:        PropTypes.string,
      className:          PropTypes.string.isRequired,
      sortBy:             PropTypes.string.isRequired,
      sortName:           PropTypes.string.isRequired,
      descending:         PropTypes.bool,
      onSearchSortChange: PropTypes.func.isRequired
    };
  }

  render() {
    const icon = this.props.descending ? 'up' : 'down';
    return (
      <div
        className={`
          container-row-spacing__${this.props.className}
          container-row-spacing__column
          search-results-table__sortable-header
          desc
          icon-sort
          icon-sort__${icon}
        `}
        onClick={() => {
          const descending = this.props.sortBy === this.props.sortName ? !this.props.descending : true;
          this.props.onSearchSortChange(this.props.sortName, descending);
        }}
      >
        <span>{this.props.displayName}</span>
        {this.props.sortBy === this.props.sortName && (
          this.props.descending ? <i className="fa fa-sort-up" /> : <i className="fa fa-sort-down" />
        )}
      </div>
    );
  }
}

class HeaderRow extends PureComponent {
  static get propTypes() {
    return {
      onSearchFilterChange: PropTypes.func,
      searchOptions:        PropTypes.instanceOf(Immutable.Map),
      allowedColumns:       PropTypes.arrayOf(PropTypes.string)
    };
  }

  static get defaultProps() {
    return {
      searchOptions: Immutable.Map({ searchSortBy: 'updated_at', descending: false }),
      allowedColumns: [
        'checkbox',
        'name',
        'id',
        'type',
        'format',
        'contents',
        'condition',
        'created',
        'last used',
        'code',
        'created by'
      ]
    };
  }

  constructor(props) {
    super(props);

    this.onSearchSortChange = this.onSearchSortChange.bind(this);
  }

  onSearchSortChange(sortName, descending) {
    let searchOptions;
    searchOptions = this.props.searchOptions.set('searchSortBy', sortName);
    searchOptions = searchOptions.set('descending', descending);

    return this.props.onSearchFilterChange(searchOptions);
  }

  canShowColumn(column) {
    return this.props.allowedColumns.indexOf(column) !== -1;
  }

  render() {
    return (
      <div className="search-results-table__header-row container-row-spacing">
        { this.canShowColumn('checkbox') &&
          <div className="container-row-spacing__icon container-row-spacing__column" />
        }
        { this.canShowColumn('type') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="is_tube"
            className="icon"
            displayName="Type"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('name') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="label"
            className="name"
            displayName="Name"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('id') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="id"
            className="container-id"
            displayName="Id"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('format') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="container_type_id"
            className="container-type"
            displayName="Format"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('contents') && (
          <div
            className={Classnames(
              'container-row-spacing__container-content',
              'container-row-spacing__column',
              'desc',
              'search-results-table__unsortable-header'
            )}
          >
            Contents
          </div>
        )}

        { this.canShowColumn('condition') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="storage_condition"
            className="condition"
            displayName="Condition"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('created') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="created_at"
            className="created-at"
            displayName="Created"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('last used') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="updated_at"
            className="last-used"
            displayName="Last Used"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('code') && (
          <div
            className={Classnames(
              'container-row-spacing__container-code',
              'container-row-spacing__column',
              'desc',
              'search-results-table__unsortable-header'
            )}
          >
            Code
          </div>
        )}

        { this.canShowColumn('organization') && AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB) && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="organization_name"
            className="organization-name"
            displayName="Organization"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}

        { this.canShowColumn('created by') && (
          <SortableContainerRowHeader
            sortBy={this.props.searchOptions.get('searchSortBy')}
            sortName="created_by"
            className="created-by"
            displayName="Created By"
            descending={this.props.searchOptions.get('descending')}
            onSearchSortChange={this.onSearchSortChange}
          />
        )}
      </div>
    );
  }
}

export default HeaderRow;
