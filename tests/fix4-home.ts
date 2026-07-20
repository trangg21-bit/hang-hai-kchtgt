import { readFileSync, writeFileSync } from 'fs';
const filePath = 'frontend/src/pages/Home.tsx';
let content = readFileSync(filePath, 'utf8');

// Normalize line endings to \n for replacement, then write back as-is
const crlf = '\r\n';
const lf = '\n';

// === Fix 4a: Add blockStates state ===
content = content.replace(
  '  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);',
  `  const [dashboardData, setDashboardData] = useState<DashboardData>(MOCK_DATA);\n  const [blockStates, setBlockStates] = useState<Record<string, BlockState>>({});`
);

// === Fix 4b: Update useEffect to capture states ===
content = content.replace(
  '      .then(({ data }) => setDashboardData(data))',
  `      .then(({ data, states }) => { setDashboardData(data); setBlockStates(states || {}); })`
);

// === Fix 4c: Add Tag indicators to chart block titles ===

// stackedBar
content = content.replace(
  `            <h4 style={CHART_TITLE_STYLE}>\n              Hàng hóa thông qua cảng theo tháng\n            </h4>`,
  `            <h4 style={CHART_TITLE_STYLE}>\n              Hàng hóa thông qua cảng theo tháng\n              {blockStates.stackedBar?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}\n            </h4>`
);

// linePassenger
content = content.replace(
  `            <h4 style={CHART_TITLE_STYLE}>\n              Lượt hành khách qua cảng\n            </h4>`,
  `            <h4 style={CHART_TITLE_STYLE}>\n              Lượt hành khách qua cảng\n              {blockStates.linePassenger?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}\n            </h4>`
);

// infraTable
content = content.replace(
  `            <h4 style={CHART_TITLE_STYLE}>\n              Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng\n            </h4>`,
  `            <h4 style={CHART_TITLE_STYLE}>\n              Bảng chi tiết thông số kỹ thuật Kết cấu hạ tầng\n              {blockStates.infraTable?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}\n            </h4>`
);

// === Fix 4d: Add Row 3 ===
const row3Content = `      {/* Row 3 — Approval chart + Donut */}\n      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>\n        <Col xs={24} md={12}>\n          <div style={{ ...CARD_BASE, height: '100%' }}>\n            <h4 style={CHART_TITLE_STYLE}>\n              Phê duyệt theo hạng mục\n              {blockStates.hBarApproval?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}\n            </h4>\n            <ReactECharts option={hBarOption} style={{ height: 320 }} notMerge />\n          </div>\n        </Col>\n        <Col xs={24} md={12}>\n          <div style={{ ...CARD_BASE, height: '100%' }}>\n            <h4 style={CHART_TITLE_STYLE}>\n              Trạng thái phê duyệt\n              {blockStates.donutPheDuyet?.isMockFallback && <Tag color="orange" style={{ marginLeft: 8, fontSize: 11 }}>Dữ liệu mẫu</Tag>}\n            </h4>\n            <ReactECharts option={donutOption} style={{ height: 320 }} notMerge />\n          </div>\n        </Col>\n      </Row>\n`;

// Find the exact closing: </Row>\r\n    </div>\r\n  );\r\n}\r\n\r\n// ============================================================\r\n// HomePage
const closingPattern = `      </Row>${crlf}    </div>${crlf}  );${crlf}}${crlf}${crlf}// ============================================================${crlf}// HomePage`;

if (content.includes(closingPattern)) {
  content = content.replace(
    closingPattern,
    `      </Row>${crlf}${row3Content}    </div>${crlf}  );${crlf}}${crlf}${crlf}// ============================================================${crlf}// HomePage`
  );
  writeFileSync(filePath, content);
  console.log('Fix 4 applied successfully');
} else {
  console.log('Pattern not found');
  // Debug: check what line endings are around the end
  const lastSection = content.substring(content.lastIndexOf('// HomePage') - 200, content.lastIndexOf('// HomePage') + 100);
  console.log('Raw bytes at end:', lastSection.split('').map(c => c.charCodeAt(0)).join(' '));
}
