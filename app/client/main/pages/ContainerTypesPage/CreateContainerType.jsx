import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, TextArea } from '@transcriptic/amino';
import ContainerTypeAPI from 'main/api/ContainerTypeAPI';
import SessionStore from 'main/stores/SessionStore';
import { SinglePaneModal } from 'main/components/Modal';
import ModalActions from 'main/actions/ModalActions';
import { fromJsonApi } from 'main/util/ajax/Errors/Errors';

// basically just a dumb json editor
function CreateContainerTypeInput({ onSubmit }) {
  const [text, setText] = useState('{}');
  return (
    <div>
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button onClick={() => onSubmit(JSON.parse(text.trim()))}>
        Submit
      </Button>
    </div>
  );
}
CreateContainerTypeInput.propTypes = {
  onSubmit: PropTypes.func.isRequired
};

const MODAL_ID = 'CreateContainerTypeId';
function openModal() {
  ModalActions.open(MODAL_ID);
}
function CreateContainerTypeModal() {
  const [attrsToSubmit, setSubmitting] = useState(undefined);
  const [apiErrors, setErrors] = useState();

  // post container type to server
  useEffect(
    () => {
      if (!attrsToSubmit) {
        return;
      }
      ContainerTypeAPI.create({ attributes: attrsToSubmit })
        .then(() => {
          setErrors();
          alert('Success!');
        })
        .fail(e => setErrors(fromJsonApi(e)))
        .always(() => {
          setSubmitting(undefined);
        });
    },
    [attrsToSubmit]
  );

  function onSubmit(attributes) {
    setErrors();
    setSubmitting(attributes);
  }

  return (
    <SinglePaneModal
      modalId={MODAL_ID}
    >
      <h3>Create New Container Type (enter json)</h3>
      <CreateContainerTypeInput
        onSubmit={onSubmit}
      />
      <If condition={apiErrors}>
        <ul>
          {
            apiErrors.map((e, index) => <li key={`error-${index}`}>{e}</li>)
          }
        </ul>
      </If>
    </SinglePaneModal>
  );
}

function CreateContainerTypeButton() {
  if (!SessionStore.isAdmin()) {
    return null; // eslint-disable-line no-null/no-null
  }

  return (
    <div>
      <Button onClick={openModal}>
        + New
      </Button>
      <CreateContainerTypeModal />
    </div>
  );
}

export { CreateContainerTypeButton, CreateContainerTypeModal };
