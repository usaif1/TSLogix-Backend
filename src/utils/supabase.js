const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// ✅ Enhanced error handling for environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend

if (!supabaseUrl) {
  throw new Error(`
🔴 SUPABASE_URL environment variable is required!
📋 Please create a .env file in your project root with:
   SUPABASE_URL=your_supabase_project_url_here
   
📖 See SUPABASE_SETUP_INSTRUCTIONS.md for complete setup guide.
  `);
}

if (!supabaseServiceKey) {
  throw new Error(`
🔴 SUPABASE_SERVICE_ROLE_KEY environment variable is required!
📋 Please add to your .env file:
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
⚠️  Use the SERVICE_ROLE key, NOT the anon key!
📖 See SUPABASE_SETUP_INSTRUCTIONS.md for complete setup guide.
  `);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upload document to Supabase storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original filename
 * @param {string} entityType - 'entry-order', 'departure-order', 'product'
 * @param {string} entityId - Entity ID (order ID, product ID)
 * @param {string} documentType - Document type (e.g., 'PACKING_LIST', 'FACTURA', etc.)
 * @param {string} uploadedBy - User ID who uploaded
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
async function uploadDocument(fileBuffer, fileName, entityType, entityId, documentType, uploadedBy) {
  try {
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${entityType}/${entityId}/${documentType}/${timestamp}_${fileName}`;

    // Upload file to Supabase storage bucket "order"
    const { data, error } = await supabase.storage
      .from('order')
      .upload(uniqueFileName, fileBuffer, {
        contentType: getContentType(fileExtension),
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('order')
      .getPublicUrl(uniqueFileName);

    return {
      success: true,
      file_path: data.path,
      public_url: urlData.publicUrl,
      file_name: fileName,
      original_name: fileName,
      file_size: fileBuffer.length,
      content_type: getContentType(fileExtension),
      document_type: documentType,
      uploaded_by: uploadedBy,
      uploaded_at: new Date().toISOString(),
      entity_type: entityType,
      entity_id: entityId
    };
  } catch (error) {
    console.error('Document upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete document from Supabase storage
 * @param {string} filePath - Path of file to delete
 * @returns {Promise<Object>} Delete result
 */
async function deleteDocument(filePath) {
  try {
    const { error } = await supabase.storage
      .from('order')
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Document deleted successfully'
    };
  } catch (error) {
    console.error('Document delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get signed URL for private document access
 * @param {string} filePath - Path of file
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns {Promise<Object>} Signed URL result
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabase.storage
      .from('order')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return {
      success: true,
      signed_url: data.signedUrl,
      expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString()
    };
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List documents for an entity
 * @param {string} entityType - 'entry-order', 'departure-order', 'product'
 * @param {string} entityId - Entity ID
 * @returns {Promise<Object>} List of documents
 */
async function listDocuments(entityType, entityId) {
  try {
    const { data, error } = await supabase.storage
      .from('order')
      .list(`${entityType}/${entityId}`, {
        limit: 100,
        offset: 0
      });

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    // Get public URLs for each document
    const documentsWithUrls = data.map(file => {
      const { data: urlData } = supabase.storage
        .from('order')
        .getPublicUrl(`${entityType}/${entityId}/${file.name}`);

      return {
        name: file.name,
        size: file.metadata?.size || 0,
        updated_at: file.updated_at,
        public_url: urlData.publicUrl,
        file_path: `${entityType}/${entityId}/${file.name}`
      };
    });

    return {
      success: true,
      documents: documentsWithUrls
    };
  } catch (error) {
    console.error('Document list error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get content type based on file extension
 * @param {string} extension - File extension
 * @returns {string} Content type
 */
function getContentType(extension) {
  const contentTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'txt': 'text/plain',
    'csv': 'text/csv'
  };

  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Validate file type and size
 * @param {string} fileName - Original filename
 * @param {number} fileSize - File size in bytes
 * @returns {Object} Validation result
 */
function validateFile(fileName, fileSize) {
  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'csv'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const extension = fileName.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} not allowed. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`
    };
  }

  return {
    valid: true
  };
}

/**
 * Test Supabase connection and bucket access
 * @returns {Promise<Object>} Test result
 */
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📍 Supabase URL:', supabaseUrl);
    console.log('🔑 Service Key configured:', !!supabaseServiceKey);
    
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Buckets access failed: ${bucketsError.message}`);
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Test 2: Check if 'order' bucket exists
    const orderBucket = buckets.find(b => b.name === 'order');
    if (!orderBucket) {
      throw new Error('Order bucket not found in available buckets');
    }
    
    console.log('✅ Order bucket found:', orderBucket);
    
    // Test 3: Try to list files in order bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('order')
      .list('', { limit: 1 });
    
    if (filesError) {
      throw new Error(`Order bucket access failed: ${filesError.message}`);
    }
    
    console.log('📁 Order bucket accessible, files:', files.length);
    
    return {
      success: true,
      message: 'Supabase connection test passed',
      buckets: buckets.map(b => b.name),
      orderBucketFound: true,
      orderBucketAccessible: true
    };
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      success: false,
      error: error.message,
      details: {
        supabaseUrl: supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0
      }
    };
  }
}

module.exports = {
  uploadDocument,
  deleteDocument,
  getSignedUrl,
  listDocuments,
  validateFile,
  testSupabaseConnection,
  supabase
}; 