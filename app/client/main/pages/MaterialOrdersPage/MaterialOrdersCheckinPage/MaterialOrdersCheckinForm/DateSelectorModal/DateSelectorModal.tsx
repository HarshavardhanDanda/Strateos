import React, { useState } from 'react';
import { DatePicker, LabeledInput } from '@transcriptic/amino';

import { SinglePaneModal } from 'main/components/Modal';

interface Props {
  onSelect: (date: Date) => void;
}

function DateSelectorModal(props: Props) {
  const [selectedDate, setSelectedDate] = useState(null);

  const resetSelect = () => {
    setSelectedDate(null);
  };

  const onAccept = () => {
    const { onSelect } = props;

    onSelect(selectedDate);
  };

  const modalTitle = 'Select expiration date';

  return (
    <SinglePaneModal
      title={modalTitle}
      modalSize="medium"
      modalId={DateSelectorModal.MODAL_ID}
      onAccept={onAccept}
      postDismiss={resetSelect}
    >
      <LabeledInput label="Date">
        <DatePicker
          date={selectedDate}
          inline
          onChange={(event) => {
            setSelectedDate(event.target.value.date);
          }}
        />
      </LabeledInput>
    </SinglePaneModal>
  );
}

DateSelectorModal.MODAL_ID = 'DATE_SELECTOR_MODAL';

export default DateSelectorModal;
