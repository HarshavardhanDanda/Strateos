import React from 'react';
import _ from 'lodash';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Column, List, Button, TextInput, LabeledInput, Spinner, ZeroState } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import Urls from 'main/util/urls';
import ReactionAPI from 'main/pages/ReactionPage/ReactionAPI';
import ModalActions from 'main/actions/ModalActions';
import { BatchSearchStore } from 'main/stores/search';
import OrganizationStore from 'main/stores/OrganizationStore';
import ReactionStore from 'main/stores/ReactionStore';
import BatchAPI from 'main/api/BatchAPI';
import NotificationActions from 'main/actions/NotificationActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { TabLayout, TabLayoutTopbar } from 'main/components/TabLayout';
import OrganizationActions from 'main/actions/OrganizationActions';
import BaseTableTypes from 'main/components/BaseTableTypes';
import withPageWithSearchAndList from 'main/components/PageWithSearchAndList/PageWithSearchAndListHOC';
import { PAGE_SIZE_OPTIONS } from 'main/util/List';
import { CompoundBatchesState } from './CompoundBatchesState';
import { CompoundBatchesPageActions } from './CompoundBatchesActions';
import BatchContainersModal from './BatchContainersModal';
import CompoundBatchesFilter from './CompoundBatchesFilter';

class CompoundBatches extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      containerIds: {},
      currentBatchId: '',
      hasDoneDefaultSearch: false,
      hasResultsInTheFirstCall: false,
      errors: {},
    };

    _.bindAll(this,
      'load',
      'renderContainers',
      'onChange',
      'removeError',
      'addError',
      'recordHasError',
      'resetError',
      'displayError',
      'updateBatchProperties',
      'renderSearchFilters',
      'renderSearchResults'
    );
  }

  componentDidMount() {
    this.load();
  }

  load() {
    const defaultOptions = this.props.searchOptions.toJS();
    const searchOptions = {
      ...defaultOptions,
      compound_link_id: this.props.compoundLinkId,
    };
    this.props.actions.doSearch(searchOptions, this.props.onSearchFailed, (batches) => {
      this.loadBatchRelations(batches);
      this.setState({ hasDoneDefaultSearch: true });
    });
  }

  loadBatchRelations(batches) {
    const reaction_ids = [];
    batches.data.forEach((result) => {
      if (result.relationships) {
        this.setState(prevState => ({
          containerIds: {
            ...prevState.containerIds,
            [result.id]: _.uniq(result.relationships.containers.data.map(entity => entity.id)),
          }
        }));
      }
      if (result.attributes.reaction_id) {
        const org = OrganizationStore.getById(result.attributes.organization_id);
        !org && OrganizationActions.loadOrganization(result.attributes.organization_id);
        reaction_ids.push(result.attributes.reaction_id);
      }
    });
    this.loadReaction(reaction_ids);
  }

  loadReaction(reactionIds) {
    if (reactionIds.length > 0) {
      ReactionAPI.getReactionsByIds(reactionIds);
    }
  }

  renderReaction(record) {
    const reactionId = record.get('reaction_id');
    const reaction = ReactionStore.getById(reactionId);
    const org = OrganizationStore.getById(record.get('organization_id'));
    const subdomain = org && org.get('subdomain');

    return (
      reaction ? (
        <Button
          type="primary"
          link
          to={Urls.reaction(subdomain, reactionId)}
          tagLink
          newTab
        >
          {reaction.get('name')}
        </Button>
      )
        : '-'
    );
  }

  renderContainers(record) {
    if (_.has(this.state.containerIds, record.get('id'))) {
      const count = this.state.containerIds[record.get('id')].length;
      return (
        count > 0 ? (
          <div>
            <Button
              link
              icon="fas fa-vial"
              onClick={() => {
                this.setState({ currentBatchId: record.get('id')  });
                ModalActions.open(BatchContainersModal.MODAL_ID);
              }
        }
            >{ `${count} container${count > 1 ? 's' : ''}` }
            </Button>
          </div>
        ) : '-'
      );
    }
  }

  renderPurity(record) {
    return record.get('purity') ? record.get('purity') + ' %' : '-';
  }

  renderMassYield(record) {
    return record.get('post_purification_mass_yield_mg') ? record.get('post_purification_mass_yield_mg') + ' mg' : '-';
  }

  renderCreatedAt(record) {
    return <BaseTableTypes.Time data={record.get('samples_created_at')} />;
  }

  isValidNumber(value, columnName) {
    const validationRegex = '^[0-9]+(.[0-9]+)?$';
    const re = new RegExp(validationRegex);
    const isValidNumber = re.test(value);
    if (isValidNumber) {
      const number = parseFloat(value);
      if (columnName === 'purity') {
        return (number >= 0 && number <= 100);
      } else {
        return true;
      }
    }
    return false;
  }

  onChange(formValue, columnName, record) {
    const isValid = this.isValidNumber(formValue, columnName);
    const id = record.get('id');
    if (isValid) {
      this.removeError(columnName, id);
    } else {
      this.addError(columnName, id);
    }
  }

  removeError(columnName, id) {
    const errorObj = this.state.errors[id];
    if (errorObj) {
      if (columnName === 'purity') {
        errorObj.isPurityError = false;
      } else {
        errorObj.isMassYieldError = false;
      }
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          [id]: errorObj
        }
      }));
    }
  }

  addError(columnName, id) {
    const errorObj = this.state.errors[id];
    const updatedError = {};
    if (columnName === 'purity') {
      updatedError.isPurityError = true;
    } else {
      updatedError.isMassYieldError = true;
    }
    this.setState(prevState => ({
      errors: {
        ...prevState.errors,
        [id]: { ...errorObj, ...updatedError }
      }
    }));
  }

  recordHasError(record) {
    const id = record.get('id');
    const errorObj = this.state.errors[id];
    if  (errorObj) {
      return errorObj.isPurityError || errorObj.isMassYieldError;
    }
    return false;
  }

  resetError(record) {
    const id = record.get('id');
    const errorObj = this.state.errors[id];
    if (errorObj) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          [id]: { isPurityError: false, isMassYieldError: false }
        }
      }));
    }
  }

  displayError(id, columnName) {
    const errorObj = this.state.errors[id];
    let message = '';
    if  (errorObj) {
      if (columnName === 'purity') {
        message = 'Value must be >= 0 and <= 100';
        return errorObj.isPurityError ? message : '';
      } else {
        message = 'Value must be >= 0';
        return errorObj.isMassYieldError ? message : '';
      }
    }
    return '';
  }

  updateBatchProperties(changedValue, property) {
    const batchId = property.get('id');
    BatchAPI.update(batchId, changedValue, { version: 'v1' }).done(() => {
      NotificationActions.createNotification({
        text: 'Batch is Updated',
        isSuccess: true
      });
    }).fail((...response) => NotificationActions.handleError(...response));
  }

  canManageBatch() {
    return AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB);
  }

  renderSearchResults() {
    const {
      isSearching,
      actions,
      searchPage,
      searchPerPage,
      search
    } = this.props;
    const data = search.get('results', []);

    const onPageChange = (requestedPage, requestedPageSize) => {
      if (requestedPage !== searchPage || requestedPageSize !== searchPerPage) {
        actions.onSearchPageChange(this.props.onSearchFailed, requestedPage, requestedPageSize, (batches) => {
          this.loadBatchRelations(batches);
        });
      }
    };

    const onSortChange = (key, direction) => {
      actions.onSortOptionChange(this.props.onSearchFailed, key, direction === 'desc', (batches) => {
        this.loadBatchRelations(batches);
      });
    };

    return (
      <React.Fragment>
        {this.state.currentBatchId && (
        <BatchContainersModal
          batchId={this.state.currentBatchId}
          compoundLinkId={this.props.compoundLinkId}
        />
        )}
        <List
          loaded={!isSearching}
          data={data}
          disabledSelection
          showPagination
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={searchPerPage}
          maxPage={search.get('num_pages', 1)}
          currentPage={search.get('page', 1)}
          onPageChange={onPageChange}
          id="Batches Table"
          onEditRow={this.updateBatchProperties}
          editableRow={this.canManageBatch}
          isSaveDisabled={this.recordHasError}
          onCancelIconClick={this.resetError}
        >
          <Column
            renderCellContent={(record) => record.get('id')}
            header="Batch ID"
            id="batchId"
          />
          <Column
            renderCellContent={this.renderContainers}
            header="Related Containers"
            id="containers"
          />
          <Column
            renderCellContent={this.renderReaction}
            header="Reaction"
            id="reaction"
          />
          <Column
            renderCellContent={this.renderPurity}
            renderEditableCellContent={(record) => {
              const id  = record.get('id');
              const message = this.displayError(id, 'purity');
              return (
                <LabeledInput
                  error={message}
                >
                  <TextInput
                    name="purity"
                    type="number"
                    value={record.get('purity')}
                    onChange={(e) => {
                      this.onChange(e.target.value, 'purity', record);
                    }}
                    validated={{ hasError: !!message }}
                  />
                </LabeledInput>
              );
            }}
            sortable
            onSortChange={onSortChange}
            header="Purity"
            id="purity"
          />
          <Column
            renderCellContent={this.renderMassYield}
            renderEditableCellContent={(record) => {
              const id  = record.get('id');
              const message = this.displayError(id, 'massYield');
              return (
                <LabeledInput
                  error={message}
                >
                  <TextInput
                    name="post_purification_mass_yield_mg"
                    type="number"
                    value={record.get('post_purification_mass_yield_mg')}
                    onChange={(e) => {
                      this.onChange(e.target.value, 'massYield', record);
                    }}
                    validated={{ hasError: !!message }}
                  />
                </LabeledInput>
              );
            }}
            sortable
            onSortChange={onSortChange}
            header="Mass Yield"
            id="post_purification_mass_yield_mg"
          />
          <Column
            renderCellContent={this.renderCreatedAt}
            sortable
            onSortChange={onSortChange}
            header="Date Created"
            id="created_at"
          />
        </List>
      </React.Fragment>
    );
  }

  renderSearchFilters() {
    const { searchOptions }  = this.props;
    return (
      <CompoundBatchesFilter
        searchOptions={searchOptions}
        onSearchInputChange={this.props.onSearchInputChange}
        onSearchFilterChange={this.props.onSearchFilterChange}
      />
    );
  }

  renderTabLayoutContent() {
    const data = this.props.search.get('results', []);
    if (!this.state.hasResultsInTheFirstCall && data.size > 0) {
      this.setState({ hasResultsInTheFirstCall: true });
    }
    if (data.size === 0 && !this.props.isSearching && !this.state.hasResultsInTheFirstCall) {
      return (
        <ZeroState
          title={"This compound isn't linked to any batches yet!"}
          hasBorder={false}
        />
      );
    }

    return (
      this.props.isSearching && !this.state.hasResultsInTheFirstCall ? <Spinner /> : (
        <TabLayout>
          <TabLayoutTopbar>
            {this.renderSearchFilters()}
          </TabLayoutTopbar>
          {this.renderSearchResults()}
        </TabLayout>
      )
    );
  }

  render() {
    return this.renderTabLayoutContent();
  }
}

export const props = () => {
  const {
    isSearching,
    searchPerPage,
    searchPage
  } = CompoundBatchesState.get();

  let search = BatchSearchStore.getLatestSearch() || Immutable.fromJS({ results: [] });
  const results = BatchSearchStore.getResultsFromSearch(search);
  search = search.set('results', results);

  const searchOptions = new Immutable.Map(CompoundBatchesPageActions.searchOptions());
  const actions = CompoundBatchesPageActions;

  return {
    actions,
    search,
    searchOptions,
    isSearching,
    searchPerPage,
    searchPage
  };
};

CompoundBatches.propTypes = {
  search: PropTypes.instanceOf(Immutable.Map).isRequired,
  searchOptions: PropTypes.object.isRequired,
  isSearching: PropTypes.bool.isRequired,
  actions: PropTypes.object.isRequired,
  searchPerPage: PropTypes.string,
  onSearchFailed: PropTypes.func,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchFilterChange: PropTypes.func.isRequired,
  searchPage: PropTypes.number.isRequired,
  compoundLinkId: PropTypes.string.isRequired,
};

const compoundBatchesWithPageWithSearchAndList = withPageWithSearchAndList(CompoundBatches);
export default ConnectToStores(compoundBatchesWithPageWithSearchAndList, props);
