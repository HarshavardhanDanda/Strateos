import React, { PureComponent } from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import Classnames from 'classnames';

function UnsortableHeader({ name, canShow }) {
  return (
    <If condition={canShow}>
      <div
        className={Classnames(
          'container-row-spacing__container-content',
          'container-row-spacing__column',
          'desc',
          'search-results-table__unsortable-header'
        )}
      >
        {name}
      </div>
    </If>
  );
}

UnsortableHeader.propTypes = {
  name: PropTypes.string,
  canShow: PropTypes.bool
};

function Header({
  canShow,
  className,
  onSearchSortChange,
  displayName,
  sortBy,
  sortName,
  descending,
  unsortable
}) {
  if (unsortable) {
    return <UnsortableHeader canShow={canShow} name={displayName} />;
  }

  const icon = descending ? 'up' : 'down';

  return (
    <If condition={canShow}>
      <div
        className={Classnames(
          `container-row-spacing__${className}`,
          'container-row-spacing__column',
          'desc',
          'icon-sort',
          `icon-sort__${icon}`
        )}
        onClick={() => {
          onSearchSortChange(
            sortName,
            sortBy === sortName ? !descending : true
          );
        }}
      >
        <span>{displayName} </span>
        <If condition={sortBy === sortName}>
          <Choose>
            <When condition={descending}>
              <i className="fa fa-sort-up" />
            </When>
            <Otherwise>
              <i className="fa fa-sort-down" />
            </Otherwise>
          </Choose>
        </If>
      </div>
    </If>
  );
}

Header.propTypes = {
  unsortable: PropTypes.bool,
  displayName: PropTypes.string,
  className: PropTypes.string.isRequired,
  sortBy: PropTypes.string.isRequired,
  sortName: PropTypes.string.isRequired,
  descending: PropTypes.bool,
  onSearchSortChange: PropTypes.func.isRequired,
  canShow: PropTypes.bool
};

class HeaderRow extends PureComponent {
  static get propTypes() {
    return {
      onSearchFilterChange: PropTypes.func,
      searchOptions: PropTypes.instanceOf(Immutable.Map),
      allowedColumns: PropTypes.arrayOf(PropTypes.string)
    };
  }

  static get defaultProps() {
    return {
      searchOptions: Immutable.Map({ searchSortBy: 'updated_at', descending: false }),
      allowedColumns: [
        'svg',
        'name',
        'clogp',
        'smiles',
        'formula',
        'molecular_weight',
        'tpsa'
      ]
    };
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
        <Header displayName="Image" canShow={this.canShowColumn('svg')} unsortable />
        <Header
          displayName="Name"
          sortName="name"
          canShow={this.canShowColumn('name')}
          sortBy={this.props.searchOptions.get('searchSortBy')}
          className="name"
          descending={this.props.searchOptions.get('descending')}
          onSearchSortChange={(...args) => this.onSearchSortChange(...args)}
        />
        <Header
          displayName="cLogP"
          sortName="clogp"
          canShow={this.canShowColumn('clogp')}
          sortBy={this.props.searchOptions.get('searchSortBy')}
          className="clogp"
          descending={this.props.searchOptions.get('descending')}
          onSearchSortChange={(...args) => this.onSearchSortChange(...args)}
        />
        <Header displayName="2D Structure" canShow={this.canShowColumn('smiles')} unsortable />
        <Header displayName="Chemical Formula" canShow={this.canShowColumn('formula')} unsortable />
        <Header
          displayName="Molecular weight (MW)"
          sortName="clogp"
          canShow={this.canShowColumn('clogp')}
          sortBy={this.props.searchOptions.get('searchSortBy')}
          className="clogp"
          descending={this.props.searchOptions.get('descending')}
          onSearchSortChange={(...args) => this.onSearchSortChange(...args)}
        />
        <Header
          displayName="Total Polar Suface Area (TPSA)"
          sortName="tpsa"
          canShow={this.canShowColumn('tpsa')}
          sortBy={this.props.searchOptions.get('searchSortBy')}
          className="tpsa"
          descending={this.props.searchOptions.get('descending')}
          onSearchSortChange={(...args) => this.onSearchSortChange(...args)}
        />
      </div>
    );
  }
}

export default HeaderRow;
