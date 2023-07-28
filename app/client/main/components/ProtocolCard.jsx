import PropTypes from 'prop-types';
import React     from 'react';

import Urls from 'main/util/urls';

import { Card, Highlighted } from '@transcriptic/amino';

class ProtocolCard extends React.Component {
  constructor() {
    super();

    this.state = {
      showOverlay: false
    };
  }

  render() {
    const { protocol, query } = this.props;

    return (
      <Card
        to={Urls.package_protocol(protocol.get('package_id'), protocol.get('name'))}
        className="protocol-card container-rect grid-element"
        fadeOverflow
      >
        <i className="fa fa-code card__icon" />
        <div className="card__header">
          <p className="card__title">
            <Highlighted
              text={protocol.get('name')}
              highlight={query}
            />
          </p>
          <If condition={(protocol.get('version'))}>
            <span className="version">
              {protocol.get('version')}
            </span>
          </If>
        </div>
        <div className="card__footer">
          <div className="detail">
            <span className="desc">
              <Highlighted
                text={protocol.get('description')}
                highlight={query}
              />
            </span>
          </div>
        </div>
      </Card>
    );
  }
}

ProtocolCard.propTypes = {
  protocol: PropTypes.object.isRequired,
  query: PropTypes.string
};

export default ProtocolCard;
