import FeatureStore       from 'main/stores/FeatureStore';
import FeatureConstants   from '@strateos/features';

const InventoryUtil = {
  getVisibleColumns() {
    if (FeatureStore.hasFeature(FeatureConstants.MANAGE_CONTAINERS_IN_LAB)) {
      return ([
        'name',
        'barcode',
        'format',
        'created',
        'organization',
        'location'
      ]);
    } else {
      return ([
        'type',
        'name',
        'ID',
        'format',
        'contents',
        'condition',
        'created',
        'barcode',
        'Last used',
        'creator',
        'code',
        'organization'
      ]);
    }
  }
};

export default InventoryUtil;
