import React               from 'react';
import PropTypes           from 'prop-types';

import './CompoundTagIcon.scss';

class CompoundTagIcon extends React.Component {
  render() {
    return (
      <Choose>
        <When condition={this.props.organizationId}>
          <i className={this.props.privateIcon} />
        </When>
        <Otherwise>
          <img src={this.props.publicIcon} className="public-icon" alt="public" />
        </Otherwise>
      </Choose>
    );
  }
}

CompoundTagIcon.propTypes = {
  privateIcon: PropTypes.string.isRequired,
  publicIcon: PropTypes.string.isRequired,
  organizationId: PropTypes.string
};

export default CompoundTagIcon;
