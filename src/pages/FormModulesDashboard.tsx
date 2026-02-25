import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, FileText, CheckCircle2, Activity, CreditCard, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDeviceDetection } from "../hooks/useDeviceDetection";
import { useUserNode } from "../hooks/useUserNode";
import ModuleCard from "../components/FormModules/ModuleCard";
import ModuleCardCompact from "../components/FormModules/ModuleCardCompact";
import FormDrawer from "../components/FormModules/FormDrawer";
import { currentMonthValue } from "../components/FormModules/MonthYearSelector";
import { mapFormsToModules, FormModuleData } from "../utils/formModuleMapper";
import toast from "react-hot-toast";

interface ProjectForm {
  projectId: string;
  configuration?: {
    projectName?: string;
    description?: string;
    category?: string;
  };
  elements?: any[];
  submissions?: any[];
  updatedAt?: string;
}

export default function FormModulesDashboard() {
  const { api, user } = useAuth();
  // Fetch once at mount — result cached across re-renders
  const { nodeId: userNodeId, node: userNode, loading: nodeLoading } = useUserNode();
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<FormModuleData[]>([]);
  const [filteredModules, setFilteredModules] = useState<FormModuleData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedModule, setSelectedModule] = useState<FormModuleData | null>(null);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Reporting month for PERM-enabled forms — defaults to the current month
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue());
  // Compliance-approved months from the backend; undefined = not yet fetched
  const [allowedMonths, setAllowedMonths] = useState<string[] | undefined>(undefined);
  const [lockedMonths, setLockedMonths] = useState<string[]>([]);

  // Per-date event schedule for the selected month (daily / weekly modes)
  const [allowedEventDates, setAllowedEventDates] = useState<any[] | undefined>(undefined);
  const [selectedEventDate, setSelectedEventDate] = useState<string>("");
  const [eventDatesLoading, setEventDatesLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState<string>("none");

  // Fetch forms from API
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const response = await api.get("/project-forms/");
        const forms: ProjectForm[] = response.data?.results || [];
        const mappedModules = mapFormsToModules(forms);
        
        if (mappedModules.length === 0) {
          toast.error("No modules available");
        }
        
        setModules(mappedModules);
        setFilteredModules(mappedModules);
      } catch (error: any) {
        console.error("Error fetching forms:", error);
          toast.error("Failed to load modules");
        setModules([]);
        setFilteredModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [api]);

  // Filter modules
  useEffect(() => {
    let filtered = modules;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (module) => module.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (module) =>
          module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredModules(filtered);
  }, [searchTerm, selectedCategory, modules]);

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(modules.map(m => m.category).filter(Boolean)))];

  // Fetch per-date schedule for the selected month (daily / weekly modes)
  const fetchEventDates = async (
    projectId: string,
    nodeId: string,
    month: string,        // "YYYY-MM"
    mode: string
  ) => {
    if (mode === "none" || !mode) {
      setAllowedEventDates(undefined);
      setSelectedEventDate("");
      return;
    }
    try {
      setEventDatesLoading(true);
      const res = await api.get("/submissions/allowed-dates", {
        params: { projectId, nodeId, month },
      });
      const { dates = [], trackingMode: tm } = res.data;
      setTrackingMode(tm || "none");
      setAllowedEventDates(dates);
      // Auto-select the first available date
      const today = new Date().toISOString().split("T")[0];
      const firstOpen = dates.find((d: any) => !d.isFull && d.date >= today);
      setSelectedEventDate(firstOpen?.date ?? dates[0]?.date ?? "");
    } catch (err) {
      console.warn("Event dates fetch failed:", err);
      setAllowedEventDates([]);
    } finally {
      setEventDatesLoading(false);
    }
  };

  // When the user changes the reporting month, re-fetch event dates
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (selectedForm && userNodeId) {
      const mode = selectedForm?.permSettings?.trackingMode ?? "none";
      fetchEventDates(selectedForm.projectId, userNodeId, month, mode);
    }
  };

  // Handle module click
  const handleModuleClick = async (module: FormModuleData) => {
    try {
      setSelectedModule(module);
      setFormLoading(true);
      setDrawerOpen(true);
      setFormValues({});
      setSelectedMonth(currentMonthValue()); // reset to current month for each new form
      setAllowedMonths(undefined);           // clear until compliance fetch resolves
      setLockedMonths([]);
      setAllowedEventDates(undefined);
      setSelectedEventDate("");
      setTrackingMode("none");

      // Fetch form details + compliance window in parallel
      const [formResponse] = await Promise.all([
        api.get(`/project-forms/project/${module.id}`),
      ]);
      const fetchedForm = formResponse.data;
      setSelectedForm(fetchedForm);

      // Only fetch compliance window for PERM forms that require a month
      const isPermForm   = fetchedForm?.permSettings?.enabled === true;
      const requireMonth = fetchedForm?.permSettings?.requireMonth === true;

      if (isPermForm && requireMonth && userNodeId) {
        try {
          const compResponse = await api.get("/submissions/allowed-months", {
            params: { projectId: module.id, nodeId: userNodeId },
          });
          const { allowedDates = [], lockedDates = [] } = compResponse.data;
          // The backend now always returns a full year from event_calendar
          // (or a generated fallback). Pass it straight to the selector — no
          // rolling-window fallback needed in the UI anymore.
          setAllowedMonths(allowedDates);
          setLockedMonths(lockedDates);
          // Auto-select the first unlocked future/current month if the
          // currently selected month is not in the allowed list.
          const currentMo = currentMonthValue();
          if (allowedDates.length > 0 && !allowedDates.includes(currentMo)) {
            // Pick the nearest future month, otherwise the first available.
            const future = allowedDates.filter((d: string) => d >= currentMo);
            setSelectedMonth(future.length > 0 ? future[0] : allowedDates[0]);
          }
          if (allowedDates.length === 0) {
              toast.error("No submission window open for this module — all periods are locked.");
            }
        } catch (compErr) {
          console.warn("Compliance window fetch failed:", compErr);
          setAllowedMonths(undefined);
        }

        // Fetch per-date schedule for the initial selected month
        const mode = fetchedForm?.permSettings?.trackingMode ?? "none";
        setTrackingMode(mode);
        if (mode !== "none") {
          const initMonth = currentMonthValue();
          await fetchEventDates(module.id, userNodeId, initMonth, mode);
        }
      }
    } catch (error: any) {
      console.error("Error loading form:", error);
      toast.error("Failed to load form");
      setDrawerOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form value change
  const handleFormChange = (field: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleFormSubmit = async (values: Record<string, any>) => {
    if (!selectedModule) return;

    // Block submissions if the user has no assigned node
    if (!nodeLoading && !userNodeId) {
      toast.error(
        "You are not assigned to a node. Please contact your administrator before submitting."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const resolveModuleFolderId = async () => {
        try {
          const response = await api.get(
            `/project-forms/project/${selectedModule.id}/storage-folder`
          );
          return response?.data?._id || null;
        } catch (_error) {
          return null;
        }
      };

      const moduleFolderId = await resolveModuleFolderId();

      const uploadFileForField = async (fieldId: string, file: File) => {
        const body = new FormData();
        body.append("file", file);
        if (moduleFolderId) {
          body.append("folderId", moduleFolderId);
        }

        try {
          const response = await api.post("/storage/upload", body, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const uploaded = response.data;
          return {
            fieldId,
            fileId: uploaded?.fileId || uploaded?._id || null,
            originalName: uploaded?.originalName || file.name,
            mimeType: uploaded?.mimeType || file.type,
            size: uploaded?.fileSize || file.size,
            url: uploaded?.storageUrl || null,
            uploadedAt: new Date().toISOString(),
          };
        } catch (_uploadError) {
          // Fallback: keep submission valid even when storage permission/upload fails.
          return {
            fieldId,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            uploadState: "pending-storage",
          };
        }
      };

      const normalizeSubmissionValues = async (raw: Record<string, any>) => {
        const nextValues: Record<string, any> = { ...raw };

        for (const [fieldId, value] of Object.entries(raw)) {
          if (value instanceof File) {
            nextValues[fieldId] = await uploadFileForField(fieldId, value);
            continue;
          }

          if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            nextValues[fieldId] = await Promise.all(
              value.map((file) => uploadFileForField(fieldId, file))
            );
          }
        }

        return nextValues;
      };

      const normalizedValues = await normalizeSubmissionValues(values);

      // Resolve identifiers from the fetched form object and current user.
      const tenantId =
        (selectedForm as any)?.tenantId ||
        (selectedForm as any)?.tenant_id ||
        user?.tenantId ||
        "";
      const formId =
        (selectedForm as any)?.formId ||
        (selectedForm as any)?.form_id ||
        selectedModule.id;
      const projectName =
        (selectedForm as any)?.configuration?.projectName ||
        selectedModule.name ||
        "";
      // configuration.tags is where the model stores categories; fall back
      // to selectedModule.category (already resolved by formModuleMapper)
      const formTags: string[] = Array.isArray(
        (selectedForm as any)?.configuration?.tags
      )
        ? (selectedForm as any).configuration.tags
        : [];
      const projectCategory =
        (selectedForm as any)?.configuration?.category ||
        formTags[0] ||
        selectedModule.category ||
        "";
      const userName =
        user?.name ||
        [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
        undefined;

      // Resolve nodeId from the user's primary organisational node (fetched
      // once at mount by useUserNode).  Only include nodeId/node_name in the
      // payload when non-empty — Joi rejects empty strings.
      const resolvedNodeId = userNodeId || undefined;
      const resolvedNodeName = (userNode?.name || undefined);

      // Determine whether the form is PERM-enabled and requires a reporting month
      const isPermForm = (selectedForm as any)?.permSettings?.enabled === true;
      const requiresMonth = isPermForm && (selectedForm as any)?.permSettings?.requireMonth === true;

      // Build the submission body, omitting optional fields that are undefined
      // so Joi doesn't trip on empty strings.
      const submissionBody: Record<string, unknown> = {
        tenantId,
        projectId: selectedModule.id,
        formId,
        payload: normalizedValues,
        source: "web",
        meta: {
          moduleFolderId,
          submittedAt: new Date().toISOString(),
        },
      };
      if (projectName) submissionBody.project_name = projectName;
      if (projectCategory) submissionBody.project_category = projectCategory;
      if (resolvedNodeId) submissionBody.nodeId = resolvedNodeId;
      if (resolvedNodeName) submissionBody.node_name = resolvedNodeName;
      if (userName) submissionBody.user_name = userName;
      if (user?.email) submissionBody.user_email = user.email;
      // Attach reporting month for PERM forms
      if (requiresMonth && selectedMonth) submissionBody.month = selectedMonth;
      // Attach specific event date for daily/weekly tracking modes
      if (requiresMonth && trackingMode !== "none" && selectedEventDate) {
        submissionBody.event_date = selectedEventDate;
        submissionBody.submission_date = selectedEventDate;
      }

      // POST to the unified /submissions endpoint (BullMQ worker → PostgreSQL)
      await api.post("/submissions", submissionBody);
      
      toast.success("Module submitted successfully!");
      setDrawerOpen(false);
      setFormValues({});
      setSelectedForm(null);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Failed to submit module");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedForm(null);
    setFormValues({});
  };

  const handleViewSubmissions = () => {
    if (!selectedModule) return;
    setDrawerOpen(false);
    navigate(`/projects/${selectedModule.id}/submissions`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Modules
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Access and fill out project modules
            </p>
          </div>
        </motion.div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Modules
          </h1>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 mobile:gap-3 md:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 mobile:w-4 mobile:h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 mobile:pl-10 md:pl-10 pr-4 py-3 mobile:py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-xl mobile:rounded-xl md:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base mobile:text-base"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-4 h-4 mobile:w-4 mobile:h-4 md:w-5 md:h-5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 mobile:flex-1 md:flex-none px-3 py-3 mobile:py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-xl mobile:rounded-xl md:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base mobile:text-base touch-target">
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
        className="grid grid-cols-1 mobile:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mobile:gap-3 md:gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>
        {/* Total Modules Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
          whileHover={{ y: -2, scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <div className="flex h-full">
            {/* Icon Column - Left Side */}
            <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 min-w-[100px] w-24 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </div>
            
            {/* Content Column - Right Side */}
            <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
              <motion.h3
                className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}>
                {modules.length}
              </motion.h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Total Modules</p>
            </div>
          </div>
        </motion.div>

        {/* Available Modules Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
          whileHover={{ y: -2, scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}>
          <div className="flex h-full">
            {/* Icon Column - Left Side */}
            <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/20 min-w-[100px] w-24 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>
            
            {/* Content Column - Right Side */}
            <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
              <motion.h3
                className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}>
                {filteredModules.length}
              </motion.h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Available</p>
            </div>
          </div>
        </motion.div>

        {/* Active Modules Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
          whileHover={{ y: -2, scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}>
          <div className="flex h-full">
            {/* Icon Column - Left Side */}
            <div className="flex items-center justify-center bg-purple-100 dark:bg-purple-900/20 min-w-[100px] w-24 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Activity className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </motion.div>
            </div>
            
            {/* Content Column - Right Side */}
            <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
              <motion.h3
                className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}>
                {modules.filter(m => (m.submissions && m.submissions > 0) || m.lastUsed).length}
              </motion.h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Active</p>
            </div>
          </div>
        </motion.div>

        {/* Payment Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
          whileHover={{ y: -2, scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}>
          <div className="flex h-full">
            {/* Icon Column - Left Side */}
            <div className="flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/20 min-w-[100px] w-24 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <CreditCard className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
              </motion.div>
            </div>
            
            {/* Content Column - Right Side */}
            <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
              <motion.h3
                className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}>
                24
              </motion.h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Payment</p>
            </div>
          </div>
        </motion.div>

        {/* Administration Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
          whileHover={{ y: -2, scale: 1.02 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}>
          <div className="flex h-full">
            {/* Icon Column - Left Side */}
            <div className="flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/20 min-w-[100px] w-24 flex-shrink-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Shield className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </motion.div>
            </div>
            
            {/* Content Column - Right Side */}
            <div className="flex-1 flex flex-col justify-center p-6 min-w-0">
              <motion.h3
                className="text-4xl font-bold text-gray-900 dark:text-white mb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}>
                8
              </motion.h3>
              <p className="text-base font-medium text-gray-600 dark:text-gray-300">Administration</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Module Grid */}
      {filteredModules.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}>
          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No modules found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || selectedCategory !== "All"
              ? "Try adjusting your search or filter criteria"
              : "No modules available at the moment"}
          </p>
          {(searchTerm || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className={`grid gap-3 mobile:gap-3 md:gap-4 ${
            isMobile
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}>
          {filteredModules.map((module, index) => (
            <ModuleCardCompact
              key={module.id}
              {...module}
              onClick={() => handleModuleClick(module)}
              index={index}
              variant="compact"
            />
          ))}
        </motion.div>
      )}

      {/* Form Drawer */}
      <FormDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        form={selectedForm}
        loading={formLoading}
        formValues={formValues}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onViewSubmissions={handleViewSubmissions}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        allowedMonths={allowedMonths}
        lockedMonths={lockedMonths}
        allowedDates={allowedEventDates}
        selectedEventDate={selectedEventDate}
        onEventDateChange={setSelectedEventDate}
        eventDatesLoading={eventDatesLoading}
        trackingMode={trackingMode}
      />
    </div>
  );
}

