import Immutable from 'immutable';
import _ from 'lodash';

import { validators }        from 'main/components/validation';
import ContainerStore        from 'main/stores/ContainerStore';
import ContainerTypeStore    from 'main/stores/ContainerTypeStore';
import * as Unit             from 'main/util/unit';
import ContainerTypeHelper from 'main/helpers/ContainerType';

const PlateCreateLogic = {
  initialInputValues(containerTypeId = '96-pcr', testMode = false) {
    let rows = 8;
    let cols = 12;

    const containerType = ContainerTypeStore.getById(containerTypeId);
    if (containerType) {
      const wellCount = containerType.get('well_count');
      cols = containerType.get('col_count');
      rows = wellCount / cols;
    }

    return Immutable.fromJS({
      // plate detail inputs
      name: undefined,
      containerType: containerTypeId,
      storage: ContainerStore.defaultStorageCondition,
      force_validate: false,

      // plate view
      // Immutable.Map 'wellIndex -> {filled(bool), selected(bool), error(bool)}'
      wellMap: Immutable.Map(),
      rows,
      cols,

      test_mode: testMode == true
    });
  },

  errorMsg(value, validatorsList, optional = false) {
    if (optional && _.isEmpty(value)) {
      return undefined;
    }
    for (const validator of validatorsList) { // eslint-disable-line no-restricted-syntax
      const msg = validator(value);
      if (msg != undefined) {
        return msg;
      }
    }
    return undefined;
  },

  errors(inputValues) {
    return Immutable.fromJS({
      name: this.errorMsg(inputValues.get('name'), [
        validators.non_empty,
        validators.not_too_long,
        validators.no_slashes,
        validators.no_commas
      ]),
      globalError:
        inputValues.get('wellMap').size === 0
          ? 'Must specify at least one well'
          : undefined,
      hasWellErrors: this.hasWellErrors(inputValues)
    });
  },

  hasWellErrors(inputValues) {
    const wellMap = inputValues.get('wellMap');
    return (
      wellMap.size === 0 ||
      wellMap.valueSeq().some(well => well.get('hasError', false))
    );
  },

  isValid(inputValues) {
    const errors = this.errors(inputValues);
    return errors.every(v => !v);
  },

  forceErrors(inputValues) {
    return inputValues.set('force_validate', true);
  },

  nameError(name) {
    return this.errorMsg(name, [
      validators.not_too_long,
      validators.no_slashes
    ]);
  },

  volumeError(volume, maxVolume, minVolume) {
    const v = Unit.toScalar(volume, 'microliter');

    if (maxVolume != undefined) {
      if (minVolume != undefined) {
        return validators.between(minVolume, maxVolume)(v);
      }
      return validators.between(0, maxVolume)(v);
    } else {
      if (minVolume != undefined) {
        return validators.at_least(minVolume)(v);
      }
      return validators.positive_float(v);
    }
  },

  massError(mass, maxVolume, minMass) {
    const m = Unit.toScalar(mass, 'milligram');
    if (maxVolume !== undefined) {
      if (minMass !== undefined) {
        return validators.between(minMass, 2 * maxVolume)(m);
      }
      // Mass limit should be 2x density of water if the max volume exists for a container type
      return validators.between(0, 2 * maxVolume)(m);
    } else {
      if (minMass != undefined) {
        return validators.at_least(minMass)(m);
      }
      return validators.positive_float(m);
    }
  },

  isEmptyMassMgPositive(emptyMassMg) {
    const m = Unit.toScalar(emptyMassMg, 'milligram');
    return validators.positive_float(m);
  },

  isEmptyMassOrVolume(value) {
    return value === undefined || _.startsWith(value, ':');
  },

  massVolumeError(mass, volume, maxVolume, minMass, minVolume) {
    let volumeError = this.volumeError(volume, maxVolume, minVolume);
    let massError = this.massError(mass, maxVolume, minMass);

    const isEmptyVolume = this.isEmptyMassOrVolume(volume);
    const isEmptyMass = this.isEmptyMassOrVolume(mass);

    const isInvalidMass = massError && !isEmptyMass;
    const isInValidVolume = volumeError && !isEmptyVolume;

    const hideVolumeError = isEmptyVolume && (!massError || isInvalidMass);
    const hideMassError = isEmptyMass && (isEmptyVolume || !volumeError || isInValidVolume);

    if (hideMassError) {
      massError = undefined;
    }
    if (hideVolumeError) {
      volumeError = undefined;
    }

    return { volumeError, massError };
  },

  buildContainer(inputValues) {
    const wellMap = inputValues.get('wellMap');

    const container = {
      label: inputValues.get('name'),
      container_type: inputValues.get('containerType'),
      storage_condition: inputValues.get('storage'),
      test_mode: inputValues.get('test_mode'),
      lab_id: inputValues.get('lab_id')
    };

    container.aliquots = wellMap.map(v =>
      Immutable.Map({
        name: v.get('name'),
        volume_ul: Unit.toScalar(v.get('volume'), 'microliter'),
        mass_mg: Unit.toScalar(v.get('mass'), 'milligram'),
        properties: v.get('properties', Immutable.Map())
      }).toJS()
    );

    const cover = inputValues.get('cover');
    if (cover && cover !== 'uncovered') {
      container.cover = cover;
    }

    return container;
  },

  buildContainerWithBulkCreateContainerPayLoad(inputValues) {
    const wellMap = inputValues.get('wellMap').toJS();

    const container = {
      label: inputValues.get('name'),
      container_type: inputValues.get('containerType'),
      storage_condition: inputValues.get('storage'),
      test_mode: inputValues.get('test_mode'),
      lab_id: inputValues.get('lab_id')
    };

    const store = ContainerTypeStore.getById(container.container_type).toJS();
    const containerType = new ContainerTypeHelper(store);

    container.aliquots = [];

    for (const [aq_well_idx, aq_details] of Object.entries(wellMap)) {
      const aliquot_info = {};
      aliquot_info.well_idx = containerType.humanWell(parseInt(aq_well_idx, 10));
      aliquot_info.name = aq_details.name;
      aliquot_info.volume_ul = Unit.toScalar(aq_details.volume, 'microliter');
      aliquot_info.mass_mg = Unit.toScalar(aq_details.mass, 'milligram');
      aliquot_info.properties = Immutable.fromJS(aq_details.properties);
      container.aliquots.push(aliquot_info);
    }

    const cover = inputValues.get('cover');
    if (cover && cover !== 'uncovered') {
      container.cover = cover;
    }

    return container;
  }
};

export default PlateCreateLogic;
