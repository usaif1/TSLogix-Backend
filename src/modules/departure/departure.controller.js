const departureService = require("./departure.service");

// Dropdown fields for Departure form
async function getDepartureFormFields(req, res) {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const data = await departureService.getDepartureFormFields(userRole, userId);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Exit options for Departure
async function getDepartureExitOptions(req, res) {
  try {
    const data = await departureService.getDepartureExitOptions();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Fetch all Departure Orders
async function getAllDepartureOrders(req, res) {
  try {
    const search = req.query.orderNo || "";
    const organisationId = req.query.organisationId || null;
    const status = req.query.status || null; // ✅ NEW: Filter by status
    
    // ✅ FIXED: The JWT token stores role as a string directly (from auth.service.js)
    const userRole = req.user?.role; // Role is stored directly as string in JWT
    const userOrgId = req.user?.organisation_id;
    
    const data = await departureService.getAllDepartureOrders(search, organisationId, userRole, userOrgId, status);
    return res.status(200).json({ 
      success: true,
      message: "Departure orders fetched successfully", 
      count: data.length,
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get products with available inventory grouped by entry order product
 */
async function getProductsWithInventory(req, res) {
  try {
    const { warehouseId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    const data = await departureService.getProductsWithInventory(warehouseId || null, userRole, userId);
    
    return res.status(200).json({ 
      success: true,
      message: userRole === "CLIENT" 
        ? "Products assigned to your client account with inventory fetched successfully"
        : "Products with inventory fetched successfully", 
      count: data.length,
      data,
      user_role: userRole,
      filtered_by_client_assignments: userRole === "CLIENT"
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get available cells for a specific entry order product
 */
async function getAvailableCellsForProduct(req, res) {
  try {
    const { entryOrderProductId } = req.params;
    const { warehouseId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!entryOrderProductId) {
      return res.status(400).json({
        success: false,
        message: "Entry Order Product ID is required",
      });
    }
    
    const data = await departureService.getAvailableCellsForProduct(
      entryOrderProductId,
      warehouseId || null,
      userRole,
      userId
    );
    
    return res.status(200).json({ 
      success: true,
      message: userRole === "CLIENT" 
        ? "Available inventory in your assigned cells fetched successfully"
        : "Available cells fetched successfully", 
      count: data.length,
      data,
      user_role: userRole,
      filtered_by_client_assignments: userRole === "CLIENT"
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// Validate selected cell
async function validateSelectedCell(req, res) {
  try {
    const { inventory_id, requested_qty, requested_weight } = req.body;
    
    if (!inventory_id || !requested_qty || !requested_weight) {
      return res.status(400).json({
        success: false,
        message: "inventory_id, requested_qty, and requested_weight are required",
      });
    }
    
    const data = await departureService.validateSelectedCell(
      inventory_id,
      parseInt(requested_qty),
      parseFloat(requested_weight)
    );
    
    return res.status(200).json({ 
      success: true,
      message: "Cell validation successful", 
      data 
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Validate multiple cell selections for bulk departure
 */
async function validateMultipleCells(req, res) {
  try {
    const { inventory_selections } = req.body;
    
    if (!inventory_selections || !Array.isArray(inventory_selections) || inventory_selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "inventory_selections array is required",
      });
    }
    
    const validations = [];
    for (const selection of inventory_selections) {
      try {
        const validation = await departureService.validateSelectedCell(
          selection.inventory_id,
          parseInt(selection.requested_qty), // ✅ FIXED: Use requested_qty not requested_quantity
          parseFloat(selection.requested_weight)
        );
        validations.push({ ...validation, valid: true });
      } catch (error) {
        validations.push({
          inventory_id: selection.inventory_id,
          valid: false,
          error: error.message,
        });
      }
    }
    
    const allValid = validations.every(v => v.valid);
    const totalQty = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_qty, 0);
    const totalWeight = validations.filter(v => v.valid).reduce((sum, v) => sum + v.requested_weight, 0);
    
    return res.status(200).json({ 
      success: true,
      message: allValid ? "All cell validations successful" : "Some validations failed",
      all_valid: allValid,
      total_qty: totalQty,
      total_weight: totalWeight,
      validations 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// ✅ ENHANCED: Create new Departure Order with Spanish tracking
async function createDepartureOrder(req, res) {
  try {
    const departureData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // ✅ SPANISH TRACKING: Inicio de creación de orden
    await req.logEvent(
      'CREACION_ORDEN_SALIDA_INICIADA',
      'OrdenDeSalida',
      'NUEVA_ORDEN_SALIDA',
      `Iniciando creación de nueva orden de salida para ${departureData.client_id ? 'cliente' : 'customer'}: ${departureData.client_id || departureData.customer_id}`,
      null,
      {
        cliente_id: departureData.client_id,
        customer_id: departureData.customer_id,
        almacen_id: departureData.warehouse_id,
        fecha_salida: departureData.departure_date_time,
        tipo_transporte: departureData.transport_type,
        destino: departureData.destination_point,
        creado_por: userId,
        rol_creador: userRole,
        timestamp_creacion: new Date().toISOString(),
        cantidad_productos: departureData.products ? departureData.products.length : 0,
        tiene_instrucciones_especiales: !!departureData.special_handling,
        tiene_requerimientos_temperatura: !!departureData.temperature_requirement,
        peso_total_estimado: departureData.total_weight,
        volumen_total_estimado: departureData.total_volume,
        // ✅ NUEVO: Seguimiento de flujo de aprobación
        tipo_workflow: 'REQUIERE_APROBACION',
        estado_inicial: 'PENDIENTE',
        campos_obligatorios_provistos: {
          numero_orden_salida: !!departureData.departure_order_no,
          numero_documento_despacho: !!departureData.dispatch_document_number,
          tipos_documento: !!departureData.document_type_ids,
          documentos_subidos: !!departureData.uploaded_documents,
          cantidad_pallets: !!departureData.total_pallets,
        }
      },
      { tipo_operacion: 'GESTION_ORDEN_SALIDA', tipo_accion: 'INICIO_CREACION' }
    );

    const result = await departureService.createDepartureOrder(departureData);

    // ✅ SPANISH TRACKING: Orden creada exitosamente
    await req.logEvent(
      'ORDEN_SALIDA_CREADA',
      'OrdenDeSalida',
      result.departure_order.departure_order_id,
      `Orden de salida ${result.departure_order.departure_order_no} creada exitosamente - pendiente de aprobación`,
      null,
      {
        orden_salida_id: result.departure_order.departure_order_id,
        numero_orden_salida: result.departure_order.departure_order_no,
        cliente_id: result.departure_order.client_id,
        customer_id: result.departure_order.customer_id,
        almacen_id: result.departure_order.warehouse_id,
        fecha_salida: result.departure_order.departure_date_time,
        tipo_transporte: result.departure_order.transport_type,
        destino: result.departure_order.destination_point,
        estado: result.departure_order.order_status,
        estado_revision: result.departure_order.review_status,
        estado_despacho: result.departure_order.dispatch_status,
        creado_por: userId,
        rol_creador: userRole,
        fecha_creacion: result.departure_order.registration_date,
        productos_definidos: result.departure_products ? result.departure_products.length : 0,
        peso_total: result.departure_order.total_weight,
        volumen_total: result.departure_order.total_volume,
        total_pallets: result.departure_order.total_pallets,
        // ✅ NUEVO: Seguimiento de workflow y campos obligatorios
        estado_workflow: result.departure_order.workflow_status,
        campos_obligatorios_capturados: result.departure_order.mandatory_fields_captured,
        proximos_pasos: result.next_steps,
        workflow_aprobacion: result.approval_workflow,
        impacto_negocio: 'ORDEN_SALIDA_PENDIENTE_APROBACION'
      },
      { 
        tipo_operacion: 'GESTION_ORDEN_SALIDA', 
        tipo_accion: 'CREACION_EXITOSA',
        impacto_negocio: 'ORDEN_SALIDA_ESPERANDO_APROBACION',
        proximos_pasos: 'REQUIERE_APROBACION_ENCARGADO_ALMACEN_O_ADMIN'
      }
    );

    // ✅ SPANISH TRACKING: Productos registrados en orden
    if (result.departure_products && result.departure_products.length > 0) {
      await req.logEvent(
        'PRODUCTOS_REGISTRADOS_ORDEN',
        'ProductosOrdenSalida',
        result.departure_order.departure_order_id,
        `${result.departure_products.length} productos registrados en orden de salida`,
        null,
        {
          orden_salida_id: result.departure_order.departure_order_id,
          numero_orden: result.departure_order.departure_order_no,
          productos_registrados: result.departure_products.map(product => ({
            producto_id: product.product_id,
            codigo_producto: product.product?.product_code,
            nombre_producto: product.product?.name,
            cantidad_solicitada: product.requested_quantity,
            peso_solicitado: product.requested_weight,
            tipo_empaque: product.packaging_type,
            numero_lote: product.lot_number,
            orden_entrada_numero: product.entry_order_number
          })),
          resumen_productos: {
            total_productos: result.departure_products.length,
            cantidad_total_solicitada: result.departure_products.reduce((sum, p) => sum + p.requested_quantity, 0),
            peso_total_solicitado: result.departure_products.reduce((sum, p) => sum + parseFloat(p.requested_weight || 0), 0)
          }
        },
        { 
          tipo_operacion: 'GESTION_PRODUCTOS_ORDEN', 
          tipo_accion: 'PRODUCTOS_REGISTRADOS',
          impacto_negocio: 'PRODUCTOS_ASOCIADOS_ORDEN'
        }
      );
    }

    // ✅ SPANISH TRACKING: Documentación de orden
    await req.logEvent(
      'DOCUMENTACION_ORDEN_REGISTRADA',
      'DocumentacionOrden',
      result.departure_order.departure_order_id,
      `Documentación y datos obligatorios registrados para orden de salida`,
      null,
      {
        orden_salida_id: result.departure_order.departure_order_id,
        numero_orden: result.departure_order.departure_order_no,
        documentacion: {
          numero_documento_despacho: departureData.dispatch_document_number,
          tipos_documento_seleccionados: departureData.document_type_ids,
          documentos_adjuntos: !!departureData.uploaded_documents,
          observaciones: departureData.observation
        },
        datos_transporte: {
          tipo_transporte: departureData.transport_type,
          transportista: departureData.carrier_name,
          punto_destino: departureData.destination_point
        },
        datos_empaque: {
          total_pallets: departureData.total_pallets,
          peso_estimado: departureData.total_weight,
          volumen_estimado: departureData.total_volume
        }
      },
      { 
        tipo_operacion: 'DOCUMENTACION_ORDEN', 
        tipo_accion: 'DOCUMENTACION_CAPTURADA',
        impacto_negocio: 'DOCUMENTACION_COMPLETA'
      }
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error creating departure order:", error);
    
    // ✅ SPANISH TRACKING: Error en creación de orden
    await req.logEvent(
      'ERROR_CREACION_ORDEN_SALIDA',
      'OrdenDeSalida',
      'ERROR_CREACION',
      `Error durante creación de orden de salida: ${error.message}`,
      null,
      {
        datos_orden: {
          cliente_id: req.body.client_id,
          customer_id: req.body.customer_id,
          almacen_id: req.body.warehouse_id,
          fecha_salida: req.body.departure_date_time,
          tipo_transporte: req.body.transport_type,
          destino: req.body.destination_point,
          cantidad_productos: req.body.products ? req.body.products.length : 0
        },
        usuario_id: req.user?.id,
        rol_usuario: req.user?.role,
        tipo_error: error.name || 'Error',
        mensaje_error: error.message,
        fecha_error: new Date().toISOString(),
        contexto_error: 'CREACION_ORDEN_SALIDA_FALLIDA'
      },
      { 
        tipo_operacion: 'GESTION_ORDEN_SALIDA', 
        tipo_accion: 'ERROR_CREACION',
        impacto_negocio: 'CREACION_ORDEN_FALLIDA'
      }
    );
    
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ ENHANCED: Approve departure order with Spanish tracking
 */
async function approveDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }

    // ✅ SPANISH TRACKING: Inicio de proceso de aprobación
    await req.logEvent(
      'PROCESO_APROBACION_INICIADO',
      'OrdenDeSalida',
      departureOrderId,
      `Iniciando proceso de aprobación de orden de salida por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        aprobador: userId,
        rol_aprobador: userRole,
        comentarios_aprobacion: comments || 'Sin comentarios adicionales',
        fecha_inicio_aprobacion: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'INICIO_APROBACION',
        impacto_negocio: 'PROCESO_APROBACION_INICIADO'
      }
    );
    
    const result = await departureService.approveDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ SPANISH TRACKING: Orden aprobada exitosamente
    await req.logEvent(
      'ORDEN_SALIDA_APROBADA',
      'OrdenDeSalida',
      departureOrderId,
      `Orden de salida ${result.departure_order.departure_order_no} aprobada exitosamente por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden_salida: result.departure_order.departure_order_no,
        aprobado_por: userId,
        rol_aprobador: userRole,
        fecha_aprobacion: result.approved_at,
        comentarios_aprobacion: comments,
        estado_anterior: 'PENDIENTE',
        estado_nuevo: 'APROBADO',
        proximos_pasos: 'LISTA_PARA_ASIGNACION_INVENTARIO_Y_DESPACHO'
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'APROBACION_EXITOSA',
        impacto_negocio: 'ORDEN_APROBADA_LISTA_DESPACHO',
        proximos_pasos: 'ASIGNACION_INVENTARIO_Y_DESPACHO_DISPONIBLE'
      }
    );

    // ✅ SPANISH TRACKING: Cambio de estado de workflow
    await req.logEvent(
      'CAMBIO_ESTADO_WORKFLOW',
      'WorkflowOrdenSalida',
      departureOrderId,
      `Estado de workflow cambiado: PENDIENTE → APROBADO`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden: result.departure_order.departure_order_no,
        flujo_workflow: {
          estado_anterior: 'PENDIENTE',
          estado_nuevo: 'APROBADO',
          accion_ejecutada: 'APROBACION',
          autorizado_por: userId,
          rol_autorizador: userRole
        },
        impacto_operacional: {
          puede_asignar_inventario: true,
          puede_despachar: true,
          requiere_autorizacion_adicional: false
        }
      },
      { 
        tipo_operacion: 'GESTION_WORKFLOW', 
        tipo_accion: 'CAMBIO_ESTADO',
        impacto_negocio: 'WORKFLOW_PROGRESADO'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error approving departure order:", error);

    // ✅ SPANISH TRACKING: Error en aprobación
    await req.logEvent(
      'ERROR_APROBACION_ORDEN',
      'OrdenDeSalida',
      req.params.departureOrderId,
      `Error durante aprobación de orden de salida: ${error.message}`,
      null,
      {
        orden_salida_id: req.params.departureOrderId,
        usuario_aprobador: req.user?.id,
        rol_usuario: req.user?.role,
        comentarios_intento: req.body.comments,
        tipo_error: error.name || 'Error',
        mensaje_error: error.message,
        fecha_error: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'ERROR_APROBACION',
        impacto_negocio: 'APROBACION_FALLIDA'
      }
    );

    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ ENHANCED: Reject departure order with Spanish tracking
 */
async function rejectDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rejection comments are required",
      });
    }

    // ✅ SPANISH TRACKING: Inicio de proceso de rechazo
    await req.logEvent(
      'PROCESO_RECHAZO_INICIADO',
      'OrdenDeSalida',
      departureOrderId,
      `Iniciando proceso de rechazo de orden de salida por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        rechazado_por: userId,
        rol_rechazador: userRole,
        motivo_rechazo: comments,
        fecha_inicio_rechazo: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'INICIO_RECHAZO',
        impacto_negocio: 'PROCESO_RECHAZO_INICIADO'
      }
    );
    
    const result = await departureService.rejectDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ SPANISH TRACKING: Orden rechazada
    await req.logEvent(
      'ORDEN_SALIDA_RECHAZADA',
      'OrdenDeSalida',
      departureOrderId,
      `Orden de salida ${result.departure_order.departure_order_no} rechazada por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden_salida: result.departure_order.departure_order_no,
        rechazado_por: userId,
        rol_rechazador: userRole,
        fecha_rechazo: result.rejected_at,
        motivo_rechazo: comments,
        estado_anterior: 'PENDIENTE',
        estado_nuevo: 'RECHAZADO',
        impacto_operacional: 'ORDEN_CANCELADA'
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'RECHAZO_COMPLETADO',
        impacto_negocio: 'ORDEN_RECHAZADA',
        proximos_pasos: 'CREADOR_ORDEN_NOTIFICADO_RECHAZO'
      }
    );

    // ✅ SPANISH TRACKING: Notificación al creador
    await req.logEvent(
      'NOTIFICACION_RECHAZO_ENVIADA',
      'NotificacionOrden',
      departureOrderId,
      `Notificación de rechazo enviada al creador de la orden`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden: result.departure_order.departure_order_no,
        notificacion: {
          tipo: 'RECHAZO_ORDEN',
          destinatario_rol: 'CREADOR_ORDEN',
          motivo_rechazo: comments,
          accion_requerida: 'REVISAR_Y_CREAR_NUEVA_ORDEN',
          rechazado_por: userRole
        }
      },
      { 
        tipo_operacion: 'NOTIFICACIONES', 
        tipo_accion: 'NOTIFICACION_ENVIADA',
        impacto_negocio: 'COMUNICACION_RECHAZO'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error rejecting departure order:", error);

    // ✅ SPANISH TRACKING: Error en rechazo
    await req.logEvent(
      'ERROR_RECHAZO_ORDEN',
      'OrdenDeSalida',
      req.params.departureOrderId,
      `Error durante rechazo de orden de salida: ${error.message}`,
      null,
      {
        orden_salida_id: req.params.departureOrderId,
        usuario_rechazador: req.user?.id,
        rol_usuario: req.user?.role,
        motivo_rechazo_intento: req.body.comments,
        tipo_error: error.name || 'Error',
        mensaje_error: error.message,
        fecha_error: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'ERROR_RECHAZO',
        impacto_negocio: 'RECHAZO_FALLIDO'
      }
    );

    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ ENHANCED: Request revision for departure order with Spanish tracking
 */
async function requestRevisionDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { comments } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Revision comments are required",
      });
    }

    // ✅ SPANISH TRACKING: Inicio de solicitud de revisión
    await req.logEvent(
      'SOLICITUD_REVISION_INICIADA',
      'OrdenDeSalida',
      departureOrderId,
      `Iniciando solicitud de revisión de orden de salida por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        solicitado_por: userId,
        rol_solicitante: userRole,
        comentarios_revision: comments,
        fecha_solicitud: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'INICIO_SOLICITUD_REVISION',
        impacto_negocio: 'PROCESO_REVISION_INICIADO'
      }
    );
    
    const result = await departureService.requestRevisionDepartureOrder(departureOrderId, userId, userRole, comments);
    
    // ✅ SPANISH TRACKING: Revisión solicitada exitosamente
    await req.logEvent(
      'REVISION_ORDEN_SOLICITADA',
      'OrdenDeSalida',
      departureOrderId,
      `Revisión solicitada para orden de salida ${result.departure_order.departure_order_no} por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden_salida: result.departure_order.departure_order_no,
        solicitado_por: userId,
        rol_solicitante: userRole,
        fecha_solicitud: result.requested_at,
        notas_revision: comments,
        estado_anterior: 'PENDIENTE',
        estado_nuevo: 'REVISION',
        accion_disponible: 'EDITAR_Y_REENVIAR'
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'REVISION_SOLICITADA',
        impacto_negocio: 'ORDEN_REQUIERE_REVISION',
        proximos_pasos: 'CREADOR_PUEDE_EDITAR_Y_REENVIAR'
      }
    );

    // ✅ SPANISH TRACKING: Habilitación de edición
    await req.logEvent(
      'EDICION_ORDEN_HABILITADA',
      'PermisoOrden',
      departureOrderId,
      `Orden habilitada para edición tras solicitud de revisión`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden: result.departure_order.departure_order_no,
        permisos_habilitados: {
          puede_editar: true,
          puede_reenviar: true,
          puede_cancelar: true
        },
        revision_solicitada_por: userId,
        comentarios_para_revision: comments,
        tiempo_limite_revision: null // Sin límite de tiempo definido
      },
      { 
        tipo_operacion: 'GESTION_PERMISOS', 
        tipo_accion: 'PERMISOS_EDICION_HABILITADOS',
        impacto_negocio: 'ORDEN_EDITABLE'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error requesting revision for departure order:", error);

    // ✅ SPANISH TRACKING: Error en solicitud de revisión
    await req.logEvent(
      'ERROR_SOLICITUD_REVISION',
      'OrdenDeSalida',
      req.params.departureOrderId,
      `Error durante solicitud de revisión: ${error.message}`,
      null,
      {
        orden_salida_id: req.params.departureOrderId,
        usuario_solicitante: req.user?.id,
        rol_usuario: req.user?.role,
        comentarios_revision: req.body.comments,
        tipo_error: error.name || 'Error',
        mensaje_error: error.message,
        fecha_error: new Date().toISOString()
      },
      { 
        tipo_operacion: 'FLUJO_APROBACION', 
        tipo_accion: 'ERROR_SOLICITUD_REVISION',
        impacto_negocio: 'SOLICITUD_REVISION_FALLIDA'
      }
    );

    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Dispatch approved departure order (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function dispatchDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const dispatchData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const result = await departureService.dispatchDepartureOrder(departureOrderId, userId, userRole, dispatchData);
    
    // ✅ LOG: Departure order dispatch
    await req.logEvent(
      'DEPARTURE_ORDER_DISPATCHED',
      'DepartureOrder',
      departureOrderId,
      `Departure order ${result.departure_order.departure_order_no} dispatched by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        departure_order_no: result.departure_order.departure_order_no,
        dispatched_by: userId,
        dispatcher_role: userRole,
        dispatched_at: result.dispatched_at,
        dispatch_notes: dispatchData.dispatch_notes,
        previous_status: 'APPROVED',
        new_status: 'DISPATCHED',
        inventory_cells_affected: result.dispatch_result.totals.cells_affected,
        total_quantity_dispatched: result.dispatch_result.totals.total_qty,
        total_weight_dispatched: result.dispatch_result.totals.total_weight,
        cells_depleted: result.dispatch_result.totals.cells_depleted,
        business_impact: 'DEPARTURE_ORDER_DISPATCHED_FROM_WAREHOUSE'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_DISPATCH', 
        action_type: 'DISPATCH_SUCCESS',
        business_impact: 'INVENTORY_REMOVED_FROM_WAREHOUSE',
        next_steps: 'DEPARTURE_ORDER_COMPLETED'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error dispatching departure order:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Batch dispatch multiple departure orders (WAREHOUSE_INCHARGE/ADMIN only)
 */
async function batchDispatchDepartureOrders(req, res) {
  try {
    const { departure_order_ids, batch_dispatch_data } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departure_order_ids || !Array.isArray(departure_order_ids) || departure_order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "departure_order_ids array is required",
      });
    }
    
    const result = await departureService.batchDispatchDepartureOrders(departure_order_ids, userId, userRole, batch_dispatch_data);
    
    // ✅ LOG: Batch departure order dispatch
    await req.logEvent(
      'DEPARTURE_ORDERS_BATCH_DISPATCHED',
      'DepartureOrder',
      'BATCH_DISPATCH',
      `Batch dispatch of ${departure_order_ids.length} departure orders by ${userRole}`,
      null,
      {
        departure_order_ids: departure_order_ids,
        dispatched_by: userId,
        dispatcher_role: userRole,
        dispatched_at: result.dispatched_at,
        total_processed: result.total_processed,
        successful_dispatches: result.successful_dispatches.length,
        failed_dispatches: result.failed_dispatches.length,
        business_impact: 'MULTIPLE_DEPARTURE_ORDERS_DISPATCHED'
      },
      { 
        operation_type: 'DEPARTURE_ORDER_DISPATCH', 
        action_type: 'BATCH_DISPATCH',
        business_impact: 'BULK_INVENTORY_REMOVAL',
        next_steps: 'BATCH_DEPARTURE_COMPLETED'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error batch dispatching departure orders:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * NEW: Get departure order details by ID
 */
async function getDepartureOrderById(req, res) {
  try {
    const { departureOrderId } = req.params;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const data = await departureService.getDepartureOrderById(departureOrderId);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Departure order not found",
      });
    }
    
    return res.status(200).json({ 
      success: true,
      message: "Departure order details fetched successfully", 
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get departure inventory summary by warehouse
 */
async function getDepartureInventorySummary(req, res) {
  try {
    const { warehouseId } = req.query;
    
    const data = await departureService.getDepartureInventorySummary(warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "Departure inventory summary fetched successfully", 
      ...data
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get FIFO locations for a specific product
 */
async function getFifoLocationsForProduct(req, res) {
  try {
    const { productId } = req.params;
    const { warehouseId } = req.query;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
    
    const data = await departureService.getFifoLocationsForProduct(productId, warehouseId || null);
    
    return res.status(200).json({ 
      success: true,
      message: "EXPIRY-BASED FIFO locations for product fetched successfully", 
      count: data.length,
      product_id: productId,
      fifo_method: "EXPIRY_DATE_PRIORITY",
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get suggested FIFO allocation for a product with requested quantity
 */
async function getSuggestedFifoAllocation(req, res) {
  try {
    const { productId } = req.params;
    const { requestedQuantity, requestedWeight, warehouseId } = req.query;
    
    if (!productId || !requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and requested quantity are required",
      });
    }
    
    const data = await departureService.getSuggestedFifoAllocation(
      productId, 
      parseInt(requestedQuantity),
      requestedWeight ? parseFloat(requestedWeight) : null,
      warehouseId || null
    );
    
    return res.status(200).json({ 
      success: true,
      message: "EXPIRY-BASED FIFO allocation suggestion generated successfully", 
      fifo_method: "EXPIRY_DATE_PRIORITY",
      data 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get next departure order number
 */
async function getCurrentDepartureOrderNo(req, res) {
  try {
    const nextOrderNo = await departureService.getCurrentDepartureOrderNo();
    
    return res.status(200).json({ 
      success: true,
      message: "Next departure order number generated successfully", 
      departure_order_no: nextOrderNo
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get permissions for a specific role
 */
async function getDeparturePermissions(req, res) {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role parameter is required",
      });
    }

    // Define permissions based on role
    const permissions = {
      CLIENT: {
        can_create: true,
        can_view_own: true,
        can_view_all: false,
        can_edit: true, // Only in REVISION status
        can_approve: false,
        can_reject: false,
        can_request_revision: false,
        can_dispatch: false,
        can_batch_dispatch: false,
        can_view_all_inventory: false,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT_REVISION']
      },
      WAREHOUSE_INCHARGE: {
        can_create: true,
        can_view_own: true,
        can_view_all: true,
        can_edit: true,
        can_approve: true,
        can_reject: true,
        can_request_revision: true,
        can_dispatch: true,
        can_batch_dispatch: true,
        can_view_all_inventory: true,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'DISPATCH', 'BATCH_DISPATCH']
      },
      ADMIN: {
        can_create: true,
        can_view_own: true,
        can_view_all: true,
        can_edit: true,
        can_approve: true,
        can_reject: true,
        can_request_revision: true,
        can_dispatch: true,
        can_batch_dispatch: true,
        can_view_all_inventory: true,
        allowed_statuses: ['PENDING', 'REVISION', 'APPROVED', 'REJECTED', 'DISPATCHED'],
        workflow_actions: ['CREATE', 'EDIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'DISPATCH', 'BATCH_DISPATCH']
      }
    };

    const rolePermissions = permissions[role];
    
    if (!rolePermissions) {
      return res.status(400).json({
        success: false,
        message: `Invalid role: ${role}. Valid roles are: CLIENT, WAREHOUSE_INCHARGE, ADMIN`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Permissions for role ${role} retrieved successfully`,
      role: role,
      permissions: rolePermissions,
      workflow_info: {
        status_flow: "PENDIENTE → APROBADO/REVISION/RECHAZADO → DESPACHO → COMPLETADO",
        approval_required_roles: ["WAREHOUSE_INCHARGE", "ADMIN"],
        dispatch_required_roles: ["WAREHOUSE_INCHARGE", "ADMIN"],
        fifo_method: "EXPIRY_DATE_PRIORITY"
      }
    });
  } catch (error) {
    console.error("Error in getDeparturePermissions:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get expiry urgency dashboard for departure planning
 */
async function getExpiryUrgencyDashboard(req, res) {
  try {
    const { warehouseId } = req.query;
    
    const data = await departureService.getExpiryUrgencyDashboard(warehouseId || null);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in getExpiryUrgencyDashboard:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

// ✅ NEW: Create comprehensive departure order
async function createComprehensiveDepartureOrder(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    // Validate required fields
    const requiredFields = ['organisation_id', 'created_by'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
          error: `${field} is required for comprehensive departure order creation`
        });
      }
    }

    // Ensure user can only create orders for their organisation
    if (req.body.organisation_id !== organisationId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot create departure order for different organisation",
        error: "Organisation mismatch"
      });
    }

    // Ensure created_by matches authenticated user
    if (req.body.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot create departure order on behalf of another user",
        error: "User ID mismatch"
      });
    }

    // Validate products array
    if (!req.body.products || !Array.isArray(req.body.products) || req.body.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required for comprehensive departure order",
        error: "Products array is empty or invalid"
      });
    }

    // Role-based access control
    const allowedRoles = ['CLIENT', 'WAREHOUSE_INCHARGE', 'ADMIN'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Insufficient permissions to create departure orders",
        error: `Role ${userRole} is not authorized for departure order creation`
      });
    }

    // Special handling for CLIENT role - map customer_id (client user name) to client_id
    if (userRole === 'CLIENT') {
      try {
        // Get the client associated with this authenticated user
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const clientUser = await prisma.clientUser.findFirst({
          where: { 
            user_id: userId,
            is_active: true
          },
          include: {
            client: {
              select: {
                client_id: true,
                company_name: true,
                client_users_data: true
              }
            }
          }
        });

        if (!clientUser?.client) {
          return res.status(403).json({
            success: false,
            message: "Client account not found for this user",
            error: "User is not associated with any client account"
          });
        }

        const client = clientUser.client;
        
        // If client_id is already provided, validate it matches the user's client
        if (req.body.client_id) {
          if (req.body.client_id !== client.client_id) {
            return res.status(403).json({
              success: false,
              message: "Access denied: Cannot create orders for different client",
              error: "Provided client_id does not match user's client account"
            });
          }
          // client_id is valid, continue
        } 
        // If customer_id is provided (client user name), map it to client_id
        else if (req.body.customer_id) {
          const clientUsersData = client.client_users_data || [];
          
          // Check if the customer_id matches any client user name
          const matchingUser = clientUsersData.find(user => 
            user.name === req.body.customer_id
          );
          
          if (!matchingUser) {
            return res.status(400).json({
              success: false,
              message: "Invalid client user name provided",
              error: `Client user "${req.body.customer_id}" not found`,
              available_client_users: clientUsersData.map(user => user.name),
              client_info: {
                client_id: client.client_id,
                company_name: client.company_name
              }
            });
          }
          
          // Map customer_id (client user name) to client_id
          const originalCustomerId = req.body.customer_id;
          req.body.client_id = client.client_id;
          delete req.body.customer_id; // Remove customer_id to avoid conflicts
          
          console.log(`✅ Mapped client user "${originalCustomerId}" to client_id: ${client.client_id}`);
        } 
        // Neither client_id nor customer_id provided
        else {
          return res.status(400).json({
            success: false,
            message: "Client identification required",
            error: "Please provide either client_id or customer_id (client user name)",
            available_client_users: client.client_users_data?.map(user => user.name) || [],
            client_info: {
              client_id: client.client_id,
              company_name: client.company_name,
              auto_assign_note: "You can omit both fields to auto-assign to your client account"
            }
          });
        }

        await prisma.$disconnect();
        
      } catch (error) {
        console.error("Error mapping client user to client_id:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to process client information",
          error: error.message
        });
      }
    }

    // Call service to create comprehensive departure order
    const result = await departureService.createComprehensiveDepartureOrder(req.body);

    // Success response
    res.status(201).json({
      success: true,
      message: "Comprehensive departure order created successfully",
      data: result,
      metadata: {
        created_by: userId,
        user_role: userRole,
        organisation_id: organisationId,
        creation_timestamp: new Date().toISOString(),
        api_endpoint: '/departure/comprehensive-orders',
        request_method: 'POST'
      }
    });

  } catch (error) {
    console.error("Error creating comprehensive departure order:", error);
    
    // Handle specific error types
    if (error.message.includes('Product with ID') && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: "Product validation failed",
        error: error.message
      });
    }

    if (error.message.includes('Unique constraint failed')) {
      return res.status(409).json({
        success: false,
        message: "Departure order number already exists",
        error: "Please try again with a different order number"
      });
    }

    if (error.message.includes('Foreign key constraint failed')) {
      return res.status(400).json({
        success: false,
        message: "Invalid reference data provided",
        error: "One or more referenced entities (warehouse, customer, etc.) do not exist"
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to create comprehensive departure order",
      error: error.message || "Internal server error"
    });
  }
}

// ✅ NEW: Get comprehensive departure orders
async function getComprehensiveDepartureOrders(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    // Extract query parameters
    const {
      organisationId: queryOrgId,
      status,
      startDate,
      endDate,
      warehouseId,
      clientId,
      page = 1,
      limit = 50
    } = req.query;

    // Use organisation from query or user's organisation
    const targetOrgId = queryOrgId || organisationId;

    // Validate organisation access
    if (queryOrgId && queryOrgId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Cannot access departure orders for different organisation",
        error: "Organisation mismatch"
      });
    }

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (clientId) filters.clientId = clientId;

    // Call service to get comprehensive departure orders
    const result = await departureService.getComprehensiveDepartureOrders(
      targetOrgId,
      userRole,
      userId,
      filters
    );

    // Apply pagination if needed
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = result.data.slice(startIndex, endIndex);

    // Success response
    res.status(200).json({
      success: true,
      message: "Comprehensive departure orders retrieved successfully",
      data: paginatedData,
      summary: result.summary,
      filters_applied: result.filters_applied,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: result.data.length,
        total_pages: Math.ceil(result.data.length / parseInt(limit)),
        has_next_page: endIndex < result.data.length,
        has_previous_page: parseInt(page) > 1,
      },
      metadata: {
        user_role: userRole,
        organisation_id: targetOrgId,
        request_timestamp: new Date().toISOString(),
        api_endpoint: '/departure/comprehensive-orders',
        request_method: 'GET'
      }
    });

  } catch (error) {
    console.error("Error getting comprehensive departure orders:", error);
    
    // Handle specific error types
    if (error.message.includes('Invalid organisation')) {
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID provided",
        error: error.message
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        error: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve comprehensive departure orders",
      error: error.message || "Internal server error"
    });
  }
}

// ✅ NEW: Get comprehensive departure order by order number
async function getComprehensiveDepartureOrderByNumber(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    const { orderNumber } = req.params;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required",
        error: "Missing order number parameter"
      });
    }

    // Call service to get comprehensive departure order by number
    const result = await departureService.getComprehensiveDepartureOrderByNumber(
      orderNumber,
      userRole,
      userId,
      organisationId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Departure order not found",
        error: `No departure order found with number: ${orderNumber}`
      });
    }

    // Success response
    res.status(200).json({
      ...result,
      metadata: {
        user_role: userRole,
        organisation_id: organisationId,
        request_timestamp: new Date().toISOString(),
        api_endpoint: `/departure/comprehensive-orders/${orderNumber}`,
        request_method: 'GET',
        order_number: orderNumber
      }
    });

  } catch (error) {
    console.error("Error getting comprehensive departure order by number:", error);
    
    // Handle specific error types
    if (error.message.includes('Invalid order number')) {
      return res.status(400).json({
        success: false,
        message: "Invalid order number format",
        error: error.message
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        error: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve comprehensive departure order",
      error: error.message || "Internal server error"
    });
  }
}

// ✅ NEW: Get audit trail for departure order
async function getDepartureOrderAuditTrail(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const organisationId = req.user?.organisation_id;
    
    const { departureOrderId } = req.params;

    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure order ID is required",
        error: "Missing departureOrderId parameter"
      });
    }

    // Call service to get audit trail
    const result = await departureService.getDepartureOrderAuditTrail(
      departureOrderId,
      userRole,
      userId,
      organisationId
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Departure order not found or access denied",
        error: `No departure order found with ID: ${departureOrderId} or insufficient permissions`
      });
    }

    // Success response
    res.status(200).json({
      ...result,
      metadata: {
        user_role: userRole,
        organisation_id: organisationId,
        request_timestamp: new Date().toISOString(),
        api_endpoint: `/departure/departure-orders/${departureOrderId}/audit-trail`,
        request_method: 'GET',
        departure_order_id: departureOrderId
      }
    });

  } catch (error) {
    console.error("Error getting departure order audit trail:", error);
    
    // Handle specific error types
    if (error.message.includes('Invalid departure order ID')) {
      return res.status(400).json({
        success: false,
        message: "Invalid departure order ID format",
        error: error.message
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        error: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve departure order audit trail",
      error: error.message || "Internal server error"
    });
  }
}

/**
 * ✅ NEW: Create departure allocations for a departure order
 */
async function createDepartureAllocations(req, res) {
  try {
    const { departureOrderId } = req.params;
    const allocationData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    if (!allocationData.allocations || allocationData.allocations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Allocation data is required",
      });
    }
    
    const result = await departureService.createDepartureAllocations(departureOrderId, allocationData, userId, userRole);
    
    // ✅ LOG: Departure allocation creation
    await req.logEvent(
      'DEPARTURE_ALLOCATED',
      'DepartureOrder',
      departureOrderId,
      `Departure order allocated with ${result.total_allocations} inventory allocations by ${userRole}`,
      null,
      {
        departure_order_id: departureOrderId,
        total_allocations: result.total_allocations,
        allocated_by: userId,
        allocator_role: userRole,
        allocated_at: result.allocated_at,
        business_impact: 'DEPARTURE_ORDER_READY_FOR_DISPATCH'
      },
      { 
        operation_type: 'DEPARTURE_ALLOCATION', 
        action_type: 'ALLOCATION_SUCCESS',
        business_impact: 'INVENTORY_ALLOCATED_FOR_DEPARTURE',
        next_steps: 'DISPATCH_AVAILABLE'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error creating departure allocations:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ NEW: Get available inventory for departure allocation
 */
async function getAvailableInventoryForDeparture(req, res) {
  try {
    const { departureOrderId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }
    
    const data = await departureService.getAvailableInventoryForDeparture(departureOrderId, userRole, userId);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error getting available inventory for departure:", error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

/**
 * ✅ ENHANCED: Auto-dispatch departure order with comprehensive Spanish tracking
 */
async function autoDispatchDepartureOrder(req, res) {
  try {
    const { departureOrderId } = req.params;
    const dispatchData = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!departureOrderId) {
      return res.status(400).json({
        success: false,
        message: "Departure Order ID is required",
      });
    }

    // ✅ SPANISH TRACKING: Inicio del proceso de despacho automático
    await req.logEvent(
      'DESPACHO_AUTOMATICO_INICIADO',
      'OrdenDeSalida',
      departureOrderId,
      `Iniciando despacho automático de orden de salida con lógica FIFO+Vencimiento por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        usuario_despachador: userId,
        rol_despachador: userRole,
        metodo_despacho: 'AUTO_FIFO_VENCIMIENTO',
        notas_despacho: dispatchData.dispatch_notes || 'Sin notas adicionales',
        fecha_inicio_proceso: new Date().toISOString()
      },
      { 
        tipo_operacion: 'DESPACHO_AUTOMATICO', 
        tipo_accion: 'INICIO_PROCESO',
        impacto_negocio: 'PROCESO_DESPACHO_INICIADO'
      }
    );
    
    const result = await departureService.autoDispatchDepartureOrder(departureOrderId, userId, userRole, dispatchData);
    
    // ✅ SPANISH TRACKING: Despacho automático exitoso
    await req.logEvent(
      'DESPACHO_AUTOMATICO_COMPLETADO',
      'OrdenDeSalida',
      departureOrderId,
      `Orden de salida despachada automáticamente con éxito usando lógica FIFO+Vencimiento por ${userRole}`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden_salida: result.departure_order?.departure_order_no,
        despachado_por: userId,
        rol_despachador: userRole,
        fecha_despacho: result.dispatched_at,
        metodo_despacho: 'AUTO_FIFO_VENCIMIENTO',
        celdas_procesadas: result.allocated_cells_dispatched,
        logica_fifo_aplicada: result.fifo_logic_applied,
        prioridad_vencimiento_aplicada: result.expiry_priority_applied,
        paso_asignacion_omitido: result.allocation_bypassed,
        resumen_despacho: {
          total_productos: result.dispatch_result?.totals?.total_qty || 0,
          peso_total: result.dispatch_result?.totals?.total_weight || 0,
          celdas_afectadas: result.dispatch_result?.totals?.cells_affected || 0,
          celdas_agotadas: result.dispatch_result?.totals?.cells_depleted || 0
        }
      },
      { 
        tipo_operacion: 'DESPACHO_AUTOMATICO', 
        tipo_accion: 'DESPACHO_EXITOSO',
        impacto_negocio: 'INVENTARIO_DESPACHADO_AUTOMATICAMENTE',
        metodo_fifo: 'PRIORIDAD_FECHA_VENCIMIENTO_CON_FECHA_ENTRADA_SECUNDARIA'
      }
    );

    // ✅ SPANISH TRACKING: Inventario actualizado
    await req.logEvent(
      'INVENTARIO_ACTUALIZADO_DESPACHO',
      'Inventario',
      departureOrderId,
      `Inventario actualizado tras despacho automático - ${result.dispatch_result?.totals?.cells_affected || 0} celdas procesadas`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden: result.departure_order?.departure_order_no,
        celdas_procesadas: result.dispatch_result?.cellAllocations?.map(cell => ({
          referencia_celda: cell.cell_reference,
          codigo_producto: cell.product_code,
          nombre_producto: cell.product_name,
          lote: cell.lot_series,
          cantidad_despachada: cell.dispatched_qty,
          peso_despachado: cell.dispatched_weight,
          celda_agotada: cell.cell_depleted,
          fecha_vencimiento: cell.expiration_date,
          numero_orden_entrada: cell.entry_order_no
        })) || [],
        resumen_inventario: {
          total_productos_removidos: result.dispatch_result?.totals?.total_qty || 0,
          peso_total_removido: result.dispatch_result?.totals?.total_weight || 0,
          celdas_completamente_vaciadas: result.dispatch_result?.totals?.cells_depleted || 0
        }
      },
      { 
        tipo_operacion: 'ACTUALIZACION_INVENTARIO', 
        tipo_accion: 'INVENTARIO_REDUCIDO',
        impacto_negocio: 'INVENTARIO_ACTUALIZADO_POR_DESPACHO'
      }
    );

    // ✅ SPANISH TRACKING: Proceso FIFO aplicado
    if (result.fifo_logic_applied) {
      await req.logEvent(
        'LOGICA_FIFO_APLICADA',
        'ProcesoInventario',
        departureOrderId,
        `Lógica FIFO aplicada exitosamente - productos despachados por fecha de vencimiento`,
        null,
        {
          orden_salida_id: departureOrderId,
          metodo_fifo: 'FECHA_VENCIMIENTO_PRIMERO',
          prioridad_aplicada: 'VENCIMIENTO_MAS_PROXIMO',
          criterio_secundario: 'FECHA_ENTRADA_MAS_ANTIGUA',
          productos_priorizados: result.dispatch_result?.cellAllocations?.map(cell => ({
            producto: cell.product_code,
            lote: cell.lot_series,
            fecha_vencimiento: cell.expiration_date,
            dias_hasta_vencimiento: cell.expiration_date ? 
              Math.ceil((new Date(cell.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A',
            prioridad_fifo: 'ALTA_PROXIMIDAD_VENCIMIENTO'
          })) || []
        },
        { 
          tipo_operacion: 'GESTION_FIFO', 
          tipo_accion: 'FIFO_APLICADO',
          impacto_negocio: 'ROTACION_INVENTARIO_OPTIMIZADA'
        }
      );
    }

    // ✅ SPANISH TRACKING: Trazabilidad completa
    await req.logEvent(
      'TRAZABILIDAD_DESPACHO_REGISTRADA',
      'Trazabilidad',
      departureOrderId,
      `Trazabilidad completa registrada para despacho automático`,
      null,
      {
        orden_salida_id: departureOrderId,
        numero_orden: result.departure_order?.departure_order_no,
        cadena_trazabilidad: {
          orden_creada: result.departure_order?.registration_date,
          orden_aprobada: result.departure_order?.approved_at,
          despacho_iniciado: new Date().toISOString(),
          despacho_completado: result.dispatched_at,
          productos_rastreados: result.dispatch_result?.cellAllocations?.map(cell => ({
            producto: cell.product_code,
            lote: cell.lot_series,
            orden_entrada_origen: cell.entry_order_no,
            celda_origen: cell.cell_reference,
            almacen: cell.warehouse_name,
            fecha_fabricacion: cell.manufacturing_date,
            fecha_vencimiento: cell.expiration_date
          })) || []
        },
        documentacion: {
          numero_guia_despacho: dispatchData.dispatch_document_number,
          transportista: result.departure_order?.carrier_name,
          destino: result.departure_order?.destination_point,
          fecha_salida_programada: result.departure_order?.departure_date_time
        }
      },
      { 
        tipo_operacion: 'TRAZABILIDAD', 
        tipo_accion: 'REGISTRO_COMPLETO',
        impacto_negocio: 'TRAZABILIDAD_DOCUMENTADA'
      }
    );
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error auto-dispatching departure order:", error);
    
    // ✅ SPANISH TRACKING: Error en despacho automático
    await req.logEvent(
      'ERROR_DESPACHO_AUTOMATICO',
      'OrdenDeSalida',
      req.params.departureOrderId,
      `Error durante despacho automático: ${error.message}`,
      null,
      {
        orden_salida_id: req.params.departureOrderId,
        usuario_intento: req.user?.id,
        rol_usuario: req.user?.role,
        tipo_error: error.name || 'Error',
        mensaje_error: error.message,
        datos_despacho: req.body,
        fecha_error: new Date().toISOString(),
        contexto_error: 'DESPACHO_AUTOMATICO_FALLIDO'
      },
      { 
        tipo_operacion: 'DESPACHO_AUTOMATICO', 
        tipo_accion: 'ERROR',
        impacto_negocio: 'DESPACHO_FALLIDO'
      }
    );
    
    // ✅ LOG: Auto-dispatch failure (English for system)
    await req.logError(error, {
      controller: 'departure',
      action: 'autoDispatchDepartureOrder',
      departure_order_id: req.params.departureOrderId,
      user_id: req.user?.id,
      user_role: req.user?.role,
      dispatch_data: req.body,
      error_context: 'AUTO_DISPATCH_FAILED'
    });
    
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}

module.exports = {
  getDepartureFormFields,
  getDepartureExitOptions,
  getAllDepartureOrders,
  createDepartureOrder,
  getProductsWithInventory,
  getAvailableCellsForProduct,
  validateSelectedCell,
  validateMultipleCells,
  getDepartureOrderById,
  getDepartureInventorySummary,
  getCurrentDepartureOrderNo,
  getFifoLocationsForProduct,
  getSuggestedFifoAllocation,
  // ✅ NEW: Approval workflow methods
  approveDepartureOrder,
  rejectDepartureOrder,
  requestRevisionDepartureOrder,
  // ✅ NEW: Dispatch methods
  dispatchDepartureOrder,
  batchDispatchDepartureOrders,
  // ✅ NEW: Permissions method
  getDeparturePermissions,
  // ✅ NEW: Expiry urgency dashboard
  getExpiryUrgencyDashboard,
  createComprehensiveDepartureOrder,
  getComprehensiveDepartureOrders,
  getComprehensiveDepartureOrderByNumber,
  getDepartureOrderAuditTrail, // ✅ NEW: Get audit trail for departure order
  createDepartureAllocations,
  getAvailableInventoryForDeparture,
  autoDispatchDepartureOrder,
};

