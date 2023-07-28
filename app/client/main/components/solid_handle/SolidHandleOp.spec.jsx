import React from 'react';
import Immutable from 'immutable';

import SolidHandleOp from './SolidHandleOp';

describe('SolidHandleOp', () => {
  it('should render without throwing', () => {
    return enzyme.shallow(
      <SolidHandleOp
        run={Immutable.Map({})}
        instruction={Immutable.Map({})}
      />
    );
  });
});
