import _ from 'lodash';
import React, { useContext, useEffect } from 'react';
import { Calendar, Spinner } from '@transcriptic/amino';
import { TabLayout } from 'main/components/TabLayout';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';
import FilterSidebar from 'main/pages/RunsPage/views/CalenderView/FilterSidebar';
import { observer } from 'mobx-react';
import StoresContext from 'main/stores/mobx/StoresContext';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';

import './CalendarView.scss';

const clickRunId = (run, history) => {
  AcsControls.isFeatureEnabled(FeatureConstants.VIEW_RUN_DETAILS)
    ? history.push(`${run.run_status}/runs/${run.run_id}`)
    : '';
};

function CalenderView(props) {
  const context = useContext(StoresContext);
  const { calendarViewStore, labStore, runFilterStore } = context;
  const { getRunDate, isLoaded, updateRunDate, eventList  } = calendarViewStore;
  const { labConsumers } = labStore;
  const { isValidLabId, currentLabId, updateLabId } = runFilterStore;

  useEffect(() => {
    if (!isValidLabId) {
      updateLabId(currentLabId);
    }
  }, []);

  const getEvents = () =>  {
    return eventList.map(event => ({
      ...event, onClickEntityId: () => clickRunId(event.runSchedule, props.history)
    }));
  };

  return (
    <TabLayout className="calendar-view" wideSidebar contextType="modal">
      {!isLoaded ? (
        <Spinner />
      ) : [
        <TabLayoutSidebar key="calender-tab-layout-side-bar">
          <FilterSidebar
            showOrgFilter={labConsumers.size > 0}
          />
        </TabLayoutSidebar>,
        <div
          className="calendar-view__content"
          key="calender"
        >
          {getRunDate && (
          <Calendar
            selectedDate={getRunDate}
            events={getEvents()}
            onClickToday={() => updateRunDate(new Date())}
            hideViewDropdown
          />
          )}
        </div>
      ]}
    </TabLayout>
  );
}

export default observer(CalenderView);
