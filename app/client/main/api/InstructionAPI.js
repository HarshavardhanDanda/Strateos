import API from 'main/api/API';
import ajax from 'main/util/ajax';
import $ from 'jquery';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

class InstructionAPI extends API {
  constructor() {
    super('instructions');
  }

  createInstructionsAPIUrls({ runId, maxCount, limit }) {
    const urlArray = [];

    for (let offset = 0; offset < maxCount; offset += limit) {
      let options = {
        filters: { run_id: runId },
        includes: ['warps'],
        limit,
        offset
      };

      if (offset + limit > maxCount) {
        options = { ...options, limit: maxCount - offset };
      }

      const instructionsUrl = this.createUrl('', options);
      urlArray.push(instructionsUrl);
    }
    return urlArray;
  }

  savePayload(payload) {
    JsonAPIIngestor.ingest(payload);
  }

  fetchFirstBatchOfInstructions(runId, limit = 30) {
    const options = {
      filters: { run_id: runId },
      includes: ['warps'],
      limit,
      offset: 0
    };

    return ajax.get(this.createUrl('', options));
  }

  fetchInstructionsInBatches(runId, limit, instructionsCount, excludeFirstBatch) {
    if (isNaN(instructionsCount)) return undefined;

    const arrayOfInstructionUrls = this.createInstructionsAPIUrls({
      runId,
      maxCount: instructionsCount,
      limit
    });

    if (excludeFirstBatch) arrayOfInstructionUrls.shift();

    const deferreds = [];

    arrayOfInstructionUrls.forEach((url) => {
      const def = ajax.get(url);
      deferreds.push(def);
      def.then(this.savePayload);
    });

    const allDeferred = $.when(...deferreds);
    return allDeferred;
  }

  fetchAllForRun(runId, limit) {
    return this.fetchFirstBatchOfInstructions(runId, limit)
      .then((firstBatchOfInstructions) => {
        this.savePayload(firstBatchOfInstructions);
        const instructionsCount = firstBatchOfInstructions.meta.record_count;
        return this.fetchInstructionsInBatches(runId, limit, instructionsCount, true);
      });
  }
}

export default new InstructionAPI();
