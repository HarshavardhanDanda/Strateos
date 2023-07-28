import React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { MultiSelect, Select } from '@transcriptic/amino';
import UserActions from 'main/actions/UserActions';
import AccessControlActions from 'main/actions/AccessControlActions';
import FeatureConstants from '@strateos/features';

interface Props {
  labIds: Array<string>;
  selectedIds: Array<string>;
  singleSelectId: string;
  currentUserId: string;
  includeCustomOptions: boolean;
  customOperatorOptions: Array<OptionObject>;
  isSingleSelect: boolean;
  isProfile: boolean;
  onMultiChange: (a: Array<OptionObject>) => void;
  onSingleChange: (a: string) => void;
}
interface State {
  operators: Array<OptionObject>;
}

// TODO: Remove once types are fully exported from Amino
interface OptionObject {
  name: string;
  value: string;
}

class OperatorsFilter extends React.Component<Props, State> {
  static customOperatorOptions(currentUserId: string, customOperatorOptions: Array<OptionObject>): Array<OptionObject> {
    return customOperatorOptions ||
     [
       { value: currentUserId, name: 'Assigned to Me' },
       { value: 'unassigned', name: 'Unassigned' },
       { value: 'all', name: 'All operators' },
     ];
  }

  static mapSelected(operators, selectedIds: Array<string>): Array<string> {
    return (operators as Array<OptionObject>).filter(o => selectedIds && selectedIds.includes(o.value)).map(o => o.value);
  }

  constructor(props) {
    super(props);
    this.state = {
      operators: [],
    };

    this.fetchOperators(props.labIds);
  }

  componentDidUpdate(prevProps: Props) {
    const { labIds } = this.props;

    if (!_.isEqual(labIds, prevProps.labIds)) {
      this.fetchOperators(labIds);
    }
  }

  fetchOperators = async (labIds: Array<string>) => {
    const { currentUserId, includeCustomOptions, customOperatorOptions } = this.props;
    const permissions = await AccessControlActions.loadPermissions({ featureCode: FeatureConstants.VIEW_RUNS_IN_LABS, contextIds: (labIds || []) });
    const permIds = dedupe(permissions.map(p => p.userId));
    const users = await UserActions.loadUsers(permIds);
    const processedUsers = _.sortBy(users, (u) => u.name)
      .map(u => ({
        name: u.name,
        value: u.id,
      }));

    // Final options include "Assigned to me", remove "me" from list of users so user doesn't show up twice
    const allOperators = includeCustomOptions ?
      OperatorsFilter.customOperatorOptions(currentUserId, customOperatorOptions).concat(processedUsers.filter(u => u.value !== currentUserId)) :
      processedUsers;

    // Testing async and state changes is rough, but now you can await on this method in your tests
    return new Promise<void>(res => {
      this.setState({
        operators: allOperators,
      }, res);
    });
  };

  render() {
    const { isSingleSelect, selectedIds, isProfile, singleSelectId } = this.props;
    const { operators } = this.state;
    const operatorOptions = OperatorsFilter.mapSelected(operators, selectedIds);
    const placeholder = `Select operator${isSingleSelect ? '' : 's'}`;
    return (
      !isSingleSelect ? (
        <MultiSelect
          value={operatorOptions}
          onChange={(e, values) => {
            this.props.onMultiChange(values);
          }}
          placeholder={placeholder}
          options={operators}
          isProfile={isProfile}
          closeOnSelection={isSingleSelect}
        />
      ) : (
        <Select
          onChange={(e) =>
            this.props.onSingleChange(e.target.value)
          }
          isProfile={isProfile}
          placeholder={placeholder}
          options={operators}
          value={singleSelectId}
        />
      )
    );
  }
}

function dedupe<T>(arr: Array<T>): Array<T> {
  return [...new Set(arr)];
}

export default observer(OperatorsFilter);
