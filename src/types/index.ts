export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string;
  roles: string[];
  isOwner: boolean;
  isSuper: boolean;
  isAgreed: boolean;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  tenantId?: string;
  createdAt?: string;
  haloId?: string;
  status?: boolean;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  team: User[];
  createdAt: Date;
  dueDate: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  projectId: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  projectId?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: Date;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required: boolean;
  options?: string[];
}

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

export interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  category: 'system' | 'project' | 'form' | 'notification';
  priority: 'low' | 'medium' | 'high';
}