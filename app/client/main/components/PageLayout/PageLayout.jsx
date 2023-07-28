import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import PageHeader from './PageHeader';

import './PageLayout.scss';

const propTypes = {
  fullWidth:     PropTypes.bool,
  hideOverflow:  PropTypes.bool,
  theme: PropTypes.string,
  PageHeader: PropTypes.node.isRequired, // Use our standard PageHeader
  Subtabs: PropTypes.node,               // Use our standard Subtabs
  Modals: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  pageBodyRef: PropTypes.func,
  onPageContentScroll: PropTypes.func,
};

const defaultProps = {
  fullWidth: false,
  hideOverflow: false,
  theme: 'white'
};

class PageLayout extends React.Component {
  componentDidMount() {
    if (process.env.NODE_ENV !== 'production') {
      this.validateContents();
    }
  }

  validateContents() {
    const count = PageHeader.numInstances(this.node);
    if (count != 1) {
      console.warn('PageLayout must render a single page-header. Number found: ', count);
    }
  }

  render() {
    const bodyClassNames = classNames(
      'tabbed-content',
      'tx-two-element-layout__body',
      {
        'full-width': this.props.fullWidth,
        'hide-overflow': this.props.hideOverflow
      }
    );

    const bodyContentClassName = classNames(
      'tx-two-element-layout__body-content',
      'tx-layout__tab-content'
    );

    return (
      <div
        className={classNames('tabbed-page', 'page-layout', 'tx-two-element-layout', `page-layout__${this.props.theme}`)}
        ref={(node) => { this.node = node; }}
      >
        {this.props.Modals}
        <div className="tx-two-element-layout__header page-layout__header">
          {this.props.PageHeader}
          <If condition={this.props.Subtabs}>
            <div className="page-layout__tabs-content">
              <div className="page-layout__tabs tx-view">
                {this.props.Subtabs}
              </div>
            </div>
          </If>
        </div>
        <div className={bodyClassNames} ref={this.props.pageBodyRef}>
          <div
            className={bodyContentClassName}
            onScroll={this.props.onPageContentScroll}
          >
            { this.props.children }
          </div>
        </div>
      </div>
    );
  }
}

PageLayout.propTypes    = propTypes;
PageLayout.defaultProps = defaultProps;

export default PageLayout;
