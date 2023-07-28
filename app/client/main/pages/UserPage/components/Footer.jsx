import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';

import { Button, ButtonGroup } from '@transcriptic/amino';

function Footer(props) {
  return (
    <div className="user-page__content-footer">
      <ButtonGroup>
        <If condition={props.showCancel}>
          <Button type="primary" link onClick={props.onCancel}>
            Cancel
          </Button>
        </If>
        <Button
          type="primary"
          onClick={props.onSave}
          disabled={!props.saveEnabled}
          waitForAction
        >
          Save Changes
        </Button>
      </ButtonGroup>
    </div>
  );
}

Footer.propTypes = {
  onSave: PropTypes.func.isRequired,
  saveEnabled: PropTypes.bool.isRequired,
  onCancel: PropTypes.func,
  showCancel: PropTypes.bool.isRequired
};

export default Footer;
