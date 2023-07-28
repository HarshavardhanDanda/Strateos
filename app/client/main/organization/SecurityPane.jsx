import React               from 'react';
import _                   from 'lodash';
import Immutable           from 'immutable';
import ModalActions        from 'main/actions/ModalActions';
import rootNode            from 'main/state/rootNode';
import PropTypes           from 'prop-types';
import UserActions         from 'main/actions/UserActions';
import Security2faModal    from 'main/components/2FA/Security2faModal';
import OrganizationActions from 'main/actions/OrganizationActions';
import ConnectToStores     from 'main/containers/ConnectToStoresHOC';
import OrganizationStore from 'main/stores/OrganizationStore';
import SessionStore        from 'main/stores/SessionStore';
import { Card, Button, Divider, LabeledInput, TextInput, Validated, TextTitle, TextBody } from '@transcriptic/amino';
import { validators, SimpleInputsValidator } from 'main/components/validation';

const node = rootNode.sub('session', Immutable.Map());

class SecurityPane extends React.Component {

  static get propTypes() {
    return {
      org: PropTypes.object.isRequired,
      subdomain: PropTypes.string
    };
  }

  static validator() {
    return SimpleInputsValidator({
      confirmError: {
        validators: [validators.password_invalid]
      }
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      current_password: '',
      confirmError: false
    };
    _.bindAll(this, 'onEnable2fa', 'onDisable2fa');
  }

  onSecurity2fa() {
    ModalActions.open(Security2faModal.modalId);
  }

  currentSession() {
    return node.get();
  }

  getOrg() {
    return this.props.customerOrgId ? OrganizationStore.getById(this.props.customerOrgId)
      : this.currentSession().get('organization');
  }

  onEnable2fa() {
    const org = this.getOrg();
    return UserActions.updateWithoutNotification({
      current_password: this.state.current_password })
      .fail(() => {
        this.setState({ current_password: '' });
        this.setState({ confirmError: true });
      })
      .done(() => {
        const subdomain = org.get('subdomain');
        const id = org.get('id');
        OrganizationActions.update(id, { two_factor_auth_enabled: true }, subdomain);
        this.setState({ current_password: '' });
        this.setState({ confirmError: false });
      });
  }

  onDisable2fa() {
    const org = this.getOrg();
    return UserActions.updateWithoutNotification({ current_password: this.state.current_password })
      .fail(() => {
        this.setState({ current_password: '' });
        this.setState({ confirmError: true });
      })
      .done(() => {
        const subdomain = org.get('subdomain');
        const id = org.get('id');
        OrganizationActions.update(id, { two_factor_auth_enabled: false }, subdomain);
        this.setState({ current_password: '' });
        this.setState({ confirmError: false });
      });
  }

  renderOrgContentEnable2fa() {
    const errors = SecurityPane.validator().errors(Immutable.Map(this.state));
    return (
      <div>
        <TextBody>Please confirm your password</TextBody>
        <div className="row">
          <div className="col-sm-6">
            <Validated error={errors.confirmError}>
              <LabeledInput label="Confirm Password">
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={this.state.current_password}
                  onChange={e => {
                    if (this.state.confirmError === true) this.setState({ confirmError: false });
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

  renderOrgContentDisable2fa() {
    const errors = SecurityPane.validator().errors(Immutable.Map(this.state));
    return (
      <div>
        <TextBody>Are you sure you want to stop enforcing two-factor authentication for this organization? This will make
          member accounts of this organization less secure.
        </TextBody>
        <div className="row">
          <div className="col-sm-6">
            <LabeledInput label="Confirm Password">
              <Validated error={errors.confirmError}>
                <TextInput
                  type="password"
                  placeholder="Password"
                  value={this.state.current_password}
                  onChange={e => {
                    if (this.state.confirmError === true) this.setState({ confirmError: false });
                    this.setState({ current_password: e.target.value });
                  }}
                />
              </Validated>
            </LabeledInput>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const customerOrganization = OrganizationStore.getById(this.props.customerOrgId);
    const organization = this.props.customerOrgId ? customerOrganization : this.props.org;
    return (
      <div>
        <Card className="tx-stack tx-stack--sm">
          { organization.get('two_factor_auth_enabled') ?
            (
              <React.Fragment>
                <TextTitle branded={false}>Two-factor Authentication</TextTitle>
                <Divider />

                <div>
                  <TextTitle tag="h4" branded={false}>Two-factor authentication is enabled for this organization.</TextTitle>
                  <TextBody>
                    Two-factor authentication adds an additional layer of security by requiring more than a password
                    to log in. As an administrator of this organization, you can enable two-factor authentication
                    for all members.
                  </TextBody>
                </div>
                <Button
                  size="large"
                  invert
                  type="danger"
                  heavy
                  onClick={() => this.onSecurity2fa()}
                >Disable Two-Factor Authentication
                </Button>
                <Security2faModal
                  renderContent={() => this.renderOrgContentDisable2fa()}
                  title={'Are you sure you want to disable 2FA?'}
                  onAccept={this.onDisable2fa}
                  acceptText={'Disable'}
                  acceptClass={'btn btn-danger'}
                  acceptBtnDisabled={!this.state.current_password}
                />
              </React.Fragment>
            )
            :
            (
              <React.Fragment>
                <TextTitle branded={false}>Two-factor Authentication</TextTitle>
                <Divider />
                <div>
                  <TextTitle tag="h4" branded={false}>Two-factor authentication is not yet enabled for this organization.</TextTitle>
                  <TextBody>
                    Two-factor authentication adds an additional layer of security by requiring more than a password
                    to log in. As an administrator of this organization, you can enable two-factor authentication
                    for all members.
                  </TextBody>
                </div>
                <Button
                  size="large"
                  type="action"
                  heavy
                  onClick={() => this.onSecurity2fa()}
                >Enable Two-Factor Authentication
                </Button>
                <Security2faModal
                  renderContent={() => this.renderOrgContentEnable2fa()}
                  title={'Confirm Password'}
                  onAccept={this.onEnable2fa}
                  acceptText={'Confirm'}
                  acceptBtnDisabled={!this.state.current_password}
                />
              </React.Fragment>
            )
     }
        </Card>
      </div>
    );
  }
}

const getStateFromStores = () => {
  const org = SessionStore.getOrg();
  return { org };
};

export default ConnectToStores(SecurityPane, getStateFromStores);
export { SecurityPane };
