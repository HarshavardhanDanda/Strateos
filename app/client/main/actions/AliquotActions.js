/* eslint-disable camelcase */
import _ from 'lodash';
import Moment from 'moment';
import JSZip from 'jszip';

import Dispatcher from 'main/dispatcher';
import HTTPUtil from 'main/util/HTTPUtil';
import ajax from 'main/util/ajax';
import NotificationActions from 'main/actions/NotificationActions';
import Urls from 'main/util/urls';
import ContainerStore from 'main/stores/ContainerStore';
import AliquotAPI from 'main/api/AliquotAPI';
import AliquotStore from 'main/stores/AliquotStore';
import AliquotCompoundLinkStore from 'main/stores/AliquotCompoundLinkStore';
import CompoundStore from 'main/stores/CompoundStore';
import CSVUtil from 'main/util/CSVUtil';
import JsonAPIIngestor from 'main/api/JsonAPIIngestor';
import ContainerType from 'main/helpers/ContainerType';
import UserStore from 'main/stores/UserStore';
import ContextualCustomPropertyConfigStore from 'main/stores/ContextualCustomPropertyConfigStore';
import ZIPUtil from 'main/util/ZIPUtil';
import ContextualCustomPropertiesConfigActions from './ContextualCustomPropertiesConfigActions';

export const getMaxAliquotCount = (containers) => {
  return containers.reduce((max, container) => {
    let aliquotCount = container.get('aliquot_count');
    if (_.isNil(aliquotCount)) {
      aliquotCount = container.get('aliquots') ? container.get('aliquots').size : 0;
    }
    return aliquotCount > max ? aliquotCount : max;
  }, 0);
};

export const getUniqueOrgIdNameMappings = (containers) => {
  const orgIdNameMap = {};
  const orgIds = containers.reduce((orgIds, container) => {
    const orgId = container.get('organization_id');
    if (!orgIds.includes(orgId)) {
      orgIds.push(orgId);
      orgIdNameMap[orgId] = container.get('organization_name');
    }
    return orgIds;
  }, []);
  return { orgIds, orgIdNameMap };
};

export const loadContextualCustomPropertiesConfig = async (orgIds) => {
  const ccpcContainerHeadersByOrg = {};
  const ccpcAliquotHeadersByOrg = {};

  const containerCCPCsByOrg = {};
  const aliquotCCPCsByOrg = {};
  await Promise.all(
    orgIds.map((orgId) =>
      ContextualCustomPropertiesConfigActions.loadConfig(orgId, 'Container,Aliquot')
        .then(() => {
          const containerCCPCs = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(orgId, 'Container');
          const aliquotCCPCs = ContextualCustomPropertyConfigStore.loadCustomPropertiesConfig(orgId, 'Aliquot');

          containerCCPCsByOrg[orgId] = containerCCPCs ? containerCCPCs.toJS() : [];
          aliquotCCPCsByOrg[orgId] = aliquotCCPCs ? aliquotCCPCs.toJS() : [];
          ccpcContainerHeadersByOrg[orgId] = {};
          ccpcAliquotHeadersByOrg[orgId] = {};

          containerCCPCsByOrg[orgId].forEach((ct_ccpc_key) => {
            ccpcContainerHeadersByOrg[orgId][`ct_${ct_ccpc_key.key}`] = '';
          });

          aliquotCCPCsByOrg[orgId].forEach((aliquot_ccpc_key) => {
            ccpcAliquotHeadersByOrg[orgId][`aq_${aliquot_ccpc_key.key}`] = '';
          });
        })
        .fail((status) => NotificationActions.handleError('', status, 'CSV Download Failed'))
    )
  );
  return {
    ccpcContainerHeadersByOrg,
    ccpcAliquotHeadersByOrg,
    containerCCPCsByOrg,
    aliquotCCPCsByOrg
  };
};

const groupKeyValuePairsByOrg = (aliquots) => {
  const containerKeyValuePairsByOrg = {};
  const aliquotKeyValuePairsByOrg = {};

  aliquots.forEach((aliquot) => {
    const orgId = _.get(aliquot, ['container', 'organization_id'], undefined);
    if (!_.isUndefined(orgId) && _.isUndefined(containerKeyValuePairsByOrg[orgId])) {
      containerKeyValuePairsByOrg[orgId] = {};
    }
    _.keys(_.get(aliquot, ['container', 'properties'], {})).forEach((key) => {
      if (!(key in containerKeyValuePairsByOrg[orgId])) {
        containerKeyValuePairsByOrg[orgId][`ct_${key}`] = '';
      }
    });

    if (!_.isUndefined(orgId) && _.isUndefined(aliquotKeyValuePairsByOrg[orgId])) {
      aliquotKeyValuePairsByOrg[orgId] = {};
    }
    _.keys(_.get(aliquot, ['properties'], {})).forEach((key) => {
      if (!(key in aliquotKeyValuePairsByOrg[orgId])) {
        aliquotKeyValuePairsByOrg[orgId][`aq_${key}`] = '';
      }
    });
  });
  return { containerKeyValuePairsByOrg, aliquotKeyValuePairsByOrg };
};

export const getCompoundLinkIdsAndConcentrationMap = (aliquot) => {
  const compoundLinkConcentration = {};
  const compoundLinkIds = AliquotCompoundLinkStore.getByAliquotId(aliquot.id)
    .map((acl) => {
      const compoundLinkId = acl.get('compound_link_id');
      compoundLinkConcentration[compoundLinkId] = acl.get('concentration');
      return compoundLinkId;
    });
  return { compoundLinkIds, compoundLinkConcentration };
};

// containerProperties/aliquotProperties may contain ccpcs and key-value properties in order
export const initializeCSVFields = (aliquot, container, containerProperties = {}, aliquotProperties = {}) => {
  const well = aliquot.well_idx;
  const containerType = new ContainerType(container.container_type);
  return {
    aliquot_name: aliquot.name || 'none',
    container_label: container.label,
    container_id: container.id,
    container_type: container.container_type_id,
    aliquot_id: aliquot.id,
    well: well,
    human_well: containerType.humanWell(well),
    created_at: Moment(aliquot.created_at),
    volume_remaining: aliquot.volume_ul,
    concentration: '',
    compound_link_id: '',
    smiles: '',
    molecular_weight: '',
    reference_id: '',
    external_system_ids: '',
    ...containerProperties,
    ...aliquotProperties
  };
};

export const getCompoundCSVFields = (compoundLinkId, csvFields, compoundLinkConcentration) => {
  const compound = CompoundStore.getById(compoundLinkId);
  csvFields.concentration = compoundLinkConcentration[compoundLinkId];
  csvFields.compound_link_id = compoundLinkId;
  csvFields.smiles = compound.get('smiles');
  csvFields.molecular_weight = compound.get('molecular_weight');
  csvFields.reference_id = compound.get('reference_id');
  csvFields.external_system_ids = compound.getIn([
    'external_system_ids',
    0,
    'external_system_id',
  ]);
};

export const setCSVFields = (column, csvFields, container) => {
  const creator = UserStore.getById(container.created_by);
  switch (column) {
    case 'status':
      csvFields.status = container.status ? container.status : '';
      break;
    case 'contents':
      csvFields.contents = container.aliquot_count ?
        `${container.aliquot_count} aliquots` : '';
      break;
    case 'condition':
      csvFields.condition = container.storage_condition ?
        container.storage_condition : '';
      break;
    case 'barcode':
      csvFields.barcode = container.barcode ? container.barcode : '';
      break;
    case 'Last used':
      csvFields.last_used = container.updated_at ?
        Moment(container.updated_at) : '';
      break;
    case 'code':
      csvFields.shipment_code = container.shipment_code ?
        container.shipment_code : '';
      break;
    case 'organization':
      csvFields.organization_name = container.organization_name ?
        container.organization_name : '';
      break;
    case 'run':
      csvFields.generated_by_run_id = container.generated_by_run_id ?
        container.generated_by_run_id : '';
      break;
    case 'creator':
      csvFields.created_by = creator ?
        (creator.get('name') || creator.get('email') || '')
        : '';
      break;
    case 'lab':
      csvFields.lab = container.lab.name ? container.lab.name : '';
      break;
    case 'empty':
    case 'empty mass':
      csvFields.empty_mass_mg = container.empty_mass_mg ?
        container.empty_mass_mg : '';
      break;
    case 'location':
      csvFields.location = container.location_id ? container.location_id : '';
      break;
    case 'hazards':
      csvFields.hazards = container.hazards ? container.hazards : '';
      break;
    default:
      break;
  }
};

const AliquotActions = {
  update(container_id, well_idx, values) {
    return ajax.put(Urls.aliquot(container_id, well_idx), { aliquot: values })
      .done((aliquot) => {
        Dispatcher.dispatch({ type: 'ALIQUOT_DATA', aliquot });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  createAliquots(container_id, aliquots) {
    return ajax.post(`${Urls.container(container_id)}/create_aliquots`, {
      id: container_id,
      aliquots
    })
      .done(container => Dispatcher.dispatch({ type: 'ALIQUOT_LIST', aliquots: container.aliquots }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  setProperty(container_id, well_idx, { key, value }, replacingKey) {
    let deleteProperty = [];
    if (replacingKey && replacingKey !== key && value) {
      deleteProperty = replacingKey;
    }
    return ajax.put(Urls.aliquot(container_id, well_idx), {
      aliquot: {
        add_properties: [{ key, value }],
        delete_properties: deleteProperty
      }
    })
      .done(aliquot => Dispatcher.dispatch({ type: 'ALIQUOT_DATA', aliquot }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  removeProperty(container_id, well_idx, key) {
    return ajax.put(Urls.aliquot(container_id, well_idx), { aliquot: { delete_properties: [key] } })
      .done(aliquot => Dispatcher.dispatch({ type: 'ALIQUOT_DATA', aliquot }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  fetch_by_container(containerId, json_type, options) {
    const data = { json_type };
    return HTTPUtil.get(Urls.aliquots(containerId), { data, options })
      .done(aliquots => Dispatcher.dispatch({ type: 'ALIQUOT_LIST', aliquots }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  loadForContainer(containerId, options) {
    const data = { filter: { container_id: containerId } };
    return HTTPUtil.get('/api/aliquots', { data, options })
      .done(aliquots => JsonAPIIngestor.ingest(aliquots))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  updateWellIdx(well_idx, container_id, data) {
    return ajax.put(`/api/containers/${container_id}/aliquots/${well_idx}`, { aliquot: data })
      .done((aliquot) => {
        Dispatcher.dispatch({ type: 'ALIQUOT_UPDATED', aliquot });
      })
      .fail((...response) => NotificationActions.handleError(...response));
  },

  find_by_names(names, options) {
    const data = { names };

    return HTTPUtil.get(Urls.aliquots_find_by_name(), { data, options })
      .done(aliquots => Dispatcher.dispatch({ type: 'ALIQUOT_LIST', aliquots }))
      .fail((...response) => NotificationActions.handleError(...response));
  },

  destroyAliquotsByContainer(containerId) {
    return ajax.post(`${Urls.container(containerId)}/destroy_aliquots`)
      .done(() => Dispatcher.dispatch({ type: 'CONTAINER_ALIQUOTS_DELETED', containerId }))
      .fail(() => alert('Error overriding aliquots'));
  },

  async downloadCSV(containerIds, visibleColumns) {
    const containers = ContainerStore.getByIds(containerIds);

    const maxLimit = getMaxAliquotCount(containers);
    const { orgIds: uniqueOrgIds, orgIdNameMap } = getUniqueOrgIdNameMappings(containers);

    const {
      ccpcContainerHeadersByOrg,
      ccpcAliquotHeadersByOrg,
      containerCCPCsByOrg,
      aliquotCCPCsByOrg
    } = await loadContextualCustomPropertiesConfig(uniqueOrgIds);

    const includes = ['aliquots_compound_links,compounds,contextual_custom_properties,container.contextual_custom_properties'];

    AliquotAPI.getManyByContainerIds(containerIds, { limit: maxLimit, includes: includes }).then(() => {
      const aliquotsByContainer = containerIds.map((containerId) => {
        return AliquotStore.getByContainer(containerId).toJS();
      });

      const aliquots =  _.flattenDeep(aliquotsByContainer);

      const { containerKeyValuePairsByOrg, aliquotKeyValuePairsByOrg } = groupKeyValuePairsByOrg(aliquots);

      const csvAliquotsByOrg = aliquots.reduce((aliquotsByOrg, aliquot) => {
        const { compoundLinkIds, compoundLinkConcentration } = getCompoundLinkIdsAndConcentrationMap(aliquot);
        const container = ContainerStore.getById(aliquot.container_id).toJS();
        const containerOrgId = container.organization_id;
        const containerProperties = {
          ...ccpcContainerHeadersByOrg[containerOrgId],
          ...containerKeyValuePairsByOrg[containerOrgId],
        };
        const aliquotProperties = {
          ...ccpcAliquotHeadersByOrg[containerOrgId],
          ...aliquotKeyValuePairsByOrg[containerOrgId]
        };
        const csvFields = initializeCSVFields(aliquot, container, containerProperties, aliquotProperties);

        if (!(containerOrgId in aliquotsByOrg)) {
          aliquotsByOrg[containerOrgId] = [];
        }

        visibleColumns.forEach((column) => {
          setCSVFields(column, csvFields, container);
        });

        _.get(aliquot, ['container', 'contextual_custom_properties'], []).forEach((ccp) => {
          csvFields[`ct_${ccp.key}`] = this._getCCPValue(ccp, containerCCPCsByOrg[containerOrgId]);
        });

        _.entries(_.get(aliquot, ['container', 'properties'], {})).forEach(([key, value]) => {
          csvFields[`ct_${key}`] = value;
        });

        _.get(aliquot, ['contextual_custom_properties'], []).forEach((ccp) => {
          csvFields[`aq_${ccp.key}`] = this._getCCPValue(ccp, aliquotCCPCsByOrg[containerOrgId]);
        });

        _.entries(_.get(aliquot, ['properties'], {})).forEach(([key, value]) => {
          csvFields[`aq_${key}`] = value;
        });

        if (compoundLinkIds.size !== 0) {
          compoundLinkIds.forEach((compoundLinkId) => {
            getCompoundCSVFields(compoundLinkId, csvFields, compoundLinkConcentration);
          });
          aliquotsByOrg[containerOrgId].push(_.clone(csvFields));
        } else {
          aliquotsByOrg[containerOrgId].push(csvFields);
        }
        return aliquotsByOrg;
      }, {});

      if (_.isEmpty(csvAliquotsByOrg)) {
        NotificationActions.handleError('', '', 'Selected container(s) does not have any aliquots');
        return;
      }
      if (uniqueOrgIds.length === 1) {
        const orgName = this._getOrgNameForContainer(uniqueOrgIds[0], orgIdNameMap);
        CSVUtil.downloadCSVFromJSON(
          csvAliquotsByOrg[uniqueOrgIds[0]],
          `${orgName}_container_results`
        );
      } else {
        this._downloadZip(csvAliquotsByOrg, orgIdNameMap);
      }

    }).fail((status) => NotificationActions.handleError('', status, 'CSV Download Failed'));
  },

  _getOrgNameForContainer(orgId, orgIdNameMap) {
    return (orgId === 'null' || orgId === null) ? 'stock' : orgIdNameMap[orgId];
  },

  _downloadZip(csvAliquotsByOrg, orgIdNameMap) {
    const fileName = 'container_results';
    const zipFile = new JSZip();
    Object.keys(csvAliquotsByOrg).forEach((orgId) => {
      const csvHeaders = Object.keys(csvAliquotsByOrg[orgId][0]);
      const csvValues = csvAliquotsByOrg[orgId];
      const csvRows = [
        ...csvValues.map(
          csvRow => csvHeaders.map(
            csvHeader => (csvRow[csvHeader])
          ))
      ];
      const csvHeaderString = csvHeaders.join(',');
      const csvRowString = csvRows.map((csvRow) => csvRow.join(',')).join('\n');
      const csvString = csvHeaderString + '\n' + csvRowString;
      const orgName = this._getOrgNameForContainer(orgId, orgIdNameMap);

      zipFile.file(`${orgName}_container_results.csv`, csvString);
    });
    return ZIPUtil.downloadZip(zipFile, fileName);
  },

  _getCCPValue(ccp, ccpcConfigs) {
    const ccpc = ccpcConfigs.find((ccpc) => ccpc.key === ccp.key);
    const configType = _.get(ccpc, ['config_definition', 'type'], '');
    const options = _.get(ccpc, ['config_definition', 'options'], []);

    if (configType === 'choice') {
      const ccpOption = options.find((option) => option.value === ccp.value);
      return _.get(ccpOption, ['name'], '');
    } else if (configType === 'multi-choice') {
      const selectedOptionValues = ccp.value.split(';');
      const selectedOptionNames = options.reduce((selectedNames, option) => {
        if (selectedOptionValues.includes(option.value)) {
          selectedNames.push(option.name);
        }
        return selectedNames;
      }, []).join(';');
      return selectedOptionNames;
    } else {
      return ccp.value;
    }
  }
};

export default AliquotActions;
