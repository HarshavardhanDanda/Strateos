import PropTypes from 'prop-types';
import React     from 'react';

import Barcode       from 'main/components/Barcode';
import ContainerType from 'main/components/ContainerType';

class RefTooltip extends React.Component {
  static get propTypes() {
    return {
      containerRef: PropTypes.object.isRequired
    };
  }

  destiny(ref) {
    if (ref.destiny.discard) {
      return 'Discard';
    } else if (ref.destiny.store) {
      const { where } = ref.destiny.store;
      const { shaking } = ref.destiny.store;
      return `Store in ${where} ${shaking ? 'shaking' : ''}`;
    }

    return '';
  }

  render() {
    const ref = this.props.containerRef;

    const barcode       = ref.container ? ref.container.barcode : undefined;
    const containerType = ref.container_type ? ref.container_type.id : undefined;
    const destiny       = ref.destiny && this.destiny(ref);
    const refName       = ref ? ref.name : undefined;

    return (
      <div className="ref-tooltip">
        <p>Ref Name: {refName}</p>
        <p>
          <span>Barcode: </span>
          <Choose>
            <When condition={barcode}>
              <Barcode barcode={barcode} />
            </When>
            <Otherwise>Unknown</Otherwise>
          </Choose>
        </p>
        <p>
          <span>Container Type: </span>
          <ContainerType containerTypeId={containerType} />
        </p>
        <p>Destiny: {destiny || 'Unknown'}</p>
      </div>
    );
  }
}

export default RefTooltip;
