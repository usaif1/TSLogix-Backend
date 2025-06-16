const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSupplierAPIWithAuth() {
  try {
    console.log('🔐 Testing supplier API with client1 authentication...\n');
    
    // 1. Login as client1
    console.log('1. Logging in as client1...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      userId: 'client1',
      password: 'Client123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const userRole = loginResponse.data.data.role;
    console.log(`✅ Login successful! Role: ${userRole}`);
    
    // 2. Test supplier API with authentication
    console.log('\n2. Testing supplier API...');
    const supplierResponse = await axios.get(`${BASE_URL}/suppliers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!supplierResponse.data.success) {
      console.log('❌ Supplier API failed:', supplierResponse.data.message);
      return;
    }
    
    const suppliers = supplierResponse.data.data;
    const meta = supplierResponse.data.meta;
    
    console.log('✅ Supplier API response:');
    console.log(`   • Total suppliers returned: ${suppliers.length}`);
    console.log(`   • Filtered by role: ${meta.filtered_by_role}`);
    console.log(`   • User ID: ${meta.user_id}`);
    console.log(`   • Search applied: ${meta.search_applied}`);
    
    if (suppliers.length > 0) {
      console.log('\n📋 Suppliers visible to client1:');
      suppliers.forEach((supplier, index) => {
        console.log(`   ${index + 1}. ${supplier.company_name || supplier.name}`);
      });
    }
    
    // 3. Expected result validation
    console.log('\n🧪 Validation:');
    if (userRole === 'CLIENT' && suppliers.length === 5) {
      console.log('✅ SUCCESS: Client filtering is working correctly (5 suppliers)');
    } else if (userRole === 'CLIENT' && suppliers.length === 15) {
      console.log('❌ FAILURE: Client filtering is NOT working (showing all 15 suppliers)');
    } else {
      console.log(`⚠️ UNEXPECTED: Role=${userRole}, Suppliers=${suppliers.length}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Check if axios is available
try {
  require('axios');
  testSupplierAPIWithAuth();
} catch (error) {
  console.log('❌ axios not found. Installing...');
  console.log('Please run: npm install axios');
  console.log('Then run this script again.');
} 