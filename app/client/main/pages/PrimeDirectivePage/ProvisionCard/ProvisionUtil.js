import _ from 'lodash';
import Immutable  from 'immutable';

import ContainerTypeHelper from 'main/helpers/ContainerType';
import { splitRefObject } from 'main/util/RefUtil';
import {
  getScalarInDefaultUnits,
  appendDefaultUnits
} from 'main/util/MeasurementUtil';

class ProvisionUtil {
  constructor({ instruction, refsByName, sourceContainers, provisionSpec, measurementMode }) {
    this.instruction = instruction;
    this.refsByName = refsByName;
    this.sourceContainers = sourceContainers;
    this.provisionSpec = provisionSpec;
    this.measurementMode = measurementMode === undefined ? 'volume' : measurementMode;
    this.charts = [];

    // The strategy for generating charts is to first dedupe the transfers by volume (900uL limit)
    // from provisionSpec or from the instruction, then group those deduped transfers by volume.
    // Finally use the volume groups to separate one to one, one to many, and many to one charts
    if (this.provisionSpec) {
      this.generateCharts(this.dedupeTransfers());
    } else {
      this.generateCharts(this.dedupeDestinations());
    }
  }

  charts() {
    return this.charts;
  }

  // Sum up all same destination 900uL provision specs into one to dedupe them, and then add destination information
  dedupeTransfers() {
    const spec = this.provisionSpec;
    const sourceContainers = this.sourceContainers;
    const measurementMode = this.measurementMode;

    // group by "srcRefname, dstRefname, dstWellIndex"
    const groupedTransfers = _.groupBy(spec.transfers, (t) => {
      return `${t.from}/${t.to}/${t.to_well_idx}`;
    });

    // format: { srcContainerId: { destRef/destIdx: summedProvision }}
    const dedupedTransfers = {};

    _.each(groupedTransfers, (transfers) => {
      // Use first transfer to pull out common information since all transfers are grouped.
      const transfer                          = transfers[0];
      const destName                          = transfer.to;
      const destIdx                           = transfer.to_well_idx;
      const { destHumanIdx, destContainerId } = this.destInfo(destName, destIdx);

      const quantity = _.sumBy(transfers, t => t[measurementMode]);

      const dedupedTransfer = {
        srcContainerId: transfer.from,
        sourceName: sourceContainers[transfer.from].label,
        quantity,
        destName,
        destIdx,
        destHumanIdx,
        destContainerId
      };

      const destinationString = `${transfer.to}/${transfer.to_well_idx}`;

      _.setWith(dedupedTransfers, [transfer.from, destinationString], dedupedTransfer, Object);
    });

    return dedupedTransfers;
  }

  // Dedupes provision instruction transfers by summing them and mimics the same format as the result
  // from above dedupeTransfers to be consumed by chart generating functions, with unprovisioned as source.
  dedupeDestinations() {
    const rawTransfers = this.instruction.operation.to;
    const destGroups = _.groupBy(rawTransfers, transfer => transfer.well);
    const destinations = { unprovisioned: {} };
    const measurementMode = this.measurementMode;

    _.each(destGroups, (destGroup, refString) => {

      const quantity = _.sumBy(destGroup, dest => getScalarInDefaultUnits(Immutable.fromJS(dest), measurementMode));
      const [destName, destIdx] = splitRefObject(refString);
      const { destHumanIdx, destContainerId } = this.destInfo(destName, destIdx);

      const dest = {
        sourceName: 'Unprovisioned',
        srcContainerId: 'unprovisioned',
        quantity,
        destName,
        destIdx,
        destHumanIdx,
        destContainerId
      };

      destinations.unprovisioned[`${destName}/${destIdx}`] = dest;
    });

    return destinations;
  }

  // transferMap: { srcContainerId || 'unprovisioned': { destRef/destIdx: summedProvision }}
  generateCharts(transferMap) {
    const quantityGroupedTransfersMap = {};

    _.each(transferMap, (transfers, srcContainerId) => {

      // Takes transfers under a srcContainerId and group them by volume
      // Returns transfer groups where destination wells are grouped into arrays of wells
      // [{ srcContainerId, sourceName, destName, volume, destWells, destHumanWells, destContainerId }]
      const quantityGroupedTransfers = this.quantityGroupedTransfers(Object.values(transfers), srcContainerId);

      // Any cid -> volume groups that are one to one or one to many are sent to chart function right away
      // If the length of the transfer groups is not > 1 therefore 1, then look at the first and only group
      // and see if it is a one to one chart
      if (quantityGroupedTransfers.length > 1 || quantityGroupedTransfers[0].destWells.length === 1) {
        this.charts.push(this.oneToManyChart(quantityGroupedTransfers));
      } else {
        quantityGroupedTransfersMap[srcContainerId] = quantityGroupedTransfers[0];
      }
    });

    // group remaining cid -> volumeGroups and group all volumeGroups by destination name and volume
    // in order to separate the many to one charts from the one to one charts
    const multiSourceGroups = _.groupBy(Object.values(quantityGroupedTransfersMap), (provision) => {
      return `${provision.destName}/${provision[this.measurementMode]}`;
    });

    _.each(multiSourceGroups, (quantityGroupedTransfers, _destVolumeString) => {
      if (quantityGroupedTransfers.length > 1) {
        this.charts.push(this.manyToOneChart(quantityGroupedTransfers));
      } else {
        this.charts.push(this.oneToManyChart(quantityGroupedTransfers));
      }
    });
  }

  manyToOneChart(quantityGroupedTransfers) {
    const sources = {};
    const destinations = {};
    const edges = [];
    const measurementMode = this.measurementMode;

    quantityGroupedTransfers.forEach((transfer) => {
      sources[transfer.srcContainerId] = {
        name: transfer.sourceName,
        containerId: transfer.srcContainerId,
        aliquots: 1,
        quantity: appendDefaultUnits(transfer.quantity * transfer.destWells.length, measurementMode)
      };

      edges.push({
        source: transfer.srcContainerId,
        destination: 0
      });
    });

    const { destName, quantity, destContainerId } = quantityGroupedTransfers[0];

    // Grouping many to one is mainly for operators to be able to set the volume once
    // on pippette and go, thus there could be a case where two different sources
    // transfer same volume to the same dest, thus must make a Set out of the aliquots.
    const destAliquots = _.uniq(
      _.flatten(
        quantityGroupedTransfers.map(transfer => transfer.destWells)
      )
    );

    destinations[0] = {
      name: destName,
      containerId: destContainerId,
      aliquots: destAliquots.length,
      quantity: appendDefaultUnits(quantity, measurementMode)
    };

    return { sources, destinations, edges };
  }

  oneToManyChart(quantityGroupedTransfers) {
    const sources = {};
    const destinations = {};
    const edges = [];
    const measurementMode = this.measurementMode;

    const { srcContainerId, sourceName } = quantityGroupedTransfers[0];
    const sourceQuantity = _.sumBy(quantityGroupedTransfers, (transfer) => {
      return transfer.quantity * transfer.destWells.length;
    });

    sources[srcContainerId] = {
      name: sourceName,
      containerId: srcContainerId,
      aliquots: 1,
      quantity: appendDefaultUnits(sourceQuantity, measurementMode)
    };

    quantityGroupedTransfers.forEach((transfer, i) => {
      const destName = transfer.destWells.length > 1 ?
        transfer.destName :
        `${transfer.destName}/${transfer.destHumanWells[0]}`;
      const destId = i;

      destinations[destId] = {
        name: destName,
        containerId: transfer.destContainerId,
        aliquots: transfer.destWells.length,
        quantity: appendDefaultUnits(transfer.quantity, measurementMode)
      };

      edges.push({
        source: transfer.srcContainerId,
        destination: destId
      });
    });

    return { sources, destinations, edges };
  }

  // Takes transfers under a srcContainerId and group them by volume
  // Returns transfer groups where destination wells are grouped into arrays of wells
  // [{ srcContainerId, sourceName, destName, volume, destWells, destHumanWells, destContainerId }]
  quantityGroupedTransfers(transfers, srcContainerId) {

    return _.map(
      _.groupBy(Object.values(transfers), transfer => transfer.quantity),
      (transfersByVolume, quantity) => {
        const { sourceName, destName, destContainerId } = transfersByVolume[0];
        const destWells = transfersByVolume.map(transfer => transfer.destIdx);
        const destHumanWells = transfersByVolume.map(transfer => transfer.destHumanIdx);

        return { srcContainerId, sourceName, destName, quantity, destWells, destHumanWells, destContainerId };
      }
    );
  }

  destInfo(destName, destIdx) {
    const ref = this.refsByName[destName];
    const containerType = ref.container_type;
    const containerTypeHelper = new ContainerTypeHelper({
      well_count: containerType.well_count,
      col_count: containerType.col_count
    });
    const destHumanIdx = containerTypeHelper.humanWell(destIdx);
    const destContainerId = ref.container_id;

    return { destHumanIdx, destContainerId };
  }
}

export default ProvisionUtil;
