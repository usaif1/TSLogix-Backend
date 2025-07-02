const express = require("express");
const multer = require("multer");
const documentController = require("./document.controller");

const router = express.Router();

// Configure multer for file upload (memory storage for direct Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Document type configuration endpoints
router.get("/document-types/entry", documentController.getEntryDocumentTypes);
router.get("/document-types/departure", documentController.getDepartureDocumentTypes);

// Entry Order document management
router.post("/entry-orders/:entryOrderId/upload", upload.array('documents', 10), documentController.uploadEntryOrderDocuments);
router.get("/entry-orders/:entryOrderId/documents", documentController.getEntryOrderDocuments);
router.delete("/entry-orders/:entryOrderId/documents/:filePath", documentController.deleteEntryOrderDocument);

// Departure Order document management  
router.post("/departure-orders/:departureOrderId/upload", upload.array('documents', 10), documentController.uploadDepartureOrderDocuments);
router.get("/departure-orders/:departureOrderId/documents", documentController.getDepartureOrderDocuments);
router.delete("/departure-orders/:departureOrderId/documents/:filePath", documentController.deleteDepartureOrderDocument);

// Product document management
router.post("/products/:productId/upload", upload.array('documents', 10), documentController.uploadProductDocuments);
router.get("/products/:productId/documents", documentController.getProductDocuments);
router.delete("/products/:productId/documents/:filePath", documentController.deleteProductDocument);

// Document access and sharing
router.get("/download/:entityType/:entityId/:documentType/:fileName", documentController.downloadDocument);
router.get("/signed-url/:entityType/:entityId/:documentType/:fileName", documentController.getSignedDownloadUrl);

// Bulk document operations
router.post("/bulk-upload", upload.array('documents', 50), documentController.bulkUploadDocuments);
router.get("/bulk-download/:entityType/:entityId", documentController.bulkDownloadDocuments);

module.exports = router; 