import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { farmService } from '../services/farm.service';
import { FiArrowLeft, FiMapPin, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

const FARM_TYPES = [
  { value: 'POLYHOUSE', label: 'Polyhouse' },
  { value: 'GREENHOUSE', label: 'Greenhouse' },
  { value: 'OPEN_FIELD', label: 'Open Field' },
  { value: 'SHADE_NET', label: 'Shade Net House' },
  { value: 'HYDROPONIC', label: 'Hydroponic Farm' },
  { value: 'AQUAPONIC', label: 'Aquaponic Farm' },
  { value: 'VERTICAL_FARM', label: 'Vertical Farm' },
  { value: 'OTHER', label: 'Other' }
];

export default function AddFarm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    farmType: 'POLYHOUSE',
    locationAddress: '',
    locationLat: '',
    locationLng: '',
    areaSqft: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Farm name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Farm name must be at least 3 characters';
    }

    if (!formData.farmType) {
      newErrors.farmType = 'Please select a farm type';
    }

    if (formData.locationLat && (isNaN(formData.locationLat) || formData.locationLat < -90 || formData.locationLat > 90)) {
      newErrors.locationLat = 'Invalid latitude (-90 to 90)';
    }

    if (formData.locationLng && (isNaN(formData.locationLng) || formData.locationLng < -180 || formData.locationLng > 180)) {
      newErrors.locationLng = 'Invalid longitude (-180 to 180)';
    }

    if (formData.areaSqft && (isNaN(formData.areaSqft) || formData.areaSqft < 0)) {
      newErrors.areaSqft = 'Area must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your location...', { id: 'location' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          locationLat: position.coords.latitude.toFixed(6),
          locationLng: position.coords.longitude.toFixed(6)
        }));
        toast.success('Location detected!', { id: 'location' });
      },
      (error) => {
        toast.error('Unable to get location: ' + error.message, { id: 'location' });
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const payload = {
  name: formData.name.trim(),
  farmType: formData.farmType,
  locationAddress: formData.locationAddress.trim() || undefined,
  latitude: formData.locationLat ? parseFloat(formData.locationLat) : undefined,
  longitude: formData.locationLng ? parseFloat(formData.locationLng) : undefined,
  areaSqft: formData.areaSqft ? parseInt(formData.areaSqft) : undefined
};
      const newFarm = await farmService.createFarm(payload);
      toast.success('Farm created successfully!');
      navigate(`/farms/${newFarm.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create farm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Farm</h1>
          <p className="text-gray-500 text-sm">Fill in the details to create a new farm</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
        {/* Farm Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Green Valley Polyhouse"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Farm Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Type <span className="text-red-500">*</span>
          </label>
          <select
            name="farmType"
            value={formData.farmType}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.farmType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {FARM_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.farmType && <p className="text-red-500 text-xs mt-1">{errors.farmType}</p>}
        </div>

        {/* Location Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Address
          </label>
          <input
            type="text"
            name="locationAddress"
            value={formData.locationAddress}
            onChange={handleChange}
            placeholder="e.g., Pune, Maharashtra"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Coordinates */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Coordinates (for weather)
            </label>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <FiMapPin size={12} />
              Detect My Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                name="locationLat"
                value={formData.locationLat}
                onChange={handleChange}
                placeholder="Latitude (e.g., 18.5204)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.locationLat ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.locationLat && <p className="text-red-500 text-xs mt-1">{errors.locationLat}</p>}
            </div>
            <div>
              <input
                type="text"
                name="locationLng"
                value={formData.locationLng}
                onChange={handleChange}
                placeholder="Longitude (e.g., 73.8567)"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  errors.locationLng ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.locationLng && <p className="text-red-500 text-xs mt-1">{errors.locationLng}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Coordinates are used to show local weather for your farm
          </p>
        </div>

        {/* Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area (sq. ft.)
          </label>
          <input
            type="number"
            name="areaSqft"
            value={formData.areaSqft}
            onChange={handleChange}
            placeholder="e.g., 5000"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              errors.areaSqft ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.areaSqft && <p className="text-red-500 text-xs mt-1">{errors.areaSqft}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional description about your farm..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <Link
            to="/"
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Create Farm
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}