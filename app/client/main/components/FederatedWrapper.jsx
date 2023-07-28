import { Spinner } from '@transcriptic/amino';
import React from 'react';

// Wrapper around federated modules, with reference to React error boundaries:
// https://reactjs.org/docs/error-boundaries.html#introducing-error-boundaries
class FederatedWrapper extends React.Component {
  /* eslint-disable no-unused-vars */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, errorInfo) {
    // logErrorToMyService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.error || <div>Something went wrong.</div>;
    }

    return (
      <React.Suspense fallback={this.props.delayed || <Spinner />}>
        {this.props.children}
      </React.Suspense>
    );
  }
}

export default FederatedWrapper;
