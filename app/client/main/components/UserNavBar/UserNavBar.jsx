import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Subtabs, Logo } from '@transcriptic/amino';

import './UserNavBar.scss';

/* States to consider:
 * 1. User
 * 2. Admin
 * 3. Admin masquerading as a user
 * 4. User that is in onboarding flow
 */

function UserNavBar({ isAdmin, landingPage, children }) {
  let subtabs = null;
  const filteredChildren = Array.isArray(children) ? children.filter((child) => {
    if (child.type === Subtabs) {
      subtabs = child;
    }
    return child.type !== Subtabs;
  }) : [];

  return (
    <div className={classNames('user-nav-bar', 'hidden-print', { admin: isAdmin })}>
      <div className="user-nav-bar__content-left">
        <a className="user-nav-bar__logo" href={isAdmin ? '/admin' : landingPage()}>
          <Logo text invertText />
        </a>
        {subtabs || children}
      </div>
      <div className="user-nav-bar__content-right">
        {filteredChildren}
      </div>
    </div>
  );
}

UserNavBar.propTypes = {
  isAdmin: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default UserNavBar;
