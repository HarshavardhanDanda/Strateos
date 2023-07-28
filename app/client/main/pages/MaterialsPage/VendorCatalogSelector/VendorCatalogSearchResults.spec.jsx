import React from 'react';
import Immutable from 'immutable';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { List, Molecule, Table } from '@transcriptic/amino';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import VendorCatalogSearchResults from './VendorCatalogSearchResults';

describe('VendorCatalogSearchResults', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const data = Immutable.fromJS([
    {
      id: 'id',
      smiles: 'CC',
      supplier: {
        name: 'supplier name',
        price: '10',
        currency: 'USD',
        units: 'mg',
        quantity: '5',
        catalog: {
          type: 'delivery in 1-3 days'
        }
      }
    },
    {
      id: 'id2',
      smiles: 'CC',
      supplier: {
        name: 'supplier name',
        price: '10',
        currency: 'USD',
        units: 'mg',
        quantity: '5',
        catalog: {
          type: 'delivery in 1-3 days'
        }
      }
    }
  ]);

  const props = {
    data,
    isSearching: false,
    selected: [],
    onSelectRow: () => {}
  };

  it('should have 5 visible columns', () => {
    wrapper = shallow(<VendorCatalogSearchResults {...props} />);

    expect(wrapper.find(List).length).to.equal(1);
    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');
    expect(headerRow.length).to.equal(6); //  1 checkbox + 5 columns
  });

  it('should have corresponding persistence key info to enable user preference', () => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
    sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
    wrapper = mount(<VendorCatalogSearchResults {...props} />);
    const list = wrapper.find(List);

    expect(list.props().persistKeyInfo).to.be.deep.equal({
      appName: 'Web',
      orgId: 'org13',
      userId: 'user3202',
      key: KeyRegistry.MATERIAL_VENDORS_CATALOG_TABLE
    });
  });

  it('should display search results', () => {
    wrapper = shallow(<VendorCatalogSearchResults {...props} />);
    const table = wrapper.find(List).dive().find(Table).dive();
    const headerRow = table.find('HeaderCell');

    expect(headerRow.at(1).dive().text()).to.equal('structure');
    expect(headerRow.at(2).dive().text()).to.equal('supplier');
    expect(headerRow.at(3).dive().text()).to.equal('delivery');
    expect(headerRow.at(4).dive().text()).to.equal('cost');
    expect(headerRow.at(5).dive().text()).to.equal('amount');

    const bodyRow = table.find('BodyCell').find('p');
    expect(table.find('BodyCell').at(1).dive().find(Molecule)).to.have.length(1);
    expect(bodyRow.at(0).text()).to.equal('supplier name');
    expect(bodyRow.at(1).text()).to.equal('delivery in 1-3 days');
    expect(bodyRow.at(2).text()).to.equal('$10');
    expect(bodyRow.at(3).text()).to.equal('5mg');
  });

  it('should show selected rows', () => {
    wrapper = shallow(
      <VendorCatalogSearchResults
        {...props}
      />
    );
    wrapper.find(List).prop('onSelectRow')(props.data, false, { foo: true, bar: true });
    expect(wrapper.find(List).props().selected).to.deep.equal({ foo: true, bar: true });
  });

  it('should update state when moved to a different page in pagination', () => {
    wrapper = shallow(<VendorCatalogSearchResults {...props} />);
    wrapper.instance().setState({ pageSize: 1 });
    wrapper.instance().setState({ maxPage: Math.ceil(wrapper.prop('data').size / wrapper.state('pageSize')) });
    expect(wrapper.state('currentPage')).to.equal(1);
    const pagination = wrapper.find(List).dive().find('Pagination')
      .dive();
    pagination.find('p').at(2).simulate('click');
    expect(wrapper.state('currentPage')).to.equal(2);
  });

  it('should compute and render the List component with updated props when its props are updated', () => {
    wrapper = shallow(<VendorCatalogSearchResults {...props} />);
    let list = wrapper.find('List');
    expect(list.prop('data')).deep.equal(props.data);
    expect(list.prop('maxPage')).to.equal(1);
    expect(list.prop('currentPage')).to.equal(1);

    const updatedData = Immutable.fromJS([...props.data.toJS(),
      { id: 'id3', smiles: 'CCC' }, { id: 'id4', smiles: 'CCC' },
    ]);
    wrapper.setState({ pageSize: 2 });
    wrapper.setProps({ ...props, data: updatedData });
    list = wrapper.find('List');
    expect(list.prop('data')).deep.equal(updatedData.slice(0, 2));
    expect(list.prop('maxPage')).to.equal(2);
    expect(list.prop('currentPage')).to.equal(1);

    const pagination = list.dive().find('Pagination')
      .dive();
    pagination.find('p').at(2).simulate('click');

    list = wrapper.find('List');
    expect(list.prop('data')).deep.equal(updatedData.slice(2, 4));
    expect(list.prop('maxPage')).to.equal(2);
    expect(list.prop('currentPage')).to.equal(2);
  });
});
