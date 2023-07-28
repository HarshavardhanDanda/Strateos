import React      from 'react';
import { shallow }  from 'enzyme';
import sinon      from 'sinon';
import Imm        from 'immutable';
import { expect } from 'chai';
import { List, Column, TableLayout, Banner, PlateSelectLogic, Divider } from '@transcriptic/amino';

import ContainerMetadata from 'main/pages/ContainerPage/ContainerMetadata';

import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import InteractivePlate from 'main/components/InteractivePlate/InteractivePlate.jsx';
import AliquotsTablePanel from 'main/pages/ContainerPage/AliquotsTablePanel.jsx';
import AliquotAPI      from 'main/api/AliquotAPI';
import AliquotStore from 'main/stores/AliquotStore';
import ContainerAPI from 'main/api/ContainerAPI';
import mockProperties from 'main/test/container/customProperties.json';
import mockConfigs from 'main/test/container/customPropertiesConfigs.json';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import CustomPropertyTable from 'main/pages/ContainerPage/CustomPropertyTable';
import configs from 'main/pages/ContainerPage//mocks/aliquotsCustomPropertiesConfigs.json';
import ContainerType from '../../components/ContainerType';
import { InventoryDetails } from './InventoryDetails';

const props = {
  container: Imm.Map({
    aliquot_count: 1,
    aliquot_search_scores: [],
    container_type_id: 'vendor-tube',
    created_at: '2020-11-24T23:53:12.322-08:00',
    id: 'ct1f45ya42az8u2',
    label: 'Vendor tube',
    organization_id: 'org13',
    public_location_description: 'In transit to Transcriptic.',
    shipment_code: 'PVM',
    shipment_id: 'sr1f564253jcst7',
    slot: null,
    status: 'inbound',
    storage_condition: 'cold_80',
    test_mode: false,
    type: 'containers',
    updated_at: '2020-11-24T23:53:12.384-08:00',
    current_mass_mg: null,
    empty_mass_mg: null,
    barcode: 'abcd',
    hazards: ['flammable'],
    suggested_user_barcode: '112233'
  }),
  containerType: Imm.Map({
    acceptable_lids: [],
    capabilities: [],
    catalog_number: '-',
    col_count: 1,
    cost_each: '0.0',
    id: 'vendor-tube',
    is_tube: true,
    manual_execution: false,
    name: 'Vendor tube',
    sale_price: '0.0',
    shortname: 'vendor-tube',
    type: 'container_types',
    vendor: '-',
    well_count: 1,
    well_depth_mm: '0.0',
    well_volume_ul: '999999999.0'
  }),
  containerId: '24324kk23',
  aliquots: Imm.fromJS([{
    container_id: 'ct1f45ya42az8u2',
    id: 'aq1f45ya42gp8g7',
    name: 'Tube 1',
    properties: {},
    type: 'aliquots',
    version: 0,
    volume_ul: '10.0',
    mass_mg: '2.0',
    well_idx: 1,
    resource_id: null,
  }]),
  resources: Imm.List(),
  containerCustomProperties: Imm.fromJS(mockProperties)
};

const negativeVolumeAliquots = Imm.fromJS([{
  container_id: 'ct1f45ya42az8u2',
  id: 'aq1f45ya42gp8g7',
  name: 'Tube 1',
  properties: {},
  type: 'aliquots',
  version: 0,
  volume_ul: '-10.0',
  mass_mg: '2.0',
  well_idx: '0',
  resource_id: null,
}, {
  container_id: 'ct1f45ya42az8u2',
  id: 'aq1f45yty67gc',
  name: 'Tube 2',
  properties: {},
  type: 'aliquots',
  version: 0,
  volume_ul: '10.0',
  mass_mg: '2.0',
  well_idx: '1',
  resource_id: null,
}]);

const negativeMassAliquots = Imm.fromJS([{
  container_id: 'ct1f45ya42az8u2',
  id: 'aq1f45ya42gp8g7',
  name: 'Tube 1',
  properties: {},
  type: 'aliquots',
  version: 0,
  volume_ul: '10.0',
  mass_mg: '-2.0',
  well_idx: '0',
  resource_id: null,
}, {
  container_id: 'ct1f45ya42az8u2',
  id: 'aq1f45yty67gc',
  name: 'Tube 2',
  properties: {},
  type: 'aliquots',
  version: 0,
  volume_ul: '10.0',
  mass_mg: '2.0',
  well_idx: '1',
  resource_id: null,
}]);

const customProperties = Imm.fromJS(mockProperties);
const customPropertiesConfigs = Imm.fromJS(mockConfigs);
const aliquotsCustomPropertiesConfigs = Imm.fromJS(configs);

describe('InventoryDetails', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;
  let ccpcStoreStub;

  beforeEach(() => {
    ccpcStoreStub =  sandbox.stub(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig').returns(customPropertiesConfigs);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should render without error', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
  });

  it('should contain Interactive plate', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    expect(wrapper.find(InteractivePlate)).to.have.length(1);
  });

  it('should contain Tube and Legend in the tube view', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    const interactivePlate = wrapper.find(InteractivePlate);
    expect(interactivePlate.dive().find('Tube')).to.have.length(1);
    expect(interactivePlate.dive().find('Legend')).to.have.length(1);
  });

  it('should have labels on legend to view volume occupied by Tube', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    const interactivePlate = wrapper.find(InteractivePlate);
    const legend = interactivePlate.dive().find('Legend');
    expect(legend.dive().find('.plate-legend__label--max').text()).to.equal('2.0e+9 µl');
    expect(legend.dive().find('.plate-legend__label--min').text()).to.equal('0 µl');
  });

  it('should have details of 12 attributes by default in metadata', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    const containerMetadataAttributes = wrapper.find(ContainerMetadata).dive().find(TableLayout.Body).find(TableLayout.Row);

    expect(containerMetadataAttributes).to.have.length(12);

    expect(containerMetadataAttributes.at(0).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Catalog no.');
    expect(containerMetadataAttributes.at(1).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('ID');
    expect(containerMetadataAttributes.at(2).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Barcode');
    expect(containerMetadataAttributes.at(3).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Suggested barcode');
    expect(containerMetadataAttributes.at(4).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Current location');
    expect(containerMetadataAttributes.at(5).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Storage temp');
    expect(containerMetadataAttributes.at(6).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Hazard');
    expect(containerMetadataAttributes.at(7).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Container type');
    expect(containerMetadataAttributes.at(8).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Current mass');
    expect(containerMetadataAttributes.at(9).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Empty container mass');
    expect(containerMetadataAttributes.at(10).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Created by');
    expect(containerMetadataAttributes.at(11).find('.container-metadata__core-property__item').children().at(0)
      .text()).to.equal('Vendor');
  });

  it('should have values for attributes in container metadata', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    const containerMetadataAttributes = wrapper.find(ContainerMetadata).dive().find(TableLayout.Body).find(TableLayout.Row);
    const containerType = containerMetadataAttributes.at(7).find('.container-metadata__core-property__item').children().at(1)
      .find(ContainerType);
    expect(containerType.props().containerTypeId).to.equal('vendor-tube');

    expect(containerMetadataAttributes.at(0).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('-');
    expect(containerMetadataAttributes.at(1).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('ct1f45ya42az8u2');
    expect(containerMetadataAttributes.at(2).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('abcd');
    expect(containerMetadataAttributes.at(3).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('112233');
    expect(containerMetadataAttributes.at(4).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('In transit to Transcriptic.');
    expect(containerMetadataAttributes.at(5).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('-80 °C (± 1 °C)');
    expect(containerMetadataAttributes.at(6).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('Flammable');
    expect(containerMetadataAttributes.at(8).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('-');
    expect(containerMetadataAttributes.at(9).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('-');
    expect(containerMetadataAttributes.at(10).find('.container-metadata__core-property__item').children().at(1))
      .to.have.length(1);
    expect(containerMetadataAttributes.at(11).find('.container-metadata__core-property__item').children().at(1)
      .text()).to.equal('-');
  });

  it('should contain Aliquot panel', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    expect(wrapper.find(AliquotsTablePanel)).to.have.length(1);
  });

  it('should contain Spinner for Aliquot panel if loading', () => {
    sandbox.stub(AcsControls, 'isFeatureEnabled').withArgs(FeatureConstants.VIEW_COMPOUNDS).returns(true);
    wrapper =  shallow(<InventoryDetails {...props} />);
    const aliquotPanel = wrapper.find(AliquotsTablePanel);
    expect(aliquotPanel.props().loading).to.be.true;
    expect(aliquotPanel.dive().find('Spinner')).to.have.length(1);
  });

  it('should not contain Spinner for Aliquot panel if not loading', () => {
    wrapper =  shallow(<InventoryDetails {...props} aliquots={Imm.List()} />).setState({ loading: false });
    const aliquotPanel = wrapper.find(AliquotsTablePanel);
    expect(aliquotPanel.props().loading).to.be.false;
    expect(aliquotPanel.dive().find('Spinner')).to.have.length(0);
  });

  it('should have heading and display no aliquots if aliquots are empty', () => {
    wrapper =  shallow(<InventoryDetails {...props} aliquots={Imm.List()} />).setState({ loading: false });
    const aliquotPanel = wrapper.find(AliquotsTablePanel);
    expect(aliquotPanel.dive().find('h3').text()).to.equal('Aliquots');
    expect(aliquotPanel.dive().find('.panel-body').text()).to.equal('No Aliquots');
  });

  it('should trigger updateAliquotData method sent as props when adding a resource from the InventorySelectorModal', () => {
    wrapper = enzyme.shallow(<InventoryDetails {...props} onSelectedWellsChange={() => {}} disableButton={() => {}} />);
    const updateAliquotData = sandbox.spy(wrapper.instance(), 'updateAliquotData');

    sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { aliquotMetadata.props().updateAliquotData(); }
    });

    wrapper.instance().onAliquotClick(props.aliquots.get(0));
    wrapper.setState({ selectedAliquots: props.aliquots });

    const aliquotMetadata = wrapper.find('AliquotMetadata');

    aliquotMetadata.dive().find('SearchChoosingProperty').props().onSave();

    expect(updateAliquotData.callCount).to.equal(1);
  });

  it('should have a Table and columns to display aliquots if aliquots exists', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);

    const aliquotPanelTable = wrapper.find(AliquotsTablePanel);
    expect(aliquotPanelTable).to.have.length(1);
    const aliquotTableColumns = aliquotPanelTable.dive().find(List).find(Column);
    expect(aliquotTableColumns).to.have.length(5);
    expect(aliquotTableColumns.at(0).props().header).to.equal('WELL');
    expect(aliquotTableColumns.at(1).props().header).to.equal('VOLUME');
    expect(aliquotTableColumns.at(2).props().header).to.equal('MASS');
    expect(aliquotTableColumns.at(3).props().header).to.equal('RESOURCE');
    expect(aliquotTableColumns.at(4).props().header).to.equal('NAME');
  });

  it('should have aliquot details in aliquot panel', () => {
    const aliquotDetails = props.aliquots.toJS()[0];

    wrapper =  shallow(<InventoryDetails {...props} />);

    const aliquotPanelTable = wrapper.find(AliquotsTablePanel);
    expect(aliquotPanelTable).to.have.length(1);
    const aliquotDataTable = aliquotPanelTable.dive().find(List).dive().find('Table');
    expect(aliquotDataTable).to.have.length(1);
    const aliquotData = aliquotDataTable.dive().find('Body').dive().find('Row')
      .at(0)
      .dive()
      .find('BodyCell');
    expect(aliquotData.at(0).dive().text()).to.include(aliquotDetails.well_idx);
    expect(aliquotData.at(1).dive().text()).to.include(aliquotDetails.volume_ul);
    expect(aliquotData.at(2).dive().text()).to.include(aliquotDetails.mass_mg);
    expect(aliquotData.at(3).dive().text()).to.equal('N/A');
    expect(aliquotData.at(4).dive().text()).equal(aliquotDetails.name);
  });

  it('should select single aliquot automatically', () => {
    const onSelectedWellsChange = sinon.spy();
    const newProps = { onSelectedWellsChange: onSelectedWellsChange, ...props };

    wrapper = shallow(<InventoryDetails {...newProps} />);

    wrapper.instance().selectSingleAliquotAutomatically();

    expect(onSelectedWellsChange.calledOnce).to.equal(true);
  });

  it('on click legend label or column number should update wellmap', () => {
    const onSelectedWellsChange = sinon.spy();
    const newProps = {
      ...props,
      containerId: 'ct1g59hve6vtp54',
      containerType: Imm.Map({
        well_count: 24,
        col_count: 12
      }),
      aliquots: Imm.fromJS([
        { id: 'aq0', well_idx: 0 },
        { id: 'aq1', well_idx: 1 },
        { id: 'aq2', well_idx: 2 },
        { id: 'aq3', well_idx: 3 },
        { id: 'aq4', well_idx: 4 },
        { id: 'aq5', well_idx: 5 },
        { id: 'aq6', well_idx: 6 },
        { id: 'aq7', well_idx: 7 },
        { id: 'aq8', well_idx: 8 },
        { id: 'aq9', well_idx: 9 },
        { id: 'aq10', well_idx: 10 },
        { id: 'aq11', well_idx: 11 },
        { id: 'aq12', well_idx: 12 },
        { id: 'aq13', well_idx: 13 },
        { id: 'aq14', well_idx: 14 },
        { id: 'aq15', well_idx: 15 },
        { id: 'aq16', well_idx: 16 },
        { id: 'aq17', well_idx: 17 },
        { id: 'aq18', well_idx: 18 },
        { id: 'aq19', well_idx: 19 },
        { id: 'aq20', well_idx: 20 },
        { id: 'aq21', well_idx: 21 },
        { id: 'aq22', well_idx: 22 },
        { id: 'aq23', well_idx: 23 }
      ]),
      onSelectedWellsChange: onSelectedWellsChange,
      disableButton: () => {}
    };
    const wrapper = shallow(<InventoryDetails {...newProps} />);
    const wellMap = newProps.aliquots.toMap().mapEntries(([, aliquot]) => {
      return [aliquot.get('well_idx'), Imm.Map({ selected: false })];
    });
    wrapper.setState({ wellMap });
    wrapper.instance().onRowClicked(0, { ctrlKey: false, metaKey: false }, wrapper.state('wellMap'));
    expect(onSelectedWellsChange.callCount).to.equal(1);
    wrapper.instance().onColClicked(4, { ctrlKey: false, metaKey: false }, wrapper.state('wellMap'));
    expect(onSelectedWellsChange.callCount).to.equal(2);
  });

  it('should show the banner if the aliquot has non positive volume when selecting container and aliquots', () => {
    const disableButton = sinon.spy();
    sandbox.stub(ContainerAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            attributes: {
              created_by: 'user',
              shipment_id: 'sq1et8cdx7t3j53',
              organization_id: 'org13'
            }
          }
        });
        return { always: () => ({}) };
      }
    });
    sandbox.stub(AliquotStore, 'getByContainer').returns(negativeVolumeAliquots);
    wrapper =  shallow(<InventoryDetails {...props} aliquots={negativeVolumeAliquots} disableButton={() => {}} />);

    expect(wrapper.find(Banner)).to.have.length(1);
    expect(wrapper.find(Banner).prop('bannerMessage')).to.be.equal('Some Aliquots have negative Volume/Mass. These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities.');
    expect(wrapper.find(Banner).prop('bannerType')).to.be.equal('warning');
    expect(disableButton.called).to.be.false;
  });

  it('should not show the banner if the aliquot does not have negative volume/mass when selecting containers and aliquots', () => {
    wrapper =  shallow(<InventoryDetails {...props} />);
    expect(wrapper.find(Banner)).to.have.length(0);
  });

  it('should have the prop of rowColorMap if the aliquot has negative volume for Aliquot Table', () => {
    wrapper =  shallow(<InventoryDetails {...props} aliquots={negativeVolumeAliquots} />);
    expect(wrapper.find(AliquotsTablePanel).prop('rowColorMap')).to.be.deep.equal({ aq1f45ya42gp8g7: 'danger' });
  });

  it('should have the prop of rowColorMap if the aliquot has negative mass for Aliquot Table', () => {
    wrapper =  shallow(<InventoryDetails {...props} aliquots={negativeMassAliquots} />);
    expect(wrapper.find(AliquotsTablePanel).prop('rowColorMap')).to.be.deep.equal({ aq1f45ya42gp8g7: 'danger' });
  });

  it('should show the banner with different message when we select the aliquot that has negative volume when selecting aliquots', () => {
    const disableButton = sinon.spy();
    sandbox.stub(ContainerAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            attributes: {
              created_by: 'user',
              shipment_id: 'sq1et8cdx7t3j53',
              organization_id: 'org13'
            }
          }
        });
        return { always: () => ({}) };
      }
    });
    sandbox.stub(AliquotStore, 'getByContainer').returns(negativeVolumeAliquots);

    sandbox.stub(PlateSelectLogic, 'wellClicked').returns(Imm.fromJS({
      0: {
        hasVolume: true,
        selected: true
      },
      1: {
        hasVolume: true,
        selected: false
      }
    }));
    wrapper =  shallow(<InventoryDetails {...props} aliquots={negativeVolumeAliquots} disableButton={disableButton} onSelectedWellsChange={() => {}}  />);

    wrapper.instance().onAliquotClick(Imm.fromJS(negativeVolumeAliquots.toJS()[1]));

    expect(wrapper.find(Banner)).to.have.length(1);
    expect(wrapper.find(Banner).prop('bannerMessage')).to.be.equal('This aliquot has negative volume/mass. These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities.');
    expect(wrapper.find(Banner).prop('bannerType')).to.be.equal('warning');
    expect(disableButton.called).to.be.false;
  });

  it('should show the banner when we select the aliquot that has negative mass when selecting aliquots', () => {
    const disableButton = sinon.spy();
    sandbox.stub(ContainerAPI, 'get').returns({
      done: (cb) => {
        cb({
          data: {
            attributes: {
              created_by: 'user',
              shipment_id: 'sq1et8cdx7t3j53',
              organization_id: 'org13'
            }
          }
        });
        return { always: () => ({}) };
      }
    });
    sandbox.stub(AliquotStore, 'getByContainer').returns(negativeMassAliquots);

    sandbox.stub(PlateSelectLogic, 'wellClicked').returns(Imm.fromJS({
      0: {
        hasVolume: true,
        selected: true
      },
      1: {
        hasVolume: true,
        selected: false
      }
    }));
    wrapper =  shallow(<InventoryDetails {...props} aliquots={negativeMassAliquots} disableButton={disableButton} onSelectedWellsChange={() => {}}  />);

    wrapper.instance().onAliquotClick(Imm.fromJS(negativeMassAliquots.toJS()[1]));

    expect(wrapper.find(Banner)).to.have.length(1);
    expect(wrapper.find(Banner).prop('bannerMessage')).to.be.equal('This aliquot has negative volume/mass. These samples can still be used however, physical material may not be transferred from Aliquots with negative quantities.');
    expect(wrapper.find(Banner).prop('bannerType')).to.be.equal('warning');
    expect(disableButton.called).to.be.false;
  });

  it('should render container and aliquot custom property table without errors', () => {
    wrapper = shallow(<InventoryDetails {...props} containerCustomProperties={customProperties} />);
    wrapper.setState({ selectedAliquots: props.aliquots, aliquot: props.aliquots.get(0) });
    expect(wrapper.find(Divider).length).to.equal(3);
    expect(wrapper.find(CustomPropertyTable).length).to.equal(2);
  });

  it('should not render container custom property table if there are no custom properties configs', () => {
    ccpcStoreStub.returns(Imm.fromJS([]));
    wrapper = shallow(<InventoryDetails {...props} />);
    expect(wrapper.find(Divider).length).to.equal(0);
    expect(wrapper.find(CustomPropertyTable).length).to.equal(0);
  });

  it('should call ContainerAPI.updateCustomProperty when container contextual property is updated', () => {
    const updateCustomPropertySpy = sandbox.spy(ContainerAPI, 'updateCustomProperty');
    wrapper =  shallow(<InventoryDetails {...props} containerCustomProperties={customProperties} />);
    wrapper.instance().onSaveContainerCustomProperty(customPropertiesConfigs.get(0).get('key'), 'changedValue',);
    expect(updateCustomPropertySpy.calledWithExactly('ct1f45ya42az8u2', customPropertiesConfigs.get(0).get('key'), 'changedValue')).to.be.true;
  });

  it('should call AliquotAPI.updateCustomProperty when aliquot contextual property is updated', () => {
    const updateCustomPropertySpy = sandbox.spy(AliquotAPI, 'updateCustomProperty');
    wrapper =  shallow(<InventoryDetails {...props} />);
    wrapper.setState({ aliquot: props.aliquots.get(0) });
    wrapper.instance().onSaveAliquotCustomProperty(aliquotsCustomPropertiesConfigs.get(0).get('key'), 'changedValue',);
    expect(updateCustomPropertySpy.calledWithExactly('aq1f45ya42gp8g7', aliquotsCustomPropertiesConfigs.get(0).get('key'), 'changedValue')).to.be.true;
  });
});
