import $ from 'jquery';
import _ from 'lodash';

const S3Util = {};

// Given an S3 url and an object of header values fetches from s3.
S3Util.get = function(url, headers) {
  const options = {
    url: url,
    type: 'GET',
    beforeSend: (xhr) => {
      xhr.setRequestHeader('Accept', 'application/json');

      _.forEach(headers, (value, key) => {
        xhr.setRequestHeader(key, value);
      });
    }
  };

  return $.ajax(options);
};

export default S3Util;
