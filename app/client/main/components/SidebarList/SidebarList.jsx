import PropTypes from 'prop-types';
import React     from 'react';
import _ from 'lodash';
import shortid from 'shortid';
import Moment from 'moment';

import { Button, Tooltip, SearchFilter, SearchFilterBar, Divider } from '@transcriptic/amino';

import SidebarListItem from './SidebarListItem';

import './SidebarList.scss';

class SidebarList extends React.Component {

  render() {

    let sortedItems;
    let currentOption;

    if (this.props.sortOptions) {
      currentOption = _.find(this.props.sortOptions, (option) => {
        return option.sortOrder === this.props.sortOrder;
      });
    }

    if (currentOption) {
      const sortFunction = currentOption && currentOption.sortFunction;

      sortedItems = sortFunction(this.props.links);
    } else {
      sortedItems = this.props.links;
    }

    return (
      <div className="sidebar-list tx-stack">
        <If condition={this.props.header || this.props.actions}>
          <div className="sidebar-list__header">
            <If condition={this.props.header}>
              <h3 className="sidebar-list__header-text tx-type--heavy tx-type--secondary">
                {this.props.header}
              </h3>
            </If>
            <If condition={this.props.actions}>
              <div className="sidebar-list__actions">
                {
                  this.props.actions.map((action) => {
                    return (
                      <Tooltip key={action.title} placement="bottom" title={action.title} slim>
                        <Button to={action.to} onClick={action.onClick} newTab={action.newTab} tagLink link type="secondary">
                          <i className={action.icon} />
                        </Button>
                      </Tooltip>
                    );
                  })
                }
              </div>
            </If>
          </div>
        </If>
        <If condition={this.props.sortOptions && (sortedItems.length > 1)}>
          <SearchFilterBar orientation="horizontal">
            <SearchFilter
              id="sort-by"
              title="Sort By"
              options={this.props.sortOptions.map((option) => {
                return {
                  display: option.display,
                  queryTerm: option.sortOrder
                };
              })}
              currentSelection={this.props.sortOrder}
              onSelectOption={this.props.onChangeSortOrder}
            />
          </SearchFilterBar>
        </If>
        <If condition={this.props.header || this.props.actions || this.props.sortOptions}>
          <Divider />
        </If>
        <div className="sidebar-list__list">
          <If condition={this.props.links}>
            {
              sortedItems.map((link) => {
                return (
                  <SidebarListItem
                    url={link.url}
                    name={link.name}
                    download_url={link.download_url}
                    date={link.date && Moment(link.date.raw).format(link.date.format)}
                    id={link.id}
                    isActive={link.isActive}
                    isPending={link.isPending}
                    key={link.id || shortid.generate()}
                  />
                );
              })
            }
          </If>
        </div>
      </div>
    );
  }
}

SidebarList.propTypes = {
  header: PropTypes.string,
  links: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    isPending: PropTypes.bool,
    download_url: PropTypes.string,
    date: PropTypes.shape({
      raw: PropTypes.string.isRequired,
      format: PropTypes.string.isRequired
    }),
    id: PropTypes.string
  })),
  actions: PropTypes.arrayOf(PropTypes.shape({
    to: PropTypes.string,
    onClick: PropTypes.func,
    newTab: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })),
  sortOptions: PropTypes.arrayOf(PropTypes.shape({
    display: PropTypes.string.isRequired,
    sortOrder: PropTypes.string.isRequired,
    sortFunction: PropTypes.func.isRequired
  })),
  sortOrder: PropTypes.string.isRequired,
  onChangeSortOrder: PropTypes.func.isRequired
};

export default SidebarList;
