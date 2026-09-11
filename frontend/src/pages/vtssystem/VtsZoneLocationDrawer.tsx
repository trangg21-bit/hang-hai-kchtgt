import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  InputNumber,
  Modal,
} from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  sidebarBg,
  fontWeightBold,
  fontWeightMedium,
  fontSizeMd,
  fontSizeSm,
  actionPrimary,
  statusCritical,
  borderDefault,
  textTertiary,
  selectStyle,
  readonlyInputStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  radiusPill,
  spaceFormField,
  spaceSm,
  spaceXs,
} from '../../themetokenchk';
import AppDrawer from '../../components/shared/AppDrawer';
import DetailTable from '../../components/shared/DetailTable';
import GisLocationSelector from '../../components/gis/GisLocationSelector';
import { symbolService } from '../../services/symbolService';
import { DEFAULT_GIS_SYMBOLS } from '../vtsoperationcenter/VtsOperationCenterForm';
import { normalizeSearchText } from '../../components/org-unit';
import { fmtInputNumber } from '../../utils/numFmt';
import toast from '../../components/ToastNotification';
import {
  GEOMETRY_POINT_COUNT,
  validateDmsCoordinates,
  serializeCoordinatesToWkt,
  parseWktToCoordinates,
  ddToDms,
  dmsToDd,
} from '../../utils/gisGeometry';
import type { VtsZoneDto } from '../../types/vtsSystem';

export interface VtsZoneLocationDrawerProps {
  open: boolean;
  mode: 'view' | 'edit';
  zone: VtsZoneDto | any | null;
  zoneIndex: number | null;
  onClose: () => void;
  onSave?: (updatedZone: any, zoneIndex: number) => void;
}

interface DmsPoint {
  latD: number | null;
  latM: number | null;
  latS: number | null;
  lngD: number | null;
  lngM: number | null;
  lngS: number | null;
}

const sectionBoxStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px 10px 18px',
  marginBottom: 14,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
};

const sectionTitleStyle: React.CSSProperties = {
  color: sidebarBg,
  fontWeight: fontWeightBold,
  fontSize: fontSizeMd + 0.5,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const GEOMETRY_TYPE_OPTIONS = [
  { value: 'POINT', label: 'Đối tượng điểm' },
  { value: 'LINE', label: 'Đối tượng đường' },
  { value: 'POLYGON', label: 'Đối tượng vùng' },
];

const COORD_SYS_OPTIONS = [
  { value: 1, label: 'WGS-84' },
  { value: 2, label: 'VN-2000' },
];

const dmsUnitStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  borderRight: 0,
  height: 32,
  fontSize: fontSizeSm,
  color: textTertiary,
};

const dmsUnitEndStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0 3px',
  background: '#f5f5f5',
  border: `1px solid ${borderDefault}`,
  borderLeft: 0,
  height: 32,
  borderRadius: '0 999px 999px 0',
  fontSize: fontSizeSm,
  color: textTertiary,
};

export const VtsZoneLocationDrawer: React.FC<VtsZoneLocationDrawerProps> = ({
  open,
  mode,
  zone,
  zoneIndex,
  onClose,
  onSave,
}) => {
  const isViewMode = mode === 'view';

  const [geometryType, setGeometryType] = useState<string | undefined>(undefined);
  const [symbolId, setSymbolId] = useState<string | undefined>(undefined);
  const [symbols, setSymbols] = useState<any[]>(DEFAULT_GIS_SYMBOLS);
  const [coordinateList, setCoordinateList] = useState<DmsPoint[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  // Sync state from zone prop when opened
  useEffect(() => {
    if (!open || !zone) return;

    const currentGeom = zone.geometryType || undefined;
    setGeometryType(currentGeom);
    setSymbolId(zone.symbolId ? String(zone.symbolId) : undefined);
    setGpsError(null);
    setMapModalOpen(false);

    if (zone.coordinates) {
      const pts = parseWktToCoordinates(zone.coordinates);
      const dmsList = pts.map((p) => {
        const latDms = ddToDms(p.latitude);
        const lngDms = ddToDms(p.longitude);
        return {
          latD: latDms.d,
          latM: latDms.m,
          latS: latDms.s,
          lngD: lngDms.d,
          lngM: lngDms.m,
          lngS: lngDms.s,
        };
      });
      if (!isViewMode && currentGeom) {
        const count = GEOMETRY_POINT_COUNT[currentGeom] ?? 1;
        if (currentGeom === 'POINT' && dmsList.length > 1) {
          setCoordinateList([dmsList[0]]);
        } else if (dmsList.length < count) {
          const added = Array.from({ length: count - dmsList.length }, () => ({
            latD: null,
            latM: null,
            latS: null,
            lngD: null,
            lngM: null,
            lngS: null,
          }));
          setCoordinateList([...dmsList, ...added]);
        } else {
          setCoordinateList(dmsList);
        }
      } else {
        setCoordinateList(dmsList);
      }
    } else if (!isViewMode && currentGeom) {
      const count = GEOMETRY_POINT_COUNT[currentGeom] ?? 1;
      setCoordinateList(
        Array.from({ length: count }, () => ({
          latD: null,
          latM: null,
          latS: null,
          lngD: null,
          lngM: null,
          lngS: null,
        }))
      );
    } else {
      setCoordinateList([]);
    }
  }, [open, zone, isViewMode]);

  // Load symbols
  useEffect(() => {
    if (!open) return;
    symbolService.getOptions()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setSymbols(res);
        } else {
          symbolService.list({ pageSize: 1000 }).then((listRes) => {
            const items = listRes?.data || (Array.isArray(listRes) ? listRes : []);
            setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
          }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
        }
      })
      .catch(() => {
        symbolService.list({ pageSize: 1000 }).then((res) => {
          const items = res?.data || (Array.isArray(res) ? res : []);
          setSymbols(items.length > 0 ? items : DEFAULT_GIS_SYMBOLS);
        }).catch(() => setSymbols(DEFAULT_GIS_SYMBOLS));
      });
  }, [open]);

  const handleGeometryTypeChange = (val?: string) => {
    setGeometryType(val);
    setGpsError(null);
    if (!val) {
      setCoordinateList([]);
      setSymbolId(undefined);
      return;
    }
    const count = GEOMETRY_POINT_COUNT[val] ?? 1;
    setCoordinateList((prev) => {
      if (!prev || prev.length === 0) {
        return Array.from({ length: count }, () => ({
          latD: null,
          latM: null,
          latS: null,
          lngD: null,
          lngM: null,
          lngS: null,
        }));
      }
      if (val === 'POINT' && prev.length > 1) {
        return [prev[0]];
      }
      if (prev.length < count) {
        const added = Array.from({ length: count - prev.length }, () => ({
          latD: null,
          latM: null,
          latS: null,
          lngD: null,
          lngM: null,
          lngS: null,
        }));
        return [...prev, ...added];
      }
      return prev;
    });
  };

  const addGpsPoint = () => {
    setCoordinateList((prev) => [
      ...prev,
      { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null },
    ]);
    setGpsError(null);
  };

  const updateGpsPoint = (
    idx: number,
    type: 'lat' | 'lng',
    d: number | null,
    m: number | null,
    s: number | null,
  ) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      if (type === 'lat') {
        next[idx] = { ...next[idx], latD: d, latM: m, latS: s };
      } else {
        next[idx] = { ...next[idx], lngD: d, lngM: m, lngS: s };
      }
      return next;
    });
    setGpsError(null);
  };

  const clearGpsPoint = (idx: number) => {
    setCoordinateList((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      next[idx] = { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null };
      return next;
    });
    setGpsError(null);
  };

  const removeCoordinate = (idx: number) => {
    setCoordinateList((prev) => prev.filter((_, i) => i !== idx));
    setGpsError(null);
  };

  const handleSave = () => {
    if (coordinateList.length > 0) {
      const dmsCoordList = coordinateList.map((c) => ({
        latD: c.latD,
        latM: c.latM,
        latS: c.latS,
        lngD: c.lngD,
        lngM: c.lngM,
        lngS: c.lngS,
      }));

      const dmsVal = validateDmsCoordinates(dmsCoordList, geometryType);
      if (!dmsVal.valid) {
        setGpsError(dmsVal.errorMessage || dmsVal.error || 'Tọa độ không hợp lệ');
        return;
      }

      const ddPoints = coordinateList
        .filter(
          (c) =>
            (c.latD != null || c.latM != null || c.latS != null) &&
            (c.lngD != null || c.lngM != null || c.lngS != null),
        )
        .map((c) => ({
          latitude: dmsToDd(c.latD, c.latM, c.latS),
          longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
        }))
        .filter((c) => c.latitude != null && c.longitude != null) as {
        latitude: number;
        longitude: number;
      }[];

      let wkt = '';
      if (ddPoints.length > 0) {
        wkt = serializeCoordinatesToWkt(ddPoints, geometryType || 'POLYGON');
      }

      const selectedSym = symbols.find((s: any) => String(s.id) === String(symbolId));

      if (onSave && zoneIndex !== null) {
        onSave(
          {
            ...zone,
            geometryType: geometryType || 'POLYGON',
            coordinates: wkt,
            symbolId: symbolId || undefined,
            symbolName: selectedSym?.name || zone?.symbolName,
            symbolCode: selectedSym?.code || zone?.symbolCode,
            symbolImage: selectedSym?.image || zone?.symbolImage,
          },
          zoneIndex,
        );
      }
      toast.success('Cập nhật thông tin vị trí thành công');
      onClose();
    } else {
      const selectedSym = symbols.find((s: any) => String(s.id) === String(symbolId));
      if (onSave && zoneIndex !== null) {
        onSave(
          {
            ...zone,
            geometryType: geometryType || undefined,
            coordinates: undefined,
            symbolId: symbolId || undefined,
            symbolName: selectedSym?.name || zone?.symbolName,
            symbolCode: selectedSym?.code || zone?.symbolCode,
            symbolImage: selectedSym?.image || zone?.symbolImage,
          },
          zoneIndex,
        );
      }
      toast.success('Cập nhật thông tin vị trí thành công');
      onClose();
    }
  };

  const renderDmsGroup = (
    dVal: number | null | undefined,
    mVal: number | null | undefined,
    sVal: number | null | undefined,
    maxDeg: number,
    onChange: (d: number | null, m: number | null, s: number | null) => void,
  ) => {
    const started = dVal != null || mVal != null || sVal != null;
    const inputs = [
      {
        key: 'd',
        base: 'Độ',
        value: dVal,
        max: maxDeg,
        radius: '999px 0 0 999px',
        unit: '°',
        unitStyle: dmsUnitStyle,
        basis: '1 0 108px',
        width: 108,
        step: 1,
        formatter: undefined,
        msg: started && dVal == null ? 'Độ bắt buộc' : undefined,
        onEdit: (v: number | null) => onChange(v, mVal ?? null, sVal ?? null),
      },
      {
        key: 'm',
        base: 'Phút',
        value: mVal,
        max: 59,
        radius: '0',
        unit: "'",
        unitStyle: dmsUnitStyle,
        basis: '1 0 108px',
        width: 108,
        step: 1,
        formatter: undefined,
        msg: started && mVal == null ? 'Phút bắt buộc' : undefined,
        onEdit: (v: number | null) => onChange(dVal ?? null, v, sVal ?? null),
      },
      {
        key: 's',
        base: 'Giây',
        value: sVal,
        max: 59.99,
        radius: '0',
        unit: '"',
        unitStyle: dmsUnitEndStyle,
        basis: '1.2 0 130px',
        width: 130,
        step: 0.01,
        formatter: fmtInputNumber,
        msg: started && sVal == null ? 'Giây bắt buộc' : undefined,
        onEdit: (v: number | null) => onChange(dVal ?? null, mVal ?? null, v),
      },
    ] as const;

    const hasError = started && inputs.some((inp) => !!inp.msg);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 360,
            margin: '0 auto',
            minWidth: 0,
          }}
        >
          {inputs.map((inp) => (
            <div
              key={inp.key}
              style={{
                display: 'flex',
                flex: inp.basis,
                minWidth: 0,
                width: inp.width,
              }}
            >
              <InputNumber
                className="chk-dms-input-number"
                value={inp.value}
                min={0}
                max={inp.max}
                step={inp.step}
                placeholder={inp.base}
                formatter={inp.formatter}
                status={inp.msg ? 'error' : undefined}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(raw) => inp.onEdit(raw == null ? null : Number(raw))}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: inp.radius,
                  height: 32,
                  textAlign: 'center',
                }}
                controls={false}
              />
              <span style={inp.unitStyle}>{inp.unit}</span>
            </div>
          ))}
        </div>
        {hasError && (
          <div
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 360,
              margin: `${spaceXs}px auto 0 auto`,
              minWidth: 0,
              height: 14,
              lineHeight: '14px',
              overflow: 'hidden',
            }}
          >
            {inputs.map((inp) => (
              <div
                key={inp.key}
                style={{
                  flex: inp.basis,
                  minWidth: 0,
                  width: inp.width,
                  textAlign: 'center',
                }}
              >
                {inp.msg && (
                  <span
                    role="alert"
                    style={{
                      color: statusCritical,
                      fontSize: fontSizeSm,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inp.msg}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const selectedSymbolItem = symbols.find(
    (s: any) =>
      String(s.id) === String(symbolId) ||
      s.code === symbolId ||
      String(s.id) === String(zone?.symbolId) ||
      s.code === zone?.symbolId,
  );

  const viewPoints = zone?.coordinates ? parseWktToCoordinates(zone.coordinates) : [];

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      zIndex={1010}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isViewMode ? (
            <EyeOutlined style={{ color: actionPrimary }} />
          ) : (
            <EditOutlined style={{ color: actionPrimary }} />
          )}
          <span style={{ fontWeight: fontWeightBold, color: sidebarBg, fontSize: 16 }}>
            {isViewMode
              ? `Chi tiết thông tin vị trí - ${zone?.name || zone?.code || 'Vùng VTS'}`
              : `Chỉnh sửa thông tin vị trí - ${zone?.name || zone?.code || 'Vùng VTS'}`}
          </span>
        </div>
      }
      width="min(920px, 96vw)"
      styles={{
        body: { padding: '12px 24px 12px 24px', overflow: 'hidden' },
        footer: { padding: '10px 24px' },
      }}
      footer={
        isViewMode ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              onClick={onClose}
              style={{ ...primaryButtonStyle, height: 38, minWidth: 90 }}
            >
              Đóng
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              onClick={onClose}
              style={{ ...outlineButtonStyle, height: 38, minWidth: 80 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              style={{ ...primaryButtonStyle, height: 38, minWidth: 100 }}
            >
              Lưu thông tin
            </Button>
          </div>
        )
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* ── Section 1: Thông số đối tượng bản đồ ── */}
        <div style={{ ...sectionBoxStyle, flexShrink: 0, marginBottom: 12 }}>
          <div style={sectionHeaderStyle}>
            <div style={sectionTitleStyle}>
              <EnvironmentOutlined style={{ color: actionPrimary }} />
              <span>Thông số đối tượng bản đồ</span>
            </div>
          </div>

          {isViewMode ? (
            <div className="chk-detail-grid">
              <div className="chk-detail-row">
                <span className="chk-detail-label sec-col1-label">Loại đối tượng</span>
                <span className="chk-detail-value">
                  {GEOMETRY_TYPE_OPTIONS.find((o) => o.value === zone?.geometryType)?.label ||
                    zone?.geometryType ||
                    '—'}
                </span>
              </div>
              <div className="chk-detail-row">
                <span className="chk-detail-label sec-col2-label">Biểu tượng</span>
                <span className="chk-detail-value">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    {selectedSymbolItem?.image ? (
                      <img
                        src={
                          selectedSymbolItem.image.startsWith('data:')
                            ? selectedSymbolItem.image
                            : `data:image/png;base64,${selectedSymbolItem.image}`
                        }
                        alt=""
                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                      />
                    ) : null}
                    {selectedSymbolItem?.name || zone?.symbolName || '—'}
                  </span>
                </span>
              </div>

              <div className="chk-detail-row">
                <span className="chk-detail-label sec-col1-label">Hệ quy chiếu</span>
                <span className="chk-detail-value">WGS-84</span>
              </div>
              <div className="chk-detail-row">
                <span className="chk-detail-label sec-col2-label">Quy tắc hiển thị</span>
                <span className="chk-detail-value">Độ, phút, giây (DMS)</span>
              </div>
            </div>
          ) : (
            <>
              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: sidebarBg, marginBottom: 6 }}>
                      Loại đối tượng {coordinateList.length > 0 && <span style={{ color: '#ef4444' }}>*</span>}
                    </div>
                    <Select
                      placeholder="Chọn loại đối tượng"
                      allowClear
                      value={geometryType}
                      onChange={handleGeometryTypeChange}
                      options={GEOMETRY_TYPE_OPTIONS}
                      style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: sidebarBg, marginBottom: 6 }}>
                      Biểu tượng {Boolean(geometryType || coordinateList.length > 0) && <span style={{ color: '#ef4444' }}>*</span>}
                    </div>
                    <Select
                      placeholder="Chọn biểu tượng bản đồ"
                      allowClear
                      showSearch
                      disabled={!geometryType}
                      value={symbolId}
                      onChange={(val) => setSymbolId(val)}
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        normalizeSearchText(String(option?.label || '')).includes(normalizeSearchText(input))
                      }
                      style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                      options={symbols.map((sym: any) => ({
                        value: String(sym.id),
                        label: sym.code ? `${sym.name} (${sym.code})` : sym.name,
                        image: sym.image,
                      }))}
                      optionRender={(option) => (
                        <Space>
                          {option.data.image && (
                            <img
                              src={
                                option.data.image.startsWith('data:')
                                  ? option.data.image
                                  : `data:image/png;base64,${option.data.image}`
                              }
                              alt=""
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
                          )}
                          <span>{option.data.label}</span>
                        </Space>
                      )}
                      labelRender={(props) => {
                        const sym = symbols.find((s: any) => String(s.id) === String(props.value));
                        return (
                          <Space style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {sym?.image && (
                              <img
                                src={
                                  sym.image.startsWith('data:')
                                    ? sym.image
                                    : `data:image/png;base64,${sym.image}`
                                }
                                alt=""
                                style={{ width: 18, height: 18, objectFit: 'contain' }}
                              />
                            )}
                            <span>{sym ? (sym.code ? `${sym.name} (${sym.code})` : sym.name) : props.label}</span>
                          </Space>
                        );
                      }}
                    />
                  </div>
                </Col>
              </Row>

              <Row gutter={[24, 0]}>
                <Col span={12}>
                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: sidebarBg, marginBottom: 6 }}>
                      Hệ quy chiếu
                    </div>
                    <Select
                      value={1}
                      disabled
                      options={COORD_SYS_OPTIONS}
                      style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: spaceFormField }}>
                    <div style={{ fontSize: fontSizeMd, fontWeight: fontWeightMedium, color: sidebarBg, marginBottom: 6 }}>
                      Quy tắc hiển thị
                    </div>
                    <Input
                      value="Độ, phút, giây (DMS)"
                      disabled
                      style={{ ...readonlyInputStyle, borderRadius: radiusPill, height: 40 }}
                    />
                  </div>
                </Col>
              </Row>
            </>
          )}
        </div>

        {/* ── Section 2: Tọa độ GPS ── */}
        <div
          style={{
            ...sectionBoxStyle,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            marginBottom: 0,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: 32,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: sidebarBg,
                fontWeight: fontWeightBold,
                fontSize: fontSizeMd,
                lineHeight: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                height: 32,
              }}
            >
              Tọa độ GPS ({isViewMode ? viewPoints.length : coordinateList.length})
            </span>

            {isViewMode ? (
              <Button
                icon={<EnvironmentOutlined style={{ color: actionPrimary }} />}
                onClick={() => setMapModalOpen(true)}
                style={{
                  ...outlineButtonStyle,
                  height: 32,
                  fontSize: fontSizeSm,
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Xem vị trí trên bản đồ
              </Button>
            ) : (
              <Space size={8}>
                <Button
                  icon={
                    <EnvironmentOutlined
                      style={{
                        color: !geometryType ? 'rgba(0, 0, 0, 0.25)' : actionPrimary,
                      }}
                    />
                  }
                  onClick={() => setMapModalOpen(true)}
                  disabled={!geometryType}
                  style={
                    !geometryType
                      ? {
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#f5f5f5',
                          borderColor: '#d9d9d9',
                          color: 'rgba(0, 0, 0, 0.25)',
                          cursor: 'not-allowed',
                          boxShadow: 'none',
                        }
                      : {
                          ...outlineButtonStyle,
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
                  title={
                    !geometryType
                      ? 'Vui lòng chọn loại đối tượng trước khi chọn tọa độ trên bản đồ'
                      : undefined
                  }
                >
                  Chọn tọa độ trên bản đồ
                </Button>
                <Button
                  type="primary"
                  icon={
                    <PlusOutlined
                      style={{
                        color:
                          !geometryType || (geometryType === 'POINT' && coordinateList.length >= 1)
                            ? 'rgba(0, 0, 0, 0.25)'
                            : undefined,
                      }}
                    />
                  }
                  onClick={addGpsPoint}
                  disabled={!geometryType || (geometryType === 'POINT' && coordinateList.length >= 1)}
                  style={
                    !geometryType || (geometryType === 'POINT' && coordinateList.length >= 1)
                      ? {
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          borderRadius: radiusPill,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#f5f5f5',
                          borderColor: '#d9d9d9',
                          color: 'rgba(0, 0, 0, 0.25)',
                          cursor: 'not-allowed',
                          boxShadow: 'none',
                        }
                      : {
                          ...primaryButtonStyle,
                          height: 32,
                          fontSize: fontSizeSm,
                          padding: '0 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }
                  }
                  title={
                    !geometryType
                      ? 'Vui lòng chọn loại đối tượng trước khi thêm tọa độ'
                      : geometryType === 'POINT' && coordinateList.length >= 1
                      ? 'Đối tượng điểm chỉ có tối đa 1 tọa độ GPS'
                      : undefined
                  }
                >
                  Thêm tọa độ
                </Button>
              </Space>
            )}
          </div>

          {gpsError && (
            <div style={{ marginBottom: spaceSm, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ color: statusCritical, fontSize: fontSizeMd, flex: 1 }}>
                ⚠ {gpsError}
              </span>
            </div>
          )}

          {isViewMode ? (
            <DetailTable
              scrollY="calc(100vh - 430px)"
              emptyHeightAuto={true}
              dataSource={viewPoints.map((p, i) => ({ ...p, _idx: i }))}
              emptyText="Chưa có tọa độ GPS nào"
              rowKey="_idx"
              columns={[
                { title: 'STT', width: 60, align: 'center' as const, render: (_v, _r, idx) => idx + 1 },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  render: (_v: any, rec: any) => {
                    const dms = ddToDms(rec.latitude);
                    return `${dms.d}° ${dms.m}' ${dms.s}" N`;
                  },
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  render: (_v: any, rec: any) => {
                    const dms = ddToDms(rec.longitude);
                    return `${dms.d}° ${dms.m}' ${dms.s}" E`;
                  },
                },
              ]}
            />
          ) : (
            <DetailTable
              size="small"
              scrollY="calc(100vh - 520px)"
              emptyHeightAuto={true}
              dataSource={coordinateList.map((c, i) => ({ ...c, _idx: i }))}
              rowKey={(r: any, idx?: number) => r._idx ?? String(idx)}
              emptyText="Chưa có tọa độ GPS nào"
              columns={[
                {
                  title: 'STT',
                  width: 60,
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, _r: any, idx: number) => idx + 1,
                },
                {
                  title: 'Vĩ độ (Latitude - N)',
                  key: 'lat',
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) =>
                    renderDmsGroup(
                      record.latD,
                      record.latM,
                      record.latS,
                      90,
                      (d, m, s) => updateGpsPoint(record._idx, 'lat', d, m, s),
                    ),
                },
                {
                  title: 'Kinh độ (Longitude - E)',
                  key: 'lng',
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) =>
                    renderDmsGroup(
                      record.lngD,
                      record.lngM,
                      record.lngS,
                      180,
                      (d, m, s) => updateGpsPoint(record._idx, 'lng', d, m, s),
                    ),
                },
                {
                  title: '',
                  width: 50,
                  align: 'center' as const,
                  onCell: () => ({ style: { verticalAlign: 'middle' } }),
                  render: (_v: any, record: any) => {
                    const isPoint = geometryType === 'POINT';
                    const minPoints = isPoint ? 1 : geometryType === 'LINE' ? 2 : 3;
                    const canDelete = coordinateList.length > minPoints;

                    if (isPoint) {
                      const hasValue =
                        record.latD != null ||
                        record.latM != null ||
                        record.latS != null ||
                        record.lngD != null ||
                        record.lngM != null ||
                        record.lngS != null;
                      return (
                        <Button
                          type="text"
                          disabled={!hasValue}
                          icon={<DeleteOutlined style={{ fontSize: 16, color: hasValue ? statusCritical : undefined }} />}
                          onClick={() => clearGpsPoint(record._idx)}
                          style={{
                            width: 32,
                            height: 32,
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title={hasValue ? 'Xóa trắng giá trị tọa độ' : 'Chưa có dữ liệu'}
                        />
                      );
                    }

                    return (
                      <Button
                        type="text"
                        danger={canDelete}
                        disabled={!canDelete}
                        icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                        onClick={() => canDelete && removeCoordinate(record._idx)}
                        style={{
                          width: 32,
                          height: 32,
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={
                          !canDelete
                            ? geometryType === 'LINE'
                              ? 'Đối tượng đường phải có tối thiểu 2 tọa độ'
                              : 'Đối tượng vùng phải có tối thiểu 3 tọa độ'
                            : 'Xóa tọa độ'
                        }
                      />
                    );
                  },
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Map Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: actionPrimary }} />
            <span>
              {isViewMode ? 'Xem vị trí trên bản đồ chuyên dụng' : 'Chọn vị trí & tọa độ trên bản đồ chuyên dụng'}
            </span>
          </div>
        }
        open={mapModalOpen}
        onCancel={() => setMapModalOpen(false)}
        destroyOnClose
        zIndex={1020}
        width="94vw"
        style={{ top: 20, maxWidth: '1400px' }}
        footer={
          isViewMode
            ? [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setMapModalOpen(false)}
                  style={{ ...primaryButtonStyle, height: 36 }}
                >
                  Đóng
                </Button>,
              ]
            : [
                <Button
                  key="cancel"
                  onClick={() => setMapModalOpen(false)}
                  style={{ ...outlineButtonStyle, height: 36, borderRadius: radiusPill }}
                >
                  Hủy
                </Button>,
                <Button
                  key="ok"
                  type="primary"
                  onClick={() => {
                    setMapModalOpen(false);
                    toast.success('Đã xác nhận vị trí từ bản đồ');
                  }}
                  style={{ ...primaryButtonStyle, height: 36, borderRadius: radiusPill }}
                >
                  Xác nhận tọa độ
                </Button>,
              ]
        }
      >
        <div style={{ padding: '8px 0' }}>
          <GisLocationSelector
            inline={true}
            height={520}
            disabled={isViewMode}
            defaultGeometryType={(geometryType as any) || (zone?.geometryType as any) || 'POINT'}
            value={(() => {
              if (isViewMode) {
                if (viewPoints.length > 0) {
                  const rawWkt = (zone?.coordinates || '').replace(/^SRID=\d+\s*;/i, '').trim();
                  let geom: 'POINT' | 'LINE' | 'POLYGON' = (zone?.geometryType as any) || 'POINT';
                  let wkt = rawWkt;
                  if (!wkt) {
                    if (geom === 'LINE') {
                      wkt = `LINESTRING (${viewPoints.map(p => `${p.longitude} ${p.latitude}`).join(', ')})`;
                    } else if (geom === 'POLYGON') {
                      const pts = [...viewPoints];
                      if (pts.length >= 3 && (pts[0].longitude !== pts[pts.length - 1].longitude || pts[0].latitude !== pts[pts.length - 1].latitude)) {
                        pts.push(pts[0]);
                      }
                      wkt = `POLYGON ((${pts.map(p => `${p.longitude} ${p.latitude}`).join(', ')}))`;
                    } else if (viewPoints.length > 1) {
                      wkt = `MULTIPOINT (${viewPoints.map(p => `(${p.longitude} ${p.latitude})`).join(',')})`;
                    } else {
                      wkt = `POINT (${viewPoints[0].longitude} ${viewPoints[0].latitude})`;
                    }
                  }
                  return {
                    geometryType: geom,
                    coordinates: wkt,
                    symbolId: symbolId,
                  };
                }
                return undefined;
              }
              const validPts = coordinateList
                .filter(
                  (c) =>
                    (c.latD != null || c.latM != null || c.latS != null) &&
                    (c.lngD != null || c.lngM != null || c.lngS != null),
                )
                .map((c) => ({
                  latitude: dmsToDd(c.latD, c.latM, c.latS),
                  longitude: dmsToDd(c.lngD, c.lngM, c.lngS),
                }))
                .filter((c) => c.latitude != null && c.longitude != null) as {
                latitude: number;
                longitude: number;
              }[];
              return {
                geometryType: (geometryType as any) || 'POINT',
                coordinates: serializeCoordinatesToWkt(validPts, geometryType || 'POINT'),
                symbolId: symbolId,
              };
            })()}
            onChange={(val) => {
              if (isViewMode) return;
              if (val?.coordinates) {
                const points = parseWktToCoordinates(val.coordinates);
                if (points.length > 0) {
                  const geom = (
                    (val?.geometryType || geometryType || 'POLYGON') as string
                  ).toUpperCase();
                  const newPoints = points.map((p) => {
                    const latDms = ddToDms(p.latitude);
                    const lngDms = ddToDms(p.longitude);
                    return {
                      latD: latDms.d,
                      latM: latDms.m,
                      latS: latDms.s,
                      lngD: lngDms.d,
                      lngM: lngDms.m,
                      lngS: lngDms.s,
                    };
                  });

                  if (geom === 'POINT') {
                    setCoordinateList([newPoints[0]]);
                  } else {
                    setCoordinateList(newPoints);
                  }
                  setGpsError(null);
                }
              }
              if (val?.geometryType && val.geometryType !== geometryType) {
                setGeometryType(val.geometryType);
              }
              if (val?.symbolId) {
                setSymbolId(val.symbolId);
              }
            }}
          />
        </div>
      </Modal>
    </AppDrawer>
  );
};

export default VtsZoneLocationDrawer;
