import _ from 'lodash';
import React from 'react';
import { SinglePaneModal } from 'main/components/Modal';
import './MixtureModal.scss';
import { Column, Table, KeyValueList, TextLabel } from '@transcriptic/amino';
import Immutable from 'immutable';
import ResourceStore from 'main/stores/ResourceStore';
import { hasInformaticsOfProvisionMixture, PROVISION_MIXTURE } from 'main/util/InstructionUtil.js';

export interface ProvisionInstructionProps {
  operation: {
    informatics?: {
      type: typeof PROVISION_MIXTURE;
      data: {
        mixture_id: string;
        volume_to_provision: string;
        total_volume: string;
      };
    }[];
    resource_id: string;
    op: string;
  };
}

interface Props {
  modalId: string;
  provisionInstructions: Immutable.List<ProvisionInstructionProps>;
  mixtureName: string;
  mixtureId: string;
}

function MixtureModal(props:Props) {

  const provision_mixture_instructions = props.provisionInstructions
    .toJS()
    .filter(
      (provisionInstruction) =>
        hasInformaticsOfProvisionMixture(provisionInstruction) &&
        provisionInstruction?.operation?.informatics?.[0]?.data?.mixture_id ===
          props.mixtureId
    );

  const firstProvisionMixtureInstructionInformatics =
    provision_mixture_instructions[0].operation.informatics[0];

  const renderVolumeToProvision = (instruction) => {
    const { operation } = instruction.toJS();
    const informatics = operation?.informatics?.[0]?.data;
    return informatics?.volume_to_provision;
  };

  const renderResourceId = (instruction) => {
    return instruction.getIn(['operation', 'resource_id']);
  };

  const renderResourceName = (instruction) => {
    const resourceId = instruction.getIn(['operation', 'resource_id']);
    return ResourceStore.getById(resourceId)?.get('name') || '-';
  };

  return (
    <SinglePaneModal
      modalId={props.modalId}
      title="Mixture Information"
      modalBodyClass="mixture-modal"
      modalSize="large"
    >
      <div className="mixture-modal__mixture-body">
        <div className="mixture-modal__element">
          <KeyValueList
            entries={[
              {
                key: 'Mixture Name',
                value: props.mixtureName,
              },
              {
                key: 'Mixture ID',
                value:
                  firstProvisionMixtureInstructionInformatics.data.mixture_id,
              },
            ]}
            primaryKey
          />
        </div>
        <div className="mixture-modal__element">
          <KeyValueList
            entries={[
              {
                key: 'Total Volume',
                value:
                  firstProvisionMixtureInstructionInformatics.data.total_volume,
              },
            ]}
            primaryKey
          />
        </div>
      </div>
      <div className="mixture-modal__resource-table">
        <TextLabel
          heavy
          tag="h4"
          branded={false}
          className="mixture-modal__resource-label"
        >
          Resources
        </TextLabel>
        <Table
          data={Immutable.fromJS(provision_mixture_instructions)}
          type={'secondary'}
          loaded
          disabledSelection
        >
          <Column
            header="ID"
            id="id-column"
            renderCellContent={renderResourceId}
          />
          <Column
            header="NAME"
            id="name-column"
            renderCellContent={renderResourceName}
          />
          <Column
            header="QUANTITY"
            id="quantity-column"
            renderCellContent={renderVolumeToProvision}
          />
        </Table>
      </div>
    </SinglePaneModal>
  );
}

export default MixtureModal;
