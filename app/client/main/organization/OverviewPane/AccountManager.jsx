import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

const DEFAULT_NAME = 'Strateos';
const DEFAULT_EMAIL = 'sales@strateos.com';

function AccountManager({ org, customerOrgId }) {
  let name, email;
  if (customerOrgId) {
    name = org.getIn(['account_manager', 'name']) || DEFAULT_NAME;
    email = org.getIn(['account_manager', 'email']) || DEFAULT_EMAIL;
  } else {
    name = org.getIn(['account_manager_or_default', 'name']) || DEFAULT_NAME;
    email = org.getIn(['account_manager_or_default', 'email']) || DEFAULT_EMAIL;
  }

  return (
    <div className="tx-stack tx-stack--xxxs">
      <h4>Account Manager</h4>
      <div className="row">
        <div className="col-md-2 col-sm-3 col-6">
          <p>{name}</p>
        </div>
        <div className="col-md-10 col-sm-9 col-6">
          <p><a  href={`mailto:${email}`}>{email}</a></p>
        </div>
      </div>
    </div>
  );
}

AccountManager.propTypes = {
  org: PropTypes.instanceOf(Immutable.Map)
};

export default AccountManager;
