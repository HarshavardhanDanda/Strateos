import React               from 'react';
import PropTypes           from 'prop-types';
import { MoleculeViewer }  from '@transcriptic/amino';
import classNames          from 'classnames';

import './CompoundView.scss';

function CompoundView(props) {

  const { compound, onRemove, compoundClass, onCompoundClick } = props;

  const empty = () => {};

  const action = () => {
    return {
      icon: 'far fa-unlink',
      onRemove: () => onRemove(compound.get('id')),
      onClick: onCompoundClick ? () => onCompoundClick(compound.get('id')) : empty
    };
  };

  const actionWithoutRemove = () => {
    return {
      onClick: onCompoundClick ? () => onCompoundClick(compound.get('id')) : empty
    };
  };

  const properties = {};
  properties.formula = compound.get('formula');
  properties.molecular_weight = compound.get('molecular_weight');
  properties.clogp = compound.get('clogp');
  properties.tpsa = compound.get('tpsa');
  properties.exact_molecular_weight = compound.get('exact_molecular_weight');

  return (
    <div className={classNames(props.moleculeSize === 'small' ? 'compound' : '', compoundClass, { 'compound-view--clickable': onCompoundClick })}>
      <MoleculeViewer
        size={props.moleculeSize}
        SMILES={compound.get('smiles')}
        name={compound.get('name')}
        properties={properties}
        key={compound.get('id')}
        action={onRemove ?  action() : actionWithoutRemove()}
        showPropertiesOnStart={props.showPropertiesOnStart}
      />
    </div>
  );
}

CompoundView.defaultProps = {
  moleculeSize: 'small'
};

CompoundView.propTypes = {
  compound: PropTypes.object,
  onRemove: PropTypes.func,
  compoundClass: PropTypes.string,
  moleculeSize: PropTypes.string,
  onCompoundClick: PropTypes.func,
  showPropertiesOnStart: PropTypes.bool
};

export default CompoundView;
