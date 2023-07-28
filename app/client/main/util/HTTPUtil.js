import _ from 'lodash';
import ajax from 'main/util/ajax';

class DeferredRequest {
  constructor(url, data, retainSeconds) {
    this.url          = url;
    this.data         = data;
    this.deferred     = ajax.Deferred();
    this.created_at   = Date.now();
    this.completed_at = undefined;
    this.valid_until  = this.created_at + (retainSeconds * 1000);

    // waiting, active, success, failure
    this.status = 'waiting';
  }

  validAt(now = Date.now()) {
    return this.valid_until > now;
  }

  tooOld(ageSeconds, now = Date.now()) {
    return (now - this.created_at) > (ageSeconds * 1000);
  }

  // Pass through to deferred.
  // TODO:
  //   Consider adding retry logic, which would entail not directly interacting
  //   with the deferred object.
  done(...args) {
    this.deferred.done(...args);
    return this;
  }

  fail(...args) {
    this.deferred.fail(...args);
    return this;
  }

  always(...args) {
    this.deferred.always(...args);
    return this;
  }

  then(...args) {
    return this.deferred.then(...args);
  }

  doRequest() {
    this.status = 'active';

    return ajax.get(this.url, this.data)
      .done((response_data) => {
        this.status = 'success';
        this.deferred.resolve(response_data);
      })
      .fail((xhr, status, text) => {
        this.status = 'failure';
        this.deferred.reject(xhr, status, text);
      })
      .always(() => {
        this.completed_at = Date.now();
      });
  }
}

const QueryCache = {
  // All waiting, active, success, and failure DeferredRequests
  //   hashCode -> Array[DeferredRequest]
  allRequests: {},

  _stats: {
    total: 0,
    actual: 0,
    batched: 0,
    hits: 0,
    misses: 0,
    forced: 0
  },

  // Whether the deferred requests callback has been set.
  _requestedFrame: false,

  _processWaitingRequests() {
    const requests = _.flattenDeep(_.values(this.allRequests));

    requests.forEach((request) => {
      if (request.status === 'waiting') {
        request.doRequest();
      }
    });

    // reset the deferred requests to empty.
    this._requestedFrame = false;
    this.cleanup();
  },

  hashCode(url, data) {
    // Use stringify to hash url + data
    //   NOTE: differing ordering will lead to different requests.
    return `${url}?${JSON.stringify(data)}`;
  },

  // remove all expired requests.
  cleanup() {
    const now = Date.now();

    this.allRequests = _.mapValues(this.allRequests, (requests, _hashCode) =>
      _.filter(requests, request => request.validAt(now))
    );
  },

  addRequest(hashCode, request) {
    const requests = this.allRequests[hashCode] || [];
    requests.push(request);
    this.allRequests[hashCode] = requests;
  },

  findRequestBy(hashCode, fn) {
    const requests = this.allRequests[hashCode] || [];
    return _.find(requests, fn);
  },

  findSuccess(hashCode, allowedAge = 0) {
    const now = Date.now();
    const requests = this.allRequests[hashCode] || [];

    const successRequests = _.filter(requests, request =>
      request.status === 'success' &&
        request.validAt(now) &&
        !request.tooOld(allowedAge, now)
    );

    // sort by most recently created
    const sortedRequests = _.sortBy(successRequests, request =>
      request.created_at * -1
    );

    // return most recent
    return sortedRequests[0];
  },

  request(url, data, options) {
    let deferredRequest;
    const hashCode = this.hashCode(url, data);

    this._stats.total += 1;

    if (options.force) {
      this._stats.forced += 1;
    } else {
      // check the cache for a successful request
      const successRequest = this.findSuccess(hashCode, options.allowedAge);

      if (successRequest != undefined) {
        this._stats.hits += 1;
        return successRequest;
      } else {
        this._stats.misses += 1;
      }
    }

    // find first request that is waiting or active
    const runningRequest = this.findRequestBy(hashCode, request =>
      request.status === 'waiting' || request.status === 'active'
    );

    let request;
    if (runningRequest != undefined) {
      this._stats.batched += 1;
      request = runningRequest;
    } else {
      this._stats.actual += 1;

      // create a request and queue for next animation cycle
      deferredRequest = new DeferredRequest(url, data, options.retainSeconds);
      this.addRequest(hashCode, deferredRequest);
      request = deferredRequest;
    }

    if (!this._requestedFrame) {
      this._requestedFrame = true;
      const callback = this._processWaitingRequests.bind(this);
      window.requestAnimationFrame(callback);
    }

    return request;
  }
};

const HTTPUtil = {
  get(url, { data = undefined, options = {} } = {}) {
    // force a request by skipping cache
    if (options.force == undefined) {
      options.force = false;
    }

    // age of request in the cache that can satisfy request in seconds.
    if (options.allowedAge == undefined) {
      options.allowedAge = 0;
    }

    // age to keep request in the cache.
    if (options.retainSeconds == undefined) options.retainSeconds = 600;

    return QueryCache.request(url, data, options);
  }
};

export default HTTPUtil;
