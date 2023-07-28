import Immutable from 'immutable';

import containerFromRef from './containerFromRef';

const refsInTransfer = (group) => {
  return group.get('transfer').map((tx) => {
    return Immutable.List([tx.get('from'), tx.get('to')]);
  }).flatten();
};

const refsInDistribute = (group) => {
  const toNames = group.getIn(['distribute', 'to']).map(x => x.get('well'));
  const fromName = group.getIn(['distribute', 'from']);
  return Immutable.List([fromName, ...toNames]);
};

const refsInConsolidate = (group) => {
  const toName = group.getIn(['consolidate', 'to']);
  const fromNames = group.getIn(['consolidate', 'from']).map(x => x.get('well'));
  return Immutable.List([toName, ...fromNames]);
};

const agitate = (operation) => {
  let containers = Immutable.List([operation.get('object')]);
  const modeParams = operation.get('mode_params');
  if (modeParams) {
    const fromWells = modeParams.get('wells').map(containerFromRef);
    containers = containers.concat(fromWells);
  }
  return containers;
};

const sonicate = (operation) => {
  const containersFromWells = operation.get('wells').map(containerFromRef);
  return containersFromWells;
};

const liha = (operation) => {
  let refs = Immutable.List();

  operation.get('groups').forEach((g) => {
    let refsInGroup;

    switch (g.keySeq().first()) {
      case 'transfer':
        refsInGroup = refsInTransfer(g);
        break;
      case 'distribute':
        refsInGroup = refsInDistribute(g);
        break;
      case 'consolidate':
        refsInGroup = refsInConsolidate(g);
        break;
      case 'mix':
        refsInGroup = g.get('mix').map(x => x.get('well'));
        break;
      default:
        refsInGroup = Immutable.List();
    }

    refs = refs.concat(refsInGroup);
  });

  const containerNames = refs.map(containerFromRef);

  return containerNames.flatten();
};

const stamp = (operation) => {
  return operation.get('groups').map((g) => {
    return g.get('transfer').map(tx =>
      Immutable.List([tx.get('from'), tx.get('to')]).map(containerFromRef)
    );
  });
};

const legacyStamp = (operation) => {
  return operation.get('transfers').map((transfer) => {
    return Immutable.List([
      transfer.get('from'),
      transfer.get('to')
    ]).map(containerFromRef);
  });
};

const objectsArrayRefs = (operation) => {
  return operation.get('objects').map(containerFromRef);
};

const oligosynthesize = (operation) => {
  return operation.get('oligos').map(o => containerFromRef(o.get('destination')));
};

const prep = (operation) => {
  return operation
    .get('groups')
    .map(g =>
      Immutable.List([containerFromRef(g.get('from')), containerFromRef(g.get('to'))]))
    .flatten();
};

const spread = (operation) => {
  return Immutable.List(
    [operation.get('from'), operation.get('to')]
  ).map(containerFromRef);
};

const spe = (operation) => {
  return Immutable.List()
    .push(containerFromRef(operation.get('object')))
    .concat(operation.get('elute').map((elute) => {
      return containerFromRef(elute.get('destination_well'));
    }));
};

const autopick = (operation) => {
  let wells;

  if (operation.get('groups') != undefined) {
    wells = operation.get('groups').map((g) => {
      return Immutable.List([g.get('from'), g.get('to')]);
    }).flatten();
  } else {
    const toNames = operation.get('to');
    wells = Immutable.List([operation.get('from'), toNames]).flatten();
  }

  return wells.map(containerFromRef);
};

const flow_analyze = (operation) => {
  const fallback = Immutable.List();

  const ref_holders =
    operation.get('negative_controls', fallback)
      .concat(operation.get('positive_controls', fallback))
      .concat(operation.get('samples', fallback));

  return ref_holders.map(rh => containerFromRef(rh.get('well')));
};

const provision = (operation) => {
  return operation
    .get('to')
    .map(x => containerFromRef(x.get('well')));
};

const magnetic_transfer = (operation) => {
  return operation.get('groups').map(group =>
    group.map(subop =>
      subop.valueSeq().first().get('object')
    )
  ).flatten();
};

const dispense = (operation) => {
  const obj     = operation.get('object');
  let list      = Immutable.List([obj]);
  const reagent = operation.get('reagent_source');

  if (reagent != undefined) {
    list = list.push(containerFromRef(reagent));
  }

  return list;
};

const liquid_handle = (operation) => {
  return operation
    .get('locations')
    .map(l => l.get('location'))
    .filter(l => l)
    .map(l => containerFromRef(l));
};

const singleContainer = operation => Immutable.List([operation.get('object')]);

const measureMass = operation => singleContainer(operation).map(containerFromRef);

const measure = (operation) => {
  return operation.get('object').map(containerFromRef);
};

const lcmrm = (operation) => {
  return operation.get('wells').map(containerFromRef);
};

const generic_task = (operation) => {
  return operation.get('containers');
};

export {
  agitate,
  liha,
  stamp,
  legacyStamp,
  objectsArrayRefs,
  oligosynthesize,
  prep,
  spread,
  spe,
  autopick,
  flow_analyze,
  provision,
  magnetic_transfer,
  dispense,
  liquid_handle,
  singleContainer,
  measure,
  measureMass,
  sonicate,
  lcmrm,
  generic_task
};
