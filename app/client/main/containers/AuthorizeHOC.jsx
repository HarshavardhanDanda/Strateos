import React from 'react';

import { Page } from '@transcriptic/amino';

const AuthorizeHOC = (Component, policyFn) => {
  function ConnectedComponent(props) {
    return policyFn() ? <Component {...props} /> : <Page statusCode={403} />;
  }

  ConnectedComponent.propTypes   = Component.propTypes;
  ConnectedComponent.defaultProps = Component.defaultProps;

  return ConnectedComponent;
};

export default AuthorizeHOC;
