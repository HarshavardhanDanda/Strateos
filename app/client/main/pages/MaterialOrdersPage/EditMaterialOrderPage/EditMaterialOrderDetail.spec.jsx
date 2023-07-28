import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import EditMaterialOrderDetail from './EditMaterialOrderDetail';

describe('EditMaterialOrderDetails', () => {
  let wrapper;

  const order = Immutable.fromJS({
    material: {
      vendor: {
        name: 'eMolecules'
      },
      name: 'BetaPharma',
      supplier: {
        name: 'BetaPharma'
      },
      material_components: [
        {
          resource: {
            id: 'res123',
            compound: {
              id: 'cmpl1g5x7tsydpeda',
              attributes: {
                organization_id: null,
                smiles: 'CC(C)Cc1ccc([C@@H](C)C(=O)O)cc1'
              }
            }
          }
        }
      ],
      is_private: false,
      material_type: 'individual',
      orderable_materials: [
        {
          price: 554,
          margin: 0.1,
          sku: '436500315',
          tier: 'Tier 3, Ships within 4 weeks',
          id: 'omat1gzyevs8wywfz',
          orderable_material_components: [
            {
              measurement_unit: 'mg',
              mass_per_container: 500,
              type: 'orderable_material_components',
              volume_per_container: 0,
              id: 'omatc1gzyevs8z9ar4'
            }
          ]
        }
      ],
      id: 'mat1gzyevs8uqh7x'
    },
    user: {
      name: 'test_name',
    },
    lab: {
      name: 'Menlo Park'
    },
    count: 1,
    state: 'PENDING',
    note: 'Test',
    tracking_code: '123Test',
    id: 'ko1g5x7tszrpr7g',
    orderable_material: {
      price: 554,
      margin: 0.1,
      sku: '436500315',
      tier: 'Tier 3, Ships within 4 weeks',
      count: 1,
      id: 'omat1gzyevs8wywfz'
    },
    vendor_order_id: 'vendor-order-id'
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should render material order detail', () => {
    wrapper = shallow(<EditMaterialOrderDetail  order={order} isReadOnly />);
    const dt = wrapper.find('dt');
    const dd = wrapper.find('dd');
    expect(dt.at(0).find('TextBody').props().children).to.equal('Shipment');
    expect(dd.at(0).text()).to.equal('BetaPharma');
    expect(dt.at(1).find('TextBody').props().children).to.equal('Supplier');
    expect(dd.at(1).text()).to.equal('BetaPharma');
    expect(dt.at(2).find('TextBody').props().children).to.equal('Date');
    expect(dt.at(3).find('TextBody').props().children).to.equal('Lab');
    expect(dd.at(3).text()).to.equal('Menlo Park');
    expect(dt.at(4).find('TextBody').props().children).to.equal('User');
    expect(dd.at(4).text()).to.equal('test_name');
  });

  it('should have options for order status', () => {
    wrapper = shallow(<EditMaterialOrderDetail order={order} status={'PENDING'} handleChange={() => { }} isReadOnly />);
    expect(wrapper.find('Select').props().value).to.equal('PENDING');
    expect(wrapper.find('Select').props().options).to.deep.equal([
      { name: 'Pending', value: 'PENDING' }, { name: 'Purchased', value: 'PURCHASED' },
      { name: 'Shipped', value: 'SHIPPED' }, { name: 'Arrived', value: 'ARRIVED' },
      { name: 'Checked-in', value: 'CHECKEDIN' }]);
  });

  it('should call the callback', () => {
    const onChange = sinon.spy();
    wrapper = shallow(<EditMaterialOrderDetail  order={order} handleChange={onChange} isReadOnly />);
    const select = wrapper.find('Select');
    select.simulate('change', { target: { value: 'test' } });
    expect(onChange.calledOnce).to.be.true;
    expect(onChange.args[0][0]).to.equal('status');
    expect(onChange.args[0][1]).to.equal('test');
  });

  it('should have order id in view mode', () => {
    wrapper = shallow(<EditMaterialOrderDetail  order={order} isReadOnly />);
    const labeledInput = wrapper.find('LabeledInput').at('0');
    expect(labeledInput.props().label).to.equal('Order ID');
    expect(labeledInput.find('p').text()).to.equal('vendor-order-id');
  });

  it('should have TextInput to enter order id in edit mode', () => {
    wrapper = shallow(<EditMaterialOrderDetail  order={order} isReadOnly={false} />);
    const labeledInput = wrapper.find('LabeledInput').at('0');
    expect(labeledInput.find('TextInput').length).to.equal(1);
    expect(labeledInput.find('TextInput').props().value).to.equal('vendor-order-id');
  });

  it('should call onChange when order id is changed', () => {
    const onChange = sinon.spy();
    wrapper = shallow(<EditMaterialOrderDetail  order={order} handleChange={onChange} isReadOnly={false} />);
    const textInput = wrapper.find('LabeledInput').at('0').find('TextInput');
    textInput.simulate('change', { target: { value: 'vendor-order-id-1' } });
    expect(onChange.called).to.be.true;
    expect(onChange.args[0][0]).to.equal('orderId');
    expect(onChange.args[0][1]).to.equal('vendor-order-id-1');
  });
});
