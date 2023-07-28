import ajax from 'main/util/ajax';
import _ from 'lodash';
import $ from 'jquery';
import { useEffect, useState } from 'react';

import { createQueryParams, createApiUrl } from 'main/util/UrlGeneration';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';

class API {
  constructor(resourceName) {
    this.resourceName = resourceName;
  }

  createQueryParams(options) {
    return createQueryParams(options);
  }

  createUrl(path, options = {}) {
    return createApiUrl([this.resourceName, path], options);
  }

  // Fetch a specific entity
  get(id, options = {}) {
    const url = this.createUrl(`/${id}`, options);
    const response = ajax.get(url);

    if (options.doIngest !== false) {
      response.done(payload => JsonAPIIngestor.ingest(payload));
    }

    return response;
  }

  // Fetch many entities in parallel though many ajax requests.
  getMany(ids, options = {}) {
    const promises = ids.map(id => this.get(id, options));
    return ajax.when(...promises);
  }

  /**
   * Fetch a single paginated list of an entity
   * @param {Object} options
   * @param {String} search_key is appened to (options.filters.query || '') to act as the store key
   */
  index(options = {}, search_key = '') {
    const url = this.createUrl('', options);
    const response = ajax.get(url);

    if (options.doIngest === false) {
      return response;
    }

    response.done((payload) => {
      const groupedEntities = JsonAPIIngestor.ingest(payload);
      // get normalized entities for the resource itself, not included entities.
      const entities = groupedEntities[this.resourceName] || [];
      const query    = (options.query || (options.filters || {}).query || '') + search_key;
      const page     = options.page || 1;
      const perPage  = options.limit || 10;
      const numPages = Math.ceil(payload.meta.record_count / perPage);

      JsonAPIIngestor.ingestPagination(entities, query, this.resourceName, page, perPage, numPages);
    });

    return response;
  }

  // Fetch all pages.
  indexAll(options = {}) {
    // Keep track of payloads fetched an a deferred that represent total completion.
    const deferred  = ajax.Deferred();
    const payloads  = [];
    let currentPage = 1;

    // define up top to avoid referring to the function before it is defined eslint error.
    let fetchPage;

    const onFetchPageSuccess = (payload) => {
      payloads.push(payload);

      currentPage += 1;
      const hasNext = payload.links && payload.links.next;

      if (hasNext && (options.pageLimit ? currentPage <= options.pageLimit : true)) {
        fetchPage(currentPage);
      } else {
        // resolve deferred when there is nothing more to fetch.
        deferred.resolve(payloads);
      }
    };

    const onFetchPageFailure = (payload, status, req) => {
      deferred.reject(payload, status, req);
    };

    // Helper to call API.index method with the currentPage
    fetchPage = (page) => {
      const iterOptions = { ...options, page };

      this.index(iterOptions)
        .done(onFetchPageSuccess)
        .fail(onFetchPageFailure);
    };

    fetchPage(1);

    return deferred;
  }

  indexAllParallel(options, maxToFetch) {
    const promise = $.Deferred();
    const firstBatchOpts = { ...options, offset: 0 };
    this.index(firstBatchOpts)
      .then((first) => {
        const promises = [];
        const allOptions = this.createAllOptions(
          options,
          Math.min(maxToFetch, first.meta.record_count)
        );
        allOptions.shift(); // already fetched the first batch
        allOptions.forEach(opts => promises.push(this.index(opts)));
        return $.when(...promises).then(() => {
          promise.resolve(first.meta.record_count);
        });
      });
    return promise;
  }

  createAllOptions(initialOptions, maxCount) {
    const optionsArray = [];
    const initialOffset = 0;
    let options = { ...initialOptions, offset: initialOffset };

    for (let offset = initialOffset; offset < maxCount; offset += options.limit) {
      if (offset + options.limit > maxCount) {
        options = { ...options, limit: maxCount - offset };
      }
      options = { ...options, offset };

      optionsArray.push(options);
    }

    return optionsArray;
  }

  // Update entities values
  update(id, attributes, options = {}, actions = {}, type = 'PUT') {
    const url = this.createUrl(`/${id}`, options);

    const requestData = {
      data: {
        type: this.resourceName,
        id: id,
        attributes: attributes
      }
    };

    // HACK, fix this later so that `update` doesnt take attributes
    if (options.relationships) {
      requestData.data.relationships = options.relationships;
    }

    if (!_.isEmpty(actions)) {
      requestData.data.actions = actions;
    }

    const response = type === 'PATCH' ? ajax.patch(url, requestData) : ajax.put(url, requestData);

    if (options.doIngest !== false) {
      response.done(payload => JsonAPIIngestor.ingest(payload));
    }

    return response;
  }

  // Create entity
  create(data, options = {}) {
    const url = this.createUrl('', options);

    const requestData = { data };
    if (data.type === undefined) data.type = this.resourceName;

    if (options.dryRun) requestData.data.actions = { dry_run: true };

    const response = ajax.post(url, requestData);

    if (options.doIngest !== false) {
      response.done(payload => JsonAPIIngestor.ingest(payload));
    }

    return response;
  }

  // Destroy a specific entity
  destroy(id, options = {}) {
    const url = this.createUrl(`/${id}`, options);
    const response = ajax.delete(url);
    return response;
  }

  collectionUrl() {
    return this.createUrl(`/${this.resourceName}`);
  }

  collectionMethodUrl(methodName) {
    return `${this.collectionUrl()}/${methodName}`;
  }
}

// A React custom hook that manages the state of fetching
// a single record by id.
//
// Example: const { isFetching, result, error } = useGet(RunAPI, 'r123');
// @param api An api object like RunAPI
// @param id The id of the entity
// @options Options to pass to json-api
export function useGet(api, id, options = {}) {
  const [isFetching, setFetching] = useState(true);
  const [result, setResult] = useState(undefined);
  const [error, setError] = useState(undefined);

  useEffect(
    () => {
      if (id && !isFetching) return;
      api.get(id, options)
        .then(
          setResult,
          setError
        )
        .always(() => setFetching(false));
    },
    [isFetching, id]
  );

  return { isFetching, result, error };
}

export default API;
