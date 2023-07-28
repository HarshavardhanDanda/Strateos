import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import CompoundSelectorDrawer from 'main/components/Compounds/CompoundSelector/CompoundSelectorDrawer';
import { SinglePaneModal } from 'main/components/Modal';
import AddResourceModal from './AddResourceModal';
import EditResource from './EditResource';

describe('AddResourceModal', () => {
  let wrapper;

  afterEach(() => {
    if (wrapper) wrapper.unmount();
  });

  it('should toggle compound selector drawer', () => {
    wrapper = shallow(<AddResourceModal />);
    let compoundSelectorDrawer = wrapper.find(CompoundSelectorDrawer);
    const editResource = wrapper.find(EditResource);

    expect(compoundSelectorDrawer.props().open).to.be.false;

    editResource.props().onSelectCompound();
    compoundSelectorDrawer = wrapper.find(CompoundSelectorDrawer);
    expect(compoundSelectorDrawer.props().open).to.be.true;

    compoundSelectorDrawer.props().closeDrawer();
    compoundSelectorDrawer = wrapper.find(CompoundSelectorDrawer);
    expect(compoundSelectorDrawer.props().open).to.be.false;
  });

  it('should disable Done button if resource name is empty', () => {
    wrapper = shallow(<AddResourceModal />);
    expect(wrapper.find(SinglePaneModal).dive().dive().find('SinglePaneModal')
      .dive()
      .find('AjaxButton')
      .props().disabled).to.equal('Must be specified');
  });

  it('should enable Done button if resource name is not empty', () => {
    wrapper = shallow(<AddResourceModal />);
    const resource = {
      name: 'Test-Resource1',
      sensitivities: [],
      purity: 0,
      compound_id: undefined,
      compound: null
    };
    wrapper.find(EditResource).props().update(resource);
    expect(wrapper.find(SinglePaneModal).dive().dive().find('SinglePaneModal')
      .dive()
      .find('AjaxButton')
      .props().disabled).to.equal(false);
  });
});
