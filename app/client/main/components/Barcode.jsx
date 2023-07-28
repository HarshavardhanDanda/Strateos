import PropTypes from 'prop-types';
import React     from 'react';

// Presents barcodes in a human friendly format without interfering with copy
// and paste
class Barcode extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.onCopy = this.onCopy.bind(this);
  }

  // splits 8 digit barcode in 2 groups of 4 numbers, space delimited
  // 12345678 -> 1234 5678
  // this was @rhys's requested format. Can explore other options as well.
  format(barcode) {
    const mid = Math.floor(barcode.length / 2);
    return [barcode.slice(0, mid), barcode.slice(mid)].join(' ');
  }

  onCopy(e) {
    e.clipboardData.setData('text/plain', this.props.barcode);
    return e.preventDefault();
  }

  render() {
    return (
      <span onCopy={this.onCopy}>
        {this.format(this.props.barcode)}
      </span>
    );
  }
}

Barcode.displayName = 'Barcode';

Barcode.propTypes = {
  barcode: PropTypes.string.isRequired
};

export default Barcode;
