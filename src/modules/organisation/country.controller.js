const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Import the population script
const { populateCountries: populateCountriesScript, populateCountriesFromBackup } = require("../../../scripts/populate-countries");

/**
 * Get all countries with search and pagination
 */
async function getAllCountries(req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    // Build where conditions
    const whereConditions = {};
    
    if (search) {
      whereConditions.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get countries with pagination
    const [countries, totalCount] = await Promise.all([
      prisma.country.findMany({
        where: whereConditions,
        orderBy: { name: 'asc' },
        skip: skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              Supplier: true
            }
          }
        }
      }),
      prisma.country.count({
        where: whereConditions
      })
    ]);
    
    const totalPages = Math.ceil(totalCount / limitNum);
    
    res.status(200).json({
      success: true,
      message: "Countries fetched successfully",
      data: countries,
      pagination: {
        current_page: pageNum,
        total_pages: totalPages,
        total_count: totalCount,
        limit: limitNum,
        has_next: pageNum < totalPages,
        has_prev: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error in getAllCountries controller:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching countries",
      error: error.message,
    });
  }
}

/**
 * Get country statistics
 */
async function getCountryStatistics(req, res) {
  try {
    const [totalCountries, countriesWithSuppliers, topCountriesBySuppliers] = await Promise.all([
      prisma.country.count(),
      prisma.country.count({
        where: {
          Supplier: {
            some: {}
          }
        }
      }),
      prisma.country.findMany({
        include: {
          _count: {
            select: {
              Supplier: true
            }
          }
        },
        orderBy: {
          Supplier: {
            _count: 'desc'
          }
        },
        take: 10
      })
    ]);
    
    const statistics = {
      total_countries: totalCountries,
      countries_with_suppliers: countriesWithSuppliers,
      countries_without_suppliers: totalCountries - countriesWithSuppliers,
      top_countries_by_suppliers: topCountriesBySuppliers.map(country => ({
        country_id: country.country_id,
        name: country.name,
        supplier_count: country._count.Supplier
      }))
    };
    
    res.status(200).json({
      success: true,
      message: "Country statistics fetched successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error in getCountryStatistics controller:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching country statistics",
      error: error.message,
    });
  }
}

/**
 * Search countries by name
 */
async function searchCountries(req, res) {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long"
      });
    }
    
    const countries = await prisma.country.findMany({
      where: {
        name: {
          contains: q.trim(),
          mode: 'insensitive'
        }
      },
      orderBy: { name: 'asc' },
      take: 20, // Limit to 20 results for search
      select: {
        country_id: true,
        name: true,
        _count: {
          select: {
            Supplier: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: `Found ${countries.length} countries matching "${q}"`,
      data: countries,
      search_query: q
    });
  } catch (error) {
    console.error("Error in searchCountries controller:", error);
    res.status(500).json({
      success: false,
      message: "Error searching countries",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Create a single country
 */
async function createCountry(req, res) {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Country name is required"
      });
    }
    
    // Check if country already exists
    const existingCountry = await prisma.country.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });
    
    if (existingCountry) {
      return res.status(409).json({
        success: false,
        message: "Country already exists",
        data: existingCountry
      });
    }
    
    // Create the country
    const newCountry = await prisma.country.create({
      data: {
        name: name.trim()
      },
      include: {
        _count: {
          select: {
            Supplier: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: "Country created successfully",
      data: newCountry
    });
  } catch (error) {
    console.error("Error in createCountry controller:", error);
    res.status(500).json({
      success: false,
      message: "Error creating country",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Populate countries from external API
 */
async function populateCountries(req, res) {
  try {
    console.log("🌍 Starting countries population from API...");
    
    // Use the existing population script
    const result = await populateCountriesScript();
    
    res.status(200).json({
      success: true,
      message: "Countries populated successfully",
      data: result
    });
  } catch (error) {
    console.error("Error in populateCountries controller:", error);
    
    // Try fallback method
    try {
      console.log("🔄 Trying fallback method...");
      const fallbackResult = await populateCountriesFromBackup();
      
      res.status(200).json({
        success: true,
        message: "Countries populated from backup list",
        data: fallbackResult,
        note: "Used backup list due to API error"
      });
    } catch (fallbackError) {
      console.error("Error in fallback population:", fallbackError);
      res.status(500).json({
        success: false,
        message: "Error populating countries",
        error: error.message,
        fallback_error: fallbackError.message
      });
    }
  }
}

/**
 * ✅ NEW: Get a specific country by ID
 */
async function getCountryById(req, res) {
  try {
    const { country_id } = req.params;
    
    const country = await prisma.country.findUnique({
      where: { country_id },
      include: {
        Supplier: {
          select: {
            supplier_id: true,
            company_name: true,
            name: true,
            contact_person: true,
            contact_no: true
          }
        },
        _count: {
          select: {
            Supplier: true
          }
        }
      }
    });
    
    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Country fetched successfully",
      data: country
    });
  } catch (error) {
    console.error("Error in getCountryById controller:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching country",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Update a country
 */
async function updateCountry(req, res) {
  try {
    const { country_id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Country name is required"
      });
    }
    
    // Check if country exists
    const existingCountry = await prisma.country.findUnique({
      where: { country_id }
    });
    
    if (!existingCountry) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }
    
    // Check if another country with the same name exists
    const duplicateCountry = await prisma.country.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        },
        country_id: {
          not: country_id
        }
      }
    });
    
    if (duplicateCountry) {
      return res.status(409).json({
        success: false,
        message: "Another country with this name already exists"
      });
    }
    
    // Update the country
    const updatedCountry = await prisma.country.update({
      where: { country_id },
      data: {
        name: name.trim()
      },
      include: {
        _count: {
          select: {
            Supplier: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      data: updatedCountry
    });
  } catch (error) {
    console.error("Error in updateCountry controller:", error);
    res.status(500).json({
      success: false,
      message: "Error updating country",
      error: error.message,
    });
  }
}

/**
 * ✅ NEW: Delete a country
 */
async function deleteCountry(req, res) {
  try {
    const { country_id } = req.params;
    
    // Check if country exists
    const existingCountry = await prisma.country.findUnique({
      where: { country_id },
      include: {
        _count: {
          select: {
            Supplier: true
          }
        }
      }
    });
    
    if (!existingCountry) {
      return res.status(404).json({
        success: false,
        message: "Country not found"
      });
    }
    
    // Check if country has suppliers
    if (existingCountry._count.Supplier > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete country. It has ${existingCountry._count.Supplier} associated suppliers.`,
        data: {
          country: existingCountry.name,
          supplier_count: existingCountry._count.Supplier
        }
      });
    }
    
    // Delete the country
    await prisma.country.delete({
      where: { country_id }
    });
    
    res.status(200).json({
      success: true,
      message: "Country deleted successfully",
      data: {
        deleted_country: existingCountry.name,
        country_id: country_id
      }
    });
  } catch (error) {
    console.error("Error in deleteCountry controller:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting country",
      error: error.message,
    });
  }
}

module.exports = {
  getAllCountries,
  getCountryStatistics,
  searchCountries,
  createCountry,
  populateCountries,
  getCountryById,
  updateCountry,
  deleteCountry
}; 