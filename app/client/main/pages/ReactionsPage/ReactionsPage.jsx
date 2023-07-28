/**
 * Chemical reactions micro-app. It dosen't related to ReactionPage
 */
import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import FederatedWrapper from 'main/components/FederatedWrapper';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import Urls from 'main/util/urls.js';
import { Breadcrumbs, Spinner } from '@transcriptic/amino';

/* eslint-disable import/no-unresolved */
const ReactionsApp = React.lazy(() => import('chemical_reactions/App'));
/* eslint-enable import/no-unresolved */

const getReactionsBase = () => `${Urls.chemicalReactions()}`;

class ReactionsPage extends React.Component {
  renderTitle() {
    return (
      <Breadcrumbs>
        <Link
          to={Urls.chemicalReactions()}
        >
          Reactions
        </Link>
      </Breadcrumbs>
    );
  }

  render() {
    return (
      <PageLayout
        PageHeader={(
          <PageHeader
            titleArea={this.renderTitle()}
          />
        )}
      >
        <FederatedWrapper error={<div>Unable to load Chemical Reactions.</div>}>
          <Suspense fallback={<Spinner />}>
            <ReactionsApp routeBase={getReactionsBase()} />
          </Suspense>
        </FederatedWrapper>
      </PageLayout>
    );
  }
}

ReactionsPage.displayName = 'ReactionsPage';
export { ReactionsPage };
