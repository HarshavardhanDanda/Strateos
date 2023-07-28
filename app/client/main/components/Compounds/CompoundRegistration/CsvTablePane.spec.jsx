import React        from 'react';
import { expect }   from 'chai';
import { mount }    from 'enzyme';
import sinon        from 'sinon';
import Immutable    from 'immutable';
import { List, Button } from '@transcriptic/amino';
import CompoundAPI  from 'main/api/CompoundAPI';
import CsvTablePane from './CsvTablePane';

describe('CsvTable pane test', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const attributeData = {
    id: 0,
    clogp: '1.88',
    tpsa: '2.99',
    molecular_weight: '12',
    smiles: 'CCC',
    name: 'sal',
    reference_id: '1234',
    formula: 'CH3',
    labels: [{ name: 'label1', organization_id: 'org13' }],
    inchi_key: 'asd',
    organization_id: 'asd'
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('it should render when there are no compounds', () => {
    wrapper = mount(<CsvTablePane records={[]} compoundValidations={{ get: () => 'Valid', set: () => {} }} />);
    expect(wrapper.find('Table')).to.have.length(1);
  });

  it('should render when the rows are given with 10 headers',  async () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Valid', set: () => {} }}
      />
    );
    expect(wrapper.find('Table').find('th').length).to.equal(10);
  });

  it('should render correct',  async () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Valid', set: () => {} }}
      />
    );
    const firstRowColumns = wrapper.find('Table').find('td').map(column => column.text());
    expect(firstRowColumns[2]).to.eql(attributeData.name);
    expect(firstRowColumns[3]).to.eql(attributeData.reference_id);
    expect(firstRowColumns[4]).to.eql(attributeData.formula);
    expect(firstRowColumns[5]).to.eql(attributeData.molecular_weight);
    expect(firstRowColumns[6].trim()).to.eql(attributeData.tpsa);
    expect(firstRowColumns[7]).to.eql(attributeData.clogp);
  });

  it('should render drawer when row is clicked', () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    const setDrawer = sandbox.stub();
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Valid', set: () => {} }}
        setDrawer={setDrawer}
        duplicates={{ get: () => [] }}
      />
    );
    const firstRow = wrapper.find('Table').find('td').at(3).find('p');
    expect(setDrawer.calledOnce).to.be.false;
    firstRow.simulate('click');
    expect(setDrawer.calledOnce).to.be.true;
  });

  it('add labels should be enabled when valid compound is selected', () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    const setDrawer = sandbox.stub();
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Valid', set: () => {} }}
        setDrawer={setDrawer}
        duplicates={{ get: () => [] }}
      />
    );
    wrapper.setState({ selectedRows: { 0: true } });
    expect(wrapper.find(List).find(Button).at(1).props().disabled).to.be.false;
  });

  it('add labels should be disabled when duplicate compound is selected', () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    const setDrawer = sandbox.stub();
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Duplicates', set: () => {} }}
        setDrawer={setDrawer}
        duplicates={{ get: () => [] }}
      />
    );
    wrapper.setState({ selectedRows: { 0: true } });
    expect(wrapper.find(List).find(Button).at(1).props().disabled).to.be.true;
  });

  it('add labels should be disabled when invalid compound is selected', () => {
    sandbox.stub(CsvTablePane.prototype, 'getRecords')
      .returns(Immutable.List([Immutable.Map(attributeData)]));
    const setDrawer = sandbox.stub();
    wrapper = mount(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Invalid', set: () => {} }}
        setDrawer={setDrawer}
        duplicates={{ get: () => [] }}
      />
    );
    wrapper.setState({ selectedRows: { 0: true } });
    expect(wrapper.find(List).find(Button).at(1).props().disabled).to.be.true;
  });

  it('should call the CompoundAPI createManyPublic method if its public compound', async () => {
    const onCompoundCreation = sinon.spy();
    wrapper = enzyme.shallow(
      <CsvTablePane
        records={[
          attributeData
        ]}
        compoundValidations={{ get: () => 'Valid', set: () => {} }}
        isPublicCompound
        onCompoundCreation={onCompoundCreation}
      />
    );
    const create = sandbox.stub(CompoundAPI, 'createManyPublic').returns({
      done: (cb) => {
        cb();
        return { fail: () => ({ always: () => {} }) };
      }
    });
    wrapper.instance().registerCompounds();
    expect(create.called).to.equal(true);
  });
});
