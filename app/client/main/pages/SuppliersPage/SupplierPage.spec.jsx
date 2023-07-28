import React            from 'react';
import { expect }       from 'chai';
import Immutable        from 'immutable';
import { shallow }      from 'enzyme';
import sinon            from 'sinon';
import ModalActions     from 'main/actions/ModalActions';
import { Button }       from '@transcriptic/amino';
import SupplierActions  from 'main/actions/SupplierActions';
import SupplierStore    from 'main/stores/SupplierStore';
import SupplierPage     from './SupplierPage';

describe('SupplierPage test', () => {

  let supplierPage;
  let table;
  const sandbox = sinon.createSandbox();

  const mountTableComponent = () => {
    supplierPage = shallow(<SupplierPage suppliers={suppliers} />).dive();
    return supplierPage.find('List').dive().find('Table').dive();
  };

  beforeEach(() => {
    sandbox.stub(SupplierActions, 'loadAll').returns({
      done: (cb) => {
        return { data: cb() };
      } });
    table = mountTableComponent();
  });

  afterEach(() => {
    supplierPage.unmount();
    sandbox.restore();
  });

  const suppliers = Immutable.fromJS([{
    id: 'sup1fwpuaj8g3fcw',
    name: 'test_supplier',
    created_at: new Date(),
    supplier_has_materials: false
  },
  {
    id: 'sup1fwpuaj8g3fcy',
    name: 'test_supplier',
    created_at: new Date('12/12/2020'),
    supplier_has_materials: true
  }]);

  it('should contain List component and rows based on the available suppliers', () => {
    expect(table).to.have.length(1);
    expect(table.find('Body').find('Row')).to.have.length(2);
  });

  it('should have two columns', () => {
    expect(table.find('HeaderCell').length).to.equal(2);
  });

  it('should have Name column and data', () => {
    expect(table.find('HeaderCell').first().dive().text()).to.equal('Name');
    expect(table.find('BodyCell').first().find('a').text()).to.equal('test_supplier');
  });

  it('should open Supplier Modal when supplier name is clicked and have supplier details', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    table.find('BodyCell').first().find('a').simulate('click');

    const modalId = 'SUPPLIER_MODAL_' + suppliers.getIn([0, 'id']);
    expect(modalActionsSpy.calledOnceWithExactly(modalId)).to.be.true;

    const supplierDetails = table.find('BodyCell').first().find('Supplier').dive()
      .find('ConnectedSinglePaneModal')
      .dive();
    expect(supplierDetails.find('p').text()).to.equal("We don't actually track any properties of suppliers right now. If we did, they would be here.");
  });

  it('should have Actions column and only Delete action', () => {
    expect(table.find('HeaderCell').at(1).dive().text()).to.equal('Actions');
    expect(table.find('BodyCell').at(1).find(Button)).to.have.length(1);
    expect(table.find('BodyCell').at(1).find(Button).props().label).to.equal('Delete');
  });

  it('should open DeleteSupplierModal when delete action is clicked', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    table.dive().find('BodyCell').at(1).find(Button)
      .simulate('click');

    const modalId = 'DELETE_SUPPLIER_MODAL_' + suppliers.getIn([0, 'id']);
    expect(modalActionsSpy.calledOnceWithExactly(modalId)).to.be.true;

    const confirmDeletionDetails = table.dive().find('BodyCell').last().find('DeleteSupplierModal')
      .dive()
      .find('ConnectedSinglePaneModal')
      .dive();
    expect(confirmDeletionDetails.find('h3').text())
      .to.equal('Are you sure you want to delete supplier test_supplier?');
  });

  it('should fetch suppliers from SupplierStore and populate them in table via props', () => {
    const data = [{ id: 'sup1fwpuaj8g3fcw',  name: 'Test-1', created_at: new Date() },
      { id: 'sup1fwq3pft3fkpp', name: 'Test-2', created_at: new Date() }];

    const getAllSpy = sandbox.stub(SupplierStore, 'getAll').returns(Immutable.fromJS(data));

    supplierPage = shallow(<SupplierPage />).dive();
    const table = supplierPage.find('List').dive().find('Table').dive();

    const firstRow = table.find('Body').find('Row').first().find('BodyCell');
    const lastRow = table.find('Body').find('Row').last().find('BodyCell');
    const actualSupplierNames = [firstRow.first().find('a').text(), lastRow.first().find('a').text()];

    expect(getAllSpy.called).to.be.true;
    expect(actualSupplierNames).to.include('Test-1');
    expect(actualSupplierNames).to.include('Test-2');
  });

  it('should not have CreateSupplier button if suppliers are undefined', () => {
    supplierPage = shallow(<SupplierPage />);

    expect(supplierPage.find(Button)).to.have.length(0);
    expect(supplierPage.find('CreateSupplierModal')).to.have.length(0);
  });

  it('should open CreateSupplierModal to create a new supplier, if suppliers are defined', () => {
    const modalActionsSpy = sandbox.stub(ModalActions, 'open').returns(true);
    supplierPage = shallow(<SupplierPage suppliers={suppliers} />).dive();

    supplierPage.find('List').props().defaultActions[0].action();
    expect(supplierPage.find('CreateSupplierModal')).to.have.length(1);
    expect(modalActionsSpy.calledOnceWithExactly('CREATE_SUPPLIER_MODAL')).to.be.true;
  });

  it('should have Spinner if loading of suppliers is failed from SupplierActions', () => {
    sandbox.restore(); // we are restoring sandbox, so that it won't stub supplierActions.loadAll

    supplierPage = shallow(<SupplierPage />).dive();
    expect(supplierPage.find('Spinner')).to.have.length(1);
  });

  it('should have delete button for suppliers without materials', () => {
    const deleteButton = table.find('BodyCell').at(1).find(Button);
    expect(deleteButton.props().disabled).to.not.equal(true);
    expect(deleteButton.props().label).to.equal('Delete');
  });

  it('should have disabled button for suppliers with materials', () => {
    const button = table.find('BodyCell').last().find(Button);
    expect(button.props().disabled).to.equal(true);
    expect(button.props().label).to.equal('There are materials registered for this supplier');
  });
});
