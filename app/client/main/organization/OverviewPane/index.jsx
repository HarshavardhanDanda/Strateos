import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { Link }  from 'react-router-dom';

import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import SessionStore       from 'main/stores/SessionStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import Urls               from 'main/util/urls';
import { Banner, Card, Divider } from '@transcriptic/amino';
import AccountManager     from './AccountManager';
import OrgMembersTableHOC    from './OrgMembersTable';

const propTypes = {
  subdomain: PropTypes.string.isRequired,
  org: PropTypes.instanceOf(Immutable.Map),
  isOrgAdmin: PropTypes.bool
};

function OverviewPane(props) {
  const customerOrganization = OrganizationStore.getById(props.orgId);
  const organization = props.orgId ? customerOrganization : props.org;
  const customerAdmin = SessionStore.isCustomerAdmin(props.orgId);
  const isAdmin = props.orgId ? customerAdmin : props.isOrgAdmin;
  return (
    <div className="tx-stack tx-stack--xxlg">
      <Card className="tx-inset--xlg tx-inset--square tx-stack tx-stack--sm">
        <h2 className="tx-type--heavy">Account Overview</h2>
        <Divider />
        <div className="tx-stack tx-stack--xxxs">
          <h4>Account Status</h4>
          {
            organization.get('validated?') ?
              <p className="organization-overview-page--approved tx-type--heavy">Account Approved</p>
              : (
                <Banner
                  bannerType="warning"
                  bannerTitle="Account Pending"
                  bannerMessage={(
                    <div>
                      {isAdmin && (
                        <p>
                          {'Enter your '}
                          <Link to={`${Urls.organization()}/billing`}>
                            billing information
                          </Link>
                          {' and '}
                          <Link to={`${Urls.organization()}/addresses`}>
                            at least one receiving address
                          </Link>
                          {' to activate your account.'}
                        </p>
                      )}

                      <p>Your information must be approved by your account manager before your account is activated.</p>
                    </div>
                  )}
                />
              )
          }
        </div>
        <div className="tx-stack tx-stack--xxxs">
          <h4>Account Owner</h4>
          <div className="row">
            <div className="col-md-2 col-sm-3 col-6">
              <p>{organization.getIn(['owner', 'name'])}</p>
            </div>
            <div className="col-md-10 col-sm-9 col-6">
              <p>
                <a href={`mailto:${organization.getIn(['owner', 'email'])}`}>
                  {organization.getIn(['owner', 'email'])}
                </a>
              </p>
            </div>
          </div>
        </div>
        <AccountManager org={organization} customerOrgId={props.orgId} />
      </Card>
      <Card className="tx-inset--xlg tx-inset--square tx-stack tx-stack--sm" allowOverflow>
        <h2 className="tx-type--heavy">Organization Members</h2>
        <Divider />
        <OrgMembersTableHOC subdomain={props.subdomain} customerOrganization={customerOrganization} />
      </Card>
    </div>
  );
}
OverviewPane.propTypes = propTypes;

const getStateFromStores = () => {
  const currentOrg = SessionStore.getOrg() || Immutable.Map();

  return {
    org: currentOrg,
    isOrgAdmin: SessionStore.isOrgAdmin()
  };
};

export default ConnectToStoresHOC(OverviewPane, getStateFromStores);
export { OverviewPane };
