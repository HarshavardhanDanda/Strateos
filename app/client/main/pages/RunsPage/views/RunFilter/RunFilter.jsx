import { Select, SearchField, Button, DatePicker, Icon, TopFilterBar } from '@transcriptic/amino';
import React     from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import './RunFilter.scss';
import StoresContext from 'main/stores/mobx/StoresContext';
import ModalActions from 'main/actions/ModalActions';
import LabConsumersFilter from 'main/pages/RunsPage/views/LabConsumersFilter.jsx';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';

class RunFilter extends React.Component {

  handleDateChange = (event) => {
    const { startDate, endDate } = event.target.value;
    this.context.runFilterStore.updateDates(startDate, endDate);
  };

  getDateFilterBy(runStatus) {
    switch (runStatus) {
      case 'all_runs':
        return 'submitted date';
      case 'rejected':
        return 'rejected date';
      case 'accepted':
        return 'accepted date';
      case 'in_progress':
        return 'started date';
      case 'aborted':
        return 'aborted date';
      case 'pending':
        return 'submitted date';
      case 'complete':
        return 'completed date';
      case 'canceled':
        return 'canceled date';
    }
  }

  // I'm as surprised as you are that the calendar widget doesn't actually connect to our date time picker,
  // but that's apparently what our current production implementation is
  render() {
    const { showOperators = false, showOrgFilter } = this.props;
    const { runFilterStore, labStore } = this.context;
    const {
      search,
      labId,
      selectedOrgName,
      selectedOrgId,
      startDate,
      endDate,
      resetDisabled,
      selectedOperatorIds,
      userId,
      runStatus,
      operatorLabs,
      runType,
    } = runFilterStore;
    const { labOptions } = labStore;
    const DateFilterPlaceholder = 'By ' + this.getDateFilterBy(runStatus);
    const runOptions = [{ value: 'all', name: 'All runs' },
      { value: 'internal runs', name: 'Internal runs' }, {
        value: 'external runs', name: 'External runs' }];

    return (
      <div className="run-filter">
        <TopFilterBar>
          <TopFilterBar.Wrapper grow={2}>
            <SearchField
              value={search}
              placeholder="Search by run name, ID, barcode, etc"
              type="text"
              orientation="horizontal"
              isSearching={false}
              onChange={e => runFilterStore.updateSearch(e.target.value)}
              reset={runFilterStore.resetSearch}
            />
          </TopFilterBar.Wrapper>
          {showOrgFilter && (
            <TopFilterBar.Wrapper>
              <LabConsumersFilter
                orgName={selectedOrgName}
                labId={labId}
                onOrganizationSelected={runFilterStore.updateSelectedOrg}
                isLoaded={selectedOrgId !== 'all'} // Technically doesn't mean it's loaded, don't know why this is this way
              />
            </TopFilterBar.Wrapper>
          )}
          <TopFilterBar.Wrapper>
            <Select
              value={labId}
              onChange={e => runFilterStore.updateLabId(e.target.value)}
              placeholder="All labs"
              options={labOptions}
            />
          </TopFilterBar.Wrapper>
          {showOrgFilter && (
            <TopFilterBar.Wrapper>
              <Select
                value={runType}
                onChange={e => runFilterStore.updateRuns(e.target.value)}
                placeholder="All runs"
                options={runOptions}
              />
            </TopFilterBar.Wrapper>
          )}
          {showOperators && (
            <TopFilterBar.Wrapper width={200}>
              <OperatorsFilter
                currentUserId={userId}
                labIds={operatorLabs}
                selectedIds={selectedOperatorIds}
                isProfile
                onMultiChange={runFilterStore.updateSelectedOperators}
                includeCustomOptions
              />
            </TopFilterBar.Wrapper>
          )}
          <TopFilterBar.Wrapper width={280}>
            <DatePicker
              date={startDate}
              endDate={endDate}
              onChange={this.handleDateChange}
              placeholder={DateFilterPlaceholder}
              isSelectField
              isRangeSelector
            />
          </TopFilterBar.Wrapper>
          <TopFilterBar.Wrapper grow={false}>
            <div onClick={() => { ModalActions.open('CALENDER_VIEW_MODAL'); }} className="run-filter__calender-icon">
              <Icon
                icon="far fa-calendar-alt"
              />
            </div>
          </TopFilterBar.Wrapper>
          <TopFilterBar.Wrapper grow={false}>
            <Button
              type="secondary"
              size="small"
              onClick={runFilterStore.resetFilters}
              className={'reset-btn'}
              disabled={resetDisabled}
            >Reset
            </Button>
          </TopFilterBar.Wrapper>
        </TopFilterBar>
      </div>
    );
  }
}
RunFilter.contextType = StoresContext;

RunFilter.propTypes = {
  showOperators: PropTypes.bool,
  showOrgFilter: PropTypes.bool,
};

export default observer(RunFilter);
