import React from 'react';
import { Icon, TextBody, Tooltip } from '@transcriptic/amino';

import './ImplementationProjectIndicator.scss';

interface Props {
  isHighlighted?: boolean;
  organizationName?: string;
  onClick?: () => {}
}

function ImplementationProjectIndicator(props: Props) {
  const { isHighlighted, organizationName, onClick } = props;

  const title = `This is ${organizationName ? ('a ' + organizationName) : 'an'} implementation project`;

  return (
    <div className="implementation-project-indicator">
      {organizationName && (
        <TextBody tag="span" invert>{organizationName}</TextBody>
      )}
      <Tooltip
        title={title}
        placement="bottom"
      >
        <Icon
          icon="fa fa-eye-slash"
          color="invert"
          className={!isHighlighted ? 'implementation-project-indicator__eye-icon' : ''}
          onClick={onClick}
        />
      </Tooltip>
    </div>
  );
}

ImplementationProjectIndicator.defaultProps = {
  isHighlighted: true
};

export default ImplementationProjectIndicator;
