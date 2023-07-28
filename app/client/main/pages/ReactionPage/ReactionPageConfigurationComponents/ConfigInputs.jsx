import React from 'react';
import {
  LabeledInput,
  TextInput,
  Select,
  RadioGroup,
  Radio,
  InputWithUnits,
  TagInput,
  Icon,
  Validated,
} from '@transcriptic/amino';
import './ConfigInputs.scss';

export function Amount({ reactionDetails, handleChange }) {
  const amount = reactionDetails.amount.replace(':milliliter', '');
  const error = (amount === '' || Number(amount) <= 0) ? 'Please specify a valid amount' : '';
  return (
    <LabeledInput label="Amount">
      <Validated error={error}>
        <InputWithUnits
          value={`${reactionDetails.amount}:milliliter`}
          name="amount"
          dimension="volume"
          onChange={(e) => handleChange(e)}
          fullWidth
        />
      </Validated>
    </LabeledInput>
  );
}

export function Temperature({ reactionDetails, handleChange }) {
  return (
    <LabeledInput label="Temperature">
      <Select
        value={reactionDetails.temperature}
        options={[
          { value: 'Ambient', name: 'Ambient' },
          { value: '4˚c', name: '4˚c' },
          { value: '-20˚c', name: '-20˚c' },
          { value: '-80˚c', name: '-80˚c' },
        ]}
        name="temperature"
        fullWidth
        onChange={(e) => handleChange(e)}
      />
    </LabeledInput>
  );
}

export function ContainerType({ reactionDetails }) {
  return (
    <LabeledInput label="Container type">
      <TagInput fullWidth disabled>
        {reactionDetails.containerType.map(type => (
          <TagInput.Tag key={type}>
            <div className="container-type--tag">
              <Icon
                icon="far fa-vial"
                size="small"
                color="invert"
                className="container-type--tag--icon"
              />
              {type}
            </div>
          </TagInput.Tag>
        ))}
      </TagInput>
    </LabeledInput>
  );
}

export function TextField({ placeholder }) {
  return (
    <TextInput placeholder={placeholder} disabled fullWidth={false} />
  );
}

export function ReceiveExcess({ reactionDetails, handleChange }) {
  return (
    <LabeledInput label="Excess amount">
      <RadioGroup
        name="receiveExcess"
        value={reactionDetails.receiveExcess}
        onChange={(e) => handleChange(e)}
      >
        <Radio id="yes" name="yes" value="yes" label="Yes, please ship to address" />
        <Radio id="no" name="no" value="no" label="No, discard excess" />
      </RadioGroup>
    </LabeledInput>
  );
}

export function Concentration({ reaction }) {
  return (
    <InputWithUnits
      value={`${reaction.concentration}:millimole/liter`}
      name="amount"
      dimension="amount_concentration"
      disabled
      fullWidth={false}
    />
  );
}
