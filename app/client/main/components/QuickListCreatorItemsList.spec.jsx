import React from 'react';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import ShipmentModel from 'main/models/Shipment';
import CommonUiUtil from 'main/util/CommonUiUtil';
import ImplementationItemActions from 'main/actions/ImplementationItemActions';
import QuickListCreatorItemsList from './QuickListCreatorItemsList';

describe('QuickListCreatorItemsList', () => {
  let wrapper;
  let itemUpdateStub;
  const sandbox = sinon.createSandbox();
  const shipment = new ShipmentModel({ id: 'shipment' });
  const item = Immutable.fromJS({
    id: 'id1',
    storage_condition: 'cold_4',
    name: 'test',
    quantity: '23',
    container_type: 'astestingdf',
    note: '',
    location: 'location1'
  });
  const props = {
    checkingIn: true,
    onDestroy: () => {},
    items: Immutable.List([item])
  };

  beforeEach(() => {
    itemUpdateStub = sandbox.stub(ImplementationItemActions, 'update');
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  it('should render', () => {
    wrapper = shallow(<QuickListCreatorItemsList {...props} />);
  });

  it('should have default location', () => {
    wrapper = shallow(<QuickListCreatorItemsList {...props} />);
    expect(wrapper.find('QuickListCreatorListItem').dive().find('input').at(0)
      .props().value).to.equals(item.get('location'));
  });

  it('should update the items state on location change', () => {
    wrapper = shallow(<QuickListCreatorItemsList {...props} shipment={shipment} />);
    const quickListCreatorItemsListProps = wrapper.find('QuickListCreatorListItem').dive().find('input').at(0)
      .props();
    expect(quickListCreatorItemsListProps.value).to.equals('location1');
    quickListCreatorItemsListProps.onChange({ target: { value: 'location2' } });

    expect(wrapper.find('QuickListCreatorListItem').dive().find('input').at(0)
      .props().value).to.equals('location2');
  });

  it('should make an API call on blur', () => {
    wrapper = shallow(<QuickListCreatorItemsList {...props} shipment={shipment} />);
    wrapper.find('QuickListCreatorListItem').dive().find('input').at(0)
      .props()
      .onChange({ target: { value: 'location2' } });
    wrapper.find('QuickListCreatorListItem').dive().find('input').at(0)
      .props()
      .onBlur();

    expect(itemUpdateStub.calledOnce);
    expect(itemUpdateStub.args[0][0]).to.equals('id1');
    expect(itemUpdateStub.args[0][1].location).to.equals('location2');
  });

  it('should be marked as received on click when item is not received', () => {
    itemUpdateStub.returns({ then: (cb) => {
      cb({
        data: {
          attributes: { checked_in_at: '2023-02-06 19:17:28.662482' }
        } });
    } });
    wrapper = shallow(<QuickListCreatorItemsList {...props} shipment={shipment} />);

    const checkboxProps = wrapper.find('QuickListCreatorListItem').dive().find('input').at(1)
      .props();
    expect(checkboxProps.checked).to.be.false;
    checkboxProps.onChange();

    expect(itemUpdateStub.calledOnce).to.be.true;
    expect(itemUpdateStub.args[0][0]).to.equals('id1');
    expect(itemUpdateStub.args[0][1].checked_in_at).to.be.not.null;
    expect(wrapper.find('QuickListCreatorListItem').dive().find('input').at(1)
      .props().checked).to.be.true;
  });

  it('should be marked as not received when item is received', () => {
    itemUpdateStub.returns({ then: (cb) => {
      cb({
        data: {
          attributes: { checked_in_at: null }
        } });
    } });
    wrapper = shallow(<QuickListCreatorItemsList
      {...props}
      shipment={shipment}
      items={Immutable.List([item.set('checked_in_at', '2023-02-06 19:17:28.662482')])}
    />);

    let checkbox = wrapper.find('QuickListCreatorListItem').dive().find('input').at(1);
    expect(checkbox.props().checked).to.be.true;
    checkbox.props().onChange();

    checkbox = wrapper.find('QuickListCreatorListItem').dive().find('input').at(1);
    expect(itemUpdateStub.calledOnce).to.be.true;
    expect(itemUpdateStub.args[0][0]).to.equals('id1');
    expect(itemUpdateStub.args[0][1].checked_in_at).to.be.null;
    expect(checkbox.props().checked).to.be.false;
  });

  it('should call destroy action and update items state on deleting an item when the shipment prop is passed', () => {
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(true);
    const itemDestroyStub = sandbox.stub(ImplementationItemActions, 'destroy').returns({ done: (cb) => { cb(); } });
    wrapper = shallow(<QuickListCreatorItemsList {...props} shipment={shipment} checkingIn={false} />);

    expect(wrapper.find('QuickListCreatorListItem').length).to.equals(1);
    wrapper.find('QuickListCreatorListItem').props().removeItem();

    expect(itemDestroyStub.calledOnceWithExactly('id1'));
    expect(wrapper.find('QuickListCreatorListItem').length).to.equals(0);
  });

  it('should not delete an item when user denies in confirm notification', () => {
    sandbox.stub(CommonUiUtil, 'confirmWithUser').returns(false);
    const itemDestroyStub = sandbox.stub(ImplementationItemActions, 'destroy').returns({ done: (cb) => { cb(); } });
    wrapper = shallow(<QuickListCreatorItemsList {...props} shipment={shipment} checkingIn={false} />);

    expect(wrapper.find('QuickListCreatorListItem').length).to.equals(1);
    wrapper.find('QuickListCreatorListItem').props().removeItem();

    expect(itemDestroyStub.calledOnce).false;
    expect(wrapper.find('QuickListCreatorListItem').length).to.equals(1);
  });

  it('should call onDestroy prop if shipment prop does not exist', () => {
    const onDestroySpy = sandbox.spy();
    wrapper = shallow(<QuickListCreatorItemsList {...props} onDestroy={onDestroySpy} checkingIn={false} />);

    expect(wrapper.find('QuickListCreatorListItem').length).to.equals(1);
    wrapper.find('QuickListCreatorListItem').props().removeItem();

    expect(onDestroySpy.calledOnceWithExactly(0)).to.be.true;
  });
});
