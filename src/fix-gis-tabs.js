const fs = require('fs');
const path = 'frontend/src/services/cangbien/CangBienListPage.tsx';
let content = fs.readFileSync(path, 'utf8');

function buildSymbolSelect() {
  return `                            <Select
                              placeholder="Chọn biểu tượng hiển thị"
                              allowClear
                              showSearch
                              optionFilterProp="label"
                              style={selectStyle}
                            >
                              {symbols.map((sym) => (
                                <Select.Option key={sym.id} value={sym.id} label={\`$\{sym.name} (\$\{sym.code})\`}>
                                  <Space>
                                    {sym.hinhAnh && (
                                      <img
                                        src={
                                          sym.hinhAnh.startsWith('data:')
                                            ? sym.hinhAnh
                                            : \`data:image/png;base64,\$\{sym.hinhAnh}\`
                                        }
                                        alt={sym.name}
                                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                                      />
                                    )}
                                    <span>
                                      {sym.name} (\$\{sym.code})
                                    </span>
                                  </Space>
                                </Select.Option>
                              ))}
                            </Select>`;
}

const oldCreateGis = `                {
                  key: 'gis',
                  label: 'Vị trí',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="loaiHinhHoc"
                            {...labelProps('Loại đối tượng *')}
                            style={{ marginBottom: spaceFormField }}
                            rules={[{ required: true, message: 'Loại đối tượng không được để trống' }]}
                          >
                            <Select
                              placeholder="Chọn loại đối tượng"
                              options={[
                                { value: 'POINT', label: 'Đối tượng điểm' },
                                { value: 'LINE', label: 'Đối tượng đường' },
                                { value: 'POLYGON', label: 'Đối tượng vùng' },
                              ]}
                              style={selectStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="bieuTuongId"
                            {...labelProps('Biểu tượng bản đồ')}
                            style={{ marginBottom: spaceFormField }}
                          >
${buildSymbolSelect()}
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="heQuyChieu"
                            {...labelProps('Hệ quy chiếu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0}
                              step={1}
                              precision={0}
                              placeholder="4326"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="toaDo"
                            {...labelProps('Tọa độ (WKT)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: POINT(106.7 20.9)" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },`;

const newCreateGis = `                {
                  key: 'gis',
                  label: 'Vị trí',
                  children: (
                    <>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="bieuTuongId"
                            {...labelProps('Biểu tượng bản đồ')}
                            style={{ marginBottom: spaceFormField }}
                          >
${buildSymbolSelect()}
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="heQuyChieu"
                            {...labelProps('Hệ quy chiếu')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber
                              min={0}
                              step={1}
                              precision={0}
                              placeholder="4326"
                              style={numberInputStyle}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="quyTacHienThi"
                            {...labelProps('Quy tắc hiển thị')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <InputNumber min={0} step={1} precision={0} placeholder="0" style={numberInputStyle} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="toaDo"
                            {...labelProps('Tọa độ (WKT)')}
                            style={{ marginBottom: spaceFormField }}
                          >
                            <Input placeholder="VD: POINT(106.7 20.9)" style={inputStyle} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item name="gisLocation" style={{ marginBottom: spaceFormField }}>
                            <GisLocationSelector defaultGeometryType={createLoaiHinhHoc} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ),
                },`;

if (content.includes(oldCreateGis)) {
  content = content.replace(oldCreateGis, newCreateGis);
  console.log('Create GIS tab replaced');
} else {
  console.log('ERROR: Could not find old create GIS tab');
}

fs.writeFileSync(path, content, 'utf8');
