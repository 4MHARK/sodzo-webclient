import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useIntelligentProjectForm } from "../contexts/IntelligentContexts";
import { useAuth } from "../contexts/AuthContext";

// Mock form data for demo mode
const mockFormData = {
  id: "1",
  name: "Member Registration",
  description: "Collect new member information and contact details",
  fields: [
    {
      id: "1",
      label: "Full Name",
      type: "text",
      required: true,
      placeholder: "Enter your full name",
    },
    {
      id: "2",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "Enter your email address",
    },
    {
      id: "3",
      label: "Phone Number",
      type: "tel",
      required: true,
      placeholder: "Enter your phone number",
    },
  ],
};

export default function FormRenderer() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, token } = useAuth();
  const { projectForms, loading, error } = useIntelligentProjectForm();

  const [formData, setFormData] = useState<any | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is authenticated
  const isAuthenticated = !!(authUser && token);

  useEffect(() => {
    // Handle new form creation
    if (formId === "new") {
      navigate("/forms");
      return;
    }

    // Find the project form by projectId
    if (formId && projectForms.length > 0) {
      const projectForm = projectForms.find((pf) => pf.projectId === formId);
      if (projectForm) {
        console.log("📋 Found project form:", projectForm);
        console.log("📊 Project form columnSpans:", projectForm.columnSpans);

        // Debug column span mapping
        if (projectForm.columnSpans) {
          console.log("🔍 Column Span Mapping Analysis:");
          Object.entries(projectForm.columnSpans).forEach(([fieldId, span]) => {
            const mappedSpan =
              span === 1 ? 3 : span === 2 ? 6 : span === 3 ? 9 : 12;
            console.log(
              `  ${fieldId}: API=${span} → CSS=${mappedSpan} columns`
            );
          });
        }

        console.log(
          "🧮 Form elements with formulas:",
          projectForm.elements
            ?.filter((el: any) => el.properties?.numberType === "calculated")
            .map((el: any) => ({
              id: el.id,
              label: el.properties?.label,
              formula: el.properties?.formula,
            }))
        );

        // Specifically check for Total Remittance field
        const totalRemittanceField = projectForm.elements?.find(
          (el: any) =>
            el.id.includes("remittance") ||
            el.properties?.label?.toLowerCase().includes("remittance")
        );
        console.log("💰 Total Remittance field:", totalRemittanceField);

        // Check all elements to see field IDs
        console.log(
          "📝 All form elements:",
          projectForm.elements?.map((el: any) => ({
            id: el.id,
            label: el.properties?.label,
            type: el.type,
            numberType: el.properties?.numberType,
            formula: el.properties?.formula,
          }))
        );
        setFormData(projectForm);

        // Initialize form values
        const initialValues: Record<string, any> = {};
        projectForm.elements?.forEach((element: any) => {
          if (element.type !== "header") {
            initialValues[element.id] = element.properties?.defaultValue || "";
          }
        });

        // Calculate initial values for calculated fields
        const calculatedValues = calculateDependentFields("", initialValues);
        setFormValues(calculatedValues);
      } else {
        console.log("❌ Project form not found for projectId:", formId);
        toast.error("Form not found");
        navigate("/projects");
      }
    } else if (formId && !isAuthenticated) {
      // Fallback to mock data for demo mode
      setFormData(mockFormData);
      const initialValues: Record<string, any> = {};
      mockFormData.fields.forEach((field) => {
        initialValues[field.id] = "";
      });
      setFormValues(initialValues);
    }
  }, [formId, projectForms, navigate, isAuthenticated]);

  // Calculate dependent fields based on formulas
  const calculateDependentFields = (
    _changedFieldId: string,
    currentValues: Record<string, any>
  ) => {
    if (!formData?.elements) return currentValues;

    const updatedValues = { ...currentValues };
    let hasChanges = true;

    // Keep recalculating until no more changes (for chained dependencies)
    while (hasChanges) {
      hasChanges = false;

      formData.elements.forEach((element: any) => {
        if (
          element.properties?.numberType === "calculated" &&
          element.properties?.formula
        ) {
          const formula = element.properties.formula;
          const fieldId = element.id;

          try {
            const calculatedValue = evaluateFormula(formula, updatedValues);
            console.log(
              `🧮 Calculating ${fieldId}: "${formula}" = ${calculatedValue}`
            );
            console.log(
              `📊 Current values:`,
              Object.keys(updatedValues).reduce((acc, key) => {
                acc[key] = updatedValues[key];
                return acc;
              }, {} as any)
            );
            if (updatedValues[fieldId] !== calculatedValue) {
              updatedValues[fieldId] = calculatedValue;
              hasChanges = true;
            }
          } catch (error) {
            console.warn(`Error calculating field ${fieldId}:`, error);
          }
        }
      });
    }

    return updatedValues;
  };

  // Evaluate formula string with field values
  const evaluateFormula = (formula: string, values: Record<string, any>) => {
    console.log(`🔍 Evaluating formula: "${formula}"`);
    console.log(`📊 Available values:`, values);

    // Replace field IDs with their values
    let expression = formula;

    // Find all field IDs in the formula and replace with values
    const fieldIds = Object.keys(values);
    fieldIds.forEach((fieldId) => {
      const regex = new RegExp(`\\b${fieldId}\\b`, "g");
      const fieldValue = parseFloat(values[fieldId]) || 0;
      expression = expression.replace(regex, fieldValue.toString());
      console.log(
        `🔄 Replaced ${fieldId} with ${fieldValue} in expression: "${expression}"`
      );
    });

    // Evaluate the mathematical expression safely
    try {
      // Clean the expression to only allow numbers, operators, and parentheses
      const cleanExpression = expression.replace(/[^0-9+\-*/.() ]/g, "");
      console.log(`🧹 Cleaned expression: "${cleanExpression}"`);

      // Use Function constructor instead of eval for better security
      const result = new Function("return " + cleanExpression)();
      console.log(`✅ Formula result: ${result}`);
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.warn(`Error evaluating formula "${formula}":`, error);
      return 0;
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => {
      const newValues = {
        ...prev,
        [fieldId]: value,
      };

      // Calculate dependent fields after updating the value
      const updatedValues = calculateDependentFields(fieldId, newValues);
      return updatedValues;
    });

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => ({
        ...prev,
        [fieldId]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData?.elements) {
      // Real project form validation
      formData.elements.forEach((element: any) => {
        if (
          element.type !== "header" &&
          element.properties?.validation?.required
        ) {
          const value = formValues[element.id];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            newErrors[element.id] = `${element.properties.label} is required`;
          }
        }
      });
    } else if (formData?.fields) {
      // Mock form validation
      formData.fields.forEach((field: any) => {
        if (field.required) {
          const value = formValues[field.id];
          if (!value || (typeof value === "string" && value.trim() === "")) {
            newErrors[field.id] = `${field.label} is required`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("📝 Form submitted:", formValues);
      toast.success("Form submitted successfully!");
      setIsSubmitted(true);
    } catch (error) {
      console.error("❌ Form submission error:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem(`form_draft_${formId}`, JSON.stringify(formValues));
    toast.success("Draft saved successfully!");
  };

  // Render field based on real project form data structure with column spans
  const renderRealField = (element: any) => {
    const { id, type, properties } = element;
    const value = formValues[id] || "";
    const isRequired = properties?.validation?.required || false;
    const placeholder = properties?.placeholder || "";
    const options = properties?.options || [];
    // Column span is now handled by the parent motion.div wrapper

    const fieldElement = (() => {
      switch (type) {
        case "header":
          return (
            <div className="text-center py-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {properties?.label || "Form Header"}
              </h2>
            </div>
          );

        case "text":
          return (
            <input
              type="text"
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required={isRequired}
            />
          );

        case "email":
          return (
            <input
              type="email"
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required={isRequired}
            />
          );

        case "number":
          return (
            <input
              type="number"
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                properties?.numberType === "calculated"
                  ? "bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                  : ""
              }`}
              required={isRequired}
              readOnly={properties?.numberType === "calculated"}
              title={
                properties?.numberType === "calculated"
                  ? `Calculated: ${properties?.formula}`
                  : ""
              }
            />
          );

        case "datepicker":
          return (
            <input
              type="date"
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required={isRequired}
            />
          );

        case "dropdown":
          return (
            <select
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required={isRequired}>
              <option value="">Select an option</option>
              {options.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        default:
          return (
            <input
              type="text"
              id={id}
              value={value}
              onChange={(e) => handleInputChange(id, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required={isRequired}
            />
          );
      }
    })();

    return (
      <div className="space-y-2">
        {type !== "header" && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {properties?.label}
            {properties?.numberType === "calculated" && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                (calculated)
              </span>
            )}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {fieldElement}
        {errors[id] && (
          <div className="flex items-center text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors[id]}
          </div>
        )}
      </div>
    );
  };

  // Render field for mock data
  const renderMockField = (field: any) => {
    const value = formValues[field.id] || "";
    const error = errors[field.id];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
          />
        );
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Form
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message || "Unable to load the form"}
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Show form not found
  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Form Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested form could not be found.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}>
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Form Submitted Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your submission. We'll review your information and get
            back to you soon.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/projects")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Projects
            </button>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormValues({});
                setErrors({});
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Submit Another
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/projects")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formData?.configuration?.projectName ||
                    formData?.name ||
                    "Form"}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData?.configuration?.tags?.join(", ") ||
                    formData?.description ||
                    "Fill out the form below"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveDraft}
                className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          {/* Render fields based on data type */}
          {formData?.elements ? (
            // Real project form fields with CSS Grid layout (12-column system)
            <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
              {formData.elements.map((element: any, index: number) => {
                const { id, type } = element;
                const columnSpan = formData?.columnSpans?.[id] || 4;

                // Debug logging for first few fields
                if (index < 5) {
                  console.log(
                    `🔍 Field ${id}: columnSpan = ${columnSpan}, type = ${type}`
                  );
                }

                // Calculate CSS grid column span for 12-column system
                // 1=3, 2=6, 3=9, 4=12 (as requested)
                const getGridColumns = (span: number) => {
                  switch (span) {
                    case 1:
                      return 3; // 1/4 width
                    case 2:
                      return 6; // 1/2 width
                    case 3:
                      return 9; // 3/4 width
                    case 4:
                      return 12; // full width
                    default:
                      return 12; // default to full width
                  }
                };

                const actualColumns = getGridColumns(columnSpan);
                // Use responsive column spans to ensure proper layout on all screen sizes
                const gridColSpan =
                  type === "header"
                    ? "col-span-1 sm:col-span-6 lg:col-span-12" // Headers always full width
                    : actualColumns === 12
                    ? "col-span-1 sm:col-span-6 lg:col-span-12" // Full width fields
                    : actualColumns === 9
                    ? "col-span-1 sm:col-span-5 lg:col-span-9" // 3/4 width fields
                    : actualColumns === 6
                    ? "col-span-1 sm:col-span-3 lg:col-span-6" // 1/2 width fields
                    : "col-span-1 sm:col-span-2 lg:col-span-3"; // 1/4 width fields

                // Debug logging for CSS classes
                if (index < 5) {
                  console.log(
                    `🎨 Field ${id}: columnSpan=${columnSpan} → gridColSpan=${gridColSpan} (${actualColumns} columns)`
                  );
                }

                return (
                  <motion.div
                    key={element.id}
                    className={gridColSpan}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}>
                    {renderRealField(element)}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Mock form fields
            formData?.fields?.map((field: any, index: number) => (
              <motion.div
                key={field.id}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderMockField(field)}
                {errors[field.id] && (
                  <div className="flex items-center text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors[field.id]}
                  </div>
                )}
              </motion.div>
            ))
          )}

          {/* Submit Button */}
          <motion.div
            className="pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Form
                </>
              )}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
