import _ from 'lodash';
import React from 'react';
import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import sinon from 'sinon';
import CompoundStore from 'main/stores/CompoundStore';
import FeatureStore from 'main/stores/FeatureStore';
import FeatureConstants from '@strateos/features';
import CompoundSelectorModal from 'main/components/Compounds/CompoundSelector/CompoundSelectorModal';
import SessionStore from 'main/stores/SessionStore';
import PlateCreateLogic from './PlateCreateLogic';
import PlateCreate from './PlateCreate';

describe('PlateCreate test', () => {
  const sandbox = sinon.createSandbox();
  let hasFeatureStub;

  function createPlate() {
    return shallow(
      <PlateCreate
        inputValues={Immutable.Map({
          name: 'Plate 1',
          containerType: '96-pcr',
          wellMap: Immutable.Map(),
          rows: 8,
          cols: 12,
          force_validate: true
        })}
        containerIndex={0}
        containerType={Immutable.Map()}
        getLinkedCompoundArray={() => {}}
        containerArray={Immutable.Iterable([{ name: 'Plate 1', containerType: '96-pcr' }])}
      />);
  }

  function stubPermissionForRegisteringCompound(canRegisterPublicCompound, canRegisterCompound) {
    hasFeatureStub.withArgs(FeatureConstants.REGISTER_COMPOUND).returns(canRegisterCompound);
    hasFeatureStub.withArgs(FeatureConstants.REGISTER_PUBLIC_COMPOUND).returns(canRegisterPublicCompound);
  }

  const props = {
    inputValues: Immutable.Map({
      name: 'Plate 1',
      containerType: '96-pcr',
      wellMap: Immutable.Map(),
      rows: 8,
      cols: 12,
      force_validate: true
    }),
    containerIndex: 0,
    containerType: Immutable.Map(),
    getLinkedCompoundArray: () => {},
    containerArray: Immutable.Iterable([{ name: 'Plate 1', containerType: '96-pcr' }])
  };

  beforeEach(() => {
    sandbox.stub(SessionStore, 'getOrg')
      .returns(Immutable.fromJS({ id: 'org296' }));

    hasFeatureStub = sandbox.stub(FeatureStore, 'hasFeature');
    hasFeatureStub.withArgs(FeatureConstants.LINK_COMPOUND_RESOURCE).returns(true);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should render a single plate with correct number of labeled inputs', () => {
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    const plateCreateInstance = plateCreate.instance();
    expect(plateCreate.find('Plate').length).to.be.equal(1);
    expect(plateCreate.find('WellInputs').length).to.be.equal(0);
    expect(plateCreate.find('Plate').props().rows).to.be.equal(8);
    expect(plateCreate.find('Plate').props().cols).to.be.equal(12);
    // Simulate click on a single well
    plateCreate.find('Plate').props().onWellClick(0, {});
    expect(plateCreateInstance.getSelectedWells().size).to.equal(1);
    const wellInputs = plateCreate.find('WellInputs');
    expect(wellInputs.length).to.be.equal(1);
    const inputWithUnits = wellInputs.first().find('InputWithUnits');
    expect(inputWithUnits.length).to.equal(2);
    const inputWithUnits1 = inputWithUnits.at(0);
    const inputWithUnits2 = inputWithUnits.at(1);
    expect(inputWithUnits1.prop('dimension')).to.equal('volume');
    expect(inputWithUnits2.prop('dimension')).to.equal('mass');
    plateCreate.unmount();
  });

  it('shows linked compounds', () => {
    const compound = {
      formula: 'C12H17N',
      smiles: 'NC1CCC(c2ccccc2)CC1',
      id: 'cmpl1eguccdrdwwsg'
    };
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS(compound));

    const plateCreate = mount(
      <PlateCreate
        {...props}
        inputValues={Immutable.Map({
          name: 'Plate 1',
          containerType: '96-pcr',
          containerIndex: 0,
          wellMap: Immutable.fromJS({
            0: {
              selected: true,
              hasError: true,
              hasVolume: true
            }
          }),
          rows: 8,
          cols: 12,
          force_validate: true
        })}
        containerType={Immutable.Map({ well_volume_ul: '160.0' })}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );

    plateCreate.setState({ linkedCompoundsArray: [[{ compoundLinks: [{ id: 'cmpl1eguccdrdwwsg', concentration: undefined, solubility_flag: undefined }] }]], selectedIndex: 0 });
    plateCreate.update();

    const headerCells = plateCreate.find('Block').find('HeaderCell');
    expect(headerCells.length).to.equal(5);
    expect(headerCells.at(0).text()).to.equal('Structure');
    expect(headerCells.at(1).text()).to.equal('Formula');
    expect(headerCells.at(2).text()).to.equal('Concentration');
    expect(headerCells.at(3).text()).to.equal('Solubility Flag');

    const bodyCells = plateCreate.find('Block').find('BodyCell');
    expect(bodyCells.length).to.equal(3);
    expect(bodyCells.at(0).find('Molecule').props().SMILES).to.equal('NC1CCC(c2ccccc2)CC1');
    expect(bodyCells.at(1).text()).to.equal('C12H17N');
    expect(bodyCells.at(2).find('InplaceInput').text()).to.equal(' -  - ');
    expect(bodyCells.at(2).find('InplaceInput').find('i').at(0)
      .hasClass('fa-edit')).to.be.true;
    expect(bodyCells.at(2).find('InplaceInput').find('i').at(1)
      .hasClass('fa-trash')).to.be.true;

    plateCreate.unmount();
  });

  it('should not render Link Compound button when no aliquots are selected ', () => {
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    expect(plateCreate.find('Button').length).to.be.equal(0);
    plateCreate.unmount();
  });

  it('should render Link Compound button when an aliqout is selected ', () => {
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    const plateCreateInstance = plateCreate.instance();
    plateCreate.find('Plate').props().onWellClick(0, {});
    expect(plateCreateInstance.getSelectedWells().size).to.equal(1);
    const wellInputs = plateCreate.find('WellInputs');
    expect(wellInputs.length).to.be.equal(1);
    expect(plateCreate.find('Button').at(1).text()).to.be.equal('Link Compounds');
    plateCreate.unmount();
  });

  it('should render the text No Linked Compounds when no compounds are linked to the aliquot', () => {
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    const plateCreateInstance = plateCreate.instance();
    plateCreate.find('Plate').props().onWellClick(0, {});
    expect(plateCreateInstance.getSelectedWells().size).to.equal(1);
    const wellInputs = plateCreate.find('WellInputs');
    expect(wellInputs.length).to.be.equal(1);
    expect(plateCreate.find('.plate-create__zero-state-text').length).to.be.equal(1);
    expect(plateCreate.find('.plate-create__zero-state-text').text()).to.be.equal('No linked compounds');
    plateCreate.unmount();
  });

  it('should have a unique set of linked compounds for every aliquot for a plate', () => {
    const compound = {
      formula: 'C12H17N',
      smiles: 'NC1CCC(c2ccccc2)CC1',
      id: 'cmpl1eguccdrdwwsg'
    };
    sandbox.stub(CompoundStore, 'getById')
      .returns(Immutable.fromJS(compound));

    const plateCreate = mount(
      <PlateCreate
        {...props}
        inputValues={Immutable.Map({
          name: 'Plate 1',
          containerType: '96-pcr',
          containerIndex: 0,
          wellMap: Immutable.fromJS({
            0: {
              selected: true,
              hasError: true,
              hasVolume: true
            },
            2: {
              selected: false,
              hasError: true,
              hasVolume: true
            }
          }),
          rows: 8,
          cols: 12,
          force_validate: true
        })}
        containerType={Immutable.Map({ well_volume_ul: '160.0' })}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );

    plateCreate.setState({ linkedCompoundsArray: [[{ compoundLinks: [{ id: 'cmpl1eguccdrdwwsg', concentration: undefined, solubility_flag: undefined }] }]], selectedIndex: 0 });
    plateCreate.update();

    let bodyCells = plateCreate.find('Block').find('BodyCell');
    expect(bodyCells.length).to.equal(3);
    expect(bodyCells.at(0).find('Molecule').props().SMILES).to.equal('NC1CCC(c2ccccc2)CC1');
    expect(bodyCells.at(1).text()).to.equal('C12H17N');
    expect(bodyCells.at(2).find('InplaceInput').text()).to.equal(' -  - ');
    expect(plateCreate.find('Row').length).to.equal(2);

    const thirdWellIndex = 2;
    plateCreate.find('Plate').props().onWellClick(thirdWellIndex, {});

    expect(plateCreate.find('.plate-create__zero-state-text').length).to.be.equal(1);

    const linkedCompoundsArray = plateCreate.state().linkedCompoundsArray;
    linkedCompoundsArray[0][2] = { compoundLinks: [{ id: 'cmpl1eguccdrdwwsg', concentration: '50:millimolar', solubility_flag: 'true' }] };
    plateCreate.setState({ linkedCompoundsArray, selectedIndex: 0 });
    plateCreate.instance().renderLinkedCompounds();

    bodyCells = plateCreate.find('Block').find('BodyCell');
    expect(bodyCells.length).to.equal(3);
    expect(bodyCells.at(0).find('Molecule').props().SMILES).to.equal('NC1CCC(c2ccccc2)CC1');
    expect(bodyCells.at(1).text()).to.equal('C12H17N');
    expect(bodyCells.at(2).find('InplaceInput').text()).to.equal('50 mMtrue');
    plateCreate.unmount();
  });

  it('should not display the linked compound button when it does not have required permissions', () => {
    hasFeatureStub.withArgs(FeatureConstants.LINK_COMPOUND_RESOURCE).returns(false);
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    plateCreate.find('Plate').props().onWellClick(0, {});
    const wellInputs = plateCreate.find('WellInputs');
    expect(wellInputs.length).to.be.equal(1);
    expect(plateCreate.find('.plate-create__zero-state-text').length).to.be.equal(0);
    expect(plateCreate.find('Button').at(1).length).to.be.equal(0);
  });

  it('should show only private compounds of the current org and public compounds when  linking compounds', () => {
    const plateCreate = mount(
      <PlateCreate
        {...props}
        onInputValuesChange={(inputValues) => { plateCreate.setProps({ inputValues }); }}
      />
    );
    const compoundSelectorModal = plateCreate.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().searchPublicAndPrivateByOrgId).to.equal('org296');
  });

  it('should be able to register compound if user has REGISTER_PUBLIC_COMPOUND permission', () => {
    stubPermissionForRegisteringCompound(true, false);

    const plateCreate = createPlate();
    const compoundSelectorModal = plateCreate.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.true;
  });

  it('should be able to register compound if user has REGISTER_COMPOUND permission', () => {
    stubPermissionForRegisteringCompound(false, true);

    const plateCreate = createPlate();
    const compoundSelectorModal = plateCreate.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.true;
  });

  it('should not be able to register compound if user does not have permission', () => {
    stubPermissionForRegisteringCompound(false, false);
    const plateCreate = createPlate();
    const compoundSelectorModal = plateCreate.find(CompoundSelectorModal);
    expect(compoundSelectorModal.props().allowCompoundRegistration).to.be.false;
  });
});

describe('PlateCreateLogic test', () => {

  const maxVolume = 250;

  it('has correct massError function', () => {
    expect(PlateCreateLogic.massError('15:milligram', undefined)).to.be.equal(undefined);
    expect(PlateCreateLogic.massError('-15:milligram', undefined)).to.be.equal('Must be numeric and positive');
    expect(PlateCreateLogic.massError('-15:milligram', maxVolume)).to.be.equal(`Must be between 0 and ${2 * maxVolume}`);
    expect(PlateCreateLogic.massError('15:milligram', maxVolume)).to.be.equal(undefined);
  });

  it('calls massVolumeError with valid mass and valid volume', () => {
    const { volumeError, massError } = PlateCreateLogic.massVolumeError('15:milligram', '15:microliter', maxVolume);
    expect(volumeError, massError).to.eql(undefined);
  });

  it('calls massVolumeError with undefined/empty mass and undefined/empty volume', () => {
    const errors = [
      PlateCreateLogic.massVolumeError(undefined, undefined, maxVolume),
      PlateCreateLogic.massVolumeError(undefined, ':microliter', maxVolume),
      PlateCreateLogic.massVolumeError(':milligram', undefined, maxVolume),
      PlateCreateLogic.massVolumeError(':milligram', ':microliter', maxVolume)
    ];
    _.forEach(errors, (error) => {
      expect(error.volumeError).to.eql(`Must be between 0 and ${maxVolume}`);
      expect(error.massError).to.eql(undefined);
    });
  });

  it('calls massVolumeError with undefined/empty mass and valid volume', () => {
    const errors = [
      PlateCreateLogic.massVolumeError(undefined, '15:microliter', maxVolume),
      PlateCreateLogic.massVolumeError(':milligram', '15:microliter', maxVolume)
    ];
    _.forEach(errors, (error) => {
      expect(error.volumeError).to.eql(undefined);
      expect(error.massError).to.eql(undefined);
    });
  });

  it('calls massVolumeError with valid mass and undefined/empty volume', () => {
    const errors = [
      PlateCreateLogic.massVolumeError('15:milligram', undefined, maxVolume),
      PlateCreateLogic.massVolumeError('15:milligram', ':microliter', maxVolume)
    ];
    _.forEach(errors, (error) => {
      expect(error.volumeError).to.eql(undefined);
      expect(error.massError).to.eql(undefined);
    });
  });

  it('returns error for invalid/empty mass mg', () => {
    const errors = [
      PlateCreateLogic.isEmptyMassMgPositive('-15:milligram')
    ];
    _.forEach(errors, (error) => {
      expect(error).to.eql('Must be numeric and positive');
    });
  });

  it('calls massVolumeError with invalid mass and valid volume', () => {
    const { volumeError, massError } = PlateCreateLogic.massVolumeError('-15:milligram', '15:microliter', maxVolume);
    expect(volumeError).to.eql(undefined);
    expect(massError).to.eql(`Must be between 0 and ${2 * maxVolume}`);
  });

  it('calls massVolumeError with valid mass and invalid volume', () => {
    const { volumeError, massError } = PlateCreateLogic.massVolumeError('15:milligram', '-15:microliter', maxVolume);
    expect(massError).to.eql(undefined);
    expect(volumeError).to.eql(`Must be between 0 and ${maxVolume}`);
  });

  it('calls massVolumeError with empty/undefined mass and invalid volume', () => {
    const errors = [
      PlateCreateLogic.massVolumeError(undefined, '-15:microliter', maxVolume),
      PlateCreateLogic.massVolumeError(':milligram', '-15:microliter', maxVolume)
    ];
    _.forEach(errors, (error) => {
      expect(error.massError).to.eql(undefined);
      expect(error.volumeError).to.eql(`Must be between 0 and ${maxVolume}`);
    });
  });

  it('calls massVolumeError with invalid mass and empty/undefined volume', () => {
    const errors = [
      PlateCreateLogic.massVolumeError('-15:milligram', undefined, maxVolume),
      PlateCreateLogic.massVolumeError('-15:milligram', ':microliter', maxVolume)
    ];
    _.forEach(errors, (error) => {
      expect(error.volumeError).to.eql(undefined);
      expect(error.massError).to.eql(`Must be between 0 and ${2 * maxVolume}`);
    });
  });

  it('calls massVolumeError with invalid mass and invalid volume', () => {
    const { volumeError, massError } = PlateCreateLogic.massVolumeError('-15:milligram', '-15:microliter', maxVolume);
    expect(massError, 'massError').to.eql(`Must be between 0 and ${2 * maxVolume}`);
    expect(volumeError, 'volumeError').to.eql(`Must be between 0 and ${maxVolume}`);
  });

  it('calls containerNameError with invalid name', () => {
    const plateNameError = PlateCreateLogic.errors(Immutable.Map({ name: 'plate1,plate2', wellMap: Immutable.Map() }));
    expect(plateNameError.get('name')).to.eql('Comma not allowed');
  });
});
