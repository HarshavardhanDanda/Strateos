import * as Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import QuickListCreatorListItem from 'main/components/QuickListCreatorListItem';
import { FormGroup } from '@transcriptic/amino';
import ImplementationItemActions from 'main/actions/ImplementationItemActions';
import CommonUiUtil from 'main/util/CommonUiUtil';
import { ShipmentModel } from 'main/stores/ShipmentStore';

class QuickListCreatorItemsList extends React.Component {

  static get propTypes() {
    return {
      checkingIn: PropTypes.bool.isRequired,
      items: PropTypes.instanceOf(Immutable.List),
      shipment: PropTypes.instanceOf(ShipmentModel),
      onLocationChange: PropTypes.func,
      onDestroy: PropTypes.func.isRequired
    };
  }

  // When the location for an item is updated in the UI, save it
  static saveItemLocation(item, location) {
    ImplementationItemActions.update(item.get('id'), item.set('location', location).toJS());
  }

  constructor(props) {
    super(props);

    _.bindAll(
      this,
      'onDestroy',
      'updateItemAtIndex',
      'checkBoxOnChange'
    );

    this.state = {
      items: props.items
    };
  }

  onDestroy(item, index) {
    if (this.props.shipment && this.props.shipment.id) {
      if (CommonUiUtil.confirmWithUser(`Destroy Item: ${item.get('name')}?`)) {
        ImplementationItemActions.destroy(item.get('id')).done(() => {
          this.setState({ items: this.state.items.remove(index) });
        });
      }
    } else {
      this.props.onDestroy(index);
    }
  }

  updateItemAtIndex(updatedItem, index) {
    this.setState({ items: this.state.items.set(index, updatedItem) });
  }

  checkBoxOnChange(item, index) {
    ImplementationItemActions.update(item.get('id'),
      item.get('checked_in_at') ?
        item.set('checked_in_at', null).toJS() :
        item.set('checked_in_at', new Date()).toJS()
    ).then((item) => this.setState({ items: this.state.items.setIn([index, 'checked_in_at'], item.data.attributes.checked_in_at) }));
  }

  getLocationValue(item, index) {
    if (this.props.checkingIn) {
      return (
        <input
          placeholder="Location"
          type="text"
          name="location"
          value={item.get('location', '')}
          onChange={e => this.updateItemAtIndex(item.set('location', e.target.value), index)}
          onBlur={() => QuickListCreatorItemsList.saveItemLocation(item, item.get('location', ''))}
        />
      );
    }
    if (this.props.shipment && item.get('location')) return item.get('location');
    return '';
  }

  render() {
    // create modal updates items prop as we can add items to it, so can't depend only on state
    // update modal updates an item attibutes location,checked_in_at so can't depend on props alone
    const items = this.props.shipment ? this.state.items : this.props.items;
    return (
      <div className="col-md-12">
        {// Render each item stored in state in a list
          items.map(
            (item, index) => {
              return (
                <QuickListCreatorListItem
                  key={index} // eslint-disable-line react/no-array-index-key
                  item={item}
                  itemID={item.get('id') ? item.get('id').toString() : undefined}
                  title={item.get('name')}
                  checkingIn={this.props.checkingIn}
                  data={
                    [
                      { label: 'Quantity', value: `${item.get('quantity')}x` },
                      { label: 'Container', value: item.get('container_type') },
                      { label: 'Storage', value: item.get('storage_condition') },
                      // If the checkinIn prop is set to true, render a location input
                      // If the item isn't being checked in, but has been passed a shipment property
                      // render the location as a string
                      { label: 'Location',
                        value: this.getLocationValue(item, index)
                      },
                      // if checkingIn prop is set to true, render a checkbox that can be used to
                      // mark an item as "received"
                      { label: '',
                        value: this.props.checkingIn ? (
                          <FormGroup
                            className="list-item__checkbox"
                            label="Received"
                          >
                            <div>
                              <div className="checkbox">
                                <label htmlFor={item.get('id')} className="list-item__checkbox-label">
                                  <input
                                    id={item.get('id')}
                                    checked={!!item.get('checked_in_at')}
                                    onChange={() => this.checkBoxOnChange(item, index)}
                                    type="checkbox"
                                    className="list-item__checkbox-input"
                                  />
                                </label>
                              </div>
                            </div>
                          </FormGroup>
                        ) : ''
                      },
                      { label: 'Notes', value: item.get('note') || '' }
                    ]}
                  removeItem={
                  // if the checkingIn prop was passed as false, pass a method to be called
                  // when an item's deletion button is clicked
                    !this.props.checkingIn ? () => { this.onDestroy(item, index); } : undefined
                  }
                />
              );
            })
        }
      </div>
    );
  }
}

export default QuickListCreatorItemsList;
