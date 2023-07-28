import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Immutable from 'immutable';

import Urls from 'main/util/urls';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';
import ProtocolStore from 'main/stores/ProtocolStore';

function ProtocolTitle({ id, protocol, showUrl, className }) {
  let title;
  if (protocol) {
    title = `${protocol.get('name')} v${protocol.get('version')} (${id})`;
  } else if (id) {
    title = id;
  } else {
    title = 'Unknown';
  }

  return (
    <span className={className}>
      <Choose>
        <When condition={protocol && showUrl}>
          <Link to={Urls.protocol_page(protocol.get('package_id'), protocol.get('name'))}>
            {title}
          </Link>
        </When>
        <Otherwise>
          {title}
        </Otherwise>
      </Choose>
    </span>
  );
}

ProtocolTitle.propTypes = {
  id: PropTypes.string,
  protocol: PropTypes.instanceOf(Immutable.Map),
  showUrl: PropTypes.bool,
  className: PropTypes.string
};

export default ConnectToStoresHOC(ProtocolTitle, ({ id }) => {
  const protocol = ProtocolStore.getById(id);
  return { protocol, id };
});
