import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FileText, Loader2 } from "lucide-react";

interface FormElement {
  id: string;
  type: string;
  properties: {
    label?: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
  };
}

export default function Forms() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const listRes = await api.get("/project-forms/");
        const results = listRes.data?.results || [];
        setForms(results);

        if (results.length > 0) {
          const first = results[0];
          if (first.projectId) {
            setActiveFormId(first.projectId);
            await loadForm(first.projectId);
          }
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [api]);

  const loadForm = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/project-forms/project/${projectId}`);
      setForm(res.data);
    } catch (error) {
      console.error("Error loading form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-600">
        <Loader2 className="animate-spin w-8 h-8 mr-2" />
        Loading forms...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row max-w-6xl mx-auto p-6 gap-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-white shadow-lg rounded-2xl p-4 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <FileText className="text-blue-600 w-5 h-5" />
          Available Forms
        </h2>

        <div className="space-y-2">
          {forms.map((f) => (
            <button
              key={f.projectId}
              onClick={() => {
                setActiveFormId(f.projectId);
                loadForm(f.projectId);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-between
                ${
                  activeFormId === f.projectId
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md scale-[1.02]"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
            >
              {f.configuration?.projectName || "Untitled Form"}
              {activeFormId === f.projectId && (
                <span className="ml-2 text-sm opacity-80">●</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Area */}
      <div className="flex-1">
        {!form ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-gray-500 bg-white rounded-2xl shadow-inner">
            <FileText className="w-10 h-10 mb-3 text-gray-400" />
            No form available to display.
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-3xl p-10 border border-gray-100">
            <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">
              {form.configuration?.projectName || "Untitled Form"}
            </h1>

            <div className="space-y-6">
              {form.elements?.map((el: FormElement) => {
                const { id, type, properties } = el;

                switch (type) {
                  case "header":
                    return (
                      <h2
                        key={id}
                        className="text-xl font-bold text-center text-gray-700 mb-4"
                      >
                        {properties.label}
                      </h2>
                    );

                  case "number":
                    return (
                      <div key={id} className="flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700">
                          {properties.label}
                        </label>
                        <input
                          type="number"
                          placeholder={properties.placeholder || ""}
                          value={values[id] || ""}
                          onChange={(e) => handleChange(id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                      </div>
                    );

                  case "textarea":
                    return (
                      <div key={id} className="flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700">
                          {properties.label}
                        </label>
                        <textarea
                          placeholder={properties.placeholder || ""}
                          value={values[id] || ""}
                          onChange={(e) => handleChange(id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                          rows={4}
                        />
                      </div>
                    );

                  case "dropdown":
                    return (
                      <div key={id} className="flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700">
                          {properties.label}
                        </label>
                        <select
                          value={values[id] || ""}
                          onChange={(e) => handleChange(id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        >
                          <option value="">Select...</option>
                          {properties.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );

                  case "datepicker":
                    return (
                      <div key={id} className="flex flex-col">
                        <label className="mb-2 font-semibold text-gray-700">
                          {properties.label}
                        </label>
                        <input
                          type="date"
                          value={values[id] || ""}
                          onChange={(e) => handleChange(id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        />
                      </div>
                    );

                  default:
                    return null;
                }
              })}

              <button
                type="button"
                onClick={() => console.log("Form values:", values)}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-md"
              >
                Save (Logs values for now)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
