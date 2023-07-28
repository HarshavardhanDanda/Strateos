import Accounting from 'accounting';
import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

class PriceTree extends React.Component {

  static get propTypes() {
    return {
      node: PropTypes.object,
      startOpen: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      startOpen: true
    };
  }

  constructor(props, context) {
    super(props, context);

    this.state = {
      open: props.startOpen
    };
  }

  render() {
    return (
      <div className="price-tree">
        <div
          className="price-tree__node"
          onClick={() => {
            if (this.props.node.children && this.props.node.children.length) {
              this.setState({ open: !this.state.open });
            }
          }}
        >
          <div className="price-tree__name">
            <Choose>
              <When condition={this.props.node.children && this.props.node.children.length}>
                <i className={classNames('fa', 'fa-sm', 'fa-fw', this.state.open ? 'fa-minus' : 'fa-plus')} />
              </When>
              <Otherwise>
                <i className="far fa-sm fa-fw fa-circle" />
              </Otherwise>
            </Choose>
            {` ${this.props.node.name}`}
          </div>
          <div className="price-tree__total">
            {Accounting.formatMoney(this.props.node.total)}
          </div>
        </div>
        <If condition={this.state.open}>
          <div className="price-tree__children">
            {this.props.node.children.map((node, i) =>
              <PriceTree key={i} node={node} startOpen={false} />
            )}
          </div>
        </If>
      </div>
    );
  }
}

export default PriceTree;
