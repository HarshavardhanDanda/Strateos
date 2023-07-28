/*
 * This file defines commonly used proptypes so that definitions are
 * consolidated and easy to reuse.
 */

import PropTypes from 'prop-types';

const AnyChildrenShape = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.node),
  PropTypes.node
]);

const match = PropTypes.shape({
  params: PropTypes.object.isRequired,
  isExact: PropTypes.bool,
  path: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired
});

const location = PropTypes.shape({
  key: PropTypes.string,
  pathname: PropTypes.string.isRequired,
  search: PropTypes.string.isRequired,
  hash: PropTypes.string.isRequired,
  state: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
    PropTypes.number,
    PropTypes.object,
    PropTypes.string
  ])
});

const history = PropTypes.shape({
  length: PropTypes.number.isRequired,
  action: PropTypes.oneOf(['PUSH', 'REPLACE', 'POP']).isRequired,
  location: location.isRequired,
  push: PropTypes.func.isRequired,
  replace: PropTypes.func.isRequired,
  go: PropTypes.func.isRequired,
  goBack: PropTypes.func.isRequired,
  goForward: PropTypes.func.isRequired,
  block: PropTypes.func.isRequired
});

const ReactRouterRoute = {
  match: match.isRequired,
  location: location.isRequired,
  history: history.isRequired
};

const LiHaChartShape = PropTypes.shape({
  sources: PropTypes.instanceOf(Object),
  destinations: PropTypes.instanceOf(Object),
  edges: PropTypes.arrayOf(PropTypes.instanceOf(Object))
});

export { AnyChildrenShape, LiHaChartShape, ReactRouterRoute };
