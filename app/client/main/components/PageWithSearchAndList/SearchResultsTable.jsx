import React, { PureComponent } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Pagination, Spinner, ZeroState } from '@transcriptic/amino';

import { InventorySearchDefaults } from 'main/inventory/inventory/InventoryState';

import 'main/components/ContainerRowCard/ContainerRowSpacing.scss';

class SearchResultsTable extends PureComponent {
  static get propTypes() {
    return {
      search: PropTypes.instanceOf(Immutable.Map).isRequired,
      onSearchPageChange: PropTypes.func,
      searchOptions: PropTypes.instanceOf(Immutable.Map),
      onSearchFilterChange: PropTypes.func,
      showSpinner: PropTypes.bool,
      headerRow: PropTypes.func,
      resultRow: PropTypes.func,
      zeroStateProps: PropTypes.object,
      findById: PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      showAddContainerChoice: true,
      showSpinner: true,
      searchOptions: Immutable.Map()
    };
  }

  constructor() {
    super();

    _.bindAll(
      this,
      'onSearchDestroyed',
      'page',
      'perPage',
      'numPages',
      'query',
      'records',
      'isDefaultSearch'
    );
  }

  onSearchDestroyed() {
    return this.props.onSearchFilterChange(
      this.props.searchOptions.set('searchStatus', 'destroyed')
    );
  }

  page() {
    return this.props.search.get('page', 1);
  }

  perPage() {
    return this.props.search.get('per_page', 9);
  }

  numPages() {
    return this.props.search.get('num_pages', 1);
  }

  query() {
    return this.props.search.get('query', '*');
  }

  records() {
    return this.props.search
      .get('results', Immutable.List())
      .map((result) => {
        return this.props.findById(result.get('id'));
      })
      .filter(result => result);
  }

  isDefaultSearch() {
    return _.isEqual(this.props.searchOptions.toJS(), InventorySearchDefaults);
  }

  render() {
    const results = this.props.search.get('results');
    const records = this.records();
    const numRecords = records.count();
    const spinnerShowing = results == undefined || this.props.showSpinner;

    return (
      <div className="search-results-table">
        <Choose>
          <When condition={spinnerShowing}>
            <div className="spinner-container">
              <Spinner />
            </div>
          </When>
          <Otherwise>
            <div className="search-results-table__table">
              <If condition={numRecords > 0}>
                {this.props.headerRow()}
                {records.map(record => this.props.resultRow(record))}
              </If>
              <If condition={numRecords === 0}>
                <div className="search-results-table__not-found">
                  <Choose>
                    <When
                      condition={
                        this.props.searchOptions.get('searchStatus') === 'available'
                      }
                    >
                      <span className="search-results-table__empty-inventory-message">
                        {"Didn't find what you were looking for? Try checking "}
                        <a onClick={this.onSearchDestroyed}>destroyed</a>
                        {' containers.'}

                      </span>
                    </When>

                    <Otherwise>
                      <ZeroState
                        hasBorder
                        {...this.props.zeroStateProps}
                      />
                    </Otherwise>
                  </Choose>
                </div>
              </If>
            </div>
          </Otherwise>
        </Choose>
        <If condition={this.numPages() > 1}>
          <div
            className={classNames(
              'paginated-footer',
              'search-results-table__pagination',
              { 'search-results-table__spinner-showing': spinnerShowing }
            )}
          >
            <Pagination
              page={this.page()}
              pageWidth={10}
              numPages={this.numPages()}
              onPageChange={this.props.onSearchPageChange}
            />
          </div>
        </If>
      </div>
    );
  }
}

export default SearchResultsTable;
