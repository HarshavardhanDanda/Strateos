import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import moment from 'moment';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import LocationStore from 'main/stores/LocationStore';
import  * as ContainerTypeUtil from 'main/util/ContainerTypeUtil';
import CheckinLogic from 'main/models/KitCheckinModal/CheckInLogic';
import ResourceStore from 'main/stores/ResourceStore';
import {
  FormField,
  RowColorAndHighlightMap,
  getRowId,
  hasLabAndBarcode,
  isGroupMaterial,
  isGroupMaterialCSVCheckin,
  getInitialForm,
  modalData,
  mapOrderableMaterialToData
} from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinPage/MaterialOrdersCheckinForm/MaterialOrderCheckinFormHelper';

const resource = Immutable.fromJS({
  purity: '100.0',
  organization_id: 'org13',
  name: 'Product',
  kind: 'ChemicalStructure',
  storage_condition: 'cold_4',
  type: 'resources',
  id: 'rs1g9rcfycf2w27',
});

describe('MaterialOrderCheckinFormHelper', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    sandbox.stub(LocationStore, 'getById').withArgs('location-1').returns(Immutable.fromJS({
      id: 'location-1',
      name: 'Location 1'
    }));
    sandbox.stub(ContainerTypeStore, 'getAll').returns([
      Immutable.fromJS({
        id: 'a1-vial'
      })
    ]);
  });

  describe('Individual Material', () => {
    const individualMaterialData = Immutable.fromJS([
      {
        id: 'ko1g9vj24cv2tnv',
        orderable_material: {
          material: {
            id: 'mat1h75mcechpkpd',
            name: 'Product',
            material_type: 'individual',
          },
          orderable_material_components: [
            {
              id: '52c52474-5839-48c8-8ca4-f9c755499151',
              mass_measurement_unit: 'mg',
              vol_measurement_unit: 'μl',
              form: {
                barcode: { value: '12390', isValid: false },
                location: { lab_id: 'lb1fknzm4k8qkq7' },
                label: 'test123',
                lot_no: '42567'
              },
              mass_per_container: 0,
              volume_per_container: 1,
              container_type: {
                id: 'a1-vial',
                name: 'A1 vial',
              },
              material_component: {
                material_id: 'mat1h75mcechpkpd',
                resource_id: 'rs1g9rcfycf2w27',
                id: 'matc1h75mcecw2jyq',
                type: 'material_components',
              },
            },
          ],
          sku: '90840',
        },
      },
      {
        id: 'ko1fudexrdq3xuf',
        orderable_material: {
          material: {
            id: 'mat1h75mcex3jayu',
            name: 'R2C1',
            material_type: 'individual',
          },
          orderable_material_components: [
            {
              id: '2cd3f68d-ffb6-4b0f-9614-3d6dd1cf3b9e',
              mass_measurement_unit: 'mg',
              vol_measurement_unit: 'μl',
              form: {
                barcode: { value: '', isValid: null },
                location: { lab_id: 'lb1fknzm4k8ab7' },
                label: 'check12',
                lot_no: '34890'
              },
              mass_per_container: 0,
              volume_per_container: 1,
              container_type: {
                id: 'a1-vial',
                name: 'A1 vial',
              },
              material_component: {
                material_id: 'mat1h75mcex3jayu',
                resource_id: 'rs1ftmzvgzmfdgk',
                id: 'matc1h75mcexcmw24',
                type: 'material_components',
              },
            },
          ],
          sku: '438721',
        },
      },
    ]);

    it('should return parent row id and the omc row id', () => {
      const [parentRowId, rowId] = getRowId(individualMaterialData, 0, 0);
      expect(parentRowId).to.equal('ko1g9vj24cv2tnv');
      expect(rowId).to.equal('ko1g9vj24cv2tnv');
    });

    it('should return true if material has lab id and barcode', () => {
      const item = individualMaterialData.getIn([0, 'orderable_material', 'orderable_material_components', 0, 'form']);
      expect(hasLabAndBarcode(item)).to.be.true;
    });

    it('should return false if material has no lab id or barcode', () => {
      const item = individualMaterialData.getIn([1, 'orderable_material', 'orderable_material_components', 0, 'form']);
      expect(hasLabAndBarcode(item)).to.be.false;
    });

    it('should return false for individual materials', () => {
      expect(isGroupMaterial(individualMaterialData)).to.be.false;
    });

    it('should return the initial form', () => {
      const omc = individualMaterialData.getIn([0, 'orderable_material', 'orderable_material_components']);
      const expectedInitialForm = Immutable.fromJS({
        barcode: { value: '', isValid: false },
        lot_no: { value: '', isValid: false },
        mass_per_container: { value: undefined, isValid: false },
        label: { value: '', isValid: false },
        location: null,
        storage_condition: { value: 'cold_4', name: '4 °C (± 1 °C)' },
        container_type: undefined,
        volume_per_container: { value: undefined, isValid: false },
        expiration_date: null,
      });

      expect(getInitialForm(omc, resource)).to.deep.equal(expectedInitialForm);
    });

    it('should allow setting initial form values', () => {
      const omc = individualMaterialData.getIn([0, 'orderable_material', 'orderable_material_components']);
      const initialForm = Immutable.fromJS({
        barcode: 'custom barcode',
        lot_no: 'custom lot number',
        mass_per_container: '99',
        label: 'custom label',
        location: 'location-1',
        storage_condition: 'cold_80',
        container_type: 'a1-vial',
        volume_per_container: '11',
        expiration_date: '11/03/2027'
      });

      const generatedInitialForm = getInitialForm(omc, resource, initialForm).toJS();
      expect(generatedInitialForm.barcode.value).to.equal('custom barcode');
      expect(generatedInitialForm.lot_no.value).to.equal('custom lot number');
      expect(generatedInitialForm.mass_per_container.value).to.equal('99');
      expect(generatedInitialForm.label.value).to.equal('custom label');
      expect(generatedInitialForm.location.id).to.equal('location-1');
      expect(generatedInitialForm.storage_condition.value).to.equal('cold_80');
      expect(generatedInitialForm.container_type.id).to.equal('a1-vial');
      expect(generatedInitialForm.volume_per_container.value).to.equal('11');
      expect(generatedInitialForm.expiration_date.toISOString()).to.equal(moment('11/03/2027', 'MM/DD/YYYY').toISOString());
    });

    it('should not include invalid initial form values', () => {
      const omc = individualMaterialData.getIn([0, 'orderable_material', 'orderable_material_components']);
      const initialForm = Immutable.fromJS({
        location: 'non-existing-location-id',
        storage_condition: 'non-existing-storage-condition',
        container_type: 'non-existing-container-type',
        expiration_date: 'invalid-date-format'
      });

      const generatedInitialForm = getInitialForm(omc, resource, initialForm).toJS();
      expect(generatedInitialForm.barcode.value).to.equal('');
      expect(generatedInitialForm.lot_no.value).to.equal('');
      expect(generatedInitialForm.mass_per_container.value).to.equal(undefined);
      expect(generatedInitialForm.label.value).to.equal('');
      expect(generatedInitialForm.location).to.equal(undefined);
      expect(generatedInitialForm.storage_condition).to.equal(null);
      expect(generatedInitialForm.container_type).to.equal(undefined);
      expect(generatedInitialForm.volume_per_container.value).to.equal(undefined);
      expect(generatedInitialForm.expiration_date).to.equal(null);
    });

    it('should return modal data for selected rows', () => {
      const field = { omc: { label: ['form', 'label'] } };
      const selected = Immutable.Map({
        ko1g9vj24cv2tnv: { '82bf9b12-f40d-4802-b3c2-27bba29b6160': true },
      });
      const expanded = {};
      const formData = modalData(field, individualMaterialData, selected, expanded);
      const expectedModalData = Immutable.fromJS([
        {
          id: '52c52474-5839-48c8-8ca4-f9c755499151',
          material_idx: 0,
          form_idx: 0,
          name: 'Product',
          sku: '90840',
          label: 'test123',
        },
      ]);

      expect(formData).to.deep.equal(expectedModalData);
    });

    it('should return modal data for all rows when includeAll is true', () => {
      const field = { omc: { lot_no: ['form', 'lot_no'] } };
      const selected = Immutable.Map({
        ko1g9vj24cv2tnv: { '82bf9b12-f40d-4802-b3c2-27bba29b6160': true },
      });
      const expanded = {};
      const formData = modalData(field, individualMaterialData, selected, expanded, true);
      const expectedModalData = Immutable.fromJS([
        {
          id: '52c52474-5839-48c8-8ca4-f9c755499151',
          material_idx: 0,
          form_idx: 0,
          name: 'Product',
          sku: '90840',
          lot_no: '42567',
        },
        {
          id: '2cd3f68d-ffb6-4b0f-9614-3d6dd1cf3b9e',
          material_idx: 1,
          form_idx: 0,
          name: 'R2C1',
          sku: '438721',
          lot_no: '34890',
        },
      ]);

      expect(formData).to.deep.equal(expectedModalData);
    });
  });

  describe('Group Material', () => {
    const groupMaterialData = Immutable.fromJS([
      {
        id: 'ko1gtpu7d2zu2qw',
        orderable_material: {
          material: {
            id: 'mat1h75mcvjbq4kr',
            name: 'AutomationGroupMaterial',
            material_type: 'group',
          },
          orderable_material_components: [
            {
              id: 'e6a2ed5d-ffa2-4316-8841-a5e5e6cb3177',
              mass_measurement_unit: 'mg',
              vol_measurement_unit: 'μl',
              form: {
                lot_no: '67282',
              },
              mass_per_container: 2,
              volume_per_container: 1,
              container_type: {
                id: 'a1-vial',
                name: 'A1 vial',
              },
              material_component: {
                material_id: 'mat1h75mcvjbq4kr',
                resource_id: 'rs1aqbx7s5fjap',
                id: 'matc1h75mcvjg8w4v',
                type: 'material_components',
              },
              resource: { name: 'Anhydrotetracycline hydrochloride' },
            },
          ],
          sku: '58743',
        },
      },
      {
        id: 'ko1gc3wbpkc76z7',
        orderable_material: {
          material: {
            id: 'mat1h75mcvdqn77p',
            name: 'Grp1',
            material_type: 'group',
          },
          orderable_material_components: [
            {
              id: '9e8a4659-4cbb-4ceb-b79e-6f8e19809b97',
              mass_measurement_unit: 'mg',
              vol_measurement_unit: 'μl',
              form: {
                lot_no: '26781',
              },
              mass_per_container: 0,
              volume_per_container: 1,
              container_type: {
                id: 'a1-vial',
                name: 'A1 vial',
              },
              material_component: {
                id: 'matc1h75mcve7drw4',
                material_id: 'mat1h75mcvdqn77p',
                resource_id: 'rs1ajh4pfmkcbm',
                type: 'material_components',
              },
              resource: { name: '2X Phire Plant Tissue' },
            },
            {
              id: '9f4ab222-9c66-4700-ae72-b04a6761018b',
              mass_measurement_unit: 'mg',
              vol_measurement_unit: 'μl',
              form: {
                lot_no: '56272',
              },
              mass_per_container: 0,
              volume_per_container: 1,
              container_type: {
                id: 'a1-vial',
                name: 'A1 vial',
              },
              material_component: {
                id: 'matc1h75mcve3z6gz',
                material_id: 'mat1h75mcvdqn77p',
                resource_id: 'rs1bhfgeq3kkdv',
                type: 'material_components',
              },
              resource: { name: '1 mM Staurosporine' },
            },
          ],
          sku: '89320',
        },
      },
    ]);

    const groupMaterialCSVData = [
      Immutable.fromJS({
        order: {
          id: 'ko1gtpu7d2zu2qw',
          orderable_material: {
            material: {
              id: 'mat1h75mcvjbq4kr',
              name: 'AutomationGroupMaterial',
              material_type: 'group',
            },
            orderable_material_components: [
              {
                id: 'e6a2ed5d-ffa2-4316-8841-a5e5e6cb3177',
                mass_measurement_unit: 'mg',
                vol_measurement_unit: 'μl',
                form: {
                  lot_no: '67282',
                },
                mass_per_container: 2,
                volume_per_container: 1,
                container_type: {
                  id: 'a1-vial',
                  name: 'A1 vial',
                },
                material_component: {
                  material_id: 'mat1h75mcvjbq4kr',
                  resource_id: 'rs1aqbx7s5fjap',
                  id: 'matc1h75mcvjg8w4v',
                  type: 'material_components',
                },
                resource: { name: 'Anhydrotetracycline hydrochloride' },
              },
            ],
            sku: '58743',
          },
        },
      })
    ];

    it('should return parent row id and the omc row id', () => {
      const [parentRowId, rowId] = getRowId(groupMaterialData, 1, 1);
      expect(parentRowId).to.equal('ko1gc3wbpkc76z7');
      expect(rowId).to.equal('9f4ab222-9c66-4700-ae72-b04a6761018b');
    });

    it('should return true for group materials', () => {
      expect(isGroupMaterial(groupMaterialData)).to.be.true;
    });

    it('should return true for group materials uploaded from csv', () => {
      expect(isGroupMaterialCSVCheckin(groupMaterialCSVData)).to.be.true;
    });

    it('should map orderable material to csv data', () => {
      sandbox.stub(ResourceStore, 'getById').returns(Immutable.fromJS({
        id: 'rs1au65zq3mktnvrxa'
      }));
      const response = {
        data: [
          {
            id: 'omat1au65zy9d2djazjv',
            attribute: {
              margin: 0,
              price: 455.5,
              sku: 'sku 2',
              tier: 'tier 2'
            },
            relationships: {
              material: {
                data: {
                  type: 'materials',
                  id: 'mat1au65zy84jmtf43z'
                }
              },
              orderable_material_components: {
                data: [{
                  id: 'omatc1aupkagx8c6f4hra',
                  type: 'orderable_material_components'
                }]
              }
            }
          }
        ],
        included: [
          {
            id: 'mat1h75mcvjbq4kr',
            relationships: {
              vendor: {
                data: {
                  id: 'vend1au65zvnj795qwmy'
                }
              }
            }
          }
        ]
      };
      expect(mapOrderableMaterialToData(groupMaterialCSVData, response, true).size).to.equal(1);
    });

    it('should return modal data for selected rows', () => {
      const field = { omc: { lot_no: ['form', 'lot_no'] } };
      const selected = Immutable.Map({
        ko1gc3wbpkc76z7: {
          '9e8a4659-4cbb-4ceb-b79e-6f8e19809b97': true,
          '9f4ab222-9c66-4700-ae72-b04a6761018b': false,
        },
      });
      const expanded = Immutable.fromJS({
        ko1gc3wbpkc76z7: true,
      });
      const formData = modalData(field, groupMaterialData, selected, expanded);
      const expectedModalData = Immutable.fromJS([
        {
          id: '9e8a4659-4cbb-4ceb-b79e-6f8e19809b97',
          material_idx: 1,
          form_idx: 0,
          name: '2X Phire Plant Tissue',
          sku: '89320',
          lot_no: '26781',
        },
      ]);

      expect(formData).to.deep.equal(expectedModalData);
    });

    it('should return modal data for all rows when includeAll is true', () => {
      const field = { omc: { lot_no: ['form', 'lot_no'] } };
      const selected = Immutable.Map({
        ko1gc3wbpkc76z7: {
          '9e8a4659-4cbb-4ceb-b79e-6f8e19809b97': true,
          '9f4ab222-9c66-4700-ae72-b04a6761018b': false,
        },
      });
      const expanded = Immutable.fromJS({
        ko1gc3wbpkc76z7: true,
      });
      const formData = modalData(field, groupMaterialData, selected, expanded, true);
      const expectedModalData = Immutable.fromJS([
        {
          id: 'e6a2ed5d-ffa2-4316-8841-a5e5e6cb3177',
          material_idx: 0,
          form_idx: 0,
          name: 'Anhydrotetracycline hydrochloride',
          sku: '58743',
          lot_no: '67282',
        },
        {
          id: '9e8a4659-4cbb-4ceb-b79e-6f8e19809b97',
          material_idx: 1,
          form_idx: 0,
          name: '2X Phire Plant Tissue',
          sku: '89320',
          lot_no: '26781',
        },
        {
          id: '9f4ab222-9c66-4700-ae72-b04a6761018b',
          material_idx: 1,
          form_idx: 1,
          name: '1 mM Staurosporine',
          sku: '89320',
          lot_no: '56272',
        },
      ]);

      expect(formData).to.deep.equal(expectedModalData);
    });
  });

  describe('RowColorAndHighlightMap', () => {
    let rowColorMap;
    let rowHighlightMap;

    beforeEach(() => {
      rowColorMap = {
        row1: 'danger',
        row2: 'danger',
      };
      rowHighlightMap = {
        location: {
          row1: {
            row1: {
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
        container_type_id: {},
        volume_per_container: {
          row2: {
            row2: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must specify either volume or mass',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        mass_per_container: {
          row2: {
            row2: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must specify either volume or mass',
              isInlineEditing: true,
              hasError: true,
            },
            newRow2: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be between 0mg and 3500mg',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        storage_condition: {},
        barcode: {
          row1: {
            row1: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Duplicate barcode',
              isInlineEditing: true,
              hasError: true,
            },
          },
          row2: {
            row2: {
              type: 'success',
              icon: 'fa fa-check',
              iconPlacement: 'right',
              message: undefined,
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
        lot_no: {
          row2: {
            newRow1: {
              type: 'danger',
              icon: 'fa fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be specified',
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
        label: {
          row2: {
            row2: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Comma not allowed',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
      };
    });

    afterEach(() => {
      rowColorMap = {
        row1: 'danger',
        row2: 'danger',
      };
    });

    const omc = Immutable.fromJS({
      id: 'omc1',
      mass_measurement_unit: 'mg',
      vol_measurement_unit: 'μl',
      form: {
        volume_per_container: { value: 100, isValid: null },
        mass_per_container: { value: 0, isValid: null },
        barcode: { value: '1234', isValid: true },
        container_type: {
          id: 'a1-vial',
          name: 'A1 vial',
        },
      },
    });

    it('should set rowColorMap and rowHighlightMap state to danger for setDanger call', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.setDanger(FormField.location, 'Must specify location', 'row3', 'row3');
      rowColorAndHighlightMap.setDanger(FormField.mass_per_container, 'Must be positive', 'row1', 'row1');
      rowColorAndHighlightMap.setDanger(FormField.lot_no, 'Must be specified', 'row1', 'row1');
      rowColorAndHighlightMap.setDanger(FormField.volume_per_container, 'Must be between 0μl and 3500μl', 'row3', 'row3');

      const expectedRowColorMap = { ...rowColorMap, row3: 'danger' };
      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        location: {
          ...rowHighlightMap.location,
          row3: {
            row3: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must specify location',
              isInlineEditing: false,
              hasError: true,
            },
          },
        },
        mass_per_container: {
          ...rowHighlightMap.mass_per_container,
          row1: {
            row1: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be positive',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        lot_no: {
          ...rowHighlightMap.lot_no,
          row1: {
            row1: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be specified',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        volume_per_container: {
          ...rowHighlightMap.volume_per_container,
          row3: {
            row3: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be between 0μl and 3500μl',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(expectedRowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should reset the rowColor and rowHighlightMap state of barcode to success for resetState call with success as true', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.resetState(FormField.barcode, 'row1', 'row1', true);

      const expectedRowColorMap = { ...rowColorMap, row1: undefined };
      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        barcode: {
          ...rowHighlightMap.barcode,
          row1: {
            row1: {
              type: 'success',
              icon: 'fa fa-check',
              iconPlacement: 'right',
              message: undefined,
              isInlineEditing: true,
              hasError: false
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(expectedRowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should reset the rowColor and rowHighlightMap state of barcode for resetState call with success as false', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.resetState(FormField.barcode, 'row1', 'row1');

      const expectedRowColorMap = { ...rowColorMap, row1: undefined };
      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        barcode: {
          ...rowHighlightMap.barcode,
          row1: {
            row1: {
              isInlineEditing: true,
              hasError: false
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(expectedRowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should reset the rowColor and rowHighlightMap state of label for resetState call with success as true', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.resetState(FormField.label, 'row2', 'row2', true);

      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        label: {
          ...rowHighlightMap.label,
          row2: {
            row2: {
              isInlineEditing: true,
              hasError: false
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(rowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should reset the rowColor and rowHighlightMap state of label for resetState call with success as false', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.resetState(FormField.label, 'row2', 'row2');

      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        label: {
          ...rowHighlightMap.label,
          row2: {
            row2: {
              isInlineEditing: true,
              hasError: false
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(rowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should unset errors for a row and remove entire parent row for delete row call having rowId and parentRowId same', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.deleteRow('row1', 'row1');

      const expectedRowColorMap = { row2: 'danger' };
      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        location: {},
        container_type_id: {},
        barcode: {
          row2: {
            row2: {
              type: 'success',
              icon: 'fa fa-check',
              iconPlacement: 'right',
              message: undefined,
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(expectedRowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should unset errors for a row and remove the child row from the parent row for delete row call having rowId and parentRowId different', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      rowColorAndHighlightMap.deleteRow('newRow1', 'row2');
      rowColorAndHighlightMap.deleteRow('newRow2', 'row2');

      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        mass_per_container: {
          row2: {
            row2: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must specify either volume or mass',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        lot_no: {
          row2: {}
        }
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(rowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should validate volume field and set rowColor and rowHighlightMap state', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      const containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'getById');
      sandbox.spy(CheckinLogic, 'validateField');
      sandbox.stub(ContainerTypeUtil, 'getMaxVolume').returns(3500);
      sandbox.stub(ContainerTypeUtil, 'getMaxMass').returns(7000);
      containerTypeStoreStub.withArgs('a1-vial').returns(Immutable.fromJS({ id: 'a1-vial', name: 'a1-vial', well_count: 1, well_volume_ul: '3500' }));
      rowColorAndHighlightMap.validateFieldAndSetState('volume_per_container', '4000', omc, 'row1', 'row1');

      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        volume_per_container: {
          ...rowHighlightMap.volume_per_container,
          row1: {
            row1: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be between 0μl and 3500μl',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        mass_per_container: {
          ...rowHighlightMap.mass_per_container,
          row1: {
            row1: {
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(rowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should validate mass field and set rowColor and rowHighlightMap state', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      const containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'getById');
      sandbox.spy(CheckinLogic, 'validateField');
      sandbox.stub(ContainerTypeUtil, 'getMaxVolume').returns(3500);
      sandbox.stub(ContainerTypeUtil, 'getMaxMass').returns(7000);
      containerTypeStoreStub.withArgs('a1-vial').returns(Immutable.fromJS({ id: 'a1-vial', name: 'a1-vial', well_count: 1, well_volume_ul: '3500' }));
      rowColorAndHighlightMap.validateFieldAndSetState('mass_per_container', '8000', omc, 'row1', 'row1');

      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        mass_per_container: {
          ...rowHighlightMap.mass_per_container,
          row1: {
            row1: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Must be between 0mg and 7000mg',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
        volume_per_container: {
          ...rowHighlightMap.volume_per_container,
          row1: {
            row1: {
              isInlineEditing: true,
              hasError: false,
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(rowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });

    it('should validate label field and set rowColor and rowHighlightMap state', () => {
      const rowColorAndHighlightMap = new RowColorAndHighlightMap(rowColorMap, rowHighlightMap);
      sandbox.spy(CheckinLogic, 'validateField');
      rowColorAndHighlightMap.validateFieldAndSetState('label', 'hello,123', omc, 'row3', 'row3');

      const expectedRowColorMap = { ...rowColorMap, row3: 'danger' };
      const expectedRowHighlightMap = {
        ...rowHighlightMap,
        label: {
          ...rowHighlightMap.label,
          row3: {
            row3: {
              type: 'danger',
              icon: 'far fa-exclamation-circle',
              iconPlacement: 'left',
              message: 'Comma not allowed',
              isInlineEditing: true,
              hasError: true,
            },
          },
        },
      };

      expect(rowColorAndHighlightMap.rowColorMap).to.deep.equal(expectedRowColorMap);
      expect(rowColorAndHighlightMap.rowHighlightMap).to.deep.equal(expectedRowHighlightMap);
    });
  });
});
