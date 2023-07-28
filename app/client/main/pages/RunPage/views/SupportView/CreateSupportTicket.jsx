import PropTypes from 'prop-types';
import React     from 'react';

import { Form, Button, TextArea } from '@transcriptic/amino';

function CreateSupportTicket(props) {
  return (
    <Form onSubmit={(formData, clearForm) => props.onCreateSupportTicket(formData, clearForm)}>
      <div className="clearfix">
        <h2>Submit Ticket</h2>
        <TextArea
          id="message"
          name="message"
        />
        <div className="pull-right">
          <Button
            type="primary"
            isSubmit
          >
            Submit
          </Button>
        </div>
      </div>
    </Form>
  );
}

CreateSupportTicket.propTypes = {
  onCreateSupportTicket: PropTypes.func
};

export default CreateSupportTicket;
