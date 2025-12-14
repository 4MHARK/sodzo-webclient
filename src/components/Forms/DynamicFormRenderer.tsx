/**
 * Dynamic Form Renderer Component
 * Renders form fields dynamically based on field definitions
 */

import { FormField, groupFieldsBySection } from "../../utils/formMapper";
import DynamicFormField from "./DynamicFormField";
import { User, Building, MapPin, Users } from "lucide-react";

interface DynamicFormRendererProps {
  fields: FormField[];
  values: Record<string, any>;
  onChange: (fieldPath: string, value: any) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

const sectionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Basic Information": User,
  "Profile Details": User,
  "Additional Information": Building,
  Spouse: Users,
  "Next Of Kin": Users,
  "Personal Information": User,
  "Contact Information": Building,
  "Address Information": MapPin,
};

export default function DynamicFormRenderer({
  fields,
  values,
  onChange,
  disabled = false,
  errors = {},
}: DynamicFormRendererProps) {
  // Group fields by section
  const fieldsBySection = groupFieldsBySection(fields);

  return (
    <div className="space-y-8">
      {Object.entries(fieldsBySection).map(([sectionName, sectionFields]) => {
        const SectionIcon = sectionIcons[sectionName] || Building;
        const sectionColor = getSectionColor(sectionName);

        return (
          <div
            key={sectionName}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
              <SectionIcon className={`w-5 h-5 ${sectionColor} mr-2`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {sectionName}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sectionFields.map((field) => {
                const fieldPath = field.name; // e.g., "profile.gender" or "customFields.title"
                // formValues is stored as flat object with dot-notation keys, so access directly
                const fieldValue = values[fieldPath] ?? field.value ?? "";

                return (
                  <DynamicFormField
                    key={field.id}
                    field={field}
                    value={fieldValue}
                    onChange={(value) => onChange(fieldPath, value)}
                    disabled={disabled}
                    error={errors[fieldPath]}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}

/**
 * Get section color based on section name
 */
function getSectionColor(sectionName: string): string {
  const colors: Record<string, string> = {
    "Basic Information": "text-blue-600 dark:text-blue-400",
    "Profile Details": "text-purple-600 dark:text-purple-400",
    "Additional Information": "text-green-600 dark:text-green-400",
    Spouse: "text-pink-600 dark:text-pink-400",
    "Next Of Kin": "text-orange-600 dark:text-orange-400",
    "Personal Information": "text-blue-600 dark:text-blue-400",
    "Contact Information": "text-green-600 dark:text-green-400",
    "Address Information": "text-purple-600 dark:text-purple-400",
  };
  return colors[sectionName] || "text-gray-600 dark:text-gray-400";
}
