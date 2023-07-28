import _ from 'lodash';

const sentencesFromRailsError = function(xhr) {
  if (xhr.responseJSON != undefined) {
    const msgs = _.toPairs(xhr.responseJSON).map(([key, errorStrs]) => {

      // rails returns errors in a {attribute: [errors]} format.
      // The :base attribute represents errors on the item instead of a
      // specific attribute.
      if (Array.isArray(errorStrs)) {
        return errorStrs.map((errorStr) => {
          if (key === 'base') {
            return errorStr;
          } else {
            return `${key} ${errorStr}`;
          }
        });
      }

      return [errorStrs];
    });

    return _.flattenDeep(msgs).join(' ');
  } else {
    return xhr.statusText;
  }
};

// eslint-disable-next-line import/prefer-default-export
export { sentencesFromRailsError };
