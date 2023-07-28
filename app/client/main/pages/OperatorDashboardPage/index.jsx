import React, { useEffect, useState } from 'react';

import Urls from 'main/util/urls.js';
import WorkcellStore from 'main/stores/WorkcellStore';
import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import FeatureConstants from '@strateos/features';
import FederatedWrapper from 'main/components/FederatedWrapper';
import WorkcellActions from 'main/actions/WorkcellActions';
import LabStore from 'main/stores/LabStore';
import FeatureStore from 'main/stores/FeatureStore';
import LabActions from 'main/actions/LabActions';
import { Page } from '@transcriptic/amino';

// eslint-disable-next-line import/no-unresolved
const OperatorDashboard = React.lazy(() => import('operator_dashboard/App'));

function OperatorDashboardPage({ labIds, manifest, areLabsLoaded }) {
  // Keep track of what labs have already been loaded.
  const [fetchedLabIds, setFetchedLabIds] = useState(new Set());
  const loadWorkcellsForAccessibleLabs = () => {
    const remaining = labIds.filter((id) => !fetchedLabIds.has(id));
    remaining.forEach((labId) => {
      WorkcellActions.loadWorkcellsByLabId(labId);
    });

    setFetchedLabIds(new Set(Array.from(fetchedLabIds).concat(labIds)));
  };

  useEffect(() => {
    LabActions.loadAllLabWithFeature(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE);
  }, []);

  useEffect(() => {
    loadWorkcellsForAccessibleLabs();
  }, [labIds]);

  return (
    <Page title={'Dashboard'}>
      <FederatedWrapper id="operator-dashboard" error={<div>Unable to load Operator Dashboard.</div>}>
        <OperatorDashboard
          routeBase={Urls.operator_dashboard()}
          amsBase={Urls.ams}
          hostManifest={manifest}
          areLabsLoaded={areLabsLoaded}
        />
      </FederatedWrapper>
    </Page>
  );
}

OperatorDashboardPage.displayName = 'OperatorDashboardPage';

/*
 * Hacky way for now. we need to find a better solution for AMS returning url information.
 */
const adaptURL = (url?: string): string | null => {
  if (!url) return null;
  return url.replace(/\.internal/, '');
};

const getStateFromStores = () => {
  const labIds =  FeatureStore.getLabIdsWithFeatures(FeatureConstants.SUBMIT_INSTRUCTIONS_TO_EXECUTE).toJS();
  const labs = LabStore.getByIds(labIds);

  const areLabsLoaded = labIds.length  === labs.size;

  const manifest = labs.reduce((agg, lab) => {
    const workcellsInLab = WorkcellStore.getByLabId(lab.get('id'));
    const labManifest = workcellsInLab.reduce((workcellManifest, workcell) => {
      const maybeUrl = adaptURL(workcell.get('url'));
      const url = workcell.get('backend_address') || maybeUrl;
      if (url) {
        return {
          ...workcellManifest,
          [workcell.get('name')]: {
            url,
            type: workcell.get('workcell_type'),
            workcellId: workcell.get('id'),
            nodeId: workcell.get('node_id'),
            isTest: !!workcell.get('is_test')
          }
        };
      } else {
        return workcellManifest;
      }
    }, {});
    return { ...agg, [lab.get('name')]: { labId: lab.get('id'), workcells: labManifest } };
  }, {});

  return {
    areLabsLoaded,
    labIds,
    manifest
  };
};

export default ConnectToStores(OperatorDashboardPage, getStateFromStores);
