// src/modules/organisation/organisation.controller.js
const organisationService = require("./organisation.service");

// Add a new organisation
async function addOrganisation(req, res) {
  const { name, address, tax_id } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Organisation name is required" });
  }

  try {
    const newOrganisation = await organisationService.createOrganisation(
      name,
      address,
      tax_id
    );
    return res
      .status(201)
      .json({ message: "Organisation created", organisation: newOrganisation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

// Get all organisations
async function getAllOrganisations(req, res) {
  try {
    const organisations = await organisationService.fetchAllOrganisations();
    return res.status(200).json(organisations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  addOrganisation,
  getAllOrganisations,
};
