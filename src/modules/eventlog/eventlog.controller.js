const eventLogService = require("./eventlog.service");

/**
 * Get system-wide event logs with filtering and pagination
 */
async function getSystemEventLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      ipAddress,
      search
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const filters = {
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      ipAddress,
      search
    };

    const result = await eventLogService.getSystemEventLogs(filters, parseInt(limit), offset);

    // Log this report access
    await req.logReport(
      'REPORT_VIEWED',
      'SYSTEM_EVENTS',
      'System Event Logs',
      filters
    );

    res.status(200).json({
      success: true,
      message: "System event logs fetched successfully",
      data: {
        events: result.events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.totalCount / parseInt(limit)),
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getSystemEventLogs controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getSystemEventLogs' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get event logs for a specific entity
 */
async function getEntityEventLogs(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;

    const events = await eventLogService.getEntityEventLogs(entityType, entityId, parseInt(limit));

    // Log this entity access
    await req.logEvent(
      'ENTITY_LOGS_VIEWED',
      entityType,
      entityId,
      `Viewed event logs for ${entityType} ${entityId}`,
      null,
      { logs_count: events.length },
      { operation_type: 'LOG_ACCESS' }
    );

    res.status(200).json({
      success: true,
      message: `Event logs for ${entityType} ${entityId} fetched successfully`,
      data: {
        entityType,
        entityId,
        events,
        totalCount: events.length
      }
    });
  } catch (error) {
    console.error("Error in getEntityEventLogs controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getEntityEventLogs' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get event logs for a specific user
 */
async function getUserEventLogs(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const events = await eventLogService.getUserEventLogs(userId, parseInt(limit));

    // Log this user activity access
    await req.logEvent(
      'USER_ACTIVITY_VIEWED',
      'User',
      userId,
      `Viewed activity logs for user ${userId}`,
      null,
      { logs_count: events.length },
      { operation_type: 'USER_LOG_ACCESS' }
    );

    res.status(200).json({
      success: true,
      message: `Event logs for user ${userId} fetched successfully`,
      data: {
        userId,
        events,
        totalCount: events.length
      }
    });
  } catch (error) {
    console.error("Error in getUserEventLogs controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getUserEventLogs' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get event log statistics and analytics
 */
async function getEventLogStatistics(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;

    const statistics = await eventLogService.getEventLogStatistics(dateFrom, dateTo);

    // Log this analytics access
    await req.logReport(
      'REPORT_VIEWED',
      'EVENT_ANALYTICS',
      'Event Log Statistics',
      { dateFrom, dateTo }
    );

    res.status(200).json({
      success: true,
      message: "Event log statistics fetched successfully",
      data: statistics
    });
  } catch (error) {
    console.error("Error in getEventLogStatistics controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getEventLogStatistics' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Export event logs to CSV/Excel
 */
async function exportEventLogs(req, res) {
  try {
    const {
      format = 'csv',
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      ipAddress,
      search
    } = req.query;

    const filters = {
      userId,
      action,
      entityType,
      dateFrom,
      dateTo,
      ipAddress,
      search
    };

    const exportData = await eventLogService.exportEventLogs(filters, format);

    // Log this export operation
    await req.logReport(
      'REPORT_EXPORTED',
      'SYSTEM_EVENTS',
      `Event Logs Export (${format.toUpperCase()})`,
      filters
    );

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `event_logs_${timestamp}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.status(200).send(exportData);
  } catch (error) {
    console.error("Error in exportEventLogs controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'exportEventLogs' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get available filter options for event logs
 */
async function getEventLogFilters(req, res) {
  try {
    const filters = await eventLogService.getEventLogFilters();

    res.status(200).json({
      success: true,
      message: "Event log filters fetched successfully",
      data: filters
    });
  } catch (error) {
    console.error("Error in getEventLogFilters controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getEventLogFilters' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get real-time event log dashboard data
 */
async function getEventLogDashboard(req, res) {
  try {
    const { timeRange = '24h' } = req.query;

    const dashboardData = await eventLogService.getEventLogDashboard(timeRange);

    // Log dashboard access
    await req.logEvent(
      'DASHBOARD_ACCESSED',
      'Dashboard',
      'EVENT_LOG_DASHBOARD',
      `Accessed event log dashboard with ${timeRange} time range`,
      null,
      { time_range: timeRange },
      { operation_type: 'DASHBOARD_ACCESS' }
    );

    res.status(200).json({
      success: true,
      message: "Event log dashboard data fetched successfully",
      data: dashboardData
    });
  } catch (error) {
    console.error("Error in getEventLogDashboard controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getEventLogDashboard' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Search event logs with advanced filters
 */
async function searchEventLogs(req, res) {
  try {
    const searchCriteria = req.body;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await eventLogService.searchEventLogs(searchCriteria, parseInt(limit), offset);

    // Log this search operation
    await req.logEvent(
      'SEARCH_PERFORMED',
      'EventLog',
      'ADVANCED_SEARCH',
      `Performed advanced search on event logs`,
      null,
      { search_criteria: searchCriteria, results_count: result.events.length },
      { operation_type: 'ADVANCED_SEARCH' }
    );

    res.status(200).json({
      success: true,
      message: "Event log search completed successfully",
      data: {
        events: result.events,
        searchCriteria,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.totalCount / parseInt(limit)),
          totalCount: result.totalCount,
          hasMore: result.hasMore,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in searchEventLogs controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'searchEventLogs' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/**
 * Get event log details by ID
 */
async function getEventLogById(req, res) {
  try {
    const { logId } = req.params;

    const eventLog = await eventLogService.getEventLogById(logId);

    if (!eventLog) {
      return res.status(404).json({
        success: false,
        message: "Event log not found"
      });
    }

    // Log this detailed view access
    await req.logEvent(
      'LOG_DETAIL_VIEWED',
      'EventLog',
      logId,
      `Viewed detailed event log ${logId}`,
      null,
      { log_action: eventLog.action, log_entity_type: eventLog.entity_type },
      { operation_type: 'LOG_DETAIL_ACCESS' }
    );

    res.status(200).json({
      success: true,
      message: "Event log details fetched successfully",
      data: eventLog
    });
  } catch (error) {
    console.error("Error in getEventLogById controller:", error);
    await req.logError(error, { controller: 'eventlog', action: 'getEventLogById' });
    
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
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