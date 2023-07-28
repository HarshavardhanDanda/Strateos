import React from 'react';

import UserActions from 'main/actions/UserActions';
import { Page, PanelLayout } from '@transcriptic/amino';

function UserHasNoOrgPage() {
  return (
    <Page title="Contact">
      <PanelLayout>
        <div className="tx-header">
          <a onClick={UserActions.signOut}>Sign Out</a>
        </div>
        <div>
          <div>
            To get started using Transcriptic contact our sales team.{' '}
            They will help onboard you to the platform: sales@transcriptic.com
          </div>
          <div>
            <a href="https://www.transcriptic.com/contact/">https://www.transcriptic.com/contact/</a>
          </div>
        </div>
      </PanelLayout>
    </Page>
  );
}

export default UserHasNoOrgPage;
