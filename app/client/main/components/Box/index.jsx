import classNames from 'classnames';
import Immutable  from 'immutable';
import _          from 'lodash';
import PropTypes  from 'prop-types';
import React      from 'react';

import ContainerTypeHelper from 'main/helpers/ContainerType';
import * as ContainerUtil from 'main/util/ContainerUtil';

import { Popover }  from '@transcriptic/amino';

import './Box.scss';

class Box extends React.Component {

  static get propTypes() {
    return {
      numRows:              PropTypes.number.isRequired,
      numCols:              PropTypes.number.isRequired,
      posToContainer:       PropTypes.instanceOf(Immutable.Map).isRequired,
      selectedContainer:    PropTypes.instanceOf(Immutable.Map),
      disabledContainerIds: PropTypes.instanceOf(Immutable.Set),
      selectedPosition:     PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
      onPositionClick:      PropTypes.func
    };
  }

  static get defaultProps() {
    return {
      onPositionClick: (_container, _position) => {}, // NOOP
      disabledContainerIds: Immutable.Set()
    };
  }

  filterContainersByRow(row) {
    const containerType = new ContainerTypeHelper({
      col_count: this.props.numCols,
      row_count: this.props.numRows
    });

    return this.props.posToContainer.filter((container, pos) => {
      const humanWell = containerType.humanWell(pos);
      const coordinates = containerType.coordinatesFromHuman(humanWell);
      return row === coordinates[1];
    });
  }

  render() {
    return (
      <div className="box">
        <BoxColLabels size={this.props.numCols} />
        {_.range(this.props.numRows).map(row =>
          (
            <BoxRow
              key={row}
              size={this.props.numCols}
              row={row}
              selectedContainer={this.props.selectedContainer}
              selectedPosition={this.props.selectedPosition}
              disabledContainerIds={this.props.disabledContainerIds}
              onPositionClick={this.props.onPositionClick}
              posToContainer={this.filterContainersByRow(row)}
            />
          )
        )}
      </div>
    );
  }
}

class BoxColLabels extends React.Component {

  static get propTypes() {
    return {
      size: PropTypes.number.isRequired
    };
  }

  render() {
    return (
      <div className="boxcol-labels">
        <div className="boxcol-label" />
        {_.range(this.props.size).map(x => (
          <div className="boxcol-label" key={x}>
            {`C${x + 1}`}
          </div>
        ))}
      </div>
    );
  }
}

class BoxRow extends React.Component {

  static get propTypes() {
    return {
      size:                 PropTypes.number.isRequired,
      row:                  PropTypes.number.isRequired,
      posToContainer:       PropTypes.object.isRequired,
      disabledContainerIds: PropTypes.instanceOf(Immutable.Set),
      selectedContainer:    PropTypes.instanceOf(Immutable.Map),
      selectedPosition:     PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
      onPositionClick:      PropTypes.func
    };
  }

  render() {
    return (
      <div className="boxrow">
        <div className="boxrow-label">
          {`R${this.props.row + 1}`}
        </div>
        {_.range(this.props.size).map((x) => {
          const position = (this.props.row * this.props.size) + x;
          const container = this.props.posToContainer.get(position);

          return (
            <BoxPosition
              key={x}
              position={position}
              container={container}
              disabled={container && this.props.disabledContainerIds.contains(container.get('id'))}
              selectedContainer={this.props.selectedContainer}
              selectedPosition={this.props.selectedPosition}
              onPositionClick={this.props.onPositionClick}
            />
          );
        })}
      </div>
    );
  }
}

class BoxPosition extends React.Component {

  static get propTypes() {
    return {
      position:          PropTypes.number.isRequired,
      container:         PropTypes.instanceOf(Immutable.Map),
      disabled:          PropTypes.bool,
      selectedContainer: PropTypes.instanceOf(Immutable.Map),
      selectedPosition:  PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
      onPositionClick:   PropTypes.func
    };
  }

  onClick(e) {
    e.preventDefault();

    if (!this.props.disabled) {
      this.props.onPositionClick(this.props.container, this.props.position);
    }
  }

  popoverContent() {
    return (
      <div>
        <div>
          id: {this.props.container.get('id')}
        </div>
        <div>
          barcode: {this.props.container.get('barcode') || '-'}
        </div>
        <div>
          label: {this.props.container.get('label') || '-'}
        </div>
        <div>
          org: {this.props.container.getIn(['organization', 'name']) || '-'}
        </div>
      </div>
    );
  }

  popoverTitle() {
    return this.props.container.get('label') || 'NO LABEL';
  }

  isOccupied() {
    return this.props.container != undefined;
  }

  isStock() {
    return ContainerUtil.isStock(this.props.container);
  }

  isSelected() {
    if (_.isArray(this.props.selectedPosition)) {
      return (
        (this.props.container != undefined &&
          this.props.selectedContainer != undefined &&
          this.props.container.get('id') === this.props.selectedContainer.get('id')) ||
        this.props.selectedPosition.includes(this.props.position)
      );
    }

    return (
      (this.props.container != undefined &&
        this.props.selectedContainer != undefined &&
        this.props.container.get('id') === this.props.selectedContainer.get('id')) ||
      this.props.position === this.props.selectedPosition
    );
  }

  className() {
    return classNames({
      'box-position': true,
      stock: this.isStock(),
      selected: this.isSelected(),
      occupied: this.isOccupied(),
      empty: !this.isOccupied(),
      disabled: this.props.disabled
    });
  }

  render() {
    const component = (
      <div className={this.className()} onClick={e => this.onClick(e)}>
        {`${this.props.position + 1}`}
      </div>
    );
    if (this.isOccupied()) {
      return (
        <Popover
          title={this.popoverTitle()}
          content={this.popoverContent()}
          placement="top"
        >
          {component}
        </Popover>
      );
    } else {
      return component;
    }
  }
}

export default Box;
