import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import { EMoleculesStateDefaults } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import { CompoundSourceSelectorEMoleculesModalActions } from './CompoundSourceEmoleculesActions';

describe('Compound source emolecule action', () => {
  let mockUpdateState;

  const sandbox = sinon.createSandbox();

  const eMoleculeData = [{
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: '1,3,7-trimethyl-2,3,6,7-tetrahydro-1h-purine-2,6-dione',
    id: '1317_1',
    supplierName: 'InterBioScreen',
    tier: 3,
    estimatedCost: '$0.25/mg',
    pricePoints: [{
      currency: 'USD',
      price: '625',
      quantity: '250',
      units: 'g',
      sku: '327919424'
    }],
    tierText: 'Tier 3, Ships within 4 weeks'
  },
  {
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: 'propane',
    id: '1317_2',
    supplierName: 'InterBio',
    tier: 1,
    estimatedCost: '$0.26/mg',
    pricePoints: [{
      currency: 'USD',
      price: '260',
      quantity: '100',
      units: 'g',
      sku: '327919427'
    }],
    tierText: 'Tier 1, Ships within 4 weeks'
  }
  ];

  const eMoleculesCurrentData = Immutable.fromJS(eMoleculeData);
  const compound_smiles = 'Cn1c(=O)c2c(ncn2C)n(C)c1=O';
  beforeEach(() => {
    sandbox.stub(CompoundSourceSelectorEMoleculesModalActions, 'searchOptions').returns({ ...EMoleculesStateDefaults, eMoleculesCurrentData, eMoleculesData: Immutable.fromJS({ EXACT: { 'Cn1c(=O)c2c(ncn2C)n(C)c1=O': eMoleculeData }, ALTERNATE: {} }) });
    mockUpdateState = sandbox.stub(CompoundSourceSelectorEMoleculesModalActions, 'updateState');

  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do sort in ascending order accurately', () => {
    CompoundSourceSelectorEMoleculesModalActions.onSortOptionChange(() => {}, 'tier', false);
    expect(mockUpdateState.calledOnce).to.be.true;
    expect(mockUpdateState.args[0][0].eMoleculesCurrentPage.get(0)).to.deep.equal(Immutable.fromJS(eMoleculeData[1]));
    expect(mockUpdateState.args[0][0].eMoleculesCurrentPage.get(1)).to.deep.equal(Immutable.fromJS(eMoleculeData[0]));
  });

  it('should do sort in desc order accurately', () => {
    CompoundSourceSelectorEMoleculesModalActions.onSortOptionChange(() => {}, 'tier', true);
    expect(mockUpdateState.calledOnce).to.be.true;
    expect(mockUpdateState.args[0][0].eMoleculesCurrentPage.get(0)).to.deep.equal(Immutable.fromJS(eMoleculeData[0]));
    expect(mockUpdateState.args[0][0].eMoleculesCurrentPage.get(1)).to.deep.equal(Immutable.fromJS(eMoleculeData[1]));
  });

  it('should change page correctly', () => {
    CompoundSourceSelectorEMoleculesModalActions.onSearchPageChange(() => {}, 2);
    expect(mockUpdateState.calledOnce).to.be.true;
    expect(mockUpdateState.args[0][0].searchPage).to.equal(2);
  });

  it('should filter supplier correctly', () => {
    const options = { ...EMoleculesStateDefaults, searchEMoleculeSupplier: ['InterBio'], compound_smiles };
    CompoundSourceSelectorEMoleculesModalActions.doSearch(options);
    expect(mockUpdateState.called).to.be.true;
    expect(mockUpdateState.args[1][0].eMoleculesCurrentPage.size).to.equal(1);
    expect(mockUpdateState.args[1][0].eMoleculesCurrentPage).to.deep.equal(Immutable.fromJS([eMoleculeData[1]]));
  });

});
