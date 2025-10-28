import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { dataManager, SyncStatus } from "../utils/dataManager";
import { createAPIClient } from "../utils/intelligentAPIClient";
import { API_ENDPOINTS, API_BASE } from "../utils/api";
import { useAuth } from "./AuthContext";

interface DataContextType {
  // Cache management
  cacheStats: ReturnType<typeof dataManager.getCacheStats>;
  syncStatus: SyncStatus;
  clearCache: () => void;
  forceSync: () => Promise<void>;

  // Network status
  isOnline: boolean;

  // Data operations
  invalidateEndpoint: (endpoint: string) => void;
  prefetchData: (endpoint: string, params?: any) => Promise<void>;

  // Monitoring
  getMetrics: () => any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [cacheStats, setCacheStats] = useState(dataManager.getCacheStats());
  const [syncStatus, setSyncStatus] = useState(dataManager.getSyncStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(dataManager.getCacheStats());
      setSyncStatus(dataManager.getSyncStatus());
    };

    const interval = setInterval(updateStats, 5000);

    // Listen for data manager events
    const handleCacheUpdate = () => updateStats();
    const handleSyncComplete = () => updateStats();
    const handleOnline = () => {
      setIsOnline(true);
      updateStats();
    };
    const handleOffline = () => {
      setIsOnline(false);
      updateStats();
    };

    dataManager.on("cache_set", handleCacheUpdate);
    dataManager.on("cache_cleared", handleCacheUpdate);
    dataManager.on("sync_complete", handleSyncComplete);
    dataManager.on("online", handleOnline);
    dataManager.on("offline", handleOffline);

    return () => {
      clearInterval(interval);
      dataManager.off("cache_set", handleCacheUpdate);
      dataManager.off("cache_cleared", handleCacheUpdate);
      dataManager.off("sync_complete", handleSyncComplete);
      dataManager.off("online", handleOnline);
      dataManager.off("offline", handleOffline);
    };
  }, []);

  const clearCache = () => {
    dataManager.clearCache();
  };

  const forceSync = async () => {
    await dataManager.syncData();
  };

  const invalidateEndpoint = (endpoint: string) => {
    dataManager.emit("invalidate_endpoint", endpoint);
  };

  const prefetchData = async (endpoint: string, params?: any) => {
    // Note: Prefetching is now handled by individual providers
    console.log("Prefetch requested for:", endpoint, params);
  };

  const getMetrics = () => {
    return {
      cache: dataManager.getCacheStats(),
      sync: dataManager.getSyncStatus(),
      network: {
        isOnline,
        connectionType: (navigator as any).connection?.effectiveType,
        downlink: (navigator as any).connection?.downlink,
      },
    };
  };

  const value: DataContextType = {
    cacheStats,
    syncStatus,
    clearCache,
    forceSync,
    isOnline,
    invalidateEndpoint,
    prefetchData,
    getMetrics,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
}

// Enhanced User Context with intelligent caching
interface UserContextType {
  user: any | null;
  loading: boolean;
  error: Error | null;
  updateUser: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  invalidateUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function IntelligentUserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, token, api } = useAuth();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Note: Token management is now handled by the main API instance

  // Load user data with caching - only when authenticated
  const loadUser = async () => {
    if (!authUser || !token) {
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the user ID from authUser to get specific user data
      const userData = await apiClient.get(
        `${API_ENDPOINTS.USER}/${authUser.id}`,
        undefined,
        {
          cache: { ttl: 10 * 60 * 1000 }, // 10 minutes
        }
      );

      setUser(userData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Update user with optimistic updates
  const updateUser = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousUser = user;
      setUser({ ...user, ...data });

      try {
        const updatedUser = await apiClient.patch(
          `${API_ENDPOINTS.USER}/${authUser?.id}`,
          data,
          {
            optimistic: true,
            rollbackOnError: true,
          }
        );
        setUser(updatedUser);
      } catch (err) {
        // Rollback on error
        setUser(previousUser);
        throw err;
      }
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    await loadUser();
  };

  // Invalidate user cache
  const invalidateUser = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.USER);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadUser();
    } else {
      setUser(null);
      setError(null);
    }
  }, [authUser, token]);

  // Listen for user updates from other sources
  useEffect(() => {
    const handleUserUpdate = (event: { data: any }) => {
      if (event.data && event.data.id === user?.id) {
        setUser(event.data);
      }
    };

    dataManager.on("user_updated", handleUserUpdate);
    return () => dataManager.off("user_updated", handleUserUpdate);
  }, [user?.id]);

  const value: UserContextType = {
    user,
    loading,
    error,
    updateUser,
    refreshUser,
    invalidateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useIntelligentUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentUser must be used within an IntelligentUserProvider"
    );
  }
  return context;
}

// Enhanced UserProfile Context with intelligent caching
interface UserProfileContextType {
  userProfile: any | null;
  loading: boolean;
  error: Error | null;
  updateUserProfile: (data: any) => Promise<any>;
  refreshUserProfile: () => Promise<void>;
  invalidateUserProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export function IntelligentUserProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser, token, api } = useAuth();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Note: Token management is now handled by the main API instance

  // Load user profile with caching - only when authenticated
  const loadUserProfile = async () => {
    if (!authUser || !token) {
      setUserProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userProfileData = (await apiClient.get(
        `${API_ENDPOINTS.USER_PROFILE}/${authUser.id}`,
        undefined,
        {
          cache: { ttl: 5 * 60 * 1000 }, // 5 minutes
        }
      )) as any;

      setUserProfile(userProfileData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile with optimistic updates
  const updateUserProfile = async (data: any) => {
    if (!authUser?.id) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousProfile = userProfile;
      setUserProfile({ ...userProfile, ...data });

      try {
        const updatedProfile = await apiClient.put(
          `${API_ENDPOINTS.USER_PROFILE}/${authUser.id}`,
          data,
          {
            optimistic: true,
            rollbackOnError: true,
          }
        );
        setUserProfile(updatedProfile);
        return updatedProfile;
      } catch (err) {
        // Rollback on error
        setUserProfile(previousProfile);
        throw err;
      }
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    await loadUserProfile();
  };

  // Invalidate user profile cache
  const invalidateUserProfile = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.USER_PROFILE);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadUserProfile();
    } else {
      setUserProfile(null);
      setError(null);
    }
  }, [authUser, token]);

  // Listen for user profile updates from other sources
  useEffect(() => {
    const handleUserProfileUpdate = (event: { data: any }) => {
      if (event.data) {
        setUserProfile(event.data);
      }
    };

    dataManager.on("user_profile_updated", handleUserProfileUpdate);
    return () =>
      dataManager.off("user_profile_updated", handleUserProfileUpdate);
  }, []);

  const value: UserProfileContextType = {
    userProfile,
    loading,
    error,
    updateUserProfile,
    refreshUserProfile,
    invalidateUserProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useIntelligentUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentUserProfile must be used within an IntelligentUserProfileProvider"
    );
  }
  return context;
}

// Enhanced Node Context with intelligent caching
interface NodeContextType {
  nodes: any[];
  selectedNode: any | null;
  loading: boolean;
  error: Error | null;
  selectNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: any) => Promise<void>;
  refreshNodes: () => Promise<void>;
  invalidateNodes: () => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

export function IntelligentNodeProvider({ children }: { children: ReactNode }) {
  const { user: authUser, token, api } = useAuth();
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Note: Token management is now handled by the main API instance

  // Load user-specific nodes with caching - only when authenticated
  const loadNodes = async () => {
    if (!authUser || !token) {
      console.log("🔒 No authentication - skipping node load");
      setNodes([]);
      setSelectedNode(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading user-specific nodes for user: ${authUser.id}`);
      const endpoint = `${API_ENDPOINTS.USER}/${authUser.id}/nodes`;
      console.log(`📡 Fetching from endpoint: ${endpoint}`);

      const nodesData = (await apiClient.get(endpoint, undefined, {
        cache: { ttl: 5 * 60 * 1000 }, // 5 minutes
      })) as any;

      console.log("📊 Nodes data received:", nodesData);
      const nodesArray = nodesData.results || nodesData || [];
      console.log(`✅ Loaded ${nodesArray.length} nodes for user`);

      setNodes(nodesArray);

      // Select first node if none selected
      if (!selectedNode && nodesArray.length > 0) {
        console.log("🎯 Selecting first node:", nodesArray[0]);
        setSelectedNode(nodesArray[0]);
      }
    } catch (err: any) {
      console.error("❌ Error loading nodes:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Select node
  const selectNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };

  // Update node with optimistic updates
  const updateNode = async (nodeId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Updating node ${nodeId} with data:`, data);
      console.log(`📡 PATCH endpoint: ${API_ENDPOINTS.NODE}/${nodeId}`);

      // Optimistic update
      const previousNodes = nodes;
      const updatedNodes = nodes.map((node) =>
        node.id === nodeId ? { ...node, ...data } : node
      );
      setNodes(updatedNodes);

      // Update selected node if it's the one being updated
      if (selectedNode?.id === nodeId) {
        console.log("🎯 Updating selected node optimistically");
        setSelectedNode({ ...selectedNode, ...data });
      }

      try {
        const updatedNode = await apiClient.patch(
          `${API_ENDPOINTS.NODE}/${nodeId}`,
          data,
          {
            optimistic: true,
            rollbackOnError: true,
          }
        );

        console.log("✅ Node update successful:", updatedNode);

        // Update with server response
        const finalNodes = nodes.map((node) =>
          node.id === nodeId ? updatedNode : node
        );
        setNodes(finalNodes);

        if (selectedNode?.id === nodeId) {
          setSelectedNode(updatedNode);
        }
      } catch (err) {
        console.error("❌ Node update failed, rolling back:", err);
        // Rollback on error
        setNodes(previousNodes);
        if (selectedNode?.id === nodeId) {
          const originalNode = previousNodes.find((n) => n.id === nodeId);
          setSelectedNode(originalNode || null);
        }
        throw err;
      }
    } catch (err: any) {
      console.error("❌ Node update error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh nodes
  const refreshNodes = async () => {
    await loadNodes();
  };

  // Invalidate nodes cache
  const invalidateNodes = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.NODE);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadNodes();
    } else {
      setNodes([]);
      setSelectedNode(null);
      setError(null);
    }
  }, [authUser, token]);

  // Listen for node updates from other sources
  useEffect(() => {
    const handleNodeUpdate = (event: { data: any }) => {
      if (event.data) {
        const updatedNodes = nodes.map((node) =>
          node.id === event.data.id ? event.data : node
        );
        setNodes(updatedNodes);

        if (selectedNode?.id === event.data.id) {
          setSelectedNode(event.data);
        }
      }
    };

    dataManager.on("node_updated", handleNodeUpdate);
    return () => dataManager.off("node_updated", handleNodeUpdate);
  }, [nodes, selectedNode?.id]);

  const value: NodeContextType = {
    nodes,
    selectedNode,
    loading,
    error,
    selectNode,
    updateNode,
    refreshNodes,
    invalidateNodes,
  };

  return <NodeContext.Provider value={value}>{children}</NodeContext.Provider>;
}

export function useIntelligentNode() {
  const context = useContext(NodeContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentNode must be used within an IntelligentNodeProvider"
    );
  }
  return context;
}

// Node Profile Context
interface NodeProfileContextType {
  nodeProfile: any | null;
  loading: boolean;
  error: Error | null;
  loadNodeProfile: (nodeId: string) => Promise<void>;
  updateNodeProfile: (nodeId: string, data: any) => Promise<any>;
  refreshNodeProfile: (nodeId: string) => Promise<void>;
  invalidateNodeProfile: () => void;
}

const NodeProfileContext = createContext<NodeProfileContextType | undefined>(
  undefined
);

export function IntelligentNodeProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser, token, api } = useAuth();
  const [nodeProfile, setNodeProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Note: Token management is now handled by the main API instance

  // Load node profile with caching - only when authenticated
  const loadNodeProfile = async (nodeId: string) => {
    if (!authUser || !token || !nodeId) {
      console.log(
        "🔒 No authentication or nodeId - skipping node profile load"
      );
      setNodeProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🔍 Loading node profile for node: ${nodeId}`);
      const endpoint = `${API_ENDPOINTS.NODE_PROFILE}/node/${nodeId}`;
      console.log(`📡 Fetching from endpoint: ${endpoint}`);

      const profileData = (await apiClient.get(endpoint, undefined, {
        cache: { ttl: 5 * 60 * 1000 }, // 5 minutes
      })) as any;

      console.log("📊 Node profile data received:", profileData);
      setNodeProfile(profileData);
    } catch (err: any) {
      console.error("❌ Error loading node profile:", err);
      if (err.response?.status === 404) {
        console.log(
          "ℹ️ No node profile found for this node - will show empty form"
        );
        setNodeProfile(null);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update node profile with optimistic updates
  const updateNodeProfile = async (nodeId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `🔄 Updating node profile for node ${nodeId} with data:`,
        data
      );
      console.log(`📡 POST endpoint: ${API_ENDPOINTS.NODE_PROFILE}/upsert`);

      // Optimistic update
      const previousProfile = nodeProfile;
      setNodeProfile({ ...nodeProfile, ...data });

      try {
        const updatedProfile = await apiClient.post(
          `${API_ENDPOINTS.NODE_PROFILE}/upsert`,
          {
            ...data,
            node: nodeId,
            tenantId: (authUser as any)?.tenantId || "default-tenant",
          },
          {
            optimistic: true,
            rollbackOnError: true,
          }
        );

        console.log("✅ Node profile update successful:", updatedProfile);
        setNodeProfile(updatedProfile);
        return updatedProfile;
      } catch (err) {
        console.error("❌ Node profile update failed, rolling back:", err);
        // Rollback on error
        setNodeProfile(previousProfile);
        throw err;
      }
    } catch (err: any) {
      console.error("❌ Node profile update error:", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh node profile
  const refreshNodeProfile = async (nodeId: string) => {
    await loadNodeProfile(nodeId);
  };

  // Invalidate node profile cache
  const invalidateNodeProfile = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.NODE_PROFILE);
  };

  // Listen for node profile updates from other sources
  useEffect(() => {
    const handleNodeProfileUpdate = (event: { data: any }) => {
      if (event.data) {
        console.log(
          "🔄 Node profile updated from external source:",
          event.data
        );
        setNodeProfile(event.data);
      }
    };

    dataManager.on("node_profile_updated", handleNodeProfileUpdate);
    return () =>
      dataManager.off("node_profile_updated", handleNodeProfileUpdate);
  }, []);

  const value: NodeProfileContextType = {
    nodeProfile,
    loading,
    error,
    loadNodeProfile,
    updateNodeProfile,
    refreshNodeProfile,
    invalidateNodeProfile,
  };

  return (
    <NodeProfileContext.Provider value={value}>
      {children}
    </NodeProfileContext.Provider>
  );
}

export function useIntelligentNodeProfile() {
  const context = useContext(NodeProfileContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentNodeProfile must be used within an IntelligentNodeProfileProvider"
    );
  }
  return context;
}

// Project Form Context
interface ProjectFormContextType {
  projectForms: any[];
  selectedProjectForm: any | null;
  loading: boolean;
  error: Error | null;
  selectProjectForm: (projectId: string) => void;
  createProjectForm: (data: any) => Promise<any>;
  updateProjectForm: (projectFormId: string, data: any) => Promise<any>;
  deleteProjectForm: (projectFormId: string) => Promise<void>;
  refreshProjectForms: () => Promise<void>;
  invalidateProjectForms: () => void;
}

const ProjectFormContext = createContext<ProjectFormContextType | undefined>(
  undefined
);

export function IntelligentProjectFormProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser, token, api } = useAuth();
  const [projectForms, setProjectForms] = useState<any[]>([]);
  const [selectedProjectForm, setSelectedProjectForm] = useState<any | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Load project forms with caching - only when authenticated
  const loadProjectForms = async () => {
    if (!authUser || !token) {
      console.log("🔒 No authentication - skipping project forms load");
      setProjectForms([]);
      setSelectedProjectForm(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Loading project forms...");
      console.log("👤 Auth user:", authUser);
      console.log("🏢 Tenant ID:", authUser.tenantId);

      if (!authUser.tenantId) {
        console.error("❌ No tenant ID found in auth user");
        setError(new Error("No tenant ID found in user data"));
        return;
      }

      const endpoint = `${API_ENDPOINTS.PROJECT_FORM}/tenant/${authUser.tenantId}`;
      console.log(`📡 Fetching from endpoint: ${endpoint}`);
      console.log(`🌐 Full URL: ${API_BASE}${endpoint}`);

      const projectFormsData = (await apiClient.get(endpoint, undefined, {
        cache: { ttl: 5 * 60 * 1000 }, // 5 minutes
      })) as any;

      console.log("📊 Project forms data received:", projectFormsData);
      const formsArray = projectFormsData.results || projectFormsData || [];
      console.log(`✅ Loaded ${formsArray.length} project forms`);

      setProjectForms(formsArray);

      // Select first project form if none selected
      if (!selectedProjectForm && formsArray.length > 0) {
        setSelectedProjectForm(formsArray[0]);
      }
    } catch (err: any) {
      console.error("❌ Error loading project forms:", err);
      console.error(
        "❌ Error details:",
        err.response?.status,
        err.response?.data
      );
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Select project form
  const selectProjectForm = (projectId: string) => {
    const projectForm = projectForms.find((pf) => pf.projectId === projectId);
    if (projectForm) {
      setSelectedProjectForm(projectForm);
    }
  };

  // Create project form
  const createProjectForm = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const newProjectForm = await apiClient.post(
        API_ENDPOINTS.PROJECT_FORM,
        data,
        {
          optimistic: true,
          rollbackOnError: true,
        }
      );

      setProjectForms([...projectForms, newProjectForm]);
      return newProjectForm;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update project form with optimistic updates
  const updateProjectForm = async (projectFormId: string, data: any) => {
    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousProjectForms = projectForms;
      const updatedProjectForms = projectForms.map((projectForm) =>
        projectForm.id === projectFormId
          ? { ...projectForm, ...data }
          : projectForm
      );
      setProjectForms(updatedProjectForms);

      // Update selected project form if it's the one being updated
      if (selectedProjectForm?.id === projectFormId) {
        setSelectedProjectForm({ ...selectedProjectForm, ...data });
      }

      try {
        const updatedProjectForm = await apiClient.patch(
          `${API_ENDPOINTS.PROJECT_FORM}/${projectFormId}`,
          data,
          {
            optimistic: true,
            rollbackOnError: true,
          }
        );

        // Update with server response
        const finalProjectForms = projectForms.map((projectForm) =>
          projectForm.id === projectFormId ? updatedProjectForm : projectForm
        );
        setProjectForms(finalProjectForms);

        if (selectedProjectForm?.id === projectFormId) {
          setSelectedProjectForm(updatedProjectForm);
        }
      } catch (err) {
        // Rollback on error
        setProjectForms(previousProjectForms);
        if (selectedProjectForm?.id === projectFormId) {
          const originalProjectForm = previousProjectForms.find(
            (pf) => pf.id === projectFormId
          );
          setSelectedProjectForm(originalProjectForm || null);
        }
        throw err;
      }
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete project form
  const deleteProjectForm = async (projectFormId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`${API_ENDPOINTS.PROJECT_FORM}/${projectFormId}`);

      setProjectForms(projectForms.filter((pf) => pf.id !== projectFormId));
      if (selectedProjectForm?.id === projectFormId) {
        setSelectedProjectForm(null);
      }
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh project forms
  const refreshProjectForms = async () => {
    await loadProjectForms();
  };

  // Invalidate project forms cache
  const invalidateProjectForms = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.PROJECT_FORM);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadProjectForms();
    } else {
      setProjectForms([]);
      setSelectedProjectForm(null);
      setError(null);
    }
  }, [authUser, token]);

  // Listen for project form updates from other sources
  useEffect(() => {
    const handleProjectFormUpdate = (event: { data: any }) => {
      if (event.data) {
        const updatedProjectForms = projectForms.map((pf) =>
          pf.id === event.data.id ? event.data : pf
        );
        setProjectForms(updatedProjectForms);

        if (selectedProjectForm?.id === event.data.id) {
          setSelectedProjectForm(event.data);
        }
      }
    };

    dataManager.on("project_form_updated", handleProjectFormUpdate);
    return () =>
      dataManager.off("project_form_updated", handleProjectFormUpdate);
  }, [projectForms, selectedProjectForm?.id]);

  const value: ProjectFormContextType = {
    projectForms,
    selectedProjectForm,
    loading,
    error,
    selectProjectForm,
    createProjectForm,
    updateProjectForm,
    deleteProjectForm,
    refreshProjectForms,
    invalidateProjectForms,
  };

  return (
    <ProjectFormContext.Provider value={value}>
      {children}
    </ProjectFormContext.Provider>
  );
}

export const useIntelligentProjectForm = () => {
  const context = useContext(ProjectFormContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentProjectForm must be used within an IntelligentProjectFormProvider"
    );
  }
  return context;
};

// Storage Context
interface StorageContextType {
  files: any[];
  stats: any | null;
  loading: boolean;
  error: Error | null;
  uploadFile: (file: File) => Promise<any>;
  getFile: (fileId: string) => Promise<any>;
  deleteFile: (fileId: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
  invalidateStorage: () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function IntelligentStorageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser, token, api } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Load storage stats with caching - only when authenticated
  const loadStats = async () => {
    if (!authUser || !token) {
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const statsData = (await apiClient.get(
        `${API_ENDPOINTS.STORAGE}/stats`,
        undefined,
        {
          cache: { ttl: 2 * 60 * 1000 }, // 2 minutes
        }
      )) as any;

      setStats(statsData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const uploadedFile = await apiClient.post(
        `${API_ENDPOINTS.STORAGE}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          optimistic: true,
          rollbackOnError: true,
        }
      );

      setFiles([...files, uploadedFile]);
      return uploadedFile;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get file by ID
  const getFile = async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);

      const fileData = await apiClient.get(
        `${API_ENDPOINTS.STORAGE}/${fileId}`,
        undefined,
        {
          cache: { ttl: 5 * 60 * 1000 }, // 5 minutes
        }
      );

      return fileData;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`${API_ENDPOINTS.STORAGE}/${fileId}`);

      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh storage data
  const refreshFiles = async () => {
    await loadStats();
  };

  // Invalidate storage cache
  const invalidateStorage = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.STORAGE);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadStats();
    } else {
      setStats(null);
      setError(null);
    }
  }, [authUser, token]);

  const value: StorageContextType = {
    files,
    stats,
    loading,
    error,
    uploadFile,
    getFile,
    deleteFile,
    refreshFiles,
    invalidateStorage,
  };

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export const useIntelligentStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentStorage must be used within an IntelligentStorageProvider"
    );
  }
  return context;
};

// Inmail Context
interface InmailContextType {
  messages: any[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  getMessage: (messageId: string) => Promise<any>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  invalidateInmail: () => void;
}

const InmailContext = createContext<InmailContextType | undefined>(undefined);

export function IntelligentInmailProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser, token, api } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create API client with main API instance (includes refresh logic)
  const apiClient = createAPIClient({}, api);

  // Load messages with caching - only when authenticated
  const loadMessages = async () => {
    if (!authUser || !token) {
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const messagesData = (await apiClient.get(
        API_ENDPOINTS.INMAIL,
        undefined,
        {
          cache: { ttl: 1 * 60 * 1000 }, // 1 minute
        }
      )) as any;

      setMessages(messagesData.results || messagesData);

      // Load unread count
      const countData = (await apiClient.get(
        `${API_ENDPOINTS.INMAIL}/count`,
        undefined,
        {
          cache: { ttl: 30 * 1000 }, // 30 seconds
        }
      )) as any;

      setUnreadCount(countData.count || countData.unreadCount || 0);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Get message by ID
  const getMessage = async (messageId: string) => {
    try {
      setLoading(true);
      setError(null);

      const messageData = await apiClient.get(
        `${API_ENDPOINTS.INMAIL}/${messageId}`,
        undefined,
        {
          cache: { ttl: 2 * 60 * 1000 }, // 2 minutes
        }
      );

      return messageData;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`${API_ENDPOINTS.INMAIL}/${messageId}`);

      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh messages
  const refreshMessages = async () => {
    await loadMessages();
  };

  // Invalidate inmail cache
  const invalidateInmail = () => {
    dataManager.emit("invalidate_endpoint", API_ENDPOINTS.INMAIL);
  };

  // Initial load - only when authenticated
  useEffect(() => {
    if (authUser && token) {
      loadMessages();
    } else {
      setMessages([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [authUser, token]);

  // Listen for message updates from other sources
  useEffect(() => {
    const handleMessageUpdate = (event: { data: any }) => {
      if (event.data) {
        const updatedMessages = messages.map((m) =>
          m.id === event.data.id ? event.data : m
        );
        setMessages(updatedMessages);
      }
    };

    dataManager.on("message_updated", handleMessageUpdate);
    return () => dataManager.off("message_updated", handleMessageUpdate);
  }, [messages]);

  const value: InmailContextType = {
    messages,
    unreadCount,
    loading,
    error,
    getMessage,
    deleteMessage,
    refreshMessages,
    invalidateInmail,
  };

  return (
    <InmailContext.Provider value={value}>{children}</InmailContext.Provider>
  );
}

export const useIntelligentInmail = () => {
  const context = useContext(InmailContext);
  if (context === undefined) {
    throw new Error(
      "useIntelligentInmail must be used within an IntelligentInmailProvider"
    );
  }
  return context;
};
