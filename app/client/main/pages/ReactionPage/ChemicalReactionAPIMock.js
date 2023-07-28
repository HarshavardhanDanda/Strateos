//
// Mock for ReactionAPI
//

const originalCompound = {
  name: 'cust1',
  clogp: '1.2543',
  molecular_weight: 350.4,
  formula: 'C16H18N2O5S',
  smiles: 'NS(=O)(=O)c1ccc(C(=O)OC2N=CC=C2CC2CCOC2)cc1',
  tpsa: '108.05',
  refId: '1233',
  id: '123456778',
  linkId: 'cmp1'
};

// Sample successful response message from GET reaction api
export const reactionCreated = {
  id: '20e782f1-50e7-4206-b7cf-1b729daa7612',
  name: 'test',
  status: 'CREATED',
  runId: undefined,
  projectId: undefined,
  createdBy: 'u1dffycuxmnb2n',
  createdOn: '2021-05-12 10:18:35',
  reactants: [{
    id: 'ac52a0f3-395e-4eed-9e5a-71a6a8c55668',
    refRxnId: 'I',
    name: 'my_fav_compound',
    additionOrder: 1,
    smiles: 'C1CCC(C2CCCCC2)CC1',
    formulaWeight: '2.3:g/mol',
    amount: '0.10:mmol',
    limiting: true,
    equivalent: 1,
    base: false,
    phase: 'solid',
    sampleMass: '1.321512:mg',
    compound: {
      linkId: 'cmpl1efjg7db6w6th',
      smiles: 'N[C@H]1CCC2CCCCC2C1',
      name: 'my_fav_compound',
      formula: 'C12H22',
      molecularWeight: '166.31',
      exactMolecularWeight: '166.172151',
      ref_id: '1235',
      id: 'FFROQSBSJYRALS-RTBKNWGFSA-N'
    },
    originalCompound,
    source: { type: 'CONTAINER', value: { id: 'ct1fqsqycg44tux' } },
    additionalProperties: { pin: false }
  }, {
    id: '73dbfe22-7714-4acf-b73d-a8cef20319bd',
    refRxnId: 'II',
    name: 'test',
    additionOrder: 2,
    smiles: 'C[n+]1c2ccccc2c(N)c2ccccc21',
    formulaWeight: '2.3:g/mol',
    amount: null,
    limiting: false,
    equivalent: 1,
    base: false,
    phase: 'solid',
    compound: {
      linkId: 'cmpl1fqsq3jpqatxr',
      smiles: 'C[n+]1c2ccccc2c(N)c2ccccc21',
      name: 'test',
      formula: 'C14H13N2+',
      molecularWeight: '209.27',
      exactMolecularWeight: '209.107325',
      id: '123412'

    },
    source: null,
    additionalProperties: { pin: true }
  }, {
    id: '73dbfe22-7714-4acf-b73d-a8cef20319bd',
    refRxnId: 'III',
    name: 'xyz',
    additionOrder: 3,
    smiles: 'C[n+]1c2ccccc2c(N)c2ccccc21',
    formulaWeight: '2.3:g/mol',
    amount: null,
    limiting: false,
    equivalent: 1,
    base: false,
    phase: 'liquid',
    sampleVolume: '0.8:ml',
    compound: {
      linkId: 'cmpl1fqsq3jpqatxr',
      smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
      name: 'xyz',
      formula: 'C14H13N2+',
      molecularWeight: '209.27',
      exactMolecularWeight: '209.107325'
    },
    originalCompound,
    source: {
      type: 'MATERIAL',
      value: {
        attributes: {
          smiles: 'CCCC',
          vendor: 'eMolecules',
          supplier: 'Key Organics',
          tier: '2-3 days',
          estimatedCost: '$35/g',
          sku: 'my_eMolecules'
        }
      }
    },
    additionalProperties: { pin: false }
  }],
  products: [{
    id: '14c0fbf9-2f4a-4349-82e1-82e94660e196',
    refRxnId: 'IV',
    name: 'fluro test',
    smiles: 'F[B-](F)(F)C1CCC1.[K+]',
    attributes: {
      hasAcidSensitivity: false,
      hasBaseSensitivity: false,
      hasMethanolSensitivity: null,
      hasTemperatureSensitivity: false,
      hasMeohSensitivity: false,
      pka: 2.3
    },
    compound: {
      linkId: 'cmpl1fqsq3k8kqwsj',
      smiles: 'F[B-](F)(F)C1CCC1.[K+]',
      name: 'fluro test',
      formula: 'C4H7BF3K',
      molecularWeight: '162.0',
      exactMolecularWeight: '162.022997'
    },
    formulaWeight: '211.26:g/mol',
    theoreticalMass: '85:milligram'
  }],
  solvents: [{
    id: 'cb198d4f-06bf-489c-93d8-cd6e730ed9a2',
    name: 'DMF',
    volume: '5.3:milliliter',
    additionOrder: 3,
    resource: { id: 'rs1dj9bgfz3ks7r', name: 'DMF' }
  }],
  conditions: { temperature: '10:celsius', duration: '10:minute', reactorType: 'microwave', pressure: '20:bar' }
};

export const reactionSubmitted = {
  ...reactionCreated,
  status: 'SUBMITTED',
  projectId: 'p1fm55d2zzkk8e'
};

export const reactionWithRunCreated = {
  ...reactionSubmitted,
  batchId: 'test_batch_id',
  status: 'RUN_CREATED',
  runId: 'r123'
};

export const reactionWithoutRunCreated = {
  ...reactionSubmitted,
  batchId: 'test_batch_id',
};

// chemical_reactions api controller to get reaction
export function get(_reactionId) {
  return new Promise((resolve) => {
    resolve(reactionWithRunCreated);
  });
}

// chemical_reactions api to create a run from the reaction id
export function createRun(_reactionId) {
  // On creation of the run there should be a launch request id
  // on the reaction object
  return new Promise((resolve) => {
    resolve(reactionWithRunCreated);
  });
}

export function pollForRun(_id) {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(true),
      0 // set to 0 for tests
    );
  });
}

export function updateProject(_id, _data) {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve(),
      0
    );
  });
}
