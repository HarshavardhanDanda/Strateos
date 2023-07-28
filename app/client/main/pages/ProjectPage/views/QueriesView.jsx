import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import ProjectActions                  from 'main/actions/ProjectActions';
import QueryActions                    from 'main/actions/QueryActions';
import { TabLayout, TabLayoutSidebar } from 'main/components/TabLayout';
import ConnectToStores                 from 'main/containers/ConnectToStoresHOC';
import { QueryStore }                  from 'main/stores/QueryStore';
import ajax                            from 'main/util/ajax';
import Urls                            from 'main/util/urls';

import { VerticalNavBar, TabRouter, Spinner, DateTime, Table, Column, TextBody } from '@transcriptic/amino';

class QueryResults extends React.Component {
  render() {
    const isEmpty =
      this.props.results == undefined ||
      this.props.results.get('rows', Immutable.List()).isEmpty();

    if (this.props.loading) {
      return <Spinner />;
    }

    if (isEmpty) {
      return <h2 className="caption tx-type--secondary">Nothing here.</h2>;
    }

    return (
      <Table
        id="projects-page-queries-table"
        data={this.props.results.get('rows')}
        loaded
        disabledSelection
      >
        {this.props.results.get('columns').map((id) => (
          <Column
            key={id}
            header={id}
            disableFormatHeader
            renderCellContent={(row) => (
              id === 'id' ? (
                <a href={Urls.deref(row.get(id))}>{row.get(id)}</a>
              ) : (
                id === 'created_at' ? (
                  <DateTime timestamp={row.get(id)} format="absolute-date-time" />
                ) : (
                  row.get(id) || <TextBody type="secondary">blank</TextBody>
                )
              )
            )}
          />
        )).toJS()}
      </Table>
    );
  }
}

QueryResults.propTypes = {
  results: PropTypes.instanceOf(Immutable.Map),
  loading: PropTypes.bool
};

class QuerySidebar extends React.Component {
  render() {
    return (
      <VerticalNavBar
        links={this.props.queries.map((query) => {
          return {
            name: query.get('label'),
            url: Urls.query(this.props.projectId, query.get('id'))
          };
        }).toJS()}
      />
    );
  }
}

QuerySidebar.propTypes = {
  queries: PropTypes.instanceOf(Immutable.Iterable),
  projectId: PropTypes.string.isRequired
};

const propTypes = {
  project: PropTypes.instanceOf(Immutable.Map).isRequired,
  projectId: PropTypes.string.isRequired,
  queries: PropTypes.instanceOf(Immutable.Iterable),
  match: PropTypes.shape({
    params: PropTypes.shape({
      subdomain: PropTypes.string.isRequired,
      projectId: PropTypes.string.isRequired,
      queryId: PropTypes.string
    })
  }),
  isLoaded: PropTypes.bool
};

class QueriesView extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      statusCode: undefined,
      loading: true,
      results: Immutable.List()
    };
  }

  componentDidMount() {
    if (!this.props.isLoaded) {
      ajax
        .when(
          ProjectActions.load(this.props.projectId),
          QueryActions.loadAll(this.props.projectId)
        )
        .fail(() =>
          this.setState({
            statusCode: 400
          })
        );
    }

    if (this.props.match.params.queryId) {
      this.fetch();
    }
  }

  componentDidUpdate(prevProps) {
    const queryId = this.props.match.params.queryId;
    if (queryId && queryId !== prevProps.match.params.queryId) {
      this.fetch();
    }
  }

  doFetch() {

    return ajax
      .get(
        Urls.query(
          this.props.projectId,
          this.props.match.params.queryId
        )
      )
      .done((results) => {
        return this.setState({
          loading: false,
          results: Immutable.fromJS(results)
        });
      });
  }

  fetch() {
    return this.setState(
      {
        loading: true,
        results: Immutable.List()
      },
      () => this.doFetch()
    );
  }

  render() {
    const { project, match, isLoaded } = this.props;
    const { subdomain, projectId } = match.params;

    if (!isLoaded) {
      return <Spinner />;
    }

    return (
      <TabRouter
        basePath={`/${subdomain}/${projectId}/queries`}
        defaultTabId={this.props.queries.first().get('id')}
      >
        {
          (queryId) => {
            return (
              <TabLayout>
                <TabLayoutSidebar>
                  <QuerySidebar
                    queries={this.props.queries}
                    project={project}
                    projectId={projectId}
                  />
                </TabLayoutSidebar>

                <QueryResults
                  results={this.state.results}
                  loading={this.state.loading}
                  active_query_id={queryId}
                />
              </TabLayout>
            );
          }
        }
      </TabRouter>
    );
  }
}

QueriesView.propTypes = propTypes;

const getStateFromStores = (props) => {
  const queries  = QueryStore.getAll();
  const isLoaded = props.project && QueryStore.isLoaded() && queries.count() > 0;

  return {
    projectId: props.project.get('id'),
    queries,
    isLoaded
  };
};

export default ConnectToStores(QueriesView, getStateFromStores);
