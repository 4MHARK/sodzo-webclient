import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import type { User as UserModel } from "../contexts/UserContext";
import {
  ChevronRight,
  ChevronDown,
  Building,
  MapPin,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDeviceDetection } from "../hooks/useDeviceDetection";

interface Node {
  id: string;
  nodeId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  level?: {
    id: string;
    name: string;
  };
  structure?: {
    id: string;
    name: string;
  };
  parent?: string | { id: string; name: string };
  children?: Node[];
  isMain?: boolean;
  isActive?: boolean;
}

export default function Network() {
  const { api, logout, user: authUser } = useAuth();
  const { user: userContextUser } = useUser();
  const { isMobile } = useDeviceDetection();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get user ID from both contexts
  const user: Partial<UserModel> | null =
    (authUser as unknown as Partial<UserModel>) ?? userContextUser ?? null;
  const userId = user?.id;

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Build hierarchy from flat node list
  const buildHierarchy = (nodeList: Node[]): Node[] => {
    const nodeMap = new Map<string, Node>();
    const rootNodes: Node[] = [];

    // First pass: create map of all nodes
    nodeList.forEach((node) => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Second pass: build parent-child relationships
    nodeList.forEach((node) => {
      const nodeWithChildren = nodeMap.get(node.id)!;
      const parentId =
        typeof node.parent === "string" ? node.parent : node.parent?.id || null;

      if (parentId && nodeMap.has(parentId)) {
        const parent = nodeMap.get(parentId)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(nodeWithChildren);
      } else {
        // No parent or parent not in list = root node
        rootNodes.push(nodeWithChildren);
      }
    });

    return rootNodes;
  };

  // Fetch all nodes
  useEffect(() => {
    const fetchNodes = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch user's nodes
        const res = await api.get(`/users/${userId}/nodes`);
        const userNodes = res.data?.results || res.data || [];

        // Fetch full details for each node to get hierarchy info
        const nodesWithDetails = await Promise.all(
          userNodes.map(async (node: any) => {
            try {
              const nodeRes = await api.get(`/node/${node.id}`);
              return nodeRes.data;
            } catch (err) {
              // If individual node fetch fails, use the node from list
              return node;
            }
          })
        );

        setNodes(nodesWithDetails);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          toast.error("Session expired — please sign in again");
        } else {
          toast.error("Failed to load network");
          console.error("Network fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, [userId, api, logout]);

  // Render node tree recursively
  const renderNodeTree = (
    nodeList: Node[],
    level: number = 0
  ): JSX.Element[] => {
    return nodeList.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const indentLevel = level * (isMobile ? 16 : 24); // Reduced indent on mobile

      return (
        <div key={node.id} className="select-none">
          {/* Node Item */}
          <div
            className={`flex items-center py-2.5 mobile:py-2.5 md:py-3 px-3 mobile:px-3 md:px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all active:bg-gray-100 dark:active:bg-gray-700 ${
              level === 0
                ? `border-l-4 ${
                    isMobile
                      ? "border-l-4 border-blue-500 mobile-glow"
                      : "border-blue-500"
                  }`
                : ""
            } ${
              isMobile && level === 0
                ? "bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/10"
                : ""
            }`}
            style={{ paddingLeft: `${(isMobile ? 12 : 16) + indentLevel}px` }}>
            {/* Expand/Collapse Button */}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors touch-target">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            ) : (
              <div className={`${isMobile ? "w-5" : "w-6"} mr-2`} /> // Spacer for alignment
            )}

            {/* Node Icon */}
            <div className="flex-shrink-0 mr-2 mobile:mr-2 md:mr-3">
              <Building className="w-4 h-4 mobile:w-4 mobile:h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
            </div>

            {/* Node Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mobile:gap-1.5 md:gap-2">
                <h3 className="text-sm mobile:text-sm md:text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
                  {node.name}
                </h3>
                {node.isMain && (
                  <span className="px-1.5 mobile:px-1.5 md:px-2 py-0.5 text-[10px] mobile:text-[10px] md:text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded whitespace-nowrap">
                    Main
                  </span>
                )}
                {node.isActive === false && (
                  <span className="px-1.5 mobile:px-1.5 md:px-2 py-0.5 text-[10px] mobile:text-[10px] md:text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded whitespace-nowrap">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex flex-col mobile:flex-col md:flex-row md:items-center md:space-x-4 space-y-0.5 mobile:space-y-0.5 md:space-y-0 mt-1">
                {node.level?.name && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{node.level.name}</span>
                  </div>
                )}
                {(node.address || node.city || node.state) && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {[node.address, node.city, node.state, node.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div
              className={`${
                isMobile ? "ml-2" : "ml-4"
              } border-l-2 border-gray-200 dark:border-gray-700`}>
              {renderNodeTree(node.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const hierarchicalNodes = buildHierarchy(nodes);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Loading network...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Network
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            View your organization's hierarchical network structure
          </p>
        </div>
      )}

      {/* Network Tree */}
      <div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
          isMobile ? "mobile-card-elevated" : "bg-white dark:bg-gray-800"
        }`}>
        <div className="p-4 mobile:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base mobile:text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Node Hierarchy
          </h2>
          <p className="text-xs mobile:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {hierarchicalNodes.length} root node(s) • {nodes.length} total
            node(s)
          </p>
        </div>

        <div className="p-2 mobile:p-2 md:p-4">
          {hierarchicalNodes.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No nodes found in your network
              </p>
            </div>
          ) : (
            <div className="space-y-1">{renderNodeTree(hierarchicalNodes)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
