import { useEffect, useState } from "react";
import {
  Globe,
  Edit3,
  Save,
  X,
  Building,
  Calendar,
  Camera,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import type { User as UserModel } from "../contexts/UserContext";
import toast from "react-hot-toast";
import {
  mapNodeProfileToFields,
  mapNodeSchemaToFields,
  convertFormValuesToAPIFormat,
  FormField,
} from "../utils/formMapper";
import DynamicFormRenderer from "../components/Forms/DynamicFormRenderer";

export default function NodeProfileClean() {
  const { api, logout, user: authUser } = useAuth();
  const { user: userContextUser } = useUser();
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeData, setNodeData] = useState<any>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get user ID from context - prefer AuthContext, fallback to UserContext
  const user: Partial<UserModel> | null =
    (authUser as unknown as Partial<UserModel>) ?? userContextUser ?? null;
  const userId = user?.id;

  // Fetch nodes on mount
  useEffect(() => {
    const fetchNodes = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/users/${userId}/nodes`);
        const data = res.data?.results || res.data || [];
        setNodes(data);
        if (data.length > 0) {
          setSelectedNode(data[0]);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error("Failed to load church information");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, [userId, api, logout]);

  // When a node is selected, fetch its full details and generate form fields
  useEffect(() => {
    const loadNodeDetails = async () => {
      if (!selectedNode || !selectedNode.id) {
        setNodeData(null);
        setFormFields([]);
        setFormValues({});
        return;
      }

      try {
        setLoading(true);

        // Fetch both schema and actual node data in parallel
        const [schemaResponse, dataResponse] = await Promise.all([
          api.get(`/schema/node`).catch(() => null), // Schema is optional
          api.get(`/node/${selectedNode.id}`),
        ]);

        const fullNodeData = dataResponse.data;
        setNodeData(fullNodeData);

        // Use schema if available, otherwise fallback to data-driven mapping
        let fields: FormField[] = [];
        if (schemaResponse?.data?.data) {
          // Use schema-based mapping for accurate field definitions
          fields = mapNodeSchemaToFields(
            schemaResponse.data.data,
            fullNodeData
          );
        } else {
          // Fallback to data-driven mapping
          fields = mapNodeProfileToFields(fullNodeData);
        }

        setFormFields(fields);

        // Initialize form values from node data
        const initialValues: Record<string, any> = {};
        fields.forEach((field) => {
          // Get nested value from nodeData (e.g., "customFields.title" -> nodeData.customFields.title)
          const value = getNestedValue(fullNodeData, field.name);
          // Store as flat key for formValues (e.g., "customFields.title" as key)
          initialValues[field.name] =
            value !== undefined && value !== null
              ? value
              : field.value !== undefined && field.value !== null
              ? field.value
              : "";
        });
        setFormValues(initialValues);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error("Failed to load node details");
        }
      } finally {
        setLoading(false);
      }
    };

    loadNodeDetails();
  }, [selectedNode, api, logout]);

  const getNestedValue = (obj: any, path: string): any => {
    return path.split(".").reduce((current, key) => {
      return current && typeof current === "object" ? current[key] : undefined;
    }, obj);
  };

  const handleFieldChange = (fieldPath: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldPath]: value,
    }));
  };

  const handleSelect = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    setSelectedNode(node);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedNode?.id || !nodeData) return;

    setSaving(true);
    try {
      // Convert flat form values back to nested API format
      const payload = convertFormValuesToAPIFormat(formValues, nodeData);

      // Debug: Log payload before submission (dev only)
      if (import.meta.env.DEV) {
        console.log(
          "[NodeProfile] Payload to submit:",
          JSON.stringify(payload, null, 2)
        );
      }

      // Update node profile
      // Try the user-specific endpoint first, fallback to direct node endpoint only for 404
      let resp;
      try {
        if (import.meta.env.DEV) {
          console.log(
            "[NodeProfile] Trying endpoint:",
            `/users/${userId}/nodes/${selectedNode.id}`
          );
        }
        resp = await api.patch(
          `/users/${userId}/nodes/${selectedNode.id}`,
          payload
        );
        if (import.meta.env.DEV) {
          console.log("[NodeProfile] Response from user endpoint:", resp);
        }
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn(
            "[NodeProfile] User endpoint failed:",
            err.response?.status,
            err.response?.data
          );
        }

        // If user-specific endpoint fails, try fallback endpoint
        // 404 = endpoint doesn't exist, try fallback
        // 403 = might be endpoint-specific permission, still try fallback
        if (err.response?.status === 404 || err.response?.status === 403) {
          if (import.meta.env.DEV) {
            console.log(
              `[NodeProfile] Primary endpoint failed with ${err.response?.status}, trying fallback endpoint:`,
              `/node/${selectedNode.id}`
            );
          }
          try {
            resp = await api.patch(`/node/${selectedNode.id}`, payload);
            if (import.meta.env.DEV) {
              console.log(
                "[NodeProfile] Response from fallback endpoint:",
                resp
              );
            }
          } catch (fallbackErr: any) {
            if (import.meta.env.DEV) {
              console.warn(
                "[NodeProfile] Fallback endpoint also failed:",
                fallbackErr.response?.status,
                fallbackErr.response?.data
              );
            }
            // If both endpoints fail, throw the fallback error
            // (which will be caught by outer catch block with better error message)
            throw fallbackErr;
          }
        } else {
          throw err;
        }
      }

      // Handle response - check if it's wrapped in success/data structure
      const responseData = resp.data;
      const updated = responseData?.data || responseData;
      if (import.meta.env.DEV) {
        console.log("[NodeProfile] Extracted node data:", updated);
      }

      // Update node data and form fields
      const mergedData = { ...nodeData, ...updated };
      setNodeData(mergedData);

      // Regenerate form fields in case structure changed
      const updatedFields = mapNodeProfileToFields(mergedData);
      setFormFields(updatedFields);

      // Update form values with new data
      const updatedValues: Record<string, any> = {};
      updatedFields.forEach((field) => {
        const value = getNestedValue(mergedData, field.name);
        updatedValues[field.name] = value ?? field.value ?? "";
      });
      setFormValues(updatedValues);

      // Update selected node in the list
      const updatedNodes = nodes.map((n) =>
        n.id === selectedNode.id ? { ...n, ...updated } : n
      );
      setNodes(updatedNodes);
      setSelectedNode({ ...selectedNode, ...updated });

      toast.success("Node profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error("Error saving node:", err);
      console.error("[NodeProfile] Full error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 401) {
        logout();
        toast.error("Session expired — please sign in again");
      } else if (err.response?.status === 403) {
        const errorMessage =
          err.response?.data?.message ||
          "You don't have permission to update this node. Please contact your administrator.";
        toast.error(errorMessage);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to save node changes. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (nodeData) {
      // Reset form values to original node data
      const resetValues: Record<string, any> = {};
      formFields.forEach((field) => {
        const value = getNestedValue(nodeData, field.name);
        resetValues[field.name] = value ?? field.value ?? "";
      });
      setFormValues(resetValues);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading church information...</span>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">Please log in to view nodes</p>
      </div>
    );
  }

  if (nodes.length === 0) {
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

  if (!selectedNode || !nodeData) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-xl font-semibold">Select a node to view details</p>
      </div>
    );
  }

  const nodeName = nodeData.name || selectedNode.name || "Church Name";
  const nodeDescription = nodeData.structure?.description || "";
  const levelName = nodeData.level?.name || "";
  const dateOfEstablishment = nodeData.dateOfEstablishment
    ? new Date(nodeData.dateOfEstablishment).toLocaleDateString()
    : "";

  return (
    <div className="space-y-8">
      {/* Node Selector */}
      {nodes.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Node
          </label>
          <select
            value={selectedNode.id}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            disabled={isEditing}>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name ||
                  node.structure?.name ||
                  node.nodeId ||
                  "Unnamed Node"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Node Header */}
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
                {nodeName}
              </h2>
              {nodeDescription && (
                <p className="text-gray-600 dark:text-gray-300">
                  {nodeDescription}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {levelName && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Building className="w-4 h-4 mr-1" />
                    {levelName}
                  </div>
                )}
                {dateOfEstablishment && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Established {dateOfEstablishment}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Dynamic Form */}
      <DynamicFormRenderer
        fields={formFields}
        values={formValues}
        onChange={handleFieldChange}
        disabled={!isEditing}
      />

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
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
