import { AuditLog } from '../../../database/models/index.js';

export const auditService = {
  log({ actor, action, entityType, entityId, meta = {} }) {
    return AuditLog.create({ actor, action, entityType, entityId, details: meta });
  },
};

export default auditService;
