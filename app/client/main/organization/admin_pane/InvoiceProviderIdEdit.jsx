import PropTypes from 'prop-types';
import React     from 'react';

import { TextInput, Button } from '@transcriptic/amino';

export default class InvoiceProviderIdEdit extends React.Component {

  static get propTypes() {
    return {
      initialValue: PropTypes.string.isRequired,
      onSave: PropTypes.func.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      value: props.initialValue,
      saving: false
    };

    this.save = this.save.bind(this);
  }

  save(cb) {
    this.props.onSave('netsuite_customer_id', this.state.value).always(cb);
  }

  render() {
    return (
      <div>
        <h3>NetSuite customer id</h3>
        <div className="row">
          <div className="col-sm-5">
            <TextInput
              placeholder="NetSuite customer id"
              value={this.state.value}
              onChange={e => this.setState({ value: e.target.value })}
            />
          </div>
          <div className="col-sm-2">
            <Button waitForAction type="primary" onClick={this.save}>Save</Button>
          </div>
        </div>
      </div>
    );
  }
}
