/**
 * Utility to map API form data to FormConfiguration
 */

import { FormConfiguration, FormElement, FieldType } from '../types';

/**
 * Map API form response to FormConfiguration
 */
export function mapApiFormToConfiguration(apiForm: any): FormConfiguration {
  console.log('🔍 [Form Data Mapper] Full API Form Payload:', JSON.stringify(apiForm, null, 2));
  
  const elements: FormElement[] = [];

  if (apiForm.elements && Array.isArray(apiForm.elements)) {
    console.log('📋 [Form Data Mapper] Processing elements:', apiForm.elements.length);
    
    apiForm.elements.forEach((element: any, index: number) => {
      console.log(`🔎 [Form Data Mapper] Element ${index}:`, {
        id: element.id,
        type: element.type,
        elementType: element.elementType,
        properties: element.properties,
      });
      
      // Skip header, title, h2, h1, h3 elements - these are not form fields
      const isHeader = element.type === 'header' || 
                      element.type === 'title' ||
                      element.type === 'h1' ||
                      element.type === 'h2' ||
                      element.type === 'h3' ||
                      element.type === 'h4' ||
                      element.type === 'h5' ||
                      element.type === 'h6' ||
                      (element.elementType && (element.elementType === 'header' || element.elementType === 'title'));
      
      if (isHeader) {
        console.log(`⏭️  [Form Data Mapper] Skipping header element: ${element.id} (${element.type})`);
        // Skip headers - don't add them to elements array
        return;
      }
      
      // Map field type
      const fieldType = mapFieldType(element.type);
      
      console.log(`✅ [Form Data Mapper] Adding form field: ${element.id} (${fieldType})`);
      
      elements.push({
        id: element.id,
        type: fieldType,
        properties: {
          label: element.properties?.label || '',
          placeholder: element.properties?.placeholder,
          required: element.properties?.required || false,
          defaultValue: element.properties?.defaultValue,
          options: element.properties?.options,
          rows: element.properties?.rows,
          accept: element.properties?.accept,
          min: element.properties?.min,
          max: element.properties?.max,
          step: element.properties?.step,
          pattern: element.properties?.pattern,
          helpText: element.properties?.helpText,
          description: element.properties?.description,
        },
        section: element.section,
        validation: element.validation,
        conditional: element.conditional,
      });
    });
    
    console.log(`✨ [Form Data Mapper] Mapped ${elements.length} form fields (skipped ${apiForm.elements.length - elements.length} headers)`);
  }

  return {
    id: apiForm.projectId || apiForm.id || '',
    projectId: apiForm.projectId || apiForm.id || '',
    configuration: {
      projectName: apiForm.configuration?.projectName || apiForm.name || 'Untitled Form',
      description: apiForm.configuration?.description || apiForm.description,
      category: apiForm.configuration?.category || apiForm.category,
      defaultMode: apiForm.configuration?.defaultMode || 'chat',
    },
    elements,
    validation: apiForm.validation,
    conditionalLogic: apiForm.conditionalLogic,
  };
}

/**
 * Map API field type to our FieldType
 */
function mapFieldType(apiType: string): FieldType {
  const typeMap: Record<string, FieldType> = {
    text: 'text',
    email: 'email',
    tel: 'tel',
    phone: 'tel',
    number: 'number',
    date: 'date',
    textarea: 'textarea',
    select: 'select',
    dropdown: 'select',
    multiselect: 'multiselect',
    'multi-select': 'multiselect',
    checkbox: 'checkbox',
    radio: 'radio',
    file: 'file',
    upload: 'file',
  };

  return typeMap[apiType.toLowerCase()] || 'text';
}

