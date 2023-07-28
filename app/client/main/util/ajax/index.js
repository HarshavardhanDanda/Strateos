import SessionStore from 'main/stores/SessionStore';

// Configures jQuery ajax requests.
//
// Exposes GET/POST/PUT/PATCH/HEAD/DELETE helpers with (url [,data])
// signatures.
//
// Currently, jquery defferds are returned. Long term I would like
// to fix this to return native promises, which will allow us to use the
// async/await pattern. To accomplish this, we will have to use then/catch
// instead of done/fail, which has some differences besides naming.
// To assist in this conversion, wrap your calls using safeThen, safeCatch, and safeFinally
//
// Rails embeds a csrf-token in the initial html page sent to the client
// This module exports a singleton that retrieves the csrf token from the DOM
// once, and sends the token on all ajax requests. Without this, rails would
// deny all PUT/POST/DELETE requests.
//
// Also fixes an issue where Rails sends a single space " " as a response for
// head :ok, which jQuery then fails to parse as JSON.

import $ from 'jquery';
import _ from 'lodash';
import underscored from 'underscore.string/underscored';
import camelize from 'underscore.string/camelize';
import uuidv4 from 'uuid/v4';

import { deepMapKeys } from 'main/util/ObjectUtil';

/**
 * singly() is a helper for ensuring that only one request is in flight at a
 * time. This is particularly useful for Google Instant-style autocomplete or
 * search fields.
 *
 * Example:
 * request_queue = singly()
 * $('#search').on 'input', (evt) ->
 *   query = $(evt.target).val()
 *   request_queue (done) ->
 *     ajax.get "/search?q=#{encodeURIComponent query}", (data) ->
 *       updateResults(data)
 *     .always ->
 *       done() # calls the most recent as-yet-uncalled thing that has been passed
 *              # to `request_queue`
 */
const singly = () => {
  let in_flight = false;
  let pending;

  const go = (fn) => {
    if (in_flight) {
      pending = fn;
    } else {
      in_flight = true;

      const cb = () => {
        in_flight = false;

        if (pending) {
          const p = pending;
          pending = undefined;
          go(p);
        }
      };

      fn(cb);
    }
  };

  return go;
};

let token;
const getToken = () => {
  token =
    $('meta[name="csrf-token"]').attr('content') || Transcriptic.csrfToken;
  return token;
};

const getOrganizationID = () => {
  const organization = SessionStore.getOrg();
  return organization ? organization.get('id') :  undefined;
};

const getUserID = () => {
  return SessionStore.getUser('id');
};

// 1. Rails sends a single space " " as a response for head :ok, which it
// then fails to parse as JSON. This works around the issue by treating
// empty and whitespace-only responses as empty objects.
//
// 2. TODO: camelcase all response bodies
//
const processResponseBody = (response) => {
  const res = response ? response.trim() : '';
  return res ? JSON.parse(res) : {};
};

const baseRequestOptions = (opts) => {
  const { type, url, idempotencyKey, contentType } = opts;
  let data = opts.data;
  if (data && type === 'GET') {
    // filter keys with undefined/null values
    data = _.pickBy(data, value => value != undefined);
  } else {
    data = contentType === 'FORMDATA' ? data : JSON.stringify(data);
  }

  const options = {
    beforeSend: (xhr) => {
      xhr.setRequestHeader('X-CSRF-Token', token || getToken());
      if (getOrganizationID()) { xhr.setRequestHeader('X-Organization-Id', getOrganizationID()); }
      if (contentType === 'FORMDATA') {
        xhr.setRequestHeader('mimeType', 'multipart/form-data');
      } else {
        xhr.setRequestHeader('Accept', 'application/json');
        // jQuery will set to "application/x-www-form-urlencoded" otherwise
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        if (idempotencyKey) {
          xhr.setRequestHeader('Idempotency-Key', idempotencyKey);
        }
      }
    },
    converters: {
      'text json': processResponseBody
    },
    data,
    type,
    url
  };

  const formDataOptions = {
    ...options,
    processData: false,
    contentType: false,
  };

  return contentType === 'FORMDATA' ? formDataOptions : options;
};

const wait = ms => $.Deferred(defer => setTimeout(defer.resolve, ms));

const request = (opts, numTries = 0) => {
  const RETRY_COUNT = 2;
  const INITIAL_NETWORK_RETRY_DELAY = 500;
  const delay = INITIAL_NETWORK_RETRY_DELAY + (INITIAL_NETWORK_RETRY_DELAY * numTries);

  const idempotency = {};
  if (opts.type === 'POST' && !opts.idempotencyKey) {
    idempotency.idempotencyKey = uuidv4();
  }
  const options = baseRequestOptions(Object.assign(idempotency, opts));

  const $d = $.ajax(options);
  return $d.then(undefined, (xhr) => {
    if (xhr.readyState < 4 && numTries < RETRY_COUNT) {
      return wait(delay).then(() => request(options, numTries + 1));
    }
    return $d;
  });
};

// fn: () => Promise<Boolean>
const poll = (fn, interval = 100, maxWait = 60000) => {
  const start = Date.now();
  let last = 0;

  return new Promise((resolve, reject) => {
    const doPoll = () => {
      const now = Date.now();
      if (now > start + maxWait) {
        reject('Polling maxWait exceeded');
        return;
      }
      if (now > last + interval) {
        last = Date.now();
        fn()
          .then((predicate) => {
            let isDone = false;

            // accept both types of predicate, so this allows response object to be passed to
            // the caller
            if (predicate && typeof predicate === 'boolean') {
              isDone = predicate;
            } else if (predicate && typeof predicate === 'object') {
              isDone = !!predicate.isDone;
            }

            if (isDone) {
              resolve(predicate);
            } else {
              doPoll();
            }
          })
          .fail((stopPoll) => {
            if (!stopPoll) {
              doPoll();
            }
          });
      } else {
        setTimeout(doPoll, (last + interval) - now);
      }
    };
    doPoll();
  });
};

const get = (url, data) => request({ url, data, type: 'GET' });
const put = (url, data) => request({ url, data, type: 'PUT' });
const post = (url, data) => request({ url, data, type: 'POST' });
const postFormData = (url, data) => request({ url, data, type: 'POST', contentType: 'FORMDATA' });
const head = (url, data) => request({ url, data, type: 'HEAD' });
const patch = (url, data) => request({ url, data, type: 'PATCH' });
// reserved word
/* eslint-disable no-underscore-dangle */
const _delete = (url, data) => request({ url, data, type: 'DELETE' });

const camelcase = object => deepMapKeys(object, camelize);
const snakecase = object => deepMapKeys(object, underscored);

/* eslint-disable valid-typeof */
const FUNCTION_TYPE = 'function';
const raisePromiseTypeNotFound = () => { throw new Error('Passed promise is neither native nor jquery based'); };

export const safeFail = (promise, callback) => {
  if (promise && typeof promise.catch === FUNCTION_TYPE) {
    return promise.catch(callback);
  } else if (promise && typeof promise.fail === FUNCTION_TYPE) {
    return promise.fail(callback);
  } else {
    raisePromiseTypeNotFound();
  }
};

export const safeAlways = (promise, callback) => {
  if (promise && typeof promise.finally === FUNCTION_TYPE) {
    return promise.finally(callback);
  } else if (promise && typeof promise.always === FUNCTION_TYPE) {
    return promise.always(callback);
  } else {
    raisePromiseTypeNotFound();
  }
};

// export these until replaced with native promises
const { when, Deferred } = $;
export default {
  get,
  put,
  post,
  head,
  patch,
  delete: _delete,
  when,
  Deferred,
  camelcase,
  snakecase,
  singly,
  poll,
  getToken,
  getOrganizationID,
  getUserID,
  postFormData
};
