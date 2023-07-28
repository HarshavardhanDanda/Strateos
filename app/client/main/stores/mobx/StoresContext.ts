import { createContext } from 'react';
import RunManagementStore from './RunManagementStore';
import RunFilterStore from './RunFilterStore';
import CalendarViewStore from './CalendarViewStore';
import LabStore from './LabStore';

export interface StoresContextI {
  runManagementStore: RunManagementStore;
  runFilterStore: RunFilterStore;
  labStore: LabStore;
  calendarViewStore: CalendarViewStore;
}

export const makeNewContext = (): StoresContextI => {
  const labStore = new LabStore();
  const runFilterStore = new RunFilterStore(labStore);
  const runManagementStore = new RunManagementStore(runFilterStore, labStore);
  const calendarViewStore = new CalendarViewStore(labStore, runFilterStore);

  return {
    labStore,
    runFilterStore,
    runManagementStore,
    calendarViewStore
  };
};

export default createContext<StoresContextI>(makeNewContext());
