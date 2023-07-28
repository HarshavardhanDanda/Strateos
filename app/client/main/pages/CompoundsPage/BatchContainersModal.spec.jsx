import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import AliquotStore from 'main/stores/AliquotStore';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import ModalActions from 'main/actions/ModalActions';
import ContainerActions   from 'main/actions/ContainerActions';
import { SinglePaneModal }   from 'main/components/Modal';
import { List, Table, TableLayout } from '@transcriptic/amino';
import BaseTableTypes from 'main/components/BaseTableTypes';
import containerData from './mocks/container.json';
import BatchContainersModal from './BatchContainersModal';

describe('BatchContainersModal', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  const aliquot = Immutable.fromJS([
    {
      mass_mg: 20,
      compound_link_ids: ['12345'],
      created_at: '2017-10-06T15:54:21.438-07:00',
      name: 'KAPA Pure Beads 2',
      well_idx: 0,
      container_id: 'ct1artkx88nkzd',
      type: 'aliquots',
      id: 'aq1artkx88szdh',
      volume_ul: '725.0'
    }
  ]);

  const aliquot1 = Immutable.fromJS([
    {
      mass_mg: 20,
      compound_link_ids: ['123456'],
      created_at: '2017-10-06T15:54:21.438-07:00',
      name: 'KAPA Pure Beads 2',
      well_idx: 0,
      container_id: 'ct1artkx88nkzd',
      type: 'aliquots',
      id: 'aq1artkx88sz',
      volume_ul: 0
    }
  ]);

  const aliquot2 = Immutable.fromJS([
    {
      mass_mg: null,
      compound_link_ids: ['1234567'],
      created_at: '2017-10-06T15:54:21.438-07:00',
      name: 'KAPA Pure Beads 2',
      well_idx: 0,
      container_id: 'ct1artkx88nkzd',
      type: 'aliquots',
      id: 'aq1artkx88',
      volume_ul: '100.0'
    }
  ]);

  const aliquotCompoundLinks = Immutable.fromJS([
    {
      id: '1725',
      type: 'aliquot_compound_links',
      aliquot_id: 'aq1artkx88szdh',
      compound_link_id: '12345',
      m_moles: '0.013775',
      concentration: 19,
      solubility_flag: true
    }
  ]);

  const aliquotCompoundLinks1 = Immutable.fromJS([
    {
      id: '1725',
      type: 'aliquot_compound_links',
      aliquot_id: 'aq1artkx88sz',
      compound_link_id: '123456',
      m_moles: '0.013775',
      concentration: null,
      solubility_flag: true
    }
  ]);

  const aliquotCompoundLinks2 = Immutable.fromJS([
    {
      id: '1725',
      type: 'aliquot_compound_links',
      aliquot_id: 'aq1artkx88',
      compound_link_id: '1234567',
      m_moles: '0.013775',
      concentration: null,
      solubility_flag: true
    }
  ]);

  const containerType = Immutable.fromJS({
    name: '500mL Bottle',
    well_volume_ul: '500000.0',
    well_depth_mm: '0.0',
    catalog_number: 'not_applicable',
    col_count: 1
  });

  it('BatchContainersModal should open', () => {
    ModalActions.open(BatchContainersModal.MODAL_ID);
  });

  it('should render paragraph showing batch id', () => {
    wrapper = shallow(<BatchContainersModal batchId={'12345'} />)
      .setState({ loading: false });
    const paragraph = wrapper.find('p');
    expect(paragraph.text()).contains('12345');
  });

  it('should render the list component when we have data', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    wrapper = shallow(<BatchContainersModal batchId={'12345'} />)
      .setState({ loading: false });
    const list = wrapper.find('List');
    const paginate = list.dive().find('Pagination');
    const columns = list.dive().find('Column');
    const displayRows = list.dive().find('Table').dive().find('Body')
      .find('Row');

    expect(list.length).to.equal(1);
    expect(paginate.length).to.equal(1);
    expect(displayRows.length).to.equal(2);
    expect(columns.length).to.equal(7);
    expect(columns.at(0).props().header).to.equal('type');
    expect(columns.at(1).props().header).to.equal('format');
    expect(columns.at(2).props().header).to.equal('name');
    expect(columns.at(3).props().header).to.equal('barcode');
    expect(columns.at(4).props().header).to.equal('contents');
    expect(columns.at(5).props().header).to.equal('created');
    expect(columns.at(6).props().header).to.equal('last used');
  });

  it('should have sortable columns', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = shallow(<BatchContainersModal batchId={'12345'} />)
      .setState({ loading: false });
    const list = wrapper.find('List');
    const columns = list.dive().find('Column');

    expect(columns.at(0).props().sortable).to.equal(true);
    expect(columns.at(1).props().sortable).to.equal(false);
    expect(columns.at(2).props().sortable).to.equal(false);
    expect(columns.at(3).props().sortable).to.equal(false);
    expect(columns.at(4).props().sortable).to.equal(false);
    expect(columns.at(5).props().sortable).to.equal(true);
    expect(columns.at(6).props().sortable).to.equal(true);
  });

  it('should display aliquot data on expanded row', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks);

    wrapper = shallow(<BatchContainersModal compoundLinkId={'12345'} batchId={'bat1234'} />)
      .setState({ loading: false, aliquotIds: ['aq1artkx88szdh'] });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expect(expandedTable.find(TableLayout.BodyCell).at(0).dive().find('td')
      .text()).to.equal('A1');
    expect(expandedTable.find(TableLayout.BodyCell).at(1).dive().find('td')
      .text()).to.equal('725.0 μL');
    expect(expandedTable.find(TableLayout.BodyCell).at(2).dive().find('td')
      .text()).to.equal('20 mg');
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('19 mM');
  });

  it('should display N/A for concentration if only mass is provided and volume is 0 for aliquot data on expanded row', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot1);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks1);

    wrapper = shallow(<BatchContainersModal compoundLinkId={'12345'} batchId={'bat1234'} />)
      .setState({ loading: false, aliquotIds: ['aq1artkx88sz'] });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('N/A');
  });

  it('should display "-" for empty concentration if volume is provided for aliquot data on expanded row', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(AliquotStore, 'getByContainer').returns(aliquot2);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    sandbox.stub(AliquotCompoundLinkStore, 'getByAliquotAndCompoundLinkId').returns(aliquotCompoundLinks2);

    wrapper = shallow(<BatchContainersModal compoundLinkId={'12345'} batchId={'bat1234'} />)
      .setState({ loading: false, aliquotIds: ['aq1artkx88'] });
    wrapper.find(List).dive().find(Table).dive()
      .find(TableLayout.BodyCell)
      .at(0)
      .find('Icon')
      .simulate('click', { stopPropagation: () => undefined });
    const expandedTable = wrapper.find(List).dive().find(Table).dive()
      .find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find(Table)
      .dive();
    expect(expandedTable.find(TableLayout.BodyCell).at(3).dive().find('td')
      .text()).to.equal('-');
  });

  it('should render searched data', () => {
    const containerSearchSpy = sandbox.spy(ContainerActions, 'search');
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    sandbox.stub(ContainerTypeStore, 'getById').returns(containerType);
    wrapper = shallow(<BatchContainersModal batchId={'bat1gunnaandq2p8'} />)
      .setState({ loading: false });
    wrapper.find(SinglePaneModal).prop('onOpen')();
    const list = wrapper.find('List');
    const displayRows = list.dive().find('Table').dive().find('Body')
      .find('Row');

    expect(containerSearchSpy.calledOnce).to.be.true;
    expect(displayRows.find('BodyCell').at(2).dive().find('p')
      .text()).to.equal('bottle-500');
    expect(displayRows.find('BodyCell').at(5).dive().find('p')
      .text()).to.equal('1 aliquot');
    expect(displayRows.find('BodyCell').at(10).dive().find('p')
      .text()).to.equal('a1-vial');
    expect(displayRows.find('BodyCell').at(13).dive().find('p')
      .text()).to.equal('1 aliquot');

  });

  it('should display correct date format for created_at and updated_at columns in related container table', () => {
    sandbox.stub(ContainerStore, 'getByIds').returns(containerData.data);
    wrapper = shallow(<BatchContainersModal batchId={'bat1gunnaandq2p8'} />)
      .setState({ loading: false });
    const table = wrapper.find(List).dive().find(Table).dive();

    expect(table.find(BaseTableTypes.Time).at(0).prop('data')).to.equal(containerData.data[0].created_at);
    expect(table.find(BaseTableTypes.Time).at(1).prop('data')).to.equal(containerData.data[0].updated_at);
  });

});
