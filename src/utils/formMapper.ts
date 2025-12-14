/**
 * Form Field Mapper Utility
 * Maps data structures to form field definitions for dynamic rendering
 */

export interface FormField {
  id: string;
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "date"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file";
  value: any;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  disabled?: boolean;
  section?: string;
  nested?: boolean;
  nestedPath?: string; // e.g., "profile.gender" or "customFields.title"
}

/**
 * Infer field type from field name and value
 */
function inferFieldType(fieldName: string, value: any): FormField["type"] {
  const name = fieldName.toLowerCase();

  // Email fields
  if (name.includes("email") || name === "email") {
    return "email";
  }

  // Phone fields
  if (
    name.includes("phone") ||
    name.includes("tel") ||
    name === "phoneNumber"
  ) {
    return "tel";
  }

  // Date fields
  if (name.includes("date") || name.includes("birth") || name.includes("dob")) {
    return "date";
  }

  // Number fields
  if (
    name.includes("count") ||
    name.includes("number") ||
    name.includes("id") ||
    name.includes("age")
  ) {
    return "number";
  }

  // Textarea for long text fields
  if (
    name.includes("address") ||
    name.includes("bio") ||
    name.includes("description") ||
    name.includes("note")
  ) {
    return "textarea";
  }

  // Select for status/enum fields
  if (
    name.includes("status") ||
    name.includes("type") ||
    name.includes("category") ||
    name.includes("gender")
  ) {
    return "select";
  }

  // Checkbox for boolean
  if (typeof value === "boolean") {
    return "checkbox";
  }

  // Default to text
  return "text";
}

/**
 * Generate human-readable label from field name
 */
function generateLabel(fieldName: string): string {
  // Handle camelCase and snake_case
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

/**
 * Get options for select fields based on field name
 */
function getSelectOptions(fieldName: string): string[] | undefined {
  const name = fieldName.toLowerCase();

  if (name.includes("gender")) {
    return ["Male", "Female", "Other"];
  }

  if (name.includes("marital") || name.includes("maritalstatus")) {
    return ["Single", "Married", "Divorced", "Widowed"];
  }

  if (name.includes("employment") || name.includes("employmentcategory")) {
    return ["Full-time", "Part-time", "Contract", "Volunteer"];
  }

  // Add more option mappings as needed
  return undefined;
}

/**
 * Map a flat object to form fields (handles nested objects recursively)
 */
export function mapObjectToFields(
  obj: Record<string, any>,
  prefix: string = "",
  section: string = "",
  excludeFields: string[] = [],
  nestedSection?: string
): FormField[] {
  const fields: FormField[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip excluded fields and system fields
    if (
      excludeFields.includes(key) ||
      key.startsWith("_") ||
      key === "id" ||
      key === "__v"
    ) {
      continue;
    }

    const fieldName = prefix ? `${prefix}.${key}` : key;
    const fieldId = fieldName.replace(/\./g, "_");

    // Handle nested objects recursively (e.g., spouse, nextOfKin)
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // Check if it's a plain object (not null)
      if (value.constructor === Object) {
        // Create a subsection for nested objects like "Spouse" or "Next Of Kin"
        const nestedSectionName = nestedSection || generateLabel(key);
        const nestedFields = mapObjectToFields(
          value,
          fieldName,
          nestedSectionName,
          excludeFields,
          nestedSectionName
        );
        fields.push(...nestedFields);
      }
      continue;
    }

    // Handle arrays (skip for now, can be extended later)
    if (Array.isArray(value)) {
      continue;
    }

    // Handle null values - create empty field
    if (value === null || value === undefined) {
      const fieldType = inferFieldType(key, "");
      const options =
        fieldType === "select" ? getSelectOptions(key) : undefined;

      fields.push({
        id: fieldId,
        name: fieldName,
        label: generateLabel(key),
        type: fieldType,
        value: "",
        section: nestedSection || section || "General",
        nested: !!prefix,
        nestedPath: fieldName,
        options,
        disabled: false,
      });
      continue;
    }

    // Handle Date objects and date strings
    let fieldValue: any = value;
    if (value instanceof Date) {
      fieldValue = value.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      // Handle ISO date strings
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          fieldValue = date.toISOString().split("T")[0];
        }
      } catch {
        fieldValue = value;
      }
    }

    const fieldType = inferFieldType(key, value);
    const options = fieldType === "select" ? getSelectOptions(key) : undefined;

    fields.push({
      id: fieldId,
      name: fieldName,
      label: generateLabel(key),
      type: fieldType,
      value: fieldValue || "",
      section: nestedSection || section || "General",
      nested: !!prefix,
      nestedPath: fieldName,
      options,
      disabled: false,
    });
  }

  return fields;
}

/**
 * Map user profile structure to form fields
 */
export function mapUserProfileToFields(userData: any): FormField[] {
  const fields: FormField[] = [];
  const excludeFields = [
    // System/Identity fields - not configurable by user
    "id",
    "_id",
    "__v",
    "userId",
    "haloId",
    "tenantId",
    // Authentication/Security fields - not configurable here
    "password",
    "otp",
    "otpExpires",
    "otpVerified",
    // Avatar - handled separately in UI
    "avatar",
    // Verification fields - shown in account status, not editable
    "isEmailVerified",
    "isPhoneVerified",
    // Compliance fields - system managed
    "profileUpdateCompliant",
    "profileUpdateCompliantAt",
    "profileUpdateCompliantBy",
    "customFieldsVersion",
    // Roles/Permissions - system/admin managed
    "roles",
    "isOwner",
    "isSuper",
    "isSaby",
    "isAdmin",
    "isAgreed",
    "status",
    // Metadata fields - system managed
    "createdAt",
    "updatedAt",
    "deletedAt",
    "createdBy",
  ];

  // Basic fields (firstname, lastname) - email and phone excluded (handled via secure modal)
  const basicFields = ["firstname", "lastname"];
  basicFields.forEach((field) => {
    if (userData[field] !== undefined) {
      const fieldType = inferFieldType(field, userData[field]);
      fields.push({
        id: field,
        name: field,
        label: generateLabel(field),
        type: fieldType,
        value: userData[field] || "",
        section: "Basic Information",
        disabled: false, // Always editable when form is in edit mode
      });
    }
  });

  // Profile object fields
  if (userData.profile && typeof userData.profile === "object") {
    const profileFields = mapObjectToFields(
      userData.profile,
      "profile",
      "Profile Details",
      [],
      undefined
    );
    fields.push(...profileFields);
  }

  // CustomFields - tenant-specific fields
  if (userData.customFields && typeof userData.customFields === "object") {
    const customFields = mapObjectToFields(
      userData.customFields,
      "customFields",
      "Additional Information",
      [],
      undefined
    );
    fields.push(...customFields);
  }

  return fields;
}

/**
 * Map node profile structure to form fields
 */
export function mapNodeProfileToFields(nodeData: any): FormField[] {
  const fields: FormField[] = [];
  const excludeFields = [
    "id",
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "profileUpdateCompliant",
    "profileUpdateCompliantAt",
    "profileUpdateCompliantBy",
    "customFieldsVersion",
    "identity",
    "hierarchy",
    "level",
    "structure",
    "path",
    "parent",
    "users",
    "isActive",
    "isMain",
  ];

  // Basic fields (name, nodeId, tenantId - nodeId and tenantId should be read-only)
  const basicFields = ["name", "nodeId", "tenantId"];
  basicFields.forEach((field) => {
    if (nodeData[field] !== undefined) {
      const fieldType = inferFieldType(field, nodeData[field]);
      fields.push({
        id: field,
        name: field,
        label: generateLabel(field),
        type: fieldType,
        value: nodeData[field] || "",
        section: "Basic Information",
        disabled: field === "nodeId" || field === "tenantId", // System fields are read-only
      });
    }
  });

  // Address fields (address, city, state, country, postalCode)
  const addressFields = ["address", "city", "state", "country", "postalCode"];
  addressFields.forEach((field) => {
    if (nodeData[field] !== undefined) {
      const fieldType = inferFieldType(field, nodeData[field]);
      fields.push({
        id: field,
        name: field,
        label: generateLabel(field),
        type: fieldType,
        value: nodeData[field] || "",
        section: "Address Information",
      });
    }
  });

  // Date fields (dateOfEstablishment)
  if (nodeData.dateOfEstablishment !== undefined) {
    const dateValue = nodeData.dateOfEstablishment
      ? new Date(nodeData.dateOfEstablishment).toISOString().split("T")[0]
      : "";
    fields.push({
      id: "dateOfEstablishment",
      name: "dateOfEstablishment",
      label: "Date Of Establishment",
      type: "date",
      value: dateValue,
      section: "Basic Information",
    });
  }

  // Hierarchy fields (level, structure, hierarchy, identity) are completely removed - not displayed in form

  // Profile object fields
  if (nodeData.profile && typeof nodeData.profile === "object") {
    const profileFields = mapObjectToFields(
      nodeData.profile,
      "profile",
      "Profile Details",
      [],
      undefined
    );
    fields.push(...profileFields);
  }

  // CustomFields - tenant-specific fields
  if (nodeData.customFields && typeof nodeData.customFields === "object") {
    const customFields = mapObjectToFields(
      nodeData.customFields,
      "customFields",
      "Additional Information",
      [],
      undefined
    );
    fields.push(...customFields);
  }

  return fields;
}

/**
 * Group fields by section
 */
export function groupFieldsBySection(
  fields: FormField[]
): Record<string, FormField[]> {
  return fields.reduce((acc, field) => {
    const section = field.section || "General";
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(field);
    return acc;
  }, {} as Record<string, FormField[]>);
}

/**
 * Convert form values back to API format (with nested structure)
 */
export function convertFormValuesToAPIFormat(
  formValues: Record<string, any>,
  originalData: any
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [fieldPath, value] of Object.entries(formValues)) {
    if (!value && value !== 0 && value !== false) continue; // Skip empty values

    const parts = fieldPath.split(".");

    if (parts.length === 1) {
      // Root-level field
      result[fieldPath] = value;
    } else {
      // Nested field
      const [parent, ...rest] = parts;
      if (!result[parent]) {
        result[parent] = {};
      }

      let current = result[parent];
      for (let i = 0; i < rest.length - 1; i++) {
        if (!current[rest[i]]) {
          current[rest[i]] = {};
        }
        current = current[rest[i]];
      }
      current[rest[rest.length - 1]] = value;
    }
  }

  return result;
}

/**
 * Convert schema type to form field type
 */
function schemaTypeToFormFieldType(schemaType: string): FormField["type"] {
  switch (schemaType) {
    case "string":
      return "text";
    case "number":
    case "decimal":
      return "number";
    case "date":
      return "date";
    case "boolean":
      return "checkbox";
    case "objectId":
      return "text"; // ObjectId fields shown as text (read-only typically)
    case "array":
      return "select"; // Arrays as multi-select (can be extended)
    case "mixed":
      return "text";
    default:
      return "text";
  }
}

/**
 * Map a schema field definition to FormField
 */
function mapSchemaFieldToFormField(
  fieldDef: any,
  fieldPath: string,
  fieldName: string,
  section: string,
  dataValue?: any,
  excludeFields: string[] = []
): FormField | null {
  // Skip excluded fields
  if (excludeFields.includes(fieldName) || fieldName.startsWith("_")) {
    return null;
  }

  const fieldId = fieldPath.replace(/\./g, "_");

  // Get value from data or use default
  let fieldValue = dataValue;
  if (fieldValue === undefined || fieldValue === null) {
    fieldValue = fieldDef.default ?? fieldDef.defaultValue ?? "";
  }

  // Handle date formatting
  if (fieldDef.type === "date" && fieldValue) {
    try {
      const date = new Date(fieldValue);
      if (!isNaN(date.getTime())) {
        fieldValue = date.toISOString().split("T")[0];
      }
    } catch {
      // Keep original value
    }
  }

  // Determine field type
  let fieldType = schemaTypeToFormFieldType(fieldDef.type);

  // If enum values exist, use select
  if (fieldDef.enum && fieldDef.enum.length > 0) {
    fieldType = "select";
  }

  // Handle nested objects
  if (fieldDef.nested && typeof fieldDef.nested === "object") {
    // Return null here - nested objects are handled separately
    return null;
  }

  // Generate label
  const label = fieldDef.label || generateLabel(fieldName);

  return {
    id: fieldId,
    name: fieldPath,
    label,
    type: fieldType,
    value: fieldValue,
    required: fieldDef.required || false,
    placeholder: fieldDef.placeholder || undefined,
    options:
      fieldDef.enum ||
      fieldDef.options?.map((opt: any) =>
        typeof opt === "object" ? opt.value || opt.label : opt
      ) ||
      undefined,
    disabled: false,
    section,
    nested: fieldPath.includes("."),
    nestedPath: fieldPath,
  };
}

/**
 * Map schema standard fields to form fields
 */
function mapSchemaStandardFields(
  standardFields: Record<string, Record<string, any>>,
  dataValues: any,
  excludeFields: string[] = []
): FormField[] {
  const fields: FormField[] = [];
  const categorySectionMap: Record<string, string> = {
    identity: "Identity Information",
    basic: "Basic Information",
    profile: "Profile Details",
    roles: "Roles & Permissions",
    // verification: "Verification", // Excluded - shown in account status, not editable
    compliance: "Compliance",
    metadata: "Metadata",
    hierarchy: "Hierarchy",
    relationships: "Relationships",
  };

  // Categories to completely skip (system-managed, shown elsewhere)
  const skipCategories = [
    "verification",
    "identity",
    "compliance",
    "metadata",
    "roles",
    "hierarchy", // Skip hierarchy category completely - not editable by users
  ];

  for (const [category, categoryFields] of Object.entries(standardFields)) {
    // Skip entire categories that shouldn't be editable
    if (skipCategories.includes(category)) {
      continue;
    }

    const section = categorySectionMap[category] || generateLabel(category);

    for (const [fieldName, fieldDef] of Object.entries(categoryFields)) {
      // Skip if not a valid field definition
      if (!fieldDef || typeof fieldDef !== "object" || !fieldDef.path) {
        continue;
      }

      // Handle nested objects
      if (fieldDef.nested && typeof fieldDef.nested === "object") {
        const nestedPath = fieldDef.path;
        const nestedValue = getNestedValueFromPath(dataValues, nestedPath);

        // Skip hierarchy-related nested objects
        if (
          nestedPath === "level" ||
          nestedPath === "structure" ||
          nestedPath === "hierarchy" ||
          nestedPath === "identity"
        ) {
          continue; // Skip hierarchy nested objects completely
        }

        // Process nested fields
        for (const [nestedKey, nestedDef] of Object.entries(fieldDef.nested)) {
          const nestedFieldPath = `${nestedPath}.${nestedKey}`;
          const nestedDataValue = nestedValue?.[nestedKey];

          // Skip hierarchy-related nested fields
          if (
            nestedKey === "level" ||
            nestedKey === "structure" ||
            nestedKey === "hierarchy" ||
            nestedKey === "identity" ||
            nestedFieldPath.startsWith("level.") ||
            nestedFieldPath.startsWith("structure.") ||
            nestedFieldPath.startsWith("hierarchy.") ||
            nestedFieldPath.startsWith("identity.")
          ) {
            continue;
          }

          const nestedField = mapSchemaFieldToFormField(
            nestedDef,
            nestedFieldPath,
            nestedKey,
            section,
            nestedDataValue,
            excludeFields
          );

          if (nestedField) {
            fields.push(nestedField);
          }
        }
        continue;
      }

      // Skip hierarchy-related fields (level, structure, hierarchy, identity)
      if (
        fieldName === "level" ||
        fieldName === "structure" ||
        fieldName === "hierarchy" ||
        fieldName === "identity" ||
        fieldDef.path === "level" ||
        fieldDef.path === "structure" ||
        fieldDef.path === "hierarchy" ||
        fieldDef.path === "identity" ||
        fieldDef.path?.startsWith("level.") ||
        fieldDef.path?.startsWith("structure.") ||
        fieldDef.path?.startsWith("hierarchy.") ||
        fieldDef.path?.startsWith("identity.")
      ) {
        continue; // Skip hierarchy fields completely
      }

      // Get value from data
      const dataValue = getNestedValueFromPath(dataValues, fieldDef.path);

      const field = mapSchemaFieldToFormField(
        fieldDef,
        fieldDef.path,
        fieldName,
        section,
        dataValue,
        excludeFields
      );

      if (field) {
        fields.push(field);
      }
    }
  }

  return fields;
}

/**
 * Get nested value from object using dot notation path
 */
function getNestedValueFromPath(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}

/**
 * Map custom fields from schema to form fields
 */
function mapSchemaCustomFields(
  customFields: Array<{
    id: string;
    label: string;
    type: string;
    required?: boolean;
    defaultValue?: any;
    placeholder?: string;
    options?: Array<{ value: string; label: string } | string>;
    validation?: Record<string, any>;
  }>,
  dataValues: any
): FormField[] {
  const fields: FormField[] = [];

  customFields.forEach((customField) => {
    const fieldPath = `customFields.${customField.id}`;
    const dataValue = dataValues?.customFields?.[customField.id];
    const fieldValue = dataValue ?? customField.defaultValue ?? "";

    // Convert custom field type to form field type
    let fieldType: FormField["type"] = "text";
    switch (customField.type) {
      case "text":
      case "textarea":
        fieldType = customField.type === "textarea" ? "textarea" : "text";
        break;
      case "number":
        fieldType = "number";
        break;
      case "date":
        fieldType = "date";
        break;
      case "boolean":
        fieldType = "checkbox";
        break;
      case "select":
      case "multi-select":
        fieldType = "select";
        break;
      case "attachment":
        fieldType = "file";
        break;
      default:
        fieldType = "text";
    }

    // Extract options
    const options = customField.options?.map((opt) =>
      typeof opt === "object" ? opt.value || opt.label : opt
    );

    fields.push({
      id: customField.id.replace(/\./g, "_"),
      name: fieldPath,
      label: customField.label,
      type: fieldType,
      value: fieldValue,
      required: customField.required || false,
      placeholder: customField.placeholder || undefined,
      options: options as string[] | undefined,
      disabled: false,
      section: "Additional Information",
      nested: true,
      nestedPath: fieldPath,
    });
  });

  return fields;
}

/**
 * Map user schema to form fields (uses schema endpoint data)
 */
export function mapUserSchemaToFields(
  schema: {
    standardFields: Record<string, Record<string, any>>;
    customFields: Array<any>;
  },
  userData: any
): FormField[] {
  const excludeFields = [
    // System/Identity fields - not configurable by user
    "id",
    "_id",
    "__v",
    "userId",
    "haloId",
    "tenantId",
    // Authentication/Security fields - not configurable here
    "password",
    "otp",
    "otpExpires",
    "otpVerified",
    // Avatar - handled separately in UI
    "avatar",
    // Email and Phone - handled via secure modal in Account Status section
    "email",
    "phoneNumber",
    // Verification fields - shown in account status, not editable
    "isEmailVerified",
    "isPhoneVerified",
    "otpVerified",
    // Compliance fields - system managed
    "profileUpdateCompliant",
    "profileUpdateCompliantAt",
    "profileUpdateCompliantBy",
    "customFieldsVersion",
    // Roles/Permissions - system/admin managed
    "roles",
    "isOwner",
    "isSuper",
    "isSaby",
    "isAdmin",
    "isAgreed",
    "status",
    // Metadata fields - system managed
    "createdAt",
    "updatedAt",
    "deletedAt",
    "createdBy",
  ];

  const fields: FormField[] = [];

  // Map standard fields from schema
  const standardFields = mapSchemaStandardFields(
    schema.standardFields,
    userData,
    excludeFields
  );
  fields.push(...standardFields);

  // Map custom fields from schema
  if (schema.customFields && Array.isArray(schema.customFields)) {
    const customFields = mapSchemaCustomFields(schema.customFields, userData);
    fields.push(...customFields);
  }

  return fields;
}

/**
 * Map node schema to form fields (uses schema endpoint data)
 */
export function mapNodeSchemaToFields(
  schema: {
    standardFields: Record<string, Record<string, any>>;
    customFields: Array<any>;
  },
  nodeData: any
): FormField[] {
  const excludeFields = [
    "id",
    "_id",
    "__v",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "profileUpdateCompliant",
    "profileUpdateCompliantAt",
    "profileUpdateCompliantBy",
    "customFieldsVersion",
    "identity",
    "hierarchy",
    "level",
    "structure",
    "path",
    "parent",
    "users", // Skip users array
    "isActive",
    "isMain",
  ];

  const fields: FormField[] = [];

  // Map standard fields from schema (hierarchy category is already skipped in mapSchemaStandardFields)
  const standardFields = mapSchemaStandardFields(
    schema.standardFields,
    nodeData,
    excludeFields
  );
  fields.push(...standardFields);

  // DO NOT add level, structure, or any hierarchy fields - they are completely removed

  // Map custom fields from schema
  if (schema.customFields && Array.isArray(schema.customFields)) {
    const customFields = mapSchemaCustomFields(schema.customFields, nodeData);
    fields.push(...customFields);
  }

  return fields;
}
