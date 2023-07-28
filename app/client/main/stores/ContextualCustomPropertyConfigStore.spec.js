import { expect } from 'chai';
import sinon from 'sinon';
import Immutable from 'immutable';

import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import Dispatcher from 'main/dispatcher';
import properties from 'main/test/container/customPropertiesConfigs.json';

describe('ContextualCustomPropertiesStore', () => {
  const sandbox = sinon.createSandbox();

  const options = [
    { value: 'Technology Development', name: 'Technology Development' },
    { value: 'General Discovery', name: 'General Discovery' },
    { value: 'Mouse Phenotyping', name: 'Mouse Phenotyping' },
    { value: 'General Screening', name: 'General Screening' },
    { value: 'Other', name: 'Other' }
  ];

  const ccpcForRun = [{
    id: 'ccpc1gpcwaecddjpn',
    type: 'contextual_custom_properties_configs',
    context_type: 'Run',
    config_definition: {
      type: 'string',
      label: 'Nickname',
      default: '',
      validation_regexp: '',
      editable: true,
      unique: false
    },
    key: 'container_nickname',
    organization_id: 'org13'
  }];

  const ccpcForContainer = [{
    id: 'ccpc1gpcwaecddjpn',
    type: 'contextual_custom_properties_configs',
    context_type: 'Container',
    config_definition: {
      type: 'string',
      label: 'Nickname',
      default: '',
      validation_regexp: '',
      editable: true,
      unique: false
    },
    key: 'container_nickname',
    organization_id: 'org13'
  }];

  const cachedCcpc = {
    org13: {
      Container: [
        {
          id: 'ccpc1gbfaxdsutu6x',
          context_type: 'Container',
          organization_id: 'org13',
          key: 'ct_prop_1',
          label: 'Project id',
          config_definition: { type: 'string', label: 'Project id', editable: false },
          created_at: '2021-10-28T11:11:50.286-07:00',
          updated_at: '2021-10-28T11:11:50.286-07:00'
        },
        {
          id: 'ccpc1gbfaxdsutu80',
          context_type: 'Container',
          organization_id: 'org13',
          key: 'ct_prop_2',
          label: 'Mosaic Request Id',
          config_definition: { type: 'integer', label: 'Mosaic Request Id', editable: true },
          created_at: '2021-10-28T11:11:50.286-07:00',
          updated_at: '2021-10-28T11:11:50.286-07:00'
        },
        {
          id: 'ccpc1gbfdbfrc26q2',
          context_type: 'Container',
          organization_id: 'org13',
          key: 'ct_prop_3',
          label: 'Operation category',
          config_definition: {
            type: 'multi-choice',
            label: 'Operation category',
            editable: true,
            default: 'Other',
            options: options
          },
          created_at: '2021-10-28T11:44:13.555-07:00',
          updated_at: '2021-10-28T11:44:13.555-07:00'
        },
        {
          id: 'ccpc1gbfaxdsutu3x',
          context_type: 'Container',
          organization_id: 'org13',
          key: 'ct_prop_4',
          label: 'Budget Code',
          config_definition: {
            type: 'choice',
            label: 'Budget Code',
            default: '1001',
            editable: true,
            options: [{ name: '1001', value: '1001' }, { name: '1002', value: '1002' }]
          },
          created_at: '2021-10-28T11:11:50.286-07:00',
          updated_at: '2021-10-28T11:11:50.286-07:00'
        },
        {
          id: 'ccpcbooleantype',
          context_type: 'Container',
          organization_id: 'org13',
          key: 'ct_prop_5',
          label: 'Made Of PLastic',
          config_definition: {
            type: 'boolean',
            label: 'Made Of Plastic',
            default: '',
            editable: true
          },
          created_at: '2021-10-28T11:11:50.286-07:00',
          updated_at: '2021-10-28T11:11:50.286-07:00'
        }
      ]
    }
  };

  beforeEach(() => {
    ContextualCustomPropertyConfigStore._empty();
    ContextualCustomPropertyConfigStore.initialize(properties);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should format contextual custom properties', () => {
    const expectedFormattedPropteries = {
      ct_prop_1: { type: 'string', label: 'Project id', editable: false },
      ct_prop_2: { type: 'integer', label: 'Mosaic Request Id', editable: true },
      ct_prop_3: {
        type: 'multi-choice',
        label: 'Operation category',
        editable: true,
        default: 'Other',
        options: options,
      },
      ct_prop_4: {
        type: 'choice',
        label: 'Budget Code',
        default: '1001',
        editable: true,
        options: [{ name: '1001', value: '1001' }, { name: '1002', value: '1002' }]
      },
      ct_prop_5: {
        type: 'boolean',
        label: 'Made Of Plastic',
        default: '',
        editable: true
      }
    };

    const formattedPropteries = ContextualCustomPropertyConfigStore.formatContextualCustomPropertiesConfigResponse(properties);
    expect(formattedPropteries).deep.equal(expectedFormattedPropteries);
  });

  it('should cache ccpc when CONTEXTUAL_CUSTOM_PROPERTIES_CONFIGS_API_LIST action is dispatched', () => {
    Dispatcher.dispatch({ type: 'CONTEXTUAL_CUSTOM_PROPERTIES_CONFIGS_API_LIST', entities: properties });
    expect(ContextualCustomPropertyConfigStore._cachedCcpc.toJS()).deep.equal(cachedCcpc);
  });

  it('should cache ccpc', () => {
    ContextualCustomPropertyConfigStore.cacheCcpc();
    expect(ContextualCustomPropertyConfigStore._cachedCcpc.toJS()).deep.equal(cachedCcpc);
  });

  it('should format contextual custom properties config when context type is Run', () => {
    const expectedFormattedPropteries = {
      container_nickname: {
        type: 'string',
        label: 'Nickname',
        default: '',
        validation_regexp: '',
        editable: true,
        unique: false
      }
    };

    const spy = sandbox.spy(ContextualCustomPropertyConfigStore, 'formatContextualCustomPropertiesConfigResponse');
    Dispatcher.dispatch({ type: 'CONTEXTUAL_CUSTOM_PROPERTIES_CONFIGS_API_LIST', entities: ccpcForRun });
    const formattedPropteries = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig('org13', 'Run');
    expect(formattedPropteries).deep.equal(expectedFormattedPropteries);
    expect(spy.calledOnce).to.be.true;
  });

  it('should not format contextual custom properties config when context type is not Run', () => {
    const expectedFormattedPropteries = [
      {
        id: 'ccpc1gpcwaecddjpn',
        type: 'contextual_custom_properties_configs',
        context_type: 'Container',
        config_definition: {
          type: 'string',
          label: 'Nickname',
          default: '',
          validation_regexp: '',
          editable: true,
          unique: false
        },
        key: 'container_nickname',
        organization_id: 'org13'
      }
    ];

    ContextualCustomPropertyConfigStore._empty();
    const spy = sandbox.spy(ContextualCustomPropertyConfigStore, 'formatContextualCustomPropertiesConfigResponse');
    Dispatcher.dispatch({ type: 'CONTEXTUAL_CUSTOM_PROPERTIES_CONFIGS_API_LIST', entities: ccpcForContainer });
    const propteries = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig('org13', 'Container');
    expect(propteries.toJS()).deep.equal(expectedFormattedPropteries);
    expect(spy.called).to.be.false;
  });

  it('should load ccpc from cache on call loadCustomPropertiesConfig', () => {
    const ccpc = [{
      id: 'ccpc1gbfaxdsutu6x',
      context_type: 'Container',
      organization_id: 'org14',
      key: 'ct_prop_1',
      label: 'Project id',
      config_definition: { type: 'string', label: 'Project id', editable: false },
      created_at: '2021-10-28T11:11:50.286-07:00',
      updated_at: '2021-10-28T11:11:50.286-07:00'
    }];
    ContextualCustomPropertyConfigStore._cachedCcpc = Immutable.fromJS({ org14: { Container: ccpc } });
    const properties = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig('org14', 'Container');
    expect(properties.toJS()).deep.equal(ccpc);
  });

  it('should load ccpc from cache and format on call loadCustomPropertiesConfig with contextType Run', () => {
    const ccpc = [{
      id: 'ccpc1gbfaxdsutu6x',
      context_type: 'Run',
      organization_id: 'org14',
      key: 'ct_prop_1',
      label: 'Project id',
      config_definition: { type: 'string', label: 'Project id', editable: false },
      created_at: '2021-10-28T11:11:50.286-07:00',
      updated_at: '2021-10-28T11:11:50.286-07:00'
    }];
    const spy = sandbox.spy(ContextualCustomPropertyConfigStore, 'formatContextualCustomPropertiesConfigResponse');

    ContextualCustomPropertyConfigStore._cachedCcpc = Immutable.fromJS({ org14: { Run: ccpc } });
    ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig('org14', 'Run');
    expect(spy.calledOnce).to.be.true;
  });
});
