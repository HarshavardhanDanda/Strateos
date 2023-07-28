import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@transcriptic/amino';

// Submits the reaction
export default function SubmitButton(props) {
  return (
    <Button
      size="small"
      waitForAction
      disabled={props.disabled}
      label={props.label}
      labelPlacement="top"
      onClick={(cb) => {
        props.setSubmitting();
        props.ReactionAPI.createRun(props.reactionId)
          .then(
            () => {
              cb();
              props.onSuccess();
            },
            (reason) => {
              cb();
              props.onFailure(reason.message);
            }
          );
      }}
    >
      Submit
    </Button>
  );
}

SubmitButton.propsTypes = {
  reactionId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onFailure: PropTypes.func.isRequired,
  ReactionAPI: PropTypes.any.isRequired, // ReactionAPI instance
  disabled: PropTypes.bool.isRequired,
  label: PropTypes.string
};
