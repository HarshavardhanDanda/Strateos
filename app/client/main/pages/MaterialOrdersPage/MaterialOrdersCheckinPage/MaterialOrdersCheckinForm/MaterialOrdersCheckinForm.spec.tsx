import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Immutable from 'immutable';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Button, List, Toggle } from '@transcriptic/amino';

import OrderableMaterialAPI from 'main/api/OrderableMaterialAPI';
import LocationsAPI from 'main/api/LocationsAPI';
import LabAPI from 'main/api/LabAPI.js';
import LabStore from 'main/stores/LabStore';
import LocationStore from 'main/stores/LocationStore';
import OrderableMaterialStore from 'main/stores/OrderableMaterialStore';
import ResourceStore from 'main/stores/ResourceStore';
import VendorStore from 'main/stores/VendorStore';
import CommonUiUtil from 'main/util/CommonUiUtil';
import KitOrderActions from 'main/actions/KitOrderActions';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import ContainerActions from 'main/actions/ContainerActions';
import NotificationActions from 'main/actions/NotificationActions';
import SessionStore from 'main/stores/SessionStore';
import KeyRegistry from 'main/util/UserPreferenceUtil/KeyRegistry';
import { threadBounce } from 'main/util/TestUtil';
import MaterialOrdersCheckinForm from './MaterialOrdersCheckinForm';

describe('MaterialOrdersCheckinForm', () => {
  let sandbox;
  let wrapper;
  let orderableMaterialStub;
  let orderableMaterialIndexStub;
  let bulkCheckinStub;
  let propsWithOutOrders;
  let materialCheckinStub;
  let labStoreStub;
  let labAPIStub;
  let locationAPIStub;
  let confirmWithUserStub;
  const debounceTime = 850;

  const bulkCheckInErrorPromise = ({
    done: () => {
      return { fail: (cb) => cb({
        responseJSON: [{
          id: 'ko1',
          errors: [{ 0: { barcode: ["Validation failed: Barcode '12345' has already been assigned"] } }]
        }]
      }) };
    }
  });

  const bulkCheckInSuccessPromise = ({
    done: (cb) => {
      cb({});
      return { fail: () => ({}) };
    }
  });

  const bulkCheckInMultipleBarcodeErrorPromise = ({
    done: () => {
      return {
        fail: (cb) => cb({
          responseJSON: [
            {
              id: 'ko1',
              errors: [
                {
                  0: {
                    barcode: [
                      "Validation failed: Barcode '12345' has already been assigned"
                    ]
                  }
                }
              ]
            },
            {
              id: 'ko3',
              errors: [
                {
                  0: {
                    barcode: [
                      "Validation failed: Barcode '1234ab567' has already been assigned"
                    ]
                  },
                  1: {
                    barcode: [
                      "Validation failed: Barcode '123dup567' has already been assigned"
                    ]
                  }
                }
              ]
            }
          ]
        })
      };
    }
  });

  const sampleContainerType =  {
    shortname: 'vendor-tube',
    name: 'Vendor tube',
    well_volume_ul: '3500.0',
    well_depth_mm: '0.0',
    col_count: 1,
    is_tube: true,
    type: 'container_types',
    id: 'vendor-tube',
    well_count: 1,
  };

  const childLoc1 = {
    id: 'loc1',
    name: 'Box cell 1',
    parent_id: 'parent-loc',
    location_type: {
      category: 'box_cell'
    },
    row: '0',
    col: '0',
    lab_id: 'lab1'
  };

  const childLoc2 = {
    id: 'loc2',
    name: 'Box cell 2',
    parent_id: 'parent-loc',
    location_type: {
      category: 'box_cell'
    },
    row: '0',
    col: '1',
    lab_id: 'lab1'
  };

  const parentLocation = {
    id: 'parent-loc',
    name: 'Parent Location',
    location_type: {
      category: 'tube_box_rack'
    },
    lab_id: 'lab1',
    children: [childLoc1, childLoc2]
  };
  const orderableMaterialDataForOrders = [{
    id: 'omat1',
    type: 'orderable_materials',
    relationships: {
      material: {
        data: {
          type: 'materials',
          id: 'mat1'
        }
      },
      orderable_material_components: {
        data: [
          {
            type: 'orderable_material_components',
            id: 'omatc1',
            container_type: sampleContainerType
          }
        ]
      }
    }
  },
  {
    id: 'omat2',
    type: 'orderable_materials',
    relationships: {
      material: {
        data: {
          type: 'materials',
          id: 'mat2'
        }
      },
      orderable_material_components: {
        data: [
          {
            type: 'orderable_material_components',
            id: 'omatc2',
            container_type: sampleContainerType
          }
        ]
      }
    }
  }];
  const individualOrderableMaterial1 = Immutable.fromJS({
    id: 'omat1',
    sku: 'sku1',
    material: {
      id: 'mat1',
      name: 'Material 1',
      material_type: 'individual',
    },
    orderable_material_components: [
      {
        id: 'omatc1',
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        volume_per_container: 1,
        container_type: sampleContainerType,
        material_component: {
          material_id: 'mat1',
          resource_id: 'rs1',
          id: 'matc1',
          type: 'material_components'
        }
      }
    ]
  });
  const individualOrderableMaterial2 = Immutable.fromJS({
    id: 'omat2',
    sku: 'sku2',
    material: {
      id: 'mat2',
      name: 'Material 2',
      material_type: 'individual'
    },
    orderable_material_components: [
      {
        id: 'omatc2',
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        volume_per_container: 1,
        container_type: sampleContainerType,
        material_component: {
          material_id: 'mat1',
          resource_id: 'rs1',
          id: 'matc2',
          type: 'material_components'
        }
      }
    ]
  });
  const individualOrderableMaterial3 = Immutable.fromJS({
    id: 'omat3',
    sku: 'sku3',
    material: {
      id: 'mat3',
      name: 'Material 3',
      material_type: 'individual'
    },
    orderable_material_components: [
      {
        id: 'omatc3',
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        volume_per_container: 1,
        container_type: sampleContainerType,
        material_component: {
          material_id: 'mat1',
          resource_id: 'rs1',
          id: 'matc3',
          type: 'material_components'
        }
      }
    ]
  });

  const individualOrderableMaterial4 = Immutable.fromJS({
    id: 'omat4',
    sku: 'sku4',
    material: {
      id: 'mat1',
      name: 'Material 1',
      material_type: 'individual',
    },
    orderable_material_components: [
      {
        id: 'omatc4',
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        volume_per_container: 1,
        container_type: sampleContainerType,
        material_component: {
          material_id: 'mat1',
          resource_id: 'rs1',
          id: 'matc1',
          type: 'material_components',
        },
      },
    ],
  });

  let nestedTable;

  const groupOrderableMaterial1 = Immutable.fromJS({
    id: 'omat3',
    sku: 'sku1',
    tier: 'tier 1',
    material: {
      name: 'Material 3',
      material_type: 'group',
      id: 'mat3'
    },
    orderable_material_components: [
      {
        material_component: {
          material_id: 'mat3',
          resource_id: 'rs1',
          id: 'matc3',
          type: 'material_components'
        },
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        container_type: sampleContainerType,
        type: 'orderable_material_components',
        volume_per_container: 221,
        id: 'omatc3',
        name: 'TestOmc3'
      },
      {
        material_component: {
          material_id: 'mat3',
          resource_id: 'rs1',
          id: 'matc4',
          type: 'material_components'
        },
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        container_type: sampleContainerType,
        type: 'orderable_material_components',
        volume_per_container: 22,
        id: 'omatc4',
        name: 'TestOmc4'
      }
    ]
  });

  const groupOrderableMaterial2 = Immutable.fromJS({
    id: 'omat4',
    sku: 'sku2',
    material: {
      name: 'Material 4',
      material_type: 'group',
      id: 'mat4'
    },
    orderable_material_components: [
      {
        material_component: {
          material_id: 'mat4',
          resource_id: 'rs2',
          id: 'matc5',
          type: 'material_components'
        },
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        container_type: sampleContainerType,
        type: 'orderable_material_components',
        volume_per_container: 22,
        id: 'omatc5',
        name: 'TestOmc5'
      },
      {
        material_component: {
          material_id: 'mat4',
          resource_id: 'rs1',
          id: 'matc6',
          type: 'material_components'
        },
        mass_measurement_unit: 'mg',
        vol_measurement_unit: 'μl',
        mass_per_container: 0,
        container_type: sampleContainerType,
        type: 'orderable_material_components',
        volume_per_container: 22,
        id: 'omatc6'
      }
    ]
  });

  const groupOrderableMaterialData = [{
    id: 'omat3',
    type: 'orderable_materials',
    relationships: {
      material: {
        data: {
          type: 'materials',
          id: 'mat3'
        }
      },
      orderable_material_components: {
        data: [
          {
            type: 'orderable_material_components',
            id: 'omatc3',
            container_type: sampleContainerType
          },
          {
            type: 'orderable_material_components',
            id: 'omatc4',
            container_type: sampleContainerType
          }
        ]
      }
    }
  },
  {
    id: 'omat4',
    type: 'orderable_materials',
    relationships: {
      material: {
        data: {
          type: 'materials',
          id: 'mat4'
        }
      },
      orderable_material_components: {
        data: [
          {
            type: 'orderable_material_components',
            id: 'omatc5',
            container_type: sampleContainerType
          },
          {
            type: 'orderable_material_components',
            id: 'omatc6',
            container_type: sampleContainerType
          }
        ]
      }
    }
  }];

  const createWrapperAndAwaitReady = async (data, otherProps = {}) => {
    const wrapper = mount(
      <Router>
        <MaterialOrdersCheckinForm
          onBulkCheckinSuccess={() => () => {}}
          data={data}
          {...otherProps}
        />
      </Router>
    );
    await threadBounce(2);
    wrapper.update();
    return wrapper;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    confirmWithUserStub = sandbox.stub(CommonUiUtil, 'confirmWithUser');
    const locationStub = sandbox.stub(LocationStore, 'getById');
    sandbox.stub(LocationStore, 'boxDimensions').withArgs('parent-loc').returns({ numRows: 2, numCols: 2 });
    sandbox.stub(LocationStore, 'childrenOf').withArgs('parent-loc').returns(Immutable.fromJS(parentLocation.children));
    locationStub.withArgs('parent-loc').returns(Immutable.fromJS(parentLocation));
    locationStub.withArgs('loc1').returns(Immutable.fromJS(childLoc1));
    locationStub.withArgs('loc2').returns(Immutable.fromJS(childLoc2));
    orderableMaterialStub = sandbox.stub(OrderableMaterialStore, 'getById');
    labStoreStub = sandbox.stub(LabStore, 'getById');
    labStoreStub.withArgs('lab1').returns(Immutable.fromJS({ id: 'lab1', name: 'Lab 1' }));
    labStoreStub.withArgs('lab2').returns(Immutable.fromJS({ id: 'lab2', name: 'Lab 2' }));
    const resourceStub  = sandbox.stub(ResourceStore, 'getById');
    labAPIStub = sandbox.stub(LabAPI, 'getMany').returns({
      done: (cb) => {
        cb({
          data: [{ id: 'lab1', name: 'Lab 1' }, { id: 'lab2', name: 'Lab 2' }]
        });
      }
    });
    locationAPIStub = sandbox.stub(LocationsAPI, 'getMany').returns({
      done: (cb) => {
        cb({
          data: [{ id: 'loc1', name: 'Location 1' }, { id: 'loc2', name: 'Location 2' }]
        });
      }
    });
    resourceStub.withArgs('rs1').returns(Immutable.fromJS({
      created_at: '2021-04-12T16:30:53.304-07:00',
      name: 'TestChemicalResource1',
      storage_condition: 'cold_4',
      updated_at: '2021-04-12T16:30:53.304-07:00',
      deleted_at: null,
      type: 'resources',
      id: 'rs1',
      compound: {
        model: {
          cas_number: 'CAS1'
        }
      }
    }
    ));
    resourceStub.withArgs('rs2').returns(Immutable.fromJS({
      created_at: '2021-04-12T16:30:53.304-07:00',
      name: 'TestChemicalResource2',
      storage_condition: 'cold_4',
      updated_at: '2021-04-12T16:30:53.304-07:00',
      deleted_at: null,
      type: 'resources',
      id: 'rs2',
    }
    ));
    sandbox.stub(VendorStore, 'getById').returns(Immutable.fromJS({
      name: "Bob's chemicals",
      id: 'vend1',
    }));

    const containerTypes = [
      { id: 'a1-vial', name: 'a1-vial', well_count: 1, well_volume_ul: '3500' },
      { id: '50ml-conical', name: '50mL Conical', well_count: 1, well_volume_ul: '50000' },
      { id: 'vendor-tube', name: 'Vendor Tube', well_count: 1, well_volume_ul: '3500' },
      { id: 'pcr-0.5', name: '0.5mL PCR tube', retired_at: '2023-02-22' },
    ];

    const containerTypeStoreStub = sandbox.stub(ContainerTypeStore, 'getById');
    containerTypeStoreStub.withArgs('a1-vial').returns(Immutable.fromJS(containerTypes[0]));
    containerTypeStoreStub.withArgs('50ml-conical').returns(Immutable.fromJS(containerTypes[1]));
    containerTypeStoreStub.withArgs('vendor-tube').returns(Immutable.fromJS(containerTypes[2]));
    containerTypeStoreStub.withArgs('pcr-0.5').returns(Immutable.fromJS(containerTypes[3]));
    sandbox.stub(ContainerTypeStore, 'getAll').returns(Immutable.fromJS(containerTypes));

    bulkCheckinStub = sandbox.stub(KitOrderActions, 'bulkCheckin');

    materialCheckinStub = sandbox.stub(KitOrderActions, 'materialCheckin').returns({
      done: () => {
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
    wrapper.unmount();
  });

  describe('Individual material order', () => {

    beforeEach(async () => {
      orderableMaterialIndexStub = sandbox.stub(OrderableMaterialAPI, 'index').returns({
        data: orderableMaterialDataForOrders,
        included: [
          { id: 'mat1', relationships: { vendor: { data: { id: 'vend1' } } } },
          { id: 'mat2', relationships: { vendor: { data: { id: 'vend2' } } } },
          { id: 'vend1', data: { name: 'Vendor 1' } }
        ],
        meta: {
          record_count: 1
        }
      });
      orderableMaterialStub.withArgs('omat1').returns(individualOrderableMaterial1);
      orderableMaterialStub.withArgs('omat2').returns(individualOrderableMaterial2);
      orderableMaterialStub.withArgs('omat3').returns(individualOrderableMaterial3);
      orderableMaterialStub.withArgs('omat4').returns(individualOrderableMaterial4);
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
      sandbox.stub(CommonUiUtil, 'getUUIDv4').onFirstCall().returns('omatc1').onSecondCall()
        .returns('omatc2')
        .onThirdCall()
        .returns('omatc3')
        .returns('omatc4');
      wrapper = await createWrapperAndAwaitReady(propsWithOrders);
    });

    const orders = [
      {
        id: 'ko1',
        vendor_order_id: 'VO-123',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab1'
      },
      {
        id: 'ko2',
        vendor_order_id: 'VO-122',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab1'
      },
      {
        id: 'ko3',
        vendor_order_id: 'VO-121',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab2'
      },
      {
        id: 'ko4',
        vendor_order_id: 'VO-120',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab2'
      },
    ];

    const propsWithOrders = [
      Immutable.fromJS({
        order: orders[0],
        orderableMaterialId: 'omat1',
      }),
      Immutable.fromJS({
        order: orders[1],
        orderableMaterialId: 'omat2',
      }),
      Immutable.fromJS({
        order: orders[2],
        orderableMaterialId: 'omat3',
        initialForm: {
          location: 'loc1'
        }
      }),
      Immutable.fromJS({
        order: orders[3],
        orderableMaterialId: 'omat4',
        initialForm: {
          location: 'loc2'
        }
      }),
    ];

    const setRequiredFields = (isNonOrder = false, invalidBarcodeData = null) => {
      const barcodeData = Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: '12345', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc2',
          material_idx: 1,
          form_idx: 0,
          barcode: { value: 'ab123456', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc1',
          material_idx: 2,
          form_idx: 0,
          barcode: { value: '1234ab567', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc4',
          material_idx: 3,
          form_idx: 0,
          barcode: { value: '1234ab', isValid: true },
          location: null,
          name: 'ian-b',
        },
      ]);
      const nonOrderBarcodeData = Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: '12345', isValid: true },
          location: null,
          name: 'ian-b',
        },
      ]);
      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      wrapper.update();
      wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc1',
          material_idx: 0,
          form_idx: 0,
          name: 'Material 1',
          sku: 'sku1',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc2',
          material_idx: 1,
          form_idx: 0,
          name: 'Material 2',
          sku: 'sku2',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc3',
          material_idx: 2,
          form_idx: 0,
          name: 'Material 3',
          sku: 'sku3',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc1',
          material_idx: 3,
          form_idx: 0,
          name: 'Material 1',
          sku: 'sku4',
          lot_no: { value: '123', isValid: true }
        }
      ]), 'lot_no');
      wrapper.update();

      if (invalidBarcodeData) {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(invalidBarcodeData, 'barcode');
      } else if (isNonOrder) {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(nonOrderBarcodeData, 'barcode');
      } else {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(barcodeData, 'barcode');
      }
      wrapper.update();

      const barcodes = wrapper.find('BodyCell').find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
      barcodes.forEach(barcode => {
        barcode.props().onBlur();
        wrapper.update();
      });
    };

    it('should load labs', () => {
      assertLabCallSuccess();
    });

    it('should load locations', () => {
      assertLocationCallSuccess();
    });

    it('should show notification if orderable material search call fails', async () => {
      await assertMaterialOrderFailNotification(propsWithOrders);
    });

    it('should have Lab option in the column filter', () => {
      const searchFilterOptions = wrapper.find('SearchFilterOptions');
      expect(searchFilterOptions.props().options[6].queryTerm).to.equal('Lab');
    });

    it('should disable the bulk assign location button when selected orders belongs to different labs', () => {
      const list = wrapper.find('List');
      expect(list.props().selected).to.deep.equal({ ko1: { omatc1: true }, ko2: { omatc2: true }, ko3: { omatc3: true }, ko4: { omatc4: true } });
      const actionMenu = list.find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(true);
    });

    it('should enable bulk assign location button when selected orders belongs to same lab', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });
      const actionMenu = wrapper.find('List').find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(true);
    });

    it('should enable bulk assign location button when selected order is a duplicate', () => {

      // starting expected rows
      let rows = wrapper.find('List').find('Table')
        .find('Body')
        .find('Row');
      expect(rows.length).to.equal(4);

      // deselect all rows
      wrapper.find('List').find('MasterCheckbox').props().deselectAll();
      wrapper.update();

      // Select second row
      wrapper.find('List').find('Checkbox').at(2)
        .props()
        .onChange({ target: { value: 'checked' } });

      // duplicate a row
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');
      wrapper.update();
      rows = wrapper.find('List').find('Table')
        .find('Body')
        .find('Row');
      expect(rows.length).to.equal(5);

      // deselect all rows
      wrapper.find('List').find('MasterCheckbox').props().deselectAll();
      wrapper.update();

      // Select last row
      wrapper.find('List').find('Checkbox').at(5)
        .props()
        .onChange({ target: { value: 'checked' } });
      wrapper.update();

      // final expected
      expect(wrapper.find('List').find('Checkbox').at(5)
        .find('input[type="checkbox"]')
        .props().checked).to.be.true;
      const actionMenu = wrapper.find('List').find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(false);
    });

    it('should validate all barcodes whether they are selected or not', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc2',
              material_idx: 1,
              form_idx: 0,
              barcode: { value: 'ab123456', isValid: true },
              location: null,
              name: 'ian-b',
            },
            {
              id: 'omatc1',
              material_idx: 2,
              form_idx: 0,
              barcode: { value: '1234ab567', isValid: true },
              location: null,
              name: 'ian-b',
            }
          ]), 'barcode'
        );
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(29).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(44).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(59).find('TextInput').props().validated.hasError).to.equal(false);
    });

    it('should enable bulk assign location when orders does not exists', async () => {
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat1'
        })
      ];
      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      expect(wrapper.find('ActionMenu').props().options[0].disabled).to.equal(false);
    });

    it('should sort orders on clicking order-id header', () => {
      const columnName = wrapper.find('HeaderCell').at(1);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      expect(wrapper.find('BodyCell').at(16).text()).to.equal('VO-122');
      expect(wrapper.find('BodyCell').at(31).text()).to.equal('VO-121');
      expect(wrapper.find('BodyCell').at(46).text()).to.equal('VO-120');
      columnName.find('SortableHeader').simulate('click');
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-120');
      expect(wrapper.find('BodyCell').at(16).text()).to.equal('VO-121');
      expect(wrapper.find('BodyCell').at(31).text()).to.equal('VO-122');
      expect(wrapper.find('BodyCell').at(46).text()).to.equal('VO-123');
    });

    it('should render order container data in table', () => {
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      expect(wrapper.find('BodyCell').at(2).text()).to.equal('sku1');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('rs1');
      expect(wrapper.find('BodyCell').at(4).text()).to.equal('CAS1');
      expect(wrapper.find('BodyCell').at(5).text()).to.equal('Material 1');
      expect(wrapper.find('BodyCell').at(6).text()).to.equal('');
      expect(wrapper.find('BodyCell').at(7).text()).to.equal('Vendor tube');
      expect(wrapper.find('BodyCell').at(8).text()).to.equal('');
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Assign location');
      expect(wrapper.find('BodyCell').at(10).text()).to.equal('4 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(11).text()).to.equal('-');
      expect(wrapper.find('BodyCell').at(12).find('TextInput').props().value).to.equal('1');
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().value).to.equal('0');
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('');
    });

    it('should render order container data table with intial values', async () => {
      const ordersWithInitialValues = [
        Immutable.fromJS({
          order: orders[0],
          orderableMaterialId: 'omat1',
          initialForm: {
            label: 'CUSTOM-LABEL',
            container_type: '50ml-conical',
            lot_no: 'CUSTOM-LOT',
            location: 'loc1',
            storage_condition: 'cold_80',
            expiration_date: '12/22/2028',
            volume_per_container: '12',
            mass_per_container: '33',
            barcode: 'CUSTOM-BARCODE'
          }
        })
      ];
      wrapper = await createWrapperAndAwaitReady(ordersWithInitialValues);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      expect(wrapper.find('BodyCell').at(2).text()).to.equal('sku1');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('rs1');
      expect(wrapper.find('BodyCell').at(4).text()).to.equal('CAS1');
      expect(wrapper.find('BodyCell').at(5).text()).to.equal('Material 1');
      expect(wrapper.find('BodyCell').at(6).find('TextInput').props().value).to.equal('CUSTOM-LABEL');
      expect(wrapper.find('BodyCell').at(7).text()).to.equal('50mL Conical');
      expect(wrapper.find('BodyCell').at(8).find('TextInput').props().value).to.equal('CUSTOM-LOT');
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Box cell 1');
      expect(wrapper.find('BodyCell').at(10).text()).to.equal('-80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(11).text()).to.equal('Dec 22, 2028');
      expect(wrapper.find('BodyCell').at(12).find('TextInput').props().value).to.equal('12');
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().value).to.equal('33');
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('CUSTOM-BARCODE');
    });

    it('should reset button disabled prop should remain same on sorting', () => {
      const columnName = wrapper.find('HeaderCell').at(1);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      expect(wrapper.find('ButtonGroup').find('Button').at(0).props().disabled).to.be.true;
      columnName.find('SortableHeader').simulate('click');
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-120');
      expect(wrapper.find('ButtonGroup').find('Button').at(0).props().disabled).to.be.true;
    });

    it('should have all rows selected on initial load', () => {
      expect(wrapper.find('List').props().selected).to.deep.equal({ ko1: { omatc1: true }, ko2: { omatc2: true }, ko3: { omatc3: true }, ko4: { omatc4: true } });
    });

    it('should bulk set container type on selection', () => {
      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));
      expect(wrapper.find('BodyCell').at(7).text()).to.equal('50mL Conical');
      expect(wrapper.find('BodyCell').at(22).text()).to.equal('50mL Conical');
    });

    it('should bulk set storage condition on selection', () => {
      wrapper.find('StorageConditionSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'cold_80',
        name: '–80 °C (± 1 °C)'
      }));
      expect(wrapper.find('BodyCell').at(10).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(25).text()).to.equal('–80 °C (± 1 °C)');
    });

    it('should bulk set expiration date on selection', () => {
      const date = new Date(2032, 10, 12);
      wrapper.find('DateSelectorModal').props().onSelect(date);
      expect(wrapper.find('BodyCell').at(11).text()).to.equal('Nov 12, 2032');
      expect(wrapper.find('BodyCell').at(26).text()).to.equal('Nov 12, 2032');
    });

    it('should bulk set barcode on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              barcode: { value: '12345', isValid: false },
              location: null,
              name: 'ian-b',
            },
          ]), 'barcode'
        );
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('12345');
    });

    it('should not have error for barcode when we bulk set the barcode', () => {
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              barcode: { value: '12345', isValid: true },
              location: null,
              name: 'ian-b',
            },
            {
              id: 'omatc2',
              material_idx: 1,
              form_idx: 0,
              barcode: { value: 'ab123456', isValid: true },
              location: null,
              name: 'ian-b',
            },
            {
              id: 'omatc1',
              material_idx: 2,
              form_idx: 0,
              barcode: { value: '1234ab567', isValid: true },
              location: null,
              name: 'ian-b',
            },
            {
              id: 'omatc4',
              material_idx: 3,
              form_idx: 0,
              barcode: { value: '1234ab', isValid: true },
              location: null,
              name: 'ian-b',
            },
          ]), 'barcode');
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(29).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(44).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(59).find('TextInput').props().validated.hasError).to.equal(false);
    });

    it('should bulk set label on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(1)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc2',
              material_idx: 0,
              form_idx: 0,
              label: { value: 'Container1', isValid: true },
              name: 'ian-b',
            },
            {
              id: 'omatc3',
              material_idx: 1,
              form_idx: 0,
              label: { value: 'Container2', isValid: true },
              name: 'ian-c',
            },
          ]), 'label'
        );
      wrapper.update();
      expect(wrapper.find('BodyCell').at(6).find('TextInput').props().value).to.equal('Container1');
      expect(wrapper.find('BodyCell').at(21).find('TextInput').props().value).to.equal('Container2');
    });

    it('should bulk set lot no on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(4)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc2',
              material_idx: 0,
              form_idx: 0,
              lot_no: { value: '12', isValid: true },
              name: 'ian-b',
            },
            {
              id: 'omatc3',
              material_idx: 1,
              form_idx: 0,
              lot_no: { value: '34', isValid: true },
              name: 'ian-c',
            },
          ]), 'lot_no'
        );
      wrapper.update();
      expect(wrapper.find('BodyCell').at(8).find('TextInput').props().value).to.equal('12');
      expect(wrapper.find('BodyCell').at(23).find('TextInput').props().value).to.equal('34');
    });

    it('should bulk set mass on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(2)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc2',
              material_idx: 0,
              form_idx: 0,
              mass_per_container: { value: '12', isValid: true },
              container_type: sampleContainerType,
              name: 'ian-b',
            },
            {
              id: 'omatc3',
              material_idx: 1,
              form_idx: 0,
              mass_per_container: { value: '13', isValid: true },
              container_type: sampleContainerType,
              name: 'ian-c',
            },
          ]), 'mass_per_container'
        );
      wrapper.update();
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().value).to.equal('12');
      expect(wrapper.find('BodyCell').at(28).find('TextInput').props().value).to.equal('13');
    });

    it('should set volume on inline edit', () => {
      wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: 100 } });
      expect(wrapper.find('BodyCell').at(12).find('TextInput').props().value).to.equal('100');
      expect(wrapper.find('BodyCell').at(27).find('TextInput').props().value).to.equal('1');
    });

    it('should set mass on inline edit', () => {
      wrapper.find('BodyCell').at(13).find('TextInput').props()
        .onChange({ target: { name: 'mass_per_container', value: '100' } });
      wrapper.update();
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().value).to.equal('100');
      expect(wrapper.find('BodyCell').at(28).find('TextInput').props().value).to.equal('0');
    });

    it('should set barcode on inline edit', () => {
      wrapper.find('BodyCell').at(14).find('TextInput').props()
        .onChange({ target: { name: 'barcode', value: '12345' } });
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('12345');
      expect(wrapper.find('BodyCell').at(29).find('TextInput').props().value).to.equal('');
    });

    it('should set lot_no on inline edit', () => {
      wrapper.find('BodyCell').at(8).find('TextInput').props()
        .onChange({ target: { name: 'lot_no', value: 'Container1' } });
      wrapper.update();
      expect(wrapper.find('BodyCell').at(8).find('TextInput').props().value).to.equal('Container1');
      expect(wrapper.find('BodyCell').at(23).find('TextInput').props().value).to.equal('');

    });

    it('should bulk set location from single selected location', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Box cell 1');
      expect(wrapper.find('BodyCell').at(24).text()).to.equal('Box cell 1');
    });

    it('should bulk set location from multiple selected location', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations([Immutable.fromJS({ id: 'loc1' }), Immutable.fromJS({ id: 'loc2' })]);
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Box cell 1');
      expect(wrapper.find('BodyCell').at(24).text()).to.equal('Box cell 2');
    });

    it('should require selected location(s) to have room for one container per item in selection', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });
      wrapper.update();
      expect(wrapper.find('LocationAssignmentModal').props().containersCount).to.equal(2);
    });

    it('should prohibit re-selection of locations that already have been selected', () => {
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations([Immutable.fromJS({ id: 'loc1' }), Immutable.fromJS({ id: 'loc2' })]);
      wrapper.find('List').props().onSelectRow(null, null, { ko2: true });
      wrapper.update();
      expect(wrapper.find('LocationAssignmentModal').props().prohibitedLocations.toJS()).to.deep.equal(['loc1']);
    });

    it('should set single location in appropriate order from assign location button', () => {
      wrapper.find('Button').at(4).props().onClick();
      wrapper.update();
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Box cell 1');
      expect(wrapper.find('BodyCell').at(24).text()).to.equal('Assign location');
    });

    it('should render action buttons', () => {
      const buttons = wrapper.find('ButtonGroup').find('Button');
      expect(buttons.length).to.equal(2);
      expect(buttons.at(0).text()).to.equal('Reset');
      expect(buttons.at(0).props().type).to.equal('secondary');
      expect(buttons.at(1).text()).to.equal('Checkin');
      expect(buttons.at(1).props().type).to.equal('primary');

      expect(buttons.at(0).props().disabled).to.be.true;
    });

    it('should enable reset button if form data changes and on click should reset all changes', () => {
      confirmWithUserStub.returns(true);
      wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc1',
          material_idx: 0,
          form_idx: 0,
          name: 'Material 1',
          sku: 'sku1',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc2',
          material_idx: 1,
          form_idx: 0,
          name: 'Material 2',
          sku: 'sku2',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc3',
          material_idx: 2,
          form_idx: 0,
          name: 'Material 3',
          sku: 'sku3',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc1',
          material_idx: 3,
          form_idx: 0,
          name: 'Material 1',
          sku: 'sku4',
          lot_no: { value: '123', isValid: true }
        }
      ]), 'lot_no');

      wrapper.update();
      expect(wrapper.find('BodyCell').at(8).find('TextInput').props().value).to.equal('123');
      expect(wrapper.find('ButtonGroup').find('Button').at(0).props().disabled).to.be.false;

      wrapper.find('ButtonGroup').find('Button').at(0).props()
        .onClick();
      wrapper.update();
      expect(wrapper.find('BodyCell').at(8).find('TextInput').props().value).to.equal('');
      expect(wrapper.find('BodyCell').at(8).text()).to.equal('');
      expect(wrapper.find('ButtonGroup').find('Button').at(0).props().disabled).to.be.true;
    });

    it('should render order container data in table when order does not exist', async () => {
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat1'
        })
      ];
      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('-');
      expect(wrapper.find('BodyCell').at(2).text()).to.equal('sku1');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('rs1');
      expect(wrapper.find('BodyCell').at(4).text()).to.equal('CAS1');
      expect(wrapper.find('BodyCell').at(5).text()).to.equal('Material 1');
      expect(wrapper.find('BodyCell').at(6).text()).to.equal('');
      expect(wrapper.find('BodyCell').at(7).text()).to.equal('Vendor tube');
      expect(wrapper.find('BodyCell').at(8).text()).to.equal('');
      expect(wrapper.find('BodyCell').at(9).text()).to.equal('Assign location');
      expect(wrapper.find('BodyCell').at(10).text()).to.equal('4 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(11).text()).to.equal('-');
      expect(wrapper.find('BodyCell').at(12).find('TextInput').props().value).to.equal('1');
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().value).to.equal('0');
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('');
    });

    it('should render individual materials list and have persistence key info to enable user preference', () => {
      const list = wrapper.find('List');
      expect(list.props().id).to.equal(KeyRegistry.MATERIAL_ORDERS_INDIVIDUAL_CHECKIN_FORM_TABLE);
      expect(list.props().persistKeyInfo).to.be.deep.equal({
        appName: 'Web',
        orgId: 'org13',
        userId: 'user3202',
        key: KeyRegistry.MATERIAL_ORDERS_INDIVIDUAL_CHECKIN_FORM_TABLE
      });
    });

    it('should duplicate selected rows but not duplicate the barcode', () => {
      // Adding barcode to first 2 rows
      wrapper.find('BodyCell').at(14).find('TextInput').simulate('change', { target: { name: 'barcode', value: '10' } });
      wrapper.find('BodyCell').at(29).find('TextInput').simulate('change', { target: { name: 'barcode', value: '12' } });
      // Selecting first 2 rows
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });

      expect(wrapper.find('BodyCell').length).to.equal(60);

      // Adding storage condition to first 2 rows
      wrapper.find('StorageConditionSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'cold_80',
        name: '–80 °C (± 1 °C)'
      }));

      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');

      expect(wrapper.find('BodyCell').length).to.equal(90);

      // Barcode validation
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().value).to.equal('10');
      expect(wrapper.find('BodyCell').at(29).find('TextInput').props().value).to.equal('12');
      expect(wrapper.find('BodyCell').at(59).find('TextInput').props().value).to.equal('');
      expect(wrapper.find('BodyCell').at(74).find('TextInput').props().value).to.equal('');

      // Storage condition validation (Non-barcode field should get populated)
      expect(wrapper.find('BodyCell').at(10).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(25).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(40).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(55).text()).to.equal('–80 °C (± 1 °C)');
    });

    it('should assign the next available location for box_cells when a row is duplicated', () => {
      wrapper.find('List').props().onSelectRow(null, null, { ko1: true });
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');

      expect(wrapper.find('BodyCell').at(69).find('p').text()).to.equal('Box cell 2');
    });

    it('should delete selected rows', () => {
      confirmWithUserStub.returns(true);
      // Total expected rows
      expect(wrapper.find('Body').find('Row').length).to.equal(4);

      // Select one row
      wrapper.find('List').props().onSelectRow(null, null, { ko2: true });

      // Click delete action button
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(7).simulate('click');

      // Check expected rows left
      expect(wrapper.find('Body').find('Row').length).to.equal(3);
      expect(wrapper.find('Body').find('Row').at(0).find('BodyCell')
        .at(5) // Name column
        .find('p')
        .text()).to.equal('Material 1');
      expect(wrapper.find('Body').find('Row').at(1).find('BodyCell')
        .at(5) // Name column
        .find('p')
        .text()).to.equal('Material 3');
    });

    it('should not delete row(s) if operator didnt confirm delete', () => {
      expect(wrapper.find('Body').find('Row').length).to.equal(4);
      confirmWithUserStub.returns(false);
      wrapper.find('List').props().onSelectRow(null, null, { ko2: true });
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(7).simulate('click');
      expect(wrapper.find('Body').find('Row').length).to.equal(4);
    });

    it('should bulk checkin for non-order individual materials', async () => {
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat3'
        })
      ];
      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      wrapper.find('MultiRowEditorModal').at(0).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          barcode: { value: 'BA123', isValid: true }
        }
      ]), 'barcode');

      await wrapper.update();

      wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          lot_no: { value: '123', isValid: true }
        }
      ]), 'lot_no');

      await wrapper.update();
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      await wrapper.update();
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');

      expect(materialCheckinStub.calledOnce).to.be.true;
    });

    it('should show an alert (prompt when navigating away) when there are unsaved changes for Individual materials', () => {
      // When prop of prompt is true it stops from navigating away from current page
      expect(wrapper.find('Prompt').props().when).to.be.false;
      wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc1',
          material_idx: 0,
          form_idx: 0,
          name: 'Material 1',
          sku: 'sku1',
          lot_no: { value: null, isValid: false }
        }]));
      wrapper.update();
      expect(wrapper.find('Prompt').props().when).to.be.true;
    });

    it('should not show alert (prompt when navigating away) after check in form is submitted successfully for individual materials', () => {
      // When prop of prompt is true it stops from navigating away from current page
      bulkCheckinStub.returns(bulkCheckInSuccessPromise);
      expect(wrapper.find('Prompt').props().when).to.be.false;
      setRequiredFields();
      expect(wrapper.find('Prompt').props().when).to.be.true;
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(bulkCheckinStub.calledOnce).to.be.true;
      expect(wrapper.find('Prompt').props().when).to.be.false;
    });

    it('should show alert (prompt when navigating away) after check in form submission fails for individual materials', () => {
      // When prop of prompt is true it stops from navigating away from current page
      bulkCheckinStub.returns(bulkCheckInErrorPromise);
      expect(wrapper.find('Prompt').props().when).to.be.false;
      setRequiredFields();
      expect(wrapper.find('Prompt').props().when).to.be.true;
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(bulkCheckinStub.calledOnce).to.be.true;
      expect(wrapper.find('Prompt').props().when).to.be.true;
    });

    it('should bulk checkin orders with barcode selector modal inputs', () => {
      bulkCheckinStub.returns(bulkCheckInSuccessPromise);
      setRequiredFields();

      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');

      expect(bulkCheckinStub.calledOnce).to.be.true;
    });

    it('should show barcode validation error on the rows after check in form submission fails for individual materials', () => {
      bulkCheckinStub.returns(bulkCheckInMultipleBarcodeErrorPromise);
      setRequiredFields();
      wrapper.find('List').props().onSelectRow(null, null, { ko3: true });

      // click duplicate row
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');
      wrapper.update();
      let rows = wrapper.find('List').find('Table')
        .find('Body')
        .find('Row');

      // add barcode
      rows.at(4).find('BodyCell').last().find('TextInput')
        .simulate('change', { target: { name: 'barcode', value: '123dup567' } });
      wrapper.update();
      // click bulk check in button
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(bulkCheckinStub.calledOnce).to.be.true;

      rows = wrapper.find('List').find('Table')
        .find('Body')
        .find('Row');

      expect(rows.at(0).find('BodyCell').last()
        .props().highlight).to.equal('danger');
      expect(rows.at(0).find('BodyCell').last()
        .find('Tooltip')
        .props().title).to.contain('12345');
      expect(rows.at(0).find('BodyCell').last()
        .find('Tooltip')
        .props().highlight).to.equal('danger');
      expect(rows.at(2).find('BodyCell').last()
        .props().highlight).to.equal('danger');
      expect(rows.at(2).find('BodyCell').last()
        .find('Tooltip')
        .props().title).to.contain('1234ab567');
      expect(rows.at(2).find('BodyCell').last()
        .find('Tooltip')
        .props().highlight).to.equal('danger');
      expect(rows.at(4).find('BodyCell').last()
        .props().highlight).to.equal('danger');
      expect(rows.at(4).find('BodyCell').last()
        .find('Tooltip')
        .props().title).to.contain('123dup567');
      expect(rows.at(4).find('BodyCell').last()
        .find('Tooltip')
        .props().highlight).to.equal('danger');

      expect(rows.at(1).find('BodyCell').last()
        .props().highlight).to.equal('success');
      expect(rows.at(3).find('BodyCell').last()
        .props().highlight).to.equal('success');
      expect(rows.at(1).find('BodyCell').last()
        .find('Tooltip').length).to.equal(0);
      expect(rows.at(3).find('BodyCell').last()
        .find('Tooltip').length).to.equal(0);
    });

    it('should enable checkin button by default', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.equal(false);
    });

    it('should enable checkin button if required fields are present', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.equal(false);
    });

    it('should disable checkin button if barcode is invalid', () => {
      setRequiredFields();
      wrapper.find('BodyCell').at(14).find('TextInput').props()
        .onChange({ target: { name: 'barcode', value: '' } });
      wrapper.update();

      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
    });

    it('should show error icon if barcode text is invalid', () => {
      wrapper.find('BodyCell').at(14).find('TextInput').props()
        .onChange({ target: { name: 'barcode', value: 'gf##%*' } });
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).props().highlight).to.equal('danger');
      expect(wrapper.find('BodyCell').at(14).find('Icon').at(0)
        .props().icon).to.equal('far fa-exclamation-circle');
      wrapper.find('BodyCell').at(14).find('TextInput')
        .props()
        .onBlur();
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).find('Tooltip').at(0)
        .props().title).to.equal('Must be valid barcode');
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
    });

    it('should enable checkin button if barcode is valid', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;
    });

    it('should not show error icon if barcode text is valid', () => {
      wrapper.find('BodyCell').at(14).find('TextInput').props()
        .onChange({ target: { name: 'barcode', value: 'ABC' } });
      wrapper.update();
      expect(wrapper.find('BodyCell').at(14).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(14).find('Icon').length).to.equal(0);
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;
    });

    it('should not have error if volume and mass are valid for the new container type', () => {
      wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: 4000 } });
      wrapper.find('BodyCell').at(13).find('TextInput').simulate('change', { target: { value: 7001 } });

      expect(wrapper.find('BodyCell').at(12).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0μl and 3500μl');
      expect(wrapper.find('BodyCell').at(13).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0mg and 7000mg');

      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));
      wrapper.update();
      expect(wrapper.find('BodyCell').at(12).find('TextInput').props().validated.hasError).to.equal(false);
      expect(wrapper.find('BodyCell').at(13).find('TextInput').props().validated.hasError).to.equal(false);
    });

    it('should have error if volume and mass are invalid for the new container type', () => {
      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));

      wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '50001' } });
      wrapper.find('BodyCell').at(13).find('TextInput').simulate('change', { target: { value: '100001' } });
      wrapper.update();

      expect(wrapper.find('BodyCell').at(12).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0μl and 50000μl');
      expect(wrapper.find('BodyCell').at(13).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0mg and 100000mg');

      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'a1-vial',
        name: 'A1 vial'
      }));

      wrapper.update();
      expect(wrapper.find('BodyCell').at(12).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0μl and 3500μl');
      expect(wrapper.find('BodyCell').at(13).find('Tooltip').at(0)
        .props().title).to.equal('Must be between 0mg and 7000mg');
    });

    it('should allow rendering of custom button', async () => {
      const backButton = <Button>Back</Button>;
      wrapper = await createWrapperAndAwaitReady(propsWithOrders, { backButton: backButton });
      expect(wrapper.find('button').filterWhere(button => button.text() === 'Back').length).to.equal(1);
      expect(wrapper.find('button').filterWhere(button => button.text() === 'Reset').length).to.equal(1);
    });
  });

  describe('Group material order', () => {

    const orders = [
      {
        id: 'ko1',
        vendor_order_id: 'VO-123',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab1'
      },
      {
        id: 'ko2',
        vendor_order_id: 'VO-122',
        created_at: '2021-04-12T16:30:53.304-07:00',
        lab_id: 'lab2'
      }
    ];

    const propsWithOrders = [
      Immutable.fromJS({
        order: orders[0],
        orderableMaterialId: 'omat3',
        labId: 'lab1'
      }),
      Immutable.fromJS({
        order: orders[1],
        orderableMaterialId: 'omat4',
        labId: 'lab2'
      }),
    ];

    const getNestedTable = () => (
      wrapper.find('Row').at(2).find('Table')
    );

    beforeEach(async () => {
      orderableMaterialIndexStub = sandbox.stub(OrderableMaterialAPI, 'index').returns({
        data: groupOrderableMaterialData,
        included: [
          { id: 'mat3', relationships: { vendor: { data: { id: 'vend1' } } } },
          { id: 'mat4', relationships: { vendor: { data: { id: 'vend1' } } } },
          { id: 'vend1', data: { name: 'Vendor 1' } }
        ],
        meta: {
          record_count: 1
        }
      });
      orderableMaterialStub.withArgs('omat3').returns(groupOrderableMaterial1);
      orderableMaterialStub.withArgs('omat4').returns(groupOrderableMaterial2);
      sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
      sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
      sandbox.stub(CommonUiUtil, 'getUUIDv4').onFirstCall().returns('omatc3').onSecondCall()
        .returns('omatc4')
        .onThirdCall()
        .returns('omatc5')
        .returns('omatc6');
      wrapper = await createWrapperAndAwaitReady(propsWithOrders);
      wrapper.find('Row').at(1).find('Icon').props() // expand first row
        .onClick();
      wrapper.find('Row').at(2).find('Icon').props() // expand second row
        .onClick();
      await wrapper.update();
      nestedTable = getNestedTable();
    });

    const setGroupRequiredFields = (isNonOrder = false, invalidBarcodeData = null) => {
      const validBarcodeData = Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: 'unique1', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc4',
          material_idx: 0,
          form_idx: 1,
          barcode: { value: 'unique2', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc5',
          material_idx: 1,
          form_idx: 0,
          barcode: { value: 'unique3', isValid: true },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc6',
          material_idx: 1,
          form_idx: 1,
          barcode: { value: 'unique4', isValid: true },
          location: null,
          name: 'ian-b',
        },
      ]);

      const nonOrderBarcodeData = Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          barcode: { value: 'unique1', isValid: false },
          location: null,
          name: 'ian-b',
        },
        {
          id: 'omatc4',
          material_idx: 0,
          form_idx: 1,
          barcode: { value: 'unique2', isValid: false },
          location: null,
          name: 'ian-b',
        },
      ]);

      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      wrapper.update();
      wrapper
        .find('MultiRowEditorModal').at(4)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              name: 'TestChemicalResource1',
              sku: 'sku1',
              lot_no: { value: '123', isValid: true }
            },
            {
              id: 'omatc4',
              material_idx: 0,
              form_idx: 1,
              name: 'TestChemicalResource1',
              sku: 'sku1',
              lot_no: { value: '123', isValid: true }
            },
            {
              id: 'omatc5',
              material_idx: 1,
              form_idx: 0,
              name: 'TestChemicalResource2',
              sku: 'sku2',
              lot_no: { value: '123', isValid: true }
            },
            {
              id: 'omatc6',
              material_idx: 1,
              form_idx: 1,
              name: 'TestChemicalResource1',
              sku: 'sku2',
              lot_no: { value: '123', isValid: true }
            }
          ]), 'lot_no');
      wrapper.update();
      if (invalidBarcodeData) {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(invalidBarcodeData, 'barcode');
      } else if (isNonOrder) {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(nonOrderBarcodeData, 'barcode');
      } else {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(validBarcodeData, 'barcode');
      }

      nestedTable.update();
      wrapper.update();

      const barcodes = wrapper.find('BodyCell').find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
      barcodes.forEach(barcode => {
        barcode.props().onBlur();
        wrapper.update();
      });
    };

    it('should load labs', () => {
      assertLabCallSuccess();
    });

    it('should show notification if orderable material search call fails', async () => {
      await assertMaterialOrderFailNotification(propsWithOrders);
    });

    it('should have Lab option in the column filter', () => {
      const searchFilterOptions = wrapper.find('SearchFilterOptions');
      expect(searchFilterOptions.props().options[3].queryTerm).to.equal('Lab');
    });

    it('should render group materials list and have persistence key info to enable user preference', () => {
      const list = wrapper.find('List');
      expect(list.props().id).to.equal(KeyRegistry.MATERIAL_ORDERS_GROUP_CHECKIN_FORM_TABLE);
      expect(list.props().persistKeyInfo).to.be.deep.equal({
        appName: 'Web',
        orgId: 'org13',
        userId: 'user3202',
        key: KeyRegistry.MATERIAL_ORDERS_GROUP_CHECKIN_FORM_TABLE
      });
    });

    it('should disable the bulk assign location button when selected orders belongs to different labs', () => {
      const list = wrapper.find('List');
      expect(list.props().selected).to.deep.equal({ ko1: true, ko2: true });
      const actionMenu = list.find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(true);
    });

    it('should enable bulk assign location button when selected orders belongs to same labs', () => {
      wrapper.find('List').props().onExpandRow(null, null, { ko1: true });
      wrapper.update();
      const actionMenu = wrapper.find('List').find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(false);
    });

    it('should enable bulk assign location button when a kitOrder from one lab is selected and the kitOrder' +
    'from a different lab is expanded but not selected', () => {
      wrapper.find('List').props().onExpandRow(null, null, { ko1: true });
      wrapper.find('Table').at(1).props().onSelectRow(null, null, { omatc5: true, omatc6: true });
      wrapper.update();
      const actionMenu = wrapper.find('List').find('ActionMenu');
      expect(actionMenu.props().options[0].disabled).to.equal(false);
    });

    it('should enable bulk assign location when orders does not exists', async () => {
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat3'
        })
      ];
      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      wrapper.find('BodyCell').at(0).find('Icon').simulate('click');
      expect(wrapper.find('ActionMenu').props().options[0].disabled).to.equal(false);
    });

    it('should sort orders on clicking order-id header', () => {
      const columnName = wrapper.find('HeaderCell').at(1);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      columnName.find('SortableHeader').simulate('click');
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-122');
    });

    it('should sort omcs of a group material on clicking its name header', () => {
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('Material 3');
      expect(wrapper.find('BodyCell').at(45).text()).to.equal('TestOmc5');
      expect(wrapper.find('BodyCell').at(58).text()).to.equal('TestChemicalResource1');
      wrapper.find('HeaderCell').at(23).find('SortableHeader').simulate('click');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('Material 3');
      expect(wrapper.find('BodyCell').at(45).text()).to.equal('TestChemicalResource1');
      expect(wrapper.find('BodyCell').at(58).text()).to.equal('TestOmc5');
    });

    it('should reset button disabled prop should remain same on sorting', () => {
      expect(wrapper.find('BodyCell').at(45).text()).to.equal('TestOmc5');
      wrapper.find('HeaderCell').at(23).find('SortableHeader').simulate('click');
      expect(wrapper.find('BodyCell').at(45).text()).to.equal('TestChemicalResource1');
      expect(wrapper.find('ButtonGroup').find('Button').at(0).props().disabled).to.be.true;
    });

    it('should display corresponding resource name in the nested table when omc name is empty (or) null', () => {
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('Material 3');
      expect(wrapper.find('BodyCell').at(45).text()).to.equal('TestOmc5');
      // Omc name is null
      expect(wrapper.find('BodyCell').at(58).text()).to.equal('TestChemicalResource1');
    });

    it('should render order container data in table', () => {
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('VO-123');
      expect(wrapper.find('BodyCell').at(2).text()).to.equal('sku1');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('Material 3');
      expect(wrapper.find('BodyCell').at(4).text()).to.equal('Group');
      expect(wrapper.find('BodyCell').at(5).text()).to.equal("Bob's chemicals");
      expect(wrapper.find('BodyCell').at(6).text()).to.equal('Apr 12, 2021');
      expect(nestedTable.find('BodyCell').at(1).text()).to.equal('rs1');
      expect(nestedTable.find('BodyCell').at(2).text()).to.equal('CAS1');
      expect(nestedTable.find('BodyCell').at(3).text()).to.equal('TestOmc3');
      expect(nestedTable.find('BodyCell').at(4).text()).to.equal('');
      expect(nestedTable.find('BodyCell').at(5).text()).to.equal('Vendor tube');
      expect(nestedTable.find('BodyCell').at(6).text()).to.equal('');
      expect(nestedTable.find('BodyCell').at(7).text()).to.equal('Assign location');
      expect(nestedTable.find('BodyCell').at(8).text()).to.equal('4 °C (± 1 °C)');
      expect(nestedTable.find('BodyCell').at(9).text()).to.equal('-');
      expect(nestedTable.find('BodyCell').at(10).find('TextInput').props().value).to.equal('221');
      expect(nestedTable.find('BodyCell').at(11).find('TextInput').props().value).to.equal('0');
      expect(nestedTable.find('BodyCell').at(12).find('TextInput').props().value).to.equal('');
    });

    it('should render order container data in table when order does not exist', async () => {
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat3'
        })
      ];
      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      expect(wrapper.find('BodyCell').at(1).text()).to.equal('-');
      expect(wrapper.find('BodyCell').at(2).text()).to.equal('sku1');
      expect(wrapper.find('BodyCell').at(3).text()).to.equal('Material 3');
      expect(wrapper.find('BodyCell').at(4).text()).to.equal('Group');
      expect(wrapper.find('BodyCell').at(5).text()).to.equal("Bob's chemicals");
      expect(wrapper.find('BodyCell').at(6).text()).to.equal('-');
      expect(nestedTable.find('BodyCell').at(1).text()).to.equal('rs1');
      expect(nestedTable.find('BodyCell').at(2).text()).to.equal('CAS1');
      expect(nestedTable.find('BodyCell').at(3).text()).to.equal('TestOmc3');
      expect(nestedTable.find('BodyCell').at(4).text()).to.equal('');
      expect(nestedTable.find('BodyCell').at(5).text()).to.equal('Vendor tube');
      expect(nestedTable.find('BodyCell').at(6).text()).to.equal('');
      expect(nestedTable.find('BodyCell').at(7).text()).to.equal('Assign location');
      expect(nestedTable.find('BodyCell').at(8).text()).to.equal('4 °C (± 1 °C)');
      expect(nestedTable.find('BodyCell').at(9).text()).to.equal('-');
      expect(nestedTable.find('BodyCell').at(10).find('TextInput').props().value).to.equal('221');
      expect(nestedTable.find('BodyCell').at(11).find('TextInput').props().value).to.equal('0');
      expect(nestedTable.find('BodyCell').at(12).find('TextInput').props().value).to.equal('');
    });

    it('should have all rows selected on expand of row', () => {
      expect(wrapper.find('List').props().selected).to.deep.equal({ ko1: true, ko2: true });
    });

    it('should maintain user selection when expanding collapsed row', () => {
      nestedTable.props().onSelectRow(null, null, { omatc4: true });
      wrapper.find('List').props().onExpandRow(null, null, { ko1: true });
      wrapper.update();
      expect(getNestedTable().props().selected).to.deep.equal({ omatc4: true });
    });

    it('should bulk set container type on selection', () => {
      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));
      expect(nestedTable.find('BodyCell').at(5).text()).to.equal('50mL Conical');
      expect(nestedTable.find('BodyCell').at(18).text()).to.equal('50mL Conical');
    });

    it('should bulk set storage condition on selection', () => {
      wrapper.find('StorageConditionSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'cold_80',
        name: '–80 °C (± 1 °C)'
      }));
      expect(nestedTable.find('BodyCell').at(8).text()).to.equal('–80 °C (± 1 °C)');
      expect(nestedTable.find('BodyCell').at(21).text()).to.equal('–80 °C (± 1 °C)');
    });

    it('should bulk set expiration date on selection', () => {
      const date = new Date(2032, 10, 12);
      wrapper.find('DateSelectorModal').props().onSelect(date);
      expect(nestedTable.find('BodyCell').at(9).text()).to.equal('Nov 12, 2032');
      expect(nestedTable.find('BodyCell').at(22).text()).to.equal('Nov 12, 2032');
    });

    it('should bulk set barcode on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              barcode: { value: '12345', isValid: false },
              location: null,
              name: 'ian-b',
            },
            {
              id: 'omatc4',
              material_idx: 0,
              form_idx: 1,
              barcode: { value: '123456', isValid: false },
              location: null,
              name: 'ian-b',
            },
          ]), 'barcode'
        );
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
        .props().value).to.equal('12345');
      expect(getNestedTable().find('BodyCell').at(25).find('TextInput')
        .props().value).to.equal('123456');
    });

    it('should bulk set label on selection', () => {
      wrapper
        .find('MultiRowEditorModal').at(1)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              label: { value: 'Container1', isValid: true },
              name: 'ian-b',
            },
            {
              id: 'omatc4',
              material_idx: 0,
              form_idx: 1,
              label: { value: 'Container2', isValid: true },
              name: 'ian-b',
            },
          ]), 'label'
        );
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(4).find('TextInput')
        .props().value).to.equal('Container1');
      expect(getNestedTable().find('BodyCell').at(17).find('TextInput')
        .props().value).to.equal('Container2');
    });

    it('should set volume on inline edit', () => {
      nestedTable.find('BodyCell').at(10).find('TextInput').props()
        .onChange({ target: { value: '100' } });
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(10).find('TextInput')
        .props().value).to.equal('100');
      expect(getNestedTable().find('BodyCell').at(23).find('TextInput')
        .props().value).to.equal('22');
    });

    it('should set mass on inline edit', () => {
      nestedTable.find('BodyCell').at(11).find('TextInput').props()
        .onChange({ target: { value: '100' } });
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(11).find('TextInput')
        .props().value).to.equal('100');
      expect(getNestedTable().find('BodyCell').at(24).find('TextInput')
        .props().value).to.equal('0');
    });

    it('should set barcode on inline edit', () => {
      nestedTable.find('BodyCell').at(12).find('TextInput').props()
        .onChange({ target: { name: 'barcode', value: '12345' } });
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
        .props().value).to.equal('12345');
      expect(getNestedTable().find('BodyCell').at(25).find('TextInput')
        .props().value).to.equal('');
    });

    it('should set label on inline edit', () => {
      nestedTable.find('BodyCell').at(4).find('TextInput').props()
        .onChange({ target: { name: 'label', value: 'Container1' } });
      nestedTable.update();
      expect(getNestedTable().find('BodyCell').at(4).find('TextInput')
        .props().value).to.equal('Container1');
      expect(getNestedTable().find('BodyCell').at(17).find('TextInput')
        .props().value).to.equal('');
    });

    it('should NOT bulk update collapsed row', () => {
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              barcode: { value: 'FIRST-BARCODE', isValid: false },
              location: null,
              name: 'ian-b',
            },
          ]), 'barcode'
        );
      wrapper.find('List').props().onExpandRow(null, null, { ko2: true }); // collapse first row
      wrapper.update();
      wrapper
        .find('MultiRowEditorModal').at(0)
        .props()
        .onSubmit(
          Immutable.fromJS([
            {
              id: 'omatc3',
              material_idx: 0,
              form_idx: 0,
              barcode: { value: 'SECOND-BARCODE', isValid: false },
              location: null,
              name: 'ian-b',
            },
          ]), 'barcode'
        );
      wrapper.find('List').props().onExpandRow(null, null, { ko1: true }); // expand first row
      wrapper.update();
      expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
        .props().value).to.equal('SECOND-BARCODE');
    });

    it('should bulk set location from single selected location', () => {
      nestedTable.props().onSelectAll({ omatc3: true, omatc4: true });
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      expect(getNestedTable().find('BodyCell').at(7).text()).to.equal('Box cell 1');
      expect(getNestedTable().find('BodyCell').at(20).text()).to.equal('Box cell 1');
    });

    it('should bulk set location from multiple selected location', () => {
      nestedTable.props().onSelectAll({ omatc3: true, omatc4: true });
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations([Immutable.fromJS({ id: 'loc1' }), Immutable.fromJS({ id: 'loc2' })]);
      expect(getNestedTable().find('BodyCell').at(7).text()).to.equal('Box cell 1');
      expect(getNestedTable().find('BodyCell').at(20).text()).to.equal('Box cell 2');
    });

    it('should require selected location(s) to have room for one container per item in selection', () => {
      nestedTable.props().onSelectAll({ omatc3: true });
      wrapper.update();
      expect(wrapper.find('LocationAssignmentModal').props().containersCount).to.equal(3);
    });

    it('should prohibit re-selection of locations that already have been selected', () => {
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations([Immutable.fromJS({ id: 'loc1' }), Immutable.fromJS({ id: 'loc2' })]);
      nestedTable.props().onSelectRow(null, null, { omatc4: true });
      wrapper.update();
      expect(wrapper.find('LocationAssignmentModal').props().prohibitedLocations.toJS()).to.deep.equal(['loc1']);
    });

    it('should set single location from assign location button', () => {
      const assignLocationButton = nestedTable.find('BodyCell').at(7).find('Button');
      assignLocationButton.props().onClick();
      nestedTable.update();
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      expect(getNestedTable().find('BodyCell').at(7).text()).to.equal('Box cell 1');
      expect(getNestedTable().find('BodyCell').at(20).text()).to.equal('Assign location');
    });

    it('should duplicate selected rows but not duplicate the barcode', () => {
      const firstNestedTable = wrapper.find('Row').at(2).find('Table');
      const secondNestedTable = wrapper.find('Row').at(7).find('Table');

      // Adding barcode to first row of 2 nested tables
      wrapper.find('BodyCell').at(20).find('TextInput').simulate('change', { target: { name: 'barcode', value: '10' } });
      wrapper.find('BodyCell').at(54).find('TextInput').simulate('change', { target: {  name: 'barcode', value: '12' } });
      // Selecting first row of 2 nested tables
      firstNestedTable.props().onSelectRow(null, null, { omatc3: true });
      secondNestedTable.props().onSelectRow(null, null, { omatc5: true });

      expect(wrapper.find('BodyCell').length).to.equal(68);

      // Adding storage condition
      wrapper.find('StorageConditionSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'cold_80',
        name: '–80 °C (± 1 °C)'
      }));

      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');

      expect(wrapper.find('BodyCell').length).to.equal(107);

      // Barcode validation (first table)
      expect(wrapper.find('BodyCell').at(20).find('TextInput').props().value).to.equal('10');
      expect(wrapper.find('BodyCell').at(59).find('TextInput').props().value).to.equal('');
      // Barcode validation (Second table)
      expect(wrapper.find('BodyCell').at(80).find('TextInput').props().value).to.equal('12');
      expect(wrapper.find('BodyCell').at(106).find('TextInput').props().value).to.equal('');

      // Storage condition validation first table (Non-barcode field should get populated)
      expect(wrapper.find('BodyCell').at(16).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(55).text()).to.equal('–80 °C (± 1 °C)');
      // Storage condition validation second table (Non-barcode field should get populated)
      expect(wrapper.find('BodyCell').at(76).text()).to.equal('–80 °C (± 1 °C)');
      expect(wrapper.find('BodyCell').at(102).text()).to.equal('–80 °C (± 1 °C)');
    });

    it('should delete a selected row in a nested table', () => {
      confirmWithUserStub.returns(true);
      // Find master row in the main table
      let expandedMasterRows = wrapper.find('Body').find('Row').find({ expanded: true });
      expect(expandedMasterRows.length).to.equal(2);
      // Find expanded row with nested table
      let expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      expect(expandedRows.length).to.equal(2);

      // collapse second expanded row
      expandedMasterRows.at(1).find('Icon').props().onClick();
      wrapper.update();

      // verify if only one is expanded
      expandedMasterRows = wrapper.find('Body').find('Row').find({ expanded: true });
      expect(expandedMasterRows.length).to.equal(1);
      expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      expect(expandedRows.length).to.equal(1);

      // Get nested table in expanded row
      let nestedTable = expandedRows.at(0).find('Table');

      // Selecting first row of the nested table
      nestedTable.find('MasterCheckbox').props().deselectAll();
      nestedTable.find('Body').find('Checkbox').at(0).find('input')
        .simulate('change', { detail: { value: true } });

      // Click delete action button
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(7).simulate('click');
      expect(confirmWithUserStub.calledWith('Are you sure you want to delete 1 row(s)')).to.be.true;

      // Find updated nested tables
      expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      nestedTable = expandedRows.at(0).find('Table');

      // Verify if it contains only expected row left
      expect(nestedTable.find('Body').find('Row').length).to.equal(1);
      expect(nestedTable.props().data.getIn([0, 'id'])).to.equal('omatc4');
    });

    it('should delete selected rows in nested tables', () => {
      confirmWithUserStub.returns(true);
      // Total Initial rows expected
      expect(wrapper.find('Row').length).to.equal(11);

      // Find expanded rows with nested table
      let expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      expect(expandedRows.length).to.equal(2);
      let firstNestedTable = expandedRows.at(0).find('Table');
      let secondNestedTable = expandedRows.at(1).find('Table');

      // Select second row of the two nested tables;
      firstNestedTable.find('MasterCheckbox').props().deselectAll();
      secondNestedTable.find('MasterCheckbox').props().deselectAll();
      firstNestedTable.find('Body').find('Checkbox').at(1).find('input')
        .simulate('change', { detail: { value: true } });
      secondNestedTable.find('Body').find('Checkbox').at(1).find('input')
        .simulate('change', { detail: { value: true } });

      // Click delete action button
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(7).simulate('click');
      expect(confirmWithUserStub.calledWith('Are you sure you want to delete 2 row(s)')).to.be.true;

      // Find updated nested tables
      expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      firstNestedTable = expandedRows.at(0).find('Table');
      secondNestedTable = expandedRows.at(1).find('Table');

      // Verify if they contain only expected rows left
      expect(firstNestedTable.find('Body').find('Row').length).to.equal(1);
      expect(firstNestedTable.props().data.getIn([0, 'id'])).to.equal('omatc3');
      expect(secondNestedTable.find('Body').find('Row').length).to.equal(1);
      expect(secondNestedTable.props().data.getIn([0, 'id'])).to.equal('omatc5');
      // Expected total rows after all these operations
      expect(wrapper.find('Row').length).to.equal(9);
    });

    it('should delete an expanded row with nested table', () => {
      confirmWithUserStub.returns(true);
      // Total Initial rows expected
      expect(wrapper.find('Row').length).to.equal(11);

      // Find expanded rows with nested tables
      let expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      expect(expandedRows.length).to.equal(2);
      let firstNestedTable = expandedRows.at(0).find('Table');
      const secondNestedTable = expandedRows.at(1).find('Table');

      // Select first row of the first nested tables
      firstNestedTable.find('MasterCheckbox').props().deselectAll();
      firstNestedTable.find('Body').find('Checkbox').at(0).find('input')
        .simulate('change', { detail: { value: true } });

      // Selecting "All" rows of the second nested tables
      secondNestedTable.find('MasterCheckbox').props().selectAll();

      // Click delete action button
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(7).simulate('click');
      expect(confirmWithUserStub.calledWith('Are you sure you want to delete 3 row(s)')).to.be.true;

      // Find updated expanded row with nested table
      expandedRows = wrapper.find('Body').find('Row').find({ className: 'expanded' });
      expect(expandedRows.length).to.equal(1);
      firstNestedTable = expandedRows.at(0).find('Table');
      expect(firstNestedTable.find('Body').find('Row').length).to.equal(1);
      expect(firstNestedTable.props().data.getIn([0, 'id'])).to.equal('omatc4');

      // Expected total rows after all these operations
      expect(wrapper.find('Row').length).to.equal(5);
    });

    it('should assign the next available location for box_cells when a row is duplicated', () => {
      const assignLocationButton = nestedTable.find('BodyCell').at(7).find('Button');
      assignLocationButton.props().onClick();
      nestedTable.update();
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
      nestedTable.props().onSelectRow(null, null, { omatc3: true });
      wrapper.find('ActionMenu').find('button').at(0).simulate('click');
      wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');

      expect(wrapper.find('BodyCell').at(41).text()).to.equal('Box cell 2');
    });

    it('should bulk checkin orders for group materials', () => {
      bulkCheckinStub.returns(bulkCheckInSuccessPromise);
      setGroupRequiredFields();
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(bulkCheckinStub.calledOnce).to.be.true;
    });

    it('should bulk checkin for non-order group materials', async () => {
      bulkCheckinStub.returns(bulkCheckInSuccessPromise);
      propsWithOutOrders = [
        Immutable.fromJS({
          order: null,
          orderableMaterialId: 'omat3'
        })
      ];

      wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
      wrapper.find('Row').at(1).find('Icon').props()
        .onClick();
      await wrapper.update();
      wrapper.find('MultiRowEditorModal').at(0).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          barcode: { value: '123', isValid: true }
        },
        {
          id: 'omatc4',
          material_idx: 0,
          form_idx: 1,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          barcode: { value: '123', isValid: true }
        }
      ]), 'barcode');
      nestedTable.update();
      await wrapper.update();
      wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
        {
          id: 'omatc3',
          material_idx: 0,
          form_idx: 0,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          lot_no: { value: '123', isValid: true }
        },
        {
          id: 'omatc4',
          material_idx: 0,
          form_idx: 1,
          name: 'TestChemicalResource1',
          sku: 'sku1',
          lot_no: { value: '123', isValid: true }
        }
      ]), 'lot_no');
      nestedTable.update();
      await wrapper.update();
      wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');

      nestedTable.update();
      await wrapper.update();

      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(materialCheckinStub.calledOnce).to.be.true;
    });

    it('should enable checkin button by default for group materials', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.equal(false);
    });

    it('should enable checkin button if required fields are present for group materials', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.equal(false);
    });

    it('should disable checkin button if barcode is invalid for group materials', () => {
      setGroupRequiredFields();
      wrapper.find('BodyCell').at(20).find('TextInput').simulate('change', { target: { name: 'barcode', value: '' } });
      wrapper.update();

      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
    });

    it('should enable checkin button if barcode is valid for group materials', () => {
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;
    });

    it('should show an alert (prompt when navigating away) when there are unsaved changes for group materials', () => {
      // When prop of prompt is true it stops from navigating away from current page
      expect(wrapper.find('Prompt').props().when).to.be.false;
      wrapper.find('BodyCell').at(54).find('TextInput').simulate('change', { target: { name: 'barcode', value: '12' } });
      expect(wrapper.find('Prompt').props().when).to.be.true;
    });

    it('should not show alert (prompt when navigating away) after check in form is submitted successfully for group materials', () => {
      // When prop of prompt is true it stops from navigating away from current page
      bulkCheckinStub.returns(bulkCheckInSuccessPromise);
      expect(wrapper.find('Prompt').props().when).to.be.false;
      setGroupRequiredFields();
      expect(wrapper.find('Prompt').props().when).to.be.true;
      wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
      expect(bulkCheckinStub.called).to.be.true;
      expect(wrapper.find('Prompt').props().when).to.be.false;
    });

    it('should disable checkin button when there are any validations errors for group materials', () => {
      setGroupRequiredFields();
      wrapper.find('BodyCell').at(54).find('TextInput').simulate('change', { target: { name: 'lot_no', value: '' } });
      wrapper.update();
      expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
    });

    it('should not have error if volume and mass are valid for the new container type', () => {
      wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(10)
        .find('TextInput')
        .props()
        .onChange({ target: { value: '3501' } });
      wrapper.update();
      wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(11)
        .find('TextInput')
        .props()
        .onChange({ target: { value: '7001' } });
      wrapper.update();

      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(10)
        .find('Tooltip')
        .at(0)
        .props().title).to.equal('Must be between 0μl and 3500μl');
      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(11)
        .find('Tooltip')
        .at(0)
        .props().title).to.equal('Must be between 0mg and 7000mg');

      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));
      wrapper.update();
      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(10)
        .find('TextInput')
        .props().validated.hasError).to.equal(false);
      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(11)
        .find('TextInput')
        .props().validated.hasError).to.equal(false);
    });

    it('should have error if volume and mass are invalid for the new container type', () => {
      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: '50ml-conical',
        name: '50mL Conical'
      }));

      wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(10)
        .find('TextInput')
        .props()
        .onChange({ target: { value: '50000' } });
      wrapper.update();
      wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(11)
        .find('TextInput')
        .props()
        .onChange({ target: { value: '100000' } });
      wrapper.update();

      wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
        id: 'a1-vial',
        name: 'a1-vial'
      }));

      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(10)
        .find('Tooltip')
        .at(0)
        .props().title).to.equal('Must be between 0μl and 3500μl');
      expect(wrapper.find('Row').at(2).find('Table').find('BodyCell')
        .at(11)
        .find('Tooltip')
        .at(0)
        .props().title).to.equal('Must be between 0mg and 7000mg');
    });

    it('should allow rendering of custom button', async () => {
      const backButton = <Button>Back</Button>;
      wrapper = await createWrapperAndAwaitReady(propsWithOrders, { backButton: backButton });
      expect(wrapper.find('button').filterWhere(button => button.text() === 'Back').length).to.equal(1);
      expect(wrapper.find('button').filterWhere(button => button.text() === 'Reset').length).to.equal(1);
    });
  });

  describe('MaterialOrderCheckinFormValidations tests', () => {
    describe('Individual material order validations', () => {

      beforeEach(async () => {
        sandbox.stub(OrderableMaterialAPI, 'index').returns({
          data: orderableMaterialDataForOrders,
          included: [
            { id: 'mat1', relationships: { vendor: { data: { id: 'vend1' } } } },
            { id: 'mat2', relationships: { vendor: { data: { id: 'vend2' } } } },
            { id: 'vend1', data: { name: 'Vendor 1' } }
          ],
          meta: {
            record_count: 1
          }
        });
        orderableMaterialStub.withArgs('omat1').returns(individualOrderableMaterial1);
        orderableMaterialStub.withArgs('omat2').returns(individualOrderableMaterial2);
        orderableMaterialStub.withArgs('omat3').returns(individualOrderableMaterial3);
        orderableMaterialStub.withArgs('omat4').returns(individualOrderableMaterial4);
        sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
        sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
        sandbox.stub(CommonUiUtil, 'getUUIDv4').onFirstCall().returns('omatc1').onSecondCall()
          .returns('omatc2')
          .onThirdCall()
          .returns('omatc3')
          .returns('omatc4');
        wrapper = await createWrapperAndAwaitReady(propsWithOrders);
      });

      const orders = [
        {
          id: 'ko1',
          vendor_order_id: 'VO-123',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab1'
        },
        {
          id: 'ko2',
          vendor_order_id: 'VO-122',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab1'
        },
        {
          id: 'ko3',
          vendor_order_id: 'VO-121',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab2'
        },
        {
          id: 'ko4',
          vendor_order_id: 'VO-120',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab2'
        },
      ];

      const propsWithOrders = [
        Immutable.fromJS({
          order: orders[0],
          orderableMaterialId: 'omat1',
        }),
        Immutable.fromJS({
          order: orders[1],
          orderableMaterialId: 'omat2',
        }),
        Immutable.fromJS({
          order: orders[2],
          orderableMaterialId: 'omat3',
        }),
        Immutable.fromJS({
          order: orders[3],
          orderableMaterialId: 'omat4',
        }),
      ];

      const setRequiredFields = (isNonOrder = false, invalidBarcodeData = null) => {
        const barcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: '12345', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            barcode: { value: 'ab123456', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc1',
            material_idx: 2,
            form_idx: 0,
            barcode: { value: '1234ab567', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc4',
            material_idx: 3,
            form_idx: 0,
            barcode: { value: '1234ab', isValid: true },
            location: null,
            name: 'ian-b',
          },
        ]);
        const nonOrderBarcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: '12345', isValid: true },
            location: null,
            name: 'ian-b',
          },
        ]);
        wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
          id: '50ml-conical',
          name: '50mL Conical'
        }));
        wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
        wrapper.update();
        wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
          {
            id: 'omatc1',
            material_idx: 0,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku1',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            name: 'Material 2',
            sku: 'sku2',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc3',
            material_idx: 2,
            form_idx: 0,
            name: 'Material 3',
            sku: 'sku3',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc1',
            material_idx: 3,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku4',
            lot_no: { value: '123', isValid: true }
          }
        ]), 'lot_no');
        wrapper.update();

        if (invalidBarcodeData) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(invalidBarcodeData, 'barcode');
        } else if (isNonOrder) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(nonOrderBarcodeData, 'barcode');
        } else {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(barcodeData, 'barcode');
        }
        wrapper.update();

        const barcodes = wrapper.find('BodyCell').find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
        barcodes.forEach(barcode => {
          barcode.props().onBlur();
          wrapper.update();
        });
      };

      const simulateFormError = (errorType) => {
        switch (errorType) {
          case 'volume':
            wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '50001' } });
            wrapper.update();
            break;
          case 'mass':
            wrapper.find('BodyCell').at(13).find('TextInput').simulate('change', { target: { value: '100001' } });
            wrapper.update();
            break;
          case 'volume_mass':
            wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '0' } });
            wrapper.find('BodyCell').at(13).find('TextInput').simulate('change', { target: { value: '0' } });
            wrapper.update();
            break;
          case 'barcode':
            setRequiredFields();
            wrapper.find('BodyCell').at(14).find('TextInput').props()
              .onChange({ target: { value: '' } });
            wrapper.update();
            wrapper.find('BodyCell').at(14).find('TextInput').props()
              .onChange({ target: { value: '*' } });
            wrapper.update();
            break;
          case 'label':
            wrapper.find('BodyCell').at(6).find('TextInput').props()
              .onChange({ target: { value: 'lol/d', name: 'label' } });
            wrapper.update();
            break;
          case 'lot no':
            wrapper.find('BodyCell').at(8).find('TextInput').props()
              .onChange({ target: { name: 'lot_no', value: '' } });
            wrapper.update();
            break;
        }
      };

      it('should not break on changing input field of mass or volume', () => {
        wrapper.find('BodyCell').at(42).find('TextInput').simulate('change', { target: { value: 10 } });
        expect(wrapper.find('BodyCell').at(42).find('input').props().value).to.equal('10');
        wrapper.find('BodyCell').at(43).find('TextInput').simulate('change', { target: { value: 10 } });
        expect(wrapper.find('BodyCell').at(43).find('input').props().value).to.equal('10');
      });

      it('should specify required visible columns', () => {
        const requiredVisibleColumns = ['name', 'container type', 'Resource ID', 'lot', 'location', 'storage condition', 'volume', 'mass', 'barcode'];
        expect(wrapper.find('List').prop('requiredVisibleColumns')).to.deep.equal(requiredVisibleColumns);
      });

      it('should have rows with validation errors highlighted in red', () => {
        setRequiredFields();
        wrapper.find('BodyCell').at(12).find('TextInput').props()
          .onChange({ target: { value: '-100' } });
        wrapper.update();
        wrapper.find('BodyCell').at(27).find('TextInput').props()
          .onChange({ target: { value: '-1000' } });
        wrapper.update();
        wrapper.find('BodyCell').at(42).find('TextInput').props()
          .onChange({ target: { value: '-10000' } });
        wrapper.update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('List').props().rowColorMap).to.deep.equal({
          ko1: 'danger', ko2: 'danger', ko3: 'danger', ko4: undefined
        });

        const highlightedRows = wrapper.find('Row').filterWhere(row => row.props().color === 'danger');
        expect(highlightedRows.length).to.equal(3);
        expect(highlightedRows.find('tr').at(0).hasClass('amino-table__row--danger')).to.be.true;
        expect(highlightedRows.find('tr').at(1).hasClass('amino-table__row--danger')).to.be.true;
        expect(highlightedRows.find('tr').at(2).hasClass('amino-table__row--danger')).to.be.true;
      });

      it('should call validateBarcodes on barcode change', () => {
        const validateBarcodesStub = sandbox.stub(ContainerActions, 'validateBarcodes').returns({
          done: () => {
            return { fail: () => ({}) };
          }
        });
        expect(validateBarcodesStub.called).to.be.false;
        setRequiredFields();
        expect(validateBarcodesStub.called).to.be.true;

      });

      it('should have cells with invalid volume outlined in red', () => {
        wrapper.find('BodyCell').at(12).find('TextInput').props()
          .onChange({ target: { value: '-100' } });
        wrapper.update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(12).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(12).find('Tooltip').props().title).to.equal('Must be between 0μl and 3500μl');
      });

      it('should have cells with invalid label having , or / outlined in red', () => {
        wrapper.find('BodyCell').at(6).find('TextInput').props()
          .onChange({ target: { value: 'lol/d', name: 'label' } });
        wrapper.update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(6).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(6).find('Tooltip').props().title).to.equal('Character \'/\' not allowed');

        wrapper.find('BodyCell').at(6).find('TextInput').props()
          .onChange({ target: { value: 'lol,d', name: 'label' } });
        wrapper.update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(6).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(6).find('Tooltip').props().title).to.equal('Comma not allowed');
      });

      it('should have containerType field with retired container type outlined in red', () => {
        wrapper
          .find('ContainerTypeSelectorModal')
          .props()
          .onSelect(
            Immutable.fromJS({
              id: 'pcr-0.5',
              name: '0.5mL PCR tube',
            })
          );
        wrapper.update();
        expect(wrapper.find('BodyCell').at(7).props().highlight).to.equal(
          'danger'
        );
        expect(
          wrapper.find('BodyCell').at(7).find('Tooltip').at(0)
            .props().title
        ).to.equal('container type pcr-0.5 is retired');
      });

      it('should not have containerType field in red, when a non retired container type is selected', () => {
        wrapper
          .find('ContainerTypeSelectorModal')
          .props()
          .onSelect(
            Immutable.fromJS({
              id: '50ml-conical',
              name: '50mL Conical',
            })
          );
        wrapper.update();
        expect(wrapper.find('BodyCell').at(7).props().highlight).to.not.equal(
          'danger'
        );
      });

      // Cannot assert Row highlight due to useEffect ,need to find a fix for it.
      it('should have cells with invalid volume and label outlined in red,and row highlighted when even single field is invalid', () => {
        wrapper.find('BodyCell').at(12).find('TextInput').props()
          .onChange({ target: { value: '-100' } });
        wrapper.update();
        wrapper.find('BodyCell').at(6).find('TextInput').props()
          .onChange({ target: { value: 'lol,d', name: 'label' } });
        wrapper.update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(12).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(12).find('Tooltip').props().title).to.equal('Must be between 0μl and 3500μl');

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(6).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(6).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(6).find('Tooltip').props().title).to.equal('Comma not allowed');

        wrapper.find('BodyCell').at(12).find('TextInput').props()
          .onChange({ target: { value: '100' } });
        wrapper.update();

        expect(wrapper.find('BodyCell').at(12).find('TextInput').props().validated.hasError).to.be.false;
        expect(wrapper.find('BodyCell').at(6).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
      });

      it('should have cells with volume and mass as zero have both rows outlined in red and display error message ', () => {
        wrapper.find('BodyCell').at(12).find('TextInput').props()
          .onChange({ target: { value: '0' } });
        wrapper.update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(12).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(13).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(13).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(12).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(13).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(12).find('Tooltip').props().title).to.equal('Must specify either volume or mass');
        expect(wrapper.find('BodyCell').at(13).find('Tooltip').props().title).to.equal('Must specify either volume or mass');
      });

      it('should have cells with empty lot no outlined in red', () => {
        wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
          {
            id: 'omatc1',
            material_idx: 0,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku1',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            name: 'Material 2',
            sku: 'sku2',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc3',
            material_idx: 2,
            form_idx: 0,
            name: 'Material 3',
            sku: 'sku3',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc1',
            material_idx: 3,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku4',
            lot_no: { value: null, isValid: true }
          }
        ]), 'lot_no');
        wrapper.update();
        wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');

        expect(wrapper.find('BodyCell').at(8).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(23).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(38).find('Tooltip').at(0)
          .props().title).to.equal('Must be specified');
        expect(wrapper.find('BodyCell').at(8).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(23).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(38).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(8).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(23).find('Tooltip').at(0)
          .props().title).to.equal('Must be specified');
        expect(wrapper.find('BodyCell').at(38).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(8).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(23).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(38).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(8).find('Tooltip').at(0)
          .props().title).to.equal('Must be specified');
        expect(wrapper.find('BodyCell').at(23).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(38).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(38).find('Tooltip').props().title).to.equal('Must be specified');
      });
      it('should have cells with invalid mass outlined in red', () => {
        wrapper.find('BodyCell').at(13).find('TextInput').props()
          .onChange({ target: { value: '-100' } });
        wrapper.update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(13).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(13).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(13).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('td').at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('TextInput').props().validated.hasError).to.be.true;
        expect(wrapper.find('BodyCell').at(13).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(13).find('Tooltip').props().title).to.equal('Must be between 0mg and 7000mg');
      });

      it('should not highlight cells where there are no validation errors', () => {
        bulkCheckinStub.returns(bulkCheckInSuccessPromise);
        setRequiredFields();
        wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.false;

        const bodyCells = wrapper.find('BodyCell').filterWhere(cell => cell.props().highlight === 'danger');
        expect(bodyCells.length).to.equal(0);
      });

      it('should bulk paste values in Label, lot no, Volume, Mass, Barcode fields across rows', async () => {
        const getDataStub = sandbox.stub().returns('123\n456 789\n1011');
        propsWithOutOrders = [
          Immutable.fromJS({
            order: null,
            orderableMaterialId: 'omat1'
          }), Immutable.fromJS({
            order: null,
            orderableMaterialId: 'omat2'
          }), Immutable.fromJS({
            order: null,
            orderableMaterialId: 'omat3'
          })
        ];

        wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
        const event = {
          clipboardData: { getData: getDataStub },
          preventDefault: () => {}
        };

        const validateResults = (fieldName, pasteFieldIndex, results) => {
          const field = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === fieldName);
          field.at(pasteFieldIndex).props().onPaste(event);
          wrapper.update();

          const updatedField = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === fieldName);
          results.forEach((result, index) => {
            expect(updatedField.at(index).props().value).to.equal(result);
            expect(updatedField.at(index).hasClass('amino-table__cell--danger')).to.be.false;
          });
        };

        validateResults('label', 0, ['123', '456 789', '1011']);
        validateResults('lot_no', 1, ['', '123', '456 789']);
        validateResults('volume_per_container', 2, ['1', '1', '123']);
        validateResults('mass_per_container', 0, ['123', '456 789', '1011']);
        validateResults('barcode', 0, ['123', '456 789', '1011']);
      });

      it('should bulk paste and validate values in Label field across rows', async () => {
        const getDataStub = sandbox.stub().returns('label1,\nlabel2\nlabel3\nlabel4/');
        const event = {
          clipboardData: { getData: getDataStub },
          preventDefault: () => {}
        };
        wrapper.find('Row').at(1).find('BodyCell').at(6)
          .find('TextInput')
          .props()
          .onPaste(event);
        await wrapper.update();

        const assertLabelAtRow = (rowIndex, value, expectedHighlight = undefined, errorMessage = undefined) => {
          const bodyCell = wrapper.find('Row').at(rowIndex).find('BodyCell').at(6);
          expect(bodyCell.props().highlight).to.equal(expectedHighlight);
          expect(bodyCell.find('TextInput').props().value).to.equal(value);
          expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--inline')).to.be.true;
          if (expectedHighlight === 'danger') {
            expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--danger')).to.be.true;
            expect(bodyCell.find('Icon').at(0).props().icon).to.equal('far fa-exclamation-circle');
            expect(bodyCell.find('Icon').at(0).props().className).to.equal('left-aligned-icon');
            expect(bodyCell.find('Tooltip').props().title).to.equal(errorMessage);
          } else {
            expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--danger')).to.be.false;
            expect(bodyCell.find('Icon').length).to.equal(0);
            expect(bodyCell.find('Tooltip').length).to.equal(0);
          }
        };

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        assertLabelAtRow(1, 'label1,', 'danger', 'Comma not allowed');
        assertLabelAtRow(2, 'label2');
        assertLabelAtRow(3, 'label3');
        assertLabelAtRow(4, 'label4/', 'danger', "Character '/' not allowed");
      });

      it('should have a toggle to filter orders without error', () => {
        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).find(Toggle).length).to.equal(1);
        expect(wrapper.find(List).find(Toggle).props().name).to.equal('list-toggle-filter');
        expect(wrapper.find(List).find(Toggle).props().value).to.equal('on');
        expect(wrapper.find(List).find(Toggle).props().size).to.equal('large');
        expect(wrapper.find(List).props().data.size).to.equal(0);
        expect(wrapper.find(List).props().emptyMessage).to.equal('No Records With Error Found');
      });

      it('should display only orders with error for volume errors if the toggle switch is on', () => {
        simulateFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });
      });

      it('should display only orders with error for mass errors if the toggle switch is on', () => {
        simulateFormError('mass');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });
      });

      it('should display only orders with error for volume and mass errors if both 0', () => {
        simulateFormError('volume_mass');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });
      });

      it('should display only orders with error for label errors if the toggle switch is on', () => {
        simulateFormError('label');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });
      });

      it('should display only orders with error for lot no errors if the toggle switch is on', () => {
        simulateFormError('lot no');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });
      });

      it('should display only orders with error for pasted values if the toggle switch is on', () => {
        const getDataStub1 = sandbox.stub().returns('');
        const getDataStub2 = sandbox.stub().returns('validLot12');
        const event1 = {
          clipboardData: { getData: getDataStub1 },
          preventDefault: () => {}
        };
        const event2 = {
          clipboardData: { getData: getDataStub2 },
          preventDefault: () => {}
        };

        wrapper.find('BodyCell').at(8).find('TextInput')
          .props()
          .onPaste(event1);
        wrapper.update();

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger'
        });

        wrapper.find('BodyCell').at(8).find('TextInput')
          .props()
          .onPaste(event2);
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(0);
      });

      it('should disable or enable toggle depending on error and toggle states', () => {
        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(true);

        simulateFormError('volume');

        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(false);

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '100' } });
        wrapper.update();

        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(false);
      });

      it('should have rows with error disappear from view when error has been resolved', () => {
        const clock = sandbox.useFakeTimers();

        simulateFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '100' } });

        clock.tick(debounceTime);

        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(0);
        expect(wrapper.find(List).props().emptyMessage).to.equal('No Records With Error Found');
      });

      it('should not have rows with error disappear from view when error has been resolved until debounced time passed', () => {
        simulateFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '100' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
      });

      it('should validate mass and volume on initial load', async () => {
        const ordersWithInitialValues = [
          Immutable.fromJS({
            order: orders[0],
            orderableMaterialId: 'omat1',
            initialForm: {
              volume_per_container: '-30',
              mass_per_container: '-20'
            }
          })
        ];
        wrapper = await createWrapperAndAwaitReady(ordersWithInitialValues, { validateAllOnInit: true });
        expect(wrapper.find('BodyCell').at(12).find('Tooltip').props().title).to.equal('Must be between 0μl and 3500μl');
        expect(wrapper.find('BodyCell').at(13).find('Tooltip').props().title).to.equal('Must be between 0mg and 7000mg');
      });

      it('should validate label on initial load', async () => {
        const ordersWithInitialValues = [
          Immutable.fromJS({
            order: orders[0],
            orderableMaterialId: 'omat1',
            initialForm: {
              label: 'IN/CO/RR,ECT'
            }
          })
        ];
        wrapper = await createWrapperAndAwaitReady(ordersWithInitialValues, { validateAllOnInit: true });
        expect(wrapper.find('BodyCell').at(6).find('Tooltip').props().title).to.equal('Character \'/\' not allowed');
      });

      it('should validate lot no on initial load', async () => {
        const ordersWithInitialValues = [
          Immutable.fromJS({
            order: orders[0],
            orderableMaterialId: 'omat1',
            initialForm: {
              lot_no: ''
            }
          })
        ];
        wrapper = await createWrapperAndAwaitReady(ordersWithInitialValues, { validateAllOnInit: true });
        expect(wrapper.find('BodyCell').at(8).find('Tooltip').props().title).to.equal('Must be specified');
      });

      it('should validate barcode on initial load', async () => {
        sandbox.stub(ContainerActions, 'validateBarcodes').returns({
          done: (cb) => {
            cb([{ barcode: 'non-unique-barcode', is_valid: false }]);
          }
        });
        const ordersWithInitialValues = [
          Immutable.fromJS({
            order: orders[0],
            orderableMaterialId: 'omat1',
            initialForm: {
              barcode: 'non-unique-barcode'
            }
          })
        ];
        wrapper = await createWrapperAndAwaitReady(ordersWithInitialValues);
        expect(wrapper.find('BodyCell').at(14).find('Tooltip').props().title).to.equal('Duplicate');
      });
    });

    describe('Location and barcode validation test for individual material order', () => {

      const orders = [
        {
          id: 'ko1',
          vendor_order_id: 'VO-123',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab1'
        },
        {
          id: 'ko2',
          vendor_order_id: 'VO-122',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab1'
        },
        {
          id: 'ko3',
          vendor_order_id: 'VO-121',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab2'
        },
        {
          id: 'ko4',
          vendor_order_id: 'VO-120',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab2'
        },
      ];

      const propsWithOrders = [
        Immutable.fromJS({
          order: orders[0],
          orderableMaterialId: 'omat1',
        }),
        Immutable.fromJS({
          order: orders[1],
          orderableMaterialId: 'omat2',
        }),
        Immutable.fromJS({
          order: orders[2],
          orderableMaterialId: 'omat3',
        }),
        Immutable.fromJS({
          order: orders[3],
          orderableMaterialId: 'omat4',
        }),
      ];

      beforeEach(async () => {
        sandbox.stub(OrderableMaterialAPI, 'index').returns({
          data: orderableMaterialDataForOrders,
          included: [
            { id: 'mat1', relationships: { vendor: { data: { id: 'vend1' } } } },
            { id: 'mat2', relationships: { vendor: { data: { id: 'vend2' } } } },
            { id: 'vend1', data: { name: 'Vendor 1' } }
          ],
          meta: {
            record_count: 1
          }
        });
        orderableMaterialStub.withArgs('omat1').returns(individualOrderableMaterial1);
        orderableMaterialStub.withArgs('omat2').returns(individualOrderableMaterial2);
        orderableMaterialStub.withArgs('omat3').returns(individualOrderableMaterial3);
        orderableMaterialStub.withArgs('omat4').returns(individualOrderableMaterial4);
        sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
        sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));
        sandbox.stub(CommonUiUtil, 'getUUIDv4').onFirstCall().returns('omatc1').onSecondCall()
          .returns('omatc2')
          .onThirdCall()
          .returns('omatc3')
          .returns('omatc4');
        wrapper = await createWrapperAndAwaitReady(propsWithOrders);
      });
      const setRequiredFields = (isNonOrder = false, invalidBarcodeData = null) => {
        const barcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: '12345', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            barcode: { value: 'ab123456', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc1',
            material_idx: 2,
            form_idx: 0,
            barcode: { value: '1234ab567', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc4',
            material_idx: 3,
            form_idx: 0,
            barcode: { value: '1234ab', isValid: true },
            location: null,
            name: 'ian-b',
          },
        ]);
        const nonOrderBarcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: '12345', isValid: true },
            location: null,
            name: 'ian-b',
          },
        ]);
        wrapper.find('ContainerTypeSelectorModal').props().onSelect(Immutable.fromJS({
          id: '50ml-conical',
          name: '50mL Conical'
        }));
        wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
        wrapper.update();
        wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
          {
            id: 'omatc1',
            material_idx: 0,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku1',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            name: 'Material 2',
            sku: 'sku2',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc3',
            material_idx: 2,
            form_idx: 0,
            name: 'Material 3',
            sku: 'sku3',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc1',
            material_idx: 3,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku4',
            lot_no: { value: '123', isValid: true }
          }
        ]), 'lot_no');
        wrapper.update();

        if (invalidBarcodeData) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(invalidBarcodeData, 'barcode');
        } else if (isNonOrder) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(nonOrderBarcodeData, 'barcode');
        } else {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(barcodeData, 'barcode');
        }
        wrapper.update();

        const barcodes = wrapper.find('BodyCell').find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
        barcodes.forEach(barcode => {
          barcode.props().onBlur();
          wrapper.update();
        });
      };
      it('should have cells with empty location outlined in red', () => {
        wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
          {
            id: 'omatc1',
            material_idx: 0,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku1',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc2',
            material_idx: 1,
            form_idx: 0,
            name: 'Material 2',
            sku: 'sku2',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc3',
            material_idx: 2,
            form_idx: 0,
            name: 'Material 3',
            sku: 'sku3',
            lot_no: { value: '123', isValid: true }
          },
          {
            id: 'omatc1',
            material_idx: 3,
            form_idx: 0,
            name: 'Material 1',
            sku: 'sku4',
            lot_no: { value: '123', isValid: true }
          }
        ]), 'lot_no');

        it('should highlight duplicated rows with validation errors', () => {
          wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });

          wrapper.find('ActionMenu').find('button').at(0).simulate('click');
          wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(3).simulate('click');
          wrapper.find('BodyCell').at(59).find('TextInput').props()
            .onChange({ target: { value: '',  } });
          wrapper.update();

          expect(wrapper.find('BodyCell').at(59).props().highlight).to.equal('danger');
          expect(wrapper.find('BodyCell').at(59).find('td').at(0)
            .hasClass('amino-table__cell--danger')).to.be.true;
          expect(wrapper.find('BodyCell').at(59).find('td').at(0)
            .hasClass('amino-table__cell--inline')).to.be.true;
          expect(wrapper.find('BodyCell').at(59).find('TextInput').props().validated.hasError).to.be.true;
          expect(wrapper.find('BodyCell').at(59).find('Icon').at(0)
            .props().icon).to.equal('far fa-exclamation-circle');
          expect(wrapper.find('BodyCell').at(59).find('Icon').at(0)
            .props().className).to.equal('left-aligned-icon');
        });

        it('should have cells with invalid barcodes outlined in red', () => {
          setRequiredFields();
          expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
          expect(wrapper.find('BodyCell').at(14).props().highlight).to.equal('danger');
          expect(wrapper.find('BodyCell').at(14).find('td').at(0)
            .hasClass('amino-table__cell--danger')).to.be.true;
          expect(wrapper.find('BodyCell').at(14).find('td').at(0)
            .hasClass('amino-table__cell--inline')).to.be.true;
          expect(wrapper.find('BodyCell').at(14).find('Icon').at(0)
            .props().icon).to.equal('far fa-exclamation-circle');
          expect(wrapper.find('BodyCell').at(14).find('Icon').at(0)
            .props().className).to.equal('left-aligned-icon');
        });

        it('should display only orders with error for barcode errors if the toggle switch is on', () => {
          setRequiredFields();

          expect(wrapper.find(List).props().data.size).to.equal(1);
          expect(wrapper.find(List).props().rowColorMap).to.eql({ ko1: 'danger' });
        });

        // TODO: will be fixed once the barcode validation issue is fixed.
        it('should display success validation checkmark for valid barcode requiring location for material without order', async () => {
          propsWithOutOrders = [
            Immutable.fromJS({
              order: null,
              orderableMaterialId: 'omat3'
            })
          ];
          wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
        });

        it('should display success validation checkmark for valid barcode without requiring location for material orders', async () => {
          sandbox.stub(ContainerActions, 'validateBarcodes').returns({
            done: (cb) => {
              cb([{ barcode: '123456', is_valid: true }]);
            }
          });

          const barcode = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
          barcode.at(0).simulate('change', { target: { value: '123456' } });
          barcode.at(0).simulate('blur');
          await wrapper.update();

          const checkMarkIcon = await wrapper.find('Icon').filterWhere(icon => icon.prop('icon') === 'fa fa-check' && icon.prop('color') === 'success');
          expect(checkMarkIcon.length).to.equal(1);
        });

        it('should display invalid icon for invalid barcode requiring location for material without order', async () => {
          propsWithOutOrders = [
            Immutable.fromJS({
              order: null,
              orderableMaterialId: 'omat3'
            })
          ];
          wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);
          sandbox.stub(ContainerActions, 'validateBarcodes').returns({
            done: (cb) => {
              cb([{ barcode: '123456', is_valid: false }]);
            }
          });

          const barcode = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
          barcode.at(0).simulate('change', { target: { value: '123456' } });
          barcode.at(0).simulate('blur');
          await wrapper.update();

          const checkMarkIcon = wrapper.find('Icon').filterWhere(icon => icon.prop('icon') === 'fa fa-times' && icon.prop('color') === 'danger');
          expect(checkMarkIcon.length).to.equal(1);
        });

        it('should display success validation checkmark for valid barcode requiring location for material without order', async () => {
          propsWithOutOrders = [
            Immutable.fromJS({
              order: null,
              orderableMaterialId: 'omat3'
            })
          ];
          wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);

          sandbox.stub(ContainerActions, 'validateBarcodes').returns({
            done: (cb) => {
              cb([{ barcode: '123456', is_valid: true }]);
            }
          });

          const barcode = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
          barcode.at(0).simulate('change', { target: { value: '123456' } });
          barcode.at(0).simulate('blur');
          await wrapper.update();

          wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
          await wrapper.update();

          const checkMarkIcon = wrapper.find('Icon').filterWhere(icon => icon.prop('icon') === 'fa fa-check' && icon.prop('color') === 'success');
          expect(checkMarkIcon.length).to.equal(1);
        });

        it('should display invalid icon for invalid barcode requiring location for material without order', async () => {
          propsWithOutOrders = [
            Immutable.fromJS({
              order: null,
              orderableMaterialId: 'omat3'
            })
          ];
          wrapper = await createWrapperAndAwaitReady(propsWithOutOrders);

          wrapper.find('List').props().onSelectRow(null, null, { ko1: true, ko2: true });

          wrapper.find('ActionMenu').find('button').at(0).simulate('click');
          wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(3).simulate('click');

          wrapper.find('BodyCell').at(55).find('TextInput').props()
            .onChange({ target: { value: '' } });
          await wrapper.update();

          expect(wrapper.find('BodyCell').at(55).props().highlight).to.equal('danger');
          expect(wrapper.find('BodyCell').at(55).find('td').at(0)
            .hasClass('amino-table__cell--danger')).to.be.true;
          expect(wrapper.find('BodyCell').at(55).find('td').at(0)
            .hasClass('amino-table__cell--inline')).to.be.true;
          expect(wrapper.find('BodyCell').at(55).find('TextInput').props().validated.hasError).to.be.true;
          expect(wrapper.find('BodyCell').at(55).find('Icon').at(0)
            .props().icon).to.equal('far fa-exclamation-circle');
          expect(wrapper.find('BodyCell').at(55).find('Icon').at(0)
            .props().className).to.equal('left-aligned-icon');
          const checkMarkIcon = wrapper.find('Icon').filterWhere(icon => icon.prop('icon') === 'fa fa-times' && icon.prop('color') === 'danger');
          expect(checkMarkIcon.length).to.equal(1);
        });
      });
    });

    describe('Group material order validation test', () => {

      const orders = [
        {
          id: 'ko1',
          vendor_order_id: 'VO-123',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab1'
        },
        {
          id: 'ko2',
          vendor_order_id: 'VO-122',
          created_at: '2021-04-12T16:30:53.304-07:00',
          lab_id: 'lab2'
        }
      ];

      const propsWithOrders = [
        Immutable.fromJS({
          order: orders[0],
          orderableMaterialId: 'omat3',
          labId: 'lab1'
        }),
        Immutable.fromJS({
          order: orders[1],
          orderableMaterialId: 'omat4',
          labId: 'lab2'
        }),
      ];

      const getNestedTable = () => (
        wrapper.find('Row').at(2).find('Table')
      );

      beforeEach(async () => {
        sandbox.stub(OrderableMaterialAPI, 'index').returns({
          data: groupOrderableMaterialData,
          included: [
            { id: 'mat3', relationships: { vendor: { data: { id: 'vend1' } } } },
            { id: 'mat4', relationships: { vendor: { data: { id: 'vend1' } } } },
            { id: 'vend1', data: { name: 'Vendor 1' } }
          ],
          meta: {
            record_count: 1
          }
        });
        orderableMaterialStub.withArgs('omat3').returns(groupOrderableMaterial1);
        orderableMaterialStub.withArgs('omat4').returns(groupOrderableMaterial2);
        sandbox.stub(SessionStore, 'getOrg').returns(Immutable.Map({ id: 'org13' }));
        sandbox.stub(SessionStore, 'getUser').returns(Immutable.Map({ id: 'user3202' }));

        sandbox.stub(CommonUiUtil, 'getUUIDv4').onFirstCall().returns('omatc3').onSecondCall()
          .returns('omatc4')
          .onThirdCall()
          .returns('omatc5')
          .returns('omatc6');
        wrapper = await createWrapperAndAwaitReady(propsWithOrders);
        wrapper.find('Row').at(1).find('Icon').props() // expand first row
          .onClick();
        wrapper.find('Row').at(2).find('Icon').props() // expand second row
          .onClick();
        await wrapper.update();
        nestedTable = getNestedTable();
      });

      const setGroupRequiredFields = (isNonOrder = false, invalidBarcodeData = null) => {
        const validBarcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: 'unique1', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc4',
            material_idx: 0,
            form_idx: 1,
            barcode: { value: 'unique2', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc5',
            material_idx: 1,
            form_idx: 0,
            barcode: { value: 'unique3', isValid: true },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc6',
            material_idx: 1,
            form_idx: 1,
            barcode: { value: 'unique4', isValid: true },
            location: null,
            name: 'ian-b',
          },
        ]);

        const nonOrderBarcodeData = Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            barcode: { value: 'unique1', isValid: false },
            location: null,
            name: 'ian-b',
          },
          {
            id: 'omatc4',
            material_idx: 0,
            form_idx: 1,
            barcode: { value: 'unique2', isValid: false },
            location: null,
            name: 'ian-b',
          },
        ]);

        wrapper.find('LocationAssignmentModal').props().updateMultipleLocations('loc1');
        wrapper.update();
        wrapper
          .find('MultiRowEditorModal').at(4)
          .props()
          .onSubmit(
            Immutable.fromJS([
              {
                id: 'omatc3',
                material_idx: 0,
                form_idx: 0,
                name: 'TestChemicalResource1',
                sku: 'sku1',
                lot_no: { value: '123', isValid: true }
              },
              {
                id: 'omatc4',
                material_idx: 0,
                form_idx: 1,
                name: 'TestChemicalResource1',
                sku: 'sku1',
                lot_no: { value: '123', isValid: true }
              },
              {
                id: 'omatc5',
                material_idx: 1,
                form_idx: 0,
                name: 'TestChemicalResource2',
                sku: 'sku2',
                lot_no: { value: '123', isValid: true }
              },
              {
                id: 'omatc6',
                material_idx: 1,
                form_idx: 1,
                name: 'TestChemicalResource1',
                sku: 'sku2',
                lot_no: { value: '123', isValid: true }
              }
            ]), 'lot_no');
        wrapper.update();
        if (invalidBarcodeData) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(invalidBarcodeData, 'barcode');
        } else if (isNonOrder) {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(nonOrderBarcodeData, 'barcode');
        } else {
          wrapper
            .find('MultiRowEditorModal').at(0)
            .props()
            .onSubmit(validBarcodeData, 'barcode');
        }

        nestedTable.update();
        wrapper.update();

        const barcodes = wrapper.find('BodyCell').find('TextInput').filterWhere(textInput => textInput.prop('name') === 'barcode');
        barcodes.forEach(barcode => {
          barcode.props().onBlur();
          wrapper.update();
        });
      };

      const simulateGroupFormError = (errorType) => {
        switch (errorType) {
          case 'volume':
            getNestedTable().find('BodyCell').at(10).find('TextInput')
              .props()
              .onChange({ target: { value: '100000' } });

            getNestedTable().update();
            break;
          case 'mass':
            getNestedTable().find('BodyCell').at(11).find('TextInput')
              .props()
              .onChange({ target: { value: '-100' } });

            getNestedTable().update();
            break;
          case 'volume_mass':
            getNestedTable().find('BodyCell').at(10).find('TextInput')
              .props()
              .onChange({ target: { value: '0' } });

            getNestedTable().find('BodyCell').at(11).find('TextInput')
              .props()
              .onChange({ target: { value: '-100' } });

            getNestedTable().update();
            break;
          case 'barcode':
            setGroupRequiredFields();

            getNestedTable().find('BodyCell').at(12).find('TextInput')
              .props()
              .onChange({ target: { name: 'barcode', value: '' } });
            getNestedTable().update();
            break;
          case 'label':
            getNestedTable().find('BodyCell').at(4).find('TextInput')
              .props()
              .onChange({ target: { value: 'lol/d', name: 'label' } });

            getNestedTable().update();
            break;
          case 'lot no':
            wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
              {
                id: 'omatc3',
                material_idx: 0,
                form_idx: 0,
                name: 'TestChemicalResource1',
                sku: 'sku1',
                lot_no: { value: null, isValid: true }
              },
              {
                id: 'omatc4',
                material_idx: 0,
                form_idx: 1,
                name: 'TestChemicalResource1',
                sku: 'sku1',
                lot_no: { value: null, isValid: true }
              },
              {
                id: 'omatc5',
                material_idx: 1,
                form_idx: 0,
                name: 'TestChemicalResource2',
                sku: 'sku2',
                lot_no: { value: null, isValid: true }
              },
              {
                id: 'omatc6',
                material_idx: 1,
                form_idx: 1,
                name: 'TestChemicalResource1',
                sku: 'sku2',
                lot_no: { value: null, isValid: true }
              }
            ]), 'lot_no');

            wrapper.update();

            wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');
            break;
        }
      };

      it('should call validateBarcodes on barcode change', () => {
        const validateBarcodesStub = sandbox.stub(ContainerActions, 'validateBarcodes').returns({
          done: () => {
            return { fail: () => ({}) };
          }
        });
        expect(validateBarcodesStub.called).to.be.false;
        setGroupRequiredFields();
        expect(validateBarcodesStub.called).to.be.true;
      });

      it('should have rows with validation errors highlighted in red for group materials', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { name: 'volume_per_container', value: '-100' } });
        getNestedTable().update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('List').props().rowColorMap.omatc3).to.deep.equal('danger');
        const rows = wrapper.find('Row').filterWhere(row => row.props().color === 'danger');
        expect(rows.length).to.equal(3);
        expect(rows.at(0).key()).to.equal('row-ko1');
        expect(rows.at(1).key()).to.equal('expanded-row-ko1');
        expect(rows.at(2).key()).to.equal('row-omatc3');
      });

      it('should have cells with invalid label having , or / outlined in red for group materials', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(4).find('TextInput')
          .props()
          .onChange({ target: { value: 'lol/d', name: 'label' } });
        getNestedTable().update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(4).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(4).find('Tooltip')
          .props().title).to.equal('Character \'/\' not allowed');

        getNestedTable().find('BodyCell').at(4).find('TextInput')
          .props()
          .onChange({ target: { value: 'lol,d', name: 'label' } });
        getNestedTable().update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(4).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(4).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(4).find('Tooltip')
          .props().title).to.equal('Comma not allowed');

      });

      it('should have cells with invalid volume outlined in red for group materials', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { value: '-100' } });
        getNestedTable().update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(10).find('Tooltip')
          .props().title).to.equal('Must be between 0μl and 3500μl');
      });

      it('should have cells with volume and mass both having value 0 outlined in red for group materials and display error message', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { value: '0' } });
        getNestedTable().update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(10).find('Tooltip')
          .props().title).to.equal('Must specify either volume or mass');
        expect(getNestedTable().find('BodyCell').at(11).find('Tooltip')
          .props().title).to.equal('Must specify either volume or mass');
      });

      it('should have cells with empty lot no outlined in red for group materials', () => {
        setGroupRequiredFields();
        wrapper.find('MultiRowEditorModal').at(4).props().onSubmit(Immutable.fromJS([
          {
            id: 'omatc3',
            material_idx: 0,
            form_idx: 0,
            name: 'TestChemicalResource1',
            sku: 'sku1',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc4',
            material_idx: 0,
            form_idx: 1,
            name: 'TestChemicalResource1',
            sku: 'sku1',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc5',
            material_idx: 1,
            form_idx: 0,
            name: 'TestChemicalResource2',
            sku: 'sku2',
            lot_no: { value: null, isValid: true }
          },
          {
            id: 'omatc6',
            material_idx: 1,
            form_idx: 1,
            name: 'TestChemicalResource1',
            sku: 'sku2',
            lot_no: { value: null, isValid: true }
          }
        ]), 'lot_no');
        wrapper.update();
        wrapper.find('ButtonGroup').find('Button').at(1).simulate('click');

        expect(getNestedTable().find('BodyCell').at(6).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(19).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(6).find('Tooltip')
          .at(0)
          .props().title).to.equal('Must be specified');
        expect(getNestedTable().find('BodyCell').at(19).find('Tooltip')
          .at(0)
          .props().title).to.equal('Must be specified');
        expect(getNestedTable().find('BodyCell').at(6).find('Tooltip')
          .at(0)
          .props().placement).to.equal('bottom');
        expect(getNestedTable().find('BodyCell').at(19).find('Tooltip')
          .at(0)
          .props().placement).to.equal('bottom');
        expect(getNestedTable().find('BodyCell').at(6).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(19).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(6).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(19).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(6).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(19).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(19).find('Tooltip')
          .props().title).to.equal('Must be specified');
      });

      it('should have cells with invalid mass outlined in red for group materials', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(11).find('TextInput')
          .props()
          .onChange({ target: { value: '-100' } });
        getNestedTable().update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(11).find('Tooltip')
          .props().title).to.equal('Must be between 0mg and 7000mg');
      });

      it('should have cells with invalid barcodes outlined in red for group materials', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props()
          .onChange({ target: { name: 'barcode', value: '' } });
        getNestedTable().update();

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(12).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(12).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(12).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(12).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(12).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
      });

      it('should have containerType field with retired container type outlined in red for group materials', () => {
        wrapper
          .find('ContainerTypeSelectorModal')
          .props()
          .onSelect(
            Immutable.fromJS({
              id: 'pcr-0.5',
              name: '0.5mL PCR tube',
            })
          );
        wrapper.update();
        expect(
          getNestedTable().find('BodyCell')
            .at(5)
            .props()
            .highlight
        ).to.equal('danger');
        expect(
          getNestedTable().find('BodyCell').at(5).find('Tooltip')
            .at(0)
            .props()
            .title
        ).to.equal('container type pcr-0.5 is retired');
      });

      it('should not have containerType field in red, when a non retired container type is selected for group materials', () => {
        wrapper
          .find('ContainerTypeSelectorModal')
          .props()
          .onSelect(
            Immutable.fromJS({
              id: '50ml-conical',
              name: '50mL Conical',
            })
          );
        wrapper.update();
        expect(getNestedTable().find('BodyCell').at(7).props().highlight).to.not.equal(
          'danger'
        );
      });

      it('should highlight duplicated rows with validation errors for group materials and remove highlight after row gets correction ', () => {
        const firstNestedTable = wrapper.find('Row').at(2).find('Table');
        const secondNestedTable = wrapper.find('Row').at(7).find('Table');

        firstNestedTable.props().onSelectRow(null, null, { omatc3: true });
        secondNestedTable.props().onSelectRow(null, null, { omatc5: true });
        setGroupRequiredFields();

        wrapper.find('ActionMenu').find('button').at(0).simulate('click');
        wrapper.find('ActionMenu').find('.input-suggestions__suggestion').at(6).simulate('click');

        wrapper.find('BodyCell').at(44).find('TextInput').simulate('change', { target: { value: '-221' } });
        wrapper.find('BodyCell').at(104).find('TextInput').simulate('change', { target: { value: '-22' } });

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(wrapper.find('BodyCell').at(44).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(44).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(44).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(44).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(wrapper.find('BodyCell').at(104).props().highlight).to.equal('danger');
        expect(wrapper.find('BodyCell').at(104).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(wrapper.find('BodyCell').at(104).find('Icon').at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(wrapper.find('BodyCell').at(104).find('Icon').at(0)
          .props().className).to.equal('left-aligned-icon');
        wrapper.find('BodyCell').at(104).find('TextInput').simulate('change', { target: { value: '22' } });
        expect(wrapper.find('BodyCell').at(104).find('td').at(0)
          .hasClass('amino-table__cell--danger')).to.be.false;
        // Cannot validate row highlight due to useEffect issue,have to find fix.

      });

      it('should bulk paste and validate values in Label, lot no, Volume, Mass, Barcode fields across rows', () => {
        const getDataStub = sandbox.stub().returns('123\n456 789\n1011');
        const event = {
          clipboardData: { getData: getDataStub },
          preventDefault: () => {}
        };
        setGroupRequiredFields();

        const validateResults = (fieldName, pasteFieldIndex, results) => {
          const field = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === fieldName);
          field.at(pasteFieldIndex).props().onPaste(event);
          wrapper.update();
          const updatedField = wrapper.find('TextInput').filterWhere(textInput => textInput.prop('name') === fieldName);
          results.forEach((result, index) => {
            expect(updatedField.at(index).props().value).to.equal(result);
            expect(updatedField.at(index).hasClass('amino-table__cell--danger')).to.be.false;
          });
        };
        validateResults('label', 0, ['123', '456 789', '1011']);
        validateResults('lot_no', 1, ['123', '123', '456 789']);
        validateResults('volume_per_container', 2, ['221', '22', '123']);
        validateResults('mass_per_container', 0, ['123', '456 789', '1011']);
        validateResults('barcode', 0, ['123', '456 789', '1011']);
      });

      it('should not have error for barcode when we bulk set the valid barcode', () => {
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(
            Immutable.fromJS([
              {
                id: 'omatc3',
                material_idx: 0,
                form_idx: 0,
                barcode: { value: 'unique1', isValid: true },
                location: null,
                name: 'ian-b',
              },
              {
                id: 'omatc4',
                material_idx: 0,
                form_idx: 1,
                barcode: { value: 'unique2', isValid: true },
                location: null,
                name: 'ian-b',
              }
            ]), 'barcode');
        wrapper.update();
        nestedTable.update();
        expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props().validated.hasError).to.equal(false);
        expect(getNestedTable().find('BodyCell').at(25).find('TextInput')
          .props().validated.hasError).to.equal(false);
      });

      it('should have rows with validation errors highlighted in red when volume exceeds the container_type capacity', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { value: '100000' } });

        getNestedTable().update();
        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(10).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');
        expect(getNestedTable().find('BodyCell').at(10).find('Tooltip')
          .props().title).to.equal('Must be between 0μl and 3500μl');
      });

      it('should have rows with validation errors highlighted in red when mass exceeds the container_type capacity', () => {
        setGroupRequiredFields();
        getNestedTable().find('BodyCell').at(11).find('TextInput')
          .props()
          .onChange({ target: { value: '200000' } });
        getNestedTable().update();

        expect(getNestedTable().find('BodyCell').at(11).props().highlight).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--danger')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('td')
          .at(0)
          .hasClass('amino-table__cell--inline')).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('TextInput')
          .props().validated.hasError).to.be.true;
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().icon).to.equal('far fa-exclamation-circle');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().color).to.equal('danger');
        expect(getNestedTable().find('BodyCell').at(11).find('Icon')
          .at(0)
          .props().className).to.equal('left-aligned-icon');

        expect(getNestedTable().find('BodyCell').at(11).find('Tooltip')
          .props().title).to.equal('Must be between 0mg and 7000mg');
      });

      it('should validate all barcodes whether it is selected or not', () => {
      // select one omc
        nestedTable.props().onSelectRow(null, null, { omatc4: true });
        wrapper.update();
        wrapper
          .find('MultiRowEditorModal').at(0)
          .props()
          .onSubmit(
            Immutable.fromJS([
              {
                id: 'omatc4',
                material_idx: 0,
                form_idx: 1,
                barcode: { value: 'unique2', isValid: true },
                location: null,
                name: 'ian-b',
              }
            ]), 'barcode');
        wrapper.update();
        expect(getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props().validated.hasError).to.equal(false);
        expect(getNestedTable().find('BodyCell').at(25).find('TextInput')
          .props().validated.hasError).to.equal(false);
      });

      it('should bulk paste and validate values in Label field across rows', async () => {
        const getDataStub = sandbox.stub().returns('label1,\nlabel2');
        const event = {
          clipboardData: { getData: getDataStub },
          preventDefault: () => {}
        };
        getNestedTable().find('Row').at(1).find('BodyCell')
          .at(4)
          .find('TextInput')
          .props()
          .onPaste(event);
        await wrapper.update();

        const assertLabelAtRow = (rowIndex, value, expectedHighlight = undefined, errorMessage = undefined) => {
          const bodyCell = getNestedTable().find('Row').at(rowIndex)
            .find('BodyCell')
            .at(4);
          expect(bodyCell.props().highlight).to.equal(expectedHighlight);
          expect(bodyCell.find('TextInput').props().value).to.equal(value);
          expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--inline')).to.be.true;
          if (expectedHighlight === 'danger') {
            expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--danger')).to.be.true;
            expect(bodyCell.find('Icon').at(0).props().icon).to.equal('far fa-exclamation-circle');
            expect(bodyCell.find('Icon').at(0).props().className).to.equal('left-aligned-icon');
            expect(bodyCell.find('Tooltip').props().title).to.equal(errorMessage);
          } else {
            expect(bodyCell.find('td').at(0).hasClass('amino-table__cell--danger')).to.be.false;
            expect(bodyCell.find('Icon').length).to.equal(0);
            expect(bodyCell.find('Tooltip').length).to.equal(0);
          }
        };

        expect(wrapper.find('ButtonGroup').find('Button').at(1).props().disabled).to.be.true;
        assertLabelAtRow(1, 'label1,', 'danger', 'Comma not allowed');
        assertLabelAtRow(2, 'label2');
      });

      it('should have a toggle to filter orders without error', () => {
        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).find(Toggle).length).to.equal(1);
        expect(wrapper.find(List).find(Toggle).props().name).to.equal('list-toggle-filter');
        expect(wrapper.find(List).find(Toggle).props().value).to.equal('on');
        expect(wrapper.find(List).find(Toggle).props().size).to.equal('large');
        expect(wrapper.find(List).props().data.size).to.equal(0);
        expect(wrapper.find(List).props().emptyMessage).to.equal('No Records With Error Found');
      });

      it('should display only orders with error for volume errors if the toggle switch is on', () => {
        simulateGroupFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger',
          omatc3: 'danger'
        });
      });

      it('should display only orders with error for mass errors if the toggle switch is on', () => {
        simulateGroupFormError('mass');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger',
          omatc3: 'danger'
        });
      });

      it('should display only orders with error for volume and mass errors if both 0', () => {
        simulateGroupFormError('volume_mass');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger',
          omatc3: 'danger'
        });
      });

      it('should display only orders with error for label errors if the toggle switch is on', () => {
        simulateGroupFormError('label');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          ko1: 'danger',
          omatc3: 'danger'
        });
      });

      it('should display only orders with error for lot no errors if the toggle switch is on', () => {
        simulateGroupFormError('lot no');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(2);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          omatc3: 'danger',
          ko1: 'danger',
          omatc4: 'danger',
          omatc5: 'danger',
          ko2: 'danger',
          omatc6: 'danger'
        });
      });

      it('should display only orders with error for barcode errors if the toggle switch is on', () => {
        simulateGroupFormError('barcode');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          omatc3: 'danger',
          ko1: 'danger',
          omatc4: undefined,
          omatc5: undefined,
          ko2: undefined,
          omatc6: undefined
        });
      });

      it('should display only orders with error for pasted values if the toggle switch is on', () => {
        const getDataStub1 = sandbox.stub().returns('*');
        const getDataStub2 = sandbox.stub().returns('valid12');
        const event1 = {
          clipboardData: { getData: getDataStub1 },
          preventDefault: () => {}
        };
        const event2 = {
          clipboardData: { getData: getDataStub2 },
          preventDefault: () => {}
        };

        getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props()
          .onPaste(event1);
        getNestedTable().update();

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        expect(wrapper.find(List).props().rowColorMap).to.eql({
          omatc3: 'danger',
          ko1: 'danger'
        });

        getNestedTable().find('BodyCell').at(12).find('TextInput')
          .props()
          .onPaste(event2);
        getNestedTable().update();

        expect(wrapper.find(List).props().data.size).to.equal(0);
      });

      it('should disable or enable toggle depending on error and toggle states', () => {
        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(true);

        simulateGroupFormError('volume');

        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(false);

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        wrapper.find('BodyCell').at(12).find('TextInput').simulate('change', { target: { value: '100' } });
        wrapper.update();

        expect(wrapper.find(List).find(Toggle).props().readOnly).to.equal(false);
      });

      it('should have rows with error disappear from view when error has been resolved', () => {
        const clock = sandbox.useFakeTimers();

        simulateGroupFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { value: '100' } });

        clock.tick(debounceTime);

        getNestedTable().update();

        expect(wrapper.find(List).props().data.size).to.equal(0);
        expect(wrapper.find(List).props().emptyMessage).to.equal('No Records With Error Found');
      });

      it('should not have rows with error disappear from view when error has been resolved until debounced time passed', () => {
        const clock = sandbox.useFakeTimers();

        simulateGroupFormError('volume');

        wrapper.find(List).find(Toggle).props().onChange({ target: { value: 'on' } });
        wrapper.update();

        getNestedTable().find('BodyCell').at(10).find('TextInput')
          .props()
          .onChange({ target: { value: '100' } });
        getNestedTable().update();

        expect(wrapper.find(List).props().data.size).to.equal(1);
        clock.tick(debounceTime);
      });
    });
  });

  const assertLabCallSuccess = () => {
    expect(labAPIStub.calledOnce).to.be.true;
    expect(labAPIStub.args[0][0]).deep.equal(['lab1', 'lab2']);
  };

  const assertLocationCallSuccess = () => {
    expect(locationAPIStub.calledOnce).to.be.true;
    expect(locationAPIStub.args[0][0]).deep.equal(['loc1', 'loc2']);
  };

  const assertMaterialOrderFailNotification = async (data) => {
    const notificationSpy = sandbox.spy(NotificationActions, 'handleError');
    orderableMaterialIndexStub.throws();
    wrapper = await createWrapperAndAwaitReady(data);
    expect(notificationSpy.calledOnce).to.be.true;
  };
});
