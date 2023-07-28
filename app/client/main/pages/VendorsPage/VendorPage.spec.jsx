import React            from 'react';
import { expect }       from 'chai';
import Immutable        from 'immutable';
import { shallow }      from 'enzyme';
import sinon            from 'sinon';
import ModalActions     from 'main/actions/ModalActions';
import VendorActions    from 'main/actions/VendorActions';
import VendorStore      from 'main/stores/VendorStore';
import { Button }       from '@transcriptic/amino';
import VendorPage       from './VendorPage';

describe('VendorPage test', () => {

  let vendorPage;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    sandbox.stub(VendorActions, 'loadAll').returns({
      done: (cb) => {
        return { data: cb() };
      } });
  });

  afterEach(() => {
    vendorPage.unmount();
    sandbox.restore();
  });

  const vendors = Immutable.fromJS([
    {
      id: 'vend16ry3h7qkwv9',
      name: 'test_name',
      created_at: new Date(),
      vendor_has_materials: false
    },
    {
      id: 'vend16ry3h7qkwv9',
      name: 'test_name_2',
      created_at: new Date('12/12/2020'),
      vendor_has_materials: true
    }
  ]);

  it('should contain Table component and rows based on the available vendors', () => {
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();
    expect(table).to.have.length(1);
    expect(table.find('Body').find('Row')).to.have.length(2);
  });

  it('should have two columns', () => {
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();
    expect(table.find('HeaderCell').length).to.equal(2);
  });

  it('should have Name column and data', () => {
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();
    expect(table.find('HeaderCell').first().dive().text()).to.equal('Name');
    expect(table.find('BodyCell').first().find('a').text()).to.equal('test_name');
  });

  it('should open Vendor Modal when vendor name is clicked and have vendor details', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();
    table.find('BodyCell').first().find('a').simulate('click');

    const modalId = 'VENDOR_MODAL_' + vendors.getIn([0, 'id']);
    expect(modalActionsSpy.calledOnceWithExactly(modalId)).to.be.true;

    const vendorDetails = table.find('BodyCell').first().find('Vendor').dive()
      .find('ConnectedSinglePaneModal')
      .dive();
    expect(vendorDetails.find('p').text()).to.equal("We don't actually track any properties of vendors right now. If we did, they would be here.");
  });

  it('should have Actions column and only Delete action', () => {
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();
    expect(table.find('HeaderCell').at(1).dive().text()).to.equal('Actions');
    expect(table.find('BodyCell').at(1).find(Button)).to.have.length(1);
    expect(table.find('BodyCell').at(1).find(Button).props().label).to.equal('Delete');
  });

  it('should open DeleteVendorModal when delete action is clicked', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();

    table.find('BodyCell').at(1).find(Button)
      .simulate('click');

    const modalId = 'DELETE_VENDOR_MODAL_' + vendors.getIn([0, 'id']);
    expect(modalActionsSpy.calledOnceWithExactly(modalId)).to.be.true;

    const confirmDeletionDetails = table.dive().find('BodyCell').at(1).find('DeleteVendorModal')
      .dive()
      .find('ConnectedSinglePaneModal')
      .dive();
    expect(confirmDeletionDetails.find('h3').text())
      .to.equal('Are you sure you want to delete vendor test_name?');
  });

  it('should fetch vendors from VendorStore and populate them in table via props', () => {
    const data = [{ id: 'vend16ry3h7qkwv9',  name: 'Test-1', created_at: new Date() },
      { id: 'vend16ry347qfom3', name: 'Test-2', created_at: new Date() }];

    const getAllSpy = sandbox.stub(VendorStore, 'getAll').returns(Immutable.fromJS(data));

    vendorPage = shallow(<VendorPage />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();

    const firstRow = table.find('Body').find('Row').first().find('BodyCell');
    const lastRow = table.find('Body').find('Row').last().find('BodyCell');
    const actualVendorNames = [firstRow.first().find('a').text(), lastRow.first().find('a').text()];

    expect(getAllSpy.called).to.be.true;
    expect(actualVendorNames).to.include('Test-1');
    expect(actualVendorNames).to.include('Test-2');
  });

  it('should not have CreateVendor button if vendors are undefined', () => {
    vendorPage = shallow(<VendorPage />);

    expect(vendorPage.find('Button')).to.have.length(0);
    expect(vendorPage.find('CreateVendorModal')).to.have.length(0);
  });

  it('should open CreateVendorModal to create a new vendor, if vendors are defined', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();

    vendorPage.find('List').props().defaultActions[0].action();
    expect(vendorPage.find('CreateVendorModal')).to.have.length(1);
    expect(modalActionsSpy.calledOnceWithExactly('CREATE_VENDOR_MODAL')).to.be.true;
  });

  it('should have Spinner if loading of vendors is failed from VendorActions', () => {
    sandbox.restore(); // we are restoring sandbox, so that it won't stub VendorActions.loadAll

    vendorPage = shallow(<VendorPage />).setState({ isLoaded: false }).dive();
    expect(vendorPage.find('Spinner')).to.have.length(1);
  });

  it('should have delete button disabled for vendors with materials', () => {
    vendorPage = shallow(<VendorPage vendors={vendors} />).setState({ isLoaded: true }).dive();
    const table = vendorPage.find('List').dive().find('Table').dive();

    expect(table.find('BodyCell').at(1).find(Button).props().disabled).to.not.equal(true);
    expect(table.find('BodyCell').at(1).find(Button).props().label).to.equal('Delete');

    expect(table.find('BodyCell').last().find(Button).props().disabled).to.equal(true);
    expect(table.find('BodyCell').last().find(Button).props().label).to.equal('There are materials registered for this vendor');
  });
});
