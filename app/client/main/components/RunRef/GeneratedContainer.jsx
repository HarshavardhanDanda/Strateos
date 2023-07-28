import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import ContainerAPI from 'main/api/ContainerAPI';
import InteractivePlate from 'main/components/InteractivePlate';
import ContainerDetails from 'main/inventory/inventory/ContainerDetails';
import { Card, Section, Spinner } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import connectToStores from 'main/containers/ConnectToStoresHOC';
import ContainerStore from 'main/stores/ContainerStore';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import AliquotStore from 'main/stores/AliquotStore';
import UserStore from 'main/stores/UserStore';

import './RunRef.scss';

class GeneratedContainer extends React.Component {

  constructor() {
    super();

    this.state = {
      loading: false
    };
  }

  componentWillMount() {
    return this.fetch(this.props.containerId);
  }

  componentDidUpdate(prevProps) {
    if (this.props.containerId !== prevProps.containerId) {
      return this.fetch(this.props.containerId);
    }
  }

  fetch(containerId) {
    this.setState({ loading: true }, () => {
      return ContainerAPI.get(containerId, {
        includes: ['aliquots']
      }).done((response) => {
        const { created_by } = response.data.attributes;
        if (created_by && !UserStore.getById(created_by)) {
          UserActions.load(created_by);
        }
        this.setState({ loading: false });
      });
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Spinner />;

    return (
      <div className="run-ref-details">
        <Card>
          <div className="run-ref-details__card-content row">
            <If condition={this.props.aliquots && this.props.aliquots.count() && this.props.containerType}>
              <div className="run-ref-details__plate col-xs-12 col-md-8">
                <Section title="Container Contents">
                  <InteractivePlate
                    containerType={this.props.containerType}
                    aliquots={this.props.aliquots}
                  />
                </Section>
              </div>
            </If>
            <If condition={this.props.container && this.props.containerType}>
              <div className="run-ref-details__container-details col-xs-12 col-md-4">
                <Section title="Container Details">
                  <ContainerDetails
                    container={this.props.container}
                    runRef={Immutable.Map()}
                    containerType={this.props.containerType}
                  />
                </Section>
              </div>
            </If>
          </div>
        </Card>
      </div>
    );
  }
}

GeneratedContainer.propTypes = {
  containerId: PropTypes.string,
  container: PropTypes.instanceOf(Immutable.Map),
  containerType: PropTypes.instanceOf(Immutable.Map),
  aliquots: PropTypes.instanceOf(Immutable.List)
};

const getStateFromStores = ({ containerId }) => {
  const container = ContainerStore.getById(containerId);
  const aliquots = AliquotStore.getByContainer(
    container ? container.get('id') : undefined
  );

  const containerType = ContainerTypeStore.getById(
    container ? container.get('container_type_id') : undefined
  );

  return {
    containerId,
    container,
    aliquots,
    containerType
  };
};

const ConnectedGeneratedContainer = connectToStores(GeneratedContainer, getStateFromStores);

ConnectedGeneratedContainer.propTypes = {
  containerId: PropTypes.string.isRequired
};

export default ConnectedGeneratedContainer;
export { GeneratedContainer };
