import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { NavLink } from 'react-router-dom';
import { Button } from '@transcriptic/amino';

import ContainerActions   from 'main/actions/ContainerActions';
import SearchResultsTable from 'main/components/PageWithSearchAndList/SearchResultsTable';
import ContainerRow       from 'main/inventory/components/SearchResultsTable/ContainerRow';
import HeaderRow          from 'main/inventory/components/SearchResultsTable/HeaderRow';
import ContainerStore     from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import Urls               from 'main/util/urls';
import AcsControls        from 'main/util/AcsControls';
import FeatureConstants   from '@strateos/features';

class CompoundInventory extends React.Component {
  static get propTypes() {
    return {
      id: PropTypes.string.isRequired
    };
  }

  static get contextTypes() {
    return {
      router: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    _.bindAll(
      this,
      'search',
      'headerRow',
      'resultRow',
      'onSearchFilterChange',
      'onSearchPageChange'
    );

    this.state = {
      containerIds: [],
      page: 1,
      perPage: 10,
      numPages: 1,
      loading: true,
      searchOptions: Immutable.Map({
        searchSortBy: 'updated_at',
        descending: true
      })
    };
  }

  componentDidMount() {
    this.search();
  }

  search() {
    const data = {
      query: this.props.id,
      search_fields: ['compound_link_ids'],
      ignore_score: true,
      page: this.state.page,
      sort_by: this.state.searchOptions.get('searchSortBy'),
      sort_desc: this.state.searchOptions.get('descending'),
      status: 'all_except_deleted'
    };

    ContainerActions.search(data)
      .done(resp => {
        const containerIds = resp.data.map(entity => entity.id);

        const total    = resp.meta.record_count;
        const numPages = Math.ceil(total / this.state.perPage);

        this.setState({ containerIds, numPages, loading: false });
      });
  }

  // refetch data if sort order or column type changes
  // expecting an Immutable object like:
  //   {searchSortBy: "id", descending: true}
  onSearchFilterChange(searchOptions) {
    this.setState({ loading: true, searchOptions }, () => {
      this.search();
    });
  }

  onSearchPageChange(page) {
    this.setState({ loading: true, page }, this.search);
  }

  getColumns() {
    const hasLabPermission = AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_CONTAINERS_IN_LAB);
    var allowedColumns = [
      'name', 'id', 'type', 'format', 'contents',
      'condition', 'created', 'last used', 'code', 'created by'
    ];
    if (hasLabPermission) {
      allowedColumns.push('organization');
    }
    return allowedColumns;
  }

  headerRow() {
    return (
      <HeaderRow
        key={'header-row'}
        allowedColumns={this.getColumns()}
        searchOptions={this.state.searchOptions}
        onSearchFilterChange={this.onSearchFilterChange}
      />
    );
  }

  resultRow(container) {
    const id            = container.get('id');
    const cTypeId       = container.get('container_type_id');
    const containerType = ContainerTypeStore.getById(cTypeId);
    const isTube        = containerType && containerType.get('is_tube');
    const url           = Urls.container(id);

    return (
      <ContainerRow
        key={id}
        container={container}
        allowedColumns={this.getColumns()}
        containerTypeId={cTypeId}
        isTube={isTube}
        isSelected={false}
        isSelectable={false}
        justCreated={false}
        selectionType="NONE"
        onViewDetailsClicked={(_result) => this.context.router.history.push(url)}
        onModal={this.props.onModal}
      />
    );
  }

  render() {
    const search = Immutable.fromJS({
      results: ContainerStore.getByIds(this.state.containerIds),
      page: this.state.page,
      per_page: this.state.perPage,
      num_pages: this.state.numPages,
      query: this.props.id
    });

    const linkButton = {
      subTitle: 'You can link existing inventory if you want.',
      button: (
        <NavLink to={Urls.samples()}>
          <Button type="primary" size="large">
            Link Inventory
          </Button>
        </NavLink>
      )
    };

    return (
      <div>
        <SearchResultsTable
          search={search}

          headerRow={this.headerRow}
          resultRow={this.resultRow}

          canAddTestSamples={false}
          findById={id => ContainerStore.getById(id)}
          showSpinner={this.state.loading}
          zeroStateProps={{
            title: "This compound isn't linked to any inventory yet!",
            ...(AcsControls.isFeatureEnabled(FeatureConstants.LINK_INVENTORY) && linkButton),
            hasBorder: false
          }}

          onSearchPageChange={this.onSearchPageChange}
        />
      </div>
    );
  }
}

export default CompoundInventory;
