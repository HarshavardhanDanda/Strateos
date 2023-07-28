import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';
import { VerticalNavItem, FormGroup } from '@transcriptic/amino';

import './CreateContainersListPane.scss';

class CreateContainersListPane extends React.Component {
  render() {
    return (
      <div className="create-containers-list-pane">
        <If condition={this.props.containers.size > 0}>
          <FormGroup label="Containers">
            <div className="tx-stack tx-stack--sm">
              {
                this.props.containers.map((container, i) => {
                  const isPlate = this.props.isPlate(
                    container.get('containerType')
                  );
                  const defaultName = isPlate ? 'Unnamed Plate' : 'Unnamed Tube';
                  const active = i === this.props.containerIndex;
                  const hasError =
                    this.props.errorBooleans.get(i) &&
                    container.get('force_validate');

                  return (
                    <div
                      className="create-containers-list-pane__nav-item"
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${container.get('name') || defaultName}-${i}`}
                    >
                      <div>
                        <Choose>
                          <When condition={isPlate}>
                            <i className="aminol-plate" />
                          </When>
                          <Otherwise>
                            <i className="aminol-tube" />
                          </Otherwise>
                        </Choose>
                      </div>
                      <div className="create-containers-list-pane__nav-item-label">
                        <VerticalNavItem
                          name={container.get('name') || defaultName}
                          active={active}
                          icon={hasError && 'fa fa-exclamation-circle'}
                          iconStyle={hasError && 'create-containers-list-pane__nav-item--error'}
                          onClick={() => { this.props.onContainerSelected(i); }}
                          size="small"
                        />
                      </div>
                      <div>
                        <i
                          onClick={() => { this.props.onDeleteContainer(i); }}
                          className="fas fa-trash create-containers-list-pane__nav-item-icon"
                        />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </FormGroup>
        </If>
      </div>
    );
  }
}

CreateContainersListPane.propTypes = {
  containers: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  containerIndex: PropTypes.number,
  onContainerSelected: PropTypes.func,
  isPlate: PropTypes.func,
  onDeleteContainer: PropTypes.func,
  errorBooleans: PropTypes.instanceOf(Immutable.Iterable)
};

export default CreateContainersListPane;
