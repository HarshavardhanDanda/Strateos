import React, { useState, useEffect }  from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

import { SearchField, Validated, Button } from '@transcriptic/amino';
import { Molecule as OCLMolecule } from 'openchemlib';

function CompoundsSimilaritySearch(props) {
  const {
    drawStructure,
    onSearchSimilarityChange,
    placeholder
  } = props;
  const [SMILES, setSMILES] = useState('');
  const [SMILESError, setSMILESError] = useState('');

  useEffect(() => {
    setSMILESError('');
    try {
      OCLMolecule.fromSmiles(SMILES);
      if (!_.isEmpty(SMILES)) onSearchSimilarityChange(SMILES);
    } catch (err) {
      setSMILESError('Invalid SMILES string');
    }
  }, [SMILES]);

  return (
    <div className="tx-stack tx-stack--xxs">
      <Validated force_validate error={SMILESError}>
        <SearchField
          reset={() => setSMILES('')}
          onChange={e => _.debounce(() => setSMILES(e.target.value), 1000)()}
          value={SMILES}
          placeholder={placeholder}
        />
      </Validated>
      <Button
        height="tall"
        type="primary"
        size="small"
        heavy
        link
        icon="fal fa-pencil"
        onClick={drawStructure}
      >Draw structure
      </Button>
    </div>

  );
}

CompoundsSimilaritySearch.defaultProps = {
  placeholder: 'SMILES String...'
};

CompoundsSimilaritySearch.propTypes = {
  drawStructure: PropTypes.func,
  onSearchSimilarityChange: PropTypes.func,
  placeholder: PropTypes.string
};

export default CompoundsSimilaritySearch;
