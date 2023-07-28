import React from 'react';
import _ from 'lodash';

import {
  Banner
} from '@transcriptic/amino';
import { TabLayout } from 'main/components/TabLayout';
import FederatedWrapper from 'main/components/FederatedWrapper';
import SessionStore from 'main/stores/SessionStore';
import AuditConfigStore from 'main/stores/AuditConfigStore';

/* eslint-disable import/no-unresolved */
const AuditApp = React.lazy(() => import('audit_trail_micro_frontend/App'));

class AuditPage extends React.Component {

  constructor(props, context) {
    super(props, context);
    this.state = {
      auditConfigurationStatus: {}
    };
    this.getAuditConfiguration = this.getAuditConfiguration.bind(this);
  }

  componentDidMount() {
    this.getAuditConfiguration();
  }

  getAuditConfiguration() {
    const currOrgId = SessionStore.getOrg().get('id');
    const status = AuditConfigStore.getByOrganizationId(currOrgId).first().get('auditConfigState');
    this.setState({ auditConfigurationStatus: status });
  }

  render() {

    return (
      <div>
        <TabLayout>
          { this.state.auditConfigurationStatus === 'ENABLED' ? (
            <FederatedWrapper error={<div>Unable to load Audit Frontend.</div>}>
              <AuditApp auditTrailServiceBase="/service/audit_trail" />
            </FederatedWrapper>
          ) : (
            <Banner
              bannerType="info"
              bannerMessage="The organization is currently not subscribed to Audit. To subscribe, please contact the Customer Support team."
            />
          )}
        </TabLayout>
      </div>
    );
  }
}

export default AuditPage;
