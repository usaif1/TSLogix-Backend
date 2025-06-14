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
    
    const allCells = await getAllWarehouseCells(filter);
    
    // Apply additional filters based on query parameters
    let filteredCells = allCells;
    
    // Filter by assignment status
    if (req.query.assigned_to_client !== undefined) {
      const isAssigned = req.query.assigned_to_client === 'true';
      filteredCells = filteredCells.filter(cell => cell.is_assigned_to_client === isAssigned);
    }
    
    // Filter by cell status
    if (req.query.status) {
      filteredCells = filteredCells.filter(cell => cell.status === req.query.status);
    }
    
    // Filter by cell role
    if (req.query.cell_role) {
      filteredCells = filteredCells.filter(cell => cell.cell_role === req.query.cell_role);
    }
    
    // Get summary statistics
    const summary = {
      total_cells: allCells.length,
      filtered_cells: filteredCells.length,
      assigned_to_clients: allCells.filter(cell => cell.is_assigned_to_client).length,
      unassigned_cells: allCells.filter(cell => !cell.is_assigned_to_client).length,
      available_cells: allCells.filter(cell => cell.status === 'AVAILABLE').length,
      occupied_cells: allCells.filter(cell => cell.status === 'OCCUPIED').length,
      cells_with_inventory: allCells.filter(cell => cell.has_inventory).length
    };
    
    return res.status(200).json({ 
      success: true,
      message: "Cells fetched successfully", 
      data: filteredCells,
      summary
    });
  } catch (err) {
    return res
      .status(500)
      .json({ 
        success: false,
        message: "Error fetching cells", 
        error: err.message 
      });
  }
}

async function listWarehouses(req, res) {
  const list = await fetchWarehouses();
  res.json(list);
}

module.exports = { allocatePallets, listWarehouseCells, listWarehouses };
