import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/pages/Home.tsx';
let content = readFileSync(filePath, 'utf8');
const crlf = '\r\n';

// Fix stackedBar
content = content.replace(
  '<h4 style={CHART_TITLE_STYLE}>Hàng hóa thông qua cảng theo tháng</h4>',
  `<h4 style={CHART_TITLE_STYLE}>Hàng hóa thông qua cảng theo tháng${crlf}              {blockStates.stackedBar?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}${crlf}            </h4>`
);

// Fix linePassenger  
content = content.replace(
  '<h4 style={CHART_TITLE_STYLE}>Lượt hành khách qua cảng</h4>',
  `<h4 style={CHART_TITLE_STYLE}>Lượt hành khách qua cảng${crlf}              {blockStates.linePassenger?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}${crlf}            </h4>`
);

// Fix infraTable
content = content.replace(
  '<h4 style={CHART_TITLE_STYLE}>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng</h4>',
  `<h4 style={CHART_TITLE_STYLE}>Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng${crlf}              {blockStates.infraTable?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}${crlf}            </h4>`
);

writeFileSync(filePath, content);
console.log('Missing Tag indicators applied');
