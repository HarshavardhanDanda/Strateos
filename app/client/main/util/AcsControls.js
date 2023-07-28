import FeatureStore from 'main/stores/FeatureStore';

const ACSControls = {

  isFeatureEnabled: (feature) => {
    return (FeatureStore.hasApp(feature) || FeatureStore.hasFeature(feature));
  }
};

export default ACSControls;
