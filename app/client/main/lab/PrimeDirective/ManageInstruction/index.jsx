import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import startsWith from 'underscore.string/startsWith';
import _ from 'lodash';
import { Tooltip, Icon } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import FlowAnalyzeUploader from 'main/lab/PrimeDirective/ManageInstruction/FlowAnalyzeUploader';
import GelPurifyInstructionButton from 'main/lab/PrimeDirective/ManageInstruction/GelPurifyInstructionButton';
import InstructionDataUpload from 'main/lab/PrimeDirective/ManageInstruction/InstructionDataUpload';
import MeasureDataUploader from 'main/lab/PrimeDirective/ManageInstruction/MeasureDataUploader';
import ProvisionAction from 'main/lab/PrimeDirective/ManageInstruction/ProvisionAction';
import InstructionCard from 'main/components/InstructionCard';
import ResourceStore from 'main/stores/ResourceStore';
import getDatasetFromRun from 'main/util/DatasetUtil';
import Urls from 'main/util/urls';
import AcsControls from 'main/util/AcsControls';
import ajax from 'main/util/ajax';

import './ManageInstruction.scss';
import AliquotActions from 'main/actions/AliquotActions';
import ContainerActions from 'main/actions/ContainerActions';
import RefAPI from 'main/api/RefAPI';
/*
Manage the execution of an instruction -- submit to TCLE, undo, upload data, etc.
*/
class ManageInstruction extends React.Component {
  static get propTypes() {
    return {
      instruction: PropTypes.instanceOf(Immutable.Map),
      allowManual: PropTypes.bool,
      isMarkAllCompleteInProgress: PropTypes.bool,
      completionSnapshot: PropTypes.object,
      provisionSpecs: PropTypes.instanceOf(Immutable.Iterable),
      onComplete: PropTypes.func,
      onUndo: PropTypes.func,
      onSelect: PropTypes.func,
      selectedForWorkcell: PropTypes.bool,
      onInstructionChange: PropTypes.func,
      humanExecuted: PropTypes.bool,
      onToggleHuman: PropTypes.func,
      run: PropTypes.instanceOf(Immutable.Map),
      workcellsAvailable: PropTypes.bool,
      showOnlyActions: PropTypes.bool,
      instructionNumber: PropTypes.number.isRequired,
      parentInstructionNumber: PropTypes.number
    };
  }

  static get defaultProps() {
    return {
      workcellsAvailable: true,
      completionSnapshot: {}
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      inProgress: false,
      containerIds: [],
      xhr: undefined
    };
    this.manualCompleteSingly = _.debounce(ajax.singly(), 500);
    _.bindAll(
      this,
      'onClickManualComplete'
    );
  }

  componentDidMount() {
    const group = this.props.instruction;
    const op = group.getIn(['operation', 'op']);
    if (op == 'generic_task' && group.getIn(['operation', 'containers'])) {
      RefAPI.indexAll({
        filters: {
          name: Array.from(group.getIn(['operation', 'containers']).values()).join(),
          run_id: group.get('run_id')
        }
      }).done(result => {
        const finalResults = this.mergeResults(result);
        const containerIds = finalResults ? finalResults.map(refData => (refData.attributes.container_id)) : [];
        ContainerActions.loadManyContainers(containerIds);
        this.setState({
          containerIds: containerIds
        });
      });
    }
  }

  componentDidUpdate() {
    if (this.props.isMarkAllCompleteInProgress &&
      this.isManualCompleting(this.props.instruction) &&
      !this.state.inProgress
    ) {
      this.onClickManualComplete(this.props.instruction);
    }
  }

  componentWillUnmount() {
    if (this.state.inProgress) {
      if (this.state.xhr && this.state.xhr.abort) {
        this.state.xhr.abort();
      }
    }
  }

  mergeResults(results) {
    const mergeResults = [];
    results.map((ref) => ref.data).forEach((data) => {
      data.forEach((v) => {
        mergeResults.push(v);
      });
    });
    return mergeResults;
  }

  onNavigateRef(refName) {
    window.location.href = Urls.run_ref(
      this.props.run.getIn(['project', 'id']),
      this.props.run.get('id'),
      refName
    );
  }

  getProvisionSpec() {
    return this.props.provisionSpecs.find((ps) => {
      return ps.get('instruction_id') === this.props.instruction.get('id');
    });
  }

  showProvisionAction() {
    const inst = this.props.instruction;

    const op = inst.getIn(['operation', 'op']);

    // show provision action for provision and dispense
    return op === 'provision' || (op === 'dispense' && inst.getIn(['operation', 'resource_id']));
  }

  resourceName() {
    const resourceId = this.props.instruction.getIn(['operation', 'resource_id']);
    const resource = ResourceStore.getById(resourceId);
    if (resource) {
      return resource.get('name');
    } else {
      return resourceId;
    }
  }

  attachDataComponents(ins) {
    const op = ins.getIn(['operation', 'op']);

    if (op === 'flow_analyze') {
      return (
        <FlowAnalyzeUploader
          run={this.props.run}
          instruction={ins}
          dataset={getDatasetFromRun(this.props.run, ins.get('id'))}
          onInstructionUpdate={this.props.onInstructionChange}
        />
      );
    } else if (op === 'count_cells') {
      return (
        <MeasureDataUploader
          run={this.props.run}
          instruction={ins}
          dataset={getDatasetFromRun(this.props.run, ins.get('id'))}
          onInstructionUpdate={this.props.onInstructionChange}
        />
      );
    } else if (startsWith(op, 'measure')) {
      return (
        <MeasureDataUploader
          run={this.props.run}
          instruction={ins}
          dataset={getDatasetFromRun(this.props.run, ins.get('id'))}
          onInstructionUpdate={this.props.onInstructionChange}
        />
      );
    } else if (ins.get('data_name')) {
      return (
        <InstructionDataUpload
          instruction={ins}
          dataset={getDatasetFromRun(this.props.run, ins.get('id'))}
          onInstructionChange={this.props.onInstructionChange}
        />
      );
    }

    return undefined;
  }

  isManualCompleting(instruction) {
    return instruction.get('id') === this.props.completionSnapshot.nextToComplete;
  }

  onClickManualComplete(instruction) {
    this.setState({
      inProgress: true,
      xhr: this.props.onComplete
    });
    this.manualCompleteSingly(() => {
      return this.props.onComplete(instruction.get('id'))
        .always(() => {
          this.setState({ inProgress: false });
          if (this.instructionCard && this.instructionCard.collapse) {
            this.instructionCard.collapse();
          }
          this.manualCompleteSingly = _.debounce(ajax.singly(), 500);
        });
    });
  }

  renderActions() {
    const ins = this.props.instruction;
    const op = ins.getIn(['operation', 'op']);
    const containerColumns = ['status', 'contents', 'condition', 'barcode', 'Last used', 'code', 'organization', 'run', 'creator', 'lab', 'empty mass', 'location', 'hazards'];

    return (
      <If condition={AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)}>
        <div className="actions">
          {op === 'generic_task' && this.state.containerIds && (
          <button
            className="manage-instruction__download-wrapper"
            onClick={() => AliquotActions.downloadCSV(this.state.containerIds, containerColumns)}
          >
            <Tooltip
              title="Download container and aliquot properties."
              placement="left"
            >
              <Icon icon="fa fa-download manage-instruction__download-icon" color="inherit" />
            </Tooltip>
          </button>
          )}
          <If condition={op === 'gel_purify'}>
            <Tooltip title="Operator directions" placement="top">
              <GelPurifyInstructionButton instruction={ins} run={this.props.run} />
            </Tooltip>
          </If>
          {/* Components for attaching data to this instruction */}
          {this.attachDataComponents(ins)}

          <If condition={this.showProvisionAction()}>
            <ProvisionAction
              runId={this.props.run.get('id')}
              refs={this.props.run.get('refs')}
              instruction={ins}
              provisionSpec={this.getProvisionSpec()}
              completed={!!ins.get('completed_at')}
            />
          </If>

          <Choose>
            <When condition={!ins.get('completed_at')}>
              {[
                <div
                  className={`lab-checkbox ${this.props.humanExecuted || op === 'generic_task' ? 'checked' : ''}`}
                  key="human_executed"
                  onClick={e => { op === 'generic_task' ? undefined : this.props.onToggleHuman(ins, e); }}
                >
                  <Tooltip
                    placement="left"
                    title={op === 'generic_task' ?
                      'This instruction will be completed manually rather than by robotics or instruments' :
                      'Select this action to indicate the instruction will be completed manually rather than by robotics or instruments'}
                  >
                    <Icon icon="fa fa-user" color="inherit" />
                  </Tooltip>
                </div>,
                this.props.workcellsAvailable && (
                  <div
                    className={`lab-checkbox ${this.props.selectedForWorkcell ? 'checked' : ''}`}
                    key="selected_for_workcell"
                    onClick={(e) => this.props.onSelect(ins, e)}
                  >
                    <Tooltip
                      placement="left"
                      title="Select this instruction to be sent for scheduling, you can select more than one instruction"
                    >
                      <Icon icon="fa fa-cog" color="inherit" />
                    </Tooltip>
                  </div>
                )
              ]}
            </When>
            <Otherwise>
              <div
                className="lab-checkbox"
                key="undo_instruction"
                onClick={() => {
                  this.props.onUndo(ins.get('id'));
                }}
              >
                <Tooltip
                  title={
                      'Undo this instruction. This simply sets completed_at to nil, it does not undo aliquot effects.'
                    }
                  placement="left"
                >
                  <Icon icon="fa fa-undo" color="inherit" />
                </Tooltip>
              </div>
            </Otherwise>
          </Choose>

          { !ins.get('completed_at') && (
            <div
              onClick={() => {
                if (!this.props.allowManual) {
                  return alert('Allow manual completion to enable this button');
                }
                return undefined;
              }}
            >
              <button
                className={`lab-checkbox ${ins.get('completed_at') ? 'checked' : ''}`}
                disabled={!this.props.allowManual}
                onClick={() => this.onClickManualComplete(ins)}
              >
                <Choose>
                  <When condition={
                    this.state ? (this.state.inProgress || this.props.isMarkAllCompleteInProgress)
                      : undefined}
                  >
                    <Icon icon="fa fa-spinner fa-spin" color="inherit" />

                  </When>
                  <Otherwise>
                    <Tooltip
                      placement="left"
                      title="Manually mark this instruction as Complete, this can't be undone"
                    >
                      <Icon icon="fa fa-check" color="inherit" />
                    </Tooltip>
                  </Otherwise>
                </Choose>
              </button>
            </div>
          )}
        </div>
      </If>

    );
  }

  render() {
    let ins = this.props.instruction;

    const op = ins.getIn(['operation', 'op']);

    // GROSS SUPER HACK
    // When datasets are created by attaching a file and uploading,
    // we either need to inject that into the dataset list within the run,
    // or start using stores to fetch the datasets and runs separately.
    //
    // We don't do either since the uploading happens in InstructionDataUpload component,
    // which doesn't have a handle to mutating the run, only to mutating the instruction.
    // Sadly, we would need to pass down an onRunChange all the way down similar to the kludge of
    // passing onInstructionChange everywhere.
    //
    // For this reason, we act stupidly and the Dataset Controller just injects the created
    // dataset into the instruction.  So now the InstructionCard looks inside the instruction
    // for a dataset.  We also only want to inject the dataset from the run if the instruction doesn't have it.
    //
    // What a shitshow.
    const dataset = getDatasetFromRun(this.props.run, ins.get('id'));
    if (!ins.get('dataset') && dataset) {
      ins = ins.set('dataset', dataset);
    }

    if (this.props.showOnlyActions) {
      return (
        <div>
          {this.renderActions()}
        </div>
      );
    }

    return (
      <div className="manage-instruction" key={ins.get('sequence_no')}>
        <div className="instruction-card-container">
          <InstructionCard
            ref={(instructionCard) => {
              this.instructionCard = instructionCard;
            }}
            parentInstructionNumber={this.props.parentInstructionNumber}
            instructionNumber={this.props.instructionNumber}
            instruction={ins}
            run={this.props.run}
            showAdminInfo
            displayText={op === 'provision' ? `${this.resourceName()}` : undefined}
            onNavigateRef={(refName) => this.onNavigateRef(refName)}
            showTimeConstraint
          />
        </div>
        {this.renderActions()}
      </div>
    );
  }
}

export default ManageInstruction;
