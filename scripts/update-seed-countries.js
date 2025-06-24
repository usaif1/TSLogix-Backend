const fs = require('fs');
const path = require('path');

/**
 * Update the seed file to use the REST Countries API instead of hardcoded countries
 */
async function updateSeedFile() {
  try {
    console.log("🔄 Updating seed file to use REST Countries API...");
    
    const seedFilePath = path.join(__dirname, '..', 'prisma', 'seed.js');
    
    // Read the current seed file
    let seedContent = fs.readFileSync(seedFilePath, 'utf8');
    
    // Find the countries section and replace it
    const oldCountriesSection = `    // Countries
    console.log("Creating countries...");
    await prisma.country.createMany({
      data: [
        { name: "Peru" },
        { name: "Ecuador" },
        { name: "Colombia" },
        { name: "Brazil" },
        { name: "Chile" },
        { name: "United States" },
        { name: "Mexico" },
        { name: "Argentina" },
      ],
      skipDuplicates: true,
    });
    console.log("✅ Countries created");`;
    
    const newCountriesSection = `    // Countries - Use external API to populate all world countries
    console.log("Creating countries from REST Countries API...");
    try {
      const { populateCountries } = require('../scripts/populate-countries');
      const result = await populateCountries();
      console.log(\`✅ Countries created: \${result.message}\`);
    } catch (error) {
      console.warn("⚠️  API failed, using backup country list...");
      // Fallback to essential countries for suppliers
      await prisma.country.createMany({
        data: [
          { name: "Peru" },
          { name: "Ecuador" },
          { name: "Colombia" },
          { name: "Brazil" },
          { name: "Chile" },
          { name: "United States" },
          { name: "Mexico" },
          { name: "Argentina" },
          { name: "China" },
          { name: "Germany" },
          { name: "France" },
          { name: "United Kingdom" },
          { name: "India" },
          { name: "Japan" },
          { name: "Canada" },
          { name: "Australia" },
        ],
        skipDuplicates: true,
      });
      console.log("✅ Backup countries created");
    }`;
    
    // Replace the old section with the new one
    if (seedContent.includes(oldCountriesSection)) {
      seedContent = seedContent.replace(oldCountriesSection, newCountriesSection);
      
      // Write the updated content back to the file
      fs.writeFileSync(seedFilePath, seedContent, 'utf8');
      
      console.log("✅ Seed file updated successfully!");
      console.log("📝 The seed file now uses the REST Countries API");
      console.log("🔄 Run 'npm run reset-db' to apply changes to a fresh database");
      
      return { success: true, message: "Seed file updated to use REST Countries API" };
    } else {
      console.log("⚠️  Could not find the old countries section in seed file");
      console.log("📝 The seed file may have already been updated or modified");
      
      return { success: false, message: "Could not find countries section to update" };
    }
    
  } catch (error) {
    console.error("❌ Error updating seed file:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateSeedFile()
    .then((result) => {
      console.log("\n🎯 Result:", JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Failed to update seed file:", error);
      process.exit(1);
    });
}

module.exports = { updateSeedFile }; 