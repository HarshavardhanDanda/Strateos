import React from 'react';

import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import TimeConstraintDetail from './TimeConstraintDetail';

describe('TimeConstraintDetail', () => {
  let wrapper;

  const run = {
    id: 'r1anxbcvxxy3qttjy',
    status: 'accepted',
    title: 'spin latest 2022-11-28',
    created_at: '2022-11-27T22:21:52.279-08:00',
    updated_at: '2022-11-30T00:28:00.777-08:00',
    completed_at: null,
    unrealized_input_containers: [],
    dependents: [],
    datasets: [],
    instructions: [
      {
        id: 'i1anxbcvyjnd6u39h',
        run_id: 'r1anxbcvxxy3qttjy',
        sequence_no: 0,
        operation: {
          acceleration: '2600:g',
          duration: '10:second',
          flow_direction: 'inward',
          object: 'ct19atpu4z5kf9',
          op: 'spin',
          spin_direction: [
            'cw'
          ]
        },
        completed_at: null,
        data_name: null,
        started_at: null,
        generates_execution_support_artifacts: false,
        is_human_by_default: false,
        completed_by_admin_id: null,
        completed_by_human: false,
        generated_containers: [],
        warps: [],
        refs: [
          {
            id: 454472,
            container_id: 'ct19atpu4z5kf9'
          }
        ]
      }
    ]
  };

  const timeConstraints = [
    {
      tc: {
        from: {
          ref_start: 'ct19atpu4z5kf9'
        },
        to: {
          instruction_start: 0
        },
        less_than: '2:hour'
      },
      result: 'From taken out of storage to the Start of #1 Spin inward for container is max 2 hours'
    },
    {
      tc: {
        from: {
          ref_start: 'ct19atpu4z5kf9'
        },
        to: {
          instruction_end: 0
        },
        more_than: '2:hour'
      },
      result: 'From taken out of storage to the End of #1 Spin inward for container is min 2 hours'
    },
    {
      tc:  {
        from: {
          instruction_start: 0
        },
        to: {
          ref_end: 'ct19atpu4z5kf9'
        },
        less_than: '2:hour'
      },
      result: 'From Start of #1 Spin inward to the destination/discarded for container is max 2 hours'
    },
    {
      tc: {
        from: {
          instruction_end: 0
        },
        to: {
          ref_end: 'ct19atpu4z5kf9'
        },
        less_than: '2:hour'
      },
      result: 'From End of #1 Spin inward to the destination/discarded for container is max 2 hours'
    },
    {
      tc: {
        from: {
          ref_start: 'ct19atpu4z5kf9'
        },
        to: {
          ref_end: 'ct19atpu4z5kf9'
        },
        less_than: '2:hour'
      },
      result: 'From taken out of storage to the destination/discarded for container is max 2 hours'
    }
  ];

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should render text correctly', () => {
    timeConstraints.forEach((timeConstraint) => {
      wrapper = shallow(
        <TimeConstraintDetail timeConstraints={[timeConstraint.tc]} run={Immutable.fromJS(run)} />
      );
      expect(wrapper.find('TextDescription').children().text()).equals(timeConstraint.result);
    });
  });

});
