import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import { Page, GriddleTable } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import ConnectToStores      from 'main/containers/ConnectToStoresHOC';
import ContainerTypeStore   from 'main/stores/ContainerTypeStore';

import { CreateContainerTypeButton } from './CreateContainerType';
import './ContainerTypesPage.scss';

class ContainerTypesPage extends React.Component {
  static get propTypes() {
    return {
      containerTypes: PropTypes.instanceOf(Immutable.Iterable)
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      statusCode: undefined
    };
  }

  componentDidMount() {
    ContainerTypeActions.loadAll()
      .fail(xhr => this.setState({ statusCode: xhr.status }));
  }

  // eslint-disable-next-line class-methods-use-this
  componentDidUpdate() {
    // mimic the browsers scrollTo functionality
    // TODO: This would be a nice to have in the Page component. This could be fleshed out with
    // nice scrolling instead of jumping as well.
    const el = document.getElementById(window.location.hash.substring(1));

    if (el) {
      el.scrollIntoView();
    }
  }

  griddleColumns() {
    const columns = [
      { columnName: 'id', type: 'Id' },
      { columnName: 'vendor', type: 'Text', displayName: 'Vendor' },
      { columnName: 'catalog_number',  type: 'Text', displayName: 'Catalog Number' },
      { columnName: 'name',            type: 'Text', cssClassName: 'wrapped-col', displayName: 'Name' },
      { columnName: 'retired_at',      type: 'Time', displayName: 'Retired At' },
      { columnName: 'well_count',      type: 'Text', displayName: 'Well Count' },
      { columnName: 'well_depth_mm',   type: 'Text', displayName: 'Well Depth (mm)' },
      { columnName: 'height_mm',       type: 'Text', displayName: 'Height (mm)' },
      { columnName: 'well_volume_ul',  type: 'Text', displayName: 'Well Volume (ul)' },
      { columnName: 'col_count',       type: 'Text', displayName: 'Column Count' },
      { columnName: 'capabilities',    type: 'List', sortable: false, cssClassName: 'wrapped-col', displayName: 'Capabilities' },
      { columnName: 'acceptable_lids', type: 'List', sortable: false, cssClassName: 'wrapped-col', displayName: 'Acceptable Lids' },
      { columnName: 'sale_price',      type: 'DollarAmount', displayName: 'Sale Price' }
    ];

    return columns;
  }

  render() {
    return (
      <Page title="Container Types" statusCode={this.state.statusCode}>
        <div className="section container-types-page">
          <h3 className="section-title">Container Types</h3>
          <CreateContainerTypeButton />
          <GriddleTable
            tableTypes={BaseTableTypes}
            results={this.props.containerTypes.toJS()}
            resultsPerPage={this.props.containerTypes.size}
            showPager={false}
            columns={this.griddleColumns()}
          />
        </div>
      </Page>
    );
  }
}

const getStateFromStores = () => {
  return {
    containerTypes: ContainerTypeStore.getAll()
  };
};

export default ConnectToStores(ContainerTypesPage, getStateFromStores);
