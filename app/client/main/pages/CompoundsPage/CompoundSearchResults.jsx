import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';
import React from 'react';
import moment from 'moment';
import { List, Molecule, Column, Popover, TagInput, DateTime, Tooltip } from '@transcriptic/amino';

import FeatureConstants from '@strateos/features';
import UserStore from 'main/stores/UserStore';
import UserProfile from 'main/components/UserProfile';
import HazardPopoverTags from 'main/components/Hazards/HazardPopoverTags';
import { getHazardsFromCompound } from 'main/util/Hazards';
import LibraryPopoverTags from 'main/components/Compounds/LibraryPopoverTags/LibraryPopoverTags';
import AcsControls from 'main/util/AcsControls';
import FeatureStore from 'main/stores/FeatureStore';
import LibraryStore from 'main/stores/LibraryStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import UserPreference from 'main/util/UserPreferenceUtil';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';

import './CompoundSearchResults.scss';

class CompoundSearchResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visibleColumns: this.props.visibleColumns || ['structure', 'external_system_id', 'nickname', 'ref id', 'ID', 'formula', 'weight', 'labels', 'hazards', 'source', 'created', 'creator'],
      labContextColumns: ['organization_name'],
      canViewLabCompounds: FeatureStore.hasFeature(FeatureConstants.VIEW_LAB_COMPOUNDS)
    };
  }

  render() {
    const  getSelectedRows = (selected) => {
      const selectionMap = {};
      selected.forEach(element => {
        selectionMap[element] = true;
      });
      return selectionMap;
    };

    const {
      data,
      isSearching,
      onSelectRow,
      searchOptions,
      onSortChange,
      onSearchFilterChange,
      hideActions,
      page,
      pageSize,
      numPages,
      onRowClick,
      onSearchPageChange,
      selected,
      onModal,
      disableCard,
      enableSelection,
      enableSort,
      libraries
    } = this.props;

    const renderStructure = (compound) => {
      return <div className="compound-results__molecule"><Molecule SMILES={compound.get('smiles')} size="tiny" /></div>;
    };

    const listActions = () => {
      return AcsControls.isFeatureEnabled(FeatureConstants.DOWNLOAD_COMPOUND) ?
        [{
          title: 'Download',
          icon: 'fa fa-download',
          action: this.props.onDownloadClicked
        }]
        :
        [];
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

    const renderNickname = (compound) => {
      return <p>{compound.get('name') || '-'}</p>;
    };

    const renderExternalSystemId = (compound) => {
      const externalIDs = compound.get('external_system_ids');
      const externalIDsJS = externalIDs && externalIDs.toJS();
      const firstObj = externalIDsJS && externalIDsJS[0];
      const firstExternalID = firstObj && firstObj.external_system_id;
      return firstExternalID || '-';
    };

    const renderProperty = (compound, propName) => {
      let propValue = compound.get(propName);
      if (propName === 'exact_molecular_weight') {
        propValue = parseFloat(propValue).toFixed(2);
      }
      return <p className="tx-type--secondary">{propValue || '-'}</p>;
    };

    const renderRefId = (compound) => {
      return <p className="tx-type--secondary">{compound.get('reference_id') || '-'}</p>;
    };

    const renderSearchScore = (compound) => {
      return Math.round(compound.get('search_score') * 100) / 100 || '-';
    };

    const renderLabels = (compound) => {
      const labels = compound.get('labels', Immutable.List([])).toJS();
      if (labels.length > 1) {
        return (
          <Popover
            content={
              labels.map(tag => (
                <TagInput.Tag
                  key={tag.name}
                  text={tag.name}
                  icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
                  iconType={(tag.organization_id ? 'far' : 'fa')}
                />
              ))
            }
            placement="bottom"
            trigger="hover"
            onModal={onModal}
          >
            <p className="tx-type--secondary">
              {labels.length}
              <i className="fas fa-tags compound-results__labels" />
            </p>
          </Popover>
        );
      } else if (labels.length === 1) {
        const tag = labels[0];
        return (
          <Popover
            content={(
              <TagInput.Tag
                key={tag.name}
                text={tag.name}
                icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
                iconType={(tag.organization_id ? 'far' : 'fa')}
              />
            )}
            placement="bottom"
            trigger="hover"
            onModal={onModal}
            showWhenOverflow
          >
            <TagInput.Tag
              key={tag.name}
              text={tag.name}
              icon={(tag.organization_id ? 'fa-user-tag' : 'aminol-strateos')}
              iconType={(tag.organization_id ? 'far' : 'fa')}
            />
          </Popover>
        );
      } else {
        return '-';
      }
    };

    const renderLibraries = (compound) => {
      const compoundId = compound.get('id');
      const hasLibraries = _.has(libraries, compoundId);
      const librariesList = hasLibraries ?  Immutable.List(LibraryStore.getByIds(libraries[compoundId])) : Immutable.List();
      return <LibraryPopoverTags libraries={librariesList.toJS()} onModal={onModal} />;
    };

    const renderHazards = (compound) => {
      return <HazardPopoverTags hazards={getHazardsFromCompound(compound)} />;
    };

    const renderSource = (compound) => {
      const organization = compound.get('organization_id');
      return <p className="tx-type--secondary">{organization ? 'Private' : 'Public'}</p>;
    };

    const renderTpsa = (compound) => {
      return <p className="tx-type--secondary">{compound.get('tpsa')}</p>;
    };

    const renderClogp = (compound) => {
      return <p className="tx-type--secondary">{compound.get('clogp')}</p>;
    };
    const renderCreatedAt = (compound) => {
      const timestamp = (compound.get('created_at'));
      const date = (<DateTime timestamp={timestamp} />);
      return (
        <Tooltip
          invert
          placement="bottom"
          title={moment(timestamp).format('ll')}
        >
          <p className="tx-type--secondary">{date}</p>
        </Tooltip>
      );
    };

    const renderCreatedBy =  (compound) => {
      const user = UserStore.getById(compound.get('created_by'));
      return (user ?  <UserProfile user={user}  /> : '-');
    };

    const renderOrganization = (compound) => {
      return <p className="tx-type--secondary">{compound.get('organization_name')}</p>;
    };

    const renderCASNumber = (compound) => {
      return <p className="tx-type--secondary">{compound.get('cas_number') || '-'}</p>;
    };

    const renderMFCDNumber = (compound) => {
      return <p className="tx-type--secondary">{compound.get('mfcd_number') || '-'}</p>;
    };

    const renderPubchemID = (compound) => {
      return <p className="tx-type--secondary">{compound.get('pub_chem_id') || '-'}</p>;
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
        renderCellContent={renderNickname}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="nickname"
        id="name"
        key="column-name"
        popOver
      />,
      <Column
        relativeWidth={1.1}
        renderCellContent={renderExternalSystemId}
        onSortChange={onSortChange}
        header="external_system_id"
        id="external_system_id"
        key="column-external_system_id"
      />,
      <Column
        renderCellContent={renderRefId}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="ref id"
        id="reference_id"
        key="column-reference_id"
        popOver
      />,
      <Column
        renderCellContent={(compound) => renderProperty(compound, 'id')}
        header="ID"
        id="id"
        key="column-id"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={(compound) => renderProperty(compound, 'formula')}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="formula"
        id="formula"
        key="column-formula"
        popOver
      />,
      <Column
        renderCellContent={(compound) => renderProperty(compound, 'molecular_weight')}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="weight"
        id="molecular_weight"
        key="column-molecular_weight"
        popOver
      />,
      <Column
        renderCellContent={(compound) => renderProperty(compound, 'exact_molecular_weight')}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="em"
        id="exact_molecular_weight"
        key="column-exact_molecular_weight"
        popOver
      />,
      <Column
        renderCellContent={renderSearchScore}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="score"
        id="search_score"
        key="column-search_score"
        popOver
      />,
      <Column
        renderCellContent={renderTpsa}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="TPSA"
        id="tpsa"
        key="column-tpsa"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={renderClogp}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="cLogP"
        id="clogp"
        key="column-clogp"
        disableFormatHeader
        popOver
      />,
      <Column
        relativeWidth={1.2}
        renderCellContent={renderLabels}
        header="labels"
        id="labels"
        key="column-labels"
      />,
      <Column
        relativeWidth={1.2}
        renderCellContent={renderLibraries}
        header="Libraries"
        id="libraries"
        key="column-libraries"
      />,
      <Column
        relativeWidth={1.2}
        renderCellContent={renderHazards}
        header="hazards"
        id="hazards"
        key="column-hazards"
      />,
      <Column
        renderCellContent={renderSource}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="source"
        id="organization_id"
        key="column-organization_id"
        popOver
      />,
      <Column
        renderCellContent={renderCreatedAt}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="created"
        id="created_at"
        key="column-created_at"
      />,
      <Column
        renderCellContent={renderCreatedBy}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="creator"
        id="created_by"
        key="column-created_by"
      />,
      <Column
        renderCellContent={renderOrganization}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="Organization"
        id="organization_name"
        key="column-organization_name"
        popOver
      />,
      <Column
        renderCellContent={renderCASNumber}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="CAS number"
        id="cas_number"
        key="column-cas_number"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={renderMFCDNumber}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="MFCD number"
        id="mfcd_number"
        key="column-mfcd_number"
        disableFormatHeader
        popOver
      />,
      <Column
        renderCellContent={renderPubchemID}
        sortable={enableSort}
        onSortChange={onSortChange}
        header="Pubchem ID"
        id="pubchem_id"
        key="column-pubchem_id"
        disableFormatHeader
        popOver
      />
    ];

    return (
      <div className="compound-results">
        <List
          popoverOnHeader
          popoverOnHover
          loaded={!isSearching}
          disableCard={disableCard}
          disabledSelection={!enableSelection}
          {...(enableSelection && {
            selected: getSelectedRows(selected),
            onSelectRow: (records, willBeChecked, selectedRows) => onSelectRow(selectedRows),
            onSelectAll: (selectedRows) => onSelectRow(selectedRows)
          })}
          data={data}
          tallRows
          onRowClick={onRowClick}
          id={KeyRegistry.COMPOUNDS_TABLE}
          showPagination
          currentPage={page}
          maxPage={numPages}
          onPageChange={(requestedPage, requestedPageSize) => onPageChange(requestedPage, requestedPageSize)}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          showActions
          actions={!hideActions ? listActions() : undefined}
          showColumnFilter
          visibleColumns={this.state.visibleColumns}
          persistKeyInfo={UserPreference.packInfo(KeyRegistry.COMPOUNDS_TABLE)}
          onChangeSelection={selectedColumns => {
            this.props.handleColumnChange && this.props.handleColumnChange(selectedColumns);
            this.setState({ visibleColumns: selectedColumns });
          }}
        >
          {
            columns.filter((column, i) => {
              let isLabContextColumn = false;
              if (this.state.canViewLabCompounds && this.state.labContextColumns.includes(column.props.id)) {
                isLabContextColumn = true;
              }
              if (column.props.id === 'libraries') {
                return  FeatureStore.hasFeature(FeatureConstants.VIEW_LIBRARIES);
              }

              return (i !== 7 || searchOptions.get('searchSimilarity')) && (isLabContextColumn || !this.state.labContextColumns.includes(column.props.id));
            })
          }
        </List>
      </div>
    );
  }
}

CompoundSearchResults.propTypes = {
  data: PropTypes.instanceOf(Immutable.List),
  selected: PropTypes.array,
  onSelectRow: PropTypes.func,
  onRowClick: PropTypes.func,
  isSearching: PropTypes.bool,
  searchOptions: PropTypes.instanceOf(Immutable.Map),
  page: PropTypes.number,
  pageSize: PropTypes.number,
  numPages: PropTypes.number,
  onSearchPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onModal: PropTypes.bool,
  onDownloadClicked: PropTypes.func,
  onSearchFilterChange: PropTypes.func,
  visibleColumns: PropTypes.instanceOf(Array),
  disableCard: PropTypes.bool,
  hideActions: PropTypes.bool,
  enableSelection: PropTypes.bool,
  enableSort: PropTypes.bool,
  handleColumnChange: PropTypes.func
};

CompoundSearchResults.defaultProps = {
  onModal: false,
  disableCard: false,
  hideActions: false,
  enableSelection: true,
  enableSort: true
};

export default CompoundSearchResults;
