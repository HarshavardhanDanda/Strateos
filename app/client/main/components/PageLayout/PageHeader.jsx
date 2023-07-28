import React from 'react';
import PropTypes from 'prop-types';

import { ActionMenu } from '@transcriptic/amino';

import './PageHeader.scss';

const rootClass = 'page-header';

function PageHeader(props) {
  return (
    <div className={`${rootClass} ${rootClass}--${props.type}`}>
      <div className="page-header__content tx-view">
        <div className="page-header__crumbs">
          {props.titleArea}
        </div>
        <div className="page-header__labels-actions tx-inline tx-inline--md">
          <div className="page-header__labels tx-inline tx-inline--sm">
            {props.primaryInfoArea}
          </div>
          {((props.actions && props.actions.length) || props.actionMenu) && (
            <div className="page-header__actions">
              {props.actionMenu || (
                (props.actions && (props.actions.length > 0)) && (
                <ActionMenu
                  invert
                  title={props.actionsLabel}
                  options={props.actions.filter((action) => { return !action.disabled; })}
                />
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PageHeader.defaultProps = {
  type: 'primary'
};

PageHeader.propTypes = {
  actionsLabel: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    href: PropTypes.string
  })),
  titleArea: PropTypes.node,
  primaryInfoArea: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  type: PropTypes.oneOf(['primary', 'brand'])
};

PageHeader.numInstances = (parent) => {
  const results = parent && parent.querySelectorAll(`.${rootClass}`);
  return results ? results.length : 0;
};

export default PageHeader;
