const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

module.exports = {
  getAllCountries,
  getCountryStatistics,
  searchCountries
}; 