import { useEffect, useState } from "react";
import {
  Globe,
  Edit3,
  Save,
  X,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Camera,
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function NodeProfileClean() {
  const { api, logout } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Enhanced form state with comprehensive organization details
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    level: "",
    establishedDate: "",
    registrationNumber: "",

    // Contact Information
    phone: "",
    email: "",
    website: "",
    socialMedia: "",

    // Address Information
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",

    // Property Status
    propertyOwnership: "",
    propertySize: "",
    propertyValue: "",
    mortgageStatus: "",

    // Legal Documents
    registrationCertificate: null,
    taxExemptStatus: "",
    insurancePolicy: null,
    propertyDeed: null,

    // Organization Details
    denomination: "",
    churchType: "",
    membershipCount: "",
    staffCount: "",
    serviceTimes: "",
    programs: "",

    // Financial Information
    annualBudget: "",
    fundingSources: "",
    donations: "",

    // System Information
    nodeId: "",
    tenantId: "",
  });

  // Fetch nodes on mount
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await api.get("/node");
        const data = res.data.results;
        setNodes(data);
        if (data.length > 0) {
          setSelectedNode(data[0]);
          setFormData(mapNodeToForm(data[0]));
        }
      } catch (err: any) {
        if (err.response?.status === 401) logout();
        toast.error("Failed to load church information");
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, [api, logout]);

  // When node changes, update form data
  useEffect(() => {
    if (selectedNode) setFormData(mapNodeToForm(selectedNode));
  }, [selectedNode]);

  const mapNodeToForm = (node: any) => ({
    name: node.structure?.name || "",
    description: node.structure?.description || "",
    level: node.level?.name || "",
    establishedDate: "",
    registrationNumber: "",
    phone: "",
    email: "",
    website: "",
    socialMedia: "",
    address: node.address || "",
    city: node.city || "",
    state: node.state || "",
    zipCode: "",
    country: node.country || "",
    propertyOwnership: "",
    propertySize: "",
    propertyValue: "",
    mortgageStatus: "",
    registrationCertificate: null,
    taxExemptStatus: "",
    insurancePolicy: null,
    propertyDeed: null,
    denomination: "",
    churchType: "",
    membershipCount: "",
    staffCount: "",
    serviceTimes: "",
    programs: "",
    annualBudget: "",
    fundingSources: "",
    donations: "",
    nodeId: node.nodeId || "",
    tenantId: node.tenantId || "",
  });

  const handleSelect = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    setSelectedNode(node);
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Future PATCH integration (ready for backend)
      // await api.patch(`/users/${selectedUserId}/nodes/${selectedNode.id}`, formData);

      console.log("Data ready for PATCH:", formData);
      toast.success("Church profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving changes:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading church information...</span>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">No church information available</p>
        <p className="text-gray-400">
          Please contact your administrator to set up church details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Church Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {formData.name || "Church Name"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {formData.description || "Church Description"}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Building className="w-4 h-4 mr-1" />
                  {formData.level || "Church Level"}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  Established {formData.establishedDate || "Date"}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Building className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Church Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Church Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
              <option value="">Select church level</option>
              <option value="headquarters">Headquarters</option>
              <option value="regional">Regional</option>
              <option value="district">District</option>
              <option value="local">Local Church</option>
              <option value="branch">Branch</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Established Date
            </label>
            <input
              type="date"
              name="establishedDate"
              value={formData.establishedDate}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter registration number"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={!isEditing}
            rows={4}
            placeholder="Describe your church mission and vision..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed resize-none"
          />
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Phone className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter phone number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="https://yourchurch.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Social Media
            </label>
            <input
              type="text"
              name="socialMedia"
              value={formData.socialMedia}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Facebook, Instagram, etc."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Address Information
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter street address"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="City"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="State"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                ZIP Code
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="ZIP Code"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Country"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Property Status Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Property Status
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property Ownership
            </label>
            <select
              name="propertyOwnership"
              value={formData.propertyOwnership}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
              <option value="">Select ownership status</option>
              <option value="owned">Owned</option>
              <option value="leased">Leased</option>
              <option value="rented">Rented</option>
              <option value="shared">Shared</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property Size
            </label>
            <input
              type="text"
              name="propertySize"
              value={formData.propertySize}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., 5,000 sq ft"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property Value
            </label>
            <input
              type="text"
              name="propertyValue"
              value={formData.propertyValue}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Estimated property value"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mortgage Status
            </label>
            <select
              name="mortgageStatus"
              value={formData.mortgageStatus}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
              <option value="">Select mortgage status</option>
              <option value="paid-off">Paid Off</option>
              <option value="mortgage">Has Mortgage</option>
              <option value="no-mortgage">No Mortgage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legal Documents Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <FileText className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Legal Documents
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Registration Certificate
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label
                htmlFor="registration-cert"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                {formData.registrationCertificate
                  ? formData.registrationCertificate.name
                  : "Upload Registration Certificate"}
              </label>
              <input
                id="registration-cert"
                type="file"
                onChange={(e) =>
                  handleFileChange(
                    "registrationCertificate",
                    e.target.files?.[0] || null
                  )
                }
                disabled={!isEditing}
                className="hidden"
                accept=".pdf,.doc,.docx"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, DOCX files only
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tax Exempt Status
            </label>
            <select
              name="taxExemptStatus"
              value={formData.taxExemptStatus}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
              <option value="">Select tax status</option>
              <option value="exempt">Tax Exempt</option>
              <option value="non-exempt">Non-Exempt</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Insurance Policy
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label
                htmlFor="insurance-policy"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                {formData.insurancePolicy
                  ? formData.insurancePolicy.name
                  : "Upload Insurance Policy"}
              </label>
              <input
                id="insurance-policy"
                type="file"
                onChange={(e) =>
                  handleFileChange(
                    "insurancePolicy",
                    e.target.files?.[0] || null
                  )
                }
                disabled={!isEditing}
                className="hidden"
                accept=".pdf,.doc,.docx"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, DOCX files only
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property Deed
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label
                htmlFor="property-deed"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                {formData.propertyDeed
                  ? formData.propertyDeed.name
                  : "Upload Property Deed"}
              </label>
              <input
                id="property-deed"
                type="file"
                onChange={(e) =>
                  handleFileChange("propertyDeed", e.target.files?.[0] || null)
                }
                disabled={!isEditing}
                className="hidden"
                accept=".pdf,.doc,.docx"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, DOCX files only
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Details Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organization Details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Denomination
            </label>
            <input
              type="text"
              name="denomination"
              value={formData.denomination}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., Baptist, Methodist, etc."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Church Type
            </label>
            <select
              name="churchType"
              value={formData.churchType}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
              <option value="">Select church type</option>
              <option value="traditional">Traditional</option>
              <option value="contemporary">Contemporary</option>
              <option value="charismatic">Charismatic</option>
              <option value="pentecostal">Pentecostal</option>
              <option value="non-denominational">Non-Denominational</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Membership Count
            </label>
            <input
              type="number"
              name="membershipCount"
              value={formData.membershipCount}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Number of members"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Staff Count
            </label>
            <input
              type="number"
              name="staffCount"
              value={formData.staffCount}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Number of staff"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Service Times
            </label>
            <input
              type="text"
              name="serviceTimes"
              value={formData.serviceTimes}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., Sunday 9AM, 11AM"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Programs & Ministries
            </label>
            <input
              type="text"
              name="programs"
              value={formData.programs}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., Youth, Children, Seniors"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Financial Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Financial Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Annual Budget
            </label>
            <input
              type="text"
              name="annualBudget"
              value={formData.annualBudget}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Annual budget amount"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Funding Sources
            </label>
            <input
              type="text"
              name="fundingSources"
              value={formData.fundingSources}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g., Tithes, Offerings, Grants"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Monthly Donations
            </label>
            <input
              type="text"
              name="donations"
              value={formData.donations}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Average monthly donations"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* System Information Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Node ID
            </label>
            <input
              type="text"
              value={formData.nodeId}
              disabled
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tenant ID
            </label>
            <input
              type="text"
              value={formData.tenantId}
              disabled
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-6 py-3 rounded-lg text-white transition-colors ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
