import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import 'main/pages/RunsPage/views/CalenderView/ColoredBulletList.scss';

class ColoredBulletList extends React.Component {

  getListBullet(type) {
    switch (type) {
      case 'circle':
        return '\u25CF';
      case 'square':
        return '\u25A0';
    }
  }

  render() {
    const { items, bulletType, itemOrientation } = this.props;
    return (
      <div className={classNames('list-container', 'tx-inline', 'tx-inline--sm', {
        'row-orientation': itemOrientation === 'row'
      })}
      >
        {
          items.map((item) => {
            return (
              <div
                className="tx-inline"
                key={item.get('id')}
                onClick={() => this.props.onItemClick(item.get('id'))}
              >
                <span
                  style={{
                    color: item.get('color')
                  }}
                  className={
                    classNames('list-container__bullet', {
                      'list-container--disable': !item.get('enabled')
                    })}
                >
                  {this.getListBullet(bulletType)}
                </span>
                <span className={
                  classNames('list-container__name', 'desc', 'tx-type--heavy', {
                    'list-container--disable': !item.get('enabled')
                  })}
                >
                  { item.get('name')}
                </span>
              </div>
            );
          })
        }
      </div>
    );
  }
}

ColoredBulletList.propTypes = {
  items: PropTypes.instanceOf(Immutable.Iterable),
  onItemClick: PropTypes.func,
  bulletType: PropTypes.oneOf(['circle', 'square']),
  itemOrientation: PropTypes.oneOf(['row', 'column'])
};
ColoredBulletList.defaultProps = {
  bulletType: 'circle',
  items: Immutable.List(),
  itemOrientation: 'row'
};
export default ColoredBulletList;
