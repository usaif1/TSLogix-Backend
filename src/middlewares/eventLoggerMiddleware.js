const eventLogger = require("../utils/eventLogger");

/**
 * Middleware to capture HTTP request details for event logging
 * Adds request context to req object for use in controllers/services
 */
function eventLoggerMiddleware(req, res, next) {
  // Extract request details
  const requestContext = {
    ipAddress: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    sessionId: req.sessionID || req.headers['x-session-id'] || `session-${Date.now()}`,
    method: req.method,
    url: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
    requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  // Add context to request object for use in controllers
  req.eventContext = requestContext;

  // Helper function to log events from controllers/services
  req.logEvent = async (action, entityType, entityId, description, oldValues = null, newValues = null, metadata = null) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logEvent({
      userId,
      action,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
      metadata: {
        ...metadata,
        request_id: requestContext.requestId,
        request_method: requestContext.method,
        request_url: requestContext.url
      },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      sessionId: requestContext.sessionId
    });
  };

  // Helper function for CRUD operations
  req.logCRUD = async (action, entityType, entityId, oldData = null, newData = null) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logCRUD(
      userId,
      action,
      entityType,
      entityId,
      oldData,
      newData,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for authentication events
  req.logAuth = async (action, additionalData = {}) => {
    const userId = req.user?.id || req.user?.user_id || additionalData.userId || 'SYSTEM';
    
    return await eventLogger.logAuth(
      userId,
      action,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId,
      {
        ...additionalData,
        request_method: requestContext.method,
        request_url: requestContext.url
      }
    );
  };

  // Helper function for inventory operations
  req.logInventory = async (action, inventoryId, productId, cellId, warehouseId, quantityChange, details = {}) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logInventory(
      userId,
      action,
      inventoryId,
      productId,
      cellId,
      warehouseId,
      quantityChange,
      details,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for order operations
  req.logOrder = async (action, orderType, orderId, orderNo, orderData = {}) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logOrder(
      userId,
      action,
      orderType,
      orderId,
      orderNo,
      orderData,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for cell assignment operations
  req.logCellAssignment = async (action, cellId, assignedTo, assignedToType, warehouseId, details = {}) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logCellAssignment(
      userId,
      action,
      cellId,
      assignedTo,
      assignedToType,
      warehouseId,
      details,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for quality control operations
  req.logQualityControl = async (action, allocationId, fromStatus, toStatus, quantityMoved, reason) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logQualityControl(
      userId,
      action,
      allocationId,
      fromStatus,
      toStatus,
      quantityMoved,
      reason,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for file operations
  req.logFileOperation = async (action, fileName, fileSize, fileType, entityType, entityId) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logFileOperation(
      userId,
      action,
      fileName,
      fileSize,
      fileType,
      entityType,
      entityId,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for report operations
  req.logReport = async (action, reportType, reportName, filters = {}) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logReport(
      userId,
      action,
      reportType,
      reportName,
      filters,
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Helper function for error logging
  req.logError = async (error, context = {}) => {
    const userId = req.user?.id || req.user?.user_id || 'SYSTEM';
    
    return await eventLogger.logError(
      userId,
      error,
      {
        ...context,
        request_method: requestContext.method,
        request_url: requestContext.url,
        request_id: requestContext.requestId
      },
      requestContext.ipAddress,
      requestContext.userAgent,
      requestContext.sessionId
    );
  };

  // Log API access (optional - can be enabled/disabled)
  if (process.env.LOG_API_ACCESS === 'true') {
    // Don't await this to avoid slowing down requests
    req.logEvent(
      'API_CALL_MADE',
      'API',
      requestContext.requestId,
      `API call: ${requestContext.method} ${requestContext.url}`,
      null,
      {
        method: requestContext.method,
        url: requestContext.url,
        user_agent: requestContext.userAgent,
        ip_address: requestContext.ipAddress
      },
      {
        request_type: 'API_ACCESS',
        endpoint: requestContext.url,
        method: requestContext.method
      }
    ).catch(err => {
      console.error('Error logging API access:', err);
    });
  }

  next();
}

/**
 * Error handling middleware that logs errors
 */
function errorLoggerMiddleware(err, req, res, next) {
  // Log the error using the request's logError helper
  if (req.logError) {
    req.logError(err, {
      endpoint: req.originalUrl || req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    }).catch(logErr => {
      console.error('Error logging error:', logErr);
    });
  }

  // Continue with normal error handling
  next(err);
}

/**
 * Response logging middleware to capture response details
 */
function responseLoggerMiddleware(req, res, next) {
  // Store original send function
  const originalSend = res.send;
  const originalJson = res.json;

  // Override send function to capture response
  res.send = function(data) {
    // Log successful responses if enabled
    if (process.env.LOG_API_RESPONSES === 'true' && res.statusCode < 400) {
      const responseSize = Buffer.byteLength(data || '', 'utf8');
      
      req.logEvent(
        'API_CALL_MADE',
        'API',
        req.eventContext?.requestId || 'unknown',
        `API response: ${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`,
        null,
        {
          status_code: res.statusCode,
          response_size: responseSize,
          response_time: Date.now() - (req.eventContext?.startTime || Date.now())
        },
        {
          request_type: 'API_RESPONSE',
          endpoint: req.originalUrl || req.url,
          method: req.method,
          status_code: res.statusCode
        }
      ).catch(err => {
        console.error('Error logging API response:', err);
      });
    }

    // Call original send
    return originalSend.call(this, data);
  };

  // Override json function to capture JSON responses
  res.json = function(data) {
    // Log successful JSON responses if enabled
    if (process.env.LOG_API_RESPONSES === 'true' && res.statusCode < 400) {
      const responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
      
      req.logEvent(
        'API_CALL_MADE',
        'API',
        req.eventContext?.requestId || 'unknown',
        `API JSON response: ${req.method} ${req.originalUrl || req.url} - ${res.statusCode}`,
        null,
        {
          status_code: res.statusCode,
          response_size: responseSize,
          response_time: Date.now() - (req.eventContext?.startTime || Date.now())
        },
        {
          request_type: 'API_JSON_RESPONSE',
          endpoint: req.originalUrl || req.url,
          method: req.method,
          status_code: res.statusCode
        }
      ).catch(err => {
        console.error('Error logging API JSON response:', err);
      });
    }

    // Call original json
    return originalJson.call(this, data);
  };

  // Add start time for response time calculation
  if (req.eventContext) {
    req.eventContext.startTime = Date.now();
  }

  next();
}

module.exports = {
  eventLoggerMiddleware,
  errorLoggerMiddleware,
  responseLoggerMiddleware
}; 