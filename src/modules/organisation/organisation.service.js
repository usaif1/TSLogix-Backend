// src/modules/organisation/organisation.service.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Creates a new organisation
 * @param {string} name - Organisation name
 * @param {object} address - JSON object for the address (optional)
 * @param {string} tax_id - Tax ID (optional)
 * @returns {object} The created organisation
 */
async function createOrganisation(name, address = null, tax_id = null) {
  try {
    const newOrganisation = await prisma.organisation.create({
      data: {
        name,
        address,
        tax_id,
      },
    });
    return newOrganisation;
  } catch (error) {
    throw new Error("Error creating organisation: " + error.message);
  }
}

/**
 * Fetches all organisations
 * @returns {array} List of all organisations
 */
async function fetchAllOrganisations() {
  try {
    return await prisma.organisation.findMany();
  } catch (error) {
    throw new Error("Error fetching organisations: " + error.message);
  }
}

module.exports = {
  createOrganisation,
  fetchAllOrganisations,
};
