import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ModalActions from 'main/actions/ModalActions';
import MaterialStore from 'main/stores/MaterialStore';
import MaterialsSelectorModal from './MaterialsSelectorModal';

describe('MaterialsSelectorModal', () => {
  let wrapper;
  let onMaterialSelectSpy;
  let onModalCloseSpy;

  const sandbox = sinon.createSandbox();

  const material1 = Immutable.fromJS({ id: 'material1' });
  const material2 = Immutable.fromJS({ id: 'material2' });

  const findMaterialSelector = () => wrapper.find('ConnectedSelectorContentHOC').at(0).dive().find('SelectorContentHOC')
    .dive()
    .find('MaterialsSelector');

  beforeEach(() => {
    const getById = sandbox.stub(MaterialStore, 'getById');
    getById.withArgs('material1').returns(material1);
    getById.withArgs('material2').returns(material2);

    onMaterialSelectSpy = sandbox.spy();
    onModalCloseSpy = sandbox.spy(ModalActions, 'close');
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sandbox.restore();
  });

  it('should render modal and materials selector', () => {
    wrapper = shallow(
      <MaterialsSelectorModal onMaterialSelected={onMaterialSelectSpy} />
    );

    expect(findMaterialSelector()).to.have.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal')).to.have.length(1);
    expect(wrapper.find('ConnectedSinglePaneModal').props()).to.include({ modalId: 'SEARCH_MATERIAL_MODAL', title: 'Select group materials' });
  });

  it('should be disabled when no material is selected', () => {
    wrapper = shallow(<MaterialsSelectorModal onMaterialSelected={onMaterialSelectSpy} />);
    expect(wrapper.find('ConnectedSinglePaneModal').prop('acceptBtnDisabled')).to.equal(true);
  });

  it('should handle multi-select', () => {
    wrapper = shallow(<MaterialsSelectorModal onMaterialSelected={onMaterialSelectSpy} />);

    findMaterialSelector().prop('onSelectRow')({ material1: true, material2: true });
    expect(onMaterialSelectSpy.notCalled).to.be.true;

    wrapper.find('ConnectedSinglePaneModal').prop('onAccept')();
    expect(onMaterialSelectSpy.calledWith(['rs1', 'rs2'], [material1, material2]));
    expect(onModalCloseSpy.calledOnce);
  });

  it('should handle single-select', () => {
    wrapper = shallow(<MaterialsSelectorModal onMaterialSelected={onMaterialSelectSpy} isSingleSelect />);
    findMaterialSelector().prop('onSelectRow')({ rs1: true });

    expect(wrapper.find('ConnectedSinglePaneModal').prop('renderFooter')).to.equal(false);
    expect(onMaterialSelectSpy.calledWith(['rs1'], [material1]));
    expect(onModalCloseSpy.calledOnce);
  });
});
