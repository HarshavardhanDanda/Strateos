import Immutable from 'immutable';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Page, TabRouter, Subtabs, Breadcrumbs } from '@transcriptic/amino';

import ConnectToStores from 'main/containers/ConnectToStoresHOC';
import AjaxContainer from 'main/components/AjaxContainer';
import TisoReservationActions from 'main/actions/TisoReservationActions';
import TisoReservationStore from 'main/stores/TisoReservationStore';
import ContainerAPI from 'main/api/ContainerAPI';
import ContainerStore from 'main/stores/ContainerStore';
import OrganizationStore from 'main/stores/OrganizationStore';
import { PageLayout, PageHeader } from 'main/components/PageLayout';
import Urls from 'main/util/urls';
import ContainersTable from './ContainersTable';
import TisoTable from './TisoTable';

import './TisosPage.scss';

export function Tabs() {
  return (
    <Subtabs>
      <NavLink
        to={`${Urls.tisosPage()}/containers_table`}
      >
        Containers currently in tisos
      </NavLink>
      <NavLink
        to={`${Urls.tisosPage()}/tiso_table`}
      >
        Tiso reservations
      </NavLink>
    </Subtabs>
  );
}

const propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired
  }),
  containers: PropTypes.arrayOf(PropTypes.object),
  reservations: PropTypes.arrayOf(PropTypes.object)
};

class TisoPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.fetch = this.fetch.bind(this);
    this.state = {
      containerIds: Immutable.List()
    };
  }

  fetch() {
    const request = {
      includes: ['organization'],
      filters: {
        location_category: 'tiso_column'
      },
      limit: 20
    };

    ContainerAPI.indexAll(request).done((payloads) => {
      // gross hack to fetch ids from request.
      const ids = _.flattenDeep(
        payloads.map((payload) => {
          return payload.data.map(c => c.id);
        })
      );

      return this.setState({
        containerIds: new Set(ids)
      });
    });

    return TisoReservationActions.loadAll();
  }

  render() {
    const { match } = this.props;
    return (
      <Page title="Tisos">
        <AjaxContainer action={this.fetch}>
          <TabRouter basePath={Urls.tisosPage()} defaultTabId="containers_table">
            {
              () => {
                return (
                  <PageLayout
                    PageHeader={(
                      <PageHeader
                        titleArea={(
                          <Breadcrumbs>
                            <Link
                              to={`${Urls.tisosPage()}/containers_table`}
                            >
                              Tisos
                            </Link>
                          </Breadcrumbs>
                        )}
                      />
                    )}
                    Subtabs={<Tabs />}
                  >
                    <Choose>
                      <When condition={match.path === '/:subdomain/tisos/containers_table'}>
                        <ContainersTable
                          containers={this.props.containers.filter(c =>
                            this.state.containerIds.has(c.id)
                          )}
                        />
                      </When>
                      <When condition={match.path ===  '/:subdomain/tisos/tiso_table'}>
                        <TisoTable reservations={this.props.reservations} />
                      </When>
                    </Choose>
                  </PageLayout>
                );
              }}
          </TabRouter>
        </AjaxContainer>
      </Page>
    );
  }
}

TisoPage.propTypes = propTypes;

const getStateFromStores = function() {
  const containers = ContainerStore.getAll()
    .map((c) => {
      const org = OrganizationStore.getById(c.get('organization_id'));
      return c.set('organization', org);
    })
    .toJS();

  const reservations = TisoReservationStore.getAll().toJS();

  return {
    containers,
    reservations
  };
};

const ConnectedTisoPage = ConnectToStores(TisoPage, getStateFromStores);

function TisoSlot({ data }) {
  return <span>{`Col ${data.col} / Row ${data.row}`}</span>;
}

TisoSlot.propTypes = {
  data: PropTypes.shape({
    row: PropTypes.string,
    col: PropTypes.string
  })
};

export default ConnectedTisoPage;
export { TisoPage };
