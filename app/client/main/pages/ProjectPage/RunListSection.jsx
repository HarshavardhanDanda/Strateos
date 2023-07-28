import React from 'react';
import PropTypes from 'prop-types';

function RunListSection({ titleNode, runListNode, showRuns = true }) {
  const blockClassName = 'tx-stack__block tx-stack__block--sm';
  return (
    <div className="tx-stack">
      <h3 className={blockClassName}>
        {titleNode}
      </h3>
      <If condition={showRuns}>
        <div className={blockClassName}>
          {runListNode}
        </div>
      </If>
    </div>
  );
}
RunListSection.propTypes = {
  titleNode: PropTypes.node.isRequired,
  runListNode: PropTypes.node.isRequired,
  showRuns: PropTypes.bool
};

export default RunListSection;
