import React     from 'react';
import PropTypes from 'prop-types';

import {
  MoleculeViewer,
  Button,
  ButtonGroup
} from '@transcriptic/amino';

import './CompoundStructureSearch.scss';

class CompoundStructureSearch extends React.Component {

  constructor(props) {
    super(props);
    this.state = { SMILES: props.SMILES };
  }

  render() {
    const { onSearch, onCancel } = this.props;
    return (
      <div className="drawer-search tx-stack tx-stack--sm">
        <div className="drawer-search__actions">
          <ButtonGroup>
            <Button
              type="primary"
              link
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="small"
              onClick={() => onSearch(this.state.SMILES)}
            >
              Search
            </Button>
          </ButtonGroup>
        </div>
        <div className="drawer-search__editor">
          <MoleculeViewer
            editable
            SMILES={this.state.SMILES}
            onChange={value =>  this.setState({ SMILES: value })}
          />
        </div>
      </div>
    );
  }
}

CompoundStructureSearch.propTypes = {
  SMILES: PropTypes.string,
  onSearch: PropTypes.func,
  onCancel: PropTypes.func
};

export default CompoundStructureSearch;
