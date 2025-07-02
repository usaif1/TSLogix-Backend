const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { uploadDocument, deleteDocument, getSignedUrl, listDocuments, validateFile } = require("../../utils/supabase");

/**
 * Get available document types for entry orders
 */
async function getEntryDocumentTypes(req, res) {
  try {
    const documentTypes = [
      { value: 'PACKING_LIST', label: 'Packing List', label_es: 'Lista de Empaque' },
      { value: 'FACTURA', label: 'Invoice', label_es: 'Factura' },
      { value: 'CERTIFICADO_ANALISIS', label: 'Certificate of Analysis', label_es: 'Certificado de Análisis' },
      { value: 'RRSS', label: 'RRSS', label_es: 'RRSS' },
      { value: 'PERMISO_ESPECIAL', label: 'Special Permit', label_es: 'Permiso Especial' },
      { value: 'OTRO', label: 'Other', label_es: 'Otro' }
    ];

    res.status(200).json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Error fetching entry document types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch entry document types',
      error: error.message
    });
  }
}

/**
 * Get available document types for departure orders
 */
async function getDepartureDocumentTypes(req, res) {
  try {
    const documentTypes = [
      { value: 'CUSTOMER_DISPATCH_NOTE', label: 'Customer Dispatch Note', label_es: 'Nota de Despacho al Cliente' },
      { value: 'TRANSPORT_DISPATCH_NOTE', label: 'Transport Dispatch Note', label_es: 'Nota de Despacho de Transporte' },
      { value: 'WAREHOUSE_EXIT_NOTE', label: 'Warehouse Exit Note', label_es: 'Nota de Salida de Almacén' },
      { value: 'OTRO', label: 'Other', label_es: 'Otro' }
    ];

    res.status(200).json({
      success: true,
      data: documentTypes
    });
  } catch (error) {
    console.error('Error fetching departure document types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departure document types',
      error: error.message
    });
  }
}

/**
 * Upload documents for entry order
 */
async function uploadEntryOrderDocuments(req, res) {
  try {
    const { entryOrderId } = req.params;
    const { document_types } = req.body; // Array of document types corresponding to each file
    const files = req.files;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Verify entry order exists
    const entryOrder = await prisma.entryOrder.findUnique({
      where: { entry_order_id: entryOrderId }
    });

    if (!entryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Entry order not found'
      });
    }

    // Process each file upload
    const uploadResults = [];
    const documentTypesArray = Array.isArray(document_types) ? document_types : [document_types];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = documentTypesArray[i] || 'OTRO';

      // Validate file
      const validation = validateFile(file.originalname, file.size);
      if (!validation.valid) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: validation.error
        });
        continue;
      }

      // Upload to Supabase
      const uploadResult = await uploadDocument(
        file.buffer,
        file.originalname,
        'entry-order',
        entryOrderId,
        documentType,
        userId
      );

      uploadResults.push({
        filename: file.originalname,
        ...uploadResult
      });
    }

    // Update entry order with document information
    const currentDocuments = entryOrder.uploaded_documents || [];
    const newDocuments = uploadResults
      .filter(result => result.success)
      .map(result => ({
        file_name: result.file_name,
        file_path: result.file_path,
        public_url: result.public_url,
        document_type: result.document_type,
        uploaded_by: result.uploaded_by,
        uploaded_at: result.uploaded_at,
        file_size: result.file_size,
        content_type: result.content_type
      }));

    await prisma.entryOrder.update({
      where: { entry_order_id: entryOrderId },
      data: {
        uploaded_documents: [...currentDocuments, ...newDocuments]
      }
    });

    // Log the upload activity in Spanish
    await req.logEvent(
      'DOCUMENTOS_SUBIDOS_ORDEN_ENTRADA',
      'OrdenDeEntrada',
      entryOrderId,
      `Se subieron ${uploadResults.filter(r => r.success).length} documentos a la orden de entrada ${entryOrder.entry_order_no}`,
      null,
      {
        orden_entrada_id: entryOrderId,
        orden_entrada_no: entryOrder.entry_order_no,
        documentos_subidos: uploadResults.filter(r => r.success).length,
        total_archivos: files.length,
        tipos_documento: newDocuments.map(d => d.document_type),
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadResults.filter(r => r.success).length} documents`,
      data: {
        upload_results: uploadResults,
        successful_uploads: uploadResults.filter(r => r.success).length,
        failed_uploads: uploadResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error uploading entry order documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
}

/**
 * Upload documents for departure order
 */
async function uploadDepartureOrderDocuments(req, res) {
  try {
    const { departureOrderId } = req.params;
    const { document_types } = req.body;
    const files = req.files;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Verify departure order exists
    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId }
    });

    if (!departureOrder) {
      return res.status(404).json({
        success: false,
        message: 'Departure order not found'
      });
    }

    // Process each file upload
    const uploadResults = [];
    const documentTypesArray = Array.isArray(document_types) ? document_types : [document_types];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = documentTypesArray[i] || 'OTRO';

      // Validate file
      const validation = validateFile(file.originalname, file.size);
      if (!validation.valid) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: validation.error
        });
        continue;
      }

      // Upload to Supabase
      const uploadResult = await uploadDocument(
        file.buffer,
        file.originalname,
        'departure-order',
        departureOrderId,
        documentType,
        userId
      );

      uploadResults.push({
        filename: file.originalname,
        ...uploadResult
      });
    }

    // Update departure order with document information
    const currentDocuments = departureOrder.uploaded_documents || [];
    const newDocuments = uploadResults
      .filter(result => result.success)
      .map(result => ({
        file_name: result.file_name,
        file_path: result.file_path,
        public_url: result.public_url,
        document_type: result.document_type,
        uploaded_by: result.uploaded_by,
        uploaded_at: result.uploaded_at,
        file_size: result.file_size,
        content_type: result.content_type
      }));

    await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        uploaded_documents: [...currentDocuments, ...newDocuments]
      }
    });

    // Log the upload activity in Spanish
    await req.logEvent(
      'DOCUMENTOS_SUBIDOS_ORDEN_SALIDA',
      'OrdenDeSalida',
      departureOrderId,
      `Se subieron ${uploadResults.filter(r => r.success).length} documentos a la orden de salida ${departureOrder.departure_order_no}`,
      null,
      {
        orden_salida_id: departureOrderId,
        orden_salida_no: departureOrder.departure_order_no,
        documentos_subidos: uploadResults.filter(r => r.success).length,
        total_archivos: files.length,
        tipos_documento: newDocuments.map(d => d.document_type),
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadResults.filter(r => r.success).length} documents`,
      data: {
        upload_results: uploadResults,
        successful_uploads: uploadResults.filter(r => r.success).length,
        failed_uploads: uploadResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error uploading departure order documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
}

/**
 * Upload documents for product
 */
async function uploadProductDocuments(req, res) {
  try {
    const { productId } = req.params;
    const { document_types } = req.body;
    const files = req.files;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { product_id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Process each file upload
    const uploadResults = [];
    const documentTypesArray = Array.isArray(document_types) ? document_types : [document_types];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = documentTypesArray[i] || 'PRODUCT_DOCUMENT';

      // Validate file
      const validation = validateFile(file.originalname, file.size);
      if (!validation.valid) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: validation.error
        });
        continue;
      }

      // Upload to Supabase
      const uploadResult = await uploadDocument(
        file.buffer,
        file.originalname,
        'product',
        productId,
        documentType,
        userId
      );

      uploadResults.push({
        filename: file.originalname,
        ...uploadResult
      });
    }

    // Update product with document information
    const currentDocuments = product.uploaded_documents || [];
    const newDocuments = uploadResults
      .filter(result => result.success)
      .map(result => ({
        file_name: result.file_name,
        file_path: result.file_path,
        public_url: result.public_url,
        document_type: result.document_type,
        uploaded_by: result.uploaded_by,
        uploaded_at: result.uploaded_at,
        file_size: result.file_size,
        content_type: result.content_type
      }));

    await prisma.product.update({
      where: { product_id: productId },
      data: {
        uploaded_documents: [...currentDocuments, ...newDocuments]
      }
    });

    // Log the upload activity in Spanish
    await req.logEvent(
      'DOCUMENTOS_SUBIDOS_PRODUCTO',
      'Producto',
      productId,
      `Se subieron ${uploadResults.filter(r => r.success).length} documentos al producto ${product.product_code} - ${product.name}`,
      null,
      {
        producto_id: productId,
        producto_codigo: product.product_code,
        producto_nombre: product.name,
        documentos_subidos: uploadResults.filter(r => r.success).length,
        total_archivos: files.length,
        tipos_documento: newDocuments.map(d => d.document_type),
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadResults.filter(r => r.success).length} documents`,
      data: {
        upload_results: uploadResults,
        successful_uploads: uploadResults.filter(r => r.success).length,
        failed_uploads: uploadResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error uploading product documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
}

/**
 * Get documents for entry order
 */
async function getEntryOrderDocuments(req, res) {
  try {
    const { entryOrderId } = req.params;

    const entryOrder = await prisma.entryOrder.findUnique({
      where: { entry_order_id: entryOrderId },
      select: {
        entry_order_id: true,
        entry_order_no: true,
        uploaded_documents: true
      }
    });

    if (!entryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Entry order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        entry_order_id: entryOrder.entry_order_id,
        entry_order_no: entryOrder.entry_order_no,
        documents: entryOrder.uploaded_documents || []
      }
    });

  } catch (error) {
    console.error('Error fetching entry order documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
}

/**
 * Get documents for departure order
 */
async function getDepartureOrderDocuments(req, res) {
  try {
    const { departureOrderId } = req.params;

    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId },
      select: {
        departure_order_id: true,
        departure_order_no: true,
        uploaded_documents: true
      }
    });

    if (!departureOrder) {
      return res.status(404).json({
        success: false,
        message: 'Departure order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        departure_order_id: departureOrder.departure_order_id,
        departure_order_no: departureOrder.departure_order_no,
        documents: departureOrder.uploaded_documents || []
      }
    });

  } catch (error) {
    console.error('Error fetching departure order documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
}

/**
 * Get documents for product
 */
async function getProductDocuments(req, res) {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { product_id: productId },
      select: {
        product_id: true,
        product_code: true,
        name: true,
        uploaded_documents: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product_id: product.product_id,
        product_code: product.product_code,
        product_name: product.name,
        documents: product.uploaded_documents || []
      }
    });

  } catch (error) {
    console.error('Error fetching product documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
}

/**
 * Delete document from entry order
 */
async function deleteEntryOrderDocument(req, res) {
  try {
    const { entryOrderId, filePath } = req.params;
    const userId = req.user?.id;

    // Decode the file path from URL encoding
    const decodedFilePath = decodeURIComponent(filePath);

    // Get entry order
    const entryOrder = await prisma.entryOrder.findUnique({
      where: { entry_order_id: entryOrderId }
    });

    if (!entryOrder) {
      return res.status(404).json({
        success: false,
        message: 'Entry order not found'
      });
    }

    // Delete from Supabase
    const deleteResult = await deleteDocument(decodedFilePath);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document from storage',
        error: deleteResult.error
      });
    }

    // Remove from database
    const updatedDocuments = (entryOrder.uploaded_documents || [])
      .filter(doc => doc.file_path !== decodedFilePath);

    await prisma.entryOrder.update({
      where: { entry_order_id: entryOrderId },
      data: {
        uploaded_documents: updatedDocuments
      }
    });

    // Log the deletion activity in Spanish
    await req.logEvent(
      'DOCUMENTO_ELIMINADO_ORDEN_ENTRADA',
      'OrdenDeEntrada',
      entryOrderId,
      `Se eliminó documento de la orden de entrada ${entryOrder.entry_order_no}`,
      null,
      {
        orden_entrada_id: entryOrderId,
        orden_entrada_no: entryOrder.entry_order_no,
        archivo_eliminado: decodedFilePath,
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting entry order document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
}

/**
 * Delete document from departure order
 */
async function deleteDepartureOrderDocument(req, res) {
  try {
    const { departureOrderId, filePath } = req.params;
    const userId = req.user?.id;

    const decodedFilePath = decodeURIComponent(filePath);

    const departureOrder = await prisma.departureOrder.findUnique({
      where: { departure_order_id: departureOrderId }
    });

    if (!departureOrder) {
      return res.status(404).json({
        success: false,
        message: 'Departure order not found'
      });
    }

    const deleteResult = await deleteDocument(decodedFilePath);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document from storage',
        error: deleteResult.error
      });
    }

    const updatedDocuments = (departureOrder.uploaded_documents || [])
      .filter(doc => doc.file_path !== decodedFilePath);

    await prisma.departureOrder.update({
      where: { departure_order_id: departureOrderId },
      data: {
        uploaded_documents: updatedDocuments
      }
    });

    // Log the deletion activity in Spanish
    await req.logEvent(
      'DOCUMENTO_ELIMINADO_ORDEN_SALIDA',
      'OrdenDeSalida',
      departureOrderId,
      `Se eliminó documento de la orden de salida ${departureOrder.departure_order_no}`,
      null,
      {
        orden_salida_id: departureOrderId,
        orden_salida_no: departureOrder.departure_order_no,
        archivo_eliminado: decodedFilePath,
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting departure order document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
}

/**
 * Delete document from product
 */
async function deleteProductDocument(req, res) {
  try {
    const { productId, filePath } = req.params;
    const userId = req.user?.id;

    const decodedFilePath = decodeURIComponent(filePath);

    const product = await prisma.product.findUnique({
      where: { product_id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const deleteResult = await deleteDocument(decodedFilePath);

    if (!deleteResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document from storage',
        error: deleteResult.error
      });
    }

    const updatedDocuments = (product.uploaded_documents || [])
      .filter(doc => doc.file_path !== decodedFilePath);

    await prisma.product.update({
      where: { product_id: productId },
      data: {
        uploaded_documents: updatedDocuments
      }
    });

    // Log the deletion activity in Spanish
    await req.logEvent(
      'DOCUMENTO_ELIMINADO_PRODUCTO',
      'Producto',
      productId,
      `Se eliminó documento del producto ${product.product_code} - ${product.name}`,
      null,
      {
        producto_id: productId,
        producto_codigo: product.product_code,
        producto_nombre: product.name,
        archivo_eliminado: decodedFilePath,
        usuario_id: userId
      }
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
}

/**
 * Download document
 */
async function downloadDocument(req, res) {
  try {
    const { entityType, entityId, documentType, fileName } = req.params;
    
    const filePath = `${entityType}/${entityId}/${documentType}/${fileName}`;
    const signedUrlResult = await getSignedUrl(filePath, 3600); // 1 hour expiry

    if (!signedUrlResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied',
        error: signedUrlResult.error
      });
    }

    // Redirect to the signed URL for download
    res.redirect(signedUrlResult.signed_url);

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document',
      error: error.message
    });
  }
}

/**
 * Get signed download URL
 */
async function getSignedDownloadUrl(req, res) {
  try {
    const { entityType, entityId, documentType, fileName } = req.params;
    const { expires_in = 3600 } = req.query; // Default 1 hour
    
    const filePath = `${entityType}/${entityId}/${documentType}/${fileName}`;
    const signedUrlResult = await getSignedUrl(filePath, parseInt(expires_in));

    if (!signedUrlResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied',
        error: signedUrlResult.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        signed_url: signedUrlResult.signed_url,
        expires_at: signedUrlResult.expires_at,
        file_path: filePath
      }
    });

  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download URL',
      error: error.message
    });
  }
}

/**
 * Bulk upload documents
 */
async function bulkUploadDocuments(req, res) {
  try {
    const { entity_mappings } = req.body; // Array of {entity_type, entity_id, document_type}
    const files = req.files;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    if (!entity_mappings || !Array.isArray(entity_mappings)) {
      return res.status(400).json({
        success: false,
        message: 'Entity mappings required'
      });
    }

    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mapping = entity_mappings[i] || entity_mappings[0]; // Fallback to first mapping

      const validation = validateFile(file.originalname, file.size);
      if (!validation.valid) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: validation.error
        });
        continue;
      }

      const uploadResult = await uploadDocument(
        file.buffer,
        file.originalname,
        mapping.entity_type,
        mapping.entity_id,
        mapping.document_type,
        userId
      );

      uploadResults.push({
        filename: file.originalname,
        entity_type: mapping.entity_type,
        entity_id: mapping.entity_id,
        ...uploadResult
      });
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload completed: ${uploadResults.filter(r => r.success).length} successful, ${uploadResults.filter(r => !r.success).length} failed`,
      data: {
        upload_results: uploadResults,
        successful_uploads: uploadResults.filter(r => r.success).length,
        failed_uploads: uploadResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk upload',
      error: error.message
    });
  }
}

/**
 * Bulk download documents as ZIP
 */
async function bulkDownloadDocuments(req, res) {
  try {
    const { entityType, entityId } = req.params;
    
    // This would require additional ZIP creation logic
    // For now, return the list of documents with signed URLs
    const documentsResult = await listDocuments(entityType, entityId);

    if (!documentsResult.success) {
      return res.status(404).json({
        success: false,
        message: 'No documents found',
        error: documentsResult.error
      });
    }

    // Generate signed URLs for all documents
    const documentsWithSignedUrls = await Promise.all(
      documentsResult.documents.map(async (doc) => {
        const signedUrlResult = await getSignedUrl(doc.file_path, 3600);
        return {
          ...doc,
          download_url: signedUrlResult.success ? signedUrlResult.signed_url : null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: `Found ${documentsWithSignedUrls.length} documents`,
      data: {
        entity_type: entityType,
        entity_id: entityId,
        documents: documentsWithSignedUrls
      }
    });

  } catch (error) {
    console.error('Error in bulk download:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to prepare bulk download',
      error: error.message
    });
  }
}

module.exports = {
  getEntryDocumentTypes,
  getDepartureDocumentTypes,
  uploadEntryOrderDocuments,
  uploadDepartureOrderDocuments,
  uploadProductDocuments,
  getEntryOrderDocuments,
  getDepartureOrderDocuments,
  getProductDocuments,
  deleteEntryOrderDocument,
  deleteDepartureOrderDocument,
  deleteProductDocument,
  downloadDocument,
  getSignedDownloadUrl,
  bulkUploadDocuments,
  bulkDownloadDocuments
}; 