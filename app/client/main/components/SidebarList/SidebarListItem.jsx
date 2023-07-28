import PropTypes   from 'prop-types';
import React       from 'react';
import { NavLink } from 'react-router-dom';
import moment from 'moment';

import { Popover, Card, Icon } from '@transcriptic/amino';

import './SidebarListItem.scss';

function SidebarListItem(props) {

  return (
    <Card className="sidebar-list-item">
      <div className="sidebar-list-item__card">
        <NavLink
          to={props.url}
          activeClassName="sidebar-list-item__link--active"
          className="sidebar-list-item__link"
        />
        <div className="sidebar-list-item__row sidebar-list-item__top-row">
          <p className="sidebar-list-item__header-text tx-type--heavy">
            <NavLink
              to={props.url}
              className="sidebar-list-item__header"
            >
              <Popover
                content={<span>{props.name}</span>}
                placement="top"
                trigger="hover"
                showWhenOverflow
              >
                {props.name}
              </Popover>
            </NavLink>
          </p>
          <p className="sidebar-list-item__header-icon">
            <NavLink
              to={props.url}
            >
              <Icon icon={props.isPending ? 'fa fa-sync-alt' : 'fa fa-paperclip'} color="light" />
            </NavLink>
          </p>
        </div>
        <div className="sidebar-list-item__row">
          <div>
            {!!props.id && (
              <NavLink
                to={props.url}
                className="desc monospace sidebar-list-item__bottom-text"
              >
                {moment(props.date).format('LT')}
              </NavLink>
            )}
          </div>
          <div>
            {!!props.date && (
              <NavLink
                to={props.url}
                className="desc sidebar-list-item__bottom-text"
              >
                {moment(props.date).format('L')}
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

SidebarListItem.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  isPending: PropTypes.bool,
  download_url: PropTypes.string,
  date: PropTypes.string,
  id: PropTypes.string
};

export default SidebarListItem;
