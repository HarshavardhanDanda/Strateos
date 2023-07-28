import React      from 'react';
import Immutable  from 'immutable';
import _          from 'lodash';
import sinon      from 'sinon';
import { expect } from 'chai';

import AliquotAPI      from 'main/api/AliquotAPI';
import AliquotMetaData from 'main/pages/ContainerPage/AliquotMetadata';
import ajax            from 'main/util/ajax';
import { AliquotResourcesQueryEngine } from 'main/inventory/util/QueryEngines';
import FeatureConstants    from '@strateos/features';
import FeatureStore    from 'main/stores/FeatureStore';

describe('AliquotMetaData', () => {
  const sandbox = sinon.createSandbox();
  let wrapper;

  const aliquot = Immutable.Map({
    container_id: 'ct1et8cdx6bnmwr',
    id: 'aq1et8cdx7t3j52',
    name: 'A1',
    type: 'aliquots',
    volume_ul: '100.0',
    well_idx: 0,
    resource_id: 'rs16pc8krr6ag7',
    mass_mg: 10
  });

  const container = Immutable.Map({
    lab: {
      id: 'lb1fsv66rec7gg3'
    }
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    if (sandbox) sandbox.restore();
  });

  const saveAndExpectExpected = (Component, update, value, expected) => {
    Component.props().onSave(value);
    expect(update.args[0]).to.deep.equal([
      'foobar',
      expected
    ]);
  };

  it('should update volume with a number value', () => {
    // Define mock and stub functions.
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { },
      always: () => { }
    });

    // Shallow AliquotMetaData and get Volume
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    wrapper.setState({ editing: true });
    const Volume = wrapper.find({ name: 'Volume' });

    // Expect initial value and save a new value then expect it as number.
    expect(Volume.prop('value')).to.eq(50.0);
    saveAndExpectExpected(Volume, update, '40.0', { volume_ul: 40.0 });

    // reset history of the stub but not the behaviour!
    update.resetHistory();
    wrapper.setState({ editing: true });

    // Even if the save method return a number it should expect a number.
    saveAndExpectExpected(Volume, update, 30.0, { volume_ul: 30.0 });
  });

  it('aliquot should contain mass and update mass with a number value', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { },
      always: () => { }
    });
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', mass_mg: 50, volume_ul: 50.0, name: 'aq-1' })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    wrapper.setState({ editing: true });
    const mass = wrapper.find({ name: 'Aliquot Mass' });

    // Expect initial value and save a new value then expect it as number.
    expect(mass.prop('value')).to.eq(50);
    saveAndExpectExpected(mass, update, '40', { mass_mg: 40 });

    // reset history of the stub but not the behaviour!
    update.resetHistory();
    wrapper.setState({ editing: true });

    // Even if the save method return a number it should expect a number.
    saveAndExpectExpected(mass, update, 30, { mass_mg: 30 });
  });

  it('should have property and value header', () => {
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const headerCell = wrapper.find('Block').find('Header').find('Row').find('HeaderCell');
    const header = headerCell.find('div');
    expect(header.at(1).text()).to.eql('Property');
    expect(header.at(2).text()).to.eql('Value');
  });

  it('should have EditableProperty, SearchChoosingProperty', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('EditableProperty').length).to.eq(3);
    expect(wrapper.find('SearchChoosingProperty').length).eql(1);
  });

  it('should have aliquot resources query engine in SearchChoosingProperty', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('SearchChoosingProperty').props().engine).eql(AliquotResourcesQueryEngine);
  });

  it('should not have resource creation component in SearchChoosingProperty', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('SearchChoosingProperty').dive().find('ResourceQuickCreate')).to.have.length(0);
  });

  it('should make ajax call to the resources api', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    const ajaxSpy =   sandbox.stub(ajax, 'get').returns({
      done: (cb) => {
        return { data: cb(), fail: () => ({}) };
      },
      always: () => { }
    });
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const cb = sandbox.spy();
    const query = 'test-query';
    wrapper.find('SearchChoosingProperty').props().engine.query(query, cb);
    expect(ajaxSpy.calledOnce).to.be.true;
  });

  it('should have AddInplace component', () => {
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('AddInplace').length).to.eq(1);
  });

  it('should trigger onSetProperty method when adding a property with AddInplace component', () => {
    const spy = sandbox.stub(AliquotMetaData.prototype, 'onSetProperty');
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const addInPlace = wrapper.find('AddInplace');
    addInPlace.props().onAdd();
    expect(spy.calledOnce).to.be.true;
  });

  it('should trigger onSetResource method when adding a resource', () => {
    const spy = sandbox.stub(AliquotMetaData.prototype, 'onSetResource');
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const searchChoosingProperty = wrapper.find('SearchChoosingProperty');
    searchChoosingProperty.props().onSave();
    expect(spy.calledOnce).to.be.true;
  });

  it('should trigger AliquotApi.update method when editing a property with EditableProperty component', () => {
    const spy = sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { },
      always: () => { }
    });
    const data = { key: 'key', value: 'value' };
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={aliquot}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const aliquotMetadataInput = wrapper.find('EditableProperty').first();
    aliquotMetadataInput.props().onSave(data);
    expect(spy.calledOnce).to.be.true;
  });

  it('should not update volume if its value is more than maximum volume', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns(true);

    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1, well_volume_ul: '500.0' })}
        container={container}
      />
    );
    wrapper.setState({ editing: true });

    const Volume = wrapper.find({ name: 'Volume' });
    expect(Volume.prop('value')).to.eq(50.0);
    Volume.props().onSave('501.0');
    // Since its max volume is defined as 500 microliters, it should not update the volume for more than maximum volume
    // So it returns undefined and should not update the volume
    expect(update.args[0]).to.deep.equal(
      undefined
    );
  });

  it('should not update mass if its value is more than maximum mass', () => {
    sandbox.stub(AliquotMetaData.prototype, 'isAdmin').returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns(true);

    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', mass_mg: 50.0, volume_ul: 50.0, name: 'aq-1' })}
        containerType={Immutable.Map({ col_count: 1, well_volume_ul: '500.0' })}
        container={container}
      />
    );
    wrapper.setState({ editing: true });

    const mass = wrapper.find({ name: 'Aliquot Mass' });
    expect(mass.prop('value')).to.eq(50.0);
    mass.props().onSave('1001.0');
    // Since its max volume is defined as 500 microliters, it should not update the mass for more than twice maximum volume
    // max mass = 2 * max volume
    // So it returns undefined and should not update the mass
    expect(update.args[0]).to.deep.equal(
      undefined
    );
  });

  it('should display aliquot hazards', () => {
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, hazards: ['flammable', 'strong_acid'], name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );

    const hazardRow = wrapper.find('Block').find('Body').find('Row').at(6);
    const hazardInfo = hazardRow.find('div').children();

    expect(hazardInfo.at(0).text()).to.equal('Hazard');
    expect(hazardInfo.at(1).text()).to.equal('Flammable, strong acid');
  });

  it('aliquot mass can be updated by operator who has the lab permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn('lab')).returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { },
      always: () => { }
    });
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', mass_mg: 50, volume_ul: 50.0, name: 'aq-1' })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const mass = wrapper.find({ name: 'Aliquot Mass' });
    expect(mass.prop('value')).to.eq(50);
    saveAndExpectExpected(mass, update, '40', { mass_mg: 40 });
  });

  it('aliquot volume can be updated by operator who has the lab permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn('lab')).returns(true);
    const update = sandbox.stub(AliquotAPI, 'update').returns({
      done: () => { },
      always: () => { }
    });
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    const Volume = wrapper.find({ name: 'Volume' });

    expect(Volume.prop('value')).to.eq(50.0);
    saveAndExpectExpected(Volume, update, '40.0', { volume_ul: 40.0 });

  });

  it('Resource can only be edited by operator who has the lab permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn('lab')).returns(true);
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('SearchChoosingProperty').props().editable).to.be.true;
  });

  it('Resource cannot be edited by operator who does not have the lab permission', () => {
    sandbox.stub(FeatureStore, 'hasFeatureInLab').withArgs(FeatureConstants.MANAGE_CONTAINERS_IN_LAB, container.getIn('lab')).returns(false);
    wrapper = enzyme.shallow(
      <AliquotMetaData
        aliquot={Immutable.Map({ id: 'foobar', volume_ul: 50.0, name: 'aq-1', mass_mg: 10 })}
        containerType={Immutable.Map({ col_count: 1 })}
        container={container}
      />
    );
    expect(wrapper.find('SearchChoosingProperty').props().editable).to.be.false;
  });
});
