const fs = require('fs');
const srcPath = 'frontend/src/pages/Home.tsx';
let content = fs.readFileSync(srcPath, 'utf8');

// Fix #2: stPending accent budget — change markPoint color from stPending to teal
content = content.replace(
  /itemStyle: \{ color: stPending \},\n\s+label: \{ show: true, formatter: '\{c\}', color: '#fff', fontSize: 11 \}/,
  'itemStyle: { color: teal },\n          label: { show: true, formatter: \'{c}\', color: teal, fontSize: 11 }'
);

// Fix #3: Ring chart — replace roundCap with two-series pie
const oldRing = `  // --- Ring: Tỷ lệ KCHT đang vận hành ---
  const ringKchtOption: Record<string, unknown> = {
    tooltip: { ...chartTooltip },
    series: [{
      type: 'pie',
      radius: ['60%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: false },
      roundCap: true,
      data: [
        {
          value: 87,
          name: 'Vận hành',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [
                { offset: 0, color: sea2 },
                { offset: 1, color: sea0 },
              ],
            },
          },
        },
        { value: 13, name: 'Còn lại', itemStyle: { color: '#eaf1f7' } },
      ],
    }],
    graphic: donutCenterGraphic('87%', '187/215 vận hành'),
  };`;

const newRing = `  // --- Ring: Tỷ lệ KCHT đang vận hành ---
  const ringKchtOption: Record<string, unknown> = {
    tooltip: { ...chartTooltip },
    series: [
      {
        type: 'pie',
        radius: ['60%', '82%'],
        center: ['50%', '50%'],
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: false },
        data: [{ value: 100, name: 'track', itemStyle: { color: '#eaf1f7', borderRadius: 10 } }],
      },
      {
        type: 'pie',
        radius: ['60%', '82%'],
        center: ['50%', '50%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: false },
        data: [{
          value: 87,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [
                { offset: 0, color: sea2 },
                { offset: 1, color: sea0 },
              ],
            },
            borderRadius: 10,
          },
        }],
      },
    ],
    graphic: donutCenterGraphic('87%', '187/215 vận hành'),
  };`;

content = content.replace(oldRing, newRing);

// Fix #4: KPI card 4 sparkline — use stPending color
content = content.replace(
  "sparklineOption(SPARK_PT_THUY, 'bar', sea1)",
  "sparklineOption(SPARK_PT_THUY, 'bar', stPending)"
);

// Fix #5: Donut center — change 49.877 to 75.877
content = content.replace(
  "donutCenterGraphic('49.877', 'tổng lượt')",
  "donutCenterGraphic('75.877', 'tổng lượt phương tiện')"
);

// Fix #6: Circular chart radius — ['58%','80%'] to ['60%','82%']
content = content.replace(
  "const CIRCLE_RADIUS: [string, string] = ['58%', '80%']",
  "const CIRCLE_RADIUS: [string, string] = ['60%', '82%']"
);

// Fix #7: Hero gradient — add 3rd color stop
content = content.replace(
  "background: `linear-gradient(135deg, ${navy} 0%, ${sea0} 100%)`",
  "background: `linear-gradient(135deg, ${navy} 0%, ${sea0} 40%, #1a4f82 100%)`"
);

// Fix #8: Hero delta badge — tinted background
content = content.replace(
  "<span style={{ background: stApproved, color: '#fff', padding: '2px 10px', borderRadius: rPill, fontSize: 12, fontWeight: 600 }}>",
  "<span style={{ background: 'rgba(22,163,122,0.12)', color: stApproved, padding: '2px 10px', borderRadius: rPill, fontSize: 12, fontWeight: 600 }}>"
);

// Fix #9: Hero readout order — label first, then value
content = content.replace(
  `            {[\n              { value: '28.450', label: 'Lượt tàu' },\n              { value: '345.200', label: 'Lượt hành khách' },\n              { value: '187/215', label: 'KCHT vận hành' },\n            ].map((item) => (\n              <div key={item.label}>\n                <span style={{ fontFamily: fontMono, fontSize: 20, fontWeight: 600, color: surface }}>\n                  {item.value}\n                </span>\n                <span style={{ fontSize: 12, color: ink3, marginLeft: 6 }}>{item.label}</span>\n              </div>\n            ))}`,
  `            {[\n              { value: '28.450', label: 'Lượt tàu' },\n              { value: '345.200', label: 'Lượt hành khách' },\n              { value: '187/215', label: 'KCHT vận hành' },\n            ].map((item) => (\n              <div key={item.label} style={{ marginBottom: 8 }}>\n                <div style={{ fontFamily: fontMono, fontSize: 11, color: ink3, letterSpacing: 0.5, textTransform: 'uppercase' }}>\n                  {item.label}\n                </div>\n                <div style={{ fontFamily: fontMono, fontSize: 22, fontWeight: 600, color: surface }}>\n                  {item.value}\n                </div>\n              </div>\n            ))}`
);

// Fix #10: Responsive — Replace AntD Row/Col with CSS grid divs and add media query

// Replace Row gutter pattern with CSS grid className
content = content.replace(
  '<Row gutter={[16, 16]} style={{ marginTop: 20 }}>',
  '<div className="dashboard-chart-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 20 }}>'
);

// Replace lg=16 cols with flex divs (2fr = 16 parts, 1fr = 8 parts)
content = content.replace(
  '<Col xs={24} lg={16}>',
  '<div style={{ flex: "2fr", minWidth: 0 }}>'
);

// Replace lg=8 cols
content = content.replace(
  '<Col xs={24} lg={8}>',
  '<div style={{ flex: "1fr", minWidth: 0 }}>'
);

// Replace md=8 cols (1:1:1 row)
content = content.replace(
  '<Col xs={24} md={8}>',
  '<div style={{ flex: "1fr", minWidth: 0 }}>'
);

// Replace the third row header with 1fr 1fr 1fr grid
content = content.replace(
  'Row gutter={[16, 16]} style={{ marginTop: 20 }}>\n        <Col xs={24} md={8}>\n          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>\n            Mức độ bao phủ KCHT',
  '<div className="dashboard-chart-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>\n        <div style={{ flex: "1fr", minWidth: 0 }}>\n          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>\n            Mức độ bao phủ KCHT'
);

// Replace end of grid row with </div> instead of </Col>
content = content.replace(
  '</Row>\n\n    </div>',
  '      </div>\n\n      <style>{`\n        @media (max-width: 1080px) {\n          .dashboard-chart-row { grid-template-columns: 1fr !important; }\n          .dashboard-hero { flex-direction: column !important; }\n        }\n      `}</style>\n    </div>'
);

// Add className to hero ribbon
content = content.replace(
  '<div\n        style={{\n          background: `linear-gradient(135deg, ${navy} 0%, ${sea0} 40%, #1a4f82 100%)`,',
  '<div className="dashboard-hero"\n        style={{\n          background: `linear-gradient(135deg, ${navy} 0%, ${sea0} 40%, #1a4f82 100%)`,'
);

fs.writeFileSync(srcPath, content);
console.log('Written ' + content.length + ' bytes to Home.tsx');
console.log('Contains roundCap:', content.includes('roundCap'));
console.log('Contains stPending in markPoint:', content.match(/markPoint[\s\S]*?stPending/));
console.log('Contains CIRCLE_RADIUS 60/82:', content.includes("['60%', '82%']"));
console.log('Contains 3-stop gradient:', content.includes('#1a4f82'));
