import React from 'react';
import { Link } from 'react-router-dom';
import Immutable from 'immutable';
import _ from 'lodash';
import { Page, Breadcrumbs, Card, Section, ZeroState, Button, ButtonGroup } from '@transcriptic/amino';
import FeatureConstants from '@strateos/features';

import Urls from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import SessionStore from 'main/stores/SessionStore';
import FeatureStore from 'main/stores/FeatureStore';
import LabAPI from 'main/api/LabAPI';
import { TabLayout } from 'main/components/TabLayout';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import NotificationActions from 'main/actions/NotificationActions';
import MaterialsSelectorModal from 'main/pages/MaterialsPage/MaterialSelector/MaterialsSelectorModal';
import CompoundMaterialSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundMaterialSelectorModal';
import ModalActions from 'main/actions/ModalActions';
import MaterialStore from 'main/stores/MaterialStore';
import MaterialOrderDetails from './MaterialOrderDetails';
import MaterialOrderGroupItems from './MaterialOrderGroupItems';
import MaterialOrderIndividualItems from './MaterialOrderIndividualItems';
import MaterialOrderEmoleculesItems from './MaterialOrderEmoleculesItems';

import './MaterialOrderDetailsPage.scss';

class MaterialOrdersDetailPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      materialType: 'group',
      labId: undefined,
      statusCode: undefined,
      groupMaterials: Immutable.List([]),
      individualMaterials: Immutable.List(),
      emoleculeVendorMaterials: Immutable.List(),
      individualMaterialSource: 'strateos',
      selected: [],
      count: {},
      labs: [],
      isCreatedFromMaterials: false,
      forceValidation: false,
    };

    _.bindAll(
      this,
      'onMaterialsSelected',
      'removeMaterials',
      'handleCountChange',
      'handleCountChangeEmolecules',
      'handleChange',
      'onCreateSuccess',
      'createMaterialsOrder',
      'handleMaterialsByAmount',
      'handleCreate'
    );
  }

  componentWillMount() {
    if (this.props.history && this.props.location && this.props.location.state) {
      const { materialType, materials } = this.props.location.state;

      this.setState({
        materialType: materialType,
        isCreatedFromMaterials: true,
        groupMaterials: materialType === 'group' ? materials : Immutable.List([]),
        individualMaterials: materialType === 'individual' ? materials : Immutable.List([])
      });
      this.props.history.replace();
    }
  }

  componentDidMount() {
    this.fetchLabs();
  }

  fetchLabs() {
    LabAPI.index({
      filters: {
        operated_by_id: SessionStore.getOrg().get('id')
      }
    }).done(response => {
      if (response.data.length > 0) {
        const labIds = FeatureStore.getLabIdsWithFeatures(FeatureConstants.MANAGE_KIT_ORDERS);
        const labs = response.data.filter(lab => labIds.toJS().includes(lab.id));

        const [lab] = labs;
        this.setState({
          labs,
          labId: lab.id
        });
      }
    });
  }

  isGroupMaterial() {
    return this.state.materialType === 'group';
  }

  isEmoleculesVendor() {
    return this.state.individualMaterialSource === 'emolecules';
  }

  isZeroState() {
    return this.isGroupMaterial() ?
      this.state.groupMaterials.size === 0 :
      (this.isEmoleculesVendor() ? this.state.emoleculeVendorMaterials.size === 0 : this.state.individualMaterials.size === 0);
  }

  zeroStateTitle() {
    return 'There are no materials being ordered, add some.';
  }

  isFormValid() {
    if (this.isZeroState()) {
      return false;
    }
    if (this.isGroupMaterial()) {
      return !this.state.groupMaterials.some(material =>
        _.toNumber(material.getIn(['orderable_materials', 0, 'count'])) <= 0);
    }
    if (this.isEmoleculesVendor()) {
      return !this.state.emoleculeVendorMaterials.some(material =>
        _.toNumber(material.get('count')) <= 0);
    }
    return !this.state.individualMaterials.some(material =>
      _.toNumber(material.getIn(['orderable_materials', 0, 'count'])) <= 0);
  }

  onMaterialsSelected(selected) {
    const { groupMaterials, individualMaterials } = this.state;
    let materials = this.isGroupMaterial() ? groupMaterials : individualMaterials;

    let newItems = selected.filter((item) =>  {
      let existing = false;
      materials = materials.map((material) => {
        if (material.get('id') === item.get('id')) {
          existing = true;
          return material.updateIn(['orderable_materials', 0, 'count'], count => _.toNumber(count || 1) + 1);
        }
        return material;
      });
      return !existing;
    });
    newItems = newItems.map((item) => item.setIn(['orderable_materials', 0, 'count'], 1));
    materials = materials.concat(Immutable.fromJS(newItems));
    if (this.isGroupMaterial()) {
      this.setState({ groupMaterials: materials });
    } else {
      this.setState({ individualMaterials: materials });
    }
  }

  onEmoleculesMaterialsSelected(selected, compound) {
    const { emoleculeVendorMaterials } = this.state;
    selected = selected.map((vendor) => {
      vendor = vendor.set('count', 1);
      vendor = vendor.set('compound_id', compound.get('compound_id'));
      return vendor;
    });
    this.setState({ emoleculeVendorMaterials: emoleculeVendorMaterials.concat(selected) });
  }

  removeMaterials() {
    const { groupMaterials, individualMaterials, emoleculeVendorMaterials, selected } = this.state;
    const materials = this.isGroupMaterial() ? groupMaterials :
      (this.isEmoleculesVendor() ? emoleculeVendorMaterials : individualMaterials);
    const filtered = materials.filter((material) => !selected.includes(material.get('id')));
    if (this.isGroupMaterial()) {
      this.setState({ groupMaterials: filtered, selected: [] });
    } else if (this.isEmoleculesVendor()) {
      this.setState({ emoleculeVendorMaterials: filtered, selected: [] });
    } else {
      this.setState({ individualMaterials: filtered, selected: [] });
    }
  }

  handleCountChangeEmolecules(value, id) {
    const { emoleculeVendorMaterials } = this.state;
    const materials = emoleculeVendorMaterials.map(material => {
      if (material.get('id') === id) {
        material = material.set('count', value);
      }
      return material;
    });
    this.setState({ emoleculeVendorMaterials: materials });
  }

  handleCountChange(value, id) {
    const { groupMaterials, individualMaterials } = this.state;
    let materials = this.isGroupMaterial() ? groupMaterials : individualMaterials;
    materials = materials.map(material => {
      if (material.getIn(['orderable_materials', '0', 'id']) === id) {
        material = material.setIn(['orderable_materials', '0', 'count'], value);
      }
      return material;
    });
    if (this.isGroupMaterial()) {
      this.setState({ groupMaterials: materials });
    } else {
      this.setState({ individualMaterials: materials });
    }
  }

  handleMaterialsByAmount(newOrderableMaterialId, currentOrderableMaterialId, materialId, ind) {
    let { individualMaterials } = this.state;
    const index = ind || individualMaterials.findIndex(material => material.get('material_id') === materialId);
    const count = individualMaterials.find(material => material.get('id') === currentOrderableMaterialId).getIn(['orderable_materials', '0', 'count'], 1);

    const newMaterial = MaterialStore.getById(materialId)
      .set('material_id', materialId)
      .set('id', newOrderableMaterialId)
      .set('type', 'orderable_materials');
    let newOrderableMaterial = newMaterial.get('orderable_materials').find(orderableMaterial => orderableMaterial.get('id') === newOrderableMaterialId);
    newOrderableMaterial = newOrderableMaterial.set('count', count);

    const newOrderableMaterials = newMaterial.set('orderable_materials', Immutable.List([newOrderableMaterial]));
    individualMaterials = individualMaterials.set(index, newOrderableMaterials);
    this.setState({ individualMaterials: individualMaterials });
  }

  onCreateSuccess() {
    NotificationActions.createNotification({ text: 'Order created!', isSuccess: true });
    this.props.history.replace({ pathname: Urls.material_orders_page() });
  }

  getMaterialSaveFormat(material, labId) {
    return {
      orderable_material_id: material.getIn(['orderable_materials', '0', 'id']),
      count: material.getIn(['orderable_materials', '0', 'count']),
      lab_id: labId
    };
  }

  setMaterialsOrderSaveFormat(materials) {
    const { labId } = this.state;
    const materialsSaveFormat = [];
    materials.forEach(material => {
      const materialSaveFormat = this.getMaterialSaveFormat(material, labId);
      materialsSaveFormat.push(materialSaveFormat);
    });
    return { kit_orders: materialsSaveFormat };
  }

  setEmoleculesOrderSaveFormat() {
    const { emoleculeVendorMaterials, labId } = this.state;
    const emoleculesSaveFormat = [];
    const setUnitsKey = isMass => (isMass ? 'mass_units' : 'volume_units');
    const setQuantityKey = isMass => (isMass ? 'mass_per_container' : 'volume_per_container');

    emoleculeVendorMaterials.forEach(material => {
      const units = material.getIn(['supplier', 'units']);
      const isMass = units.includes('g');
      const materialSaveFormat = {
        count: material.get('count'),
        lab_id: labId,
        supplier_name: material.getIn(['supplier', 'name']),
        sku: material.getIn(['supplier', 'sku']),
        price: material.getIn(['supplier', 'price']),
        [setQuantityKey(isMass)]: material.getIn(['supplier', 'quantity']),
        [setUnitsKey(isMass)]: units,
        smiles: material.get('smiles'),
        tier: material.getIn(['supplier', 'catalog', 'type']),
        cas_number: material.get('casNumber')
      };
      emoleculesSaveFormat.push(materialSaveFormat);
    });
    return { material_orders: emoleculesSaveFormat };
  }

  handleCreate(next) {
    const isValid = this.isFormValid();
    if (isValid) {
      this.createMaterialsOrder(next);
    } else {
      this.setState({ forceValidation: true }, next);
    }
  }

  createMaterialsOrder(next) {
    const { groupMaterials, individualMaterials } = this.state;
    const orders = this.isGroupMaterial() ? this.setMaterialsOrderSaveFormat(groupMaterials) :
      (this.isEmoleculesVendor() ? this.setEmoleculesOrderSaveFormat() : this.setMaterialsOrderSaveFormat(individualMaterials));
    MaterialOrderActions.bulkCreate(orders)
      .done(_.debounce(this.onCreateSuccess, 400))
      .fail(() => next && next());
  }

  handleChange(type, value) {
    this.setState({ [type]: value });
  }

  isCreateButtonDisabled() {
    return this.isZeroState() || (this.state.forceValidation && !this.isFormValid());
  }

  renderAddButton() {
    const isZeroState = this.isZeroState();
    const addStyle = {
      type: isZeroState ? 'primary' : 'action',
      height: isZeroState ? 'standard' : 'short'
    };
    const removeStyle = {
      type: 'secondary',
      height: 'short'
    };

    return (
      <React.Fragment>
        <Button
          {...addStyle}
          onClick={() => {
            switch (this.state.materialType) {
              case 'group': {
                ModalActions.open(MaterialsSelectorModal.MODAL_ID);
                break;
              }
              case 'individual': {
                ModalActions.open(CompoundMaterialSelectorModal.MODAL_ID);
                break;
              }
            }
          }}
        >
          Add
        </Button>
        <If condition={!isZeroState}>
          <Button
            {...removeStyle}
            onClick={this.removeMaterials}
            disabled={this.state.selected.length === 0}
          >
            Remove
          </Button>
        </If>
      </React.Fragment>
    );
  }

  render() {
    return (
      <Page title="Materials Details">
        <PageLayout
          PageHeader={(
            <PageHeader
              titleArea={(
                <Breadcrumbs>
                  <Link to={Urls.material_orders_page()}>Order</Link>
                  <Link to={Urls.new_material_order()}>New</Link>
                </Breadcrumbs>
              )}
            />
          )}
        >
          <TabLayout>
            <div className="material-order-details-page__form">
              <Card>
                <Section title="Details">
                  <MaterialOrderDetails
                    type={this.state.materialType}
                    labId={this.state.labId}
                    labs={this.state.labs}
                    onChange={this.handleChange}
                  />
                </Section>
                <Section title={'Order summary'}>
                  <Choose>
                    <When condition={this.isZeroState()}>
                      <ZeroState
                        title={this.zeroStateTitle()}
                        zeroStateSvg="/images/materials-illustration.svg"
                        button={this.renderAddButton()}
                      />
                    </When>
                    <Otherwise>
                      <ButtonGroup orientation="horizontal">
                        {this.renderAddButton()}
                      </ButtonGroup>
                      <Choose>
                        <When condition={this.isGroupMaterial()}>
                          <div className="material-order-details-page__group-materials">
                            <MaterialOrderGroupItems
                              data={this.state.groupMaterials}
                              selected={this.state.selected}
                              onSelectRow={(selectedRows) => {
                                this.setState({ selected: Object.keys(selectedRows) });
                              }}
                              handleCountChange={this.handleCountChange}
                              forceValidation={this.state.forceValidation}
                            />
                          </div>
                        </When>
                        <When condition={this.isEmoleculesVendor()}>
                          <div className="material-order-details-page__group-materials">
                            <MaterialOrderEmoleculesItems
                              data={this.state.emoleculeVendorMaterials}
                              selected={this.state.selected}
                              onSelectRow={(selectedRows) => this.setState({ selected: Object.keys(selectedRows) })}
                              handleCountChange={this.handleCountChangeEmolecules}
                              forceValidation={this.state.forceValidation}
                            />
                          </div>
                        </When>
                        <Otherwise>
                          <div className="material-order-details-page__group-materials">
                            <MaterialOrderIndividualItems
                              data={this.state.individualMaterials}
                              selected={this.state.selected}
                              onSelectRow={(selectedRows) => this.setState({ selected: Object.keys(selectedRows) })}
                              handleCountChange={this.handleCountChange}
                              isCreatedFromMaterials={this.state.isCreatedFromMaterials}
                              handleMaterialsByAmount={this.handleMaterialsByAmount}
                              forceValidation={this.state.forceValidation}
                            />
                          </div>
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
                    to={Urls.material_orders_page()}
                  >
                    Cancel
                  </Button>
                  <Button
                    waitForAction
                    type="primary"
                    height="tall"
                    disabled={this.isCreateButtonDisabled()}
                    onClick={this.handleCreate}
                  >
                    Create
                  </Button>
                </ButtonGroup>
              </div>
            </div>
            <MaterialsSelectorModal
              modalId={MaterialsSelectorModal.MODAL_ID}
              onMaterialSelected={(_ids, materials) => this.onMaterialsSelected(materials)}
            />
            <CompoundMaterialSelectorModal
              modalId={CompoundMaterialSelectorModal.MODAL_ID}
              onMaterialSelected={(_ids, materials, source, compound) => {
                this.setState({ individualMaterialSource: source });
                if (source === 'emolecules') {
                  this.onEmoleculesMaterialsSelected(materials, compound);
                } else {
                  this.onMaterialsSelected(materials);
                }
              }}
            />
          </TabLayout>
        </PageLayout>
      </Page>
    );
  }
}

export default MaterialOrdersDetailPage;
