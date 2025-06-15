const eventLogger = require("../../utils/eventLogger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get system-wide event logs with filtering
 */
async function getSystemEventLogs(filters = {}, limit = 100, offset = 0) {
  try {
    return await eventLogger.getSystemEvents(filters, limit, offset);
  } catch (error) {
    console.error("Error in getSystemEventLogs service:", error);
    throw error;
  }
}

/**
 * Get event logs for a specific entity
 */
async function getEntityEventLogs(entityType, entityId, limit = 50) {
  try {
    return await eventLogger.getEntityEvents(entityType, entityId, limit);
  } catch (error) {
    console.error("Error in getEntityEventLogs service:", error);
    throw error;
  }
}

/**
 * Get event logs for a specific user
 */
async function getUserEventLogs(userId, limit = 100) {
  try {
    return await eventLogger.getUserEvents(userId, limit);
  } catch (error) {
    console.error("Error in getUserEventLogs service:", error);
    throw error;
  }
}

/**
 * Get event log statistics
 */
async function getEventLogStatistics(dateFrom, dateTo) {
  try {
    return await eventLogger.getEventStatistics(dateFrom, dateTo);
  } catch (error) {
    console.error("Error in getEventLogStatistics service:", error);
    throw error;
  }
}

/**
 * Export event logs to CSV or Excel format
 */
async function exportEventLogs(filters = {}, format = 'csv') {
  try {
    // Get all events matching the filters (no limit for export)
    const result = await eventLogger.getSystemEvents(filters, 10000, 0);
    const events = result.events;

    if (format === 'csv') {
      return generateCSV(events);
    } else if (format === 'excel') {
      return generateExcel(events);
    } else {
      throw new Error('Unsupported export format. Use "csv" or "excel".');
    }
  } catch (error) {
    console.error("Error in exportEventLogs service:", error);
    throw error;
  }
}

/**
 * Generate CSV format for event logs
 */
function generateCSV(events) {
  const headers = [
    'Timestamp',
    'User',
    'Action',
    'Entity Type',
    'Entity ID',
    'Description',
    'IP Address',
    'User Agent',
    'Session ID'
  ];

  const csvRows = [headers.join(',')];

  events.forEach(event => {
    const row = [
      event.performed_at,
      `"${event.user?.first_name || ''} ${event.user?.last_name || ''} (${event.user?.email || 'N/A'})"`,
      event.action,
      event.entity_type,
      event.entity_id,
      `"${event.description.replace(/"/g, '""')}"`, // Escape quotes
      event.ip_address || 'N/A',
      `"${(event.user_agent || 'N/A').replace(/"/g, '""')}"`,
      event.session_id || 'N/A'
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Generate Excel format for event logs (simplified - would need xlsx library for full Excel support)
 */
function generateExcel(events) {
  // For now, return CSV format with Excel-compatible headers
  // In production, you'd use a library like 'xlsx' to generate actual Excel files
  return generateCSV(events);
}

/**
 * Get available filter options for event logs
 */
async function getEventLogFilters() {
  try {
    const [actions, entityTypes, users] = await Promise.all([
      // Get distinct actions
      prisma.systemAuditLog.findMany({
        select: { action: true },
        distinct: ['action'],
        orderBy: { action: 'asc' }
      }),
      
      // Get distinct entity types
      prisma.systemAuditLog.findMany({
        select: { entity_type: true },
        distinct: ['entity_type'],
        orderBy: { entity_type: 'asc' }
      }),
      
      // Get users who have performed actions
      prisma.user.findMany({
        where: {
          systemAudits: {
            some: {}
          }
        },
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
        },
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ]
      })
    ]);

    return {
      actions: actions.map(a => a.action),
      entityTypes: entityTypes.map(e => e.entity_type),
      users: users.map(u => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email,
        role: u.role?.name
      }))
    };
  } catch (error) {
    console.error("Error in getEventLogFilters service:", error);
    throw error;
  }
}

/**
 * Get real-time dashboard data for event logs
 */
async function getEventLogDashboard(timeRange = '24h') {
  try {
    // Calculate date range
    const now = new Date();
    let dateFrom;
    
    switch (timeRange) {
      case '1h':
        dateFrom = new Date(now.getTime() - (1 * 60 * 60 * 1000));
        break;
      case '24h':
        dateFrom = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case '7d':
        dateFrom = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      default:
        dateFrom = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    }

    const [
      totalEvents,
      recentEvents,
      topActions,
      topUsers,
      topEntityTypes,
      hourlyActivity,
      errorEvents
    ] = await Promise.all([
      // Total events in time range
      prisma.systemAuditLog.count({
        where: {
          performed_at: { gte: dateFrom }
        }
      }),
      
      // Recent events
      prisma.systemAuditLog.findMany({
        where: {
          performed_at: { gte: dateFrom }
        },
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
        take: 10
      }),
      
      // Top actions
      prisma.systemAuditLog.groupBy({
        by: ['action'],
        where: {
          performed_at: { gte: dateFrom }
        },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      
      // Top users
      prisma.systemAuditLog.groupBy({
        by: ['user_id'],
        where: {
          performed_at: { gte: dateFrom }
        },
        _count: { user_id: true },
        orderBy: { _count: { user_id: 'desc' } },
        take: 10
      }),
      
      // Top entity types
      prisma.systemAuditLog.groupBy({
        by: ['entity_type'],
        where: {
          performed_at: { gte: dateFrom }
        },
        _count: { entity_type: true },
        orderBy: { _count: { entity_type: 'desc' } },
        take: 10
      }),
      
      // Hourly activity (for charts)
      getHourlyActivity(dateFrom, now),
      
      // Error events
      prisma.systemAuditLog.count({
        where: {
          performed_at: { gte: dateFrom },
          action: {
            in: ['ERROR_OCCURRED', 'EXCEPTION_HANDLED', 'SYSTEM_ERROR_LOGGED']
          }
        }
      })
    ]);

    // Get user details for top users
    const userIds = topUsers.map(u => u.user_id);
    const userDetails = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    });

    const topUsersWithDetails = topUsers.map(userStat => {
      const user = userDetails.find(u => u.id === userStat.user_id);
      return {
        userId: userStat.user_id,
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown',
        email: user?.email || 'N/A',
        eventCount: userStat._count.user_id
      };
    });

    return {
      summary: {
        totalEvents,
        errorEvents,
        timeRange,
        dateFrom,
        dateTo: now
      },
      recentEvents,
      topActions: topActions.map(a => ({
        action: a.action,
        count: a._count.action
      })),
      topUsers: topUsersWithDetails,
      topEntityTypes: topEntityTypes.map(e => ({
        entityType: e.entity_type,
        count: e._count.entity_type
      })),
      hourlyActivity
    };
  } catch (error) {
    console.error("Error in getEventLogDashboard service:", error);
    throw error;
  }
}

/**
 * Get hourly activity data for charts
 */
async function getHourlyActivity(dateFrom, dateTo) {
  try {
    // Generate hourly buckets
    const hours = [];
    const current = new Date(dateFrom);
    
    while (current <= dateTo) {
      hours.push(new Date(current));
      current.setHours(current.getHours() + 1);
    }

    // Get events grouped by hour
    const hourlyData = await Promise.all(
      hours.map(async (hour) => {
        const nextHour = new Date(hour.getTime() + (60 * 60 * 1000));
        const count = await prisma.systemAuditLog.count({
          where: {
            performed_at: {
              gte: hour,
              lt: nextHour
            }
          }
        });
        
        return {
          hour: hour.toISOString(),
          count
        };
      })
    );

    return hourlyData;
  } catch (error) {
    console.error("Error in getHourlyActivity:", error);
    return [];
  }
}

/**
 * Advanced search for event logs
 */
async function searchEventLogs(searchCriteria, limit = 100, offset = 0) {
  try {
    const {
      actions,
      entityTypes,
      userIds,
      dateFrom,
      dateTo,
      ipAddresses,
      searchText,
      hasOldValues,
      hasNewValues,
      hasMetadata
    } = searchCriteria;

    const whereConditions = {};

    // Multiple actions
    if (actions && actions.length > 0) {
      whereConditions.action = { in: actions };
    }

    // Multiple entity types
    if (entityTypes && entityTypes.length > 0) {
      whereConditions.entity_type = { in: entityTypes };
    }

    // Multiple users
    if (userIds && userIds.length > 0) {
      whereConditions.user_id = { in: userIds };
    }

    // Date range
    if (dateFrom || dateTo) {
      whereConditions.performed_at = {};
      if (dateFrom) whereConditions.performed_at.gte = new Date(dateFrom);
      if (dateTo) whereConditions.performed_at.lte = new Date(dateTo);
    }

    // Multiple IP addresses
    if (ipAddresses && ipAddresses.length > 0) {
      whereConditions.ip_address = { in: ipAddresses };
    }

    // Text search across multiple fields
    if (searchText) {
      whereConditions.OR = [
        { description: { contains: searchText, mode: 'insensitive' } },
        { entity_id: { contains: searchText, mode: 'insensitive' } },
        { user: { email: { contains: searchText, mode: 'insensitive' } } },
        { user: { first_name: { contains: searchText, mode: 'insensitive' } } },
        { user: { last_name: { contains: searchText, mode: 'insensitive' } } }
      ];
    }

    // Filter by presence of old/new values or metadata
    if (hasOldValues === true) {
      whereConditions.old_values = { not: null };
    } else if (hasOldValues === false) {
      whereConditions.old_values = null;
    }

    if (hasNewValues === true) {
      whereConditions.new_values = { not: null };
    } else if (hasNewValues === false) {
      whereConditions.new_values = null;
    }

    if (hasMetadata === true) {
      whereConditions.metadata = { not: null };
    } else if (hasMetadata === false) {
      whereConditions.metadata = null;
    }

    const [events, totalCount] = await Promise.all([
      prisma.systemAuditLog.findMany({
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
      prisma.systemAuditLog.count({
        where: whereConditions
      })
    ]);

    return {
      events,
      totalCount,
      hasMore: (offset + limit) < totalCount
    };
  } catch (error) {
    console.error("Error in searchEventLogs service:", error);
    throw error;
  }
}

/**
 * Get event log by ID
 */
async function getEventLogById(logId) {
  try {
    return await prisma.systemAuditLog.findUnique({
      where: { audit_id: logId },
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
      }
    });
  } catch (error) {
    console.error("Error in getEventLogById service:", error);
    throw error;
  }
}

module.exports = {
  getSystemEventLogs,
  getEntityEventLogs,
  getUserEventLogs,
  getEventLogStatistics,
  exportEventLogs,
  getEventLogFilters,
  getEventLogDashboard,
  searchEventLogs,
  getEventLogById
}; 