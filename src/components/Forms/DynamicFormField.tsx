/**
 * Dynamic Form Field Component
 * Renders form fields based on field definition
 */

import { FormField } from "../../utils/formMapper";

interface DynamicFormFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export default function DynamicFormField({
  field,
  value,
  onChange,
  disabled = false,
  error,
}: DynamicFormFieldProps) {
  // Disable logic: Only respect parent's disabled state
  // When parent enables editing (disabled=false), all fields become editable
  // System fields that should always be disabled are handled at field creation level
  const isDisabled = disabled;

  const baseInputClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base ${
    error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
  } ${
    isDisabled
      ? "bg-gray-50 dark:bg-gray-600 cursor-not-allowed opacity-60"
      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
  }`;

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
        return (
          <input
            type={field.type}
            id={field.id}
            name={field.name}
            value={value !== undefined && value !== null ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={field.required}
            className={baseInputClasses}
          />
        );

      case "number":
        return (
          <input
            type="number"
            id={field.id}
            name={field.name}
            value={value || ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : "")
            }
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={field.required}
            className={baseInputClasses}
          />
        );

      case "date":
        // Format date value for input (YYYY-MM-DD)
        const dateValue = value
          ? new Date(value).toISOString().split("T")[0]
          : "";
        return (
          <input
            type="date"
            id={field.id}
            name={field.name}
            value={dateValue}
            onChange={(e) =>
              onChange(
                e.target.value ? new Date(e.target.value).toISOString() : ""
              )
            }
            disabled={isDisabled}
            required={field.required}
            className={baseInputClasses}
          />
        );

      case "textarea":
        return (
          <textarea
            id={field.id}
            name={field.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={field.required}
            rows={4}
            className={`${baseInputClasses} resize-none`}
          />
        );

      case "select":
        return (
          <select
            id={field.id}
            name={field.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
            required={field.required}
            className={baseInputClasses}>
            <option value="">Select {field.label}...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.id}
              name={field.name}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={isDisabled}
              required={field.required}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor={field.id}
              className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
          </div>
        );

      case "radio":
        if (!field.options) return null;
        return (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isDisabled}
                  required={field.required}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case "file":
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              id={field.id}
              name={field.name}
              onChange={(e) => onChange(e.target.files?.[0] || null)}
              disabled={isDisabled}
              required={field.required}
              accept={field.placeholder}
              className="hidden"
            />
            <label
              htmlFor={field.id}
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
              {value ? value.name || "File selected" : `Upload ${field.label}`}
            </label>
            {value && value.name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {value.name}
              </p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={field.id}
            name={field.name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled}
            className={baseInputClasses}
          />
        );
    }
  };

  // For checkbox, label is rendered inside the field
  if (field.type === "checkbox") {
    return (
      <div className="space-y-2">
        {renderField()}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
