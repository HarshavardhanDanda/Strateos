import React, { useState } from 'react';
import { LabeledInput, TextInput } from '@transcriptic/amino';

import { SinglePaneModal } from 'main/components/Modal';

interface Props {
  onSelect: (lotNumber: string) => void;
}

function LotNumberSelectorModal(props: Props) {
  const [lotNumber, setLotNumber] = useState(null);

  const resetSelect = () => {
    setLotNumber(null);
  };

  const onAccept = () => {
    const { onSelect } = props;

    onSelect(lotNumber);
  };

  const modalTitle = 'Input lot number';

  return (
    <SinglePaneModal
      title={modalTitle}
      modalSize="small"
      modalId={LotNumberSelectorModal.MODAL_ID}
      onAccept={onAccept}
      postDismiss={resetSelect}
    >
      <LabeledInput label="Lot number">
        <TextInput
          autoFocus
          value={lotNumber}
          onChange={event => {
            setLotNumber(event.target.value);
          }}
        />
      </LabeledInput>
    </SinglePaneModal>
  );
}

LotNumberSelectorModal.MODAL_ID = 'LOT_NUMBER_SELECTOR_MODAL';

export default LotNumberSelectorModal;
