import _ from 'lodash';

const leadingSlash = /^\//i;
const trailingSlash = /\/$/g;
function stripSlashes(segment: string) {
  return segment
    .replace(leadingSlash, '')
    .replace(trailingSlash, '');
}

interface Fields {
  [index: string]: Array<string>;
}
interface Filters {
  [index: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface Options {
  includes?: Array<string>;
  fields?: Fields;
  filters?: Filters;
  limit?: number;
  offset?: number;
  sortBy?: Array<string>;
  page?: number;
  version?: 'v2';
}

function createUrl(pathSegments: Array<string>, options: Options = {}) {
  const queryParams = createQueryParams(options);
  // Filter empty strings
  const path = pathSegments.filter(n => n).map(stripSlashes).join('/');

  if (queryParams.length === 0) {
    return `/${path}`;
  }

  const queryString = queryParams.join('&');
  return `/${path}?${queryString}`;
}

function createApiUrl(pathSegments, options: Options = {}) {
  return createUrl(['api', options.version, ...pathSegments], options);
}

function createQueryParams(options: Options) {
  const queryParams = [];

  // include=aliquots,aliquots.resource
  if (options.includes) {
    const includeStr = `include=${options.includes.join(',')}`;
    queryParams.push(includeStr);
  }

  // fields[containers]=barcode,cover&fields[aliquots]=label
  if (options.fields) {
    const fieldsStrArray = _.toPairs(options.fields).map(
      ([resource, fields]) => `fields[${resource}]=${fields.join(',')}`
    );

    const fieldsStr = fieldsStrArray.join('&');
    queryParams.push(fieldsStr);
  }

  // filter[barcode]=123123124&filter[label]='somelabel'
  if (options.filters) {
    const filtersStrArray = _.toPairs(options.filters).map(
      ([filterKey, filterValue]) => {
        if (typeof filterValue === 'object') {
          const nestedFiltersStrArray = _.toPairs(filterValue).map(
            ([nestedFilterKey, nestedFilterValue]) => {
              return `filter[${filterKey}][${nestedFilterKey}]=${nestedFilterValue}`;
            }
          );
          return nestedFiltersStrArray.join('&');
          // queryParams.push(nestedFilterStr);
        } else return `filter[${filterKey}]=${filterValue}`;
      }
    );

    const filterStr = filtersStrArray.join('&');
    queryParams.push(filterStr);
  }

  // page[number] = 4;
  if (options.page && options.page !== 1) {
    queryParams.push(`page[number]=${options.page}`);
  }

  // page[limit]=10
  if (options.limit) {
    queryParams.push(`page[limit]=${options.limit}`);
  }

  // page[offset]=1234
  if (options.offset) {
    queryParams.push(`page[offset]=${options.offset}`);
  }

  // sort=-x,y,z
  if (options.sortBy) {
    const sortStr = options.sortBy.join(',');
    queryParams.push(`sort=${sortStr}`);
  }

  // page[offset]=1234
  // NOTE: page is 1 indexed, not zero
  if (options.page !== undefined && !options.offset) {
    const pageSize        = options.limit || 10;
    const pageZeroIndexed = options.page - 1;
    const offset          = pageZeroIndexed * pageSize;

    queryParams.push(`page[offset]=${offset}`);
  }

  return queryParams;
}

export {
  createQueryParams,
  createApiUrl,
};
