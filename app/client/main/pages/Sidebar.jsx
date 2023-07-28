import React, { Component } from 'react';

import { DateTime }        from '@transcriptic/amino';
import Immutable           from 'immutable';
import PropTypes           from 'prop-types';
import { inflect }         from 'inflection';
import Urls                from 'main/util/urls';
import ModalActions        from 'main/actions/ModalActions';
import ProfileImageModal   from 'main/pages/ProfileImageModal';

class SideBar extends Component {
  static get propTypes() {
    return {
      match: PropTypes.shape({
        path: PropTypes.string.isRequired,
        params: PropTypes.shape({
          subdomain: PropTypes.string.isRequired
        })
      }),
      organization: PropTypes.instanceOf(Immutable.Map)
    };
  }

  static get modalId() {
    return 'OrganizationProfileImageModal';
  }

  constructor(props) {
    super(props);
    this.state = {
      base64Image: undefined
    };

    this.profilePhotoUrl = this.profilePhotoUrl.bind(this);
  }

  profilePhotoUrl() {
    const { organization } = this.props;
    const profile_url =
      organization != undefined
        ? organization.get('profile_photo_attachment_url')
        : undefined;

    if (!profile_url) {
      return '/images/gravatar.jpg';
    } else {
      return Urls.s3_file(profile_url);
    }
  }

  render() {
    const { organization } = this.props;
    const activeSince =
      organization != undefined ? organization.get('created_at') : undefined;
    const collaboratorsCount =
      organization != undefined
        ? organization.get('collaborators').size
        : undefined;
    const membersString = `${collaboratorsCount} ${inflect(
      'Member',
      collaboratorsCount
    )}`;
    return (
      <div className="organization-header">
        <div className="organization-header__sidebar-container">
          <div className="organization-header__photo-container">
            <div
              className="btn btn-file organization-header__photo"
              style={{ backgroundImage: `url(${this.profilePhotoUrl()})` }}
              onClick={() => { ModalActions.open(ProfileImageModal.modalId); }}
            >
              <div className="organization-header__profile-pic-caption">
                <p className="tx-type--invert tx-type--heavy">
                  Change
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="organization-header__name tx-inset--md tx-inset--square tx-stack tx-stack--xxxs">
          <h2 className="tx-type--heavy">
            <If condition={organization != undefined}>
              {organization.get('name')}
            </If>
          </h2>
          <div className="tx-stack tx-stack--xxxs">
            <p className="tx-type--secondary">Active since <DateTime timestamp={activeSince} /></p>
            <p className="tx-type--secondary">{membersString}</p>
          </div>
        </div>

        <ProfileImageModal
          {...this.props}
          onResize={base64Image => this.setState({ base64Image })}
          type="organization"
        />
      </div>
    );
  }
}
export default SideBar;
