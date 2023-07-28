// import { ItemCheckbox } from '@transcriptic/amino';
// import classNames from 'classnames';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import { CompoundDetail } from 'main/components/Compounds/';

import 'main/components/PageWithSearchAndList/SearchResultsTable.scss';

class CompoundRow extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      hover: false,
      shouldShowDismissable: false
    };
  }

  close() {
    this.setState({ shouldShowDismissable: false });
  }

  // showCheckbox() {
  //   const { isSelected } = this.props;
  //   return this.state.hover || isSelected || this.state.shouldShowDismissable;
  // }

  render() {
    const { compound, /* isSelected, onSelected, */ onClick } = this.props;

    return (
      <div
        className="search-results-table__compound-row"
        onMouseOver={() => this.setState({ hover: true })}
        onMouseOut={() => this.setState({ hover: false })}
        onClick={c => onClick(c)}
      >
        {/* <div
          className={classNames({
            'search-results-table__row-checkbox--invisible': !this.showCheckbox(),
            'search-results-table__row-checkbox--visible': this.showCheckbox(),
            'search-results-table__row-checkbox--dropdown': this.state.shouldShowDismissable
          }, 'search-results-table__row-checkbox', 'search-results-table__checkbox')}
          ref={(node) => { this.targetNode = node; }}
        >
          <ItemCheckbox
            id={compound.get('id')}
            checkState={isSelected}
            onChange={() => onSelected(
              compound.get('id'),
              !isSelected
            )}
          />
        </div> */}
        <CompoundDetail
          showMolecule
          compound={compound}
        />
      </div>
    );
  }
}

CompoundRow.propTypes = {
  compound: PropTypes.instanceOf(Immutable.Map),
  // onSelected: PropTypes.func,
  // isSelected: PropTypes.bool,
  onClick: PropTypes.func
};

export default CompoundRow;
