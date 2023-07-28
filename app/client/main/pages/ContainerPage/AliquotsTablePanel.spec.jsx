import React from 'react';
import Immutable from 'immutable';
import sinon from 'sinon';
import { expect } from 'chai';
import { mount } from 'enzyme';
import {
  List,
  TableLayout, Table, Button
} from '@transcriptic/amino';

import CompoundSearchResults from 'main/pages/CompoundsPage/CompoundSearchResults';
import AliquotsTablePanel from 'main/pages/ContainerPage/AliquotsTablePanel';
import ContainerTypeHelper from 'main/helpers/ContainerType';
import Urls from 'main/util/urls';
import AliquotActions      from 'main/actions/AliquotActions';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import _ from 'lodash';

const { Body, Row, HeaderCell } = TableLayout;

const containerType = Immutable.Map({ col_count: 2 });
const tableRowSelector = '.amino-table__row';

const container = Immutable.Map({
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'inbound',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers'
});

const aliquots = Immutable.List([
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j52',
    name: 'A1',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: '50',
    well_idx: 0,
    resource_id: 'rs16pc8krr6ag7'
  }),
  Immutable.fromJS({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j53',
    name: 'A2',
    type: 'aliquots',
    volume_ul: '131.0',
    mass_mg: undefined,
    well_idx: 1
  })
]);

const resources = Immutable.List([
  Immutable.fromJS({
    id: 'rs16pc8krr6ag7',
    name: 'T4 DNA Ligase (NEB)'
  })
]);

const props = {
  containerType,
  container,
  aliquots,
  resources,
  containerId: 'ct1et8cdx6bnmwr',
  onMouseEnterRow: () => {},
  onMouseLeaveRow: () => {}
};

const compounds = Immutable.fromJS([
  {
    name: 'cust1',
    clogp: '1.2543',
    molecular_weight: 350.4,
    exact_molecular_weight: 350.012345,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05'
  },
  {
    name: 'cust2',
    clogp: '1.256',
    molecular_weight: 351.4,
    exact_molecular_weight: 351.012345,
    formula: 'C16H18N2O5S',
    smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
    tpsa: '108.05'
  }
]);

function getTestComponent(context = { context: { router: {} } }) {
  return mount(
    <AliquotsTablePanel {...props} />,
    context
  );
}

describe('AliquotsTable Panel', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  afterEach(() => {
    wrapper.unmount();
    sandbox.restore();
  });

  it('should contain List and correct data', () => {
    wrapper = getTestComponent();

    // No compounds linked
    expect(wrapper.find('.aliquot-table-panel__compounds').length).to.equal(0);

    const userTable = wrapper.find(List);
    expect(userTable.prop('data').size).to.equal(aliquots.size, 'data props is correct');
    expect(userTable.find('td').length).to.equal(aliquots.size * 5, 'cell count is correct');

    const cells = userTable.find('td').map(column => column.text());
    let cellCount = 0;
    const helper   = new ContainerTypeHelper(containerType.toJS());
    aliquots.toJS().forEach(row => {
      expect(cells[cellCount]).to.eql(helper.humanWell(row.well_idx));
      expect(cells[cellCount + 1]).to.eql(`${row.volume_ul} µL`);
      expect(['T4 DNA Ligase (NEB)', 'N/A']).to.include(cells[cellCount + 3]);
      expect(cells[cellCount + 4]).to.eql(row.name);
      cellCount += 5;
    });
  });

  it('On row click should change URL to well url', () => {
    const callback = sandbox.spy();
    Urls.use('org13');
    const context = { context: { router: { history: { push: callback } } } };
    wrapper = getTestComponent(context);
    const userTable = wrapper.find(List);
    userTable.prop('onRowClick')(aliquots.get(0));
    expect(callback.calledWith('/org13/inventory/samples/ct1et8cdx6bnmwr/A1')).to.be.true;
  });

  it('should contain List and correct data', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    wrapper = getTestComponent();
    wrapper.setState({ compounds, loadingCompounds: false, compoundsPerPage: compounds });
    expect(wrapper.find('.aliquot-table-panel__compounds').length).to.equal(1);
    expect(wrapper.find(CompoundSearchResults).length).to.equal(1);
    expect(wrapper.find(CompoundSearchResults).prop('data').size).to.equal(2);
  });

  it('should set CompoundSearchResults pagination props', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    wrapper = getTestComponent();
    wrapper.setState({ compounds, loadingCompounds: false, compoundsPerPage: compounds, numPages: 2 });
    expect(wrapper.find(CompoundSearchResults).props()).to.deep.include({
      page: 1, pageSize: 4, numPages: 2
    });
  });

  it('should call callback on row hover with wellIndex', () => {
    const onRowHoverHandler = sinon.spy();
    wrapper = getTestComponent();
    const testProps = _.assign(props, { onMouseEnterRow: onRowHoverHandler });
    wrapper.setProps(testProps);
    const tableRow = wrapper.find(tableRowSelector).at(1);
    tableRow.simulate('mouseenter');
    expect(onRowHoverHandler.calledWith(0)).to.be.true;
    tableRow.simulate('mouseleave');
    expect(onRowHoverHandler.calledWith()).to.be.true;
  });

  it('aliquot should have mass property and value shown in the table', () => {
    wrapper = getTestComponent();
    const userTable = wrapper.find(List).find(Table).find(HeaderCell).at(2);
    expect(userTable.text()).to.equal('MASS');

    const tableData = wrapper.find(List).find(Table).find(Body).find(Row)
      .at(0)
      .find('BodyCell')
      .at(2);
    expect(tableData.text()).to.equal(aliquots.get(0).get('mass_mg') + ' mg');
  });

  it('table should render N/A if the mass is null or undefined', () => {
    wrapper = getTestComponent();
    const userTable = wrapper.find(List).find(Table).find(HeaderCell).at(2);
    expect(userTable.text()).to.equal('MASS');

    const tableData = wrapper.find(List).find(Table).find(Body).find(Row)
      .at(1)
      .find('BodyCell')
      .at(2);
    expect(tableData.text()).to.equal('N/A');
  });

  it('should render "Download container data" button with title and icon', () => {
    wrapper = getTestComponent();
    const downloadContainerDataButton = wrapper.find(List).find(Button);

    expect(downloadContainerDataButton.props().icon).equal('fa fa-download');
    expect(downloadContainerDataButton.text()).equal('Download container data');
  });

  it('should call "downloadCSV" method when clicked on "Download container data" button', () => {
    wrapper = getTestComponent();
    const downloadContainerDataButton = wrapper.find(List).find(Button);
    const aliquotActionsSpy = sinon.spy(AliquotActions, 'downloadCSV');
    downloadContainerDataButton.simulate('click');

    expect(aliquotActionsSpy.called).to.be.true;
  });
});
