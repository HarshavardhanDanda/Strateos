import React from 'react';
import sinon from 'sinon';
import Immutable from 'immutable';
import { expect } from 'chai';
import { mount } from 'enzyme';
import LibraryAPI from 'main/api/LibraryAPI';
import AcsControls from 'main/util/AcsControls';
import SessionStore from 'main/stores/SessionStore';
import FeatureConstants from '@strateos/features';
import { CompoundHeading } from 'main/components/Compounds/Compounds';
import CompoundDetail from './CompoundDetail';

const publicCompound = {
  id: 'cmp-id',
  name: 'cust1',
  clogp: '1.2543',
  molecular_weight: 350.4,
  formula: 'C16H18N2O5S',
  smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
  tpsa: '108.05',
  created_by: 'cc',
  organization_id: null,
  labels: []
};
const privateCompound = {
  id: 'cmp-id',
  name: 'cust1',
  clogp: '1.2543',
  molecular_weight: 350.4,
  formula: 'C16H18N2O5S',
  smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
  tpsa: '108.05',
  created_by: 'cc',
  organization_id: 'org13',
  labels: []
};

describe('Compound Detail', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    const libraries = {
      data:
        [{ id: 'lib1', attributes: { name: 'Library_1' } },
          { id: 'lib2', attributes: { name: 'Library_2' } }
        ]
    };
    const getLibraries = sandbox.stub(LibraryAPI, 'getLibraries');
    getLibraries.withArgs({ compound_id: 'cmp-id' }).returns({
      done: (cb) => {
        cb(
          libraries
        );
        return { fail: () => ({}) };
      }
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should not show libraries to user without view libraries privilege', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(false);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = mount(<CompoundDetail compound={Immutable.fromJS(publicCompound)} />);
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(false);
  });

  it('should show libraries to the user with view libraries privilege', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = mount(<CompoundDetail compound={Immutable.fromJS(privateCompound)} />);
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(true);
    expect(compoundHeading.props().libraries.length).to.equal(2);
  });

  it('should show libraries incase of public compound', () => {
    const getACS = sandbox.stub(AcsControls, 'isFeatureEnabled');
    getACS.withArgs(FeatureConstants.VIEW_LIBRARIES).returns(true);
    sandbox.stub(SessionStore, 'getOrg').returns(Immutable.fromJS({ id: 'org13' }));
    wrapper = mount(<CompoundDetail compound={Immutable.fromJS(publicCompound)} />);
    const compoundHeading = wrapper.find(CompoundHeading);
    expect(compoundHeading.props().canViewLibraries).to.equal(true);
    expect(compoundHeading.props().libraries.length).to.equal(2);
  });
});
