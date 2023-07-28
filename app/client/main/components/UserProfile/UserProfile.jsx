import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Chroma from 'chroma-js';
import classNames from 'classnames';

import { Utilities, Profile } from '@transcriptic/amino';

import './UserProfile.scss';

const MAX_LIGHTNESS = 0.65;
const MIN_LIGHTNESS = 0.15;

function UserProfile({ user, label, subtitle, isLarge, to, showDetails, onModal, invert }) {
  let bgColor = Utilities.Colors.strToHex(user.get('id'));

  const [hue, sat, lightness] = Chroma(bgColor).hsl();

  // Map the ligtness of the color from the range of [0, 1] to [0, 0.65].
  // This ensures that the color that's picked will always be dark enough to
  // contrast with white text.
  const mappedLightness = (lightness * (MAX_LIGHTNESS - MIN_LIGHTNESS)) + MIN_LIGHTNESS;

  bgColor = Chroma.hsl(hue, sat, mappedLightness).hex();

  return (
    <div className={classNames('user-profile', { 'user-profile--invert': invert })}>
      <If condition={label}>
        <h4 className="user-profile__label">{label}:</h4>
      </If>
      <Profile
        imgSrc={user.get('profile_img_url')}
        name={user.get('name')}
        bgHex={bgColor}
        subtitle={subtitle}
        isLarge={isLarge}
        to={to}
        showDetails={showDetails}
        onModal={onModal}
      />
    </div>
  );
}

UserProfile.propTypes = {
  user: PropTypes.instanceOf(Immutable.Map).isRequired,
  label: PropTypes.string,
  subtitle: PropTypes.string,
  isLarge: PropTypes.bool,
  to: PropTypes.string,
  showDetails: PropTypes.bool,
  onModal: PropTypes.bool,
  invert: PropTypes.bool
};

UserProfile.defaultProps = {
  onModal: false
};

export default UserProfile;
