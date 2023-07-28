import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Card, Button } from '@transcriptic/amino';

import './DetailPanel.scss';

function DetailPanel(props) {
  const { children, header, onClose, visible, ...elementProps } = props;

  return (
    <Card
      className={
        classnames(
          'detail-panel task-graph-viewer__detail-panel',
          {
            'detail-panel--visible': visible,
            'detail-panel--hidden': !visible
          }
        )
      }
    >
      <div
        {...elementProps}
      >
        <div className="detail-panel__header">
          {header}
          <Button icon="fal fa-times" link height="tall" type="info" onClick={onClose} />
        </div>
        {children}
      </div>
    </Card>
  );
}

DetailPanel.propTypes = {
  header: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  visible: PropTypes.bool
};

export default DetailPanel;
