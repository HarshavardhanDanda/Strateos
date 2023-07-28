import { expect } from 'chai';
import React from 'react';
import { Button } from '@transcriptic/amino';

import ReactUtil from './ReactUtil';

describe('ReactUtil', () => {
  it('should return only text from the component when getStringFromComponent is called ', () => {
    const component = (
      <div className="btn">
        <Button
          icon="fa fa-file"
          size="small"
          type="default"
        >Test Text in the component along with styling and icons
        </Button>
      </div>
    );

    expect(ReactUtil.getStringFromComponent(component)).to.eql('Test Text in the component along with styling and icons');
  });
});
