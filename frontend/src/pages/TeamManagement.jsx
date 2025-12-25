import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiMail, FiUsers, FiUser, FiPhone, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from '../hooks/useTranslation';
import teamService from '../services/team.service';
import { useAuthStore } from '../store/authStore';
import { getRoleDisplayName, getRoleBadgeColor } from '../utils/permissions';

const FARM_ROLES = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'VIEWER', label: 'Viewer' }
];

export default function TeamManagement() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    role: 'VIEWER'
  });
  const [inviting, setInviting] = useState(false);

  // Get user from store
  const user = useAuthStore((state) => state.user);

  // Calculate permissions
  const userRole = user?.role || 'VIEWER';
  const canViewTeam = ['SUPER_ADMIN', 'FARM_OWNER', 'MANAGER'].includes(userRole);
  const canInviteUsers = ['SUPER_ADMIN', 'FARM_OWNER'].includes(userRole);
  const canRemoveUsers = ['SUPER_ADMIN', 'FARM_OWNER'].includes(userRole);
  const canChangeRoles = ['SUPER_ADMIN', 'FARM_OWNER'].includes(userRole);

  useEffect(() => {
    if (!canViewTeam) {
      toast.error(t('messages.permissionDenied'));
      navigate(`/farms/${farmId}`);
      return;
    }
    loadTeam();
  }, [farmId, canViewTeam, navigate, t]);

  const loadTeam = async () => {
    try {
      const data = await teamService.getTeam(farmId);
      setTeam(data.data?.teamMembers || []);
    } catch (error) {
      toast.error(t('team.loadFailed', 'Failed to load team members'));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.fullName || !inviteForm.password) {
      toast.error(t('messages.validationError', 'Please fill all required fields'));
      return;
    }

    if (inviteForm.password.length < 6) {
      toast.error(t('auth.passwordLength', 'Password must be at least 6 characters'));
      return;
    }

    setInviting(true);
    try {
      await teamService.addTeamMember(farmId, inviteForm);
      toast.success(t('team.inviteSent', 'Team member added successfully'));
      setShowInviteModal(false);
      setInviteForm({ email: '', fullName: '', phone: '', password: '', role: 'VIEWER' });
      loadTeam();
    } catch (error) {
      toast.error(error.response?.data?.message || t('team.inviteFailed', 'Failed to add team member'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!canRemoveUsers) {
      toast.error(t('messages.permissionDenied'));
      return;
    }
    if (!confirm(t('team.confirmRemove', `Are you sure you want to remove ${memberName} from the team?`))) return;

    try {
      await teamService.removeTeamMember(farmId, memberId);
      toast.success(t('team.memberRemoved', 'Team member removed'));
      loadTeam();
    } catch (error) {
      toast.error(t('team.removeFailed', 'Failed to remove team member'));
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!canChangeRoles) {
      toast.error(t('messages.permissionDenied'));
      return;
    }

    try {
      await teamService.updateTeamMember(farmId, memberId, newRole);
      toast.success(t('team.roleUpdated', 'Role updated successfully'));
      loadTeam();
    } catch (error) {
      toast.error(t('team.roleUpdateFailed', 'Failed to update role'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/farms/${farmId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('team.title')}</h1>
            <p className="text-gray-500 text-sm">
              {canInviteUsers 
                ? t('team.subtitle', 'Manage team members and permissions')
                : t('team.viewOnly', 'View team members')
              }
            </p>
          </div>
        </div>
        {canInviteUsers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiPlus size={18} />
            {t('team.addMember')}
          </button>
        )}
      </div>

      {/* Team List */}
      {team.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FiUsers className="mx-auto text-gray-300 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('team.noMembers', 'No team members yet')}</h2>
          <p className="text-gray-500 mb-6">
            {canInviteUsers 
              ? t('team.noMembersDesc', 'Add team members to collaborate on this farm')
              : t('team.noMembersViewOnly', 'No team members have been added to this farm')
            }
          </p>
          {canInviteUsers && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              {t('team.inviteFirst', 'Add First Member')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('team.member', 'Member')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('team.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('team.joinedAt', 'Joined')}
                </th>
                {(canChangeRoles || canRemoveUsers) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {team.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {(member.fullName || member.user?.fullName)?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.fullName || member.user?.fullName || t('team.unknownUser', 'Unknown User')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email || member.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canChangeRoles && member.role !== 'OWNER' ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                      >
                        {FARM_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {t(`team.roles.${role.value}`, role.label)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {t(`team.roles.${member.role}`, getRoleDisplayName(member.role))}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.invitedAt || member.createdAt).toLocaleDateString()}
                  </td>
                  {(canChangeRoles || canRemoveUsers) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canRemoveUsers && member.role !== 'OWNER' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.fullName || member.user?.fullName)}
                          className="text-red-600 hover:text-red-900"
                          title={t('team.remove', 'Remove')}
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      {showInviteModal && canInviteUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {t('team.inviteMember', 'Add Team Member')}
              </h2>

              <form onSubmit={handleInvite} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.fullName')} *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={inviteForm.fullName}
                      onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                      placeholder={t('team.fullNamePlaceholder', 'Enter full name')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.email')} *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder={t('team.emailPlaceholder', 'Enter email address')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Phone (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.phone')} ({t('common.optional', 'Optional')})
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                      placeholder={t('team.phonePlaceholder', 'Enter phone number')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('auth.password')} *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={inviteForm.password}
                      onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                      placeholder={t('team.passwordPlaceholder', 'Set password for member')}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('auth.passwordHint', 'Minimum 6 characters')}</p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('team.role')} *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {FARM_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {t(`team.roles.${role.value}`, role.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role Permissions Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{t('team.rolePermissions', 'Role Permissions')}:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>{t('team.roles.MANAGER', 'Manager')}</strong>: {t('team.managerDesc', 'Can manage automation, view team')}</li>
                    <li>• <strong>{t('team.roles.OPERATOR', 'Operator')}</strong>: {t('team.operatorDesc', 'Can control actuators')}</li>
                    <li>• <strong>{t('team.roles.VIEWER', 'Viewer')}</strong>: {t('team.viewerDesc', 'Can only view data')}</li>
                  </ul>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {t('team.sending', 'Adding...')}
                      </>
                    ) : (
                      <>
                        <FiPlus size={18} />
                        {t('team.sendInvite', 'Add Member')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
