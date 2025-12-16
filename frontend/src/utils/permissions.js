/**
 * Frontend permissions based on user role
 */

export const PERMISSIONS = {
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
    deleteSensor: true,
    addActuator: true,
    deleteActuator: true,
    inviteUsers: true,
    viewTeam: true,
    manageCustomers: true,
    viewDeviceManagement: true
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
    deleteSensor: false,
    addActuator: false,
    deleteActuator: false,
    inviteUsers: true,
    viewTeam: true,
    manageCustomers: false,
    viewDeviceManagement: false
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
    deleteSensor: false,
    addActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    viewTeam: true,
    manageCustomers: false,
    viewDeviceManagement: false
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
    deleteSensor: false,
    addActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    viewTeam: false,
    manageCustomers: false,
    viewDeviceManagement: false
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
    deleteSensor: false,
    addActuator: false,
    deleteActuator: false,
    inviteUsers: false,
    viewTeam: false,
    manageCustomers: false,
    viewDeviceManagement: false
  }
};

/**
 * Check if user has permission
 */
export function hasPermission(userRole, permission) {
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return rolePermissions[permission] === true;
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(user) {
  return user?.role === 'SUPER_ADMIN';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
  const names = {
    SUPER_ADMIN: 'Super Admin',
    FARM_OWNER: 'Farm Owner',
    MANAGER: 'Manager',
    OPERATOR: 'Operator',
    VIEWER: 'Viewer',
    OWNER: 'Owner'
  };
  return names[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role) {
  const colors = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
    FARM_OWNER: 'bg-green-100 text-green-800',
    OWNER: 'bg-green-100 text-green-800',
    MANAGER: 'bg-blue-100 text-blue-800',
    OPERATOR: 'bg-yellow-100 text-yellow-800',
    VIEWER: 'bg-gray-100 text-gray-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}