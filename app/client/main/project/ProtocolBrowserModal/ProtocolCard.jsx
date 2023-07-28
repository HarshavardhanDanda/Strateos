import PropTypes  from 'prop-types';
import React      from 'react';
import classNames from 'classnames';

import {  Highlighted, Popover }     from '@transcriptic/amino';
import { CardDetailHover } from 'main/components/ContainerCard';
import FavoriteAPI         from 'main/api/FavoriteAPI';
import FavoriteStore       from 'main/stores/FavoriteStore';
import uuidv4              from 'uuid/v4';

import './ProtocolCard.scss';

function ProtocolCard({ protocol, onClick, searchText, isFetching }) {
  const name    = protocol.display_name || protocol.name;
  const logoUrl = protocol.logo_url;
  const isFavorite = FavoriteStore.hasFavorableId(protocol.id);

  const onFavoriteClick = (e) => {
    e.stopPropagation();
    if (!isFavorite) {
      FavoriteAPI.create({
        attributes: {
          favorable_id: protocol.id,
          favorable_type: 'Protocol'
        }
      });
    } else {
      const favorite = FavoriteStore.getByFavorableId(protocol.id);
      FavoriteAPI.destroy(favorite.get('id'));
    }

  };

  return (
    <div className="protocol-tile card" onClick={onClick}>
      <div className="protocol-details">
        <div className="protocol-name">
          <h3 className="str-type--branded">
            <Highlighted text={name} highlight={searchText} />
          </h3>
        </div>
        <div className="protocol-description">
          <p className="desc">
            <Choose>
              <When condition={protocol.description !== undefined}>
                <Highlighted
                  text={protocol.description}
                  highlight={searchText}
                />
              </When>
              <Otherwise>(No Description)</Otherwise>
            </Choose>
          </p>
        </div>
        <If condition={!Transcriptic.current_user.system_admin}>
          <div className="protocol-card__popover-wrapper">
            <Popover
              placement="top"
              trigger="hover"
              content={isFavorite ? <div>Un-Favorite</div> : <div>Favorite</div>}
              onModal
              key={uuidv4()}
            >
              <div
                onClick={onFavoriteClick}
                className="protocol-card__favorite-icon"
              >
                <i className={classNames({
                  'far fa-star': !isFavorite,
                  'fas fa-star protocol-card__favorite-icon--active':
                     !!isFavorite
                })}
                />
              </div>
            </Popover>
          </div>
        </If>
      </div>
      <If condition={logoUrl}>
        <img className="protocol-logo" alt="logo" src={logoUrl} />
      </If>
      <If condition={isFetching}>
        <CardDetailHover
          text="View Protocol"
          isFetching
          isSelected
          disableOpacityAnimation
        />
      </If>
    </div>
  );
}

ProtocolCard.propTypes = {
  protocol: PropTypes.shape({
    display_name: PropTypes.string,
    name:         PropTypes.string,
    logo_url:     PropTypes.string,
    description:  PropTypes.string
  }).isRequired,

  onClick:    PropTypes.func.isRequired,
  searchText: PropTypes.string,
  isFetching: PropTypes.bool
};

export default ProtocolCard;
