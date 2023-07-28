import React from 'react';
import Immutable from 'immutable';
import ContainerStore from 'main/stores/ContainerStore';
import lodash from 'lodash';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Column, List, Table } from '@transcriptic/amino';

import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import AliquotAPI from 'main/api/AliquotAPI';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import BaseTableTypes from 'main/components/BaseTableTypes';

import './CompoundDetailPageInventory.scss';

class BatchContainersModal extends React.Component {
  static get propTypes() {
    return {
      batchId: PropTypes.string.isRequired
    };
  }

  static get MODAL_ID() {
    return 'BatchContainersModal';
  }

  constructor(props, context) {
    super(props, context);

    lodash.bindAll(
      this,
      'search',
      'onSortChange',
      'onPageChange',
      'onSearchPageChange',
      'renderExpandedRow',
      'renderConcentration',
      'renderCreatedAt',
      'initialState',
      'reset'
    );

    this.state = this.initialState();
  }

  initialState() {
    return {
      containerIds: [],
      page: 1,
      perPage: 10,
      numPages: 1,
      loading: true,
      searchSortBy: 'updated_at',
      descending: true,
      hasResultsInTheFirstCall: false,
      aliquotIds: [],
      expanded: {}
    };
  }

  reset() {
    this.setState(this.initialState());
  }

  search() {
    const data = {
      query: `"${this.props.batchId}"`,
      search_fields: ['batch_ids'],
      ignore_score: true,
      page: this.state.page,
      per_page: this.state.perPage,
      sort_by: this.state.searchSortBy,
      sort_desc: this.state.descending,
      status: 'all_except_deleted',
    };

    ContainerActions.search(data)
      .done(resp => {
        const containerIds = resp.data.map(entity => entity.id);
        const total    = resp.meta.record_count;
        const numPages = Math.ceil(total / this.state.perPage);
        AliquotAPI.indexAll({
          filters: {
            batch: this.props.batchId
          },
          includes: ['aliquots_compound_links']
        })
          .done(response => {
            const data = lodash.map(response, 'data');
            this.setState(prevState => ({ aliquotIds: [...prevState.aliquotIds, lodash.map(data.flat(), 'id')] }));
          })
          .fail((...response) => NotificationActions.handleError(...response));
        this.setState({ containerIds, loading: false, numPages: numPages });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  }

  onPageChange(requestedPage, requestedPageSize) {
    if (requestedPage !== this.state.page) {
      this.onSearchPageChange(requestedPage);
    }

    if (requestedPageSize !== this.state.perPage) {
      this.setState({ loading: true, perPage: requestedPageSize }, () => {
        this.search();
      });
    }
  }

  onSearchPageChange(page) {
    this.setState({ loading: true, page }, this.search);
  }

  onSortChange(key, direction) {
    this.setState({ loading: true,
      searchSortBy: key,
      descending: direction === 'desc'
    }, () => {
      this.search();
    });
  }

  renderName(container) {
    return (
      <p className="tx-type--secondary">{container.get('label') || '-'}</p>
    );
  }

  renderType(container)  {
    if (container.get('test_mode')) {
      return <h3><i className="tx-type--warning fas fa-flask test-icon" /></h3>;
    }
    const cTypeId = container.get('container_type_id');
    const containerType = ContainerTypeStore.getById(cTypeId);
    const isTube = containerType && containerType.get('is_tube');

    return <i className={classNames('baby-icon', isTube ? 'aminol-tube' : 'aminol-plate')} />;
  }

  renderCtypeId(container) {
    return <p className="tx-type--secondary">{container.get('container_type_id') || '-'}</p>;
  }

  renderContentsColumn(container) {
    const aliquotCount = container.get('aliquot_count');
    return <p className="tx-type--secondary">{aliquotCount ? `${aliquotCount} aliquot${aliquotCount > 1 ? 's' : ''}` : '-'}</p>;
  }

  renderBarcode(container) {
    return <p className="tx-type--secondary">{container.get('barcode') || '-'}</p>;
  }

  renderCreatedAt(container) {
    return <BaseTableTypes.Time data={container.get('created_at')} />;
  }

  renderLastUsed(container) {
    return <BaseTableTypes.Time data={container.get('updated_at')} />;
  }

  renderColumns() {
    return [
      <Column
        renderCellContent={this.renderType}
        header="type"
        id="is_tube"
        key="is-tube"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc={false}
      />,
      <Column
        renderCellContent={this.renderCtypeId}
        header="format"
        id="container_type_id"
        key="container-type-id"
      />,
      <Column
        renderCellContent={this.renderName}
        header="name"
        id="label"
        key="label"
      />,
      <Column
        renderCellContent={this.renderBarcode}
        header="barcode"
        id="barcode"
        key="barcode"
      />,
      <Column
        renderCellContent={this.renderContentsColumn}
        header="contents"
        id="contents"
        key="contents"
      />,
      <Column
        renderCellContent={this.renderCreatedAt}
        header="created"
        id="created_at"
        key="created-at"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc
      />,
      <Column
        renderCellContent={this.renderLastUsed}
        header="last used"
        id="updated_at"
        key="updated-at"
        sortable
        onSortChange={this.onSortChange}
        defaultAsc
      />
    ];
  }

  renderFooter() {
    return (
      <div className="modal__footer tx-inline tx-inline--md">
        <Button onClick={() => {
          ModalActions.close(BatchContainersModal.MODAL_ID);
          this.reset();
        }
        }
        >close
        </Button>
      </div>
    );
  }

  renderWellIndex(containerAliquot, container) {
    const containerType = ContainerTypeStore.getById(container.get('container_type_id'));
    const helper = new ContainerTypeHelper({ col_count: containerType.get('col_count') });
    const wellIndex = containerAliquot.get('well_idx');
    return helper.humanWell(wellIndex);
  }

  renderConcentration(containerAliquot) {
    const aliquotCompoundLinks =  AliquotCompoundLinkStore.getByAliquotAndCompoundLinkId(containerAliquot.get('id'), this.props.compoundLinkId);
    const volume = containerAliquot.get('volume_ul');
    const concentration = aliquotCompoundLinks && aliquotCompoundLinks.first().get('concentration');
    return concentration ? (concentration + ' mM') : ((volume && lodash.gt(volume, 0)) ? '-' : 'N/A');
  }

  renderExpandedRow(container) {
    const containerAliquots = AliquotStore.getByContainer(container.get('id'));
    const compoundRelatedAliquots = containerAliquots.filter((aliquot) => this.state.aliquotIds.flat().includes(aliquot.get('id')));

    const columns = [
      <Column
        renderCellContent={(record) => this.renderWellIndex(record, container)}
        header="Well"
        id="Well"
        key="well"
      />,
      <Column
        renderCellContent={(record) => (record.get('volume_ul') ? record.get('volume_ul') + ' μL' : '-')}
        header="Volume"
        id="volume"
        key="volume"
      />,
      <Column
        renderCellContent={(record) => (record.get('mass_mg') ? record.get('mass_mg') + ' mg' : '-')}
        header="Mass"
        id="mass"
        key="mass"
      />,
      <Column
        renderCellContent={this.renderConcentration}
        header="Concentration"
        id="concentration"
        key="concentration"
      />
    ];

    return (
      (compoundRelatedAliquots && (
        <Table
          loaded
          disabledSelection
          data={compoundRelatedAliquots}
          id="aliquots-table"
          disableBorder
        >
          {columns}
        </Table>
      )
      )
    );
  }

  render() {
    const { containerIds, page, numPages, perPage, loading, hasResultsInTheFirstCall } = this.state;
    const containers = Immutable.fromJS(ContainerStore.getByIds(containerIds));
    if (!hasResultsInTheFirstCall && containers.size > 0) {
      this.setState({ hasResultsInTheFirstCall: true });
    }

    return (
      <SinglePaneModal
        title="Batch Containers"
        modalId={BatchContainersModal.MODAL_ID}
        onDismissed={() => this.reset()}
        footerRenderer={() => this.renderFooter()}
        modalSize="xlg"
        onOpen={() => this.search()}
      >
        <p className="tx-type--secondary">Displaying containers related to batch {this.props.batchId}</p>
        <React.Fragment>
          <List
            data={containers}
            loaded={!loading}
            id="compound-batch-inventory-table"
            disabledSelection
            showPagination
            disableCard
            currentPage={page}
            maxPage={numPages}
            onPageChange={this.onPageChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            pageSize={perPage}
            onExpandRow={(_record, _willBeExpanded, expanded) => this.setState({ expanded })}
            renderExpandedRow={this.renderExpandedRow}
            expanded={this.state.expanded}
          >
            {this.renderColumns()}
          </List>
        </React.Fragment>
      </SinglePaneModal>
    );
  }

}
export default BatchContainersModal;
