import ajax from 'main/util/ajax';

// this api is not a json-api

function createUrl(path) {
  return `/api/v1/vendor_catalog_service${path}`;
}

export function getEMolecules(orgId, smiles, searchType) {
  const vendor = 'EMOLECULES';
  const includeAdditionalAlternates = searchType === 'EXACT' ? '&includeAdditionalAlternates=false' : '';
  const url = createUrl(`/organizations/${orgId}/compounds?smiles=${encodeURIComponent(smiles)}&vendor=${vendor}&searchType=${searchType}${includeAdditionalAlternates}`);
  return ajax.get(url);
}
