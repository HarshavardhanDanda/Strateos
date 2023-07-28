import React, { useState } from 'react';
import { LabeledInput } from '@transcriptic/amino';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import { SinglePaneModal } from 'main/components/Modal';
import ContainerTypeSelector from 'main/components/ContainerTypeSelector';

interface Props {
  onSelect: (containerType) => void;
}

function ContainerTypeSelectorModal(props: Props) {
  const [selectedContainerType, setSelectedContainerType] = useState(null);

  const resetSelect = () => {
    setSelectedContainerType(null);
  };

  const onAccept = () => {
    const { onSelect } = props;

    onSelect(selectedContainerType);
  };

  const modalTitle = 'Select container type';

  return (
    <SinglePaneModal
      title={modalTitle}
      modalSize="medium"
      modalId={ContainerTypeSelectorModal.MODAL_ID}
      onAccept={onAccept}
      postDismiss={resetSelect}
      acceptBtnDisabled={!selectedContainerType}
    >
      <LabeledInput label="Container type">
        <ContainerTypeSelector
          value={selectedContainerType}
          onChange={(event) => {
            const containerType = ContainerTypeStore.getById(event.target.value);

            setSelectedContainerType(containerType);
          }}
        />
      </LabeledInput>
    </SinglePaneModal>
  );
}

ContainerTypeSelectorModal.MODAL_ID = 'CONTAINER_TYPE_SELECTOR_MODAL';

export default ContainerTypeSelectorModal;
