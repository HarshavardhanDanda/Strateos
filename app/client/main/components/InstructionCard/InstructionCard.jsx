import Classnames from 'classnames';
import Immutable  from 'immutable';
import $          from 'jquery';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';
import ReactDOM   from 'react-dom';
import { ExpandableCard, JSONViewer, Param, TextDescription, Icon } from '@transcriptic/amino';

import { DataTag }                                      from 'main/components/InstructionTags/index';
import { AcousticTransferOp, acousticOperationIsLarge } from 'main/components/instructions/AcousticTransfer';
import MesoscaleSectorS600Card                          from 'main/components/instructions/MesoscaleSectorS600Card';
import LiquidHandleCard                                 from 'main/components/liquid_handle/LiquidHandleCard';
import SolidHandleCard                                  from 'main/components/solid_handle/SolidHandleCard';
import InstHelper                                       from 'main/helpers/Instruction';
import SessionStore                                     from 'main/stores/SessionStore';
import VideoLinks                                       from 'main/components/VideoLinks';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import { getInstructionCardTitle } from 'main/util/InstructionUtil';
import { getInstructionCentricTimeConstraintType, getTimeConstraintIcon } from 'main/util/TimeConstraintUtil';

import {
  AutopickOp,
  AgitateOp,
  BlueWashOp,
  CountCellsOp,
  CoverOp,
  DispenseOp,
  EvaporateOp,
  EnvisionOp,
  FlashFreezeOp,
  FlowAnalyzeOp,
  FlowCytometryOp,
  GelPurifyOp,
  GelSeparateOp,
  IlluminaLibraryPreparationOp,
  IlluminaSequenceOp,
  ImageOp,
  ImagePlateOp,
  IncubateOp,
  LabchipOp,
  LCMRMOp,
  LCMSOp,
  MagneticTransferOp,
  MeasureConcentrationOp,
  MeasureMassOp,
  MeasureVolumeOp,
  MicrowaveOp,
  NMROp,
  OligosynthesizeOp,
  PipetteOp,
  PlasmidPrepOp,
  PressurizeOp,
  ProvisionOp,
  SangerSequenceOp,
  SealOp,
  SimpleOp,
  SonicateOp,
  SPEOp,
  SpectrophotometryOp,
  SpinOp,
  SpreadOp,
  StampOp,
  ThermocycleOp,
  UncoverOp,
  UnknownOp,
  GenericTaskOp
} from './Ops';

import ContainerTags from './ContainerTags';
import ExecutionTime from './ExecutionTime';

import './InstructionCard.scss';

class InstructionCard extends React.Component {

  static get propTypes() {
    return {
      instruction:        PropTypes.instanceOf(Immutable.Map).isRequired,
      pathInstructionId:  PropTypes.string,
      run:                PropTypes.instanceOf(Immutable.Map).isRequired,
      showAdminInfo:      PropTypes.bool,
      warpEventErrors:    PropTypes.instanceOf(Immutable.Iterable),
      displayText:        PropTypes.string,
      expanded:           PropTypes.bool,
      instructionNumber:              PropTypes.number.isRequired,
      parentInstructionNumber:        PropTypes.number,
      showTimeConstraint: PropTypes.bool
    };
  }

  constructor(props) {
    super(props);

    this.operation = {
      absorbance: SpectrophotometryOp,
      acoustic_transfer: AcousticTransferOp,
      agitate: AgitateOp,
      autopick: AutopickOp,
      count_cells: CountCellsOp,
      cover: CoverOp,
      dispense: DispenseOp,
      envision: EnvisionOp,
      evaporate: EvaporateOp,
      flash_freeze: FlashFreezeOp,
      flow_analyze: FlowAnalyzeOp,
      flow_cytometry: FlowCytometryOp,
      fluorescence: SpectrophotometryOp,
      gel_purify: GelPurifyOp,
      gel_separate: GelSeparateOp,
      illumina_library_preparation: IlluminaLibraryPreparationOp,
      illumina_sequence: IlluminaSequenceOp,
      image: ImageOp,
      image_plate: ImagePlateOp,
      incubate: IncubateOp,
      labchip: LabchipOp,
      lcmrm: LCMRMOp,
      lcms: LCMSOp,
      liquid_handle: LiquidHandleCard,
      luminescence: SpectrophotometryOp,
      magnetic_transfer: MagneticTransferOp,
      maxiprep: PlasmidPrepOp,
      measure_concentration: MeasureConcentrationOp,
      measure_mass: MeasureMassOp,
      measure_volume: MeasureVolumeOp,
      mesoscale_sectors600: MesoscaleSectorS600Card,
      microwave: MicrowaveOp,
      miniprep: PlasmidPrepOp,
      nmr: NMROp,
      oligosynthesize: OligosynthesizeOp,
      pipette: PipetteOp,
      pressurize: PressurizeOp,
      provision: ProvisionOp,
      sanger_sequence: SangerSequenceOp,
      seal: SealOp,
      solid_handle: SolidHandleCard,
      sonicate: SonicateOp,
      spin: SpinOp,
      spe: SPEOp,
      spread: SpreadOp,
      stamp: StampOp,
      thermocycle: ThermocycleOp,
      uncover: UncoverOp,
      unseal: SimpleOp,
      x_blue_wash: BlueWashOp,
      generic_task: GenericTaskOp
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.instruction.get('id') != this.props.instruction.get('id')) return true;
    if (nextProps.expanded != this.props.expanded) return true;
    if (nextProps.pathInstructionId != this.props.pathInstructionId) return true;
    if (nextProps.showAdminInfo != this.props.showAdminInfo) return true;

    const instructionHasChanged = !_.isEqual(nextProps.instruction, this.props.instruction);
    const displayTextHasChanged = nextProps.displayText !== this.props.displayText;
    const warpErrorsChanged = nextProps.warpEventErrors != this.props.warpEventErrors;

    return instructionHasChanged || displayTextHasChanged || warpErrorsChanged;
  }

  componentDidUpdate() {
    if (this.props.instruction.get('id') && this.props.pathInstructionId === this.props.instruction.get('id')) {
      // eslint-disable-next-line react/no-find-dom-node
      const position = $(ReactDOM.findDOMNode(this.domNode)).offset().top - 50;

      window.scrollTo(0, position);
    }
  }

  containsWarpEventErrors() {
    if (!this.props.warpEventErrors) {
      return false;
    }

    const firstWarpWithError = this.props.instruction.get('warps').find((warp) => {
      const err = this.props.warpEventErrors.find((warpError) => {
        return warp.get('id') === warpError.get('warp_id');
      });
      return err != undefined;
    });

    return firstWarpWithError != undefined;
  }

  getInstructionNumberText() {
    const { parentInstructionNumber, instructionNumber } = this.props;
    if (!_.isUndefined(parentInstructionNumber)) {
      return `${parentInstructionNumber}.${instructionNumber}`;
    }

    return `${instructionNumber}.`;
  }

  getTimeConstraintType() {
    const { run, instruction } = this.props;
    const timeConstraints = run && run.get('time_constraints');
    const sequence_no = instruction.get('sequence_no');
    if (!_.isEmpty(timeConstraints)) {
      return getInstructionCentricTimeConstraintType(sequence_no);
    }
  }

  expandableCardHead(instruction) {
    const instructionTitle = getInstructionCardTitle(instruction.get('operation'));
    const timeConstraintType = this.props.showTimeConstraint && this.getTimeConstraintType();

    return (
      <div className="instruction-card__head">
        <div className="instruction-card__title-wrapper">
          { this.props.instructionNumber &&
            <TextDescription tag="span" className="instruction-card__title-index"> {this.getInstructionNumberText()} </TextDescription>
          }
          { timeConstraintType && (
            <Icon
              icon={`fa-regular ${getTimeConstraintIcon(timeConstraintType)}`}
              className="instruction-card__time-constraint-icon"
            />
          )}
          <TextDescription heavy tag="span">

            {instructionTitle && instructionTitle.toUpperCase()}
            <If condition={instruction.get('operation').get('task_label') !== undefined}>
              <span className="instruction-card__label">
                {instruction.get('operation').get('task_label')}
              </span>
            </If>
            <If condition={(SessionStore.isAdmin() || AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)) && instruction.get('completed_by_human')}>
              <i className="fa fa-user instruction-card__title--human-executed" />
            </If>
            <If condition={this.props.showAdminInfo}>
              <TextDescription className="instruction-card__title--small" tag="span" color="secondary">{instruction.get('id')}</TextDescription>
            </If>
            <If condition={this.containsWarpEventErrors()}>
              <span className="instruction-card__title--error">warp error</span>
            </If>
          </TextDescription>
        </div>
        <div className="instruction-card__head-content">
          <If condition={this.props.displayText}>
            <div className="display-text">{this.props.displayText}</div>
          </If>
          <ContainerTags instruction={instruction} run={this.props.run} />
          <If condition={instruction.getIn(['operation', 'dataref'])}>
            <div className="instruction-card__head-data-section">
              <h4 className="tx-type--heavy">Data</h4>
              <div className="instruction-card__head-data">
                <DataTag refName={instruction.getIn(['operation', 'dataref'])} />
                <If condition={(SessionStore.isAdmin() || AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)) && instruction.getIn(['dataset', 'attachments'])}>
                  <span><i className="far fa-check" /> uploaded</span>
                </If>
              </div>
            </div>
          </If>
        </div>
      </div>
    );
  }

  expandableCardBody(instruction, operation) {
    const instructionJS = instruction.toJS();

    // operation must be capitalized for JSX conversion to work correctly.
    const Operation = operation;
    const op = instruction.getIn(['operation', 'op']);

    return (
      <div className="instruction-card__body">
        <div className="instruction-card__operation">
          <Operation instruction={instructionJS} run={this.props.run} />
        </div>
        <ul className="params">
          <If
            condition={
              instruction.get('completed_at') != undefined ||
              (this.props.instruction.get('warps') != undefined
                ? this.props.instruction.get('warps').size
                : undefined)
            }
          >
            <ExecutionTime instruction={instructionJS} />
          </If>
          <If
            condition={
              (SessionStore.isAdmin() || AcsControls.isFeatureEnabled(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE)) &&
              instruction.get('completed_at') &&
              instruction.get('warps').size > 0
            }
          >
            <Param
              label="Video"
              value={<VideoLinks instruction={instructionJS} />}
            />
          </If>
          <If condition={this.shouldRenderRawOperation(instruction.get('operation'))}>
            <JSONViewer
              json={instructionJS.operation}
              collapsedText={`{ "op": "${op}", … }`}
              startExpanded={this.operation[op] == undefined}
              heading="Raw"
            />
          </If>
        </ul>
      </div>
    );
  }

  shouldRenderRawOperation(operation) {
    if (operation.get('op') === 'acoustic_transfer') {
      return !acousticOperationIsLarge(operation.toJS());
    } else {
      return true;
    }
  }

  collapse() {
    this.domNode.setState({ expanded: false });
  }

  render() {
    let errorBorder;
    const { instruction, expanded } = this.props;
    const op = instruction.getIn(['operation', 'op']);
    const operation = this.operation[op] != undefined ? this.operation[op] : UnknownOp;

    if (instruction.get('id') && this.props.pathInstructionId === instruction.get('id')) {
      errorBorder = true;
    }

    return (
      <ExpandableCard
        className={Classnames(
          'instruction-card',
          op,
          { errorBorder: errorBorder != undefined },
          InstHelper.getCompletionStatusFromInstruction(instruction)
        )}
        ref={(node) => { this.domNode = node; }}
        cardHead={this.expandableCardHead(instruction)}
        cardBody={() => this.expandableCardBody(instruction, operation)}
        expanded={expanded}
      />
    );
  }
}

export default InstructionCard;
