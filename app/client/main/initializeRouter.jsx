import React from 'react';
import { render } from 'react-dom';

import SessionActions from 'main/actions/SessionActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import IntercomInitializer from 'main/util/IntercomInitializer';
import { Page } from '@transcriptic/amino';
import AuditTrailActions from 'main/actions/AuditTrailActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';

// Mounts a react-router instance into the provided dom element
function initializeRouter(Router, elementId) {
  const appElement = document.getElementById(elementId);

  if (!appElement) {
    console.error(
      'Failed to initialize router because element was not found in the DOM: ',
      elementId
    );
    return;
  }

  SessionActions.load()
    .then((context) => {
      const { user, organization, user_intercom_hash } = context;

      if (window.heap) {
        heap.identify(user.id);
        heap.addUserProperties({
          name: user.name,
          organization: organization && !user.system_admin ? organization.name : undefined,
          email: user.email,
          handle: user.id
        });
      }

      if (window.bugsnag) {
        window.BugsnagClient = window.bugsnag({
          apiKey: process.env.BUGSNAG_API_KEY,
          releaseStage: process.env.NODE_ENV,
          user: {
            id: user.id,
            name: user.name,
            system_admin: user.system_admin
          }
        });
      }

      if (organization) {
        IntercomInitializer.load(user, organization, user_intercom_hash);
      }

      Transcriptic.setContext(context);
      return AccessControlActions.loadUser_acl().then(() => {
        if (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_AUDIT_TRAIL)) {
          AuditTrailActions.loadAuditConfiguration(organization.id);
          AuditTrailActions.loadAuditConfigurationHistory(organization.id);
        }
        render(<Router />, appElement);
      }
      );
    })
    .fail((response) => {
      const redirect = response.responseJSON && response.responseJSON.redirect_path;

      if (redirect) {
        // https://stackoverflow.com/questions/503093/how-to-redirect-to-another-webpage
        window.location.replace(redirect);
      } else {
        render(<Page statusCode={404} />, appElement);
      }
    });
}

export default initializeRouter;
