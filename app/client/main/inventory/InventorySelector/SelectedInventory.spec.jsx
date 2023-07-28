import React from 'react';
import Immutable  from 'immutable';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { ZeroState, SearchField, Button, Divider, DataTable, TextBody, Icon } from '@transcriptic/amino';

import ContainerStore from 'main/stores/ContainerStore';
import SelectedInventory from './SelectedInventory';

describe('SelectedInventory', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const location = {
    id: 'loc1234',
    name: 'Row: 1 Col: 4',
    ancestors: [{
      id: 'loc2345',
      name: 'Fridge'
    }, {
      id: 'loc34567',
      name: 'Rack'
    }]
  };
  const containers = {
    ct12345: {
      id: 'ct12345',
      barcode: 'bar12345',
      label: 'container name',
      container_type: { is_tube: true },
      container_type_id: 'micro-2.0',
      organization_name: 'Strateos',
      created_at: '2023-03-09T13:30:00.576-08:00',
      status: 'inbound',
      location: null,
      test_mode: false
    },
    ct45678: {
      id: 'ct45678',
      location,
      container_type: { is_tube: false },
      container_type_id: 'plate-2.0',
    },
    ct78901: {
      id: 'ct78901',
      test_mode: true,
      container_type_id: 'test-2.0',
    }
  };

  const onClick = sandbox.stub();
  const onSearch = sandbox.stub();
  const onSelectionDeleted = sandbox.stub();
  const containerSelectionMap = Immutable.fromJS({});
  const wellSelectionMap = Immutable.fromJS({});
  const props = {
    onClick,
    onSearch,
    onSelectionDeleted,
    containerSelectionMap,
    wellSelectionMap
  };

  afterEach(() => {
    if (sandbox) sandbox.restore();
  });

  it('should contain search field', () => {
    wrapper = shallow(<SelectedInventory {...props} />);

    const searchField = wrapper.find(SearchField);
    expect(searchField.props().type).to.equal('text');
    expect(searchField.props().onKeyDown).to.exist;
    expect(searchField.props().placeholder).to.equal('Search by ID, Name or Barcode');
    expect(searchField.props().fullWidth).to.be.false;
    expect(searchField.props().showBarcodeIcon).to.be.true;
  });

  it('should trigger search only when Enter is pressed', () => {
    onSearch.resetHistory();
    wrapper = shallow(<SelectedInventory {...props} />);
    const searchField = wrapper.find(SearchField);

    searchField.simulate('keydown', { key: '75', target: { value: 'a' } });
    expect(onSearch.calledOnce).to.be.false;

    searchField.simulate('keydown', { key: 'Enter', target: { value: 'ct123' } });
    expect(onSearch.calledOnce).to.be.true;
    expect(onSearch.args[0][0]).to.equal('ct123');
  });

  it('should contain divider', () => {
    wrapper = shallow(<SelectedInventory {...props} />);

    const divider = wrapper.find(Divider);
    expect(divider.props().isDark).to.be.true;
  });

  it('should contain a button to trigger search', () => {
    onClick.resetHistory();
    wrapper = shallow(<SelectedInventory {...props} />);

    const button = wrapper.find(Button);
    expect(button.props().type).to.equal('success');
    expect(button.props().size).to.equal('medium');

    button.props().onClick();
    expect(onClick.calledOnce).to.be.true;
  });

  it('should contain Zero State component if no containers or aliquots are selected', () => {
    wrapper = shallow(<SelectedInventory {...props} />);

    const zeroState = wrapper.find(ZeroState);
    expect(zeroState.props().title).to.equal("You haven't selected any containers");
    expect(zeroState.props().subTitle).to.equal('please start by scanning container or by selecting from inventory');
    expect(zeroState.props().zeroStateSvg).to.equal('/images/materials-illustration.svg');
  });

  it('should show title, when user has selected containers', () => {
    const containerSelectionMap = Immutable.fromJS({ test: 1 });
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const selectedContent = wrapper.find('span').findWhere(span => span.props().className === 'selected-inventory__text');
    expect(selectedContent.text()).to.equal('Your selected containers will appear in the table below');
  });

  it('should show title, when user has selected aliquots', () => {
    const wellSelectionMap = Immutable.fromJS({ test: 1 });
    wrapper = shallow(<SelectedInventory {...props} wellSelectionMap={wellSelectionMap} />);
    const selectedContent = wrapper.find('span').findWhere(span => span.props().className === 'selected-inventory__text');
    expect(selectedContent.text()).to.equal('Your selected containers will appear in the table below');
  });

  it('should show data table with correct props', () => {
    const containerSelectionMap = Immutable.fromJS({ ct12345: [] });
    const headers = ['', 'ID', 'Barcode', 'Name', 'Container type', 'Organization', 'Created at', 'Status', 'Location'];

    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const dataTable = wrapper.find(DataTable);

    expect(dataTable.props().headers).to.deep.equal(headers);
    expect(dataTable.props().disableFormatHeader).to.exist;
    expect(dataTable.props().rowHeight).to.equal(50);
    expect(dataTable.props().data).to.exist;
  });

  it('should show data table with selected containers', () => {
    const containerSelectionMap = Immutable.fromJS({ ct12345: [] });
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const dataTable = wrapper.find(DataTable);
    const data = dataTable.props().data;

    expect(data[0].ID).to.equal('ct12345');
    expect(data[0].Barcode).to.equal('bar12345');
    expect(data[0].Organization).to.equal('Strateos');
    expect(data[0]['Created at']).to.equal('Mar 9, 2023');
    expect(data[0].Status).to.equal('Inbound');
    expect(data[0].Location).to.equal('-');

    const deleteButton = mount(data[0]['']);
    const button = deleteButton.find('Button');
    expect(button.props().type).to.equal('info');
    expect(button.props().link).to.exist;
    expect(button.props().icon).to.equal('fa fa-trash-alt');
    deleteButton.unmount();

    const containerType = mount(data[0]['Container type']);
    const textBody = containerType.find(TextBody);
    const icon = containerType.find(Icon);
    expect(icon.props().icon).to.equal('aminol-tube');
    expect(icon.props().className).to.equal('baby-icon');
    expect(textBody.text()).to.equal('micro-2.0');
    containerType.unmount();
  });

  it('should show data table with selected aliquots', () => {
    const wellSelectionMap = Immutable.fromJS({ ct12345: [] });
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={wellSelectionMap} />);
    const dataTable = wrapper.find(DataTable);
    const data = dataTable.props().data;

    expect(data[0].ID).to.equal('ct12345');
    expect(data[0].Barcode).to.equal('bar12345');
    expect(data[0].Organization).to.equal('Strateos');
    expect(data[0]['Created at']).to.equal('Mar 9, 2023');
    expect(data[0].Status).to.equal('Inbound');
    expect(data[0].Location).to.equal('-');

    const deleteButton = mount(data[0]['']);
    const button = deleteButton.find('Button');
    expect(button.props().type).to.equal('info');
    expect(button.props().link).to.exist;
    expect(button.props().icon).to.equal('fa fa-trash-alt');
    deleteButton.unmount();

    const containerType = mount(data[0]['Container type']);
    const textBody = containerType.find(TextBody);
    const icon = containerType.find(Icon);
    expect(icon.props().icon).to.equal('aminol-tube');
    expect(icon.props().className).to.equal('baby-icon');
    expect(textBody.text()).to.equal('micro-2.0');
    containerType.unmount();
  });

  it('should display test icon for test containers', () => {
    const containerSelectionMap = Immutable.fromJS({ ct45678: [] });
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const dataTable = wrapper.find(DataTable);
    const data = dataTable.props().data;

    const containerType = mount(data[0]['Container type']);
    const textBody = containerType.find(TextBody);
    const icon = containerType.find(Icon);
    expect(icon.props().icon).to.equal('aminol-plate');
    expect(icon.props().className).to.equal('baby-icon');
    expect(textBody.text()).to.equal('plate-2.0');
    containerType.unmount();
  });

  it('should display test icon for test containers', () => {
    const containerSelectionMap = Immutable.fromJS({ ct78901: [] });
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const dataTable = wrapper.find(DataTable);
    const data = dataTable.props().data;

    const containerType = mount(data[0]['Container type']);
    const textBody = containerType.find(TextBody);
    const icon = containerType.find(Icon);
    expect(icon.props().icon).to.equal('fas fa-flask test-icon');
    expect(icon.props().className).to.equal('tx-type--warning');
    expect(icon.props().color).to.equal('inherit');
    expect(textBody.text()).to.equal('test-2.0');
    containerType.unmount();
  });

  it('should handle row deletion', () => {
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    const containerSelectionMap = Immutable.fromJS({ ct45678: [] });
    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    let dataTable = wrapper.find(DataTable);
    let data = dataTable.props().data;
    let deleteButton = shallow(data[0]['']);
    deleteButton.simulate('click');
    expect(onSelectionDeleted.calledOnce).to.be.true;
    expect(onSelectionDeleted.args[0][0]).to.equal('ct45678');

    onSelectionDeleted.resetHistory();
    const wellSelectionMap = Immutable.fromJS({ ct78901: [] });
    wrapper = shallow(<SelectedInventory {...props} wellSelectionMap={wellSelectionMap} />);
    dataTable = wrapper.find(DataTable);
    data = dataTable.props().data;
    deleteButton = shallow(data[0]['']);
    deleteButton.simulate('click');
    expect(onSelectionDeleted.calledOnce).to.be.true;
    expect(onSelectionDeleted.args[0][0]).to.equal('ct78901');
    deleteButton.unmount();
  });

  it('should set location correctly in data table', () => {
    sandbox.stub(ContainerStore, 'getAll').returns(Immutable.fromJS(containers));
    const containerSelectionMap = Immutable.fromJS({ ct45678: [] });
    const steps = [
      { name: 'Fridge', id: 'loc2345' },
      { name: 'Rack', id: 'loc34567' },
      { name: 'Row: 1 Col: 4', id: 'loc1234' }
    ];

    wrapper = shallow(<SelectedInventory {...props} containerSelectionMap={containerSelectionMap} />);
    const dataTable = wrapper.find(DataTable);
    const data = dataTable.props().data;
    const location = mount(data[0].Location);
    const hierarchyPath = location.find('HierarchyPath');

    expect(hierarchyPath.props().spacingPx).to.equal(1);
    expect(hierarchyPath.props().isTruncate).to.be.true;
    expect(hierarchyPath.props().steps).to.deep.equal(steps);
    location.unmount();
  });
});
