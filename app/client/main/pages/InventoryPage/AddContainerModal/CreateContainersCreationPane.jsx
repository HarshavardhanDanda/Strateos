import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React     from 'react';

import PlateCreate    from 'main/components/PlateCreate';
import { TubeCreate }     from 'main/inventory/components/tube_views';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

import { Card, Button } from '@transcriptic/amino';

import './CreateContainersCreationPane.scss';

function CreateContainersCreationPane({
  isPlate,
  container,
  onInputValuesChange,
  onUseCSV,
  showNextButton,
  onNext,
  hideCompoundLink,
  compoundLinkId,
  mass,
  volume,
  getLinkedCompoundArray, linkedCompoundsArray, containerArray, deletedIndex, containerIndex
}) {
  return (
    <Card>
      <div className="create-containers-creation-pane">
        <Choose>
          <When condition={isPlate}>
            <PlateCreate
              inputValues={container}
              onInputValuesChange={onInputValuesChange}
              onUseCSV={onUseCSV}
              getLinkedCompoundArray={getLinkedCompoundArray}
              linkedCompoundsArray={linkedCompoundsArray}
              containerArray={containerArray}
              containerIndex={containerIndex}
              deletedIndex={deletedIndex}
              containerType={ContainerTypeStore.getById(
                container.get('containerType')
              )}
            />
          </When>
          <Otherwise>
            <TubeCreate
              inputValues={container}
              onInputValuesChange={onInputValuesChange}
              containerType={ContainerTypeStore.getById(
                container.get('containerType')
              )}
              hideCompoundLink={hideCompoundLink}
              compoundLinkId={compoundLinkId}
              mass={mass}
              volume={volume}
              getLinkedCompoundArray={getLinkedCompoundArray}
              linkedCompoundsArray={linkedCompoundsArray}
              containerArray={containerArray}
              containerIndex={containerIndex}
              deletedIndex={deletedIndex}
            />
          </Otherwise>
        </Choose>
        <If condition={showNextButton}>
          <Button
            className="next-btn"
            type="default"
            height="tall"
            onClick={onNext}
          >
            Label Next Container <i className="fa fa-caret-right" />
          </Button>
        </If>
      </div>
    </Card>
  );
}

CreateContainersCreationPane.propTypes = {
  isPlate: PropTypes.bool,
  container: PropTypes.instanceOf(Immutable.Map).isRequired,
  onInputValuesChange: PropTypes.func.isRequired,
  onUseCSV: PropTypes.func,
  showNextButton: PropTypes.bool,
  onNext: PropTypes.func,
  mass: PropTypes.number,
  volume: PropTypes.number,
  hideCompoundLink: PropTypes.bool,
  compoundLinkId: PropTypes.arrayOf(PropTypes.string),
  containerArray: PropTypes.instanceOf(Immutable.Iterable).isRequired,
  containerIndex: PropTypes.number.isRequired,
  deletedIndex: PropTypes.number,
  getLinkedCompoundArray: PropTypes.func.isRequired,
  linkedCompoundsArray: PropTypes.arrayOf(PropTypes.instanceOf(Object))
};

export default CreateContainersCreationPane;
