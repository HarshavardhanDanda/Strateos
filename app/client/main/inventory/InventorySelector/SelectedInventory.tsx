import React from 'react';
import Immutable from 'immutable';
import Moment from 'moment';
import _ from 'lodash';
import { ZeroState, SearchField, Button, Divider, DataTable, HierarchyPath, TextBody, Icon } from '@transcriptic/amino';

import ContainerStore from 'main/stores/ContainerStore';

import './SelectedInventory.scss';

interface ISelectedInventoryProps {
  onClick: () => void;
  onSearch: (query: string) => void;
  onSelectionDeleted: (containerId: string) => void;
  containerSelectionMap: Immutable.Map<string, Immutable.List<number>>;
  wellSelectionMap: Immutable.Map<string, object>;
}

function SelectedInventory({ onClick, onSearch, onSelectionDeleted, containerSelectionMap, wellSelectionMap }: ISelectedInventoryProps) {
  const searchOnEnter = (e) => {
    if (e.key === 'Enter') {
      onSearch(e.target.value);
    }
  };

  const selectedContainers = (() => {
    let selectedContainers = Immutable.List();
    const containers = ContainerStore.getAll();
    const setSelectedContainers = (selection) => {
      containers.forEach(container => {
        const containerId = container.get('id');
        if (selection.has(containerId)) {
          selectedContainers = selectedContainers.push(container);
        }
      });
    };

    if (containerSelectionMap.size > 0) {
      setSelectedContainers(containerSelectionMap);
    } else if (wellSelectionMap.size > 0) {
      setSelectedContainers(wellSelectionMap);
    }

    return selectedContainers;
  })();

  const locationPath = (container) => {
    const ancestors = container.getIn(['location', 'ancestors']);
    const location = container.getIn(['location']) || [];
    const ancestorLocations = ancestors ? [...ancestors] : [];
    const locationPaths = ancestorLocations.concat(location);
    return locationPaths.map(locationPath => ({
      name: locationPath.get('name', '-'),
      id: locationPath.get('id')
    }));
  };

  const renderLocationAction = (container) => {
    const pathNames = locationPath(container);
    if (_.isEmpty(pathNames)) {
      return '-';
    }
    return (
      <HierarchyPath steps={pathNames} spacingPx={1} isTruncate />
    );
  };

  const renderType = (container) => {
    let icon;
    if (container.get('test_mode')) {
      icon = (
        <Icon
          icon="fas fa-flask test-icon"
          className="tx-type--warning"
          color="inherit"
        />
      );
    } else {
      const isTube = container.getIn(['container_type', 'is_tube']);
      icon = (
        <Icon
          icon={isTube ? 'aminol-tube' : 'aminol-plate'}
          className={'baby-icon'}
        />
      );
    }

    return (
      <div className="selected-inventory__container-type">
        {icon}
        <TextBody tag="span">
          {container.get('container_type_id')}
        </TextBody>
      </div>
    );
  };

  const removeContainerFromList = (containerId: string) => {
    onSelectionDeleted(containerId);
  };

  const renderRemoveRowAction = (container) => {
    return (
      <Button
        type="info"
        link
        onClick={() => removeContainerFromList(container.get('id'))}
        icon="fa fa-trash-alt"
      />
    );
  };

  const getTableData = (containers) => {
    const tableData = containers.map((container) => {
      return {
        '': renderRemoveRowAction(container),
        ID: container.get('id'),
        Barcode: container.get('barcode'),
        Name: container.get('label'),
        'Container type': renderType(container),
        Organization: container.get('organization_name', '-'),
        'Created at': Moment(container.get('created_at')).format('MMM D, YYYY'),
        Status: _.upperFirst(container.get('status')),
        Location: renderLocationAction(container)
      };
    });
    return tableData.toJS();
  };

  return (
    <div className="selected-inventory">
      <div className="selected-inventory__top-bar">
        <SearchField
          type="text"
          onKeyDown={searchOnEnter}
          placeholder="Search by ID, Name or Barcode"
          fullWidth={false}
          showBarcodeIcon
        />
        <Button
          type="success"
          size="medium"
          onClick={onClick}
        >
          Container inventory
        </Button>
      </div>
      <Divider isDark />
      { (containerSelectionMap && containerSelectionMap.size > 0) || (wellSelectionMap && wellSelectionMap.size > 0) ? (
        <>
          <span className="selected-inventory__text">Your selected containers will appear in the table below</span>
          <div className="selected-inventory__table">
            <DataTable
              headers={['', 'ID', 'Barcode', 'Name', 'Container type', 'Organization', 'Created at', 'Status', 'Location']}
              disableFormatHeader
              rowHeight={50}
              data={getTableData(selectedContainers)}
            />
          </div>
        </>
      ) : (
        <ZeroState
          title="You haven't selected any containers"
          subTitle="please start by scanning container or by selecting from inventory"
          zeroStateSvg={'/images/materials-illustration.svg'}
        />
      )}
    </div>
  );
}

export default SelectedInventory;
