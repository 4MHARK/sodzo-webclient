import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Copy, FileText } from 'lucide-react';
import { mockFormTemplates } from '../data/mockData';
import { FormTemplate, FormField } from '../types';

export default function Forms() {
  const [templates, setTemplates] = useState(mockFormTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'textarea':
        return '📝';
      case 'select':
        return '📋';
      case 'checkbox':
        return '☑️';
      case 'radio':
        return '🔘';
      default:
        return '📄';
    }
  };

  const renderFormField = (field: FormField, isPreview: boolean = false) => {
    const baseClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            className={baseClasses}
            required={field.required}
            disabled={!isPreview}
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
            className={baseClasses}
            required={field.required}
            disabled={!isPreview}
          />
        );
      case 'select':
        return (
          <select className={baseClasses} required={field.required} disabled={!isPreview}>
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={!isPreview}
            />
            <span className="text-sm text-gray-700">I agree to the terms</span>
          </div>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={!isPreview}
                />
                <span className="text-sm text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage dynamic forms</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Create Form
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Templates</h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {template.fields.length} fields • Created {template.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Preview/Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedTemplate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      isPreviewMode
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    {isPreviewMode ? 'Previewing' : 'Preview'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {getFieldIcon(field.type)} {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {!isPreviewMode && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {field.type}
                        </span>
                      )}
                    </div>
                    {renderFormField(field, isPreviewMode)}
                  </div>
                ))}

                {isPreviewMode && (
                  <div className="pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Submit Form
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Selected</h3>
              <p className="text-gray-500">Select a form template to preview or edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">3.2</div>
            <div className="text-sm text-gray-600">Avg. Time (min)</div>
          </div>
        </div>
      </div>
    </div>
  );
}