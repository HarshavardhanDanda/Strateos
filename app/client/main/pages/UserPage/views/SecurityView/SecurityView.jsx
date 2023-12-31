import Immutable from 'immutable';
import _         from 'lodash';
import PropTypes from 'prop-types';
import QRCode    from 'qrcode';
import React     from 'react';

import ModalActions                          from 'main/actions/ModalActions';
import NotificationActions                   from 'main/actions/NotificationActions';
import UserActions                           from 'main/actions/UserActions';
import Security2faModal                      from 'main/components/2FA/Security2faModal';
import { TabLayout }                         from 'main/components/TabLayout';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import ajax                                  from 'main/util/ajax';

import {
  KeyValueList,
  LabeledInput,
  TextInput,
  Button,
  InputsController,
  Validated,
  DateTime
} from '@transcriptic/amino';

import Footer from '../../components/Footer';
import Header from '../../components/Header';

class ActionsFooter extends React.Component {

  static get propTypes() {
    return {
      nextAction:  PropTypes.func.isRequired,
      actionText:  PropTypes.string.isRequired,
      abort2fa:    PropTypes.func.isRequired
    };
  }

  render() {
    return (
      <div className="actions clearfix">
        <a className="abort-2fa pull-left" onClick={this.props.abort2fa}>Abort</a>
        <div className="pull-right">
          <Button size="small" type="primary" onClick={this.props.nextAction}>
            {this.props.actionText}
          </Button>
        </div>
      </div>
    );
  }
}

class TwoFactorSetup extends React.Component {

  componentWillMount() {
    ajax.get('/2fa_secret_uri.json')
      .done(data => this.addQRCode(data.uri))
      .fail((...response) => NotificationActions.handleError(...Array.from(response || [])));
  }

  addQRCode(text) {
    QRCode.toCanvas(this.qrcodeNode, text, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  render() {
    return (
      <div id="two-factor-setup">
        <p>
          Install the&nbsp;
          <a href="https://support.google.com/accounts/answer/1066447" target="_new">Google Authenticator</a>&nbsp;
          app for iPhone, Android, or Blackberry to use two-factor authentication with Strateos.&nbsp;
          Once installed, use the app to take a picture of the code below to configure.&nbsp;
        </p>
        <canvas ref={(e) => { this.qrcodeNode = e; }} />
      </div>
    );
  }
}

class TwoFactorConfirm extends React.Component {

  static get propTypes() {
    return {
      confirmError: PropTypes.bool.isRequired,
      onCodeChange: PropTypes.func.isRequired
    };
  }

  constructor(props) {
    super(props);

    this.state = {
      code: ''
    };
  }

  render() {
    return (
      <div id="two-factor-setup">
        <p>
          Enter the six-digit code generated by Google Authenticator to confirm.
        </p>
        <If condition={this.props.confirmError}>
          <div id="validation-error" className="alert alert-danger">
            Incorrect code. Try again.
          </div>
        </If>
        <div className="row">
          <div className="col-xs-4">
            <LabeledInput className="confirm-code" label="Code">
              <TextInput
                value={this.state.code}
                type="code"
                name="code"
                onChange={(e) => {
                  this.setState({ code: e.target.value });
                  this.props.onCodeChange(e.target.value);
                }}
              />
            </LabeledInput>
          </div>
        </div>
        <br />
      </div>
    );
  }
}

class SecurityView extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  static validator() {
    return SimpleInputsValidator({
      current_password: {
        validators: [validators.non_empty]
      },
      password: {
        validators: [validators.non_empty, validators.not_too_short]
      },
      invalidError: {
        validators: [validators.password_invalid]
      }
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      panel: 'setup',
      code: '',
      current_password: '',
      password: '',
      password_confirmation: '',
      forceValidate: false,
      validated: false,
      invalidError: false
    };
    _.bindAll(this, 'onChangePassword', 'onConfirm2fa', 'onDisable2fa');
  }

  onSecurity2fa() {
    ModalActions.open(Security2faModal.modalId);
  }

  onChangePassword(buttonCallback) {
    const isValid = SecurityView.validator().isValid(Immutable.Map(this.state)) &&
                      this.state.password == this.state.password_confirmation;
    if (isValid) {
      this.changePassword(buttonCallback);
    } else {
      this.setState({ forceValidate: true });
      this.setState({ current_password: '' });
      this.setState({ password: '' });
      this.setState({ password_confirmation: '' });
      buttonCallback();
    }
  }

  changePassword(buttonCallback) {
    UserActions.update({
      current_password: this.state.current_password,
      password: this.state.password,
      password_confirmation: this.state.password_confirmation
    }).then(() => {
      this.setState({ current_password: '' });
      this.setState({ password: '' });
      this.setState({ password_confirmation: '' });
    }).fail(() => {
      this.setState({ current_password: '' });
      this.setState({ password: '' });
      this.setState({ password_confirmation: '' });
      buttonCallback();
    }).done(() => {
      this.setState({ editing: false });
      buttonCallback();
    });
  }

  onConfirm2fa() {
    UserActions.confirm2fa(this.state.code)
      .done((data) => {
        if (data.success) {
          UserActions.updateWithoutNotification({ enable_two_factor_auth: true })
            .done(() => this.setState({ panel: 'setup' }));
        } else {
          this.setState({ confirmError: true });
        }
      })
      .fail(() => {
        this.setState({ confirmError: true });
      });
  }

  onDisable2fa() {
    return UserActions.updateWithoutNotification({
      current_password: this.state.current_password,
      disable_two_factor_auth: true })
      .done(() => this.setState({ current_password: '' }))
      .fail(() => {
        this.setState({ current_password: '' });
        this.setState({ invalidError: true });
      });
  }

  renderUserContentEnable2fa() {
    return (
      <div>
        <If condition={this.state.panel === 'setup'}>
          <div>
            <TwoFactorSetup />
            <ActionsFooter
              actonClass="continue-2fa"
              actionText="Continue"
              nextAction={() => this.setState({ panel: 'confirm' })}
              abort2fa={() => ModalActions.close(Security2faModal.modalId)}
            />
          </div>
        </If>
        <If condition={this.state.panel === 'confirm'}>
          <div>
            <TwoFactorConfirm
              confirmError={this.state.confirmError}
              onCodeChange={code => this.setState({ code })}
            />
            <ActionsFooter
              actonClass="confirm-2fa"
              actionText="Confirm"
              nextAction={this.onConfirm2fa}
              abort2fa={() => {
                this.setState({ panel: 'setup' });
                ModalActions.close(Security2faModal.modalId);
              }}
            />
          </div>
        </If>
      </div>
    );
  }

  renderUserContentDisable2fa() {
    const errors = SecurityView.validator().errors(Immutable.Map(this.state));
    return (
      <div>
        <p>Are you sure you want to disable two-factor authentication? This will make your account less secure.</p>
        <div className="row">
          <div className="col-sm-6">
            <Validated error={errors.invalidError}>
              <LabeledInput label="Confirm Password">
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={this.state.current_password}
                  onChange={e => {
                    if (this.state.invalidError === true) this.setState({ invalidError: false });
                    this.setState({ current_password: e.target.value });
                  }}
                />
              </LabeledInput>
            </Validated>
          </div>
        </div>
      </div>
    );
  }

  renderEdit() {
    const errors = SecurityView.validator().errors(Immutable.Map(this.state));
    if (this.state.password.length > 0 && this.state.password_confirmation.length > 0
        && this.state.password != this.state.password_confirmation) {
      errors.password_confirmation = 'Confirmation does not match the new password';
    }
    return (
      <div>
        <div key="edit-body" className="user-page__content-body">
          <div className="user-page__text-input-wrapper">
            <InputsController
              values={{
                current_password: this.state.current_password,
                password: this.state.password,
                password_confirmation: this.state.password_confirmation
              }}
              inputChangeCallback={(state) => {
                this.setState({
                  ...state,
                  validated: SecurityView.validator().isValid(Immutable.Map(state)) &&
                              state.password === state.password_confirmation
                });
              }}
            >
              <LabeledInput label="current password">
                <Validated error={errors.current_password} force_validate={this.state.forceValidate}>
                  <TextInput
                    name="current_password"
                    type="password"
                    value={this.state.current_password}
                  />
                </Validated>
              </LabeledInput>
              <LabeledInput label="new password">
                <Validated error={errors.password} force_validate={this.state.forceValidate}>
                  <TextInput
                    name="password"
                    type="password"
                    value={this.state.password}
                  />
                </Validated>
              </LabeledInput>
              <LabeledInput label="confirm new password">
                <Validated error={errors.password_confirmation} force_validate={this.state.forceValidate}>
                  <TextInput
                    name="password_confirmation"
                    type="password"
                    value={this.state.password_confirmation}
                  />
                </Validated>
              </LabeledInput>
            </InputsController>
          </div>
        </div>
        <Footer
          key="edit-footer"
          showCancel
          onSave={this.onChangePassword}
          onCancel={() => this.setState({
            editing: false,
            password: '',
            current_password: '',
            password_confirmation: ''
          })}
          saveEnabled
        />
      </div>
    );
  }

  renderRead() {
    const { user } = this.props;
    return (
      <div className="user-page__content-body">
        <KeyValueList entries={[
          {
            key: 'password',
            value: (
              <p className="user-page__text-spacing">
                {'Last changed on '}
                <DateTime
                  timestamp={this.props.user.get('password_last_changed_at')}
                  format="absolute-format"
                />
              </p>
            )
          },
          {
            key: 'two-factor authentication',
            value: (
              <Choose>
                <When condition={user.get('two_factor_auth_enabled')}>
                  <b>Enabled</b>
                  <div style={{ width: '30px', display: 'inline-block' }} />
                  <a onClick={() => this.onSecurity2fa()}>Disable</a>
                  <Security2faModal
                    renderContent={() => this.renderUserContentDisable2fa()}
                    title={'Are you Sure?'}
                    onAccept={this.onDisable2fa}
                    acceptText={'Disable'}
                    acceptClass={'btn btn-danger'}
                  />
                </When>
                <Otherwise>
                  <p className="user-page__text-spacing">
                    Disabled
                  </p>
                  <a key="setup_auth" onClick={() => this.onSecurity2fa()}>
                    Set up two-factor authentication
                  </a>
                  <Security2faModal
                    renderContent={() => this.renderUserContentEnable2fa()}
                    title={'Enable 2FA'}
                    renderFooter={false}
                  />
                </Otherwise>
              </Choose>
            )
          }
        ]}
        />
        <If condition={!this.props.user.get('two_factor_auth_enabled')}>
          <p className="user-page__2fa-explanation" key="2fa_explanation">
            {`Two-factor authentication ("2FA") involves requiring a one-time code
            delivered via text message, email, or generated by a mobile app in addition
            to your password in order to log in.  It creates substantially stronger security
            compared to using a password alone.  If your password is discovered, your
            account could still be secure if 2FA is enabled on your account.`}
          </p>
        </If>
      </div>
    );
  }

  render() {
    return (
      <TabLayout>
        <div className="account-layout">
          <div className="information-section">
            <Header
              title="Security"
              showIcon={!this.state.editing}
              onIconClick={() => {
                this.setState({ editing: true });
              }
              }
            />
            <Choose>
              <When condition={this.state.editing}>
                {this.renderEdit()}
              </When>
              <Otherwise>
                {this.renderRead()}
              </Otherwise>
            </Choose>
          </div>
        </div>
      </TabLayout>
    );
  }

}

export default SecurityView;
