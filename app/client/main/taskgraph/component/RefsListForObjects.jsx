import * as Immutable from 'immutable';
import PropTypes      from 'prop-types';
import React          from 'react';

import ContainerLabel from 'main/taskgraph/component/ContainerLabel';

const GUTTER = 5;

// TODO: `objects` are just refNames, we should rename this prop
function RefsListForObjects({ objects, refColors, onClickRefName }) {
  return (
    // Negative margin offsets the margin from the first row of refs
    <div style={{ marginTop: -GUTTER }}>
      {
        objects.sort().map((refName) => {
          const color = refColors.get(refName);
          let clickHandler;
          if (onClickRefName) {
            clickHandler = (e) => {
              e.stopPropagation();
              onClickRefName(refName);
            };
          }
          return (
            <div
              style={{ float: 'left', marginRight: GUTTER, marginTop: GUTTER }}
              key={refName}
            >
              <ContainerLabel
                disabled={!refName}
                label={refName}
                color={color}
                onClick={clickHandler}
              />
            </div>
          );
        })
      }
    </div>
  );
}

RefsListForObjects.propTypes = {
  objects: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  refColors: PropTypes.instanceOf(Immutable.Map).isRequired,
  onClickRefName: PropTypes.func
};

export default RefsListForObjects;
