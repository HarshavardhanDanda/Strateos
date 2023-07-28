import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import SourceFilterHoc from './SourceFilterHOC';
import MaterialsSearchFilters from './MaterialsSearchFilters';

describe('SourceFilter', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should have source filter ', () => {
    const actions = {
      onSelectOption: sandbox.stub()
    };

    const Component = SourceFilterHoc(MaterialsSearchFilters);
    wrapper = shallow(<Component />);

    const searchFilterProps = wrapper.find('SourceFilter').props().renderSource(actions.onSelectOption, 'strateos').props;
    expect(searchFilterProps).to.deep.include({
      title: 'Source',
      currentSelection: 'strateos',
      options: [
        {
          display: 'Strateos',
          queryTerm: 'strateos'
        },
        {
          display: 'eMolecules',
          queryTerm: 'emolecules'
        }
      ]
    });
  });
});
