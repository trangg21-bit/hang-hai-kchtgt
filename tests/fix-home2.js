const fs = require('fs');
const path = 'frontend/src/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix remaining Row/Col for chart rows 2 and 3
// Row 2 (Line + Ring)
content = content.replace(
  `      {/* 5. Chart Row 2 — Line + Ring (2:1)                  */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={16}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Lượt hành khách qua cảng
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={linePassengerOption} style={{ height: 320 }} />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Tỷ lệ KCHT đang vận hành
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={ringKchtOption} style={{ height: 320 }} />
          </div>
        </Col>
      </Row>`,
  `      {/* 5. Chart Row 2 — Line + Ring (2:1)                  */}
      <div className="dashboard-chart-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginTop: 20 }}>
        <div style={{ flex: "2fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Lượt hành khách qua cảng
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={linePassengerOption} style={{ height: 320 }} />
          </div>
        </div>
        <div style={{ flex: "1fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Tỷ lệ KCHT đang vận hành
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={ringKchtOption} style={{ height: 320 }} />
          </div>
        </div>
      </div>`
);

// Row 3 (Radar + H-Bar + Donut)
content = content.replace(
  `      {/* 6. Chart Row 3 — Radar + H-Bar + Donut (1:1:1)      */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={8}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Mức độ bao phủ KCHT
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Phê duyệt theo hạng mục
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={hBarOption} style={{ height: 300 }} />
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Trạng thái đề nghị phê duyệt
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={donutPheDuyetOption} style={{ height: 300 }} />
          </div>
        </Col>
      </Row>`,
  `      {/* 6. Chart Row 3 — Radar + H-Bar + Donut (1:1:1)      */}
      <div className="dashboard-chart-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 20 }}>
        <div style={{ flex: "1fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Mức độ bao phủ KCHT
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </div>
        </div>
        <div style={{ flex: "1fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Phê duyệt theo hạng mục
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={hBarOption} style={{ height: 300 }} />
          </div>
        </div>
        <div style={{ flex: "1fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Trạng thái đề nghị phê duyệt
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={donutPheDuyetOption} style={{ height: 300 }} />
          </div>
        </div>
      </div>`
);

// Also fix chart row 1 Title usage (replace Title with plain text div)
// The first chart row still has <Title level={5}> ... </Title>
content = content.replace(
  `<Col xs={24} lg={16}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Hàng hóa thông qua cảng theo tháng
          </Title>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={stackedBarOption} style={{ height: 320 }} />
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <Title level={5} style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Cơ cấu lượt phương tiện
          </Title>`,
  `<div style={{ flex: "2fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Hàng hóa thông qua cảng theo tháng
          </div>
          <div
            style={{
              background: surface,
              boxShadow: shadowMd,
              borderRadius: rCard,
              padding: 20,
            }}
          >
            <ReactECharts option={stackedBarOption} style={{ height: 320 }} />
          </div>
        </div>
        <div style={{ flex: "1fr", minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: navy, marginBottom: 12 }}>
            Cơ cấu lượt phương tiện
          </div>`
);

// Clean up </Col> and </Row> tags that are no longer needed (for chart row 1)
content = content.replace(
  `            <ReactECharts option={donutPhuongTienOption} style={{ height: 320 }} />
          </div>
        </Col>
      </Row>

      {/* 5. Chart Row 2`,
  `            <ReactECharts option={donutPhuongTienOption} style={{ height: 320 }} />
          </div>
        </div>
      </div>

      {/* 5. Chart Row 2`
);

fs.writeFileSync(path, content);
console.log('Written ' + content.length + ' bytes');

// Verify no more Row/Col/Title from antd
const rowCount = (content.match(/<Row /g) || []).length;
const colCount = (content.match(/<Col /g) || []).length;
const titleCount = (content.match(/<Title level=/g) || []).length;
const buttonCount = (content.match(/<Button /g) || []).length;
console.log('Row count:', rowCount);
console.log('Col count:', colCount);
console.log('Title count:', titleCount);
console.log('Button count:', buttonCount);
console.log('Contains </Col>:', content.includes('</Col>'));
console.log('Contains </Row>:', content.includes('</Row>'));
