require("module-alias/register");
const express = require("express");
const cors = require("cors");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Configure CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://localhost:6969",
      "http://localhost:7070",
      "https://ts-logix.vercel.app",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// 2. Body parsing middleware **must** come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middleware
const authenticateToken = require("@/middlewares/authMiddleware");

// routes
const authRoutes = require("@/modules/auth/auth.route");
const organisationRoutes = require("@/modules/organisation/organisation.route");
// const processesRoutes = require("@/modules/processes/processes.route");
const maintenanceRoutes = require("@/modules/maintenance/maintenance.route");
const supplierRoutes = require("@/modules/supplier/supplier.route");
const productRoutes = require("@/modules/product/product.route");
const entryRoutes = require("@/modules/entry/entry.route");
const departureRoutes = require("@/modules/departure/departure.route");
const auditRoutes = require("@/modules/audit/audit.route");
const inventoryRoutes = require("@/modules/inventory/inventory.route");

// Mount your module routes
app.use("/auth", authRoutes);
app.use("/organisation", organisationRoutes);
// app.use("/processes", authenticateToken, processesRoutes);
app.use("/maintenance", authenticateToken, maintenanceRoutes);
app.use("/suppliers", authenticateToken, supplierRoutes);
app.use("/products", authenticateToken, productRoutes);
app.use("/entry", authenticateToken, entryRoutes);
app.use("/departure", authenticateToken, departureRoutes);
app.use("/audit", authenticateToken, auditRoutes);
app.use("/inventory-logs", authenticateToken, inventoryRoutes);
// const indexRouter = require("@/routes");
// app.use("/", indexRouter);

app.get("/", (req, res) => {
  res.send("Hello world");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
