import { RouteInfo } from './sidebar.metadata';

export const ROUTES: RouteInfo[] = [
  {
    path: 'dashboard',
    title: 'DASHBOARD',
    icon: 'layers',
    class: '',
    groupTitle: false,
    claims: ['DASHBOARD_VIEW_DASHBOARD']
  },
  {
    path: '',
    title: 'ASSIGNED_DOCUMENTS',
    icon: 'list',
    class: '',
    groupTitle: false,
    claims: []
  },
  {
    path: 'documents',
    title: 'ALL_DOCUMENTS',
    icon: 'file-text',
    class: '',
    groupTitle: false,
    claims: ['ALL_DOCUMENTS_VIEW_DOCUMENTS']
  },
  {
    path: 'categories',
    title: 'DOCUMENT_CATEGORIES',
    icon: 'file',
    class: '',
    groupTitle: false,
    claims: ['DOCUMENT_CATEGORY_MANAGE_DOCUMENT_CATEGORY']
  },
  {
    path: 'document-audit-trails',
    title: 'DOCUMENTS_AUDIT_TRAIL',
    icon: 'activity',
    class: '',
    groupTitle: false,
    claims: ['DOCUMENT_AUDIT_TRAIL_VIEW_DOCUMENT_AUDIT_TRAIL']
  },
  {
    path: 'roles',
    title: 'ROLES',
    icon: 'users',
    class: '',
    groupTitle: false,
    claims: ['ROLE_VIEW_ROLES']
  },
  {
    path: 'users',
    title: 'USERS',
    icon: 'user',
    class: '',
    groupTitle: false,
    claims: ['USER_VIEW_USERS']
  },
  {
    path: 'roles/users',
    title: 'ROLE_USER',
    icon: 'user-check',
    class: '',
    groupTitle: false,
    claims: ['USER_ASSIGN_USER_ROLE']
  },
  {
    path: 'reminders',
    title: 'REMINDER',
    icon: 'bell',
    class: '',
    groupTitle: false,
    claims: ['REMINDER_VIEW_REMINDERS']
  },
  {
    path: 'login-audit',
    title: 'LOGIN_AUDITS',
    icon: 'log-in',
    class: '',
    groupTitle: false,
    claims: ['LOGIN_AUDIT_VIEW_LOGIN_AUDIT_LOGS']
  },
  {
    path: 'email-smtp',
    title: 'SMTP_SETTING',
    icon: 'mail',
    class: '',
    groupTitle: false,
    claims: ['EMAIL_MANAGE_SMTP_SETTINGS']
  }
];
