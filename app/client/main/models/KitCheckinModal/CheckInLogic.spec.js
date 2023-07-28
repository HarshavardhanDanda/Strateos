import _ from 'lodash';
import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerActions from 'main/actions/ContainerActions';
import { validators } from 'main/components/validation';
import CheckinLogic from './CheckInLogic';

const containersMap = Immutable.fromJS({
  omatc1ha8v8gdftapf: [{
    resource_id: { value: 'resource_uuid' },
    lot_no: { value: '123' },
    volume: { value: '2:microliter' },
    mass: { value: '5:milligram' },
    barcode: { value: 'BA12345' },
    container_type_id: { value: 'a1-vial' },
    expires_at: { value: null },
    label: { value: 'CT One' },
    location: { value: { id: 'location_uuid', lab_id: 'lab_uuid' } },
    storage_condition: { value: 'cold_4' },
  }]
});

const expectedContainers = [
  {
    barcode: 'BA12345',
    container_type_id: 'a1-vial',
    location_id: 'location_uuid',
    aliquots: [
      {
        well_idx: 'A1',
        volume_ul: 2,
        mass_mg: 5,
        lot_no: '123',
        resource_id: 'resource_uuid'
      }
    ],
    lab_id: 'lab_uuid',
    status: 'available',
    label: 'CT One',
    kit_order_id: 'kit_order_uuid',
    storage_condition: 'cold_4',
    container_type: 'a1-vial',
    orderable_material_component_id: 'omatc1ha8v8gdftapf',
    expires_at: null
  }
];

const getInputs = (mass, volume) => {
  return Immutable.fromJS({
    mass: {
      value: mass
    },
    volume: {
      value: volume
    }
  });
};

const testMassValidator = (mass, volume, msg) => {
  const inputs = getInputs(mass, volume);
  const error = CheckinLogic.massValidator(inputs, mass);
  expect(error).to.equal(msg);
};

const testVolumeValidator = (mass, volume, msg) => {
  const inputs = getInputs(mass, volume);
  const error = CheckinLogic.volumeValidator(inputs, volume);
  expect(error).to.equal(msg);
};

const testMassOrVolumeValidateFieldForInvalid = (field) => {
  const unit = (field === 'mass_per_container' ? 'mg' : 'μL');
  expect(CheckinLogic.validateField(field, 'a', 0, 100, unit))
    .to.equal('Must be numeric');
  expect(CheckinLogic.validateField(field, '0', 0, 100, unit))
    .to.equal('Must specify either volume or mass');
  expect(CheckinLogic.validateField(field, null, null, 100, unit))
    .to.equal('Must specify either volume or mass');
  expect(CheckinLogic.validateField(field, '', '', 100, unit))
    .to.equal('Must specify either volume or mass');
  expect(CheckinLogic.validateField(field, '100.01', 1, 100, unit))
    .to.equal(`Must be between 0${unit} and 100${unit}`);
  expect(CheckinLogic.validateField(field, '-1'))
    .to.equal('Must be numeric and positive');
};

const testMassOrVolumeValidateFieldForValid = (field) => {
  const unit = (field === 'mass_per_container' ? 'mg' : 'μL');
  expect(CheckinLogic.validateField(field, '1.23', 0, 100, unit)).to.equal(undefined);
  expect(CheckinLogic.validateField(field, '0', 1, 100, unit)).to.equal(undefined);
};

const maxVolumeInμL = 150000;
const maxVolumeInmL = maxVolumeInμL / 1000;
const maxVolumeInL = maxVolumeInμL / 1000000;
const maxVolumeInnL = maxVolumeInμL * 1000;

describe('CheckinLogic', () => {
  const sandbox = sinon.createSandbox();
  beforeEach(() => {
    sinon.stub(ContainerTypeStore, 'getById')
      .returns(Immutable.Map({
        well_volume_ul: maxVolumeInμL,
        well_count: 1,
        col_count: 1
      }));
  });

  afterEach(() => {
    sandbox.restore();
    ContainerTypeStore.getById.restore();
  });

  it('should return container inputs in required order', () => {
    const orderedContainerInputs = {
      omcId: {},
      barcode: {},
      container_type_id: {},
      resource_id: {},
      lot_no: {},
      location: {},
      label: {},
      storage_condition: {},
      expires_at: {},
      volume: {},
      mass: {}
    };
    const inputs = CheckinLogic.initialInputs(getInputs({})).toJS();
    const containerInputs = inputs[_.keys(inputs)[0]][0];
    expect(_.keys(containerInputs)).to.be.deep.equal(_.keys(orderedContainerInputs));
  });

  it('should return error for empty mass and empty volume', () => {
    testMassValidator(null, null, 'Must specify either volume or mass');
    testVolumeValidator(null, null, 'Must specify either volume or mass');
  });

  it('should return success for valid volume and/or mass', () => {
    testMassValidator(null, '10000:microliter');
    testVolumeValidator(null, '10000:microliter');

    testMassValidator('10000:milligram', null);
    testVolumeValidator('10000:milligram', null);

    testMassValidator('10000:milligram', '10000:microliter');
    testVolumeValidator('10000:milligram', '10000:microliter');
  });

  it('should return error for invalid volume in microliter', () => {
    testVolumeValidator(null, '100000000:microliter', 'Must be between 0μL and ' + maxVolumeInμL + 'μL');
    testMassValidator(null, '100000000:microliter');
  });

  it('should return error for invalid volume in milliliter', () => {
    testVolumeValidator(null, '1000:milliliter', 'Must be between 0mL and ' + maxVolumeInmL + 'mL');
  });

  it('should return error for invalid volume in liter', () => {
    testVolumeValidator(null, '10:liter', 'Must be between 0L and ' + maxVolumeInL + 'L');
  });

  it('returns error for invalid volume in nanoliter', () => {
    testVolumeValidator(null, '10000000000000:nanoliter', 'Must be between 0nL and ' + maxVolumeInnL + 'nL');
  });

  it('should return error for invalid mass', () => {
    testMassValidator('100000000:milligram', null, 'Must be between 0 and ' + 2 * maxVolumeInμL);
    testVolumeValidator('100000000:milligram', null);
  });

  it('should return error for invalid volume and valid mass', () => {
    testVolumeValidator('100:milligram', '100000000:microliter', 'Must be between 0μL and ' + maxVolumeInμL + 'μL');
    testMassValidator('100:milligram', '100000000:microliter');
  });

  it('should return error for invalid mass and valid volume', () => {
    testMassValidator('100000000:milligram', '100:microliter', 'Must be between 0 and ' + 2 * maxVolumeInμL);
    testVolumeValidator('100000000:milligram', '100:microliter');
  });

  it('should return error for invalid mass/volume with no well volume in container type ', () => {
    ContainerTypeStore.getById.restore();
    sinon.stub(ContainerTypeStore, 'getById')
      .returns(Immutable.Map({
      }));
    testMassValidator('-100000000:milligram', null, 'Must be numeric and positive');
    testVolumeValidator('-100000000:milligram', null);

    testVolumeValidator(null, '-100000000:microliter', 'Must be numeric and positive');
    testMassValidator(null, '-100000000:microliter');
  });

  it('should return error for invalid mass/volume with no well count in container type ', () => {
    ContainerTypeStore.getById.restore();
    sinon.stub(ContainerTypeStore, 'getById')
      .returns(Immutable.Map({
        well_volume_ul: maxVolumeInμL
      }));
    testMassValidator('-100000000:milligram', null, 'Must be numeric and positive');
    testVolumeValidator('-100000000:milligram', null);

    testVolumeValidator(null, '-100000000:microliter', 'Must be numeric and positive');
    testMassValidator(null, '-100000000:microliter');
  });

  it('should check org id and status on build request function', () => {
    const inputs = CheckinLogic.initialInputs(getInputs({}));
    const buildRequestContainers = CheckinLogic.buildRequestContainers(inputs).toJS();
    const container = buildRequestContainers[0];
    expect(container.status).to.equal('available');
  });

  it('should check newContainer function', () => {
    const orderableMaterialComponent = Immutable.fromJS({
      dispensable: false,
      expiration_date: '2022-10-11T18:30:00.000Z',
      container_type_id: 'vendor-tube',
      reservable: false,
      no_of_units: 5,
      indivisible: false,
      created_at: '2022-05-31T17:37:16.188-07:00',
      reorder_point: null,
      concentration: null,
      label: { value: 'Container1' },
      resource: {
        purity: null,
        organization_id: 'org3',
        compound: {},
        name: 'placeholder',
        compound_id: 'cff440d3-79df-4e33-920d-a9571ec924ea',
        metadata: {
          smiles: null,
          molecular_weight: null
        },
        properties: {},
        kind: 'ChemicalStructure',
        storage_condition: 'cold_4',
        orderable_material_components: [],
        id: 'rs1h3sxt585hm86',
        description: null,
        sensitivities: []
      },
      provisionable: false,
      mass_measurement_unit: 'mg',
      mass_per_container: 5000,
      material_component_id: 'matc1h3syfmxen3z5',
      maximum_stock: null,
      updated_at: '2022-05-31T17:37:16.188-07:00',
      container_type: {
        id: 'vendor-tube',
        name: 'Vendor tube',
        sale_price: '0.0'
      },
      deleted_at: null,
      vol_measurement_unit: 'μL',
      volume_per_container: 1000,
      id: 'omatc1h48xdkvkceg8',
      orderable_material_id: 'omat1h48xdkva9uey'
    });

    const inputs = CheckinLogic.newContainer(orderableMaterialComponent);
    expect(inputs.getIn(['mass', 'value'])).to.equal('5000:milligram');
    expect(inputs.getIn(['volume', 'value'])).to.equal('1000:microliter');
    expect(inputs.getIn(['storage_condition', 'value'])).to.equal('cold_4');
    expect(inputs.getIn(['resource_id', 'value'])).to.equal('rs1h3sxt585hm86');
    expect(inputs.getIn(['container_type_id', 'value'])).to.equal('vendor-tube');
    expect(inputs.getIn(['label', 'value'])).to.equal('Container1');
    expect(inputs.getIn(['expires_at', 'value'])).to.equals('2022-10-11T18:30:00.000Z');
  });

  it('should check buildRequestContainers function for normal checkin', () => {
    const containers =
      CheckinLogic.buildRequestContainers(containersMap, 'kit_order_uuid', 'lab_uuid').toJS();
    expect(_.isEqual(containers, expectedContainers)).to.be.true;
  });

  it('should check buildRequestContainers function for bulk checkin', () => {
    const containers =
      CheckinLogic.buildRequestContainers(containersMap, 'kit_order_uuid', 'lab_uuid', true).toJS();
    const expectedContainersForBulkCheckin = [
      {
        container: {
          barcode: 'BA12345',
          container_type_id: 'a1-vial',
          location_id: 'location_uuid',
          lab_id: 'lab_uuid',
          status: 'available',
          label: 'CT One',
          kit_order_id: 'kit_order_uuid',
          storage_condition: 'cold_4',
          orderable_material_component_id: 'omatc1ha8v8gdftapf',
          expires_at: null
        },
        aliquots: [
          {
            well_idx: 0,
            mass_mg: 5,
            volume_ul: 2,
            lot_no: '123',
            resource_id: 'resource_uuid'
          }
        ]

      }
    ];

    expect(_.isEqual(containers, expectedContainersForBulkCheckin)).to.be.true;
  });

  describe('CheckinLogic.validateField', () => {

    it('should have error when mass_per_container is invalid',  () => {
      testMassOrVolumeValidateFieldForInvalid('mass_per_container');
    });

    it('should not have error when mass_per_container is valid',  () => {
      testMassOrVolumeValidateFieldForValid('mass_per_container');
    });

    it('should have error when volume_per_container is invalid',  () => {
      testMassOrVolumeValidateFieldForInvalid('volume_per_container');
    });

    it('should not have error when volume_per_container is valid',  () => {
      testMassOrVolumeValidateFieldForValid('volume_per_container');
    });

    it('should have error when lot_no is invalid',  () => {
      expect(CheckinLogic.validateField('lot_no', '')).to.equal('Must be specified');
    });

    it('should not have error when lot_no is valid',  () => {
      expect(CheckinLogic.validateField('lot_no', 'Lot 1')).to.equal(undefined);
    });

    it('should have error when container_type_id is invalid',  () => {
      expect(CheckinLogic.validateField('container_type_id', '')).to.equal('Must be specified');
    });

    it('should not have error when container_type_id is valid',  () => {
      expect(CheckinLogic.validateField('container_type_id', 'vial-1')).to.equal(undefined);
    });

    it('should call barcode validators', () => {
      const nonEmptyValidatorSpy = sandbox.spy(validators, 'non_empty');
      const barcodeValidatorSpy = sandbox.spy(validators, 'barcode');
      CheckinLogic.validateField('barcode', 'Enz329');
      expect(nonEmptyValidatorSpy.calledOnce).to.equal(true);
      expect(barcodeValidatorSpy.calledOnce).to.equal(true);
    });

    it('should have error when barcode is empty',  () => {
      expect(CheckinLogic.validateField('barcode', '')).to.equal('Must be specified');
    });

    it('should not have error when barcode is valid',  () => {
      expect(CheckinLogic.validateField('barcode', 'barcode123')).to.equal(undefined);
    });

    it('should have error when barcode is invalid',  () => {
      expect(CheckinLogic.validateField('barcode', '#$12%3')).to.equal('Must be valid barcode');
    });

    it('should have error when label is invalid',  () => {
      expect(CheckinLogic.validateField('label', 'With ,/')).to.equal('Character \'/\' not allowed');
      expect(CheckinLogic.validateField('label', 'With ,')).to.equal('Comma not allowed');
    });

    it('should not have error when label is valid', () => {
      expect(CheckinLogic.validateField('label', 'CT 123')).to.equal(undefined);
    });
    it('should not have error when field is invalid', () => {
      expect(CheckinLogic.validateField('name', 'CT 123')).to.equal(undefined);
    });

  });

  describe('CheckinLogic.bulkItemsValidator', () => {
    let containerActionValidateBarcodeStub;
    const massOrVolumeItems = Immutable.fromJS([
      {
        id: 'omatc1',
        material_idx: 0,
        form_idx: 0,
        mass_per_container: { value: '300001', isValid: null },
        volume_per_container: { value: '1', isValid: null },
        container_type: { id: 'vial-1' },
        vol_measurement_unit: 'μL',
        mass_measurement_unit: 'mg',
        name: 'ian-b',
      },
      {
        id: 'omatc2',
        material_idx: 0,
        form_idx: 1,
        mass_per_container: { value: '0', isValid: null },
        volume_per_container: { value: '150000.01', isValid: null },
        container_type: { id: 'vial-1' },
        vol_measurement_unit: 'μL',
        mass_measurement_unit: 'mg',
        name: 'ian-b',
      },
      {
        id: 'omatc3',
        material_idx: 1,
        form_idx: 0,
        mass_per_container: { value: '0', isValid: null },
        volume_per_container: { value: '0', isValid: null },
        container_type: { id: 'vial-1' },
        vol_measurement_unit: 'μL',
        mass_measurement_unit: 'mg',
        name: 'ian-b',
      }
    ]);

    const massVolumeItem = Immutable.fromJS([
      {
        id: 'omatc1',
        material_idx: 0,
        form_idx: 0,
        mass_per_container: { value: '300001', isValid: null },
        volume_per_container: { value: '1', isValid: null },
        container_type: { id: 'vial-1' },
        vol_measurement_unit: 'μL',
        mass_measurement_unit: 'mg',
        name: 'ian-b',
      },
    ]);

    const barcodeItems = Immutable.fromJS([
      {
        id: 'omatc1',
        material_idx: 0,
        form_idx: 0,
        barcode: { value: 'unique1', isValid: null },
        location: { lab_id: 'lab1' },
        name: 'ian-b',
      },
      {
        id: 'omatc2',
        material_idx: 0,
        form_idx: 1,
        barcode: { value: 'not unique', isValid: null },
        location: null,
        lab_id: 'lab2',
        name: 'ian-b',
      }
    ]);

    const invalidItems = Immutable.fromJS([
      {
        id: 'omatc1',
        material_idx: 0,
        form_idx: 0,
        location: { lab_id: 'lab1' },
        name: 'ian-b',
        invalidField: { value: 'abc', isValid: null },
      },
      {
        id: 'omatc2',
        material_idx: 0,
        form_idx: 1,
        location: null,
        lab_id: 'lab2',
        name: 'ian-b',
        invalidField: { value: 'def', isValid: null },
      },
    ]);

    beforeEach(() => {
      containerActionValidateBarcodeStub = sandbox.stub(ContainerActions, 'validateBarcodes')
        .returns({
          done: (cb) => {
            cb([
              { barcode: 'unique1', is_valid: true },
              { barcode: 'not unique', is_valid: false }
            ]);
            return { fail: () => {} };
          }
        });
    });

    afterEach(() => {
      ContainerActions.validateBarcodes.restore();
    });

    it('should validate barcodes', async () => {
      const validatedItems = await CheckinLogic.bulkItemsValidator('barcode')(barcodeItems);
      const expectedArg = [{ barcode: 'unique1', lab_id: 'lab1' }, { barcode: 'not unique', lab_id: 'lab2' }];
      expect(containerActionValidateBarcodeStub.args[0][0].toJS()).to.deep.equal(expectedArg);
      const expectedValidatedItems = barcodeItems
        .setIn(['0', 'barcode', 'isValid'], true)
        .setIn(['1', 'barcode', 'isValid'], false);
      expect(validatedItems.toJS()).to.deep.equal(expectedValidatedItems.toJS());
    });

    it('should validate barcodes using BarcodeValidator', async () => {
      const validatedItems = await CheckinLogic.bulkItemsBarcodeValidator(
        barcodeItems
      );
      const expectedArg = [
        { barcode: 'unique1', lab_id: 'lab1' },
        { barcode: 'not unique', lab_id: 'lab2' },
      ];
      expect(
        containerActionValidateBarcodeStub.args[0][0].toJS()
      ).to.deep.equal(expectedArg);
      const expectedValidatedItems = barcodeItems
        .setIn(['0', 'barcode', 'isValid'], true)
        .setIn(['1', 'barcode', 'isValid'], false);
      expect(validatedItems.toJS()).to.deep.equal(
        expectedValidatedItems.toJS()
      );
    });

    it('should validate mass_per_container', async () => {
      const validatedItems = await CheckinLogic.bulkItemsValidator('mass_per_container')(massOrVolumeItems);
      const expectedValidatedItems = massOrVolumeItems
        .setIn(['0', 'mass_per_container', 'isValid'], false)
        .setIn(['0', 'mass_per_container', 'error'], 'Must be between 0mg and 300000mg')
        .setIn(['1', 'mass_per_container', 'isValid'], true)
        .setIn(['1', 'mass_per_container', 'error'], undefined)
        .setIn(['2', 'mass_per_container', 'isValid'], false)
        .setIn(['2', 'mass_per_container', 'error'], 'Must specify either volume or mass');
      expect(validatedItems.toJS()).to.deep.equal(expectedValidatedItems.toJS());
    });

    it('should validate volume_per_container', async () => {
      const validatedItems = await CheckinLogic.bulkItemsValidator('volume_per_container')(massOrVolumeItems);
      const expectedValidatedItems = massOrVolumeItems
        .setIn(['0', 'volume_per_container', 'isValid'], true)
        .setIn(['0', 'volume_per_container', 'error'], undefined)
        .setIn(['1', 'volume_per_container', 'isValid'], false)
        .setIn(['1', 'volume_per_container', 'error'], 'Must be between 0μL and 150000μL')
        .setIn(['2', 'volume_per_container', 'isValid'], false)
        .setIn(['2', 'volume_per_container', 'error'], 'Must specify either volume or mass');
      expect(validatedItems.toJS()).to.deep.equal(expectedValidatedItems.toJS());
    });

    it('should validate mass_per_container and volume_per_container using volumeMassItemValidator', async () => {
      const validatedItems = await CheckinLogic.volumeMassItemValidator(
        'volume_per_container',
        massVolumeItem);
      const expectedValidatedItems = massVolumeItem
        .setIn('volume_per_container', 'isValid', true)
        .setIn('volume_per_container', 'error', undefined)
        .setIn('mass_per_container', 'error', 'Must be between 0mg and 300000mg')
        .setIn('mass_per_container', 'isValid', false);

      expect(validatedItems.toJS()).to.deep.equal(
        expectedValidatedItems.toJS()
      );
    });

    it('should not show error for bulk validation when given invalid field', async () => {
      const validatedItems = await CheckinLogic.bulkItemsValidator(
        'invalidField')(invalidItems);
      const expectedValidatedItems = invalidItems
        .setIn(['0', 'invalidField', 'error'], undefined)
        .setIn(['0', 'invalidField', 'isValid'], true)
        .setIn(['1', 'invalidField', 'isValid'], true)
        .setIn(['1', 'invalidField', 'error'], undefined);
      expect(validatedItems.toJS()).to.deep.equal(
        expectedValidatedItems.toJS()
      );
    });
  });

});
