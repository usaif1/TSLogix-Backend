const express = require("express");
const countryController = require("./country.controller");

const router = express.Router();

// ✅ Get all countries with search and pagination
router.get("/", countryController.getAllCountries);

// ✅ Search countries by name
router.get("/search", countryController.searchCountries);

// ✅ Get country statistics
router.get("/statistics", countryController.getCountryStatistics);

// ✅ NEW: Add a single country
router.post("/", countryController.createCountry);

// ✅ NEW: Bulk populate countries from API
router.post("/populate", countryController.populateCountries);

// ✅ NEW: Get a specific country by ID
router.get("/:country_id", countryController.getCountryById);

// ✅ NEW: Update a country
router.put("/:country_id", countryController.updateCountry);

// ✅ NEW: Delete a country
router.delete("/:country_id", countryController.deleteCountry);

module.exports = router; 