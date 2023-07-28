import React from 'react';
import Classnames from 'classnames';

import { ExpandableCard, Card, TextDescription } from '@transcriptic/amino';
import ManageInstruction from 'main/lab/PrimeDirective/ManageInstruction';
import InstHelper from 'main/helpers/Instruction';
import ContainerTags from 'main/components/InstructionCard/ContainerTags';
import { DataTag } from 'main/components/InstructionTags/index';
import SessionStore from 'main/stores/SessionStore';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import getDatasetFromRun from 'main/util/DatasetUtil';

import './GenericInstructionStep.scss';
import 'main/lab/PrimeDirective/ManageInstruction/ManageInstruction.scss';

function GenericInstruction(props) {
  const { instruction, run, showAdminInfo, instructionNumber } = props;
  const operation = instruction.get('operation');
  const dataset = getDatasetFromRun(run, instruction.get('id'));

  const getCardHead = () => {
    const taskLabel = operation.get('task_label');
    return (
      <div className="instruction-card__head generic-instruction__head">
        <div className="instruction-card__title-wrapper">
          {props.instructionNumber && (
            <TextDescription
              tag="span"
              className="generic-instruction-step__title-index"
            >
              {props.instructionNumber}.
            </TextDescription>
          )}
          <TextDescription heavy tag="span">
            {taskLabel && taskLabel.toUpperCase()}
            {showAdminInfo && (
              <TextDescription
                className="instruction-card__title--small"
                tag="span"
                color="secondary"
              >
                {instruction.get('id')}
              </TextDescription>
            )}
          </TextDescription>
        </div>
        <div className="instruction-card__head-content">
          <ContainerTags instruction={instruction} run={run} />
          {instruction.getIn(['operation', 'dataref']) && (
            <div className="instruction-card__head-data-section">
              <h4 className="tx-type--heavy">Data</h4>
              <div className="instruction-card__head-data">
                <DataTag
                  refName={instruction.getIn(['operation', 'dataref'])}
                />
                {(SessionStore.isAdmin() ||
                  AcsControls.isFeatureEnabled(
                    FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE
                  )) &&
                  dataset &&
                  dataset.get('attachments') && (
                    <span className="instruction-card__uploaded">
                      <i className="far fa-check" /> uploaded
                    </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getCardBody = () => {
    const steps: string[] = operation.get('steps');

    if (steps) {
      return (
        <>
          {steps.map((step, currentIndex) => {
            return (
              <Card
                className="generic-instruction-step"
                key={`${step}-${currentIndex}`}
              >
                <div className="generic-instruction-step__head">
                  <TextDescription
                    tag="span"
                    className="generic-instruction-step__title-index"
                  >
                    {instructionNumber}.{currentIndex + 1}
                  </TextDescription>
                  <TextDescription
                    heavy
                    tag="span"
                    className="generic-instruction-step__title"
                  >
                    {step}
                  </TextDescription>
                </div>
              </Card>
            );
          })}
        </>
      );
    }

    return <></>;
  };

  return (
    <div className="generic-instruction manage-instruction">
      <ExpandableCard
        className={Classnames(
          'instruction-card instruction-card-container',
          InstHelper.getCompletionStatusFromInstruction(instruction)
        )}
        cardHead={getCardHead()}
        cardBody={getCardBody()}
      />
      <ManageInstruction {...props} showOnlyActions allowManual />
    </div>
  );
}

export default GenericInstruction;
