import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import ContainerStore from 'main/stores/ContainerStore';
import { Button } from '@transcriptic/amino';
import Immutable from 'immutable';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import MaterialComponent from './MaterialComponent';
import { reactionWithRunCreated } from './ChemicalReactionAPIMock';
import CompoundSourceSelectorModal from './CompoundSourceSelector/CompoundSourceSelectorModal';

describe('Material Component', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  const containerData = [
    {
      barcode: null,
      shipment_id: 'sr1frrbe4rpwtaw',
      aliquot_search_scores: [],
      hazards: [],
      container_type_id: 'a1-vial',
      device_id: null,
      location_id: null,
      tared_weight_mg: null,
      generated_by_run_id: null,
      organization_id: 'org13',
      public_location_description: 'In transit to Transcriptic.',
      suggested_user_barcode: null,
      created_at: '2021-05-21T06:02:57.229-07:00',
      lab: {
        id: 'lb1fqhdj4vya2cu',
        name: 'Menlo Park',
        operated_by_id: 'org13',
        address_id: 'addr188rr9ukd7ry',
        created_at: '2021-05-10T04:22:27.135-07:00',
        updated_at: '2021-05-10T04:22:27.135-07:00'
      },
      created_by: 'u16r2fqgpp93m',
      test_mode: false,
      shipment_code: 'PXW',
      container_type_name: 'A1 vial',
      status: 'inbound',
      empty_mass_mg: null,
      kit_request_id: null,
      label: 'Tube 1',
      kit_order_id: null,
      storage_condition: 'cold_4',
      aliquot_count: 1,
      organization_name: 'Strateos',
      updated_at: '2021-05-21T06:02:57.283-07:00',
      cover: null,
      deleted_at: null,
      type: 'containers',
      id: 'ct1frrbe4q54aqh',
      expires_at: null,
      orderable_material_component_id: null,
      slot: null,
      current_mass_mg: null
    }
  ];

  const nonPinReactants = reactionWithRunCreated.reactants.filter(reactant => !reactant.additionalProperties || !reactant.additionalProperties.pin);

  const updateReactantsSpy = sandbox.spy();

  const props = {
    materials: nonPinReactants,
    updateReactants: updateReactantsSpy
  };

  beforeEach(() => {
    sandbox.stub(ContainerStore, 'getById').returns(Immutable.fromJS(containerData[0]));
    sandbox.stub(ContainerTypeStore, 'getById').returns(Immutable.fromJS(
      {
        id: 'a1-vial',
        is_tube: true
      }));

    wrapper = shallow(<MaterialComponent {...props} />);
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  it('MaterialComponent should have Card', () => {
    const Card = wrapper.find('.material-component__card');
    expect(Card.length).to.equal(1);
  });

  it('MaterialComponent should have Table', () => {
    const Table = wrapper.find('Table');
    expect(Table.length).to.equal(1);
  });

  it('MaterialComponent table should have 8 columns', () => {
    const Columns = wrapper.find('Table').dive().find('Header').dive()
      .find('HeaderCell');
    expect(Columns.length).to.equal(8);
  });

  it('MaterialComponent table should have 7 columns if update column is disabled', () => {
    wrapper = shallow(<MaterialComponent {...props} disableUpdateColumn />);
    const Columns = wrapper.find('Table').dive().find('Header').dive()
      .find('HeaderCell');
    expect(Columns.length).to.equal(7);
  });

  it('Material component should render all materials', () => {
    const Rows = wrapper.find('Table').dive().find('Body').dive()
      .find('Row');
    expect(Rows.length).to.equal(nonPinReactants.length);
  });

  // adding 3 tr corresponding to the new tr in the table plus the two tr in the new table created
  it('Material component should expand on chevron click', () => {
    wrapper.find('Table').dive().find('Icon').first()
      .simulate('click');
    const expandedTable = wrapper.find('Table').dive().find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find('ExpandedTableMaterial');
    expect(expandedTable.length).to.equal(1);
    expect(expandedTable.dive().find('Table').dive().find('Row').length).to.equal(nonPinReactants.length);
  });

  it('Material component expanded table should have 3 columns', () => {
    wrapper.find('Table').dive().find('Icon').first()
      .simulate('click');
    const expandedTable = wrapper.find('Table').dive().find('Row')
      .at(2)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find('ExpandedTableMaterial');
    const Columns = expandedTable.dive().find('Table').dive().find('HeaderCell');
    expect(Columns.length).to.equal(3);
    expect(Columns.at(0).dive().text()).to.equal('Container Type');
    expect(Columns.at(1).dive().text()).to.equal('Container Name');
    expect(Columns.at(2).dive().text()).to.equal('Compound Id');
  });

  it('should update container data in reaction when onSourceSelected action invoked', () => {
    wrapper.find(CompoundSourceSelectorModal).props().onSourceSelected('ct1frrbe4q54aqh');
    expect(updateReactantsSpy.calledOnce).to.be.true;
  });

  it('validate update button functionality', () => {
    wrapper = shallow(<MaterialComponent {...props} />);
    expect(wrapper.find(CompoundSourceSelectorModal).dive().find('ConnectedSinglePaneModal').dive()
      .find('SinglePaneModal')
      .prop('modalOpen')).to.equal(false);
    wrapper.find('Table').dive().find(Button).first()
      .simulate('click');
    expect(wrapper.find(CompoundSourceSelectorModal).dive().find('ConnectedSinglePaneModal').dive()
      .find('SinglePaneModal')
      .prop('modalOpen')).to.equal(true);
  });

  it('eMolecules component expanded table should have 4 columns', () => {
    const eMoleculesRow = wrapper.find('Table').dive().find('Row').at(2);
    expect(eMoleculesRow.find('BodyCell').length).to.equal(8);
    expect(eMoleculesRow.find('BodyCell').at(2).dive().text()).to.equal('xyz');
    expect(eMoleculesRow.find('BodyCell').at(5).dive().text()).to.equal('eMolecules');

    wrapper.find('Table').dive().find('Icon').at(1)
      .simulate('click');
    const expandedTable = wrapper.find('Table').dive().find('Row')
      .at(3)
      .find('BodyCell')
      .dive()
      .find('u')
      .dive()
      .find('ExpandedTableMaterial');
    expect(expandedTable.length).to.equal(1);
    const Columns = expandedTable.dive().find('Table').dive().find('HeaderCell');
    expect(Columns.length).to.equal(4);
    expect(Columns.at(0).dive().text()).to.equal('Name');
    expect(Columns.at(1).dive().text()).to.equal('Supplier');
    expect(Columns.at(2).dive().text()).to.equal('Estimated Cost');
    expect(Columns.at(3).dive().text()).to.equal('Tier');
  });

  it('validate container search options for update button for solid & liquid materials', () => {
    const updateMaterialButtons = wrapper.find('Table').dive().find(Button);
    updateMaterialButtons.first().simulate('click');
    let modal = wrapper.find(CompoundSourceSelectorModal).dive().find('ConnectedSinglePaneModal').dive()
      .find('SinglePaneModal');
    let sourceCompound = modal.prop('data').get('compound');
    expect(sourceCompound.get('mass')).to.equal(1.321512, 'Solid material mass property should have proper data(in mg)');
    expect(sourceCompound.get('volume')).to.equal(undefined, 'Solid material volume property should be undefined');

    updateMaterialButtons.last().simulate('click');
    modal = wrapper.find(CompoundSourceSelectorModal).dive().find('ConnectedSinglePaneModal').dive()
      .find('SinglePaneModal');
    sourceCompound = modal.prop('data').get('compound');
    expect(sourceCompound.get('volume')).to.equal(800, 'Liquid material volume property should have proper data(in µl)');
    expect(sourceCompound.get('mass')).to.equal(undefined, 'Liquid material mass property should be undefined');
  });
});
