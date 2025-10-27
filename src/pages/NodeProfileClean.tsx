import { useEffect, useState } from "react";
import { Globe, Edit3, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function NodeProfileClean() {
  const { api, logout } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

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
    address: node.address || "",
    city: node.city || "",
    state: node.state || "",
    country: node.country || "",
    nodeId: node.nodeId || "",
    tenantId: node.tenantId || "",
  });

  const handleSelect = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    setSelectedNode(node);
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setIsEditing(false);

      // --- Future PATCH integration (ready for backend) ---
      // await api.patch(`/users/${selectedUserId}/nodes/${selectedNode.id}`, formData);

      console.log("Data ready for PATCH:", formData);
    } catch (err) {
      console.error("Error saving changes:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading nodes...
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="text-center text-gray-500 mt-10">No nodes available.</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Globe className="text-blue-500 w-6 h-6" />
        <h1 className="text-2xl font-semibold text-gray-800">Church Profile</h1>
      </div>

      {/* Node selector */}
      {/*<div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Select Node
        </label>
        <select
          onChange={(e) => handleSelect(e.target.value)}
          value={selectedNode.id}
          className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.structure?.name || node.name} ({node.level?.name || "—"})
            </option>
          ))}
        </select>
      </div>*/}

      {/* Node details */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-800">Node Details</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit Info
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Name */}
          <div>
            <label className="block text-gray-600 font-medium">
              Branch Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-600 font-medium">
              Description
            </label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">
                {formData.description || "—"}
              </p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-gray-600 font-medium">Level</label>
            {isEditing ? (
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.level || "—"}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-600 font-medium">Address</label>
            {isEditing ? (
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.address}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-gray-600 font-medium">City</label>
            {isEditing ? (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-gray-600 font-medium">State</label>
            {isEditing ? (
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.state}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-gray-600 font-medium">Country</label>
            {isEditing ? (
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              />
            ) : (
              <p className="text-gray-800 mt-1">{formData.country}</p>
            )}
          </div>

          {/* Node ID */}
          <div>
            <label className="block text-gray-600 font-medium">Node ID</label>
            <p className="text-gray-800 mt-1">{formData.nodeId}</p>
          </div>

          {/* Tenant ID */}
          <div>
            <label className="block text-gray-600 font-medium">Tenant ID</label>
            <p className="text-gray-800 mt-1">{formData.tenantId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
