const Permissions = Object.freeze({
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',
  SERVICE_VIEW: 'service:view',
  REQUEST_CREATE: 'request:create',
  REQUEST_VIEW_OWN: 'request:view_own',
  REQUEST_VIEW_ALL: 'request:view_all',
  REQUEST_UPDATE_STATUS: 'request:update_status',
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_VIEW: 'document:view',
  DOCUMENT_VERIFY: 'document:verify',
  AGENT_VERIFY: 'agent:verify',
  AGENT_VIEW: 'agent:view',
  ADMIN_DASHBOARD: 'admin:dashboard',
});

module.exports = Permissions;
