import { Select, MultiSelect } from '@transcriptic/amino';
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import Immutable  from 'immutable';

import ContainerTypeActions from 'main/actions/ContainerTypeActions';
import ContainerTypeStore from 'main/stores/ContainerTypeStore';

interface Props {
  value: string | Array<string>;
  onChange: Function;
  isMultiSelect?: boolean;
  disabled?: boolean;
  isSearchEnabled?: boolean;
  sortBy?: Array<string>;
  placeholder?: string;
  isDisplayTypeOptions?: boolean;
  closeOnSelection?: boolean;
  includeRetiredContainerTypes?: boolean;
  wellCount?: number;
}

function ContainerTypeSelector(props: Props) {
  const [containerTypeOptions, setContainerTypeOptions] = useState([]);
  const getContainerTypes = () => {
    return props.includeRetiredContainerTypes ?
      ContainerTypeStore.getAll().toJS() :
      ContainerTypeStore.usableContainerTypes().toJS();
  };

  useEffect(() => {
    ContainerTypeActions.loadAll()
      .always(() => {
        const containerTypes = Immutable.fromJS(_.sortBy(getContainerTypes(), props.sortBy));
        const getContainerTypeOptions = (containerType) => ({
          name: containerType.get('name'),
          value: containerType.get('id'),
        });
        let containerTypeOptions;

        if (props.wellCount) {
          containerTypeOptions = ContainerTypeStore.getContainerTypesByWellCount(props.wellCount).map(getContainerTypeOptions);
        } else {
          containerTypeOptions = containerTypes.map(getContainerTypeOptions);
        }
        setContainerTypeOptions(props.isDisplayTypeOptions ? [
          {
            name: 'All Tubes',
            value: 'tubes'
          }, {
            name: 'All Plates',
            value: 'plates'
          },
          ...containerTypeOptions] :
          containerTypeOptions);
      });
  }, []);

  return props.isMultiSelect ?
    (
      <MultiSelect
        value={Array.isArray(props.value) && props.value}
        isSearchEnabled={props.isSearchEnabled}
        options={containerTypeOptions}
        disabled={props.disabled}
        onChange={(e) => {
          props.onChange(e);
        }}
        placeholder={props.placeholder}
        closeOnSelection={props.closeOnSelection}
      />
    )
    : (
      <Select
        value={!Array.isArray(props.value) && props.value}
        isSearchEnabled={props.isSearchEnabled}
        options={containerTypeOptions}
        disabled={props.disabled}
        onChange={(e) => {
          props.onChange(e);
        }}
        placeholder={props.placeholder}
      />
    );

}

ContainerTypeSelector.defaultProps = {
  isMultiSelect: false,
  isSearchEnabled: false,
  sortBy: ['name'],
  disabled: false,
  placeholder: 'Select Container Type',
  includeRetiredContainerTypes: false,
  isDisplayTypeOptions: false
};
export default ContainerTypeSelector;
