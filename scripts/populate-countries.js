const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

/**
 * Fetch all countries from REST Countries API and populate the database
 * API Documentation: https://restcountries.com/
 */
async function populateCountries() {
  try {
    console.log("🌍 Fetching countries from REST Countries API...");
    
    // Fetch all countries with specific fields to reduce payload size
    const response = await axios.get("https://restcountries.com/v3.1/all", {
      params: {
        fields: "name,cca2,cca3,region,subregion,population,capital,flag"
      },
      timeout: 30000 // 30 second timeout
    });

    const countries = response.data;
    console.log(`📊 Found ${countries.length} countries from API`);

    // Check current countries in database
    const existingCountries = await prisma.country.findMany({
      select: { name: true }
    });
    
    const existingCountryNames = new Set(existingCountries.map(c => c.name));
    console.log(`🗄️  Currently have ${existingCountries.length} countries in database`);

    // Prepare country data for insertion
    const countryData = [];
    
    for (const country of countries) {
      // Get the common name (most widely used name)
      const countryName = country.name?.common;
      
      if (!countryName) {
        console.warn(`⚠️  Skipping country with missing name:`, country);
        continue;
      }

      // Skip if country already exists
      if (existingCountryNames.has(countryName)) {
        continue;
      }

      countryData.push({
        name: countryName
        // Note: Additional metadata (codes, region, population, etc.) 
        // could be stored if Country model is extended with metadata field
      });
    }

    console.log(`➕ Will add ${countryData.length} new countries to database`);

    if (countryData.length === 0) {
      console.log("✅ All countries are already in the database!");
      return {
        total_countries: countries.length,
        existing_countries: existingCountries.length,
        new_countries: 0,
        message: "No new countries to add"
      };
    }

    // Insert countries in batches to avoid overwhelming the database
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < countryData.length; i += batchSize) {
      const batch = countryData.slice(i, i + batchSize);
      
      try {
        await prisma.country.createMany({
          data: batch,
          skipDuplicates: true
        });
        
        insertedCount += batch.length;
        console.log(`📝 Inserted batch ${Math.ceil((i + 1) / batchSize)} - ${insertedCount}/${countryData.length} countries`);
      } catch (batchError) {
        console.error(`❌ Error inserting batch starting at index ${i}:`, batchError);
        
        // Try inserting individually if batch fails
        for (const countryItem of batch) {
          try {
            await prisma.country.create({
              data: countryItem
            });
            insertedCount++;
          } catch (individualError) {
            console.error(`❌ Failed to insert country "${countryItem.name}":`, individualError.message);
          }
        }
      }
    }

    // Get final count
    const finalCount = await prisma.country.count();

    console.log("🎉 Countries population completed!");
    console.log(`📊 Final statistics:`);
    console.log(`   - Total countries from API: ${countries.length}`);
    console.log(`   - Countries before: ${existingCountries.length}`);
    console.log(`   - New countries added: ${insertedCount}`);
    console.log(`   - Total countries now: ${finalCount}`);

    return {
      total_countries_from_api: countries.length,
      existing_countries: existingCountries.length,
      new_countries_added: insertedCount,
      total_countries_now: finalCount,
      message: `Successfully added ${insertedCount} new countries`
    };

  } catch (error) {
    console.error("❌ Error populating countries:", error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("🌐 Network error: Please check your internet connection");
    } else if (error.response) {
      console.error(`🔥 API Error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error("⏱️  Request timeout: API took too long to respond");
    }
    
    throw error;
  }
}

/**
 * Alternative function to populate countries from a backup static list
 * In case the API is down or unavailable
 */
async function populateCountriesFromBackup() {
  console.log("🔄 Using backup country list...");
  
  // Top 50 most common countries for international business
  const backupCountries = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
    "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia",
    "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia",
    "Czech Republic", "Denmark", "Ecuador", "Egypt", "Estonia", "Finland",
    "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras",
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
    "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
    "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Mexico",
    "Morocco", "Netherlands", "New Zealand", "Nicaragua", "Norway", "Pakistan",
    "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore", "Slovakia",
    "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden",
    "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates",
    "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam"
  ];

  const existingCountries = await prisma.country.findMany({
    select: { name: true }
  });
  
  const existingCountryNames = new Set(existingCountries.map(c => c.name));
  
  const newCountries = backupCountries
    .filter(name => !existingCountryNames.has(name))
    .map(name => ({ name }));

  if (newCountries.length > 0) {
    await prisma.country.createMany({
      data: newCountries,
      skipDuplicates: true
    });
    
    console.log(`✅ Added ${newCountries.length} countries from backup list`);
  } else {
    console.log("✅ All backup countries already exist in database");
  }

  return {
    backup_countries: backupCountries.length,
    new_countries_added: newCountries.length,
    message: `Added ${newCountries.length} countries from backup list`
  };
}

/**
 * Main function with fallback mechanism
 */
async function main() {
  try {
    console.log("🚀 Starting country population process...");
    
    // Try API first
    try {
      const result = await populateCountries();
      console.log("✅ Successfully populated countries from API");
      return result;
    } catch (apiError) {
      console.warn("⚠️  API failed, falling back to backup list...");
      console.warn("API Error:", apiError.message);
      
      // Fallback to backup list
      const backupResult = await populateCountriesFromBackup();
      console.log("✅ Successfully populated countries from backup");
      return backupResult;
    }
    
  } catch (error) {
    console.error("❌ Failed to populate countries:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n🎯 Final Result:", JSON.stringify(result, null, 2));
      console.log("\n🌍 Country population completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  populateCountries,
  populateCountriesFromBackup,
  main
}; 