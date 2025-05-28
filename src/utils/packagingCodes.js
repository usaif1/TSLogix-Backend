// utils/packagingCodes.js
const { PackagingType, PackagingStatus } = require("@prisma/client");

const PACKAGING_CODE_MAP = {
  [PackagingType.PALET]: {
    [PackagingStatus.NORMAL]: 30,
    [PackagingStatus.PARTIALLY_DAMAGED]: 40,
    [PackagingStatus.DAMAGED]: 50,
  },
  [PackagingType.BOX]: {
    [PackagingStatus.NORMAL]: 31,
    [PackagingStatus.PARTIALLY_DAMAGED]: 41,
    [PackagingStatus.DAMAGED]: 51,
  },
  [PackagingType.SACK]: {
    [PackagingStatus.NORMAL]: 32,
    [PackagingStatus.PARTIALLY_DAMAGED]: 42,
    [PackagingStatus.DAMAGED]: 52,
  },
  [PackagingType.UNIT]: {
    [PackagingStatus.NORMAL]: 33,
    [PackagingStatus.PARTIALLY_DAMAGED]: 43,
    [PackagingStatus.DAMAGED]: 53,
  },
  [PackagingType.PACK]: {
    [PackagingStatus.NORMAL]: 34,
    [PackagingStatus.PARTIALLY_DAMAGED]: 44,
    [PackagingStatus.DAMAGED]: 54,
  },
  [PackagingType.BARRELS]: {
    [PackagingStatus.NORMAL]: 35,
    [PackagingStatus.PARTIALLY_DAMAGED]: 45,
    [PackagingStatus.DAMAGED]: 55,
  },
  [PackagingType.BUNDLE]: {
    [PackagingStatus.NORMAL]: 36,
    [PackagingStatus.PARTIALLY_DAMAGED]: 46,
    [PackagingStatus.DAMAGED]: 56,
  },
  [PackagingType.OTHER]: {
    [PackagingStatus.NORMAL]: 37,
    [PackagingStatus.PARTIALLY_DAMAGED]: 47,
    [PackagingStatus.DAMAGED]: 57,
  },
};

function getPackagingCode(packagingType, packagingStatus) {
  return PACKAGING_CODE_MAP[packagingType]?.[packagingStatus] || 37; // Default to OTHER-NORMAL
}

function getPackagingTypeAndStatus(code) {
  for (const [type, statusMap] of Object.entries(PACKAGING_CODE_MAP)) {
    for (const [status, codeValue] of Object.entries(statusMap)) {
      if (codeValue === code) {
        return { packagingType: type, packagingStatus: status };
      }
    }
  }
  return { packagingType: PackagingType.OTHER, packagingStatus: PackagingStatus.NORMAL };
}

module.exports = {
  getPackagingCode,
  getPackagingTypeAndStatus,
  PACKAGING_CODE_MAP,
};