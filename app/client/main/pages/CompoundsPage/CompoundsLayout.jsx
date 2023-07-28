import React from 'react';
import Urls from 'main/util/urls';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import { TabRouter, Subtabs, Breadcrumbs, Page } from '@transcriptic/amino';
import { NavLink, Link } from 'react-router-dom';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import CompoundsPage from 'main/pages/CompoundsPage/CompoundsPage';
import CompoundCreationDropDown from 'main/pages/CompoundsPage/CompoundCreationDropDown';
import BatchesPage from 'main/pages/CompoundsPage/BatchesPage';

export function Tabs() {
  return (
    <Subtabs>
      {AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT) && (
        <NavLink to={Urls.compounds_page()}>
          Compounds
        </NavLink>
      )}
      { (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB)) && (
        <NavLink to={Urls.batches_page()}>
          Batches
        </NavLink>
      )}
    </Subtabs>
  );
}

function CompoundsLayout(props) {
  const { match, history } = props;

  return (
    <Page title="Compounds">
      <TabRouter basePath={Urls.compounds()} defaultTabId="compounds">
        {
              () => {
                return (
                  <PageLayout
                    PageHeader={(
                      <PageHeader
                        titleArea={(
                          <Breadcrumbs>
                            <Link
                              to={Urls.compounds()}
                            >
                              Compounds
                            </Link>
                          </Breadcrumbs>
                        )}
                        primaryInfoArea={match.path === Urls.compounds_page() &&
                          <CompoundCreationDropDown alignment="right" />
                        }
                      />
                    )}
                    Subtabs={<Tabs />}
                  >
                    {(match.path === Urls.compounds_page() && AcsControls.isFeatureEnabled(FeatureConstants.COMPOUND_MGMT)) && (
                    <CompoundsPage history={history} />
                    )}
                    { (match.path === Urls.batches_page() && (AcsControls.isFeatureEnabled(FeatureConstants.VIEW_BATCHES) || AcsControls.isFeatureEnabled(FeatureConstants.MANAGE_BATCHES_IN_LAB))) && (
                    <BatchesPage history={history} />
                    )}
                  </PageLayout>
                );
              }}
      </TabRouter>
    </Page>
  );
}

export default CompoundsLayout;
