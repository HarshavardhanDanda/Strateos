import React from 'react';

class ProBroMoNoResult extends React.Component {
  render() {
    return (
      <div>
        <h2 className="tx-type--heavy">No results found.</h2>
        <p>Your query did not match any protocols.</p>
      </div>
    );
  }
}

export default ProBroMoNoResult;
