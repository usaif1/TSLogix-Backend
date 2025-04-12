const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createProduct = async (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      product_line_id: data.product_line_id,
      group_id: data.group_id,
      active_state_id: data.active_state_id,
      humidity: data.humidity,
      manufacturer: data.manufacturer,
      storage_conditions: data.storage_conditions,
      temperature_range_id: data.temperature_range_id,
    },
    include: {
      product_line: true,
      group: true,
      temperature_range: true,
      active_state: { select: { name: true } },
    },
  });
};

const getAllProducts = async (filters = {}) => {
  const where = {};
  if (filters.product_line_id) {
    where.product_line_id = filters.product_line_id;
  }
  if (filters.group_id) {
    where.group_id = filters.group_id;
  }
  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: "insensitive",
    };
  }

  return prisma.product.findMany({
    where,
    include: {
      product_line: true,
      group: true,
      temperature_range: true,
      active_state: { select: { name: true } },
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { product_id: id },
    include: {
      product_line: true,
      group: true,
      temperature_range: true,
      active_state: { select: { name: true } },
    },
  });
};

const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { product_id: id },
    data,
    include: {
      product_line: true,
      group: true,
      temperature_range: true,
      active_state: { select: { name: true } },
    },
  });
};

const deleteProduct = async (id) => {
  return prisma.product.delete({ where: { product_id: id } });
};

const getProductLines = async () => {
  return prisma.productLine.findMany();
};

const getGroups = async () => {
  return prisma.groupName.findMany();
};

const getTemperatureRanges = async () => {
  return prisma.temperatureRange.findMany();
};

const getFormFields = async () => {
  try {
    const [productLines, groups, temperatureRanges] = await Promise.all([
      getProductLines(),
      getGroups(),
      getTemperatureRanges(),
    ]);

    return {
      productLines,
      groups,
      temperatureRanges,
    };
  } catch (error) {
    throw new Error("Failed to fetch form fields");
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductLines,
  getGroups,
  getTemperatureRanges,
  getFormFields,
};
