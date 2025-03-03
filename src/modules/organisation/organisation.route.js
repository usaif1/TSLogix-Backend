// src/modules/organisation/organisation.route.js
const express = require("express");
const organisationController = require("./organisation.controller");

const router = express.Router();

// Route to add a new organisation
router.post("/add", organisationController.addOrganisation);

// Route to get all organisations
router.get("/all", organisationController.getAllOrganisations);

module.exports = router;
