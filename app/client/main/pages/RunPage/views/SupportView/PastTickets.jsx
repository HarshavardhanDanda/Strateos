import PropTypes from 'prop-types';
import React     from 'react';
import Immutable from 'immutable';
import _ from 'lodash';

import PostTimeStamp from 'main/conversation/PostTimeStamp';
import UserStore from 'main/stores/UserStore';
import UserProfile from 'main/components/UserProfile/UserProfile';
import './PastTickets.scss';

function PastTickets(props) {
  return (
    <div className="past-tickets">
      {props.supportTickets.sortBy(s => s.created_at)
        .reverse()
        .map((supportTicket) => {
          const { message, created_at } = supportTicket;
          const userId = supportTicket.userId || supportTicket.user_id;
          const user = UserStore.getById(userId);
          return (
            <div className="post event user" key={userId}>
              <div className="container">
                <If condition={user}>
                  <UserProfile user={user} />
                  <span className="header">{user.get('name')}</span>
                </If>
                <span className="header"><PostTimeStamp timestamp={created_at} /></span>
              </div>
              <div className="text">{message}</div>
            </div>
          );
        })}
    </div>
  );
}

PastTickets.propTypes = {
  supportTickets: PropTypes.instanceOf(Immutable.List)
};

export default PastTickets;
