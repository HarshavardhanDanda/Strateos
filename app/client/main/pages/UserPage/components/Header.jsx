import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import { Button } from '@transcriptic/amino';

function Header(props) {
  return (
    <div className="user-page__content-header">
      <h3>{props.title}</h3>
      <If condition={props.showIcon}>
        <Button
          link
          icon="fa fa-edit"
          type="secondary"
          onClick={props.onIconClick}
        />
      </If>
    </div>
  );
}

Header.propTypes = {
  onIconClick: PropTypes.func,
  showIcon: PropTypes.bool,
  title: PropTypes.string.isRequired
};

export default Header;
