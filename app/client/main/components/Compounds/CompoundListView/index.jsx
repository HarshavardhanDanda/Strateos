import React               from 'react';
import PropTypes           from 'prop-types';
import Immutable           from 'immutable';
import CompoundView        from './CompoundView';
import './CompoundListView.scss';

function CompoundListView(props) {

  const { compounds, compoundClass, onCompoundClick } = props;

  const onRemove = (id) => {
    props.onRemove(compounds.map(cmp => cmp.get('id')).filter(cid => cid !== id));
  };

  return (
    <div className="compound-list">
      {
        compounds.map(compound =>
          (
            <CompoundView
              key={compound.get('id')}
              compoundClass={compoundClass}
              compound={compound}
              onRemove={props.onRemove ? onRemove : undefined}
              moleculeSize={props.moleculeSize}
              onCompoundClick={onCompoundClick}
            />
          )
        )
      }
      { props.children }
    </div>
  );
}

CompoundListView.defaultProps = {
  moleculeSize: 'small'
};

CompoundListView.propTypes = {
  /**
  *   List of compounds to be displayed
  */
  compounds: PropTypes.instanceOf(Immutable.List).isRequired,
  /**
   *  Called when a compound is removed with the remaining compounds afteer filter
   */
  onRemove: PropTypes.func,
  /**
   *  Class to set the dimensions of each compound
   */
  compoundClass: PropTypes.string,
  /**
   *  Size of molecule viewer, default small
   */
  moleculeSize: PropTypes.string,
  /**
   * Called when a compound is clicked
   */
  onCompoundClick: PropTypes.func
};

export default CompoundListView;
