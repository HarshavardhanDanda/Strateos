import React from 'react';
import ReactDOMServer from 'react-dom/server';

const ReactUtil = {};

ReactUtil.findChild = function(children, predicate) {
  let found;

  React.Children.forEach(children, (child) => {
    if (found == undefined && predicate(child)) {
      found = child;
    }
  });

  return found;
};

ReactUtil.filterChildren = function(children, predicate) {
  return React.Children.map(children, (child) => {
    return predicate(child) ? child : undefined;
  });
};

ReactUtil.getStringFromComponent = function(component) {
  return new DOMParser().parseFromString(ReactDOMServer.renderToString(component), 'text/html').documentElement.textContent;
};

export default ReactUtil;
