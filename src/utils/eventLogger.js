const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Comprehensive Event Logger for TSLogix System
 * Tracks all user actions, system events, and data changes
 */
class EventLogger {
  constructor() {
    this.prisma = prisma;
  }

  /**
   * Log a system event with comprehensive details
   * @param {Object} eventData - Event data object
   * @param {string} eventData.userId - ID of the user performing the action
   * @param {string} eventData.action - SystemAction enum value
   * @param {string} eventData.entityType - Type of entity affected (e.g., 'Client', 'EntryOrder')
   * @param {string} eventData.entityId - ID of the affected entity
   * @param {string} eventData.description - Human-readable description
   * @param {Object} eventData.oldValues - Previous state (for updates)
   * @param {Object} eventData.newValues - New state (for updates)
   * @param {Object} eventData.metadata - Additional context data
   * @param {string} eventData.ipAddress - User's IP address
   * @param {string} eventData.userAgent - User's browser/client info
   * @param {string} eventData.sessionId - Session identifier
   */
  async logEvent({
    userId,
    action,
    entityType,
    entityId,
    description,
    oldValues = null,
    newValues = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null
  }) {
    try {
      // Validate required fields
      if (!userId || !action || !entityType || !entityId || !description) {
        throw new Error("Missing required fields for event logging");
      }

      // Create the audit log entry
      const auditLog = await this.prisma.systemAuditLog.create({
        data: {
          user_id: userId,
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          description: description,
          old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: sessionId,
        },
      });

      return auditLog;
    } catch (error) {
      console.error("Error logging event:", error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(userId, action, ipAddress, userAgent, sessionId, additionalData = {}) {
    // Map invalid actions to valid SystemAction enum values
    const actionMap = {
      'PRODUCT_LIST_ACCESSED': 'REPORT_VIEWED',
      'PRODUCT_FORM_FIELDS_ACCESSED': 'REPORT_VIEWED',
      'USER_LOGIN': 'USER_LOGIN',
      'USER_LOGOUT': 'USER_LOGOUT',
      'USER_LOGIN_FAILED': 'USER_LOGIN_FAILED'
    };
    
    const validAction = actionMap[action] || 'REPORT_VIEWED';
    
    return await this.logEvent({
      userId: userId || 'SYSTEM',
      action: validAction,
      entityType: 'User',
      entityId: userId || 'UNKNOWN',
      description: this.getAuthDescription(validAction, additionalData),
      metadata: {
        ip_address: ipAddress,
        user_agent: userAgent,
        session_id: sessionId,
        ...additionalData
      }
    });
  }

  /**
   * Log CRUD operations with before/after states
   */
  async logCRUD(userId, action, entityType, entityId, oldData, newData, ipAddress, userAgent, sessionId) {
    const description = this.getCRUDDescription(action, entityType, entityId, oldData, newData);
    
    return await this.logEvent({
      userId,
      action,
      entityType,
      entityId,
      description,
      oldValues: oldData,
      newValues: newData,
      metadata: {
        operation_type: 'CRUD',
        entity_type: entityType,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log inventory operations
   */
  async logInventory(userId, action, inventoryId, productId, cellId, warehouseId, quantityChange, details, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: 'Inventory',
      entityId: inventoryId,
      description: `Inventory ${action.toLowerCase().replace('_', ' ')}: ${Math.abs(quantityChange)} units of product ${productId}`,
      newValues: {
        quantity_change: quantityChange,
        product_id: productId,
        cell_id: cellId,
        warehouse_id: warehouseId,
        ...details
      },
      metadata: {
        operation_type: 'INVENTORY',
        product_id: productId,
        cell_id: cellId,
        warehouse_id: warehouseId,
        quantity_change: quantityChange
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log order operations (Entry/Departure)
   */
  async logOrder(userId, action, orderType, orderId, orderNo, orderData, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: orderType,
      entityId: orderId,
      description: `${orderType} order ${action.toLowerCase().replace('_', ' ')}: ${orderNo}`,
      newValues: orderData,
      metadata: {
        operation_type: 'ORDER',
        order_type: orderType,
        order_no: orderNo,
        order_id: orderId
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log cell assignment operations
   */
  async logCellAssignment(userId, action, cellId, assignedTo, assignedToType, warehouseId, details, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: 'CellAssignment',
      entityId: cellId,
      description: `Cell ${cellId} ${action.toLowerCase().replace('_', ' ')} ${assignedToType === 'CLIENT' ? 'to client' : 'for inventory'} ${assignedTo}`,
      newValues: {
        cell_id: cellId,
        assigned_to: assignedTo,
        assigned_to_type: assignedToType,
        warehouse_id: warehouseId,
        ...details
      },
      metadata: {
        operation_type: 'CELL_ASSIGNMENT',
        cell_id: cellId,
        assigned_to: assignedTo,
        assigned_to_type: assignedToType,
        warehouse_id: warehouseId
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log quality control operations
   */
  async logQualityControl(userId, action, allocationId, fromStatus, toStatus, quantityMoved, reason, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: 'QualityControl',
      entityId: allocationId,
      description: `Quality status changed from ${fromStatus} to ${toStatus} for ${quantityMoved} units. Reason: ${reason}`,
      oldValues: { quality_status: fromStatus },
      newValues: { quality_status: toStatus, quantity_moved: quantityMoved },
      metadata: {
        operation_type: 'QUALITY_CONTROL',
        allocation_id: allocationId,
        from_status: fromStatus,
        to_status: toStatus,
        quantity_moved: quantityMoved,
        reason: reason
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log system errors and exceptions
   */
  async logError(userId, error, context, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId: userId || 'SYSTEM',
      action: 'ERROR_OCCURRED',
      entityType: 'System',
      entityId: 'ERROR',
      description: `Error occurred: ${error.message}`,
      metadata: {
        operation_type: 'ERROR',
        error_message: error.message,
        error_stack: error.stack,
        context: context,
        timestamp: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log file operations
   */
  async logFileOperation(userId, action, fileName, fileSize, fileType, entityType, entityId, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: 'File',
      entityId: fileName,
      description: `File ${action.toLowerCase().replace('_', ' ')}: ${fileName} (${fileSize} bytes)`,
      newValues: {
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        related_entity_type: entityType,
        related_entity_id: entityId
      },
      metadata: {
        operation_type: 'FILE',
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        related_entity_type: entityType,
        related_entity_id: entityId
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Log report generation and access
   */
  async logReport(userId, action, reportType, reportName, filters, ipAddress, userAgent, sessionId) {
    return await this.logEvent({
      userId,
      action,
      entityType: 'Report',
      entityId: reportName,
      description: `Report ${action.toLowerCase().replace('_', ' ')}: ${reportType} - ${reportName}`,
      newValues: {
        report_type: reportType,
        report_name: reportName,
        filters: filters
      },
      metadata: {
        operation_type: 'REPORT',
        report_type: reportType,
        report_name: reportName,
        filters: filters
      },
      ipAddress,
      userAgent,
      sessionId
    });
  }

  /**
   * Get events for a specific entity
   */
  async getEntityEvents(entityType, entityId, limit = 50) {
    try {
      return await this.prisma.systemAuditLog.findMany({
        where: {
          entity_type: entityType,
          entity_id: entityId
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          performed_at: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error("Error fetching entity events:", error);
      return [];
    }
  }

  /**
   * Get events for a specific user
   */
  async getUserEvents(userId, limit = 100) {
    try {
      return await this.prisma.systemAuditLog.findMany({
        where: {
          user_id: userId
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          performed_at: 'desc'
        },
        take: limit
      });
    } catch (error) {
      console.error("Error fetching user events:", error);
      return [];
    }
  }

  /**
   * Get system-wide events with filtering
   */
  async getSystemEvents(filters = {}, limit = 100, offset = 0) {
    try {
      const {
        userId,
        action,
        entityType,
        dateFrom,
        dateTo,
        ipAddress,
        search
      } = filters;

      const whereConditions = {};

      if (userId) whereConditions.user_id = userId;
      if (action) whereConditions.action = action;
      if (entityType) whereConditions.entity_type = entityType;
      if (ipAddress) whereConditions.ip_address = ipAddress;

      if (dateFrom || dateTo) {
        whereConditions.performed_at = {};
        if (dateFrom) whereConditions.performed_at.gte = new Date(dateFrom);
        if (dateTo) whereConditions.performed_at.lte = new Date(dateTo);
      }

      if (search) {
        whereConditions.OR = [
          { description: { contains: search, mode: 'insensitive' } },
          { entity_id: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { first_name: { contains: search, mode: 'insensitive' } } },
          { user: { last_name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [events, totalCount] = await Promise.all([
        this.prisma.systemAuditLog.findMany({
          where: whereConditions,
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            performed_at: 'desc'
          },
          take: limit,
          skip: offset
        }),
        this.prisma.systemAuditLog.count({
          where: whereConditions
        })
      ]);

      return {
        events,
        totalCount,
        hasMore: (offset + limit) < totalCount
      };
    } catch (error) {
      console.error("Error fetching system events:", error);
      return { events: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(dateFrom, dateTo) {
    try {
      const whereCondition = {};
      if (dateFrom || dateTo) {
        whereCondition.performed_at = {};
        if (dateFrom) whereCondition.performed_at.gte = new Date(dateFrom);
        if (dateTo) whereCondition.performed_at.lte = new Date(dateTo);
      }

      const [
        totalEvents,
        eventsByAction,
        eventsByUser,
        eventsByEntityType,
        recentEvents
      ] = await Promise.all([
        // Total events count
        this.prisma.systemAuditLog.count({ where: whereCondition }),
        
        // Events grouped by action
        this.prisma.systemAuditLog.groupBy({
          by: ['action'],
          where: whereCondition,
          _count: { action: true },
          orderBy: { _count: { action: 'desc' } },
          take: 10
        }),
        
        // Events grouped by user
        this.prisma.systemAuditLog.groupBy({
          by: ['user_id'],
          where: whereCondition,
          _count: { user_id: true },
          orderBy: { _count: { user_id: 'desc' } },
          take: 10
        }),
        
        // Events grouped by entity type
        this.prisma.systemAuditLog.groupBy({
          by: ['entity_type'],
          where: whereCondition,
          _count: { entity_type: true },
          orderBy: { _count: { entity_type: 'desc' } },
          take: 10
        }),
        
        // Recent events
        this.prisma.systemAuditLog.findMany({
          where: whereCondition,
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true
              }
            }
          },
          orderBy: { performed_at: 'desc' },
          take: 5
        })
      ]);

      return {
        totalEvents,
        eventsByAction,
        eventsByUser,
        eventsByEntityType,
        recentEvents
      };
    } catch (error) {
      console.error("Error fetching event statistics:", error);
      return null;
    }
  }

  // Helper methods for generating descriptions
  getAuthDescription(action, additionalData) {
    switch (action) {
      case 'USER_LOGIN':
        return `User logged in successfully${additionalData.email ? ` (${additionalData.email})` : ''}`;
      case 'USER_LOGOUT':
        return `User logged out${additionalData.email ? ` (${additionalData.email})` : ''}`;
      case 'USER_LOGIN_FAILED':
        return `Failed login attempt${additionalData.email ? ` for ${additionalData.email}` : ''}${additionalData.reason ? ` - ${additionalData.reason}` : ''}`;
      case 'USER_SESSION_EXPIRED':
        return `User session expired${additionalData.email ? ` (${additionalData.email})` : ''}`;
      default:
        return `Authentication event: ${action}`;
    }
  }

  getCRUDDescription(action, entityType, entityId, oldData, newData) {
    const actionMap = {
      'CREATED': 'created',
      'UPDATED': 'updated',
      'DELETED': 'deleted'
    };
    
    const actionWord = actionMap[action.split('_')[1]] || action.toLowerCase();
    
    if (action.includes('CREATED')) {
      return `${entityType} created with ID: ${entityId}`;
    } else if (action.includes('UPDATED')) {
      const changedFields = this.getChangedFields(oldData, newData);
      return `${entityType} ${entityId} updated. Changed fields: ${changedFields.join(', ')}`;
    } else if (action.includes('DELETED')) {
      return `${entityType} ${entityId} deleted`;
    }
    
    return `${entityType} ${actionWord}: ${entityId}`;
  }

  getChangedFields(oldData, newData) {
    if (!oldData || !newData) return ['N/A'];
    
    const changes = [];
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes.push(key);
      }
    }
    return changes.length > 0 ? changes : ['N/A'];
  }
}

// Create singleton instance
const eventLogger = new EventLogger();

module.exports = eventLogger; 