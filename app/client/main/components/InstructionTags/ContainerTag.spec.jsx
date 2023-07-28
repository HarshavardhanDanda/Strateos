import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Icon } from '@transcriptic/amino';

import TimeConstraintDetail from 'main/components/InstructionCard/TimeConstraintDetail';
import { buildTimeConstraintsObject  } from 'main/util/TimeConstraintUtil';
import ContainerTag from './ContainerTag';

describe('ContainerTag', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();
  const refName1 = 'test_ref_1';
  const refName2 = 'test_ref_2';
  const refName3 = 'test_ref_3';
  const refName4 = 'test_ref_4';
  const refName5 = 'test_ref_5';
  const refName6 = 'test_ref_6';
  const refName7 = 'test_ref_7';
  const refName8 = 'test_ref_8';

  let run;

  afterEach(() => {
    if (wrapper) { wrapper.unmount(); }
    if (sandbox) { sandbox.restore(); }
  });

  before(() => {
    run = {
      refs: [
        Immutable.Map({
          name: refName1,
          container_type: 'ctype1'
        }),
        Immutable.Map({
          name: refName2,
          container_type: 'ctype2'
        }),
        Immutable.Map({
          name: refName3,
          container_type: 'ctype3'
        })
      ],
      time_constraints: [
        {
          from: {
            ref_start: refName1
          },
          less_than: '1:hour',
          to: {
            ref_end: refName2
          }
        },
        {
          from: {
            instuction_start: 1
          },
          less_than: '1:hour',
          to: {
            ref_end: refName3
          }
        },
        {
          from: {
            ref_start: refName3
          },
          less_than: '1:hour',
          to: {
            instruction_end: 0
          }
        },
        {
          from: {
            ref_start: refName4
          },
          to: {
            instruction_start: 3
          },
          less_than: '2:hour'
        },
        {
          from: {
            ref_start: refName5
          },
          to: {
            ref_end: refName5
          },
          less_than: '2:hour'
        },
        {
          from: {
            ref_start: refName6
          },
          to: {
            instruction_end: 6
          },
          less_than: '2:hour'
        },
        {
          from: {
            instruction_end: 7
          },
          to: {
            ref_end: refName7
          },
          less_than: '2:hour'
        },
        {
          from: {
            instruction_start: 8
          },
          to: {
            ref_end: refName8
          },
          more_than: '2:hour'
        }
      ],
      instructions: [
        {
          sequence_no: 0,
          operation: {
            object: refName1,
            op: 'dispense',
          },
        },
        {
          sequence_no: 1,
          operation: {
            object: refName2,
            op: 'dispense',
          },
        },
        {
          sequence_no: 2,
          operation: {
            object: refName3,
            op: 'dispense',
          },
        },
        {
          id: 'i1anxbcvyjnd6u39h',
          sequence_no: 3,
          operation: {
            acceleration: '2600:g',
            duration: '10:second',
            flow_direction: 'inward',
            object: refName4,
            op: 'spin',
            spin_direction: [
              'cw'
            ]
          }
        },
        {
          id: 'i1anxbcvyjnd345',
          sequence_no: 4,
          operation: {
            object: refName5,
            op: 'dispense',
          },
        },
        {
          id: 'i23anxbcvyjnd345',
          sequence_no: 5,
          operation: {
            object: refName5,
            op: 'dispense',
          },
        },
        {
          id: 'i245bcvyjnd345',
          sequence_no: 6,
          operation: {
            object: refName6,
            op: 'dispense',
          },
        },
        {
          id: 'i245bcvyjnd345',
          sequence_no: 7,
          operation: {
            object: refName7,
            op: 'spin',
            spin_direction: [
              'cw'
            ]
          },
        },
        {
          id: 'i785bcvyjnd345',
          sequence_no: 8,
          operation: {
            object: refName8,
            op: 'spin',
            spin_direction: [
              'cw'
            ]
          },
        }
      ]
    };
    buildTimeConstraintsObject(run.instructions, run.time_constraints);
  });

  it('should call the onnavigate container context method on click', () => {
    const navigateContainerSpy = sinon.stub();
    wrapper = shallow(<ContainerTag run={Immutable.Map({ refs: [Immutable.Map({ name: 'r1abc' })] })} refName={'4__ripk1 enzyme Tube'} />, {
      context: { onNavigateRef:  navigateContainerSpy },
      childContextTypes: { onNavigateRef: PropTypes.func }
    });
    expect(wrapper.find('BaseTag').dive().find('p').text()).to.equal('4__ripk1 enzyme Tube');
    wrapper.find('BaseTag').simulate('click', new Event('click'));

    expect(navigateContainerSpy.calledOnce).to.be.true;
    expect(navigateContainerSpy.calledWith('4__ripk1 enzyme Tube')).to.be.true;
  });

  it('should update container ref details when props are updated', () => {
    const navigateContainerSpy = sinon.stub();
    wrapper = shallow(<ContainerTag
      run={Immutable.Map({
        refs: [Immutable.Map({ name: 'r1abc', container_type: 'ctype1' })] })}
      refName="r1abc"
    />,
    {
      context: { onNavigateRef:  navigateContainerSpy },
      childContextTypes: { onNavigateRef: PropTypes.func }
    });
    expect(wrapper.find('BaseTag').dive().find('p').text()).to.equal('r1abc');
    expect(wrapper.find('Popover').props().content.props.children.props.containerRef).to.deep.equals({ name: 'r1abc', container_type: 'ctype1' });
    wrapper.setProps({ run: Immutable.Map({ refs: [Immutable.Map({ name: 'r2abc', container_type: 'ctype2' })] }), refName: 'r2abc' });
    expect(wrapper.find('BaseTag').dive().find('p').text()).to.equal('r2abc');
    expect(wrapper.find('Popover').props().content.props.children.props.containerRef).to.deep.equals({ name: 'r2abc', container_type: 'ctype2' });
  });

  it('should show hour-glass start icon if there is a time constraint having provided ref in "from" object', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={refName1}
      instructionSequenceNo={0}
      showTimeConstraint
    />);

    expect(wrapper.find(Icon).props().icon).to.equal('fa-regular fa-hourglass-start');
  });

  it('should show hour-glass end icon if there is a time constraint having provided ref in "to" object', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={refName2}
      instructionSequenceNo={1}
      showTimeConstraint
    />);

    expect(wrapper.find(Icon).props().icon).to.equal('fa-regular fa-hourglass-end');
  });

  it('should show hour-glass half icon if there are two time constraints having same ref, one in "from" object and other in "to" object or vice-versa', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={refName3}
      instructionSequenceNo={2}
      showTimeConstraint
    />);

    expect(wrapper.find(Icon).props().icon).to.equal('fa-regular fa-hourglass-half');
  });

  it('should not show time-constraint icon if showTimeConstraint prop is false', () => {

    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={refName1}
      instructionSequenceNo={0}
      showTimeConstraint={false}
    />);

    expect(wrapper.find(Icon)).to.have.length(0);
  });

  it('should not show time-constraint icon if there are no time-constraints for the instruction', () => {
    const differentSequenceNo = 5;
    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={refName1}
      instructionSequenceNo={differentSequenceNo}
      showTimeConstraint
    />);

    expect(wrapper.find(Icon)).to.have.length(0);
  });

  it('should not show time-constraint icon if there are no time-constraints for the container', () => {
    const differentRefName = 'r1def';
    wrapper = shallow(<ContainerTag
      run={Immutable.Map(run)}
      refName={differentRefName}
      instructionSequenceNo={5}
      showTimeConstraint
    />);

    expect(wrapper.find(Icon)).to.have.length(0);
  });

  it('should show time constraint detail correctly in case of ref_start -> ref_end', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName5}
      instructionSequenceNo={4}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    const expectedText = 'From taken out of storage to the destination/discarded for container is max 2 hours';

    const timeConstraintDetail = wrapper.find(TimeConstraintDetail).dive();
    const textDescription = timeConstraintDetail.find('TextDescription');
    expect(textDescription.children().text()).equals(expectedText);
  });

  it('should show time constraint detail correctly in case of ref_start -> instruction_start', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName4}
      instructionSequenceNo={3}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    const expectedText = 'From taken out of storage to the Start of #4 Spin inward for container is max 2 hours';

    const timeConstraintDetail = wrapper.find(TimeConstraintDetail).dive();
    const textDescription = timeConstraintDetail.find('TextDescription');
    expect(textDescription.children().text()).equals(expectedText);
  });

  it('should show time constraint detail correctly in case of ref_start -> instruction_end', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName6}
      instructionSequenceNo={6}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    const expectedText = 'From taken out of storage to the End of #7 Dispense for container is max 2 hours';

    const timeConstraintDetail = wrapper.find(TimeConstraintDetail).dive();
    const textDescription = timeConstraintDetail.find('TextDescription');
    expect(textDescription.children().text()).equals(expectedText);
  });

  it('should show time constraint detail correctly in case of instruction_start -> ref_end', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName8}
      instructionSequenceNo={8}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    const expectedText = 'From Start of #9 Spin inward to the destination/discarded for container is min 2 hours';

    const timeConstraintDetail = wrapper.find(TimeConstraintDetail).dive();
    const textDescription = timeConstraintDetail.find('TextDescription');
    expect(textDescription.children().text()).equals(expectedText);
  });

  it('should show time constraint detail correctly in case of instruction_end -> ref_end', () => {
    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName7}
      instructionSequenceNo={7}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    const expectedText = 'From End of #8 Spin inward to the destination/discarded for container is max 2 hours';

    const timeConstraintDetail = wrapper.find(TimeConstraintDetail).dive();
    const textDescription = timeConstraintDetail.find('TextDescription');
    expect(textDescription.children().text()).equals(expectedText);
  });

  it('should not show time-constraint detail if there is no time constraint for the container', () => {
    const refName = 'r1abc';

    wrapper = shallow(<ContainerTag
      run={Immutable.fromJS(run)}
      refName={refName}
      instructionSequenceNo={0}
      showTimeConstraint
      showTimeConstraintDetail
    />);

    expect(wrapper.find(TimeConstraintDetail).length).equal(0);
  });
});
