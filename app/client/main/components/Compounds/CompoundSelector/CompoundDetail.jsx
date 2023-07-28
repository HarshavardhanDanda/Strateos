import _         from 'lodash';
import PropTypes from 'prop-types';
import React     from 'react';
import { CompoundHeading } from 'main/components/Compounds';
import UserStore           from 'main/stores/UserStore';
import { MoleculeViewer } from '@transcriptic/amino';
import LibraryAPI from 'main/api/LibraryAPI';
import { CompoundInventory } from 'main/pages/CompoundsPage';
import AcsControls from 'main/util/AcsControls';
import FeatureConstants from '@strateos/features';
import SessionStore           from 'main/stores/SessionStore';
import './CompoundDetail.scss';

function CompoundDetail(props) {

  const { compound  } = props;
  const { created_by, smiles, id } = compound.toJS();

  const [libraries, setLibraries] = React.useState([]);
  const isPublicCompound = compound && !compound.get('organization_id');
  const canViewLibraries = AcsControls.isFeatureEnabled(FeatureConstants.VIEW_LIBRARIES) && (SessionStore.isRecordWithinCurrOrg(compound) || isPublicCompound);

  React.useEffect(() => {
    canViewLibraries && fetchLibraries();
  }, []);

  const fetchLibraries = () => {
    LibraryAPI.getLibraries({ compound_id: id })
      .done((response) => {
        const libraries = response.data.map((lib) => ({ id: lib.id, ...lib.attributes }));
        setLibraries(libraries);
      });
  };

  return (
    <div className="tx-stack tx-stack--xlg compound-detail">
      <CompoundHeading
        createdByUser={UserStore.getById(created_by)}
        compound={compound}
        libraries={libraries}
        canViewLibraries={canViewLibraries}
        onModal
      />
      <div className="tx-stack tx-stack--xlg compound-detail__body">
        <div className="compound-detail__body--compound">
          <MoleculeViewer
            SMILES={smiles}
            properties={compound.toJS()}
          />
        </div>
        <If condition={props.showInventory}>
          <div>
            <h3 className="tx-type--secondary">Associated Inventory</h3>
            <CompoundInventory id={id} onModal />
          </div>
        </If>
      </div>
    </div>
  );
}

CompoundDetail.defaultProps = {
  showInventory: true
};

CompoundDetail.propTypes = {
  compound: PropTypes.any.isRequired,
  onBack: PropTypes.func,
  showInventory: PropTypes.bool
};

export default CompoundDetail;
