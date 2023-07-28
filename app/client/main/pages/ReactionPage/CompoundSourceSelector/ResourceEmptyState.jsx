import React from 'react';
import PropTypes from 'prop-types';
import { ZeroState } from '@transcriptic/amino';

class ResourceEmptyState extends React.Component {

  render() {
    const { sourceName, onStrateosSourceClick, onEmoleculeSourceClick, onAddContaineClick } = this.props;

    const zeroStateTitle = () => {
      return `No match found in ${sourceName}`;
    };

    const zeroStateSubTitle = () => {
      return (
        <p>
          We did not find the material you are looking for in {sourceName}, we recommend sourcing it outside and register
          in your inventory or <a href="https://strateos.atlassian.net/servicedesk/customer/portal/7/group/-">contact&nbsp;</a>
          us for support
        </p>
      );
    };

    const zeroStateUserInventorySubTitle = () => {
      return (
        <p>
          We recommend either searching materials from <a onClick={onStrateosSourceClick}>Strateos</a> or sourcing from <a onClick={onEmoleculeSourceClick}>eMolecules</a>. You can also source materials from your preferred vendors and <a onClick={onAddContaineClick}>register</a> to your inventory.
        </p>
      );
    };

    return (
      <ZeroState
        title={zeroStateTitle()}
        zeroStateSvg="/images/materials-illustration.svg"
        subTitle={sourceName === 'User Inventory' ? zeroStateUserInventorySubTitle() : zeroStateSubTitle()}
        hasBorder={false}
      />
    );
  }
}

ResourceEmptyState.propTypes = {
  sourceName: PropTypes.string.isRequired
};

export default ResourceEmptyState;
