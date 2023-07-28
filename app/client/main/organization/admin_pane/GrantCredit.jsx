import React from 'react';
import _ from 'lodash';

import { LabeledInput, Select, Button, DateSelector, TextInput } from '@transcriptic/amino';

import AdminActions from 'main/actions/AdminActions';
import CreditActions from 'main/actions/CreditActions';

class GrantCredit extends React.Component {
  constructor() {
    super();

    this.state = this.initialState();

    _.bindAll(
      this,
      'initialState',
      'update',
      'addCredit'
    );
  }

  initialState() {
    return {
      name: '',
      amount: '',
      creditType: 'Runs',
      hasExpiry: false,
      expiry: undefined,
    };
  }

  update(field) {
    return e => this.setState({ [field]: e.target.value });
  }

  addCredit(done) {
    if (this.state.hasExpiry && this.state.expiry == undefined) {
      done();
      alert('Must set both month and year of expiry');
      return;
    }

    const createCreditAction = this.props.isAdmin ? AdminActions.createCredit :
      CreditActions.createCredit;
    createCreditAction(
      this.props.customerOrgId || Transcriptic.organization.id,
      this.state.name,
      this.state.amount,
      this.state.creditType,
      this.state.hasExpiry ? this.state.expiry.format() : undefined
    )
      .always(() => {
        this.setState({ ...this.initialState() });
      });
  }

  render() {
    return (
      <div className="grant-credit">
        <h3>Grant Credit</h3>
        <div className="row">
          <div className="col-sm-4">
            <LabeledInput label="Name of Credit">
              <TextInput
                placeholder="Name of Credit"
                value={this.state.name}
                onChange={this.update('name')}
              />
            </LabeledInput>
          </div>
          <div className="col-sm-2">
            <LabeledInput label="Credit Amount">
              <div className="input-group">
                <div className="input-group-addon">$</div>
                <TextInput
                  placeholder="1000"
                  value={this.state.amount}
                  onChange={this.update('amount')}
                />
              </div>
            </LabeledInput>
          </div>
          <div className="col-sm-2">
            <LabeledInput label="Credit Type">
              <Select
                options={[
                  { name: 'Run-only Credit', value: 'Runs' },
                  { name: 'General Credit', value: 'General' }
                ]}
                value={this.state.creditType}
                onChange={this.update('creditType')}
              />
            </LabeledInput>
          </div>
          <div className="col-sm-3">
            <LabeledInput label="Expiry">
              <div>
                <Choose>
                  <When condition={this.state.hasExpiry}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ flex: 1 }}>
                        <DateSelector
                          date={this.state.expiry}
                          onChange={e => this.setState({ expiry: e.target.value })}
                        />
                      </div>
                      <Button
                        type="primary"
                        link
                        onClick={() => this.setState({ hasExpiry: false })}
                        icon="fa fa-times"
                      />
                    </div>
                  </When>
                  <Otherwise>
                    <Button
                      type="default"
                      onClick={() => this.setState({ expiry: undefined, hasExpiry: true })}
                    >
                      Add Expiry
                    </Button>
                  </Otherwise>
                </Choose>
              </div>
            </LabeledInput>
          </div>
          <div className="col-sm-1">
            <LabeledInput label="&nbsp;">
              <Button
                onClick={this.addCredit}
                type="primary"
                icon="fa fa-plus"
              />
            </LabeledInput>
          </div>
        </div>
      </div>
    );
  }
}

export default GrantCredit;
