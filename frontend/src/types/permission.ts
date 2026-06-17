export interface Permission {
  key: string;
  name: string;
  group: string;
  description: string;
}

export interface PermissionGroup {
  group: string;
  label: string;
  permissions: Permission[];
}

export interface PermissionTreeNode {
  key: string;
  title: string;
  children?: PermissionTreeNode[];
}
