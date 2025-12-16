import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit2, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import teamService from '../services/team.service';
import { useAuthStore } from '../store/authStore';
import { getRoleDisplayName, getRoleBadgeColor } from '../utils/permissions';

const TEAM_ROLES = [
  { value: 'MANAGER', label: 'Manager', description: 'Can control and manage automation' },
  { value: 'OPERATOR', label: 'Operator', description: 'Can control actuators' },
  { value: 'VIEWER', label: 'Viewer', description: 'View only access' }
];

export default function TeamManagement() {
  const { farmId } = useParams();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    role: 'OPERATOR'
  });

  useEffect(() => {
    loadTeam();
  }, [farmId]);

  const loadTeam = async () => {
    try {
      const data = await teamService.getTeam(farmId);
      setTeam(data.data);
    } catch (error) {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      toast.error('Email and role are required');
      return;
    }

    try {
      await teamService.addTeamMember(farmId, formData);
      toast.success('Team member added');
      setShowAddModal(false);
      setFormData({ email: '', fullName: '', phone: '', password: '', role: 'OPERATOR' });
      loadTeam();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add team member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await teamService.updateTeamMember(farmId, memberId, newRole);
      toast.success('Role updated');
      loadTeam();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    try {
      await teamService.removeTeamMember(farmId, memberId);
      toast.success('Team member removed');
      loadTeam();
    } catch (error) {
      toast.error('Failed to remove team member');
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
            <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
            <p className="text-gray-500 text-sm">{team?.farm?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <FiPlus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Owner Card */}
      {team?.owner && (
        <div className="bg-white rounded-xl shadow mb-6 p-4">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">FARM OWNER</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiUser className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{team.owner.fullName}</p>
              <p className="text-sm text-gray-500">{team.owner.email}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor('OWNER')}`}>
              Owner
            </span>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Team Members ({team?.teamMembers?.length || 0})</h2>
        </div>

        {team?.teamMembers?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiUser size={48} className="mx-auto mb-4 opacity-50" />
            <p>No team members yet</p>
            <p className="text-sm">Add team members to give them access to this farm</p>
          </div>
        ) : (
          <div className="divide-y">
            {team?.teamMembers?.map((member) => (
              <div key={member.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-gray-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{member.fullName}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                >
                  {TEAM_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveMember(member.id, member.fullName)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Role Permissions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {TEAM_ROLES.map((role) => (
            <div key={role.value} className="bg-white rounded-lg p-3">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${getRoleBadgeColor(role.value)}`}>
                {role.label}
              </span>
              <p className="text-sm text-gray-600">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Add Team Member</h2>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="member@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (for new user)
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password (for new user)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave blank if user already exists</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {TEAM_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Member
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