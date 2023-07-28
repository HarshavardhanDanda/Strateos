import React from 'react';
import PropTypes from 'prop-types';
import { Link, matchPath } from 'react-router-dom';
import Immutable from 'immutable';
import _ from 'lodash';
import {
  ZeroState,
  Page,
  Breadcrumbs,
  Card,
  Section,
  Button,
  ButtonGroup,
  Spinner,
  Validated
} from '@transcriptic/amino';
import * as UnitUtil from 'main/util/unit';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import ResourceSelectorModal from 'main/components/Resources/ResourceSelectorModal';
import Urls from 'main/util/urls';
import CategoryActions from 'main/actions/CategoryActions';
import MaterialStore from 'main/stores/MaterialStore';
import SessionStore from 'main/stores/SessionStore';
import NotificationActions from 'main/actions/NotificationActions';
import ModalActions from 'main/actions/ModalActions';
import CompoundResourceSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundResourceSelectorModal';
import MaterialActions from 'main/actions/MaterialActions';
import VendorActions from 'main/actions/VendorActions';
import MaterialAPI from 'main/api/MaterialAPI';
import AddResourceModal from 'main/pages/ResourcesPage/modals/AddResourceModal';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import LabConsumerStore from 'main/stores/LabConsumerStore';
import MaterialHeader from './MaterialHeader';
import MaterialItem from './MaterialItem';
import MaterialType from './MaterialType';
import OrderableMaterialComponentStockModal from '../OrderableMaterialComponentStockModal/OrderableMaterialComponentStockModal';

import './MaterialDetailsPage.scss';

const MATERIAL_INCLUDES_FIELDS = [
  'vendor',
  'supplier',
  'organization',
  'categories',
  'orderable_materials.orderable_material_components',
  'material_components.resource',
  'material_components.orderable_material_components',
  'orderable_materials.orderable_material_components.container_type'
];

class MaterialDetailsPage extends React.Component {
  constructor(props) {
    super(props);
    const { materialId, mode } = this.getIdAndMode(this.props.match.params);

    this.state = {
      loading: false,
      categories: [],
      vendors: [],
      mode: mode,
      materialId: materialId,
      statusCode: undefined,
      groupMaterial: this.newGroupMaterial(),
      individualMaterials: Immutable.List(),
      materialType: 'individual',
      isFormValid: mode !== 'new',
      forceValidation: false
    };

    this.addIndividualMaterial = this.addIndividualMaterial.bind(this);
    this.onSaveSuccess = this.onSaveSuccess.bind(this);
    this.onDeleteSuccess = this.onDeleteSuccess.bind(this);
    this.onSaveFail = this.onSaveFail.bind(this);
  }

  componentWillMount() {
    this.unlisten = this.routeParamsListener();

    const { materialId } = this.state;

    this.loadCategories();
    this.loadVendors();

    if (materialId) {
      this.loadMaterial(materialId);
    }
  }

  componentWillUnmount() {
    this.unlisten();
  }

  routeParamsListener() {
    return this.props.history.listen(({ pathname }) => {
      const match = matchPath(pathname, {
        path: this.props.match.path
      });

      if (match) {
        this.setState({
          ...this.getIdAndMode(match.params)
        });
      }
    });
  }

  getIdAndMode(params) {
    const { materialId, mode } = params;
    return {
      materialId,
      mode: materialId ? (mode === 'edit' ? mode : 'view') : 'new'
    };
  }

  loadCategories() {
    CategoryActions.loadCategories()
      .done((categories) => {
        this.setState({
          categories
        });
      });
  }

  loadVendors() {
    VendorActions.getVendorsList()
      .done((data) => {
        const vendors = _.sortBy(data.results, vendor => vendor.name.toLowerCase());
        this.setState({ vendors });
      });
  }

  loadMaterial(id, refresh = true) {
    this.setState({ loading: true }, () => {
      const options = { includes: MATERIAL_INCLUDES_FIELDS };
      const material = MaterialStore.getById(id);

      if (material) {
        this.setMaterialState(material);
      }

      if (refresh) {
        MaterialAPI.get(id, options).done(() => {
          const material =  MaterialStore.getById(id);
          this.setMaterialState(material);
        })
          .fail((error) => this.setState({ statusCode: error.status }));
      }
    });
  }

  setMaterialState(material) {
    this.setState({
      materialType: material.get('material_type')
    }, () => {
      if (this.isGroupMaterial()) {
        this.setState({
          groupMaterial: this.normalizeGroupMaterial(material),
          loading: false
        });
      } else {
        this.setState({
          individualMaterials: this.normalizeIndividualMaterials(material),
          loading: false
        }, () => this.verifyDisplayId(material));
      }
    });
  }

  newGroupMaterial() {
    return Immutable.fromJS({
      name: '',
      material_type: 'group',
      components: Immutable.List(),
      categories: Immutable.List(),
      is_private: true
    });
  }

  newIndividualMaterial(resource) {
    return Immutable.fromJS({
      material_type: 'individual',
      components: Immutable.List(),
      categories: Immutable.List(),
      container_type_id: '',
      is_private: true,
      name: resource.get('name'),
      resource,
      volume_per_container: 0,
      mass_per_container: 0,
      vol_measurement_unit: 'µL',
      mass_measurement_unit: 'mg',
      provisionable: false,
      reservable: false,
      dispensable: false,
      indivisible: false,
      no_of_units: 1
    });
  }

  onClickCheckIn(omId) {
    this.props.history.push({
      pathname: Urls.material_orders_checkin_page(),
      data: [Immutable.fromJS({ order: null, orderableMaterialId: omId })]
    });
  }

  newGroupComponent(resource, orderableMaterial) {
    return Immutable.Map({
      resource,
      name: resource.get('name'),
      volume_per_container: 0,
      mass_per_container: 0,
      vol_measurement_unit: 'µL',
      mass_measurement_unit: 'mg',
      provisionable: false,
      reservable: false,
      dispensable: false,
      indivisible: false,
      no_of_units: 1,
      omId: orderableMaterial.get('id'),
    });
  }

  verifyDisplayId(material) {
    const materialId = material.get('id');
    if (materialId !== this.state.materialId) {
      this.props.history.replace({ pathname: Urls.edit_material(materialId) });
    }
  }

  formatPrice(price) {
    return parseFloat(price).toFixed(2);
  }

  /**
   * Normalizes group material properties into an object to avoid duplication of properties.
   * Adds shared properties (price, tier, sku, margin) to top-level of material object.
   */
  normalizeGroupMaterial(material) {
    const orderableMaterial = material.getIn(['orderable_materials', 0], Immutable.Map());
    const cost = this.formatPrice(orderableMaterial.get('price'), 0);
    const sku = orderableMaterial.get('sku');
    const tier = orderableMaterial.get('tier');
    const margin = orderableMaterial.get('margin');

    const components = orderableMaterial.getIn(['orderable_material_components'], Immutable.List())
      .map((orderableMaterialComponent) => {
        const materialComponent = material.get('material_components', Immutable.List())
          .find(mc => mc.get('orderable_material_components')
            .map(omc => omc.get('id'))
            .includes(orderableMaterialComponent.get('id'))
          );
        const resource = materialComponent.get('resource');
        orderableMaterialComponent = orderableMaterialComponent.set('container_type_id', orderableMaterialComponent.getIn(['container_type', 'id']))
          .delete('container_type');

        return this.normalizeGroupComponent(
          materialComponent,
          orderableMaterial,
          orderableMaterialComponent,
          resource
        );
      });

    return this.newGroupMaterial()
      .merge(material)
      .merge({
        cost,
        sku,
        tier,
        margin
      })
      .delete('material_components')
      .delete('orderable_materials')
      .set('components', components);
  }

  /**
   * Normalizes group material component properties into an object.
   * Removes shared properties (price, tier, sku, margin) that are in top-level of material object.
   */
  normalizeGroupComponent(materialComponent, orderableMaterial, orderableMaterialComponent, resource) {
    return this.newGroupComponent(resource, orderableMaterial)
      .merge(
        orderableMaterialComponent
          .delete('type')
      )
      .merge({
        id: orderableMaterialComponent.get('id'),
        omcId: orderableMaterialComponent.get('id'),
        material_component_id: materialComponent.get('id'),
        material_component_concentration: materialComponent.get('concentration') ? UnitUtil.convertUnitShorthandToName(materialComponent.get('concentration')) : undefined,
        container_type_id: orderableMaterialComponent.get('container_type_id'),
        name: orderableMaterialComponent.get('name'),
        vol_measurement_unit: 'µL',
        mass_measurement_unit: 'mg',
      });
  }

  /**
   * Normalizes individual material properties into an object to avoid duplication of properties.
   * Adds shared properties (resource, tier, provisionable, reservable, indivisible, dispensable) to top-level of material object.
   */
  normalizeIndividualMaterials(material) {
    const materialComponent = material.getIn(['material_components', 0]);
    const resource = materialComponent.get('resource');
    const containerTypeId = material.getIn(['orderable_materials', 0, 'orderable_material_components', 0, 'container_type', 'id'], '');
    const tier = material.getIn(['orderable_materials', 0, 'tier']);
    const provisionable = material.getIn(['orderable_materials', 0, 'orderable_material_components', 0, 'provisionable']);
    const reservable = material.getIn(['orderable_materials', 0, 'orderable_material_components', 0, 'reservable']);
    const indivisible = material.getIn(['orderable_materials', 0, 'orderable_material_components', 0, 'indivisible']);
    const dispensable = material.getIn(['orderable_materials', 0, 'orderable_material_components', 0, 'dispensable']);

    const components = material.get('orderable_materials', Immutable.List())
      .map((orderableMaterial) => {
        const orderableMaterialComponent = orderableMaterial.getIn(['orderable_material_components', 0]);

        return this.normalizeIndividualCostComponent(
          materialComponent,
          orderableMaterial,
          orderableMaterialComponent
        );
      });

    material = this.newIndividualMaterial(resource)
      .merge(material)
      .merge({
        resource,
        tier,
        provisionable,
        reservable,
        indivisible,
        dispensable
      })
      .delete('material_components')
      .delete('orderable_materials')
      .set('components', components)
      .set('container_type_id', containerTypeId);

    return Immutable.List([material]);
  }

  /**
   * Normalizes individual material cost row component properties into an object
   * Removes shared properties (resource, tier, provisionable, reservable, indivisible, dispensable) that are in top-level of material object.
   */
  normalizeIndividualCostComponent(materialComponent, orderableMaterial, orderableMaterialComponent) {
    const isVolume = orderableMaterialComponent.get('volume_per_container') || !orderableMaterialComponent.get('mass_per_container');

    const amount = isVolume
      ? orderableMaterialComponent.get('volume_per_container')
      : orderableMaterialComponent.get('mass_per_container');

    const unit = isVolume ? 'µL' : 'mg';

    return Immutable.fromJS({})
      .merge(
        orderableMaterial
      )
      .merge(
        orderableMaterialComponent
      )
      .merge({
        id: orderableMaterialComponent.get('id'),
        omId: orderableMaterial.get('id'),
        omcId: orderableMaterialComponent.get('id'),
        material_component_id: materialComponent.get('id'),
        material_component_concentration:  materialComponent.get('concentration')
      })
      .merge({
        cost: this.formatPrice(orderableMaterial.get('price', 0)),
        sku: orderableMaterial.get('sku'),
        unit: unit,
        amount: amount
      })
      .delete('orderable_material_components')
      .delete('tier')
      .delete('dispensable')
      .delete('provisionable')
      .delete('reservable')
      .delete('indivisible')
      .delete('no_of_units')
      .delete('type');
  }

  confirm(message) {
    return confirm(message);
  }

  deleteGroupComponent(component, index) {
    if (this.confirm(`Delete material item ${component.getIn(['resource', 'name'])}?`)) {
      const components = this.state.groupMaterial.get('components').delete(index);
      const material = this.state.groupMaterial.set('components', components);
      this.setState({
        groupMaterial: material
      }, () => this.setFormValidState());
    }
  }

  deleteMaterial(material, index) {
    if (this.isNewMaterial()) {
      this.setState({
        individualMaterials: this.state.individualMaterials.delete(index)
      });
      return;
    }

    const CONFIRMED = this.confirm(`Are you sure you would like to delete multiple price points associated to material "${material.get('name')}"?`);

    if (CONFIRMED) {
      MaterialActions.destroyDependent(this.state.materialId)
        .done(this.onDeleteSuccess)
        .fail((...response) => this.onSaveFail(null, ...response));
    }
  }

  materialSaveFormat(material) {
    const { id, ...attributes } = material.toJS();

    return id ? { id, ...attributes } : { ...attributes };
  }

  /**
   * Converts material object and its components back to format expected by server.
   */
  groupMaterialSaveFormat(material) {
    const orderableMaterial = this.groupComponentsToOrderableMaterial(material);
    material = this.materialKeys(
      material
        .merge({
          id: material.get('id'),
          vendor_id: material.getIn(['vendor', 'id']),
          supplier_id: material.getIn(['supplier', 'id']),
          orderable_materials: Immutable.List([orderableMaterial]),
          category_ids: material.get('categories').map(category => category.get('id')),
          note: material.get('note')
        })
    );

    return material;
  }

  /**
   * This function removes materila_component_concentration when concentration is not set.
   * This scenario occurs when we update a component for which concentration is already set.
   */
  handleMaterialComponentConcentrationField(component, isConcentrationSetNow) {
    if (!isConcentrationSetNow) {
      return component.delete('material_component_concentration');
    }
    return component;
  }

  groupComponentsToOrderableMaterial(material) {
    const omcs = material.get('components').map((component) =>
      this.orderableMaterialComponentKeys(
        material
          .merge(this.handleMaterialComponentConcentrationField(component, component.get('isConcentrationSetNow')))
          .merge({
            id: component.get('omcId'),
            material_component: {
              resource_id: component.getIn(['resource', 'id'])
            },
            ...(
              component.get('isConcentrationSetNow') &&
                  {
                    material_component_concentration: UnitUtil.convertLongUnitToShortUnit(component.get('material_component_concentration'))

                  }

            ),
          })

      )
    );

    return this.orderableMaterialKeys(
      material
        .merge({
          id: material.getIn(['components', 0, 'omId']),
          price: material.get('cost'),
          orderable_material_components: omcs
        })
    );
  }

  /**
   * Converts material object and its cost components back to format expected by server.
   */
  individualMaterialSaveFormat(material) {
    const orderableMaterials = material.get('components').map((component) =>
      this.individualComponentToOrderableMaterial(material, component)
    );
    material = this.materialKeys(
      material
        .merge({
          id: material.get('id'),
          vendor_id: material.getIn(['vendor', 'id']),
          supplier_id: material.getIn(['supplier', 'id']),
          orderable_materials: orderableMaterials,
          category_ids: material.get('categories').map(category => category.get('id')),
          note: material.get('note')
        })
    );

    return material;
  }

  individualComponentToOrderableMaterial(material, component) {
    const orderableMaterial = material
      .merge(component)
      .merge({
        id: component.get('omId'),
        price: component.get('cost'),
        orderable_material_components: Immutable.List([
          this.orderableMaterialComponentKeys(
            material
              .merge(this.handleMaterialComponentConcentrationField(component, material.get('isConcentrationSetNow')))
              .merge({
                id: component.get('omcId'),
                material_component: {
                  resource_id: material.getIn(['resource', 'id'])
                },
                ...(
                  component.get('unit') == 'µL' ?
                    {
                      volume_per_container: component.get('amount'),
                      mass_per_container: 0
                    } :
                    {
                      mass_per_container: component.get('amount'),
                      volume_per_container: 0
                    }
                ),
                ...(
                  material.get('material_component_concentration') &&
                  {
                    material_component_concentration: UnitUtil.convertLongUnitToShortUnit(material.get('material_component_concentration'))
                  }
                ),
                vol_measurement_unit: 'µL',
                mass_measurement_unit: 'mg',
              })
          )
        ])
      });
    return this.orderableMaterialKeys(orderableMaterial);
  }

  doesConcentrationValueExist(concentrationValueWithUnit) {

    if (!concentrationValueWithUnit) {
      return false;
    }

    const [value] = concentrationValueWithUnit.split(/:/);

    if (value.length === 0) {
      return false;
    }

    return true;
  }

  getGroupMaterialsSaveFormat() {
    let material = this.state.groupMaterial;
    material = this.groupMaterialSaveFormat(material);
    return [this.materialSaveFormat(material)];
  }

  getIndividualMaterialsSaveFormat() {
    return this.state.individualMaterials.map((material) => {
      material = this.individualMaterialSaveFormat(material);
      return this.materialSaveFormat(material);
    }).toJS();
  }

  orderableMaterialKeys(orderableMaterial) {
    const SHARED_KEYS = ['sku', 'tier', 'margin', 'price', 'orderable_material_components'];
    const keys = orderableMaterial.get('id') ? [...SHARED_KEYS, 'id'] : SHARED_KEYS;

    return this.filterAllowedProperties(orderableMaterial, keys);
  }

  orderableMaterialComponentKeys(orderableMaterialComponent) {
    const SHARED_KEYS = ['volume_per_container', 'mass_per_container', 'vol_measurement_unit', 'mass_measurement_unit', 'no_of_units', 'provisionable', 'reservable', 'indivisible', 'dispensable', 'container_type_id', ...(this.isGroupMaterial() && ['name'])];
    const keys = orderableMaterialComponent.get('id') ? [...SHARED_KEYS, 'id', 'material_component_id'] : [...SHARED_KEYS, 'material_component'];

    if (this.doesConcentrationValueExist(orderableMaterialComponent.get('material_component_concentration')) === true) {
      keys.push('material_component_concentration');
    }
    return this.filterAllowedProperties(orderableMaterialComponent, keys);
  }

  materialKeys(material) {
    const SHARED_KEYS = ['name', 'material_type', 'url', 'note', 'is_private', 'vendor_id', 'supplier_id', 'category_ids', 'orderable_materials'];
    const keys = material.get('id') ? [...SHARED_KEYS, 'id'] : SHARED_KEYS;

    return this.filterAllowedProperties(material, keys);
  }

  filterAllowedProperties(map, allowedKeys) {
    return map.filter((value, key) => allowedKeys.includes(key) && !_.isNil(value));
  }

  setFormValidState() {
    this.setState({ isFormValid: this.isFormValid(this.state) });
  }

  isEmpty(value) {
    return !value;
  }

  isCostTableContainsRequiredFields(materials) {
    return !materials.some(material =>
      material.get('components').some(costDetail =>
        (_.toNumber(costDetail.get('amount')) <= 0) || this.isEmpty(costDetail.get('cost')) || (_.toNumber(costDetail.get('cost')) <= 0))
    );
  }

  isFormValid(state) {
    if (this.isGroupMaterial()) {
      const name = state.groupMaterial.get('name');
      const vendorID = state.groupMaterial.getIn(['vendor', 'id']);
      const cost = state.groupMaterial.get('cost');
      const components = state.groupMaterial.get('components');
      if (this.isEmpty(name) || this.isEmpty(vendorID) || this.isEmpty(cost) || !components.size || _.toNumber(cost) <= 0) {
        return false;
      }
      const isAnyComponentInvalid = components.some((component) => {
        const volume = component.get('volume_per_container');
        const mass = component.get('mass_per_container');
        const containerTypeId = component.get('container_type_id');
        const convertedConcentrationValue = this.getConcentrationValue(component.get('material_component_concentration'));
        return ((!volume && !mass && !convertedConcentrationValue)  || (mass < 0 || volume < 0) || convertedConcentrationValue < 0  || this.isEmpty(containerTypeId));
      });
      return !isAnyComponentInvalid;
    } else {
      const isFormValid = state.individualMaterials.some(material => {
        const convertedConcentrationValue = this.getConcentrationValue(material.get('material_component_concentration'));
        return !(
          this.isEmpty(material.get('name')) || this.isEmpty(material.getIn(['vendor', 'id'])) || this.isEmpty(material.get('container_type_id')) ||  (convertedConcentrationValue && convertedConcentrationValue < 0)
        );
      });
      return isFormValid && !this.isEmptyCostTable(state) && this.isCostTableContainsRequiredFields(state.individualMaterials);
    }
  }

  getConcentrationValue = (materialComponentConcentration) => {
    if (materialComponentConcentration) {
      const  [concentration] = materialComponentConcentration.split(/:/);
      return concentration;
    }

  };

  create(next) {
    const materials = this.isGroupMaterial() ? this.getGroupMaterialsSaveFormat() : this.getIndividualMaterialsSaveFormat();

    const options = { includes: MATERIAL_INCLUDES_FIELDS };

    MaterialActions.bulkCreate(materials, options)
      .done(() => this.onCreateSuccess(next))
      .fail((...response) => this.onSaveFail(next, ...response));
  }

  save(next) {
    const materials = this.isGroupMaterial() ? this.getGroupMaterialsSaveFormat() : this.getIndividualMaterialsSaveFormat();

    const options = { includes: MATERIAL_INCLUDES_FIELDS };

    MaterialActions.update(materials[0], options)
      .done(() => this.onSaveSuccess(next, materials[0].id))
      .fail((...response) => this.onSaveFail(next, ...response));
  }

  onSaveSuccess(next, id) {
    if (next) next();
    this.loadMaterial(id, false);
    NotificationActions.createNotification({ text: 'Material updated!' });
  }

  onCreateSuccess(next) {
    next();
    NotificationActions.createNotification({ text: 'Material created!' });
    this.props.history.replace({ pathname: Urls.material_page() });
  }

  onDeleteSuccess() {
    NotificationActions.createNotification({ text: 'Material deleted!' });
    this.props.history.replace({ pathname: Urls.material_page() });
  }

  onSaveFail(next, ..._) {
    if (next) next();
  }

  setEdit() {
    const materialId = this.state.materialId;
    this.props.history.replace({ pathname: Urls.edit_material(materialId) });
  }

  isEditable() {
    return this.state.mode !== 'view';
  }

  isAddable() {
    return this.isEditable() && (this.isGroupMaterial() || this.isNewMaterial());
  }

  zeroStateTitle() {
    if (this.isAddable()) {
      return 'There are no materials being registered, add some.';
    } else {
      return 'There are no items in this material.';
    }
  }

  isNewMaterial() {
    return this.state.mode === 'new';
  }

  isValidMaterial() {
    const material = MaterialStore.getById(this.state.materialId);
    let belongsToUserOrg = true;
    if (material && material.getIn(['organization', 'id']) !== SessionStore.getOrg().get('id')) {
      belongsToUserOrg = false;
    }
    return AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) && belongsToUserOrg;
  }

  shouldAllowCheckin() {
    const material = MaterialStore.getById(this.state.materialId);
    const currentOrg = SessionStore.getOrg() && SessionStore.getOrg().get('id');
    const materialFromOrg = material && material.getIn(['organization', 'id']);
    const labConsumers = LabConsumerStore.getAll() || [];
    return AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES) &&
      (materialFromOrg === currentOrg || labConsumers.some(org => org.getIn(['organization', 'id']) === currentOrg));
  }

  isGroupMaterial() {
    return this.state.materialType === 'group';
  }

  isZeroState() {
    return this.isGroupMaterial() ? this.state.groupMaterial.get('components', Immutable.List()).size === 0 : this.state.individualMaterials.size === 0;
  }

  isEmptyCostTable(state) {
    return state.individualMaterials.some(material => !material.get('components').size);
  }

  openResourceSelector() {
    ModalActions.open(ResourceSelectorModal.MODAL_ID);
  }

  openCompoundResourceSelector() {
    ModalActions.open(CompoundResourceSelectorModal.MODAL_ID);
  }

  addComponentToGroupMaterial(resource) {
    const materialInStore = this.isNewMaterial() ? Immutable.Map() : MaterialStore.getById(this.state.groupMaterial.get('id'));
    const orderableMaterial = materialInStore.getIn(['orderable_materials', 0], Immutable.Map());
    const material = this.state.groupMaterial
      .set('components',
        this.state.groupMaterial
          .get('components')
          .push(
            this.newGroupComponent(resource, orderableMaterial)
          )
      );

    this.setState({ groupMaterial: material, forceValidation: false }, () => this.setFormValidState());
  }

  addIndividualMaterial(resource) {
    const individualMaterials = this.state.individualMaterials.push(
      this.newIndividualMaterial(resource)
    );
    this.setState({ individualMaterials: individualMaterials, forceValidation: false });
  }

  handleSubmitOnClick(next) {
    const isFormValid = this.isFormValid(this.state);
    if (isFormValid) {
      this.isNewMaterial() ? this.create(next) : this.save(next);
      this.setState({ mode: 'view' });
    } else {
      this.setState({ forceValidation: true, isFormValid: false }, next);
    }
  }

  displayAddButtonError() {
    const isGroupMaterial = this.isGroupMaterial();
    const individualMaterialCount = this.state.individualMaterials.size;
    const groupMaterialComponentCount = this.state.groupMaterial.get('components').size;
    if (this.state.forceValidation) {
      if (isGroupMaterial && !(groupMaterialComponentCount > 0)) {
        return 'Please add a group material item';
      } else if (!isGroupMaterial && !(individualMaterialCount > 0)) {
        return 'Please add an individual material';
      }
    }
    return '';
  }

  showViewStockModal(id) {
    ModalActions.open(`${OrderableMaterialComponentStockModal.MODAL_ID}_${id}`);
  }

  renderAddButton() {
    const isZeroState = this.isZeroState();
    const style = {
      type: isZeroState ? 'primary' : 'secondary',
      height: isZeroState ? 'standard' : 'short'
    };

    return (
      <If condition={this.isAddable()}>
        <Validated
          error={this.displayAddButtonError()}
          force_validate={this.state.forceValidation}
          key="add-button"
        >
          <Button
            {...style}
            onClick={() => {
              if (this.isGroupMaterial()) {
                this.openResourceSelector();
              } else {
                this.openCompoundResourceSelector();
              }
            }}
          >
            Add
          </Button>
        </Validated>
      </If>
    );
  }

  render() {
    return (
      <Page title="Materials Details" statusCode={this.state.statusCode}>
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.material_page()}>Materials</Link>
                  <Choose>
                    <When condition={this.isNewMaterial()}>
                      <Link to={Urls.new_material()}>New</Link>
                    </When>
                    <Otherwise>
                      <Link to={Urls.material(this.state.materialId)}>{this.state.materialId}</Link>
                    </Otherwise>
                  </Choose>
                </Breadcrumbs>
              )}
              actions={this.isValidMaterial() && !this.isNewMaterial() ? [
                {
                  text: 'Edit Material',
                  icon: 'fa fa-edit',
                  onClick: () => { this.setEdit(); }
                }
              ] : []}
            />
          )}
        >
          <TabLayout>
            <Choose>
              <When condition={this.state.loading}>
                <Spinner />
              </When>
              <Otherwise>
                <div className="material-details-page__form">
                  <Card>
                    <Section title="Details">
                      <MaterialType
                        type={this.state.materialType}
                        onChange={(type) => {
                          this.setState({
                            materialType: type
                          });
                        }}
                        disableCheckin={this.isEditable()}
                        showCheckIn={this.state.materialType === 'group' && !this.isNewMaterial() && this.shouldAllowCheckin()}
                        onCheckIn={() => this.onClickCheckIn(this.state.groupMaterial.getIn(['components', 0, 'omId']))}
                        disabled={!this.isNewMaterial()}
                      />
                      <If condition={this.isGroupMaterial()}>
                        <MaterialHeader.Group
                          material={this.state.groupMaterial}
                          categories={this.state.categories}
                          vendors={this.state.vendors}
                          onMaterialChange={(material) => {
                            this.setState({
                              groupMaterial: material
                            }, () => this.setFormValidState());
                          }}
                          isValidMaterial={this.isValidMaterial()}
                          disabled={!this.isEditable()}
                          forceValidation={this.state.forceValidation}
                          setFormValidState={() => this.setFormValidState()}
                        />
                      </If>
                    </Section>
                    <Section title={this.isGroupMaterial() ? 'Group Items' : 'Materials'}>
                      <Choose>
                        <When condition={this.state.loading}>
                          <Spinner />
                        </When>
                        <When condition={this.isZeroState()}>
                          <ZeroState
                            title={this.zeroStateTitle()}
                            zeroStateSvg="/images/materials-illustration.svg"
                            button={this.renderAddButton()}
                          />
                        </When>
                        <Otherwise>
                          {this.renderAddButton()}
                          <Choose>
                            <When condition={this.isGroupMaterial()}>
                              {this.state.groupMaterial.get('components').map((component, index) => (
                                <React.Fragment key={component.get('id')}>
                                  <OrderableMaterialComponentStockModal
                                    orderableMaterialComponent={component}
                                  />
                                  <MaterialItem.Group
                                    key={component.get('id')}
                                    index={index}
                                    component={component}
                                    onDeleteComponent={() => {
                                      this.deleteGroupComponent(component, index);
                                    }}
                                    onComponentChange={(component) => {
                                      const material = this.state.groupMaterial.setIn(['components', index], component);
                                      this.setState({
                                        groupMaterial: material
                                      }, () => this.setFormValidState());
                                    }}
                                    isValidMaterial={this.isValidMaterial()}
                                    disabled={!this.isEditable()}
                                    displayViewStock={!this.isNewMaterial()}
                                    onViewStockButtonClick={() => this.showViewStockModal(component.get('id'))}
                                    forceValidation={this.state.forceValidation}
                                  />
                                </React.Fragment>
                              ))}
                            </When>
                            <Otherwise>
                              {this.state.individualMaterials.map((material, index) => (
                                <React.Fragment key={material.getIn(['components', 0, 'id'])}>
                                  <OrderableMaterialComponentStockModal
                                    orderableMaterialComponent={material.getIn(['components', 0], Immutable.Map()).set('resource', material.get('resource'))}
                                  />
                                  <MaterialItem.Individual
                                    key={index}
                                    index={index}
                                    categories={this.state.categories}
                                    vendors={this.state.vendors}
                                    material={material}
                                    onMaterialChange={material => {
                                      const materials = this.state.individualMaterials.set(index, material);
                                      this.setState({ individualMaterials: materials },
                                        () => this.setFormValidState());
                                    }}
                                    onDeleteMaterial={() => {
                                      this.deleteMaterial(material, index);
                                    }}
                                    isValidMaterial={this.isValidMaterial()}
                                    disabled={!this.isEditable()}
                                    editing={!this.isNewMaterial()}
                                    forceValidation={this.state.forceValidation}
                                    setFormValidState={() => this.setFormValidState()}
                                    displayViewStock={!this.isNewMaterial()}
                                    displayCheckIn={!this.isNewMaterial() && this.shouldAllowCheckin()}
                                    onCheckIn={(omId) => this.onClickCheckIn(omId)}
                                    router={this.context.router}
                                    onViewStockButtonClick={() => this.showViewStockModal(material.getIn(['components', 0, 'id']))}
                                  />
                                </React.Fragment>
                              ))}
                            </Otherwise>
                          </Choose>
                        </Otherwise>
                      </Choose>
                    </Section>
                  </Card>
                  <div className="material-details-page__buttons">
                    <ButtonGroup orientation="horizontal">
                      <Button
                        link
                        type="primary"
                        to={Urls.material_page()}
                      >
                        Cancel
                      </Button>
                      <If condition={this.isEditable()}>
                        <Button
                          waitForAction
                          type="primary"
                          height="tall"
                          onClick={next => this.handleSubmitOnClick(next)}
                        >
                          {this.isNewMaterial() ? 'Create' : 'Save'}
                        </Button>
                      </If>
                    </ButtonGroup>
                  </div>
                </div>
              </Otherwise>
            </Choose>
            <CompoundResourceSelectorModal
              isSingleSelect
              onSelectedResource={this.addIndividualMaterial}
              hideActions
            />
            <ResourceSelectorModal
              onResourceSelected={(_ids, [resource]) => this.addComponentToGroupMaterial(resource)}
              isSingleSelect
            />
            <AddResourceModal />
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

MaterialDetailsPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      materialId: PropTypes.string
    }).isRequired
  })
};

MaterialDetailsPage.contextTypes = {
  router: PropTypes.object.isRequired
};

export default MaterialDetailsPage;
