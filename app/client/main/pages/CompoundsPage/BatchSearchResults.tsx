import Immutable from 'immutable';
import _ from 'lodash';
import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { List, Column, Molecule, StatusPill, Button } from '@transcriptic/amino';

import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import Urls from 'main/util/urls';
import UserProfile from 'main/components/UserProfile';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import ModalActions from 'main/actions/ModalActions';
import SessionStore from 'main/stores/SessionStore';
import ReactionStore from 'main/stores/ReactionStore';
import BaseTableTypes from 'main/components/BaseTableTypes';
import RelatedRunsModal from 'main/pages/CompoundsPage/RelatedRunsModal';
import { CompoundBatchesPageActions } from 'main/pages/CompoundsPage/CompoundBatchesActions';
import { BatchesPageActions } from 'main/pages/CompoundsPage/BatchesActions';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchOptions =  Immutable.Map<string, any>

interface Prop{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Immutable.List<Map<string, any>>,
  isSearching?: boolean,
  searchOptions?: SearchOptions,
  page?: number,
  pageSize?: number,
  numPages?: number,
  onSearchPageChange?: (requestedPage: number) => void,
  onSortChange?: (key: string, direction: string) => void,
  onSearchFilterChange?: (searchOptions: SearchOptions) => void,
  visibleColumns?: string[],
  enableSort?: boolean,
  handleColumnChange?: (selectedColumns: Array<string>) => void,
  history: RouteComponentProps['history'],
  onSelectRow?: (selectedRows: object) => void,
  selected?: object,
  enableSelection: boolean
}

function BatchSearchResults(props: Prop) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(props.visibleColumns || ['structure', 'name', 'status', 'mass yield', 'purity %', 'created at', 'related runs', 'synthesis program', 'synthesis request']);
  const {
    data,
    isSearching,
    searchOptions,
    onSortChange,
    onSearchFilterChange,
    onSelectRow,
    page,
    pageSize,
    numPages,
    onSearchPageChange,
    enableSort,
    handleColumnChange,
    history,
    enableSelection,
    selected
  } = props;

  const addListAction = (title, action, actionsList, icon = undefined) => {
    actionsList.push({
      title: title,
      action: action,
      icon: icon
    });
  };

  const onDownloadClicked = () => {
    BatchesPageActions.downloadCSV(Object.keys(selected));
  };

  const listActions = () => {
    const actionsList = [];
    addListAction('Download', onDownloadClicked, actionsList, 'fa fa-download');
    return actionsList;
  };

  const relatedRunsModalId = (batch) => {
    return `RELATED_RUNS_MODAL_${batch.get('id')}`;
  };

  const onBatchLinkClick = (batch) => {
    CompoundBatchesPageActions.updateState({
      searchInput: batch.get('id')
    });
    history.push({ pathname: Urls.compound(batch.get('compound_link_id')), state: { tab: 'Batches' } });
  };

  const onPageChange = (requestedPage, requestedPageSize) => {

    const onSelectOption = field => value =>
      onSearchFilterChange(searchOptions.set(field, value));

    if (requestedPage !== page) {
      onSearchPageChange(requestedPage);
    }
    if (requestedPageSize !== pageSize) {
      onSelectOption('searchPerPage')(requestedPageSize);
    }
  };

  const renderStructure = (batch) => {
    return <div className="compound-results__molecule"><Molecule SMILES={batch.getIn(['compound', 'smiles'])} size="tiny" /></div>;
  };

  const renderName = (batch) => {
    return (
      <Button
        link
        heavy={false}
        disableFormat
        onClick={() => onBatchLinkClick(batch)}
      >
        {batch.get('name') || batch.get('id')}
      </Button>
    );

  };

  const renderStatusPill = (statusText, statusType) => {
    return (
      <StatusPill
        type={statusType || 'light'}
        shape="tag"
        text={statusText || 'Unknown'}
      />
    );
  };

  const renderStatus = (batch) => {
    const status = BatchesPageActions.generateBatchStatus(batch);
    const text = status && BatchesPageActions.generateBatchStatusText(status);
    const type = status && BatchesPageActions.generateBatchStatusType(status);
    return status ? renderStatusPill(text, type) : '-';
  };

  const renderReaction = (batch) => {
    const reactionId = batch.get('reaction_id');
    const reaction = ReactionStore.getById(reactionId);
    const reactionName = reaction && reaction.get('name');
    const data = reaction && { url: Urls.reaction(SessionStore.getOrg().get('subdomain'), reactionId), text: reactionName };
    return _.isEmpty(reactionName) ? '-' : <BaseTableTypes.Url data={data} openInNewTab />;
  };

  const renderMassYield = (batch) => {
    const data = batch.get('post_purification_mass_yield_mg') ? (batch.get('post_purification_mass_yield_mg') + ' mg') : '-';
    return <BaseTableTypes.Text data={data} />;
  };

  const renderPurity = (batch) => {
    const data = batch.get('purity') ? (batch.get('purity') + ' %') : '-';
    return <BaseTableTypes.Text data={data} />;
  };

  const renderSynthesisProgram = (batch) => {
    const data = batch.get('synthesis_program_name') ? batch.get('synthesis_program_name') : '-';
    return <BaseTableTypes.Text data={data} />;
  };

  const renderSynthesisRequest = (batch) => {
    const data = batch.get('synthesis_request_name') ||  '-';
    return <BaseTableTypes.Text data={data} />;
  };

  const renderCreatedAt = (batch) => {
    return <BaseTableTypes.Time data={batch.get('samples_created_at')} />;
  };

  const renderCreatedBy = (batch) => {
    const user = batch.get('user');
    return (user ?  <UserProfile user={user} label=""  /> : '-');
  };

  const displayRelatedRuns = (batch) => {
    return (
      <div>
        <RelatedRunsModal batchId={batch.get('id')} modalId={relatedRunsModalId(batch)} />
        <a onClick={_evt => ModalActions.open(relatedRunsModalId(batch))}>
          {`${batch.get('run_count')} run(s)`}
        </a>
      </div>
    );
  };

  const renderRelatedRuns = (batch) => {
    const relatedRuns = batch.get('run_count');
    if (relatedRuns > 0) {
      return displayRelatedRuns(batch);
    }
    return 'N/A';
  };

  const columns = [
    <Column
      relativeWidth={1.4}
      renderCellContent={renderStructure}
      header="structure"
      id="smiles"
      key="column-smiles"
      style={{ textAlign: 'center' }}
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderName}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="name"
      id="name"
      key="column-name"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderStatus}
      header="status"
      id="status"
      key="column-status"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderReaction}
      header="reaction"
      id="reaction_id"
      key="column-reaction"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderMassYield}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="mass yield"
      id="post_purification_mass_yield_mg"
      key="column-mass_yield"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderPurity}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="purity %"
      id="purity"
      key="column-purity"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderCreatedAt}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="created at"
      id="samples_created_at"
      key="column-samples_created_at"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderRelatedRuns}
      header="related runs"
      id="related_runs"
      key="column-related_runs"
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderCreatedBy}
      header="created by"
      id="created_by"
      key="column-created_by"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderSynthesisProgram}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="synthesis program"
      id="synthesis_program_name"
      key="column-synthesis_program"
      popOver
    />,
    <Column
      relativeWidth={1.1}
      renderCellContent={renderSynthesisRequest}
      sortable={enableSort}
      onSortChange={onSortChange}
      header="synthesis request"
      id="synthesis_request_name"
      key="column-synthesis_request"
      popOver
    />
  ];

  const renderColumn = (column) => {
    switch (column.props.id) {
      case 'related_runs': return (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUNS_IN_LABS)
      || AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PROJECTS_RUNS));
      default: return true;
    }
  };

  return (
    <div className="batch-results">
      <List
        popoverOnHeader
        popoverOnHover
        loaded={!isSearching}
        data={data}
        tallRows
        id={KeyRegistry.BATCHES_TABLE}
        showPagination
        currentPage={page}
        maxPage={numPages}
        onPageChange={(requestedPage, requestedPageSize) => onPageChange(requestedPage, requestedPageSize)}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageSize={pageSize}
        actions={listActions()}
        showColumnFilter
        visibleColumns={visibleColumns}
        onChangeSelection={(selectedColumns: string[]) => {
          handleColumnChange && handleColumnChange(selectedColumns);
          setVisibleColumns(selectedColumns);
        }}
        {...(enableSelection && {
          selected,
          onSelectRow: (_, __, selectedRows) => onSelectRow(selectedRows),
          onSelectAll: onSelectRow
        })}
      >
        {columns.filter((column) => (renderColumn(column)))}
      </List>
    </div>
  );
}

BatchSearchResults.defaultProps = {
  onModal: false,
  disableCard: false,
  hideActions: false,
  enableSelection: true,
  enableSort: true
};

export default BatchSearchResults;
