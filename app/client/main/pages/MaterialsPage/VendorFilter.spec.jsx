import React from 'react';
import sinon from 'sinon';
import Imm from 'immutable';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import VendorActions from 'main/actions/VendorActions';
import VendorFilterHoc from './VendorFilterHOC';
import MaterialOrdersSearchFilters from '../MaterialOrdersPage/MaterialOrdersSearchFilters';

describe('VendorFilter', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const searchOptions = Imm.Map({
    searchVendor: 'all'
  });

  const vendors = {
    results: [
      {
        id: '1',
        name: 'eMolecules'
      },
      {
        id: '2',
        name: 'Sigma Aldrich'
      }
    ]
  };

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('should have vendor filter', () => {
    const actions = {
      onSelectOption: sandbox.stub()
    };

    const getVendorsListStub = sandbox.stub(VendorActions, 'getVendorsList').returns({
      done: (cb) => {
        return { data: cb(vendors), fail: () => ({}) };
      }
    });

    const Component = VendorFilterHoc(MaterialOrdersSearchFilters);
    wrapper = shallow(<Component searchOptions={searchOptions} />);

    const searchFilterProps = wrapper.find('VendorFilter').props().renderVendor(actions.onSelectOption).props;
    expect(getVendorsListStub.calledOnce).to.be.true;
    expect(searchFilterProps).to.deep.include({
      title: 'Vendors',
      currentSelection: 'all',
      options: [
        {
          display: 'All vendors',
          queryTerm: 'all',
          allOption: true
        },
        {
          display: 'eMolecules',
          queryTerm: '1'
        },
        {
          display: 'Sigma Aldrich',
          queryTerm: '2'
        }
      ]
    });
  });
});
