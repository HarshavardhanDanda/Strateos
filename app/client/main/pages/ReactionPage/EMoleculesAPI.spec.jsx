import sinon from 'sinon';
import ajax from 'main/util/ajax';
import { getEMolecules } from './EMoleculesAPI';

describe('EMolecules API', () => {
  const urlExact = '/api/v1/vendor_catalog_service/organizations/org13/compounds?smiles=CNc1ccccc1-c1ccccc1%5BPd%2B%5D%5BPH%5D(c1ccccc1-c1c(C(C)C)cc(C(C)C)cc1C(C)C)(C1CCCCC1)C1CCCCC1.CS(%3DO)(%3DO)%5BO-%5D&vendor=EMOLECULES&searchType=EXACT&includeAdditionalAlternates=false';
  const urlAlternate = '/api/v1/vendor_catalog_service/organizations/org13/compounds?smiles=CNc1ccccc1-c1ccccc1%5BPd%2B%5D%5BPH%5D(c1ccccc1-c1c(C(C)C)cc(C(C)C)cc1C(C)C)(C1CCCCC1)C1CCCCC1.CS(%3DO)(%3DO)%5BO-%5D&vendor=EMOLECULES&searchType=ALTERNATE';
  const orgId = 'org13';
  const smiles = 'CNc1ccccc1-c1ccccc1[Pd+][PH](c1ccccc1-c1c(C(C)C)cc(C(C)C)cc1C(C)C)(C1CCCCC1)C1CCCCC1.CS(=O)(=O)[O-]';
  let searchType;
  const sandbox = sinon.createSandbox();
  let ajaxCall;

  beforeEach(() => {
    ajaxCall = sandbox.spy(ajax, 'get');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should encode the smiles string and generate the correct url with EXACT search type', () => {
    searchType = 'EXACT';
    getEMolecules(orgId, smiles, searchType);
    sinon.assert.calledWith(ajaxCall, urlExact);
  });

  it('should encode the smiles string and generate the correct url with ALTERNATE search type', () => {
    searchType = 'ALTERNATE';
    getEMolecules(orgId, smiles, searchType);
    sinon.assert.calledWith(ajaxCall, urlAlternate);
  });
});
