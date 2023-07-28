import React from 'react';

function PendingDataset() {
  return (
    <div>
      <h3 className="icon-and-adjacent-text">
        <i className="fa fa-sync" />
        Data collection pending
      </h3>
      <p>
        When the instruction behind this dataref executes, your results will show up here.
      </p>
    </div>
  );
}

export default PendingDataset;
