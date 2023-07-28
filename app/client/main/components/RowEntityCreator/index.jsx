import classNames from 'classnames';
import Immutable  from 'immutable';
import PropTypes  from 'prop-types';
import React      from 'react';

import { Validated } from '@transcriptic/amino';
import { SimpleInputsValidator } from 'main/components/validation';

import './RowEntityCreator.scss';

/*
RowEntityCreator is a configurable UI component that renders as a set of text input fields
aligned horizontally - in a row. It is to be used when a user needs to rapidly add several
rows to a table. This can be see in action in the Implementation Shipments panel of the
Ship tab in the admin app.
*/

/*
Developer Use:
Props:
  onAdd: A function fired when the user submits the row. Should likely be used to add
  the entered data to the state. OnAdd will be provided two inputs, one is the event object, the
  other is a boolean indicating if the entity passed the validator
  children: A set of text input fields that will be rendered in a row. An example:

  <RowEntityCreator
    onAdd={this.onAdd}
    onEntityInput={this.onEntityInput}
    entity={this.entity}
  >
    <input
      placeholder="Item Name"
      className={'row-entity-creator__input'}
      displayClass="row-entity-creator__text-input row-entity-creator__input-container"
      type="text"
      name="name"
      value=""
    />
    <div className="row-entity-creator__vertical-divider" />
    <input
      placeholder="Quantity"
      className="row-entity-creator__input"
      displayClass="row-entity-creator__number-input row-entity-creator__input-container"
      type="text"
      pattern="[0-9]*"
      name="quantity"
      value=""
    />
  </RowEntityCreator>`

  The two input fields will be wrapped in <Validated> tags, and the vertical-divider div
  is used to add some visual delineation
*/

class RowEntityCreator extends React.Component {

  static get propTypes() {
    return {
      onAdd: PropTypes.func.isRequired,
      onEntityInput: PropTypes.func.isRequired,
      entity: PropTypes.instanceOf(Immutable.Map),
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
      ])
    };
  }

  constructor(props) {
    const validator = {};
    for (const child of props.children) { // eslint-disable-line no-restricted-syntax
      if (child.props.name) {
        validator[child.props.name] = child.props.validator;
      }
    }
    super(props);
    this.validator = SimpleInputsValidator(validator);
  }

  render() {
    const forceValidate = this.props.entity && this.props.entity.get('force_validate');

    let errors;
    if (forceValidate) {
      errors = this.validator.errors(Immutable.fromJS(this.props.entity));
    }

    return (
      <form
        onSubmit={(e) => {
          if (this.validator.isValid(Immutable.fromJS(this.props.entity))) {
            this.props.onAdd(e, true);
          } else {
            this.props.onAdd(e, false);
          }
        }}
        className={classNames('row-entity-creator', 'row-entity-creator__data-entry')}
      >
        {
          // Map over the children elements.
          // For those that are inputs, attach the necessary event handlers and validators
          React.Children.map(this.props.children, (child) => {
            // if a child is an input or textarea, attach the appropriate validator
            if (child.type === 'input' || child.type === 'textarea') {
              return (
                <Validated
                  force_validate={forceValidate}
                  error={errors && errors[child.props.name]}
                  className={child.props.displayClass}
                >
                  { React.cloneElement(child, {
                    value: (this.props.entity && this.props.entity.get(child.props.name)) ?
                      this.props.entity.get(child.props.name) :
                      '',
                    onChange: (e) => {
                      this.props.onEntityInput(
                        this.props.entity ?
                          this.props.entity.set(child.props.name, e.target.value) :
                          Immutable.Map({}).set(child.props.name, e.target.value)
                      );
                    }
                  }) }
                </Validated>
              );
            }
            return child;
          })
        }
        <button type="submit" className="row-entity-creator__icon"><i className="fa fa-plus" /></button>
      </form>
    );
  }
}

export default RowEntityCreator;
