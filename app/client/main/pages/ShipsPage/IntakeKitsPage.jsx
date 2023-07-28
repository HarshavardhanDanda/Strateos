import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Button, Column, List, Select, StatusPill, TopFilterBar } from '@transcriptic/amino';

import { IntakeKitSearchStore } from 'main/stores/search';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import BaseTableTypes from 'main/components/BaseTableTypes';
import FeatureConstants from '@strateos/features';
import FeatureStore from 'main/stores/FeatureStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import Urls from 'main/util/urls';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import { IntakeKitsLabSearchActions } from './IntakeKitsSearchActions';
import { IntakeKitsLabPageStateDefaults, IntakeKitsLabPageState } from './IntakeKitsSearchState';

export class IntakeKitsPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    _.bindAll(this,
      'onSearchFilterChange',
      'load',
      'onPageChange',
      'onChangeSelection',
      'onSortChange',
      'page',
      'numPages',
      'pageSize',
      'onSearchFailed',
      'onResetClicked',
      'onRowClick'
    );

    this.state = {
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      visibleColumns: [
        'organization',
        'easy post label url',
        'payment',
        'requested',
        'item count',
        'processed',
        'status'
      ],
      statuses: [
        { name: 'Pending', value: 'pending' },
        { name: 'Delivered', value: 'delivered' },
        { name: 'Pre transit', value: 'pre_transit' },
        { name: 'Return to sender', value: 'return_to_sender' }
      ]
    };
  }

  componentDidMount() {
    this.load();
  }

  // Selecting one of the search option dropdowns
  onSearchFilterChange(options) {
    this.props.actions.onSearchFilterChange(this.onSearchFailed, options);
  }

  onSearchFailed(xhr) {
    this.setState({ statusCode: xhr.status });
  }

  page() {
    return this.props.search.get('page', 1);
  }

  numPages() {
    return this.props.search.get('num_pages', 1);
  }

  pageSize() {
    return this.props.search.get('per_page', 1);
  }

  onResetClicked() {
    this.load();
  }

  load() {
    const { lab_id } = this.props;
    this.onSearchFilterChange({
      ...IntakeKitsLabPageStateDefaults,
      lab_id
    });
  }

  onPageChange(requestedPage, pageSize) {
    if (requestedPage !== this.page()) {
      this.props.actions.onSearchPageChange(this.onSearchFailed, requestedPage);
    }

    if (pageSize !== this.pageSize()) {
      this.onSearchFilterChange({ searchPerPage: pageSize });
    }
  }

  onSortChange(sortKey, sortDirection) {
    this.props.actions.onSortOptionChange(
      this.onSearchFailed,
      sortKey,
      sortDirection
    );
  }

  onChangeSelection(selectedColumns) {
    this.setState({ visibleColumns: selectedColumns });
  }

  onRowClick(result) {
    this.props.history.push(
      Urls.lab_intake_kit(result.get('id'))
    );
  }

  renderTextRecord(record, column) {
    const statusType = Immutable.Map([
      ['pending', 'warning'],
      ['return_to_sender', 'danger'],
      ['pre_transit', 'action'],
      ['delivered', 'success']
    ]);

    if (column == 'status') {
      const col = record.get(column);
      const status = this.state.statuses.find(status => status.value === col);
      const renderStatus = (
        <StatusPill
          type={status && status.value ? statusType.get(status.value) : 'primary'}
          shape="tag"
          text={status ? status.name : ''}
        />
      );
      return (
        renderStatus
      );
    }
    if (column == 'organization' || column == 'lab') {
      return <p> {record.get(column).get('name')} </p>;
    }
    return <p>{record.get(column)}</p>;
  }

  renderUrlRecord(record, column) {
    const container = record.get(column).toJS();
    return <BaseTableTypes.Url data={container} openInNewTab />;
  }

  renderPayment(record, column) {
    const invoiceItem = record.get(column);
    if (invoiceItem) {
      return (
        <StatusPill
          type="success"
          shape="tag"
          text={'Paid'}
        />
      );
    }
    return <BaseTableTypes.Url data={invoiceItem} />;
  }

  renderTimeRecord(record, column) {
    return <BaseTableTypes.Time data={record.get(column)} />;
  }

  render() {
    const defaultStatus = 'Order Status';
    return (
      <div className="tx-stack tx-stack--sm intake-kits-page">
        <div className="tx-inline tx-inline--sm">
          <a
            className="tx-inline tx-inline--xxxs"
            href="https://work.r23s.net/w/wetlab/sending-a-shipping-kit-to-the-customer/"
          >
            <i className="far fa-question-circle" />
            <span>Directions</span>
          </a>
        </div>
        <div>
          <div className="intake-kit-filters">
            <TopFilterBar>
              <TopFilterBar.Wrapper>
                <Select
                  placeholder={defaultStatus}
                  options={this.state.statuses}
                  value={this.props.status}
                  onChange={(e) => {
                    const status = e.target.value;
                    this.onSearchFilterChange({
                      status
                    });
                  }}
                />
              </TopFilterBar.Wrapper>
              <TopFilterBar.Wrapper grow={false}>
                <Button
                  type="secondary"
                  active={this.props.status}
                  size="small"
                  dropshadow
                  noPadding
                  className={'reset-btn'}
                  onClick={() => this.onResetClicked()}
                  disabled={!this.props.status}
                >
                  Reset
                </Button>
              </TopFilterBar.Wrapper>
            </TopFilterBar>
          </div>
          <List
            data={Immutable.fromJS(this.props.intakeKits)}
            id={KeyRegistry.SHIPMENT_LAB_INTAKE_KITS_TABLE}
            showPagination
            pageSizeOptions={this.state.pageSizeOptions}
            pageSize={this.pageSize()}
            onPageChange={(requestedPage, pageSize) => this.onPageChange(requestedPage, pageSize)}
            maxPage={this.numPages()}
            currentPage={this.page()}
            loaded={!this.props.isSearching}
            disabledSelection
            onRowClick={this.onRowClick}
            visibleColumns={this.state.visibleColumns}
            persistKeyInfo={UserPreference.packInfo(KeyRegistry.SHIPMENT_LAB_INTAKE_KITS_TABLE)}
            onChangeSelection={selectedColumns => this.onChangeSelection(selectedColumns)}
            showColumnFilter
            popoverOnHeader
          >
            <Column
              renderCellContent={(record) => this.renderTextRecord(record, 'organization')}
              sortable
              onSortChange={this.onSortChange}
              header="organization"
              id="organization"
              key="column-organization"
            />
            <Column
              renderCellContent={(record) => this.renderUrlRecord(record, 'easy_post_label_url')}
              header="easy post label url"
              id="easy_post_label_url"
              key="column-easy_post_label_url"
            />
            <Column
              renderCellContent={(record) => this.renderPayment(record, 'invoice_item_id')}
              header="payment"
              id="payment"
              key="column-payment"
            />
            <Column
              renderCellContent={(record) => this.renderTextRecord(record, 'status')}
              header="status"
              id="status"
              key="column-status"
            />
            <Column
              renderCellContent={(record) => this.renderTextRecord(record, 'items_count')}
              sortable
              onSortChange={this.onSortChange}
              header="item count"
              id="items_count"
              key="column-items_count"
            />
            <Column
              renderCellContent={(record) => this.renderTimeRecord(record, 'created_at')}
              sortable
              onSortChange={this.onSortChange}
              header="requested"
              id="created_at"
              key="column-created_at"
            />
            <Column
              renderCellContent={(record) => this.renderTimeRecord(record, 'admin_processed_at')}
              sortable
              onSortChange={this.onSortChange}
              header="processed"
              id="admin_processed_at"
              key="column-admin_processed_at"
            />
            <Column
              renderCellContent={(record) => this.renderTextRecord(record, 'lab')}
              sortable
              onSortChange={this.onSortChange}
              header="lab"
              id="lab"
              key="column-lab"
            />
          </List>
        </div>
      </div>
    );
  }
}

IntakeKitsPage.propTypes = {
  intakeKits: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      organization: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      }).isRequired,
      organization_id: PropTypes.string.isRequired,
      easy_post_label_url: PropTypes.shape({
        url: PropTypes.string,
        text: PropTypes.string
      }).isRequired,
      commercial_invoice_url: PropTypes.shape({
        url: PropTypes.string,
        text: PropTypes.string
      }),
      admin_processed_at: PropTypes.string,
      created_at: PropTypes.string.isRequired,
      lab: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      }).isRequired,
      invoice_item_id: PropTypes.string,
      items_count: PropTypes.number,
      status: PropTypes.string.isRequired
    })
  )
};

const getStateFromStores = function() {
  const { isSearching,  searchPage, status, search_key } =
    IntakeKitsLabPageState.get();

  const actions = IntakeKitsLabSearchActions;
  const search = IntakeKitSearchStore.getSearch(search_key, searchPage);

  let results = search.get('results');

  if (results.count() == 0) {
    results = Immutable.List();
  }

  const lab_id = FeatureStore.getLabIdsWithFeatures(
    FeatureConstants.INTAKE_KITS_SHIPMENTS
  ).toJS().join();

  const intakeKits = results.toJS().map((intakeKit) => {
    const organization = intakeKit.organization;

    const lab = intakeKit.lab;
    const easy_post_label_url = {
      url: intakeKit.easy_post_label_url,
      text: 'Label'
    };

    const commercial_invoice_url = {
      url: intakeKit.commercial_invoice_url,
      text: 'Invoice'
    };

    return _.extend(
      _.pick(
        intakeKit,
        'id',
        'admin_processed_at',
        'organization_id',
        'created_at',
        'status',
        'items_count',
        'invoice_item_id'
      ),
      {
        organization
      },
      {
        lab
      },
      {
        easy_post_label_url,
        commercial_invoice_url
      }
    );
  });

  return {
    intakeKits,
    actions,
    search,
    isSearching,
    status,
    lab_id
  };
};
const ConnectedIntakeKitsPage = ConnectToStores(
  IntakeKitsPage,
  getStateFromStores
);

export default ConnectedIntakeKitsPage;
