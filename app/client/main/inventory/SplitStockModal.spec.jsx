import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import Immutable from 'immutable';
import _ from 'lodash';
import ContainerActions from 'main/actions/ContainerActions';
import SplitStockModal from './SplitStockModal';

describe('SplitStockModal', () => {
  const sandbox = sinon.createSandbox();
  let splitSpy;
  beforeEach(() => {
    splitSpy = sandbox.spy(ContainerActions, 'split');
  });
  afterEach(() => {
    sandbox.restore();
  });

  const sourceContainerWithMassVolume = Immutable.fromJS({
    barcode: '1331',
    shipment_id: 'sr1hkvhfqh3eqgp',
    container_type_id: 'pcr-0.5',
    suggested_barcode: null,
    location_id: 'loc1egnexbbfgsw8',
    aliquots: [
      {
        mass_mg: '40.0',
        created_at: '2022-10-20T03:41:29.824-07:00',
        name: 'tubemv',
        well_idx: 0,
        lot_no: null,
        properties: {},
        contextual_custom_properties: [],
        aliquots_compound_links: [],
        container_id: 'ct1hkvhfpvtrby7',
        id: 'aq1hkvhfpyn27jt',
        volume_ul: '100.0'
      }
    ],
    lab: {
      id: 'lb1fknzm4kjxcvg',
      name: 'San Diego'
    },
    created_by: 'u19ahey7f2vyx',
    test_mode: false,
    shipment_code: 'YRC',
    status: 'consumable',
    properties: {},
    label: 'tm',
    container_type: {
      is_tube: true,
      id: 'pcr-0.5',
      well_count: 1
    },
    id: 'ct1hkvhfpvtrby7',
    orderable_material_component_id: null,
  });
  const sourceContainerWithVolume = Immutable.fromJS({
    barcode: '1331',
    shipment_id: 'sr1hkvhfqh3eqgp',
    container_type_id: 'pcr-0.5',
    suggested_barcode: null,
    location_id: 'loc1egnexbbfgsw8',
    aliquots: [
      {
        mass_mg: '40.0',
        created_at: '2022-10-20T03:41:29.824-07:00',
        name: 'tubemv',
        well_idx: 0,
        lot_no: null,
        properties: {},
        contextual_custom_properties: [],
        aliquots_compound_links: [],
        container_id: 'ct1hkvhfpvtrby7',
        id: 'aq1hkvhfpyn27jt',
        volume_ul: '100.0'
      }
    ],
    lab: {
      id: 'lb1fknzm4kjxcvg',
      name: 'San Diego'
    },
    created_by: 'u19ahey7f2vyx',
    test_mode: false,
    shipment_code: 'YRC',
    status: 'consumable',
    properties: {},
    label: 'tm',
    container_type: {
      is_tube: true,
      id: 'pcr-0.5',
      well_count: 1
    },
    id: 'ct1hkvhfpvtrby7',
    orderable_material_component_id: null,
  });
  const sourceContainerWithMass = Immutable.fromJS({
    barcode: '1331',
    shipment_id: 'sr1hkvhfqh3eqgp',
    container_type_id: 'pcr-0.5',
    suggested_barcode: null,
    location_id: 'loc1egnexbbfgsw8',
    aliquots: [
      {
        mass_mg: '40.0',
        created_at: '2022-10-20T03:41:29.824-07:00',
        name: 'tubemv',
        well_idx: 0,
        lot_no: null,
        properties: {},
        contextual_custom_properties: [],
        aliquots_compound_links: [],
        container_id: 'ct1hkvhfpvtrby7',
        id: 'aq1hkvhfpyn27jt'
      }
    ],
    lab: {
      id: 'lb1fknzm4kjxcvg',
      name: 'San Diego'
    },
    created_by: 'u19ahey7f2vyx',
    test_mode: false,
    shipment_code: 'YRC',
    status: 'consumable',
    properties: {},
    label: 'tm',
    container_type: {
      is_tube: true,
      id: 'pcr-0.5',
      well_count: 1
    },
    id: 'ct1hkvhfpvtrby7',
    orderable_material_component_id: null,
  });

  describe('SourceAliquot with only Volume', () => {
    const splitStockModal = shallow(
      <SplitStockModal sourceContainer={sourceContainerWithVolume} isLoaded />
    ).dive().find('ConnectedSinglePaneModal');
    const tubeCreate = splitStockModal.find('AdminTubeCreate');
    const soureContainerInfo = splitStockModal.find('SourceContainerInfo');

    it('should render with correct props', () => {
      expect(tubeCreate.props().type).to.equal('volume');
      expect(soureContainerInfo.props().type).to.equal('volume');
      expect(soureContainerInfo.dive().find('FormGroup').at(3).props().label).to.equal('Source Initial Volume');
      expect(soureContainerInfo.dive().find('FormGroup').at(4).props().label).to.equal('Source Remaining Volume');
    });

    it('should submit only volume values in the payload', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        volume: '12:microliter',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();

      expect(splitSpy.calledOnce).to.be.true;
      const argBody = splitSpy.args[0][1].toJS()[0];
      expect(argBody.barcode).to.eql('1234');
      expect(argBody.label).to.eql('t2');
      expect(argBody.location_id).to.eql('loc1egnexbbfgsw8');
      expect(argBody.aliquots['0'].volume_ul).to.eql(12);
    });

    it('should not submit with no volume input', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });

    it('should not submit with no location Id', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        volume: '12:microliter',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });
  });

  describe('SourceAliquot with only Mass', () => {
    const splitStockModal = shallow(
      <SplitStockModal sourceContainer={sourceContainerWithMass} isLoaded />
    ).dive().find('ConnectedSinglePaneModal');
    const tubeCreate = splitStockModal.find('AdminTubeCreate');
    const soureContainerInfo = splitStockModal.find('SourceContainerInfo');

    it('correct props', () => {
      expect(tubeCreate.props().type).to.equal('mass');
      expect(soureContainerInfo.props().type).to.equal('mass');
      expect(soureContainerInfo.dive().find('FormGroup').at(3).props().label).to.equal('Source Initial Mass');
      expect(soureContainerInfo.dive().find('FormGroup').at(4).props().label).to.equal('Source Remaining Mass');
    });

    it('should submit only mass values in the payload', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        mass: '12:milligram',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.calledOnce).to.be.true;
      const argBody = splitSpy.args[0][1].toJS()[0];
      expect(argBody.barcode).to.eql('1234');
      expect(argBody.label).to.eql('t2');
      expect(argBody.location_id).to.eql('loc1egnexbbfgsw8');
      expect(argBody.aliquots['0'].mass_mg).to.eql(12);
    });

    it('should not submit with no mass input', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));
      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });

    it('should not submit with no location Id', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        mass: '12:milligram',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });
  });

  describe('SourceAliquot with both Mass and Volume', () => {
    const splitStockModal = shallow(
      <SplitStockModal sourceContainer={sourceContainerWithMassVolume} isLoaded />
    ).dive().find('ConnectedSinglePaneModal');
    const tubeCreate = splitStockModal.find('AdminTubeCreate');
    const soureContainerInfo = splitStockModal.find('SourceContainerInfo');

    it('correct props', () => {
      expect(tubeCreate.props().type).to.equal('volume');
      expect(soureContainerInfo.props().type).to.equal('volume');
      expect(soureContainerInfo.dive().find('FormGroup').at(3).props().label).to.equal('Source Initial Volume');
      expect(soureContainerInfo.dive().find('FormGroup').at(4).props().label).to.equal('Source Remaining Volume');
    });

    it('should submit only volume values in the payload', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        volume: '12:microliter',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.calledOnce).to.be.true;
      const argBody = splitSpy.args[0][1].toJS()[0];
      expect(argBody.barcode).to.eql('1234');
      expect(argBody.label).to.eql('t2');
      expect(argBody.location_id).to.eql('loc1egnexbbfgsw8');
      expect(argBody.aliquots['0'].volume_ul).to.eql(12);
    });

    it('should submit correct proportions of volume and mass values in the payload', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        volume: '12:microliter',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.calledOnce).to.be.true;
      const argBody = splitSpy.args[0][1].toJS()[0];
      expect(argBody.aliquots['0'].volume_ul).to.eql(12);
      expect(argBody.aliquots['0'].mass_mg).to.eql(4.8);
    });

    it('should not submit with no volume input', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        locationId: 'loc1egnexbbfgsw8',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });

    it('should not submit with no location Id', () => {
      splitStockModal.dive().find('AdminTubeCreate').props().onInputValuesChange(Immutable.fromJS({
        barcode: '1234',
        label: 't2',
        storage: 'cold_4',
        containerType: 'micro-1.5',
        volume: '12:microliter',
        defaultLocationId: 'loc1egnexbbfgsw8'
      }));

      splitStockModal.props().onAccept();
      expect(splitSpy.called).to.be.false;
    });
  });
});
