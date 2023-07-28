import AuditConfigStore from 'main/stores/AuditConfigStore';
import AuditConfigHistoryStore from 'main/stores/AuditConfigHistoryStore';
import SessionStore from 'main/stores/SessionStore';

export const auditTrailEnabledAtleastOnce = () => {
  const currOrgId = SessionStore.getOrg().get('id');
  const auditConfiguration = AuditConfigStore.getByOrganizationId(currOrgId).first();
  if (!auditConfiguration) {
    return false;
  }
  if (auditConfiguration && auditConfiguration.get('auditConfigState') === 'ENABLED') {
    return true;
  }

  const auditConfigurationHistory = AuditConfigHistoryStore.getByAuditConfigId(auditConfiguration.get('id')).toJS();

  for (let i = 0; i < auditConfigurationHistory.length; i++) {
    if (auditConfigurationHistory[i].oldState === 'ENABLED') {
      return true;
    }
  }
  return false;
};
