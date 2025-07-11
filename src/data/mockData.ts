import { User, Project, ChatMessage, FileItem, FormTemplate, DashboardMetric } from '../types';
import { EmailMessage } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    role: 'Project Manager'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    role: 'Developer'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    role: 'Designer'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
    role: 'Analyst'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Customer Portal Redesign',
    description: 'Redesigning the customer portal for better user experience',
    status: 'active',
    progress: 75,
    team: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-03-30')
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    description: 'Building comprehensive analytics dashboard for stakeholders',
    status: 'active',
    progress: 45,
    team: [mockUsers[0], mockUsers[3]],
    createdAt: new Date('2024-02-01'),
    dueDate: new Date('2024-04-15')
  },
  {
    id: '3',
    name: 'Mobile App Launch',
    description: 'Launching mobile application for iOS and Android',
    status: 'completed',
    progress: 100,
    team: [mockUsers[1], mockUsers[2]],
    createdAt: new Date('2023-11-01'),
    dueDate: new Date('2024-01-31')
  }
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Sarah Johnson',
    message: 'Great progress on the user interface! The new design looks fantastic.',
    timestamp: new Date('2024-01-20T10:30:00'),
    projectId: '1'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Michael Chen',
    message: 'Thanks! I\'ve implemented the responsive design. Should work well on mobile devices.',
    timestamp: new Date('2024-01-20T10:35:00'),
    projectId: '1'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Emily Rodriguez',
    message: 'The color scheme is perfect. Users will love the new look!',
    timestamp: new Date('2024-01-20T10:40:00'),
    projectId: '1'
  },
  {
    id: '4',
    userId: '4',
    userName: 'David Kim',
    message: 'The analytics data shows 40% improvement in user engagement.',
    timestamp: new Date('2024-01-20T14:15:00'),
    projectId: '2'
  }
];

export const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Project Requirements.pdf',
    type: 'application/pdf',
    size: 2048576,
    uploadedAt: new Date('2024-01-15T09:00:00'),
    uploadedBy: 'Sarah Johnson',
    projectId: '1'
  },
  {
    id: '2',
    name: 'UI Mockups.sketch',
    type: 'application/sketch',
    size: 5242880,
    uploadedAt: new Date('2024-01-16T14:30:00'),
    uploadedBy: 'Emily Rodriguez',
    projectId: '1'
  },
  {
    id: '3',
    name: 'Database Schema.sql',
    type: 'text/sql',
    size: 1024,
    uploadedAt: new Date('2024-01-18T11:45:00'),
    uploadedBy: 'Michael Chen',
    projectId: '1'
  },
  {
    id: '4',
    name: 'Analytics Report.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 3145728,
    uploadedAt: new Date('2024-01-20T16:20:00'),
    uploadedBy: 'David Kim',
    projectId: '2'
  }
];

export const mockFormTemplates: FormTemplate[] = [
  {
    id: '1',
    name: 'Lead Capture Form',
    description: 'Capture potential customer information',
    fields: [
      { id: '1', label: 'Full Name', type: 'text', required: true },
      { id: '2', label: 'Email Address', type: 'email', required: true },
      { id: '3', label: 'Company', type: 'text', required: false },
      { id: '4', label: 'Phone Number', type: 'text', required: false },
      { id: '5', label: 'How did you hear about us?', type: 'select', required: false, options: ['Google', 'Social Media', 'Referral', 'Advertisement'] }
    ],
    createdAt: new Date('2024-01-10')
  },
  {
    id: '2',
    name: 'Customer Feedback Survey',
    description: 'Collect feedback from existing customers',
    fields: [
      { id: '1', label: 'Overall Satisfaction', type: 'radio', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'] },
      { id: '2', label: 'What do you like most?', type: 'textarea', required: false },
      { id: '3', label: 'What can we improve?', type: 'textarea', required: false },
      { id: '4', label: 'Would you recommend us?', type: 'checkbox', required: false }
    ],
    createdAt: new Date('2024-01-12')
  }
];

export const mockDashboardMetrics: DashboardMetric[] = [
  {
    id: '1',
    title: 'Total Revenue',
    value: '$125,430',
    change: 12.5,
    trend: 'up',
    icon: 'DollarSign',
    color: 'green'
  },
  {
    id: '2',
    title: 'Active Projects',
    value: 8,
    change: 2,
    trend: 'up',
    icon: 'Briefcase',
    color: 'blue'
  },
  {
    id: '3',
    title: 'Team Members',
    value: 24,
    change: 0,
    trend: 'stable',
    icon: 'Users',
    color: 'purple'
  },
  {
    id: '4',
    title: 'Completion Rate',
    value: '94%',
    change: 3.2,
    trend: 'up',
    icon: 'TrendingUp',
    color: 'green'
  }
];

export const chartData = {
  monthlyRevenue: [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 33000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 36000 },
    { month: 'Jun', revenue: 67000, expenses: 41000 }
  ],
  projectStatus: [
    { name: 'Completed', value: 45, color: '#10B981' },
    { name: 'In Progress', value: 30, color: '#3B82F6' },
    { name: 'Pending', value: 25, color: '#F59E0B' }
  ]
};

export const mockEmails: EmailMessage[] = [
  {
    id: '1',
    from: 'BusinessGrow System',
    fromEmail: 'system@businessgrow.com',
    subject: 'New Form Submission: Lead Capture Form',
    preview: 'A new lead has submitted the contact form with high interest in your services...',
    content: `
      <div>
        <h3>New Lead Submission</h3>
        <p>A new lead has submitted the Lead Capture Form with the following details:</p>
        <ul>
          <li><strong>Name:</strong> John Smith</li>
          <li><strong>Email:</strong> john.smith@example.com</li>
          <li><strong>Company:</strong> Tech Solutions Inc.</li>
          <li><strong>Interest Level:</strong> High</li>
        </ul>
        <p>Please follow up within 24 hours for best conversion rates.</p>
      </div>
    `,
    timestamp: new Date('2024-01-20T14:30:00'),
    read: false,
    starred: true,
    category: 'form',
    priority: 'high'
  },
  {
    id: '2',
    from: 'Project Manager',
    fromEmail: 'pm@businessgrow.com',
    subject: 'Customer Portal Redesign - Milestone Completed',
    preview: 'The UI/UX design phase has been completed ahead of schedule...',
    content: `
      <div>
        <h3>Project Update</h3>
        <p>Great news! The Customer Portal Redesign project has reached a major milestone:</p>
        <ul>
          <li>✅ UI/UX Design Phase - Completed</li>
          <li>🔄 Frontend Development - In Progress (75%)</li>
          <li>⏳ Backend Integration - Scheduled</li>
        </ul>
        <p>The team is performing exceptionally well and we're on track for early delivery.</p>
      </div>
    `,
    timestamp: new Date('2024-01-20T11:15:00'),
    read: true,
    starred: false,
    category: 'project',
    priority: 'medium'
  },
  {
    id: '3',
    from: 'Analytics Engine',
    fromEmail: 'analytics@businessgrow.com',
    subject: 'Weekly Performance Report Available',
    preview: 'Your weekly analytics report shows significant improvements in key metrics...',
    content: `
      <div>
        <h3>Weekly Performance Summary</h3>
        <p>Here are the highlights from this week's performance:</p>
        <ul>
          <li>📈 Revenue increased by 12.5%</li>
          <li>👥 Team productivity up 8%</li>
          <li>✅ Project completion rate: 94%</li>
          <li>💬 Customer satisfaction: 4.8/5</li>
        </ul>
        <p>Detailed reports are available in your dashboard.</p>
      </div>
    `,
    timestamp: new Date('2024-01-19T16:45:00'),
    read: true,
    starred: false,
    category: 'system',
    priority: 'low'
  },
  {
    id: '4',
    from: 'Security Alert',
    fromEmail: 'security@businessgrow.com',
    subject: 'New Login from Unknown Device',
    preview: 'We detected a new login to your account from an unrecognized device...',
    content: `
      <div>
        <h3>Security Alert</h3>
        <p>We detected a new login to your account:</p>
        <ul>
          <li><strong>Device:</strong> Chrome on Windows</li>
          <li><strong>Location:</strong> San Francisco, CA</li>
          <li><strong>Time:</strong> January 20, 2024 at 2:15 PM</li>
          <li><strong>IP Address:</strong> 192.168.1.100</li>
        </ul>
        <p>If this was you, you can ignore this message. If not, please secure your account immediately.</p>
      </div>
    `,
    timestamp: new Date('2024-01-20T14:15:00'),
    read: false,
    starred: false,
    category: 'notification',
    priority: 'high'
  },
  {
    id: '5',
    from: 'Team Collaboration',
    fromEmail: 'team@businessgrow.com',
    subject: 'You have been mentioned in Analytics Dashboard',
    preview: 'David Kim mentioned you in a comment on the Analytics Dashboard project...',
    content: `
      <div>
        <h3>Team Mention</h3>
        <p>David Kim mentioned you in the Analytics Dashboard project:</p>
        <blockquote style="border-left: 4px solid #3B82F6; padding-left: 16px; margin: 16px 0; font-style: italic;">
          "@sarah The new dashboard metrics look fantastic! Could you review the user engagement charts when you have a moment?"
        </blockquote>
        <p>Click here to view the full conversation and respond.</p>
      </div>
    `,
    timestamp: new Date('2024-01-19T13:20:00'),
    read: true,
    starred: false,
    category: 'project',
    priority: 'medium'
  }
];