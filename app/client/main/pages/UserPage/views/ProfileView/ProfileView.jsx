import classNames                    from 'classnames';
import Immutable                     from 'immutable';
import _                             from 'lodash';
import PropTypes                     from 'prop-types';
import React                         from 'react';

import 'react-image-crop/lib/ReactCrop.scss';

import ModalActions                          from 'main/actions/ModalActions';
import UserActions                           from 'main/actions/UserActions';
import { TabLayout }                         from 'main/components/TabLayout';
import { validators, SimpleInputsValidator } from 'main/components/validation';
import ProfileImageModal                     from 'main/pages/ProfileImageModal';

import {
  InputsController,
  KeyValueList,
  LabeledInput,
  TextInput,
  Validated
} from '@transcriptic/amino';

import ConfirmModal from '../../components/ConfirmModal';
import Footer       from '../../components/Footer';
import Header       from '../../components/Header';

class ProfilePicSection extends React.Component {
  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      base64Image: undefined
    };
  }

  getUserInitials() {
    const onError = '??';

    let name = this.props.user.get('name');

    if (name == undefined) {
      return onError;
    }

    name        = name.replace(/\s\s+/g, ' ');
    const parts = name.split(' ');

    if (_.isEmpty(name)) {
      return onError;
    }

    return parts.map(part => part[0].toUpperCase());
  }

  render() {
    const profileUrl = this.state.base64Image || this.props.user.get('profile_img_url');

    return (
      <div className="user-page__profile-pic-section">
        <div
          className={classNames(
            'user-page__profile-pic-container',
            {
              'user-page__profile-pic-container--bordered': !profileUrl
            }
          )}
          onClick={() => { ModalActions.open(ProfileImageModal.modalId); }}
        >
          <Choose>
            <When condition={profileUrl}>
              <img
                className="user-page__profile-pic"
                src={profileUrl}
                alt="User Profile"
              />
            </When>
            <Otherwise>
              <div className="user-page__profile-pic-placeholder">
                <span>{this.getUserInitials()}</span>
              </div>
            </Otherwise>
          </Choose>

          <div className="user-page__profile-pic-hover">
            <p className="tx-type--invert tx-type--heavy">
              Change
            </p>
          </div>
        </div>
        <div>
          <h3 className="tx-type--heavy">{this.props.user.get('name')}</h3>
        </div>

        <ProfileImageModal
          userId={this.props.user.get('id')}
          onResize={base64Image => this.setState({ base64Image })}
          type="user"
        />
      </div>
    );
  }
}

class ProfileView extends React.Component {

  static get propTypes() {
    return {
      user: PropTypes.object.isRequired
    };
  }

  static validator() {
    return SimpleInputsValidator({
      name: {
        validators: [validators.non_empty]
      },
      email: {
        validators: [validators.email, validators.non_empty]
      }
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      name: props.user.get('name'),
      email: props.user.get('email'),
      confirmEmail: '',
      hasChanges: false,
      validated: true,
      forceValidate: false
    };
    _.bindAll(
      this,
      'onEditProfile',
      'editName',
      'editNameAndEmail'
    );
  }

  editName(buttonCallback) {
    return UserActions.update({
      name: this.state.name
    }).done(() => {
      this.setState({ editing: false });
      buttonCallback();
    });
  }

  editNameAndEmail(password) {
    return UserActions.update({
      name: this.state.name,
      current_password: password,
      email: this.state.email
    }).done(() => this.setState({ editing: false }));
  }

  onEditProfile(buttonCallback) {
    const isValid = ProfileView.validator().isValid(Immutable.Map(this.state));
    if (isValid && this.validConfirmation()) {
      if (this.props.user.get('email') == this.state.email) {
        this.editName(buttonCallback);
      } else {
        ModalActions.open('ConfirmModal');
        buttonCallback();
      }
    } else {
      this.setState({ forceValidate: true });
      buttonCallback();
    }
  }

  validConfirmation() {
    return (this.state.email == this.props.user.get('email'))
      || (this.state.email == this.state.confirmEmail);
  }

  equalsOriginal(state) {
    const eq =
      state.name == this.props.user.get('name') &&
      state.email == this.props.user.get('email');
    return eq;
  }

  render() {
    const { user } = this.props;
    const errors   = ProfileView.validator().errors(Immutable.Map(this.state));

    if (!this.validConfirmation()) {
      errors.confirmEmail = 'Email confirmation must match the email that is being changed to';
    }

    return (
      <TabLayout>
        <div className="row account-layout">
          <div className="col-xs-3">
            <ProfilePicSection user={user} />
          </div>
          <div className="col-xs-9 information-section">
            <Header
              title="Profile"
              showIcon={!this.state.editing}
              onIconClick={() => {
                this.setState({ editing: true });
              }
              }
            />
            <Choose>
              <When condition={this.state.editing}>
                <div className="user-page__content-body">
                  <div className="user-page__text-input-wrapper">
                    <InputsController
                      values={{
                        name: this.state.name,
                        email: this.state.email,
                        confirmEmail: this.state.confirmEmail
                      }}
                      inputChangeCallback={(state) => {
                        this.setState({
                          ...state,
                          hasChanges: !this.equalsOriginal(state),
                          validated: ProfileView.validator().isValid(Immutable.Map(state)) &&
                            ((state.email === this.props.user.get('email')) || (state.email === state.confirmEmail))
                        });
                      }}
                    >
                      <div className="user-page__text-input">
                        <LabeledInput label="name" className="user-page__text-input">
                          <Validated error={errors.name} force_validate={this.state.forceValidate}>
                            <TextInput
                              placeholder="Name"
                              name="name"
                              value={this.state.name}
                            />
                          </Validated>
                        </LabeledInput>
                      </div>
                      <div className="user-page__text-input">
                        <LabeledInput label="email address" className="user-page__text-input">
                          <Validated error={errors.email} force_validate={this.state.forceValidate}>
                            <TextInput
                              placeholder="Email Address"
                              name="email"
                              value={this.state.email}
                            />
                          </Validated>
                        </LabeledInput>
                      </div>
                      <div className="user-page__text-input">
                        <LabeledInput label="confirm new email address">
                          <Validated error={errors.confirmEmail} force_validate={this.state.forceValidate}>
                            <TextInput
                              placeholder="Confirm Address"
                              name="confirmEmail"
                              value={this.state.confirmEmail}
                            />
                          </Validated>
                        </LabeledInput>
                      </div>
                    </InputsController>
                  </div>
                </div>
                <Footer
                  showCancel
                  onSave={this.onEditProfile}
                  onCancel={() => {
                    this.setState({
                      editing: false,
                      name: user.get('name'),
                      email: user.get('email'),
                      confirmEmail: ''
                    });
                  }}
                  saveEnabled={this.state.validated && this.state.hasChanges}
                />
                <ConfirmModal
                  key="confirm-modal"
                  title="Confirm Email Change"
                  email={this.state.email}
                  onSubmit={this.editNameAndEmail}
                />
              </When>
              <Otherwise>
                <div className="user-page__content-body">
                  <KeyValueList entries={[
                    {
                      key: 'name',
                      value: <p className="user-page__text-spacing">{user.get('name')}</p>
                    },
                    {
                      key: 'email address',
                      value: <p className="user-page__text-spacing">{user.get('email')}</p>
                    }
                  ]}
                  />
                </div>
              </Otherwise>
            </Choose>
          </div>
        </div>
      </TabLayout>
    );
  }
}

export default ProfileView;
