import React, { useContext } from 'react';
import _ from 'lodash';
import { Select, DatePicker, LabeledInput } from '@transcriptic/amino';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import 'main/pages/RunsPage/views/CalenderView/FilterSidebar.scss';
import ColoredBulletList from 'main/pages/RunsPage/views/CalenderView/ColoredBulletList';
import LabConsumersFilter from 'main/pages/RunsPage/views/LabConsumersFilter.jsx';
import { observer } from 'mobx-react';
import StoresContext from 'main/stores/mobx/StoresContext';
import OperatorsFilter from 'main/pages/RunsPage/views/OperatorsFilter';

function FilterSidebar(props) {
  const context = useContext(StoresContext);
  const { runFilterStore, calendarViewStore, labStore } = context;
  const { searchOptions, workUnitList, updateSelectedWorkUnits, updateSelectedStatuses, updateRunDate,
    selectedWorkUnits, selectedStatuses } = calendarViewStore;
  const { sortedLabOptions } = labStore;
  const { currentLabId, selectedOrgName, selectedOrgId, updateSelectedOrg, selectedOperatorIds,
    updateSelectedOperators, updateLabId, userId, operatorLabs } = runFilterStore;

  return (
    <div className="tx-stack tx-stack--sm filter-sidebar">
      <DatePicker
        date={searchOptions.run_date}
        onChange={(e) => updateRunDate(e.target.value.date)}
        inline
      />
      {(workUnitList && workUnitList.length > 0) && (
        <LabeledInput label="DEVICE SET">
          <ColoredBulletList
            items={Immutable.fromJS(selectedWorkUnits)}
            onItemClick={updateSelectedWorkUnits}
          />
        </LabeledInput>
      )}
      <LabeledInput label="STATUS">
        <ColoredBulletList
          items={Immutable.fromJS(selectedStatuses)}
          onItemClick={updateSelectedStatuses}
          bulletType="square"
          itemOrientation="column"
        />
      </LabeledInput>
      <div className="filter-sidebar__inputs tx-stack tx-stack--xxs">
        <LabeledInput label="LAB">
          <Select
            value={currentLabId}
            onChange={(e) => updateLabId(e.target.value)}
            options={sortedLabOptions}
          />
        </LabeledInput>
        {props.showOrgFilter && (
          <LabeledInput label="ORGANIZATION">
            <LabConsumersFilter
              orgName={selectedOrgName}
              labId={currentLabId}
              isLoaded={!_.isEmpty(selectedOrgId)}
              onOrganizationSelected={updateSelectedOrg}
            />
          </LabeledInput>
        )}
        {selectedOperatorIds && (
          <LabeledInput label="LAB OPERATORS">
            <OperatorsFilter
              currentUserId={userId}
              labIds={operatorLabs}
              selectedIds={selectedOperatorIds}
              onMultiChange={updateSelectedOperators}
              includeCustomOptions
            />
          </LabeledInput>
        )}
      </div>
    </div>
  );
}

FilterSidebar.propTypes = {
  showOrgFilter: PropTypes.bool
};

export default observer(FilterSidebar);
