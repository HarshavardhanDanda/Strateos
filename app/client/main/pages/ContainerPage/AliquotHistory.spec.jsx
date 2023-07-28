import React from 'react';
import Immutable from 'immutable';
import sinon from 'sinon';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';

import AliquotEffectStore from 'main/stores/AliquotEffectStore';
import InstructionStore from 'main/stores/InstructionStore';
import AliquotEffectAPI from 'main/api/AliquotEffectAPI';
import AliquotHistory from './AliquotHistory';

const aliquots = Immutable.fromJS([{
  container_id: 'ct1et8cdx6bnmwr',
  id: 'aq1et8cdx7t3j52',
  name: 'A1',
  type: 'aliquots',
  volume_ul: '131.0',
  well_idx: 0,
  created_at: '2014-09-11T16:17:20.462-07:00'
},
{
  container_id: 'ct1et8cdx6bnmwr',
  id: 'aq1et8cdx7t3x63',
  name: 'A2',
  type: 'aliquots',
  volume_ul: '100.0',
  well_idx: 1,
  created_at: '2014-09-11T16:17:20.462-07:00'
}
]);

let getByIds;

describe('Aliquot History', () => {
  let wrapper;
  const sandbox = sinon.createSandbox();

  beforeEach(() => {
    getByIds =  sandbox.stub(AliquotEffectStore, 'getByIds').returns(Immutable.List([]));
  });

  afterEach(() => {
    if (wrapper)wrapper.unmount();
    if (sandbox)sandbox.restore();
  });

  function getInstructionOp(op) {
    return Immutable.fromJS({
      operation: {
        op: op
      }
    });
  }

  function assertAliquotEffectMessage(eventType, message) {
    wrapper = shallow(<AliquotHistory id={'aq1euf24x7k9mp5'} aliquot={aliquots.get(0)} />);
    const component = wrapper.dive();
    component.setState({ loading: false });
    const event = component.childAt(0).find(eventType).at(0);
    const msg = event.shallow().dive().find('.body').childAt(0);
    expect(event.length).to.equal(1);
    expect(msg.text()).to.equal(message);
  }

  it('should show measure mass event with mass when measure_mass alliquot effect type is given', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'measured_mass',
        created_at: '2014-09-11T16:17:20.462-07:00',
        effect_data: { mass_mg: 20 }
      })
    ]);
    getByIds.returns(effects);
    assertAliquotEffectMessage('MeasuredMassEvent', 'Updated aliquot mass to 20 mg');
  });

  it('when there are no aliquot effects there should be one history event for aliquot creation', () => {
    getByIds.returns(Immutable.List([]));
    wrapper = shallow(<AliquotHistory id={'aq1euf24x7k9mp5'} aliquot={aliquots.get(0)} />);
    const component = wrapper.dive();
    component.setState({ loading: false });
    const historyEvent = component.childAt(0).find('HistoryEvent');
    expect(historyEvent.length).to.equal(1);
    expect(historyEvent.shallow().text()).to.contain('Created');
  });

  it('should show solid transfer out with mass for pipette instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'solid_transfer_out',
        effect_data: {
          mass_mg: 3.5
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('pipette'));
    assertAliquotEffectMessage('TransferOutEvent', 'Transferred 3.5 mg out');
  });

  it('should show solid transfer out with mass for dispense instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'solid_transfer_out',
        effect_data: {
          mass_mg: 10.0
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('dispense'));
    assertAliquotEffectMessage('TransferOutEvent', 'Transferred 10 mg out for dispense');
  });

  it('should show solid transfer in with mass for pipette instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'liquid_transfer_in',
        effect_data: {
          mass_mg: 5.5
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('pipette'));
    assertAliquotEffectMessage('TransferInEvent', 'Received 5.5 mg ');
  });

  it('should show solid transfer in with mass for provision instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'liquid_transfer_in',
        effect_data: {
          mass_mg: 5.5
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('provision'));
    assertAliquotEffectMessage('TransferInEvent', 'Provisioned 5.5 mg ');
  });

  it('should show solid transfer in with mass for pipette instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'solid_transfer_in',
        effect_data: {
          mass_mg: 20
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('pipette'));
    assertAliquotEffectMessage('TransferInEvent', 'Received 20 mg ');
  });

  it('should show solid transfer in with mass for dispense instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'solid_transfer_in',
        effect_data: {
          mass_mg: 20
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('dispense'));
    assertAliquotEffectMessage('TransferInEvent', 'Dispensed 20 mg ');
  });

  it('should show solid transfer in with mass for stamp instruction', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'solid_transfer_in',
        effect_data: {
          mass_mg: 20
        }
      })
    ]);
    getByIds.returns(effects);
    sandbox.stub(InstructionStore, 'getById').returns(getInstructionOp('stamp'));
    assertAliquotEffectMessage('TransferInEvent', 'Stamped 20 mg ');
  });

  it('should show manual adjustment with mass', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        affected_container_id: 'id-2',
        affected_well_idx: 2,
        created_at: '2014-09-11T16:17:20.462-07:00',
        updated_at: '2014-09-11T16:17:20.462-07:00',
        effect_type: 'manual_adjustment',
        effect_data: {
          adjusted_mass_mg: 10
        }
      })
    ]);
    getByIds.returns(effects);
    assertAliquotEffectMessage('ManualAdjustmentEvent', 'Manually adjusted mass to 10 mg');
  });

  it('should show manual adjustment with volume', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        affected_container_id: 'id-2',
        affected_well_idx: 2,
        created_at: '2014-09-11T16:17:20.462-07:00',
        updated_at: '2014-09-11T16:17:20.462-07:00',
        effect_type: 'manual_adjustment',
        effect_data: {
          adjusted_volume_ul: 10
        }
      })
    ]);
    getByIds.returns(effects);
    assertAliquotEffectMessage('ManualAdjustmentEvent', 'Manually adjusted volume to 10 µL');
  });

  it('should show sensed volume adjustment with volume', () => {
    const effects = Immutable.List([
      Immutable.fromJS({
        id: 'id-1',
        effect_type: 'liquid_sensing',
        effect_data: {
          calibrated_volume_ul: 2120.57504117311
        }
      })
    ]);
    getByIds.returns(effects);
    assertAliquotEffectMessage('LiquidSensingEvent', 'Sensed volume as 2120.58 µL');
  });

  it('should call AliquotEffectAPI both on componentDidMount() and componentDidUpdate() if the aliquot Id changes', () => {
    const aliquotEffectAPISpy = sandbox.spy(AliquotEffectAPI, 'index');
    wrapper = mount(<AliquotHistory id={'aq1euf24x7k9mp5'} aliquot={aliquots.get(0)} />);
    wrapper.setProps({ id: 'aq1et8cdx7t3x63', aliquot: aliquots.get(1) });

    expect(aliquotEffectAPISpy.calledTwice).to.be.true;
  });

  it('should call AliquotEffectAPI only on componentDidMount() if the aliquot Id does not change', () => {
    const aliquotEffectAPISpy = sandbox.spy(AliquotEffectAPI, 'index');
    wrapper = mount(<AliquotHistory id={'aq1euf24x7k9mp5'} aliquot={aliquots.get(0)} />);
    wrapper.setProps({ id: 'aq1euf24x7k9mp5', aliquot: aliquots.get(0) });

    expect(aliquotEffectAPISpy.calledOnce).to.be.true;
  });
});
