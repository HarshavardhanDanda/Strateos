import React     from 'react';
import _         from 'lodash';
import { observer } from 'mobx-react';
import { TabLayout }  from 'main/components/TabLayout';
import { TabLayoutSidebar } from 'main/components/TabLayout/TabLayout';
import { makeRunTransferModalColumns } from 'main/pages/RunsPage/views/TableColumns';
import { MultiStepModalPane, clonedPropNames } from 'main/components/Modal';
import CommonRunListView from 'main/pages/RunsPage/views/CommonRunListView';
import StoresContext from 'main/stores/mobx/StoresContext';
import RunSelectionFilter from './RunSelectionFilter';

interface Props {
  projectId?: string;
  userId?: string;
}

class RunSelectionPane extends React.Component<Props> {

  componentDidMount() {
    this.context.runManagementStore.loadRuns();
  }

  onNext(next: () => void) {
    next();
  }

  render() {
    const { userId } = this.props;
    const { runManagementStore } = this.context;
    const { runFilterStore } = this.context;
    const { aminoSelectedObject } = runManagementStore;
    return (
      <MultiStepModalPane
        key={'RunTransferModalSelection'}
        beforeNavigateNext={(next) => this.onNext(next)}
        showBackButton={false}
        showCancel
        nextBtnName={'Continue'}
        cancelBtnClass="btn-info btn-heavy btn-standard btn-link btn-tall spacing"
        nextBtnClass="btn-heavy btn-medium btn-tall"
        nextBtnDisabled={runManagementStore.numberRunsSelected <= 0}
        isMultiProgressModal
        {..._.pick(this.props, clonedPropNames)}
      >
        <TabLayout contextType="modal">
          <TabLayoutSidebar>
            <RunSelectionFilter
              userId={userId}
            />
          </TabLayoutSidebar>
          <CommonRunListView
            id="sortable list"
            selectedRuns={aminoSelectedObject}
            onSelectRows={runManagementStore.setSelectedRuns}
            statusForRuns={runFilterStore.runStatus}
            noColumnFilter
          >
            {makeRunTransferModalColumns()}
          </CommonRunListView>
        </TabLayout>
      </MultiStepModalPane>
    );
  }
}

RunSelectionPane.contextType = StoresContext;

export default observer(RunSelectionPane);
