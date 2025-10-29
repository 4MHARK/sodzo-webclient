import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  Calendar,
  BarChart3,
  Heart,
  Camera,
  Gift,
  GraduationCap,
  Home,
  Search,
  Filter,
  ChevronRight,
  Clock,
  TrendingUp,
  Target,
  Activity,
  Grid3X3,
  List,
  SortAsc,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIntelligentProjectForm } from "../contexts/IntelligentContexts";
import { useAuth } from "../contexts/AuthContext";

// Default gradient colors for different categories
const getGradientForCategory = (category: string) => {
  const gradients: { [key: string]: string } = {
    Membership: "from-blue-500 to-blue-600",
    Events: "from-green-500 to-green-600",
    Ministry: "from-red-500 to-red-600",
    Education: "from-purple-500 to-purple-600",
    Media: "from-pink-500 to-pink-600",
    Giving: "from-orange-500 to-orange-600",
    Fellowship: "from-cyan-500 to-cyan-600",
    Feedback: "from-emerald-500 to-emerald-600",
    default: "from-gray-500 to-gray-600",
  };
  return gradients[category] || gradients.default;
};

// Categories for filtering (will be dynamically generated from actual data)

const sortOptions = [
  { value: "name", label: "Name", icon: SortAsc },
  { value: "submissions", label: "Submissions", icon: TrendingUp },
  { value: "lastUsed", label: "Last Used", icon: Clock },
  { value: "completionRate", label: "Completion Rate", icon: Target },
];

export default function Projects() {
  const navigate = useNavigate();
  const { projectForms, loading, error } = useIntelligentProjectForm();
  const { user: authUser, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = !!(authUser && token);

  // Function to get appropriate icon based on project category
  function getIconForProject(category: string) {
    const iconMap: { [key: string]: any } = {
      Membership: Users,
      Events: Calendar,
      Ministry: Heart,
      Education: GraduationCap,
      Media: Camera,
      Giving: Gift,
      Fellowship: Home,
      Feedback: BarChart3,
      default: FileText,
    };
    return iconMap[category] || FileText;
  }

  // Transform real project forms to match the expected format
  const transformedProjects = projectForms.map((projectForm) => ({
    id: projectForm.id,
    name: projectForm.configuration?.projectName || "Untitled Project",
    description: `A ${
      projectForm.configuration?.tags?.join(", ") || "general"
    } form with ${projectForm.elements?.length || 0} fields`,
    icon: getIconForProject(projectForm.configuration?.tags?.[0] || "default"),
    gradient: getGradientForCategory(
      projectForm.configuration?.tags?.[0] || "default"
    ),
    category: projectForm.configuration?.tags?.[0] || "General",
    fields: projectForm.elements?.length || 0,
    submissions: projectForm.analytics?.submissions || 0,
    lastUsed: projectForm.publishedAt
      ? new Date(projectForm.publishedAt).toISOString().split("T")[0]
      : "Never",
    projectId: projectForm.projectId,
    priority: "medium",
    status: "active",
    completionRate: 85,
    avgTime: "5 min",
    tags: projectForm.configuration?.tags || ["general"],
  }));

  // Use only real project forms from backend
  const allProjects = transformedProjects;

  // Filter and sort projects
  const filteredProjects = allProjects
    .filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tags.some((tag: string) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "submissions":
          return b.submissions - a.submissions;
        case "lastUsed":
          return (
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
          );
        case "completionRate":
          return b.completionRate - a.completionRate;
        default:
          return 0;
      }
    });

  // Get unique categories from actual data
  const categories = ["All", ...new Set(allProjects.map((p) => p.category))];

  // Calculate statistics
  const stats = {
    totalForms: allProjects.length,
    totalSubmissions: allProjects.reduce((sum, p) => sum + p.submissions, 0),
    activeForms: allProjects.filter((p) => p.status === "active").length,
    avgCompletionRate: Math.round(
      allProjects.reduce((sum, p) => sum + p.completionRate, 0) /
        allProjects.length
    ),
  };

  const handleProjectClick = (project: any) => {
    if (isAuthenticated) {
      navigate(`/forms/${project.projectId}`);
    } else {
      navigate(`/forms/${project.id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  // Show loading state
  if (loading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading project forms...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && isAuthenticated) {
    const isBackendNotImplemented = error.message?.includes(
      "not yet implemented"
    );

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-blue-500 text-6xl mb-4">🚧</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isBackendNotImplemented
              ? "Project Forms Coming Soon"
              : "Failed to Load Projects"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isBackendNotImplemented
              ? "The project forms backend endpoint is not yet implemented. This feature will be available soon!"
              : error.message || "Unable to fetch project forms"}
          </p>
          {isBackendNotImplemented ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Demo Mode:</strong> You can still explore the mock
                project templates below to see how the feature will work.
              </p>
            </div>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Authentication Status */}
      {!isAuthenticated && (
        <motion.div
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚠️</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                Demo Mode
              </span>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Showing sample project templates. Log in to access real project
                forms from your organization.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modern Header */}
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Project Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Manage and track your ministry forms with modern task-based design
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
            <Filter className="w-4 h-4" />
            Filters
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Total Forms
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalForms}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Total Submissions
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {stats.totalSubmissions}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Active Forms
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {stats.activeForms}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Avg. Completion
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {stats.avgCompletionRate}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Search and Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Search Forms
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProjects.length} forms found
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Project Grid */}
      <motion.div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group ${
              viewMode === "list" ? "flex items-center p-3" : "p-3"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleProjectClick(project)}>
            {viewMode === "grid" ? (
              <>
                {/* Grid View */}
                <div className="relative mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${project.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <project.icon className="w-6 h-6 text-white" />
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 px-1 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                      project.priority
                    )}`}>
                    {project.priority.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                      {project.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.tags
                      .slice(0, 2)
                      .map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    {project.tags.length > 2 && (
                      <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        +{project.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-3 h-3 mr-1" />
                      <span>{project.fields}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      <span>{project.submissions}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{project.avgTime}</span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-xs font-medium ${getCompletionRateColor(
                          project.completionRate
                        )}`}>
                        {project.completionRate}%
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors ml-1" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* List View */}
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${project.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <project.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 ml-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <div
                      className={`px-1 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        project.priority
                      )}`}>
                      {project.priority.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{project.fields}f</span>
                    <span>{project.submissions}s</span>
                    <span
                      className={`${getCompletionRateColor(
                        project.completionRate
                      )}`}>
                      {project.completionRate}%
                    </span>
                    <span>{project.avgTime}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}>
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No forms found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Try adjusting your search criteria to find the forms you're looking
            for
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Clear Filters
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
