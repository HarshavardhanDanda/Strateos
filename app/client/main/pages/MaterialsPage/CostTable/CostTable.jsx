import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { TextInput, AddInplace, TableLayout, InplaceInput, InputsController, Select, Button } from '@transcriptic/amino';

import './CostTable.scss';

const UNIT_OPTIONS = [{ name: 'µL', value: 'µL' }, { name: 'mg', value: 'mg' }];
const DEFAULT_UNIT = UNIT_OPTIONS[0].value;

export default class CostTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: Immutable.List()
    };

    this.onSetProperty = this.onSetProperty.bind(this);
    this.addUniqueKey = this.addUniqueKey.bind(this);
  }

  componentDidMount() {
    this.setForm();
  }

  setForm() {
    const data = this.props.data.map(this.addUniqueKey);
    this.setState({
      data: data
    });
  }

  addUniqueKey(costItem, index = 0) {
    const timestamp = Date.now();
    const key = timestamp + index;
    return costItem.set('key', key);
  }

  updateData(newData) {
    this.setState({
      data: newData
    }, () => {
      this.props.onChange(
        newData.map(item => item.delete('key'))
      );
    });
  }

  onSetProperty(newRowData) {
    const unit = newRowData.unit || DEFAULT_UNIT;
    const cost = Immutable.fromJS({ ...newRowData, unit });
    const data = this.state.data.push(this.addUniqueKey(cost));
    this.updateData(data);
  }

  onCheckIn(id) {
    this.props.onCheckIn(id);
  }

  renderHeader() {
    return (
      <TableLayout.Header>
        <TableLayout.Row>
          <TableLayout.BodyCell className="col-sm-8">
            <div className="cost-table__main_div">
              <div className="cost-table__sub_div">AMOUNT</div>
              <div className="cost-table__sub_div">UNIT</div>
              <div className="cost-table__sub_div">COST</div>
              <div className="cost-table__sub_div">SKU</div>
            </div>
          </TableLayout.BodyCell>
          {this.props.displayCheckIn && (
            <TableLayout.BodyCell className="col-sm-2">
              <div className="cost-table__main_div">
                <div className="cost-table__sub_div">CHECKIN</div>
              </div>
            </TableLayout.BodyCell>
          )}
          {this.props.displayViewStock && this.props.isValidMaterial && (
            <TableLayout.BodyCell className="col-sm-2">
              <div className="cost-table__main_div">
                <div className="cost-table__sub_div">STOCK</div>
              </div>
            </TableLayout.BodyCell>
          )}
        </TableLayout.Row>
      </TableLayout.Header>
    );
  }

  renderRow(record, index) {
    const { editable } = this.props;
    return (
      <TableLayout.Row key={'cost-row-' + record.get('key')}>
        <TableLayout.BodyCell className="col-sm-8">
          <CostRow
            record={record}
            onChange={(rowValue) => {
              const data = this.state.data.set(index, rowValue);
              this.updateData(data);
            }}
            onDelete={() => {
              const data = this.state.data.delete(index);
              this.updateData(data);
            }}
            editable={editable}
            onViewStockButtonClick={this.props.onViewStockButtonClick}
          />
        </TableLayout.BodyCell>
        {this.props.displayCheckIn && (
        <TableLayout.BodyCell className="col-sm-2">
          <div>
            <Button
              type="primary"
              onClick={() => this.onCheckIn(this.state.data.getIn([index, 'omId']))}
              height="short"
              size="small"
              disabled={this.props.editable}
            >
              Checkin
            </Button>
          </div>
        </TableLayout.BodyCell>
        )}
        {this.props.displayViewStock && this.props.isValidMaterial && (
          <TableLayout.BodyCell className="col-sm-2">
            <div>
              <Button
                type="secondary"
                onClick={this.props.onViewStockButtonClick}
                height="short"
                size="small"
              >
                View Stock
              </Button>
            </div>
          </TableLayout.BodyCell>
        )}
      </TableLayout.Row>
    );
  }

  render() {
    const { data } = this.state;
    const { editable } = this.props;

    return (
      <TableLayout.Block>
        {this.renderHeader()}
        <TableLayout.Body>
          {data.map((record, index) => (
            this.renderRow(record, index)
          ))}
        </TableLayout.Body>
        <If condition={editable}>
          <TableLayout.Footer>
            <TableLayout.BodyCell>
              <AddInplace
                onAdd={this.onSetProperty}
                content={[
                  { id: 'amount', placeholder: 'Enter amount' },
                  { id: 'unit', placeholder: 'Select unit', type: 'select', options: UNIT_OPTIONS },
                  { id: 'cost', placeholder: 'Enter cost', maxDecimals: 2 },
                  { id: 'sku', placeholder: 'Enter SKU' }
                ]}
                addText={'Add cost item'}
              />
            </TableLayout.BodyCell>
            <If condition={this.props.displayViewStock}>
              <TableLayout.BodyCell />
            </If>
          </TableLayout.Footer>
        </If>
      </TableLayout.Block>
    );
  }

}

CostTable.defaultProps = {
  emptyMessage: 'No records.',
  editable: false
};

CostTable.propTypes = {
  /**
   * data is an iterable object that contains map with an 'id' key.
   */
  data: PropTypes.instanceOf(Immutable.Iterable),
  /**
   * empty message, we should use an amino component.
   */
  emptyMessage: PropTypes.string,
  /**
   * force rows to be editable, if false edit is disabled
   */
  editable: PropTypes.bool,
  /**
   * called when data is updated
   */
  onChange: PropTypes.func,
  displayViewStock: PropTypes.bool,
  /**
   * callback to open Kit Item Stock Modal
   */
  onViewStockButtonClick: PropTypes.func
};

class CostRow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formValues: Immutable.Map()
    };
  }

  componentDidMount() {
    this.setFormData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.record !== this.props.record) {
      this.setFormData();
    }
  }

  setFormData() {
    this.setState({ formValues: this.props.record });
  }

  render() {
    const { editable } = this.props;
    const { formValues } = this.state;

    return (
      <InputsController
        defaultState={this.state.formValues.toJS()}
        inputChangeCallback={(newValues) => {
          this.setState({
            formValues: Immutable.fromJS(newValues)
          });
        }}
      >
        <InplaceInput
          fullWidth
          onSave={() => {
            return Promise.resolve(
              this.props.onChange(this.state.formValues)
            );
          }}
          disabled={!editable}
          onCancel={() => {
            return Promise.resolve(
              this.setState({
                formValues: this.props.record
              })
            );
          }}
          onEdit={() => {
            return Promise.resolve(
              this.setState({
                formValues: this.props.record
              })
            );
          }}
          onDelete={() => {
            return Promise.resolve(
              this.props.onDelete()
            );
          }}
          content={[
            {
              id: 1,
              viewComponent: <p>{formValues.get('amount')}</p>,
              editComponent: <TextInput value={formValues.get('amount')} name="amount" type="number" min={0} />
            },
            {
              id: 2,
              viewComponent: <p>{formValues.get('unit')}</p>,
              editComponent: <Select options={UNIT_OPTIONS} value={formValues.get('unit')} name="unit" />
            },
            {
              id: 3,
              viewComponent: <p>{formValues.get('cost') ? '$' + formValues.get('cost') : ''}</p>,
              editComponent: <TextInput value={formValues.get('cost')} name="cost" type="number" maxDecimals={2} min={0} />
            },
            {
              id: 4,
              viewComponent: <p>{formValues.get('sku')}</p>,
              editComponent: <TextInput value={formValues.get('sku')} name="sku" />
            }
          ]}
        />
      </InputsController>
    );
  }
}

CostRow.propTypes = {
  record: PropTypes.instanceOf(Immutable.Map),
  editable: PropTypes.bool,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onViewStockButtonClick: PropTypes.func,
  displayCheckIn: PropTypes.bool,
  onCheckIn: PropTypes.func
};
