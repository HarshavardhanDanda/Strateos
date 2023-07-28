import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';
import mockConfigs from 'main/test/container/customPropertiesConfigs.json';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import ContextualCustomPropertyUtil from './ContextualCustomPropertyUtil';

const containerObj = {
  aliquot_count: 2,
  barcode: undefined,
  container_type_id: '96-pcr',
  id: 'ct1et8cdx6bnmwr',
  label: 'pcr test',
  organization_id: 'org13',
  status: 'consumable',
  storage_condition: 'cold_4',
  test_mode: true,
  type: 'containers',
  lab: { id: 'lb1', name: 'lab1' },
};

const container = Immutable.fromJS(containerObj);
const customPropertiesConfigs = Immutable.fromJS(mockConfigs);

describe('ContextualCustomPropertyUtil', () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  it('should not get error on getCustomPropertyConfigs if no containers are present', () => {
    const contextualPropertyConfigs = ContextualCustomPropertyUtil.getCustomPropertyConfigs(undefined);
    expect(contextualPropertyConfigs).to.be.undefined;
  });

  it('should call ContextualCustomStore with the context type passed', () => {
    const loadCustomConfigs = sandbox.spy(ContextualCustomPropertyConfigStore, 'loadCustomPropertiesConfig');

    ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Container');
    expect(loadCustomConfigs.calledWithExactly('org13', 'Container')).to.be.true;

    ContextualCustomPropertyUtil.getCustomPropertyConfigs(container, 'Aliquot');
    expect(loadCustomConfigs.calledWithExactly('org13', 'Aliquot')).to.be.true;
  });

  it('should show custom property table', () => {
    const showCustomPropertyTable = ContextualCustomPropertyUtil.showCPTable(customPropertiesConfigs);
    expect(showCustomPropertyTable).to.be.true;
  });

  it('should not show custom property table when custom configs is undefined', () => {
    const showCustomPropertyTable = ContextualCustomPropertyUtil.showCPTable(undefined);
    expect(showCustomPropertyTable).not.to.be.true;
  });
});
