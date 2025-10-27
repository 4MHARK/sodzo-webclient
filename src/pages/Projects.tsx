import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  Calendar,
  BarChart3,
  Heart,
  BookOpen,
  Music,
  Camera,
  Gift,
  GraduationCap,
  Home,
  Briefcase,
  Star,
  Search,
  Filter,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock project templates data
const projectTemplates = [
  {
    id: "1",
    name: "Member Registration",
    description: "Collect new member information and contact details",
    icon: Users,
    color: "bg-blue-500",
    category: "Membership",
    fields: 8,
    submissions: 156,
    lastUsed: "2024-01-15",
  },
  {
    id: "2",
    name: "Event Registration",
    description: "Register attendees for church events and activities",
    icon: Calendar,
    color: "bg-green-500",
    category: "Events",
    fields: 12,
    submissions: 89,
    lastUsed: "2024-01-20",
  },
  {
    id: "3",
    name: "Prayer Request",
    description: "Submit prayer requests and intercessory needs",
    icon: Heart,
    color: "bg-red-500",
    category: "Ministry",
    fields: 5,
    submissions: 234,
    lastUsed: "2024-01-18",
  },
  {
    id: "4",
    name: "Bible Study Signup",
    description: "Register for Bible study groups and classes",
    icon: BookOpen,
    color: "bg-purple-500",
    category: "Education",
    fields: 7,
    submissions: 67,
    lastUsed: "2024-01-12",
  },
  {
    id: "5",
    name: "Worship Team Application",
    description: "Apply to join the worship and music ministry",
    icon: Music,
    color: "bg-yellow-500",
    category: "Ministry",
    fields: 15,
    submissions: 23,
    lastUsed: "2024-01-10",
  },
  {
    id: "6",
    name: "Photo Gallery Submission",
    description: "Submit photos for church events and activities",
    icon: Camera,
    color: "bg-pink-500",
    category: "Media",
    fields: 4,
    submissions: 145,
    lastUsed: "2024-01-16",
  },
  {
    id: "7",
    name: "Volunteer Application",
    description: "Apply to volunteer for various church ministries",
    icon: Briefcase,
    color: "bg-indigo-500",
    category: "Ministry",
    fields: 10,
    submissions: 78,
    lastUsed: "2024-01-14",
  },
  {
    id: "8",
    name: "Gift Donation",
    description: "Submit information for gift donations and offerings",
    icon: Gift,
    color: "bg-orange-500",
    category: "Giving",
    fields: 6,
    submissions: 45,
    lastUsed: "2024-01-11",
  },
  {
    id: "9",
    name: "Children Ministry Registration",
    description: "Register children for Sunday school and activities",
    icon: GraduationCap,
    color: "bg-teal-500",
    category: "Education",
    fields: 9,
    submissions: 123,
    lastUsed: "2024-01-17",
  },
  {
    id: "10",
    name: "Home Fellowship Signup",
    description: "Join home fellowship groups and small groups",
    icon: Home,
    color: "bg-cyan-500",
    category: "Fellowship",
    fields: 8,
    submissions: 56,
    lastUsed: "2024-01-13",
  },
  {
    id: "11",
    name: "Testimony Submission",
    description: "Share your testimony and faith journey",
    icon: Star,
    color: "bg-amber-500",
    category: "Ministry",
    fields: 5,
    submissions: 34,
    lastUsed: "2024-01-09",
  },
  {
    id: "12",
    name: "Ministry Feedback",
    description: "Provide feedback on church ministries and services",
    icon: BarChart3,
    color: "bg-emerald-500",
    category: "Feedback",
    fields: 11,
    submissions: 67,
    lastUsed: "2024-01-19",
  },
];

const categories = [
  "All",
  "Membership",
  "Events",
  "Ministry",
  "Education",
  "Media",
  "Giving",
  "Fellowship",
  "Feedback",
];

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredProjects, setFilteredProjects] = useState(projectTemplates);
  const navigate = useNavigate();

  useEffect(() => {
    let filtered = projectTemplates;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (project) => project.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  }, [searchTerm, selectedCategory]);

  const handleProjectClick = (projectId: string) => {
    navigate(`/forms/${projectId}`);
  };

  const handleCreateNew = () => {
    navigate("/forms/new");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Choose from pre-built form templates or create your own
          </p>
        </div>
        <motion.button
          onClick={handleCreateNew}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Form
        </motion.button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Forms
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projectTemplates.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Submissions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {projectTemplates.reduce(
                  (sum, project) => sum + project.submissions,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Active Forms
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredProjects.length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Project Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}>
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleProjectClick(project.id)}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${project.color}`}>
                <project.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {project.category}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {project.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                <span>{project.fields} fields</span>
              </div>
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-1" />
                <span>{project.submissions} submissions</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last used: {new Date(project.lastUsed).toLocaleDateString()}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}>
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No forms found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Clear Filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
