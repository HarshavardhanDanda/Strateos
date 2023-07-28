import sinon from 'sinon';
import { expect } from 'chai';
import Immutable from 'immutable';
import { MaterialSearchDefaults } from 'main/pages/ReactionPage/CompoundSourceSelector/CompoundSourceState';
import { CompoundSourceSelectorMaterialModalActions } from './CompoundSourceMaterialActions';

describe('Compound Source Material Action', () => {
  let mockDoSearch;
  const sandbox = sinon.createSandbox();

  const eMoleculesData = Immutable.fromJS([{
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: '1,3,7-trimethyl-2,3,6,7-tetrahydro-1h-purine-2,6-dione',
    id: '1317_1',
    supplierName: 'InterBioScreen',
    tier: 3,
    estimatedCost: '$0.25/mg',
    sku: '327919424',
    tierText: 'Tier 3, Ships within 4 weeks'
  },
  {
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    name: 'propane',
    id: '1317_2',
    supplierName: 'InterBio',
    tier: 1,
    estimatedCost: '$0.26/mg',
    sku: '327919427',
    tierText: 'Tier 1, Ships within 4 weeks'
  }]);

  const options = { ...MaterialSearchDefaults, eMoleculesData };

  beforeEach(() => {
    mockDoSearch = sandbox.stub(CompoundSourceSelectorMaterialModalActions, 'doSearch').returns({});
    sandbox.stub(CompoundSourceSelectorMaterialModalActions, 'stateStore').returns(Immutable.Map(options));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should do search with suppliers on search filter change', () => {
    const supplier = ['supplier1', 'supplier2'];
    CompoundSourceSelectorMaterialModalActions.onSearchFilterChange(() => {}, Immutable.fromJS({ ...options, searchSupplier: supplier }));
    expect(mockDoSearch.calledOnce).to.be.true;
    expect(mockDoSearch.args[0][0].eMoleculesData).to.equal(undefined);
    expect(mockDoSearch.args[0][0].searchSupplier).to.deep.equal(['supplier1', 'supplier2']);
    const eMoleculeData = CompoundSourceSelectorMaterialModalActions.searchOptions().eMoleculesData;
    expect(eMoleculeData instanceof Immutable.Map).to.be.true;
  });
});
