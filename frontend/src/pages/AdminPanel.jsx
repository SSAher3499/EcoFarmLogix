import { useState, useEffect } from 'react';
import { FiServer, FiDatabase, FiUsers, FiCpu, FiBell, FiActivity, FiRefreshCw, FiSend, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('system');
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);

  useEffect(() => {
    if (activeTab === 'system') fetchSystemStatus();
    if (activeTab === 'database') fetchDbStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'devices') fetchDevices();
    if (activeTab === 'logs') fetchActionLogs();
    if (activeTab === 'notifications') fetchNotifications();
    if (activeTab === 'errors') fetchErrorLogs();
  }, [activeTab]);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/system-status');
      setSystemStatus(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  };

  const fetchDbStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/database-stats');
      setDbStats(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch database stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users-overview');
      setUsers(response.data.data.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/devices-overview');
      setDevices(response.data.data.devices);
    } catch (error) {
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchActionLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/action-logs');
      setActionLogs(response.data.data.logs);
    } catch (error) {
      toast.error('Failed to fetch action logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/notifications-log');
      setNotifications(response.data.data.notifications);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/admin/test-notification');
      toast.success('Test notification sent!');
      if (activeTab === 'notifications') fetchNotifications();
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  const fetchErrorLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/error-logs');
      setErrorLogs(response.data.data.errors);
    } catch (error) {
      toast.error('Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  const handleClearErrorLogs = async () => {
    try {
      await api.delete('/admin/error-logs');
      setErrorLogs([]);
      toast.success('Error logs cleared');
    } catch (error) {
      toast.error('Failed to clear error logs');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const tabs = [
    { id: 'system', label: 'System Status', icon: FiServer },
    { id: 'database', label: 'Database', icon: FiDatabase },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'devices', label: 'Devices', icon: FiCpu },
    { id: 'logs', label: 'Action Logs', icon: FiActivity },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'errors', label: 'Error Logs', icon: FiAlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('admin.title', 'Admin Panel')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('admin.subtitle', 'System monitoring and debugging tools')}
          </p>
        </div>
        <button
          onClick={sendTestNotification}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiSend /> Test Notification
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* System Status Tab */}
            {activeTab === 'system' && systemStatus && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">System Status</h2>
                  <button onClick={fetchSystemStatus} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Database</p>
                    <p className={`text-lg font-semibold ${systemStatus.database === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus.database}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">MQTT</p>
                    <p className={`text-lg font-semibold ${systemStatus.mqtt === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                      {systemStatus.mqtt}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{formatUptime(systemStatus.uptime)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Node Version</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">{systemStatus.nodeVersion}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Memory Usage</p>
                    <div className="space-y-1 text-sm text-gray-800 dark:text-white">
                      <p>Heap Used: {formatBytes(systemStatus.memoryUsage.heapUsed)}</p>
                      <p>Heap Total: {formatBytes(systemStatus.memoryUsage.heapTotal)}</p>
                      <p>RSS: {formatBytes(systemStatus.memoryUsage.rss)}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Quick Counts</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-800 dark:text-white">
                      <p>Users: <span className="font-semibold">{systemStatus.counts.users}</span></p>
                      <p>Farms: <span className="font-semibold">{systemStatus.counts.farms}</span></p>
                      <p>Devices: <span className="font-semibold">{systemStatus.counts.devices}</span></p>
                      <p>Notifications: <span className="font-semibold">{systemStatus.counts.notifications}</span></p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Server Time: {new Date(systemStatus.serverTime).toLocaleString()}
                </div>
              </div>
            )}

            {/* Database Stats Tab */}
            {activeTab === 'database' && dbStats && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Database Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(dbStats).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Users Overview ({users.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Role</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Farms</th>
                        <th className="px-4 py-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{user.email}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{user.fullName}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{user._count?.ownedFarms || 0}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Devices Overview ({devices.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Device Name</th>
                        <th className="px-4 py-2 text-left">Farm</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Sensors</th>
                        <th className="px-4 py-2 text-left">Actuators</th>
                        <th className="px-4 py-2 text-left">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{device.deviceName}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{device.farm?.name}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{device.deviceType}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${device.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                              {device.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{device._count?.sensors || 0}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">{device._count?.actuators || 0}</td>
                          <td className="px-4 py-2 text-gray-800 dark:text-white">
                            {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Action Logs</h2>
                {actionLogs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No action logs found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Time</th>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Action</th>
                          <th className="px-4 py-2 text-left">Target</th>
                          <th className="px-4 py-2 text-left">Farm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {actionLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{new Date(log.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{log.user?.email || 'System'}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">{log.action}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{log.targetType}: {log.targetId?.slice(0, 8)}...</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{log.farm?.name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Notifications</h2>
                {notifications.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Time</th>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Title</th>
                          <th className="px-4 py-2 text-left">Read</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notif) => (
                          <tr key={notif.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{new Date(notif.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{notif.user?.email}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded text-xs">{notif.type}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-800 dark:text-white">{notif.title}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${notif.isRead ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                                {notif.isRead ? 'Read' : 'Unread'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Error Logs Tab */}
            {activeTab === 'errors' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Error Logs ({errorLogs.length})
                  </h2>
                  <button
                    onClick={handleClearErrorLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={errorLogs.length === 0}
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Clear Logs
                  </button>
                </div>

                {errorLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    <FiAlertCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p>No error logs found</p>
                    <p className="text-sm mt-2">Errors will appear here when they occur</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {errorLogs.map((error) => (
                      <div
                        key={error.id}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                              <h3 className="font-semibold text-red-800 dark:text-red-200">
                                {error.message}
                              </h3>
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                              <p>
                                <span className="font-medium">Time:</span>{' '}
                                {new Date(error.timestamp).toLocaleString()}
                              </p>
                              {error.context?.path && (
                                <p>
                                  <span className="font-medium">Path:</span>{' '}
                                  {error.context.method} {error.context.path}
                                </p>
                              )}
                              {error.context?.userId && (
                                <p>
                                  <span className="font-medium">User ID:</span>{' '}
                                  {error.context.userId}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {error.stack && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}

                        {error.context && Object.keys(error.context).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200">
                              View Context
                            </summary>
                            <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-300 overflow-x-auto">
                              {JSON.stringify(error.context, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
