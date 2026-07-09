import fs from 'fs';

const base = 'frontend/src/pages';

function read(f: string) {
  return fs.readFileSync(`${base}/${f}`, 'utf8');
}

function write(f: string, c: string) {
  fs.writeFileSync(`${base}/${f}`, c, 'utf8');
  console.log(`Wrote ${f}`);
}

// ===== USERS PAGE =====
let u = read('UsersPage.tsx');

// 1. Role column: Tag -> role-tag span
u = u.replace(
  /render: \(text: string\) => <Tag color="blue">{text}<\/Tag>,/,
  `render: (text: string, record: User) => {
        const variant = record.roleId === 'SUPER_ADMIN' ? 'admin' : record.roleId === 'MODULE_ADMIN' ? 'org-admin' : 'viewer';
        return <span className={'role-tag role-tag--' + variant}>{text}</span>;
      },`
);

// 2. Status column: Tag -> status-badge span
u = u.replace(
  /return <Tag color=\{s\.color\}>{s\.label}<\/Tag>;/,
  `const variant: string = status === 'active' ? 'active' : status === 'locked' ? 'locked' : 'inactive';
        const label = s.label;
        return <span className={'status-badge status-badge--' + variant}>{label}</span>;`
);

// 3. Actions: Space -> div.table-actions
u = u.replace(/<Space size="small">/, `<div className="table-actions">`);

// 4. Edit button
u = u.replace(
  /<Tooltip title="Sửa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*icon={<EditOutlined \/>}[\s\n]*onClick=\{\(\) => openEditModal\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Sửa">
              <span className="table-actions__btn" onClick={() => openEditModal(record)}>
                <EditOutlined />
              </span>
            </Tooltip>`
);

// 5. Lock button
u = u.replace(
  /<Tooltip title=\{record\.status === 'locked' \? 'Mở khóa' : 'Khóa'\}>[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger=\{record\.status !== 'locked'\}[\s\n]*icon=\{record\.status === 'locked' \? <UnlockOutlined \/> : <LockOutlined \/>}[\s\n]*onClick=\{\(\) => handleToggleLock\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title={record.status === 'locked' ? 'Mở khóa' : 'Khóa'}>
              <span
                className={'table-actions__btn' + (record.status !== 'locked' ? ' table-actions__btn--danger' : '')}
                onClick={() => handleToggleLock(record)}
              >
                {record.status === 'locked' ? <UnlockOutlined /> : <LockOutlined />}
              </span>
            </Tooltip>`
);

// 6. Reset password button
u = u.replace(
  /<Tooltip title="Reset mật khẩu">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*icon={<KeyOutlined \/>}[\s\n]*onClick=\{\(\) => handleResetPassword\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Reset mật khẩu">
              <span className="table-actions__btn" onClick={() => handleResetPassword(record)}>
                <KeyOutlined />
              </span>
            </Tooltip>`
);

// 7. Delete button
u = u.replace(
  /<Tooltip title="Xóa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<DeleteOutlined \/>}[\s\n]*onClick=\{\(\) => handleDelete\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Xóa">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleDelete(record)}>
                <DeleteOutlined />
              </span>
            </Tooltip>`
);

// 8. Close Space -> div
u = u.replace(
  /<\/Space>\n\s*\},\n\s*},\n\s*];\n\n\s*\/\/ ---- Render States/,
  `</div>
      ),
    },
  ];

  // ---- Render States`
);

write('UsersPage.tsx', u);
console.log('UsersPage role-tag:', u.includes('role-tag'));
console.log('UsersPage status-badge:', u.includes('status-badge'));
console.log('UsersPage table-actions:', u.includes('table-actions'));

// ===== ROLES PAGE =====
let r = read('RolesPage.tsx');

r = r.replace(
  /<Typography\.Text strong>\{text\}<\/Typography\.Text>/,
  `const variant = record.code === 'SUPER_ADMIN' ? 'admin' : record.code === 'MODULE_ADMIN' ? 'org-admin' : 'viewer';
          return <span className={'role-tag role-tag--' + variant}>{text}</span>;`
);

r = r.replace(/<Space size="small">/, `<div className="table-actions">`);

r = r.replace(
  /<Tooltip title="Sửa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*icon={<EditOutlined \/>}[\s\n]*onClick=\{\(\) => openEditModal\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Sửa">
              <span className="table-actions__btn" onClick={() => openEditModal(record)}>
                <EditOutlined />
              </span>
            </Tooltip>`
);

r = r.replace(
  /<Tooltip title="Xóa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<DeleteOutlined \/>}[\s\n]*onClick=\{\(\) => handleDelete\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Xóa">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleDelete(record)}>
                <DeleteOutlined />
              </span>
            </Tooltip>`
);

r = r.replace(
  /<\/Space>\n\s*\},\n\s*},\n\s*];\n\n\s*return \(\n\s*<>/,
  `</div>
      ),
    },
  ];

  return (`
);

write('RolesPage.tsx', r);

// ===== ADMIN LIST =====
let a = read('admins/AdminList.tsx');

a = a.replace(
  /render: \(text: string\) => <Tag color="blue">{text}<\/Tag>,/,
  `render: (text: string, record) => {
        const variant = record.roleId === 'SUPER_ADMIN' ? 'admin' : record.roleId === 'MODULE_ADMIN' ? 'org-admin' : 'viewer';
        return <span className={'role-tag role-tag--' + variant}>{text}</span>;
      },`
);

a = a.replace(
  /return <Tag color=\{s\.color\}>{s\.label}<\/Tag>;/,
  `const variant: string = status === 'active' ? 'active' : status === 'locked' ? 'locked' : 'inactive';
        const label = s.label;
        return <span className={'status-badge status-badge--' + variant}>{label}</span>;`
);

a = a.replace(/<Space size="small">/, `<div className="table-actions">`);

a = a.replace(
  /<Tooltip title="Sửa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*icon={<EditOutlined \/>}[\s\n]*onClick=\{\(\) => openEditModal\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Sửa">
              <span className="table-actions__btn" onClick={() => openEditModal(record)}>
                <EditOutlined />
              </span>
            </Tooltip>`
);

a = a.replace(
  /<Tooltip title="Xóa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<DeleteOutlined \/>}[\s\n]*onClick=\{\(\) => handleDelete\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Xóa">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleDelete(record)}>
                <DeleteOutlined />
              </span>
            </Tooltip>`
);

a = a.replace(
  /<\/Space>\n\s*\},\n\s*],\n\n\s*return \(/,
  `</div>
    },
  ];

  return (`
);

write('AdminList.tsx', a);

// ===== UNIT LIST =====
let o = read('organizations/UnitList.tsx');

o = o.replace(
  /render: \(status: string\) => \{[\s\n]*const s = STATUS_MAP\[status\] \|\| \{ color: 'default', label: status \};[\s\n]*return <Tag color=\{s\.color\}>{s\.label}<\/Tag>;[\s\n]*\},/,
  `render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        const variant: string = status === 'approved' ? 'active' : status === 'rejected' ? 'locked' : status === 'pending' ? 'pending' : 'inactive';
        return <span className={'status-badge status-badge--' + variant}>{s.label}</span>;
      },`
);

o = o.replace(/<Space size="small">/, `<div className="table-actions">`);

o = o.replace(
  /<Tooltip title="Từ chối">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<CloseOutlined \/>}[\s\n]*onClick=\{\(\) => handleReject\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Từ chối">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleReject(record)}>
                <CloseOutlined />
              </span>
            </Tooltip>`
);

o = o.replace(
  /<Tooltip title="Xóa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<DeleteOutlined \/>}[\s\n]*onClick=\{\(\) => handleDelete\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Xóa">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleDelete(record)}>
                <DeleteOutlined />
              </span>
            </Tooltip>`
);

o = o.replace(
  /<\/Space>\n\s*\},\n\s*],\n\n\s*return \(/,
  `</div>
    },
  ];

  return (`
);

write('UnitList.tsx', o);

// ===== GROUP LIST =====
let g = read('groups/GroupList.tsx');

g = g.replace(
  /render: \(status: string\) => \{[\s\n]*const s = STATUS_MAP\[status\] \|\| \{ color: 'default', label: status \};[\s\n]*return <Tag color=\{s\.color\}>{s\.label}<\/Tag>;[\s\n]*\},/,
  `render: (status: string) => {
        const s = STATUS_MAP[status] || { color: 'default', label: status };
        const variant: string = status === 'active' ? 'active' : status === 'locked' ? 'locked' : 'inactive';
        return <span className={'status-badge status-badge--' + variant}>{s.label}</span>;
      },`
);

g = g.replace(/<Space size="small">/, `<div className="table-actions">`);

g = g.replace(
  /<Tooltip title="Sửa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*icon={<EditOutlined \/>}[\s\n]*onClick=\{\(\) => openEditModal\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Sửa">
              <span className="table-actions__btn" onClick={() => openEditModal(record)}>
                <EditOutlined />
              </span>
            </Tooltip>`
);

g = g.replace(
  /<Tooltip title="Xóa">[\s\n]*<Button[\s\n]*type="link"[\s\n]*size="small"[\s\n]*danger[\s\n]*icon={<DeleteOutlined \/>}[\s\n]*onClick=\{\(\) => handleDelete\(record\)\}[\s\n]*\/>[\s\n]*<\/Tooltip>/,
  `<Tooltip title="Xóa">
              <span className="table-actions__btn table-actions__btn--danger" onClick={() => handleDelete(record)}>
                <DeleteOutlined />
              </span>
            </Tooltip>`
);

g = g.replace(
  /<\/Space>\n\s*\},\n\s*],\n\n\s*return \(/,
  `</div>
    },
  ];

  return (`
);

write('GroupList.tsx', g);

console.log('All files processed successfully');
