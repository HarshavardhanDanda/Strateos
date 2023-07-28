import React from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import MaterialAPI from 'main/api/MaterialAPI';
import MaterialStore from 'main/stores/MaterialStore';
import KitOrderStore from 'main/stores/KitOrderStore';
import {
  Page,
  Breadcrumbs,
  Card,
  Section,
  Spinner,
  Button,
  ButtonGroup
} from '@transcriptic/amino';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabLayout } from 'main/components/TabLayout';
import Urls from 'main/util/urls';
import AcsControls             from 'main/util/AcsControls';
import FeatureConstants        from '@strateos/features';
import KitOrderActions from 'main/actions/KitOrderActions';
import NotificationActions from 'main/actions/NotificationActions';
import MaterialOrderGroupItems from 'main/pages/MaterialOrdersPage/MaterialOrderDetailsPage/MaterialOrderGroupItems';
import MaterialOrderIndividualItems from 'main/pages/MaterialOrdersPage/MaterialOrderDetailsPage/MaterialOrderIndividualItems';

import './EditMaterialOrderPage.scss';
import EditMaterialOrderDetail from './EditMaterialOrderDetail';

const nullSafeEquals = (a, b) => ((_.isEmpty(a) && _.isEmpty(b)) || (a === b));

class EditMaterialOrderPage extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      order: Immutable.Map({}),
      shouldUpdate: false,
      status: 'PENDING',
      trackingCode: '',
      note: '',
      orderId: '',
      mode: (props.match.params.mode) === 'edit' ? 'edit' : 'view',
      isPendingOrder: true,
      forceValidation: false,
      isFormValid: true,
    };

    _.bindAll(
      this,
      'isGroupMaterial',
      'handleCountChange',
      'handleChange',
      'getMaterialItems',
      'updateOrder',
      'fetchMaterialData',
      'setFormState',
      'resetCount',
      'handleDeleteClick',
      'handleNameClick',
      'handleEditClick',
      'setMode',
      'onCompoundClick',
      'handleClickUpdate',
      'shouldUpdate',
      'isFormValid',
    );
  }

  componentDidMount() {
    KitOrderActions.load(
      this.props.match.params.materialOrderId,
      { data: { include: 'orderable_material.orderable_material_components,lab,user,orderable_material.material' } }
    ).done(() => {
      let materialOrder = KitOrderStore.getById(this.props.match.params.materialOrderId);
      materialOrder = materialOrder.setIn(['orderable_material', 'count'], materialOrder.get('count'));
      const materialId = materialOrder.getIn(['orderable_material', 'material', 'id']);

      this.fetchMaterialData(materialOrder, materialId);
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.mode !== this.props.match.params.mode) {
      this.setMode();
    }
  }

  fetchMaterialData(materialOrder, materialId) {
    let materialData = {};
    const options = { includes: ['vendor', 'supplier', 'organization', 'categories', 'material_components.resource', 'orderable_materials.orderable_material_components', 'material_components.orderable_material_components'] };
    MaterialAPI.get(materialId, options)
      .done(() => {
        materialData = MaterialStore.getById(materialId);
        materialOrder = materialOrder.set('material', materialData);
        this.setState({
          order: materialOrder,
          loading: false,
          trackingCode: materialOrder.get('tracking_code', ''),
          note: materialOrder.get('note', ''),
          status: materialOrder.get('state'),
          isPendingOrder: materialOrder.get('state') === 'PENDING'
        });
      });
  }

  handleNameClick(event, materialId) {
    event.stopPropagation();
    this.props.history.push(Urls.material(materialId));
  }

  canManageAllMaterials() {
    return AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_KITS_VENDORS_RESOURCES);
  }

  canViewPublicMaterials() {
    return AcsControls.isFeatureEnabled(FeatureConstants.VIEW_PUBLIC_MATERIALS);
  }

  setMode() {
    const mode =  this.props.match.params.mode === 'edit' ? 'edit' : 'view';
    this.setState({ mode });
  }

  isGroupMaterial() {
    const { order } = this.state;
    return order.getIn(['material', 'material_type']) === 'group';
  }

  getMaterialItems() {
    const { order } = this.state;
    const material = order.get('material').set('orderable_materials', Immutable.List([order.get('orderable_material')]));
    return Immutable.List([material]);
  }

  isConfirm(message) {
    return confirm(message);
  }

  handleCountChange(value, id) {
    let { order } = this.state;
    if (order.getIn(['orderable_material', 'id']) === id) {
      order = order.setIn(['orderable_material', 'count'], value);
    }
    this.setState({ order: order }, () => this.setFormState());
  }

  shouldUpdate() {
    const { order, status, trackingCode, note, orderId } = this.state;
    return (
      !nullSafeEquals(note, order.get('note')) ||
      !nullSafeEquals(orderId, order.get('vendor_order_id')) ||
      !nullSafeEquals(trackingCode, order.get('tracking_code')) ||
      !nullSafeEquals(status, order.get('state')) ||
      _.toNumber(order.getIn(['orderable_material', 'count'])) !== _.toNumber(order.get('count'))
    );
  }

  setFormState() {
    const isValid = this.isFormValid();
    this.setState({ shouldUpdate: this.shouldUpdate(), isFormValid: isValid, forceValidation: !isValid });
  }

  handleChange(key, value) {
    this.setState({ [key]: value }, () => this.setFormState());
    if (key === 'status' && value !== 'PENDING') {
      this.resetCount();
    }
  }

  resetCount() {
    const { order } = this.state;
    this.setState({ order: order.setIn(['orderable_material', 'count'], order.get('count')) });
  }

  isFormValid() {
    return _.toNumber(this.state.order.getIn(['orderable_material', 'count'])) > 0;
  }

  handleClickUpdate(next) {
    if (this.isFormValid()) {
      this.updateOrder(next);
    } else {
      this.setState({ forceValidation: true }, next);
    }
  }

  updateOrder(next) {
    const { order, trackingCode, note, status, orderId } = this.state;
    const updatedOrder = {};

    if (trackingCode) {
      updatedOrder.tracking_code = trackingCode;
    }
    if (note) {
      updatedOrder.note = note;
    }
    if (status && status !== order.get('state')) {
      updatedOrder.state = status;
    }
    if (orderId) {
      updatedOrder.vendor_order_id = orderId;
    }
    if (status === 'PENDING' && Number(order.getIn(['orderable_material', 'count'])) !== Number(order.get('count'))) {
      updatedOrder.count = order.getIn(['orderable_material', 'count']);
    }

    KitOrderActions.update(order.get('id'), updatedOrder)
      .done(() => {
        NotificationActions.createNotification({ text: 'Order Updated!' });
        this.props.history.replace({ pathname: Urls.material_orders_page() });
      })
      .fail(() => next && next());
  }

  handleDeleteClick() {
    const { order } = this.state;
    const orderName = order.getIn(['material', 'name']);
    const  message = `Are you sure you would like to delete order "${orderName}"?`;

    if (!this.isConfirm(message)) {
      return;
    }

    KitOrderActions.destroy(order.get('id')).done(() => {
      NotificationActions.createNotification({ text: 'Order Deleted!' });
      this.props.history.replace({ pathname: Urls.material_orders_page() });
    });
  }

  handleEditClick() {
    const materialOrderId = this.state.order && this.state.order.get('id');
    this.props.history.replace({ pathname: Urls.edit_material_order(materialOrderId) });
  }

  getActionOptions() {
    let actions = [];
    if (this.state.mode === 'view' && !this.state.order.get('checked_in_at')) {
      actions = [
        {
          text: 'Edit Order',
          icon: 'fas fa-edit',
          onClick: this.handleEditClick
        }];
    } else if (this.state.mode === 'edit' && this.state.isPendingOrder) {
      actions = [{
        text: 'Delete Order',
        icon: 'fas fa-trash',
        onClick: this.handleDeleteClick
      }];
    }
    return actions;
  }

  onCompoundClick(linkId) {
    this.props.history.push(Urls.compound(linkId));
  }

  canViewCompound() {
    return AcsControls.isFeatureEnabled(FeatureConstants.VIEW_COMPOUNDS) ||
      AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LAB_COMPOUNDS);
  }

  renderPageHeader(order) {
    return (
      <PageHeader
        titleArea={(
          <Breadcrumbs>
            <Link to={Urls.material_orders_page()}>Order</Link>
            <Link to={this.state.mode === 'view' ? Urls.material_order(order.get('id')) : Urls.edit_material_order(order.get('id'))}>{order.getIn(['material', 'name'], '')}</Link>
          </Breadcrumbs>
        )}
        actions={this.getActionOptions()}
      />
    );
  }

  renderMaterialOrderDetail(order, status) {
    return (
      <div className="edit-material-order-page__detail">
        <EditMaterialOrderDetail
          order={order}
          trackingCode={this.state.trackingCode}
          note={this.state.note}
          status={status}
          handleChange={this.handleChange}
          isReadOnly={this.state.mode === 'view'}
        />
      </div>
    );
  }

  renderMaterialOrderGroupItems() {
    return (
      <div className="edit-material-order-page__group-materials">
        <MaterialOrderGroupItems
          data={this.getMaterialItems()}
          handleCountChange={this.handleCountChange}
          handleNameClick={this.handleNameClick}
          canManageAllMaterials={this.canManageAllMaterials()}
          canViewPublicMaterials={this.canViewPublicMaterials()}
          disableSelection
          isReadOnly={this.state.mode === 'view' || !this.state.isPendingOrder}
          forceValidation={this.state.forceValidation}
        />
      </div>
    );
  }

  renderMaterialIndividualItems() {
    return (
      <div className="edit-material-order-page__group-materials">
        <MaterialOrderIndividualItems
          data={this.getMaterialItems()}
          handleCountChange={this.handleCountChange}
          handleNameClick={this.handleNameClick}
          canManageAllMaterials={this.canManageAllMaterials()}
          canViewPublicMaterials={this.canViewPublicMaterials()}
          onCompoundClick={this.canViewCompound() && this.onCompoundClick}
          disableSelection
          isReadOnly={this.state.mode === 'view' || !this.state.isPendingOrder}
          forceValidation={this.state.forceValidation}
        />
      </div>
    );
  }

  renderPageButtons() {
    return (
      <div className="edit-material-order-page__buttons">
        <ButtonGroup orientation="horizontal">
          <Button
            link
            type="primary"
            to={Urls.material_orders_page()}
          >
            Cancel
          </Button>
          {
          this.state.mode === 'edit' && (
          <Button
            waitForAction
            type="primary"
            height="tall"
            disabled={!this.state.shouldUpdate || !this.state.isFormValid}
            onClick={this.handleClickUpdate}
          >
            Update
          </Button>
          )}
        </ButtonGroup>
      </div>
    );
  }

  render() {
    const { order, status } = this.state;
    return (
      this.state.loading ?
        <Spinner /> :
        (
          <Page title={this.state.mode === 'view' ? 'Material Order' : 'Edit Material Order'}>
            <PageLayout
              PageHeader={this.renderPageHeader(order)}
            >
              <TabLayout className="edit-material-order-page">
                <div className="edit-material-order-page__form">
                  <Card className="tx-stack tx-stack--sm">
                    <h3 className="edit-material-order-page__item-header">
                      {'Shipment ' + order.getIn(['material', 'name'], '')}
                    </h3>
                    {this.renderMaterialOrderDetail(order, status)}
                    <Section title={'Materials'}>
                      {
                          this.isGroupMaterial() ?
                            this.renderMaterialOrderGroupItems() :
                            this.renderMaterialIndividualItems()
                      }
                    </Section>
                  </Card>
                </div>
                {this.renderPageButtons()}
              </TabLayout>
            </PageLayout>
          </Page>
        )
    );
  }
}

export default EditMaterialOrderPage;
