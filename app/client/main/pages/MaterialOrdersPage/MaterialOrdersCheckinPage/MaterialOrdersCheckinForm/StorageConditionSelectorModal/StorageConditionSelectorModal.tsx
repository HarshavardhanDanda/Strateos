import React, { useState } from 'react';
import { LabeledInput, Select } from '@transcriptic/amino';

import ContainerStore from 'main/stores/ContainerStore';
import { SinglePaneModal } from 'main/components/Modal';

interface StorageCondition {
  name: string;
  value: string;
}

interface Props {
  onSelect: (storageCondition: StorageCondition) => void;
}

function StorageConditionSelectorModal(props: Props) {
  const [selectedStorageCondition, setSelectedStorageCondition] = useState(null);

  const resetSelect = () => {
    setSelectedStorageCondition(null);
  };

  const onAccept = () => {
    const { onSelect } = props;

    onSelect(selectedStorageCondition);
  };

  const modalTitle = 'Select storage condition';

  return (
    <SinglePaneModal
      title={modalTitle}
      modalSize="medium"
      modalId={StorageConditionSelectorModal.MODAL_ID}
      onAccept={onAccept}
      postDismiss={resetSelect}
    >
      <LabeledInput label="Storage condition">
        <Select
          value={selectedStorageCondition}
          options={ContainerStore.validStorageConditions}
          onChange={(event) => {
            const storageCondition = ContainerStore.validStorageConditions
              .find((condition: StorageCondition) => condition.value === event.target.value);

            setSelectedStorageCondition(storageCondition);
          }}
        />
      </LabeledInput>
    </SinglePaneModal>
  );
}

StorageConditionSelectorModal.MODAL_ID = 'STORAGE_CONDITION_SELECTOR_MODAL';

export default StorageConditionSelectorModal;
