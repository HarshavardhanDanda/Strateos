import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { Select, Button } from '@transcriptic/amino';
import AdminActions from 'main/actions/AdminActions';

class SubscribersEdit extends React.Component {

  static get propTypes() {
    return {
      onChangeSelectedAdminId: PropTypes.func.isRequired,
      candidateSubscribers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      subscribedAdmins: PropTypes.instanceOf(Immutable.Iterable).isRequired,
      selectedAdminId: PropTypes.string.isRequired,
      subdomain: PropTypes.string.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.add = this.add.bind(this);
  }

  add() {
    this.props.onChangeSelectedAdminId('');
    AdminActions.createSubscriber(this.props.subdomain, this.props.selectedAdminId);
  }

  destroy(id) {
    AdminActions.destroySubscriber(this.props.subdomain, id);
  }

  selectOptions() {
    return this.props.candidateSubscribers.map(a => ({
      value: a.get('id'),
      name: `${a.get('name')} <${a.get('email')}>`
    })).toJS();
  }

  render() {
    const disabled = !this.props.candidateSubscribers.size;

    return (
      <div>
        <h3>Available Subscribers</h3>
        <div className="row">
          <div className="col-sm-10">
            <Select
              value={this.props.selectedAdminId}
              disabled={disabled}
              options={this.selectOptions()}
              onChange={e => this.props.onChangeSelectedAdminId(e.target.value)}
            />
          </div>
          <div className="col-sm-2">
            <Button
              type="primary"
              disabled={disabled}
              onClick={this.add}
            >
              Add
            </Button>
          </div>
        </div>
        <h3>Current Subscribers</h3>
        <div className="row">
          <div className="col-sm-12">
            <ul className="list-group">
              {this.props.subscribedAdmins.map((a) => {
                return (
                  <li className="list-group-item" key={a.get('id')}>
                    <span>
                      {a.get('email')}
                    </span>
                    <div className="pull-right">
                      <Button
                        size="small"
                        height="short"
                        type="danger"
                        onClick={() => this.destroy(a.get('id'))}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default SubscribersEdit;
