import classNames from 'classnames';
import PropTypes  from 'prop-types';
import React      from 'react';

import ReactUtil from 'main/util/ReactUtil';

import './TabLayout.scss';

/*
* Component to layout content for tabs in the main app.
* If a topbar node is passed, it is rendered in the top.
* If a sidebar node is passed, it is rendered and the widths adjusted as necessary.
* Component need to be the first child of PageLayout or Modal to scroll sidebar independently.
*/
class TabLayout extends React.Component {
  static get propTypes() {
    return {
      wideSidebar: PropTypes.bool,
      onBodyContentScroll: PropTypes.func, // event that occurs on scroll
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ]),
      className: PropTypes.string,
      noScroll: PropTypes.bool,
      theme: PropTypes.string,
      /*
      * TabLayout style need to be adjusted slightly depending on the context it is placed within.
      *
      * <PageLayout>
      *   <TabLayout />
      * </PageLayout>
      *
      * <Modal>
      *   <TabLayout />
      * </Modal>
      *
      * <ModalDrawer>
      *   <TabLayout />
      * </ModalDrawer>
      */
      contextType: PropTypes.oneOf(['page', 'modal', 'drawer'])
    };
  }

  static get defaultProps() {
    return {
      contextType: 'page',
      sidebarWidth: 2
    };
  }

  static isTopbar(reactNode) {
    return (reactNode != undefined) && (reactNode.props.TYPE == 'TabLayoutTopbar');
  }

  static isSidebar(reactNode) {
    return (reactNode != undefined) && (reactNode.props.TYPE == 'TabLayoutSidebar');
  }

  static isNonSidebar(reactNode) {
    return (reactNode == undefined) || (!TabLayout.isTopbar(reactNode) && !TabLayout.isSidebar(reactNode));
  }

  render() {
    const sidebar       = ReactUtil.findChild(this.props.children, TabLayout.isSidebar);
    const topbar        = ReactUtil.findChild(this.props.children, TabLayout.isTopbar);
    const otherChildren = ReactUtil.filterChildren(this.props.children, TabLayout.isNonSidebar);

    const sidebarWidth = this.props.wideSidebar ? 3 : this.props.sidebarWidth;
    const bodyWidth = 12 - (sidebar ? sidebarWidth : 0);

    const sidebarSizeClass = `col-xs-12 col-sm-${sidebarWidth} order-xs-2 order-sm-1`;
    const bodySizeClass = `col-xs-12 col-sm-${bodyWidth} order-xs-1 order-sm-2`;

    return (
      <div className={classNames('tab-layout', `tab-layout--inside-${this.props.contextType}`, this.props.className, {
        'tx-view': this.props.contextType === 'page' }, `tab-layout__${this.props.theme}`
      )}
      >
        <div className="tab-layout__columns row">
          {sidebar && (
            <div
              className={classNames('tab-layout__sidebar-column', sidebarSizeClass, {
                'tab-layout__sidebar-column--no-scroll': sidebar.props.noScroll,
                'tab-layout__sidebar-column--no-border': sidebar.props.noBorder
              }
              )}
            >
              <div className="tab-layout__sidebar">
                {sidebar}
              </div>
            </div>
          )}
          {bodyWidth > 0 && (
            <div
              className={classNames('tab-layout__body-column', bodySizeClass, {
                'tab-layout__body-column--no-scroll': this.props.noScroll
              }
              )}
              onScroll={this.props.onBodyContentScroll}
            >
              {topbar && (
                <div className="tab-layout__topbar">
                  {topbar}
                </div>
              )}
              <div className="tab-layout__body">
                {otherChildren}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

/**
 * A component used for type checking by the TabLayout component above.
*/
class TabLayoutSidebar extends React.Component {
  static get propTypes() {
    return {
      // store the TYPE in the props to dynamically inspect elements for filtering.
      // store in props instead of static to avoid uglification name mangling.
      // eslint-disable-next-line
      TYPE: PropTypes.string,

      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ]),
      noScroll: PropTypes.bool
    };
  }

  static get defaultProps() {
    return {
      TYPE: 'TabLayoutSidebar'
    };
  }

  render() {
    return this.props.children;
  }
}

/**
 * A component used for type checking by the TabLayout component above.
*/
class TabLayoutTopbar extends React.Component {
  static get propTypes() {
    return {
      // store the TYPE in the props to dynamically inspect elements for filtering.
      // store in props instead of static to avoid uglification name mangling.
      // eslint-disable-next-line
      TYPE: PropTypes.string,

      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ])
    };
  }

  static get defaultProps() {
    return {
      TYPE: 'TabLayoutTopbar'
    };
  }

  render() {
    return this.props.children;
  }
}

export { TabLayout, TabLayoutSidebar, TabLayoutTopbar };
