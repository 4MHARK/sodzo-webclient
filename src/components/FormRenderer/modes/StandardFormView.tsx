/**
 * Mode A: Standard Form View
 * Renders complete form with all fields visible at once
 */

import React from 'react';
import { FormElement } from '../types';
import UnifiedFieldRenderer from '../fields/UnifiedFieldRenderer';
import { useFormContext } from '../FormContext';
import { shouldShowField } from '../conditional';
import { FileText, User, Building, MapPin, Users, Mail, Phone } from 'lucide-react';

interface StandardFormViewProps {
  onScrollToError?: (fieldId: string) => void;
}

const sectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Basic Information': User,
  'Personal Information': User,
  'Profile Details': User,
  'Contact Information': Mail,
  'Contact Details': Mail,
  'Address Information': MapPin,
  'Additional Information': Building,
  'Spouse': Users,
  'Next Of Kin': Users,
};

function getSectionColor(sectionName: string): string {
  const colors: Record<string, string> = {
    'Basic Information': 'text-blue-600 dark:text-blue-400',
    'Personal Information': 'text-blue-600 dark:text-blue-400',
    'Profile Details': 'text-purple-600 dark:text-purple-400',
    'Contact Information': 'text-green-600 dark:text-green-400',
    'Contact Details': 'text-green-600 dark:text-green-400',
    'Address Information': 'text-purple-600 dark:text-purple-400',
    'Additional Information': 'text-green-600 dark:text-green-400',
    'Spouse': 'text-pink-600 dark:text-pink-400',
    'Next Of Kin': 'text-orange-600 dark:text-orange-400',
  };
  return colors[sectionName] || 'text-gray-600 dark:text-gray-400';
}

export default function StandardFormView({ onScrollToError }: StandardFormViewProps) {
  const { state, actions } = useFormContext();

  if (!state.formData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No form data available
      </div>
    );
  }

  // Group fields by section
  const fieldsBySection: Record<string, FormElement[]> = {};
  let currentSection = 'Default';

  state.formData.elements.forEach((element) => {
    // Skip header, title, h1-h6 elements - these should not be rendered as form fields
    const isHeader = element.type === 'header' || 
                    element.type === 'title' ||
                    element.type === 'h1' ||
                    element.type === 'h2' ||
                    element.type === 'h3' ||
                    element.type === 'h4' ||
                    element.type === 'h5' ||
                    element.type === 'h6';
    
    if (isHeader) {
      // Headers are not form fields - skip them entirely
      return;
    }

    // Regular field - check conditional logic and add to appropriate section
    const section = element.section || currentSection;
    if (!fieldsBySection[section]) {
      fieldsBySection[section] = [];
    }
    // Only show field if conditional logic allows
    if (shouldShowField(element, state.formValues)) {
      fieldsBySection[section].push(element);
    }
  });

  // Handle field change with validation
  const handleFieldChange = (fieldId: string, value: any) => {
    actions.setFieldValue(fieldId, value);
    actions.setFieldTouched(fieldId, true);
    // Real-time validation (optional - can be disabled)
    actions.validateField(fieldId);
  };

  return (
    <div className="space-y-6">
      {Object.entries(fieldsBySection).map(([sectionName, sectionFields]) => {
        if (sectionFields.length === 0) return null;

        const SectionIcon = sectionIcons[sectionName] || FileText;
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
                const value = state.formValues[field.id] ?? field.properties.defaultValue ?? '';
                const error = state.validationErrors[field.id];
                const touched = state.fieldTouched[field.id] || false;

                return (
                  <div key={field.id} id={`field-${field.id}`}>
                    <UnifiedFieldRenderer
                      field={field}
                      value={value}
                      onChange={(val) => handleFieldChange(field.id, val)}
                      error={error}
                      touched={touched}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

