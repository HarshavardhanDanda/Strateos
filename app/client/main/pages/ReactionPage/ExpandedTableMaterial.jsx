import { Column, Table } from '@transcriptic/amino';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Urls from 'main/util/urls';

import './ExpandedTableMaterial.scss';

function ExpandedTableMaterial(props) {
  const supplier = (material) => {
    return material.getIn(['source', 'value', 'attributes', 'supplier']);
  };

  const compoundId = (material) => {
    const compoundId = material.getIn(['compound', 'linkId']);
    return (
      <a
        href={Urls.compound(compoundId)}
      >
        {compoundId}
      </a>
    );
  };

  const containerType = (material) => {
    return (
      <div className="container-type">
        <i className={classNames('baby-icon', 'aminol-tube')} />
        {material.getIn(['source', 'value', 'attributes', 'containerTypeId'])}
      </div>
    );
  };

  const containerName = (material) => {
    const containedId = material.getIn(['source', 'value', 'id']);
    return (
      <a
        href={Urls.container(containedId)}
      >
        {material.getIn(['source', 'value', 'attributes', 'label'])}
      </a>
    );
  };

  const eMoleculesName = (material) => {
    return material.getIn(['source', 'value', 'attributes', 'name']);
  };

  const eMoleculesSupplier = (material) => {
    return material.getIn(['source', 'value', 'attributes', 'supplier']);
  };

  const eMoleculesCost = (material) => {
    return material.getIn(['source', 'value', 'attributes', 'estimatedCost']);
  };

  const eMoleculesTier = (material) => {
    return material.getIn(['source', 'value', 'attributes', 'tier']);
  };

  const renderColumns = (source) => {
    let columns;
    switch (source) {
      case 'User Inventory':
        columns = [
          <Column
            renderCellContent={containerType}
            header="Container Type"
            id="expanded-table-user-inventory-container-type"
            key="expanded-table-user-inventory-container-type"
          />,
          <Column
            renderCellContent={containerName}
            header="Container Name"
            id="expanded-table-user-inventory-container-name"
            key="expanded-table-user-inventory-container-name"
          />,
          <Column
            renderCellContent={compoundId}
            header="Compound Id"
            id="expanded-table-user-inventory-compound-id"
            key="expanded-table-user-inventory-compound-id"
          />
        ];
        break;
      case 'eMolecules':
        columns = [
          <Column
            renderCellContent={eMoleculesName}
            header="Name"
            id="expanded-table-e-molecules-name"
            key="expanded-table-e-molecules-name"
          />,
          <Column
            renderCellContent={eMoleculesSupplier}
            header="Supplier"
            id="expanded-table-e-molecules-supplier"
            key="expanded-table-e-molecules-supplier"
          />,
          <Column
            renderCellContent={eMoleculesCost}
            header="Estimated Cost"
            id="expanded-table-e-molecules-cost"
            key="expanded-table-e-molecules-cost"
          />,
          <Column
            renderCellContent={eMoleculesTier}
            header="Tier"
            id="expanded-table-e-molecules-tier"
            key="expanded-table-e-molecules-tier"
          />
        ];
        break;
      default:
        columns = [
          <Column
            renderCellContent={supplier}
            header="Supplier"
            id="expanded-table-strateos-supplier"
            key="expanded-table-strateos-supplier"
          />,
          <Column
            renderCellContent={compoundId}
            header="Compound Id"
            id="expanded-table-strateos-compound-id"
            key="expanded-table-strateos-compound-id"
          />
        ];
    }
    return columns;
  };

  return (
    <Table
      id="expanded-table-material"
      data={Immutable.fromJS(props.material)}
      disabledSelection
      loaded
    >
      {renderColumns(props.source)}
    </Table>
  );
}

ExpandedTableMaterial.propTypes = {
  material: PropTypes.array.isRequired,
  source: PropTypes.string.isRequired
};

export default ExpandedTableMaterial;
