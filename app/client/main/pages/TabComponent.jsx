import React from 'react';
import Sidebar from './Sidebar';

function TabComponent(props) {
  return (
    <div className="container tab-component">
      <div className="row">
        <div className="col-sm-3">
          <Sidebar {...props} />
        </div>
        <div className="col-sm-9">{props.children}</div>
      </div>
    </div>
  );
}

export default TabComponent;
