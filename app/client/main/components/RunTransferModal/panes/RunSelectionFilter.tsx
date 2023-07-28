import React from 'react';
import { SearchField, RadioGroup, Radio } from '@transcriptic/amino';
import { observer } from 'mobx-react';
import './RunSelectionFilter.scss';
import StoresContext from 'main/stores/mobx/StoresContext';

interface Props {
  userId?: string;
}

class RunSelectionFilter extends React.Component<Props> {

  render() {
    const {  userId } = this.props;
    const { runFilterStore } = this.context;
    const {
      search,
      selectedSubmitterIds,
      formattedRunStatus
    } = runFilterStore;

    return (
      <div className="tx-stack tx-stack--xs filter-sidebar">
        <div className="tx-stack run-selection-filter__header">
          <h3>Filters</h3>
          <a
            onClick={runFilterStore.resetRunTransferModalFilters}
            className="tx-inline tx-inline--xxxs"
          >
            <span className="run-selection-filter__clear-filters">
              Clear all
            </span>
          </a>
        </div>
        <div className="tx-stack tx-stack--xxxs">
          <h3>Search</h3>
          <SearchField
            value={search}
            placeholder="Search by title, ID etc"
            type="text"
            isSearching={false}
            onChange={(e) => runFilterStore.updateSearch(e.target.value)}
            reset={runFilterStore.resetSearch}
          />
        </div>
        <div className="tx-stack tx-stack--xxxs">
          <h3>Submitter</h3>
          <RadioGroup
            name="radio-input-group-1"
            value={selectedSubmitterIds}
            onChange={(e) => {
              runFilterStore.updateSelectedSubmitters(e.target.value);
            }}
          >
            <Radio
              id="radio-input-5"
              name="radio-input-5"
              value={'all'}
              label="All"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-6"
              name="radio-input-6"
              value={userId}
              label="By me"
              onChange={() => {}}
            />
          </RadioGroup>
        </div>
        <div className="tx-stack tx-stack--xxxs">
          <h3>Status</h3>
          <RadioGroup
            name="radio-input-group"
            value={formattedRunStatus}
            onChange={(e) => {
              runFilterStore.updateRunStatus(e.target.value);
            }}
          >
            <Radio
              id="radio-input-all"
              name="radio-input-all"
              value={'all'}
              label="All"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-1"
              name="radio-input-1"
              value={'accepted'}
              label="Accepted"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-2"
              name="radio-input-2"
              value={'in_progress'}
              label="In Progress"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-3"
              name="radio-input-3"
              value={'complete'}
              label="Completed"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-4"
              name="radio-input-4"
              value={'aborted'}
              label="Aborted"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-7"
              name="radio-input-7"
              value={'rejected'}
              label="Rejected"
              onChange={() => {}}
            />
            <Radio
              id="radio-input-8"
              name="radio-input-8"
              value={'canceled'}
              label="Cancelled"
              onChange={() => {}}
            />
          </RadioGroup>
        </div>
      </div>
    );
  }
}
RunSelectionFilter.contextType = StoresContext;

export default observer(RunSelectionFilter);
