import Immutable from 'immutable';

import ContainerTypeStore from 'main/stores/ContainerTypeStore';
import PlateCreateLogic from 'main/components/PlateCreate/PlateCreateLogic';
import { TubeCreateLogic } from 'main/inventory/components/tube_views';

const CreateContainersLogic = {
  isPlate(container) {
    return ContainerTypeStore.isPlate(container.get('containerType'));
  },

  errors(containers, minMass = 0, minVolume = 0) {
    return containers.map((container) => {
      // ensure valid containerType before the remaining tube validations since
      // the validations are containerType specific
      const containerTypeError = TubeCreateLogic.containerTypeError(
        container.get('containerType')
      );

      if (containerTypeError) {
        return Immutable.fromJS({
          containerType: containerTypeError
        });
      } else if (this.isPlate(container)) {
        return PlateCreateLogic.errors(container);
      } else {
        const tubeType = ContainerTypeStore.getById(
          container.get('containerType')
        );
        return TubeCreateLogic.errors(container, tubeType, minMass, minVolume);
      }
    });
  },

  errorBooleans(containers, minMass = 0, minVolume = 0) {
    // calculates if any error exists for each plate and tube
    return this.errors(containers, minMass, minVolume).map(errors => errors.some(value => value));
  },

  isValid(containers, minMass = 0, minVolume = 0) {
    return this.errorBooleans(containers, minMass, minVolume).every(hasError => !hasError);
  },

  forceErrors(container) {
    if (this.isPlate(container)) {
      return PlateCreateLogic.forceErrors(container);
    } else {
      return TubeCreateLogic.forceErrors(container);
    }
  },

  forceAllErrors(containers) {
    return containers.map(container => this.forceErrors(container));
  }
};

export default CreateContainersLogic;
