import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable  from 'immutable';
import sinon from 'sinon';
import { Button, ButtonGroup, ZeroState } from '@transcriptic/amino';

import SessionStore from 'main/stores/SessionStore';
import ModalActions from 'main/actions/ModalActions';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import FeatureStore from 'main/stores/FeatureStore';
import LabAPI from 'main/api/LabAPI';
import { eMoleculesMaterials, individualMaterials, groupMaterials } from 'main/pages/MaterialOrdersPage/mocks/materials.js';
import MaterialOrdersDetailPage from './MaterialOrderDetailsPage';

describe('MaterialOrderDetailsPage', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'orgcts2at9rmdx' }));
  });

  const data = Immutable.List([
    Immutable.Map({
      id: '1',
      name: 'material1',
      sku: '123',
      count: 3,
      cost: '1234'
    }),
    Immutable.Map({
      id: '2',
      name: 'material2',
      sku: '134',
      count: 5,
      cost: '12'
    })
  ]);

  const labs = {
    data: [{
      id: 'lab1',
      attributes: { name: 'Menlo Park' }
    }, {
      id: 'lab2',
      attributes: { name: 'SanDiego' }
    }]
  };

  it('should show zero state', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const zeroState = wrapper.find(ZeroState);
    expect(zeroState.length).to.equal(1);
    expect(zeroState.dive().find('TextSubheading').dive().find('Text')
      .dive()
      .find('h2')
      .text()).to.equal(' There are no materials being ordered, add some. ');
    expect(zeroState.dive().find(Button).props().children).to.equal('Add');
  });

  it('should show material list', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({
      groupMaterials: data
    });
    expect(wrapper.find('MaterialOrderGroupItems').length).to.equal(1);
    expect(wrapper.find(ButtonGroup).length).to.equal(2);
  });

  it('should open MaterialPickerModal on clicking Add button', () => {
    const modalAction = sandbox.stub(ModalActions, 'open');
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const add = wrapper.find(ZeroState).dive().find(Button);
    add.simulate('click');
    expect(modalAction.calledOnce).to.be.true;
    expect(modalAction.calledWith('SEARCH_MATERIAL_MODAL')).to.be.true;
  });

  it('should trigger callback on clicking Create button', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const CreateOrderSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');
    let button = wrapper.find(ButtonGroup).at(0).find(Button).at(1);

    expect(button.props().disabled).to.be.true;
    wrapper.setState({ groupMaterials: data });
    button = wrapper.find(ButtonGroup).at(1).find(Button).at(1);

    expect(button.props().disabled).to.be.false;
    button.simulate('click');
    expect(CreateOrderSpy.calledOnce).to.be.true;
  });

  it('should not trigger callback on clicking Create button if count is not valid for group material order', () => {
    const createOrderSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({
      groupMaterials: groupMaterials,
      materialType: 'group'
    });
    wrapper.find('MaterialOrderGroupItems').props().handleCountChange(-10, 'omat1gzyevs8uqh7x');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.true;
    expect(wrapper.state().forceValidation).to.be.true;
    expect(createOrderSpy.callCount).to.be.equal(0);

    wrapper.find('MaterialOrderGroupItems').props().handleCountChange(10, 'omat1gzyevs8uqh7x');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.false;
    expect(createOrderSpy.callCount).to.be.equal(1);
  });

  it('should not trigger callback on clicking Create button if count is not valid for individual material order', () => {
    const createOrderSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({
      individualMaterials: individualMaterials,
      materialType: 'individual'
    });
    wrapper.find('MaterialOrderIndividualItems').props().handleCountChange(-10, 'omat1gzyevs8uqh7x');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.true;
    expect(wrapper.state().forceValidation).to.be.true;
    expect(createOrderSpy.callCount).to.be.equal(0);

    wrapper.find('MaterialOrderIndividualItems').props().handleCountChange(10, 'omat1gzyevs8uqh7x');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.false;
    expect(createOrderSpy.callCount).to.be.equal(1);
  });

  it('should not trigger callback on clicking Create button if count is not valid for emolecules order', () => {
    const createOrderSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({
      emoleculeVendorMaterials: eMoleculesMaterials,
      individualMaterialSource: 'emolecules',
      materialType: 'individual'
    });
    wrapper.find('MaterialOrderEmoleculesItems').props().handleCountChange(-10, 'NCc1ccccc1_2035_483383085_77_USD');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.true;
    expect(wrapper.state().forceValidation).to.be.true;
    expect(createOrderSpy.callCount).to.be.equal(0);

    wrapper.find('MaterialOrderEmoleculesItems').props().handleCountChange(10, 'NCc1ccccc1_2035_483383085_77_USD');
    wrapper.find(Button).at(3).simulate('click');
    expect(wrapper.find(Button).at(3).props().disabled).to.be.false;
    expect(createOrderSpy.callCount).to.be.equal(1);
  });

  it('should set correct payload format for Group materials', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const MaterialOrderActionsSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');

    wrapper.setState({ groupMaterials, materialType: 'group', labId: 'lab12345' });
    const button = wrapper.find(ButtonGroup).at(1).find(Button).at(1);
    button.simulate('click');
    expect(MaterialOrderActionsSpy.getCall(-1).args[0]).to.deep.equal({
      kit_orders: [{ orderable_material_id: 'omat1gzyevs8uqh7x', count: 1, lab_id: 'lab12345' }]
    });
  });

  it('should set correct payload format for Individual materials', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const MaterialOrderActionsSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');

    wrapper.setState({ individualMaterials, materialType: 'individual', labId: 'lab12345' });
    const button = wrapper.find(ButtonGroup).at(1).find(Button).at(1);
    button.simulate('click');
    expect(MaterialOrderActionsSpy.getCall(-1).args[0]).to.deep.equal({
      kit_orders: [{ orderable_material_id: 'omat1gzyevs8uqh7x', count: 1, lab_id: 'lab12345' }]
    });
  });

  it('should set correct payload format for eMolecules materials', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const MaterialOrderActionsSpy = sandbox.spy(MaterialOrderActions, 'bulkCreate');

    wrapper.setState({ emoleculeVendorMaterials: eMoleculesMaterials, materialType: 'individual', individualMaterialSource: 'emolecules', labId: 'lab12345' });
    const button = wrapper.find(ButtonGroup).at(1).find(Button).at(1);
    button.simulate('click');
    expect(MaterialOrderActionsSpy.getCall(-1).args[0]).to.deep.equal({
      material_orders: [{
        cas_number: '100-46-9',
        count: '2',
        lab_id: 'lab12345',
        price: 77,
        mass_per_container: 5,
        sku: '483383085',
        smiles: 'NCc1ccccc1',
        supplier_name: 'Toronto Research Chemicals',
        tier: 'Tier 2, Shipped within 2-10 business days',
        mass_units: 'g'
      }, {
        cas_number: '100-46-9',
        count: '5',
        lab_id: 'lab12345',
        price: 33,
        volume_per_container: 15,
        sku: '483383085',
        smiles: 'NCc1ccccc1',
        supplier_name: 'Toronto Research Chemicals',
        tier: 'Tier 2, Shipped within 2-10 business days',
        volume_units: 'ml'
      }]
    });
  });

  it('should increase the quantity by one if already selected material is selected again for individual materials', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({ individualMaterials, materialType: 'individual', labId: 'lab12345' });
    expect(wrapper.state().individualMaterials.get(0).getIn(['orderable_materials', 0, 'count'])).to.be.equal(1);
    const materialSelectorModal = wrapper.find('MaterialsSelectorModal');
    materialSelectorModal.prop('onMaterialSelected')([], individualMaterials);
    expect(wrapper.state().individualMaterials.get(0).getIn(['orderable_materials', 0, 'count'])).to.be.equal(2);
  });

  it('should increase the quantity by one if already selected material is selected again for group materials', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({ groupMaterials, materialType: 'group', labId: 'lab12345' });
    expect(wrapper.state().groupMaterials.get(0).getIn(['orderable_materials', 0, 'count'])).to.be.equal(1);
    const materialSelectorModal = wrapper.find('MaterialsSelectorModal');
    materialSelectorModal.prop('onMaterialSelected')([], groupMaterials);
    expect(wrapper.state().groupMaterials.get(0).getIn(['orderable_materials', 0, 'count'])).to.be.equal(2);
  });

  it('should show labs in the material order details page ', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    wrapper.setState({
      labId: 'lb123'
    });
    expect(wrapper.find('MaterialOrderDetails').length).to.equal(1);
    expect(wrapper.find('MaterialOrderDetails').props().labId).to.be.equal('lb123');
  });

  it('should trigger fetchLabs method on componentDidMount', () => {
    wrapper = shallow(<MaterialOrdersDetailPage />);
    const spy = sandbox.spy(MaterialOrdersDetailPage.prototype, 'fetchLabs');
    wrapper.instance().componentDidMount();
    expect(spy.calledOnce).to.be.true;
  });

  it('should display the only labs returned by the feature store ', () => {
    const labIds = ['lab1'];
    wrapper = shallow(<MaterialOrdersDetailPage />);
    sandbox.stub(LabAPI, 'index').returns({
      done: (cb) => {
        cb(labs);
        return { fail: () => ({}) };
      }
    });
    sandbox.stub(FeatureStore, 'getLabIdsWithFeatures').returns(Immutable.fromJS(labIds));
    wrapper.instance().componentDidMount();
    expect(wrapper.instance().state.labs.length).to.equal(1);
    expect(wrapper.instance().state.labId).to.equal('lab1');
  });
});
