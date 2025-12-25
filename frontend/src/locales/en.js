// English Translations
export default {
  // App
  app: {
    name: 'EcoFarmLogix',
    tagline: 'Smart Farm Monitoring System',
  },

  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    actions: 'Actions',
    status: 'Status',
    name: 'Name',
    type: 'Type',
    settings: 'Settings',
    logout: 'Logout',
    online: 'Online',
    offline: 'Offline',
    active: 'Active',
    inactive: 'Inactive',
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    close: 'Close',
    refresh: 'Refresh',
    noData: 'No data available',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    myFarms: 'My Farms',
    settings: 'Settings',
    notifications: 'Notifications',
  },

  // Auth
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginSuccess: 'Login successful',
    registerSuccess: 'Registration successful',
    logoutSuccess: 'Logged out successfully',
    invalidCredentials: 'Invalid email or password',
    createAccount: 'Create your account',
    confirmPassword: 'Confirm Password',
    passwordMismatch: 'Passwords do not match',
    passwordRequirements: 'Min 8 characters, with uppercase, lowercase, and number',
    creatingAccount: 'Creating account...',
    registerFailed: 'Registration failed',
  },

  // Dashboard
  dashboard: {
    title: 'Dashboard',
    addFarm: '+ Add Farm',
    noFarms: 'No farms yet',
    noFarmsDesc: 'Add your first farm to start monitoring',
    addFirstFarm: 'Add Your First Farm',
    devices: 'Devices',
    alerts: 'Alerts',
    noLocation: 'No location set',
  },

  // Farm
  farm: {
    title: 'Farm Details',
    name: 'Farm Name',
    type: 'Farm Type',
    location: 'Location',
    address: 'Address',
    area: 'Area',
    areaUnit: 'hectares',
    sensors: 'Sensors',
    actuators: 'Actuators',
    automation: 'Automation',
    team: 'Team',
    history: 'History',
    devices: 'Devices',
    addDevice: '+ Add Device',
    configureDevices: 'Configure Devices',
    liveData: 'Live Data',
    realtimeMonitoring: 'Real-time Monitoring',
    farmTypes: {
      POLYHOUSE: 'Polyhouse',
      GREENHOUSE: 'Greenhouse',
      OPENFIELD: 'Open Field',
      INDOOR: 'Indoor Farm',
      HYDROPONIC: 'Hydroponic',
      AQUAPONIC: 'Aquaponic',
    },
  },

  // Sensors
  sensors: {
    title: 'Sensors',
    addSensor: 'Add Sensor',
    sensorType: 'Sensor Type',
    sensorName: 'Sensor Name',
    connectionType: 'Connection Type',
    unit: 'Unit',
    currentValue: 'Current Value',
    lastReading: 'Last Reading',
    minThreshold: 'Min Threshold',
    maxThreshold: 'Max Threshold',
    alertThresholds: 'Alert Thresholds (Optional)',
    alertDesc: 'Alerts will trigger when readings exceed thresholds',
    types: {
      TEMPERATURE: 'Temperature',
      HUMIDITY: 'Humidity',
      SOIL_MOISTURE: 'Soil Moisture',
      SOIL_TEMPERATURE: 'Soil Temperature',
      LIGHT: 'Light Intensity',
      CO2: 'CO2 Level',
      PH: 'pH Level',
      EC: 'Electrical Conductivity',
      WATER_LEVEL: 'Water Level',
      WATER_FLOW: 'Water Flow Rate',
    },
  },

  // Actuators
  actuators: {
    title: 'Actuators',
    addActuator: 'Add Actuator',
    actuatorType: 'Actuator Type',
    actuatorName: 'Actuator Name',
    control: 'Control',
    turnOn: 'Turn On',
    turnOff: 'Turn Off',
    on: 'ON',
    off: 'OFF',
    types: {
      FAN: 'Fan',
      EXHAUST_FAN: 'Exhaust Fan',
      FOGGER: 'Fogger',
      IRRIGATION_VALVE: 'Irrigation Valve',
      SHADE_NET: 'Shade Net',
      GROW_LIGHT: 'Grow Light',
      HEATER: 'Heater',
      COOLER: 'Cooler',
      WATER_PUMP: 'Water Pump',
      DOSING_PUMP: 'Dosing Pump',
      RELAY: 'Relay',
    },
  },

  // Devices
  devices: {
    title: 'Device Management',
    subtitle: 'Manage sensors and actuators for your farm',
    addDevice: '+ Add Device',
    deviceName: 'Device Name',
    deviceType: 'Device Type',
    macAddress: 'MAC Address',
    firmwareVersion: 'Firmware Version',
    lastSeen: 'Last Seen',
    configure: 'Configure',
    serialConfig: 'Serial Port Configuration',
    noDevices: 'No devices configured',
    noDevicesDesc: 'Add a gateway device to start monitoring',
    types: {
      GATEWAY: 'Gateway',
      SENSOR_NODE: 'Sensor Node',
      RELAY_NODE: 'Relay Node',
      CAMERA: 'Camera',
    },
  },

  // Modbus Configuration
  modbus: {
    title: 'Modbus RS485 Configuration',
    slaveId: 'Slave ID',
    slaveIdDesc: 'Device address (1-247)',
    functionCode: 'Function Code',
    registerAddress: 'Register Address',
    registerAddressDesc: 'Starting address (0-65535)',
    registerCount: 'Register Count',
    registerCountDesc: 'Number of registers to read',
    dataType: 'Data Type',
    byteOrder: 'Byte Order',
    coilAddress: 'Coil/Register Address',
    coilAddressDesc: 'Coil address to write (0-65535)',
    functionCodes: {
      1: '01 - Read Coils',
      2: '02 - Read Discrete Inputs',
      3: '03 - Read Holding Registers',
      4: '04 - Read Input Registers',
    },
    dataTypes: {
      INT16: 'INT16 (Signed 16-bit)',
      UINT16: 'UINT16 (Unsigned 16-bit)',
      INT32: 'INT32 (Signed 32-bit)',
      UINT32: 'UINT32 (Unsigned 32-bit)',
      FLOAT32: 'FLOAT32 (32-bit Float)',
      FLOAT64: 'FLOAT64 (64-bit Float)',
    },
    byteOrders: {
      AB: 'AB - Big Endian (12)',
      BA: 'BA - Little Endian (21)',
      ABCD: 'ABCD - Big Endian (1234)',
      DCBA: 'DCBA - Little Endian (4321)',
      CDAB: 'CDAB - Mid-Big Endian (3412)',
      BADC: 'BADC - Mid-Little Endian (2143)',
    },
  },

  // Serial Port Configuration
  serial: {
    title: 'Serial Port Configuration',
    subtitle: 'RS485/Modbus settings',
    portName: 'Port Name',
    baudRate: 'Baud Rate',
    dataBits: 'Data Bits',
    parity: 'Parity',
    stopBits: 'Stop Bits',
    timeout: 'Timeout (ms)',
    pollInterval: 'Poll Interval (ms)',
    pollIntervalDesc: 'How often to read sensors (min: 1000ms)',
    retries: 'Retries',
    retriesDesc: 'Retry count on read failure',
    saveConfig: 'Save Configuration',
    parityOptions: {
      none: 'None',
      even: 'Even',
      odd: 'Odd',
    },
  },

  // Value Conversion
  conversion: {
    title: 'Value Conversion',
    formula: 'Final Value = (Raw Value × Scale Factor) + Offset',
    scaleFactor: 'Scale Factor',
    scaleFactorDesc: 'e.g., 0.1 for ÷10',
    offset: 'Offset',
    decimalPlaces: 'Decimal Places',
  },

  // GPIO Configuration
  gpio: {
    title: 'GPIO Configuration',
    pin: 'GPIO Pin',
    pinDesc: 'BCM GPIO pin number on Raspberry Pi',
  },

  // Connection Types
  connection: {
    types: {
      GPIO: 'GPIO (Direct Pin)',
      MODBUS_RTU: 'Modbus RTU (RS485)',
      MODBUS_TCP: 'Modbus TCP/IP',
      ANALOG: 'Analog (ADC)',
      I2C: 'I2C Bus',
    },
  },

  // Automation
  automation: {
    title: 'Automation Rules',
    addRule: '+ Add Rule',
    ruleName: 'Rule Name',
    condition: 'Condition',
    action: 'Action',
    enabled: 'Enabled',
    disabled: 'Disabled',
    noRules: 'No automation rules configured',
  },

  // Team
  team: {
    title: 'Team Management',
    addMember: '+ Add Member',
    role: 'Role',
    permissions: 'Permissions',
    roles: {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      OPERATOR: 'Operator',
      VIEWER: 'Viewer',
    },
  },

  // Weather
  weather: {
    title: 'Weather',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    forecast: 'Forecast',
    recommendations: 'Recommendations',
  },

  // Alerts
  alerts: {
    title: 'Alerts',
    newAlert: 'New Alert',
    acknowledge: 'Acknowledge',
    resolve: 'Resolve',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },

  // Messages
  messages: {
    saveSuccess: 'Saved successfully',
    saveFailed: 'Failed to save',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    updateSuccess: 'Updated successfully',
    updateFailed: 'Failed to update',
    loadFailed: 'Failed to load data',
    confirmDelete: 'Are you sure you want to delete this?',
    networkError: 'Network error. Please check your connection.',
    sessionExpired: 'Session expired. Please login again.',
    permissionDenied: 'Permission denied',
    validationError: 'Please fill all required fields',
    sensorAdded: 'Sensor added successfully',
    actuatorAdded: 'Actuator added successfully',
    deviceAdded: 'Device added successfully',
    configSaved: 'Configuration saved successfully',
  },

  // Language
  language: {
    title: 'Language',
    english: 'English',
    marathi: 'मराठी',
    select: 'Select Language',
  },
};
