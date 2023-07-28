import fetcher from '@strateos/micro-apps-utils';
import ajax    from 'main/util/ajax/index.js';

function initializeHeaders() {
  fetcher.setHeaders(() => {
    const organizationId  = ajax.getOrganizationID();
    const csrfToken = ajax.getToken();
    const userId = ajax.getUserID();

    const headers = {};

    if (organizationId) {
      headers['X-Organization-Id'] = organizationId;
    }

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (userId) {
      headers['X-User-Id'] = userId;
    }

    return headers;
  });
}

export default initializeHeaders;
