export interface Permission {
  key: string;
  name: string;
  group: string;
  description: string;
  resource?: string;
  action?: string;
}

export interface PermissionGroup {
  group: string;
  label: string;
  permissions: Permission[];
}

export interface PermissionTreeNode {
  key: string;
  title: string;
  disableCheckbox?: boolean;
  children?: PermissionTreeNode[];
}

export interface MenuTreeNode extends PermissionTreeNode {
  code: string;
  url?: string;
  parentCode?: string;
  children?: MenuTreeNode[];
}
