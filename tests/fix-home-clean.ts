import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/pages/Home.tsx';
let content = readFileSync(filePath, 'utf8');
const crlf = '\r\n';

// Remove unused imports: EnvironmentOutlined
content = content.replace(
  "import { EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';",
  "import { EyeOutlined } from '@ant-design/icons';"
);

// Remove unused const declarations: sea1, sea2
content = content.replace(
  'const sea1 = dataSea1;' + crlf + 'const sea2 = dataSea2;' + crlf,
  ''
);

writeFileSync(filePath, content);
console.log('Home.tsx: removed unused EnvironmentOutlined, sea1, sea2');
