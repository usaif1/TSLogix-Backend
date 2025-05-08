const { assignPallets, getAllWarehouseCells, fetchWarehouses } = require("./warehouse.service");

async function allocatePallets(req, res) {
  const { warehouse_id, row, palletCount, product_id } = req.body;
  const user_id = req.user?.id || req.body.user_id;
  try {
    const slots = await assignPallets(
      warehouse_id,
      row,
      palletCount,
      product_id,
      user_id
    );
    return res.status(201).json({ message: "Pallets assigned", slots });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function listWarehouseCells(req, res) {
  try {
    const filter = {};
    if (req.query.warehouse_id) filter.warehouse_id = req.query.warehouse_id;
    const cells = await getAllWarehouseCells(filter);
    return res.status(200).json({ message: "Cells fetched", cells });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching cells", error: err.message });
  }
}

async function listWarehouses(req, res) {
  const list = await fetchWarehouses();
  res.json(list);
}

module.exports = { allocatePallets, listWarehouseCells, listWarehouses };
