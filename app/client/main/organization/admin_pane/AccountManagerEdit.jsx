import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import { Select, Button } from '@transcriptic/amino';

class AccountManagerEdit extends React.Component {

  static get propTypes() {
    return {
      admins:                PropTypes.instanceOf(Immutable.Iterable).isRequired,
      initialAccountManager: PropTypes.string,
      saveOrganization:      PropTypes.func.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      accountManager: props.initialAccountManager,
      saving: false
    };

    this.save = this.save.bind(this);
  }

  save(cb) {
    this.props.saveOrganization('account_manager_id', this.state.accountManager).always(cb);
  }

  selectOptions() {
    return this.props.admins.map((admin) => {
      return {
        name: `${admin.get('name')} <${admin.get('email')}>`,
        value: admin.get('id')
      };
    }).toJS();
  }

  render() {
    return (
      <div>
        <h3>Account Manager</h3>
        <div className="row">
          <div className="col-sm-10">
            <Select
              value={this.state.accountManager}
              options={this.selectOptions()}
              onChange={e => this.setState({ accountManager: e.target.value })}
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

export default AccountManagerEdit;
