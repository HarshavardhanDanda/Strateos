import React, { useEffect, useState } from 'react';
import Immutable from 'immutable';
import _ from 'lodash';
import { Spinner } from '@transcriptic/amino';
import NotificationActions from 'main/actions/NotificationActions';
import MaterialOrderActions from 'main/actions/MaterialOrderActions';
import MaterialOrderStatus from 'main/util/MaterialOrderStatus';
import MaterialOrderStore from 'main/stores/MaterialOrderStore';
import { keys } from 'main/pages/MaterialOrdersPage/MaterialOrdersCheckinCSVPage/CsvCheckinFields';
import MaterialOrdersCheckinForm from '../MaterialOrdersCheckinPage/MaterialOrdersCheckinForm';

function MaterialOrdersCheckinCSVForm(props) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    initializeData();
  }, [props.transformedData]);

  useEffect(() => {
    showErrorsIfEnabled();
  }, [errors, props.disableErrorDisplay]);

  const initializeData = async () => {
    const errors = [];
    const data = [];
    const isGroup = isMaterialTypeGroup();
    const uniqueTransformedData = getUniqueTransformedData(isGroup);
    try {
      for await (const item of uniqueTransformedData) {
        const vendorOrderId = item[keys.vendorOrderId];
        const sku = item[keys.sku];
        const groupItemName = item[keys.groupItemName];
        const results = await getOrderAPI(vendorOrderId, groupItemName);
        const orderId = results.results.find((result) => isOrderMatched(result.orderable_material.sku, sku) && isOrderMatched(result.vendor_order_id, vendorOrderId))?.id;
        const order = MaterialOrderStore.getById(orderId);
        const errorMessageHalf = isGroup ? `Order with id ${vendorOrderId} and sku ${sku} and group item name ${groupItemName}` : `Order with id ${vendorOrderId} and sku ${sku}`;
        if (!order) {
          errors.push(`${errorMessageHalf} cannot be found.`);
        } else if (isCheckedIn(order)) {
          errors.push(`${errorMessageHalf} has already been checked in.`);
        } else {
          let checkinItem;
          if (isGroup) {
            checkinItem = formattedGroupCheckinItem(matchedGroupItems(order, groupItemName), item);
          } else {
            checkinItem = formattedIndividualCheckinItem(order, item);
          }

          data.push(checkinItem);
        }
      }
    } catch (error) {
      NotificationActions.handleError(error);
    }

    if (isGroup) {
      setData(mapGroupItemsToKitOrder(data));
    } else {
      setData(data);
    }

    setLoading(false);
    setErrors(errors);
  };

  const getUniqueTransformedData = (isGroup) => {
    if (isGroup) {
      return _.uniqBy(props.transformedData, (item) => `${item[keys.groupItemName]}-${item[keys.barcode]}`);
    } else {
      return _.uniqBy(props.transformedData, (item) => `${item[keys.vendorOrderId]}-${item[keys.sku]}`);
    }
  };

  const getOrderAPI = (vendorOrderId, groupItemName) => {
    const isGroupMaterial = !_.isEmpty(groupItemName);
    const finalQuery = isGroupMaterial ? groupItemName : vendorOrderId;
    const search_field = isGroupMaterial ? 'group_item_name' : 'vendor_order_id';
    const material_type = isGroupMaterial ? 'group' : 'individual';

    return MaterialOrderActions.search({
      q: finalQuery.trim().toLowerCase(),
      search_field,
      page: '1',
      per_page: '1000',
      filter: {
        material_type
      }
    });
  };

  const mapGroupItemsToKitOrder = (data) => {
    if (data.length === 1) return data;

    const finalData = [];
    const omcPath = ['order', 'orderable_material', 'orderable_material_components'];
    const initialSortedData = _.sortBy(data, (item) => item.getIn(['order', 'id']));

    initialSortedData.forEach((currentItem) => {
      const duplicateOrderIndex = finalData.findIndex(item => isSameKitOrder(item, currentItem));
      if (duplicateOrderIndex === -1) {
        finalData.push(currentItem);
      } else {
        finalData[duplicateOrderIndex] = finalData[duplicateOrderIndex].setIn(omcPath, finalData[duplicateOrderIndex].getIn(omcPath).concat(currentItem.getIn(omcPath)));
      }
    });

    return finalData;
  };

  const isCheckedIn = (order) => {
    return order.get('state') === MaterialOrderStatus.CHECKEDIN;
  };

  const isMaterialTypeGroup = () => {
    return !_.isEmpty(props.transformedData.find(item => item[keys.groupItemName].trim() !== ''));
  };

  const isOrderMatched = (dbField, csvField) => {
    if (!dbField) return false;

    return isOrderableMaterialComponentIdField(dbField) ? dbField === csvField.trim().toLowerCase() : dbField.trim().toLowerCase() === csvField.trim().toLowerCase();
  };

  const isSameKitOrder = (order1, order2) => {
    const orderPath = ['order', 'id'];
    return order1.getIn(orderPath) === order2.getIn(orderPath);
  };

  const isOrderableMaterialComponentIdField = field => {
    return field.toLowerCase().indexOf('omatc') > -1;
  };

  const formattedIndividualCheckinItem = (order, item) => {
    const orderableMaterialId = order.getIn(['orderable_material', 'id']);
    return Immutable.fromJS({
      orderableMaterialId: orderableMaterialId,
      initialForm: {
        volume_per_container: item[keys.volume],
        mass_per_container: item[keys.mass],
        barcode: item[keys.barcode],
        label: item[keys.label],
        lot_no: item[keys.lotNumber],
        location: item[keys.locationId],
        storage_condition: item[keys.storageCondition],
        container_type: item[keys.containerType],
        expiration_date: item[keys.expirationDate]
      }
    }).set('order', order);
  };

  const formattedGroupCheckinItem = (order, item) => {
    const orderableMaterialId = order.getIn(['orderable_material', 'id']);
    return Immutable.fromJS({
      orderableMaterialId: orderableMaterialId,
    }).set('order', order.setIn(['orderable_material', 'orderable_material_components', 0, 'initialForm'], Immutable.fromJS({
      volume_per_container: item[keys.volume],
      mass_per_container: item[keys.mass],
      barcode: item[keys.barcode],
      label: item[keys.label],
      lot_no: item[keys.lotNumber],
      location: item[keys.locationId],
      storage_condition: item[keys.storageCondition],
      container_type: item[keys.containerType],
      expiration_date: item[keys.expirationDate]
    })));
  };

  const matchedGroupItems = (order, groupItemName) => {
    return order.setIn(['orderable_material', 'orderable_material_components'],
      order
        .getIn(['orderable_material', 'orderable_material_components'])
        .filter(omc => isOrderMatched(omc.get('id'), groupItemName) || isOrderMatched(omc.get('name'), groupItemName)));
  };

  const showErrorsIfEnabled = () => {
    const shouldDisplayErrors = !loading && !props.disableErrorDisplay;
    if (shouldDisplayErrors) {
      errors.forEach((errorText) => {
        NotificationActions.createNotification({
          text: errorText,
          isError: true
        });
      });
    }
  };

  return loading ? (
    <Spinner />
  ) : (
    <MaterialOrdersCheckinForm
      data={data}
      backButton={props.backButton}
      onBulkCheckinSuccess={props.onBulkCheckinSuccess}
      validateAllOnInit
      isCSVCheckin
    />
  );
}

export default MaterialOrdersCheckinCSVForm;
