import React from 'react';
import Immutable from 'immutable';
import JSONEditor from 'jsoneditor';
import Draggable from 'react-draggable';

import rootNode from 'main/state/rootNode';
import ConnectToStoresHOC from 'main/containers/ConnectToStoresHOC';

// Inspect store state
class RootNodeDebugger extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };

    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.toggle);

    // TODO: Gross.
    this.editor = new JSONEditor(this.container, {
      onChange: () => {
        try {
          // We will receive a `changeImmediate` event here, which we don't want
          // to respond to (since the change came from us and is already applied
          // in the editor). Prevent it from triggering by setting @_editing to
          // true.
          this._editing = true;
          this.props.rootNode.set(Immutable.fromJS(this.editor.get()));
        } finally {
          this._editing = false;
        }
      }
    });
    this.editor.set(this.props.rootNode.get().toJS());
  }

  componentDidUpdate() {
    if (this.state.open) {
      this.update();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.toggle);
  }

  // TODO: Gross.
  update() {
    let n;
    if (this._editing) {
      return;
    }
    // JSONEditor doesn't remember what nodes were expanded when you call
    // `editor.set()`, so we do it for them.
    const expandedPaths = [];
    // Walk the tree of currently expanded nodes and save them in
    // `expandedPaths`.
    var check = function(n, path) {
      if (path == null) {
        path = [];
      }
      if (n.expanded) {
        const p = path.concat([n.field]);
        expandedPaths.push(p);
        return Array.from(n.childs).map(c => check(c, p));
      }
    };
    check(this.editor.node);
    // Update the editor.
    this.editor.set(this.props.rootNode.get().toJS());
    // Expand the nodes that were previously expanded (if they're still there).
    const getNodeForPath = p => {
      n = this.editor.node;
      for (var pc of Array.from(p.slice(1))) {
        n = n.childs.filter(x => x.field === pc)[0];
        if (!n) {
          break;
        }
      }
      return n;
    };
    for (const p of Array.from(expandedPaths)) {
      n = getNodeForPath(p);
      if (n != null) {
        n.expand(false);
      }
    }
  }

  toggle(e) {
    if (e.altKey && e.which === 'S'.charCodeAt(0)) {
      if (!this.state.open) {
        this.update();
      }
      this.setState({ open: !this.state.open });
    }
  }

  render() {
    return (
      <Draggable>
        <div
          ref={ref => this.container = ref}
          style={{
            display: this.state.open ? 'block' : 'none',
            position: 'absolute',
            width: '500px',
            height: '500px',
            zIndex: 10000,
            background: 'white'
          }}
        />
      </Draggable>
    );
  }
}

export default ConnectToStoresHOC(RootNodeDebugger, () => ({ rootNode }));
