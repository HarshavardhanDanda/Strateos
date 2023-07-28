import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import Immutable from 'immutable';
import OrganizationStore from 'main/stores/OrganizationStore';
import { NewOrgModal } from './NewOrgModal';

describe('New Org Modal test', () => {

  let wrapper;
  const sandbox = sinon.createSandbox();
  const labs = Immutable.fromJS([
    {
      id: 'lab1',
      operated_by_id: 'test_operator_id',
      name: 'Menlo Park'
    }
  ]);

  const props = {
    labs,
    modalId: 'NewOrgModalId'
  };

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('Organizations table should render on load', () => {
    wrapper = shallow(
      <NewOrgModal
        {...props}
      />);
  });

  it('Organizations modal should have name input', () => {
    wrapper = shallow(
      <NewOrgModal
        {...props}
      />);
    expect(wrapper.find('LabeledInput').at(1).props().label).eq('Name');
  });

  it('Organizations modal should have URL input', () => {
    wrapper = shallow(
      <NewOrgModal
        {...props}
      />);
    expect(wrapper.find('LabeledInput').at(2).props().label).eq('URL');
  });

  it('Organizations modal should have Owner user input', () => {
    wrapper = shallow(<NewOrgModal  {...props} />);
    expect(wrapper.find('LabeledInput').at(3).props().label).eq('Owning User (Must Be Existing)');
  });

  it('Organizations modal should have Organization type input', () => {
    wrapper = shallow(<NewOrgModal {...props} />);
    expect(wrapper.find('LabeledInput').at(4).props().label).eq('Organization Type');
  });

  it('Organizations modal should have Lab selection input if org type is CL', () => {
    wrapper = shallow(<NewOrgModal {...props} />);
    expect(wrapper.find('LabeledInput').at(5).props().label).eq('Lab');
  });

  it('should have Implementation Organization checkbox', () => {
    wrapper = shallow(<NewOrgModal {...props} />);
    expect(wrapper.find('.new-org-modal__checkbox').find('Checkbox')).to.have.length(1);
  });

  it('should call onToggleImplementation when checked', () => {
    const onImplementationOrgSelectedSpy = sandbox.stub(NewOrgModal.prototype, 'onToggleImplementation');

    wrapper = shallow(<NewOrgModal {...props} />);
    const checkbox = wrapper.find('.new-org-modal__checkbox').find('Checkbox');
    checkbox.simulate('change', { target: { checked: 'checked' } });
    expect(onImplementationOrgSelectedSpy.calledOnce).to.be.true;
  });

  it('should have title as New Implmentation when checked', () => {
    wrapper = shallow(<NewOrgModal {...props} />);
    const checkbox = wrapper.find('.new-org-modal__checkbox').find('Checkbox');
    checkbox.simulate('change', { target: { checked: 'checked' } });
    expect(wrapper.find('ConnectedSinglePaneModal').props().title).to.equal('New Implementation');

  });

  it('should have search input for cloudLabCustomers when implementation org is selected', () => {
    wrapper = shallow(
      <NewOrgModal {...props} />).setState({ isImplementation: false });
    const checkbox = wrapper.find('.new-org-modal__checkbox').find('Checkbox');
    checkbox.simulate('change', { target: { checked: 'checked' } });

    const searchInput = wrapper.find({ label: 'Customer' });
    expect(searchInput).to.have.length(1);
    expect(searchInput.find('AjaxedAjaxManager').props().placeholder).to.equal('Search for a customer');
  });

  it('should disable Organization Type input and default to CL, when implementation org is selected', () => {
    wrapper = shallow(
      <NewOrgModal {...props} />).setState({ isImplementation: false });
    const checkbox = wrapper.find('.new-org-modal__checkbox').find('Checkbox');
    checkbox.simulate('change', { target: { checked: 'checked' } });

    const orgTypeInput = wrapper.find({ label: 'Organization Type' });
    expect(orgTypeInput.find('Select').props().disabled).to.be.true;
    expect(orgTypeInput.find('Select').props().value).to.equal('CL');
  });

  it('should show Sector Input(kind selection), when implementation org is not selected', () => {
    wrapper = shallow(<NewOrgModal {...props} />).setState({ isImplementation: false });
    const sectorInput = wrapper.find({ label: 'Sector' });
    expect(sectorInput).to.have.length(1);
  });

  it('should not show Sector Input(kind selection), when implementation org is selected', () => {
    wrapper = shallow(
      <NewOrgModal
        {...props}
      />).setState({ isImplementation: true });
    const sectorInput = wrapper.find({ label: 'Sector' });
    expect(sectorInput).to.have.length(0);
  });

  it('should auto populate name, subdomain of the customer, when customer is selected', () => {
    const customer = Immutable.Map({
      id: 'test_id',
      name: 'test_name',
      subdomain: 'test_subdomain'
    });
    const customerSpy = sandbox.stub(OrganizationStore, 'findBySubdomain').returns(customer);

    wrapper = shallow(<NewOrgModal {...props} />).setState({ isImplementation: true });

    wrapper.instance().onCustomerChange('test_subdomain');
    expect(customerSpy.calledOnce).to.be.true;

    expect(wrapper.find({ label: 'Customer' }).find('AjaxedAjaxManager').props().value).to.equal(customer.get('subdomain'));
    expect(wrapper.find({ label: 'Name' }).find('TextInput').props().value).to.equal(`${customer.get('name')} Implementation`);
    expect(wrapper.find({ label: 'URL' }).find('TextInput').props().value).to.equal(`${customer.get('subdomain')}-implementation`);
    expect(wrapper.find({ label: 'URL' }).find('TextInput').props().disabled).to.be.true;
  });
});
