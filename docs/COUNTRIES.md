# Countries Database Population

This document explains how to populate your TSLogix database with all countries in the world using external APIs.

## Overview

Your database now contains **250 countries** from around the world, automatically fetched from the [REST Countries API](https://restcountries.com/). This replaces the previous hardcoded list of 8 countries.

## Features

### ✅ **Completed**
- **250 Countries**: All UN-recognized countries and territories
- **Free API**: Uses REST Countries API (no API key required)
- **Automatic Fallback**: Backup list if API is unavailable
- **Batch Processing**: Efficient database insertion
- **Duplicate Prevention**: Skips existing countries
- **Error Handling**: Robust error handling and logging

### 🔄 **Available Commands**

```bash
# Populate countries from API (run once)
npm run populate-countries

# View database with all countries
npm run show-db

# Reset database (will repopulate countries via seed)
npm run reset-db
```

## API Information

### REST Countries API
- **URL**: https://restcountries.com/v3.1/all
- **Cost**: Free (no API key required)
- **Rate Limits**: Reasonable for our use case
- **Data**: Country names, codes, regions, population, capitals
- **Reliability**: High uptime, maintained by community

### Data Retrieved
For each country, we fetch:
- **Common Name**: Most widely used country name
- **Official Name**: Official government name
- **Country Codes**: ISO 2-letter and 3-letter codes
- **Region/Subregion**: Geographic classification
- **Population**: Current population estimate
- **Capital**: Capital city
- **Flag**: Unicode flag emoji

*Note: Currently only the country name is stored in the database. Additional fields can be added by extending the Country model.*

## Database Schema

Current Country model:
```prisma
model Country {
  country_id String     @id @default(uuid())
  name       String     @unique
  Supplier   Supplier[]
  @@map("countries")
}
```

### Potential Extensions
To store additional country data, you could extend the model:
```prisma
model Country {
  country_id String     @id @default(uuid())
  name       String     @unique
  
  // Optional additional fields
  official_name String?
  country_code_2 String? // ISO 2-letter code (US, BR, etc.)
  country_code_3 String? // ISO 3-letter code (USA, BRA, etc.)
  region String?         // Europe, Asia, Americas, etc.
  subregion String?      // Western Europe, South America, etc.
  population BigInt?     // Current population
  capital String?        // Capital city
  metadata Json?         // Store all additional data as JSON
  
  Supplier   Supplier[]
  @@map("countries")
}
```

## Usage Examples

### 1. **Initial Population**
```bash
npm run populate-countries
```
Output:
```
🌍 Fetching countries from REST Countries API...
📊 Found 250 countries from API
🗄️  Currently have 8 countries in database
➕ Will add 242 new countries to database
📝 Inserted batch 1 - 50/242 countries
📝 Inserted batch 2 - 100/242 countries
...
🎉 Countries population completed!
📊 Final statistics:
   - Total countries from API: 250
   - Countries before: 8
   - New countries added: 242
   - Total countries now: 250
```

### 2. **Verify Population**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Count total countries
const count = await prisma.country.count();
console.log('Total countries:', count); // 250

// Find specific countries
const majorCountries = await prisma.country.findMany({
  where: {
    name: { in: ['United States', 'Brazil', 'Germany', 'Japan'] }
  }
});
```

### 3. **Search Countries**
```javascript
// Search by name
const searchResults = await prisma.country.findMany({
  where: {
    name: {
      contains: 'stan', // Afghanistan, Kazakhstan, etc.
      mode: 'insensitive'
    }
  },
  orderBy: { name: 'asc' }
});
```

## Troubleshooting

### Common Issues

1. **Network Error**
   ```
   🌐 Network error: Please check your internet connection
   ```
   **Solution**: Check internet connection and try again

2. **API Timeout**
   ```
   ⏱️  Request timeout: API took too long to respond
   ```
   **Solution**: The script will automatically fall back to backup countries

3. **Countries Already Exist**
   ```
   ✅ All countries are already in the database!
   ```
   **Solution**: This is normal - the script prevents duplicates

### Manual Verification

Check your database directly:
```sql
-- Count countries
SELECT COUNT(*) as total_countries FROM countries;

-- List first 10 countries
SELECT name FROM countries ORDER BY name LIMIT 10;

-- Search for specific country
SELECT * FROM countries WHERE name ILIKE '%united%';
```

## Alternative APIs

If REST Countries API becomes unavailable, you can modify the script to use:

1. **World Bank API**: https://api.worldbank.org/v2/country
2. **GeoNames API**: http://api.geonames.org/countryInfoJSON
3. **Country.io API**: http://country.io/names.json

## Maintenance

### Updating Countries
Countries rarely change, but when they do:

1. **New Countries**: Run `npm run populate-countries` again
2. **Name Changes**: Update manually in database
3. **Full Refresh**: Delete all countries and repopulate

### Monitoring
- Check API status: https://restcountries.com/
- Monitor for new countries/territories
- Update backup list if needed

## Integration with Suppliers

Countries are linked to suppliers in your system:
```javascript
// Create supplier with country
const supplier = await prisma.supplier.create({
  data: {
    company_name: "Global Pharma Inc",
    country: {
      connect: { name: "United States" }
    }
    // ... other fields
  }
});

// Find suppliers by country
const usSuppliers = await prisma.supplier.findMany({
  where: {
    country: { name: "United States" }
  },
  include: { country: true }
});
```

## Performance Notes

- **Initial Load**: ~5-10 seconds for 250 countries
- **Batch Size**: 50 countries per batch (optimized)
- **Memory Usage**: Minimal (streaming approach)
- **Database Impact**: Negligible for 250 records

## Future Enhancements

1. **Country Metadata**: Store additional country information
2. **Flag Images**: Download and store country flag images
3. **Currency Data**: Add currency information
4. **Time Zones**: Store timezone information
5. **Languages**: Store official languages
6. **Calling Codes**: Store international calling codes

---

**Last Updated**: January 2025  
**API Version**: REST Countries v3.1  
**Countries Count**: 250  
**Status**: ✅ Active and Populated 