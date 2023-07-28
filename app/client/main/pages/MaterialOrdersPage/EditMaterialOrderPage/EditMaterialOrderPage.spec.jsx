import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import KitOrderActions from 'main/actions/KitOrderActions';
import { Button } from '@transcriptic/amino';
import Urls from 'main/util/urls';
import { PageLayout } from 'main/components/PageLayout';
import MaterialOrderGroupItems from 'main/pages/MaterialOrdersPage/MaterialOrderDetailsPage/MaterialOrderGroupItems';
import MaterialOrderIndividualItems from 'main/pages/MaterialOrdersPage/MaterialOrderDetailsPage/MaterialOrderIndividualItems';
import MaterialStore from 'main/stores/MaterialStore';
import MaterialAPI from 'main/api/MaterialAPI';
import _ from 'lodash';
import KitOrderStore from 'main/stores/KitOrderStore';
import { groupMaterial, kitOrderActions } from 'main/pages/MaterialOrdersPage/mocks/materials.js';
import EditMaterialOrderDetail from './EditMaterialOrderDetail';
import EditMaterialOrderPage from './EditMaterialOrderPage';

describe('MaterialOrderDetails', () => {
  const sandbox = sinon.createSandbox();
  const individualMaterial = groupMaterial.set('material_type', 'individual');
  let kitOrderActionsCheckedIn = kitOrderActions.set('checked_in_at', '2015-06-02 21:57:48.056');
  kitOrderActionsCheckedIn = kitOrderActionsCheckedIn.setIn(['orderable_material', 'material', 'id'], 'mat1');
  const  shippedOrder = kitOrderActionsCheckedIn.set('state', 'SHIPPED');
  let wrapper;
  let materialStoreGetByIdStub;

  beforeEach(() => {
    sandbox.stub(KitOrderActions, 'load')
      .returns({
        done: (cb) => {
          cb(kitOrderActions);
        }
      });

    sandbox.stub(KitOrderStore, 'getById')
      .withArgs('123').returns(kitOrderActions)
      .withArgs('1234')
      .returns(kitOrderActionsCheckedIn)
      .withArgs('12345')
      .returns(shippedOrder);

    sandbox.stub(MaterialAPI, 'get')
      .returns({
        done: (cb) => {
          cb({
            data: {}
          });
        }
      });

    materialStoreGetByIdStub = sandbox.stub(MaterialStore, 'getById');
    materialStoreGetByIdStub.withArgs('mat1gzyevs8uqh7x').returns(groupMaterial)
      .withArgs('mat1')
      .returns(individualMaterial);
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('should render group material order',  () => {
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123', mode: 'edit' } }} />);
    const header = wrapper.find('.edit-material-order-page__item-header');
    const groupItems = wrapper.find(MaterialOrderGroupItems);

    expect(header.text()).to.equal('Shipment BetaPharma');
    expect(groupItems.length).to.equal(1);
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'price'])).to.equal(554);
    expect(groupItems.at(0).props().data.getIn([0, 'name'])).to.equal('BetaPharma');
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'sku'])).to.equal('pHSG298-PC');
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'count'])).to.equal(1);
  });

  it('should render individual material if type is individual',  () => {
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '1234', mode: 'edit' } }} />);
    const header = wrapper.find('.edit-material-order-page__item-header');
    const groupItems = wrapper.find(MaterialOrderIndividualItems);

    expect(header.text()).to.equal('Shipment BetaPharma');
    expect(groupItems.length).to.equal(1);
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'price'])).to.equal(554);
    expect(groupItems.at(0).props().data.getIn([0, 'name'])).to.equal('BetaPharma');
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'sku'])).to.equal('pHSG298-PC');
    expect(groupItems.at(0).props().data.getIn([0, 'orderable_materials', 0, 'count'])).to.equal(1);
  });

  it('should trigger update callback on click',  () => {
    const update = sandbox.stub(KitOrderActions, 'update').returns({
      done: (cb) => {
        cb();
        return { fail: cb => cb() };
      },
    });
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '1234', mode: 'edit' } }} history={{ replace: foo => foo }} />);
    let button = wrapper.find(Button).at(1);
    expect(button.props().disabled).to.be.true;
    const order = Immutable.fromJS({
      count: 3,
      id: '123',
      material: individualMaterial,
      orderable_material: {
        price: 55,
        name: 'BetaPharma',
        sku: 'pHSG298-PC',
        count: 4,
        material_type: 'individual'
      }
    });
    wrapper.setState({ shouldUpdate: true, order: order });
    button = wrapper.find(Button).at(1);
    expect(button.props().disabled).to.be.false;
    button.simulate('click');
    expect(update.calledOnce).to.be.true;
    expect(update.args[0][0]).to.equal('123');
    expect(update.args[0][1].count).to.equal(4);
  });

  it('should delete order on delete action click', () => {
    const destroy = sandbox.stub(KitOrderActions, 'destroy').returns({
      done: () => {
      }
    });
    sandbox.stub(EditMaterialOrderPage.prototype, 'isConfirm').returns(true);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123', mode: 'edit' } }} history={{ replace: foo => foo }} />);
    const PageHeader = wrapper.find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions.length).to.equal(1);
    actions[0].onClick();
    expect(destroy.calledOnce).to.be.true;
  });

  it('should not delete order when delete action is cancelled',  () => {
    const destroy = sandbox.stub(KitOrderActions, 'destroy').returns({
      done: () => {
      }
    });
    sandbox.stub(EditMaterialOrderPage.prototype, 'isConfirm').returns(false);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123', mode: 'edit' } }} history={{ replace: foo => foo }} />);
    const PageHeader = wrapper.find('PageLayout').prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions.length).to.equal(1);
    actions[0].onClick();
    expect(destroy.calledOnce).to.be.false;
  });

  it('should have the props to view all materials set',  () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES).returns(true);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123' } }} />);
    const groupItems = wrapper.find('MaterialOrderGroupItems');
    expect(groupItems.props().canManageAllMaterials).to.equal(true);
    expect(groupItems.props().canViewPublicMaterials).to.not.equal(true);
  });

  it('should have the props to view public materials set',  () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_PUBLIC_MATERIALS).returns(true);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123' } }} />);
    const groupItems = wrapper.find('MaterialOrderGroupItems');
    expect(groupItems.props().canManageAllMaterials).to.not.equal(true);
    expect(groupItems.props().canViewPublicMaterials).to.equal(true);
  });

  it('should not have the props set as they have no permissions',  () => {
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123' } }} />);
    const groupItems = wrapper.find('MaterialOrderGroupItems');
    expect(groupItems.props().canManageAllMaterials).to.not.equal(true);
    expect(groupItems.props().canViewPublicMaterials).to.not.equal(true);
  });

  it('should have read only view when mode is not edit',  () => {
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123' } }} history={{ replace: foo => foo }} />);
    const materialOrderDetail = wrapper.find(EditMaterialOrderDetail);
    expect(materialOrderDetail.prop('isReadOnly')).to.be.true;
    const materialOrderGroupItems = wrapper.find(MaterialOrderGroupItems);
    expect(materialOrderGroupItems.prop('isReadOnly')).to.be.true;
    const buttons = wrapper.find(Button);
    expect(buttons.length).to.equal(1);
    expect(buttons.at(0).children().text()).to.equal('Cancel');
  });

  it('should have edit action when mode is view only',  () => {
    const mockReplace = sandbox.stub();
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123', } }} history={{ replace: mockReplace }} />);
    const PageHeader = wrapper.dive().find(PageLayout).prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions.length).to.equal(1);
    expect(actions[0].text).to.equal('Edit Order');
    actions[0].onClick();
    expect(mockReplace.args[0][0]).to.deep.equal({ pathname: Urls.edit_material_order('123') });
  });

  it('should not have edit action when mode is view only, for checked in order',  () => {
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '1234', mode: 'view' } }} history={{ replace: foo => foo }} />);
    const PageHeader = wrapper.dive().find(PageLayout).prop('PageHeader');
    const actions = PageHeader.props.actions;
    expect(actions.length).to.equal(0);
  });

  it('should have the permissions to click the compound', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    getACS.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(true);
    wrapper = shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '12345', mode: 'edit' } }} history={{ replace: foo => foo }} />);
    const materialOrderDetail = wrapper.find(EditMaterialOrderDetail);
    expect(materialOrderDetail.prop('isReadOnly')).to.be.false;
    const materialOrderIndividualItems = wrapper.find(MaterialOrderIndividualItems);
    expect(materialOrderIndividualItems.prop('isReadOnly')).to.be.true;
    const buttons = wrapper.find(Button);
    expect(buttons.length).to.equal(2);
  });

  it('should not have the permissions to click the compound',  () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(false);
    getACS.withArgs(FeatureConstants.VIEW_LAB_COMPOUNDS).returns(false);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '1234' } }} />);
    const individualItems = wrapper.find(MaterialOrderIndividualItems);
    expect(individualItems.props().onCompoundClick).to.equal(false);
  });

  it('should disable update button if count is not valid',  () => {
    materialStoreGetByIdStub.withArgs('mat1gzyevs8uqh7x').returns(individualMaterial);
    wrapper =  shallow(<EditMaterialOrderPage match={{ params: { materialOrderId: '123', mode: 'edit' } }} history={{ replace: foo => foo }} />);
    let button = wrapper.find(Button).at(1);
    expect(button.props().disabled).to.be.true;
    expect(wrapper.state().isFormValid).to.be.true;
    expect(wrapper.state().forceValidation).to.be.false;

    const materialOrderIndividualItems = wrapper.find('MaterialOrderIndividualItems');
    materialOrderIndividualItems.props().handleCountChange('', 'omat1gzyevs8wywfz');
    button = wrapper.find(Button).at(1);
    expect(button.props().disabled).to.be.true;
    expect(wrapper.state().forceValidation).to.be.true;
    expect(wrapper.state().isFormValid).to.be.false;

    materialOrderIndividualItems.props().handleCountChange(20, 'omat1gzyevs8wywfz');
    button = wrapper.find(Button).at(1);
    expect(button.props().disabled).to.be.false;
    expect(wrapper.state().forceValidation).to.be.false;
    expect(wrapper.state().isFormValid).to.be.true;
  });
});
