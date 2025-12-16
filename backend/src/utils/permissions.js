/**
 * Permission definitions for each role
 */
const PERMISSIONS = {
  SUPER_ADMIN: {
    viewAllFarms: true,
    createFarm: true,
    editFarm: true,
    deleteFarm: true,
    viewDashboard: true,
    viewSensors: true,
    viewHistory: true,
    controlActuators: true,
    viewAutomation: true,
    createAutomation: true,
    editAutomation: true,
    deleteAutomation: true,
    exportData: true,
    addDevice: true,
    editDevice: true,
    deleteDevice: true,
    addSensor: true,
    editSensor: true,
    deleteSensor: true,
    addActuator: true,
    editActuator: true,
    deleteActuator: true,
    inviteUsers: true,
    removeUsers: true,
    viewTeam: true,
    manageCustomers: true,
    systemSettings: true
  },
  FARM_OWNER: {
    viewAllFarms: false,
    createFarm: false,
    editFarm: true,
    deleteFarm: false,
    viewDashboard: true,
    viewSensors: true,
    viewHistory: true,
    controlActuators: true,
    viewAutomation: true,
    createAutomation: true,
    editAutomation: true,
    deleteAutomation: true,
    exportData: true,
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    addSensor: false,
    editSensor: false,
    deleteSensor: false,
    addActuator: false,
    editActuator: false,
    deleteActuator: false,
    inviteUsers: true,
    removeUsers: true,
    viewTeam: true,
    manageCustomers: false,
    systemSettings: false
  },
  MANAGER: {
    viewAllFarms: false,
    createFarm: false,
    editFarm: false,
    deleteFarm: false,
    viewDashboard: true,
    viewSensors: true,
    viewHistory: true,
    controlActuators: true,
    viewAutomation: true,
    createAutomation: true,
    editAutomation: true,
    deleteAutomation: false,
    exportData: true,
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    addSensor: false,
    editSensor: false,
    deleteSensor: false,
    addActuator: false,
    editActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    removeUsers: false,
    viewTeam: true,
    manageCustomers: false,
    systemSettings: false
  },
  OPERATOR: {
    viewAllFarms: false,
    createFarm: false,
    editFarm: false,
    deleteFarm: false,
    viewDashboard: true,
    viewSensors: true,
    viewHistory: true,
    controlActuators: true,
    viewAutomation: false,
    createAutomation: false,
    editAutomation: false,
    deleteAutomation: false,
    exportData: false,
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    addSensor: false,
    editSensor: false,
    deleteSensor: false,
    addActuator: false,
    editActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    removeUsers: false,
    viewTeam: false,
    manageCustomers: false,
    systemSettings: false
  },
  VIEWER: {
    viewAllFarms: false,
    createFarm: false,
    editFarm: false,
    deleteFarm: false,
    viewDashboard: true,
    viewSensors: true,
    viewHistory: true,
    controlActuators: false,
    viewAutomation: false,
    createAutomation: false,
    editAutomation: false,
    deleteAutomation: false,
    exportData: false,
    addDevice: false,
    editDevice: false,
    deleteDevice: false,
    addSensor: false,
    editSensor: false,
    deleteSensor: false,
    addActuator: false,
    editActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    removeUsers: false,
    viewTeam: false,
    manageCustomers: false,
    systemSettings: false
  }
};

/**
 * Check if user has permission
 */
function hasPermission(userRole, permission) {
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return rolePermissions[permission] === true;
}

/**
 * Check if user is Super Admin
 */
function isSuperAdmin(user) {
  return user.role === 'SUPER_ADMIN';
}

/**
 * Get user's effective role for a specific farm
 * Super Admin always has full access
 * Farm Owner has OWNER role for their farm
 * Others have their FarmUser role
 */
async function getUserFarmRole(prisma, userId, farmId, userRole) {
  // Super Admin has full access to all farms
  if (userRole === 'SUPER_ADMIN') {
    return 'SUPER_ADMIN';
  }

  // Check if user is farm owner
  const farm = await prisma.farm.findFirst({
    where: { id: farmId, userId }
  });

  if (farm) {
    return 'FARM_OWNER';
  }

  // Check FarmUser assignment
  const farmUser = await prisma.farmUser.findUnique({
    where: {
      farmId_userId: { farmId, userId }
    }
  });

  if (farmUser && farmUser.isActive) {
    return farmUser.role;
  }

  return null; // No access
}

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  return PERMISSIONS[role] || {};
}

module.exports = {
  PERMISSIONS,
  hasPermission,
  isSuperAdmin,
  getUserFarmRole,
  getRolePermissions
};