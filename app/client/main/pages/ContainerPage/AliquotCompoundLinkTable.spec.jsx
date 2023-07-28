import React from 'react';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import {
  Button,
  TableLayout,
  ZeroState,
  Molecule,
  List,
  Column,
  Table,
  EditActionButtons,
  TextInput
} from '@transcriptic/amino';
import CompoundAPI from 'main/api/CompoundAPI';
import CompoundStore from 'main/stores/CompoundStore';
import FeatureConstants from '@strateos/features';
import AcsControls from 'main/util/AcsControls';
import BatchAPI from 'main/api/BatchAPI';
import AliquotCompoundLinkTable from './AliquotCompoundLinkTable';
import { CompoundBatchesPageActions } from '../CompoundsPage/CompoundBatchesActions';

const links = [
  {
    id: '1',
    aliquot_id: 'aq1',
    compound_link_id: 'cmp1',
    concentration: '0.1',
    solubility_flag: true,
  },
  {
    id: '2',
    aliquot_id: 'aq1',
    compound_link_id: 'cmp2',
    concentration: '2.0',
    solubility_flag: false,
  },
  {
    id: '3',
    aliquot_id: 'aq1',
    compound_link_id: 'cmp3',
    concentration: null,
    solubility_flag: null,
  },
];

const compounds = [
  {
    id: 'cmp1',
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
  {
    id: 'cmp2',
    name: 'cust2',
    clogp: '1.256',
    molecular_weight: 351.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
  {
    id: 'cmp3',
    name: 'cust2',
    clogp: '1.256',
    molecular_weight: 351.4,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05',
  },
];

const batches = [
  {
    id: 'bat1',
    samples_created_at: null,
    purity: 22,
    organization_id: 'org13',
    post_purification_mass_yield_mg: 7.9,
    product_type: 'FINAL_PRODUCT',
    created_at: '2022-02-23T01:45:37.073-08:00',
    compound_link_id: 'cmp1',
    reaction_id: '456',
    contextual_custom_properties: [],
    updated_at: '2022-02-23T01:45:37.073-08:00'
  },
  {
    id: 'bat2',
    samples_created_at: null,
    purity: 32,
    organization_id: 'org13',
    post_purification_mass_yield_mg: 9.1,
    product_type: 'FINAL_PRODUCT',
    created_at: '2022-02-23T01:51:42.106-08:00',
    compound_link_id: 'cmp1',
    reaction_id: '789',
    contextual_custom_properties: [],
    updated_at: '2022-02-23T01:51:42.106-08:00'
  }
];

describe('AliquotCompoundLinkTable', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const props = {
    aliquotCompoundLinks: Immutable.fromJS(links),
    batches: Immutable.fromJS(batches),
    linkAction: true,
    canViewBatches: true,
    onLink: () => {},
    unlinkAction: true,
    onUnlink: () => {},
    editAction: true,
    onEdit: () => {},
    onCompoundClick: () => {},
    page: 1,
    numPages: 2,
    onPageChange: () => {},
  };

  let compoundStoreStub;

  beforeEach(() => {
    compoundStoreStub = sandbox.stub(CompoundStore, 'getById');
    compoundStoreStub.withArgs('cmp1').returns(Immutable.fromJS(compounds[0]));
    compoundStoreStub.withArgs('cmp2').returns(Immutable.fromJS(compounds[1]));
    compoundStoreStub.withArgs('cmp3').returns(Immutable.fromJS(compounds[2]));
  });

  afterEach(() => {
    sandbox.restore();
    if (wrapper) wrapper.unmount();
  });

  it('AliquotCompoundLinks should not have a Card', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.find(List).props().disableCard).to.equal(true);
  });

  it('should display 3 columns in the list', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} editAction={false} />);
    const table = wrapper.find(List).dive().find('Table');
    expect(wrapper.find(List).length).to.equal(1);
    expect(table.find(Column).length).to.equal(3);

    expect(table.find(Column).at(0).props().header).to.equal('Structure');
    expect(table.find(Column).at(1).props().header).to.equal('Property');
    expect(table.find(Column).at(2).props().header).to.equal('Value');
  });

  it('should render nested table inside list of aliquot compound links', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const table = wrapper.find(List).dive().find('Table').dive();
    expect(table.find(TableLayout.BodyCell).at(3).find(Table).length).to.equal(1);
  });

  it('should display zero state if no linked compounds', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} aliquotCompoundLinks={Immutable.List()} />);
    expect(wrapper.find(ZeroState));
  });

  it('should display aliquot compound link data in list', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const table = wrapper.find(List).dive().find('Table').dive();

    // table cells (Icon, Molecule, and two pairs of property - value)
    // Compound Link # 1
    const nestedTable1 = table.find(TableLayout.BodyCell).at(3).find(Table).dive();
    expect(table.find(TableLayout.BodyCell).at(2).find(Molecule)).to.have.lengthOf(1);
    expect(nestedTable1.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .text()).to.equal('Concentration');
    expect(nestedTable1.find(TableLayout.BodyCell).at(1).dive().find('td')
      .at(0)
      .text()).to.equal('0.1 mM');
    expect(nestedTable1.find(TableLayout.BodyCell).at(3).dive().find('td')
      .at(0)
      .text()).to.equal('Solubility flag');
    expect(nestedTable1.find(TableLayout.BodyCell).at(4).dive().find('td')
      .at(0)
      .text()).to.equal('true');
    // Compound Link # 2
    const nestedTable2 = table.find(TableLayout.BodyCell).at(7).find(Table).dive();
    expect(table.find(TableLayout.BodyCell).at(6).find(Molecule)).to.have.lengthOf(1);
    expect(nestedTable2.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .text()).to.equal('Concentration');
    expect(nestedTable2.find(TableLayout.BodyCell).at(1).dive().find('td')
      .at(0)
      .text()).to.equal('2.0 mM');
    expect(nestedTable2.find(TableLayout.BodyCell).at(3).dive().find('td')
      .at(0)
      .text()).to.equal('Solubility flag');
    expect(nestedTable2.find(TableLayout.BodyCell).at(4).dive().find('td')
      .at(0)
      .text()).to.equal('false');
    // Compound Link # 3
    const nestedTable3 = table.find(TableLayout.BodyCell).at(11).find(Table).dive();
    expect(table.find(TableLayout.BodyCell).at(10).find(Molecule)).to.have.lengthOf(1);
    expect(nestedTable3.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .text()).to.equal('Concentration');
    expect(nestedTable3.find(TableLayout.BodyCell).at(1).dive().find('td')
      .at(0)
      .text()).to.equal('-');
    expect(nestedTable3.find(TableLayout.BodyCell).at(3).dive().find('td')
      .at(0)
      .text()).to.equal('Solubility flag');
    expect(nestedTable3.find(TableLayout.BodyCell).at(4).dive().find('td')
      .at(0)
      .text()).to.equal('-');
  });

  it('should not display link button if linkAction is false', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} linkAction={false} />);
    expect(wrapper.find(Button).filterWhere((button) => button.text() === 'Link new compound').length).to.equal(0);
  });

  it('should be able to link compound', () => {
    const onLinkSpy = sandbox.spy();
    wrapper = mount(<AliquotCompoundLinkTable {...props} onLink={onLinkSpy} />);
    const button = wrapper.find(Button).filterWhere((button) => button.text() === 'Link new compound');
    button.simulate('click');
    expect(button.text()).to.equal('Link new compound');
    expect(onLinkSpy.calledOnce).to.be.true;
  });

  it('should not show unlink button if unlinkAction is false', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} unlinkAction={false} />);
    expect(wrapper.find(Button).filterWhere((button) => button.text() === 'Unlink compound').length).to.equal(0);
  });

  it('should not show checkboxes if user is scientist', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} unlinkAction={false} />);
    expect(wrapper.find(List).dive().find('Table').dive()
      .find('MasterCheckbox')
      .exists()).to.be.false;
  });

  it('should show checkboxes if user is not scientist', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} unlinkAction />);
    expect(wrapper.find(List).dive().find('Table').dive()
      .find('MasterCheckbox')
      .exists()).to.be.true;
  });

  it('should be able enable unlink compound on row selection', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.find(Button).at(1).props().disabled).to.equal(true);
    wrapper.setState({ selected: { 1: true } });
    expect(wrapper.find(Button).at(1).props().disabled).to.equal(false);
  });

  it('should not display edit buttons if editAction is false', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} editAction={false} />);
    expect(wrapper.find('EditableProperty').filterWhere((input) => input.prop('editable')).length).to.equal(0);
  });

  it('should be able to edit aliquot compound link', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const table = wrapper.find(List).dive().find('Table').dive();
    const nestedTable = table.find(TableLayout.BodyCell).at(3).find(Table).dive();
    expect(nestedTable.find(EditActionButtons).length).to.equal(2);
  });

  it('should display associated compound in list', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const compound = wrapper.find(TableLayout.Row).at(1).find(TableLayout.BodyCell);
    expect(compound.find('Popover'));
    expect(compound.find('Molecule'));
  });

  it('should fetch associated compound if not found', () => {
    compoundStoreStub.withArgs('cmp1').returns(undefined);
    const spy = sandbox.stub(CompoundAPI, 'get').returns({ done: (cb) => {
      cb({
        data: compounds[0]
      });
      return { fail: () => {} };
    }
    });
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    wrapper.find(Column).at(0).props().renderCellContent(Immutable.fromJS(links[0]));
    expect(spy.calledOnce).to.be.true;
  });

  it('should disable link/unlink while editing', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const table = wrapper.find(List).dive().find('Table').dive();
    const nestedTable = table.find(TableLayout.BodyCell).at(3).find(Table).dive();
    nestedTable.find(EditActionButtons).at(0).dive().find(Button)
      .simulate('click');

    expect(wrapper.find(Button).at(0).props().disabled).to.equal(true);
    expect(wrapper.find(Button).at(1).props().disabled).to.equal(true);

  });

  it('should enable link/unlink only when none of the field is in edit state', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);

    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);

    const table = wrapper.find(List).dive().find('Table').dive();
    const nestedTable = table.find(TableLayout.BodyCell).at(3).find(Table).dive();
    const concentrationEdit =  nestedTable.find(EditActionButtons).at(0).dive().find(Button);
    concentrationEdit.simulate('click');

    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const batchTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table).dive();
    const batchPurity = batchTable.find(EditActionButtons).at(0).dive().find(Button);
    batchPurity.simulate('click');
    const batchMass = batchTable.find(EditActionButtons).at(1).dive().find(Button);
    batchMass.simulate('click');
    expect(wrapper.find(Button).at(0).props().disabled).to.equal(true);
    expect(wrapper.find(Button).at(1).props().disabled).to.equal(true);
    expect(wrapper.state('editingRecord')).to.deep.equals(['1-concentration', '1-bat1-purity', '1-bat1-mass']);

    /* click on cancel icon of concentration editable field */
    nestedTable.find(EditActionButtons).at(0).dive().find(Button)
      .at(0)
      .simulate('click');
    /* click on cancel icon of batch purity editable field */
    batchTable.find(EditActionButtons).at(0).dive().find(Button)
      .at(0)
      .simulate('click');
    expect(wrapper.find(Button).at(0).props().disabled).to.equal(true);
    /* click on cancel icon of batch mass editable field */
    batchTable.find(EditActionButtons).at(1).dive().find(Button)
      .at(0)
      .simulate('click');
    expect(wrapper.find(Button).at(0).props().disabled).to.equal(false);
    expect(wrapper.state('editingRecord').length).to.equal(0);
  });

  it('should update parent when value changes', () => {
    const onEditSpy = sandbox.spy(() => ({
      done: (cb) => ({
        data: cb(), fail: () => { }
      })
    }));
    wrapper = shallow(<AliquotCompoundLinkTable {...props} onEdit={onEditSpy} />);
    const table = wrapper.find(List).dive().find('Table').dive();
    const nestedTable = table.find(TableLayout.BodyCell).at(3).find(Table);

    wrapper.find(Column).at(1).props().renderCellContent(Immutable.fromJS(links[0]));

    nestedTable.prop('onEditRow')({ value: '0.9' }, Immutable.fromJS({ key: 'concentration' }));
    expect(onEditSpy.args[0][0].toJS()).to.deep.include({
      aliquot_id: 'aq1',
      compound_link_id: 'cmp1',
      concentration: '0.9',
      solubility_flag: true,
    });
    expect(onEditSpy.calledOnce).to.be.true;
  });

  it('should display concentration error when value is negative number', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.state('concentrationError')['1-concentration']).to.equal(undefined);

    const table = wrapper.find(List).dive().find('Table').dive();
    const nestedTable = table.find(TableLayout.BodyCell).at(3).find(Table).dive();
    nestedTable.find(EditActionButtons).at(0).dive().find(Button)
      .simulate('click');

    nestedTable.find(TextInput).prop('onChange')({ target: { value: -2 } });
    expect(wrapper.state('concentrationError')['1-concentration']).to.equal('Must be greater than or equal to 0');
  });

  it('should display fa-empty-set icon for structureless compound', () => {
    const link = [{
      id: '4',
      aliquot_id: 'aq1',
      compound_link_id: 'cmp4',
      concentration: null,
      solubility_flag: null,
    }];
    const structurelessCompound = [{
      id: 'cmp4',
      name: 'structureless compound',
      clogp: null,
      molecular_weight: null,
      formula: null,
      smiles: null,
      tpsa: null,
    }];
    const updatedProps = {
      ...props,
      aliquotCompoundLinks: Immutable.fromJS(link),
    };
    compoundStoreStub.withArgs('cmp4').returns(Immutable.fromJS(structurelessCompound));
    wrapper = mount(<AliquotCompoundLinkTable {...updatedProps} />);
    const icon = wrapper.find('Molecule').find('i').at(1).prop('className');
    expect(icon).to.include('fal fa-empty-set');
  });

  it('table should have chevron icon if batches are present', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    const icon = wrapper.find(List).dive().find('Table').dive()
      .find('Icon');

    expect(icon.prop('icon')).to.eql('fa fa-chevron-right icon__animate-angle-default');
  });

  it('table should not show chevron icon when canViewBatches is false', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} canViewBatches={false} />);
    const icon = wrapper.find(List).dive().find('Table').dive()
      .find('i.fa-chevron-right');
    expect(icon.exists()).to.be.false;
  });

  it('should display batches for aliquot compound links', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expect(expandedTable.find(TableLayout.HeaderCell).at(0).dive().find('th')
      .text()).to.equal('Batch ID');
    expect(expandedTable.find(TableLayout.HeaderCell).at(1).dive().find('th')
      .text()).to.equal('Batch Property');
    expect(expandedTable.find(TableLayout.HeaderCell).at(2).dive().find('th')
      .text()).to.equal('Batch Value');
    expect(expandedTable.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .find(Button)
      .dive()
      .text()).to.equal('bat1');
    const nestedTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table).dive();
    expect(nestedTable.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .text()).to.equal('Purity');
    expect(nestedTable.find(TableLayout.BodyCell).at(1).dive().find('td')
      .at(0)
      .text()).to.equal('22 %');
    expect(nestedTable.find(TableLayout.BodyCell).at(2).dive().find('td')
      .at(0)
      .text()).to.equal('Mass Yield');
    expect(nestedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .at(0)
      .text()).to.equal('7.9 mg');
  });

  it('should update the purity of the batch', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    const spy = sandbox.stub(BatchAPI, 'update').returns({ done: (cb) => {
      cb({});
      return { fail: () => {} };
    }
    });
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const nestedTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table);

    nestedTable.prop('onEditRow')({ value: '3' }, Immutable.fromJS({ key: 'purity' }));

    expect(spy.args[0][0]).to.deep.include('bat1');
    expect(spy.args[0][1]).to.deep.include({ purity: '3' });
    expect(spy.calledOnce).to.be.true;
  });

  it('should update the post_purification_mass_yield_mg  of the batch', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);
    const spy = sandbox.stub(BatchAPI, 'update').returns({ done: (cb) => {
      cb({});
      return { fail: () => {} };
    }
    });
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const nestedTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table);
    nestedTable.prop('onEditRow')({ value: '4' }, Immutable.fromJS({ key: 'mass_yield' }));

    expect(spy.args[0][0]).to.deep.include('bat1');
    expect(spy.args[0][1]).to.deep.include({ post_purification_mass_yield_mg: '4' });
    expect(spy.calledOnce).to.be.true;
  });

  it('should not show edit option if MANAGE_BATCHES_IN_LAB permission is not provided', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(false);

    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const nestedTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table).dive();

    expect(nestedTable.find(EditActionButtons).length).to.equal(0);
  });

  it('should display batch error when purity or mass is negative number', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);

    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.state('batchError')).to.deep.equal({});
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const batchTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table).dive();
    const batchPurity = batchTable.find(EditActionButtons).at(0).dive().find(Button);
    batchPurity.simulate('click');
    batchTable.find(TextInput).prop('onChange')({ target: { value: -2 } });

    const batchMass = batchTable.find(EditActionButtons).at(1).dive().find(Button);
    batchMass.simulate('click');
    batchTable.find(TextInput).at(1).prop('onChange')({ target: { value: -1 } });

    expect(wrapper.state('batchError')).to.deep.equal({
      '1-bat1-purity': 'Must be greater than or equal to 0',
      '1-bat1-mass': 'Must be greater than or equal to 0'
    });

    batchTable.find(TextInput).at(0).prop('onChange')({ target: { value: 4 } });
    expect(wrapper.state('batchError')).to.deep.equal({
      '1-bat1-mass': 'Must be greater than or equal to 0'
    });

    /* click on cancel icon of editable field */
    batchTable.find(EditActionButtons).at(1).dive().find(Button)
      .at(0)
      .simulate('click');
    expect(wrapper.state('batchError')).to.deep.equal({});
  });

  it('should remove batch error by clicking on cancel icon', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.MANAGE_BATCHES_IN_LAB).returns(true);

    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.state('batchError')).to.deep.equal({});
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    const batchTable = expandedTable.find(TableLayout.BodyCell).at(1).find(Table).dive();
    const batchPurity = batchTable.find(EditActionButtons).at(0).dive().find(Button);
    batchPurity.simulate('click');
    batchTable.find(TextInput).prop('onChange')({ target: { value: -2 } });

    const batchMass = batchTable.find(EditActionButtons).at(1).dive().find(Button);
    batchMass.simulate('click');
    batchTable.find(TextInput).at(1).prop('onChange')({ target: { value: -1 } });

    expect(wrapper.state('batchError')).to.deep.equal({
      '1-bat1-purity': 'Must be greater than or equal to 0',
      '1-bat1-mass': 'Must be greater than or equal to 0'
    });

    /* click on cancel icon of editable field */
    batchTable.find(EditActionButtons).at(0).dive().find(Button)
      .at(0)
      .simulate('click');

    expect(wrapper.state('batchError')).to.deep.equal({
      '1-bat1-mass': 'Must be greater than or equal to 0'
    });

    /* click on cancel icon of editable field */
    batchTable.find(EditActionButtons).at(1).dive().find(Button)
      .at(0)
      .simulate('click');
    expect(wrapper.state('batchError')).to.deep.equal({});
  });

  it('should trigger onCompoundClick callback with correct arguments when click on batch id link', () => {
    const mockUpdateState = sandbox.stub(CompoundBatchesPageActions, 'updateState');
    const mockOnCompoundClick = sandbox.stub();
    wrapper = shallow(<AliquotCompoundLinkTable {...props} onCompoundClick={mockOnCompoundClick} />);
    wrapper.find(List).dive().find('Table').dive()
      .find('Icon')
      .simulate('click');
    const expandedTable = wrapper.find(List).dive().find('Table').dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();

    expandedTable.find(TableLayout.BodyCell).at(0).dive().find('td')
      .at(0)
      .find(Button)
      .dive()
      .simulate('click');

    expect(mockUpdateState.calledOnce).to.be.true;
    expect(mockUpdateState.args[0][0]).to.deep.equal({ searchInput: 'bat1' });
    expect(mockOnCompoundClick.args[0][0]).to.equal('cmp1');
    expect(mockOnCompoundClick.args[0][1]).to.equal('Batches');
  });

  it('AliquotCompoundLink Table should have a toggleRowColor', () => {
    wrapper = shallow(<AliquotCompoundLinkTable {...props} />);
    expect(wrapper.find(List).props().toggleRowColor).to.equal(true);
    const table = wrapper.find(List).dive().find('Table').dive();
    expect(table.find(TableLayout.BodyCell).at(3).find(Table).props().nestedTable).to.equal(true);
  });
});
