require("module-alias/register");
const express = require("express");
const app = express();
const db = require("@/db");

// 2. Body parsing middleware **must** come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
const authRoutes = require("@/modules/auth/auth.route");
const organisationRoutes = require("@/modules/organisation/organisation.route");

// Mount your module routes
app.use("/auth", authRoutes);
app.use("/organisation", organisationRoutes);

// const indexRouter = require("@/routes");
// app.use("/", indexRouter);

app.get("/", (req, res) => {
  res.send("Hello world");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
