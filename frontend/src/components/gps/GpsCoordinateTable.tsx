import React from "react";
import { InputNumber, Space, Table, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import {
  colors,
  fontSizeSm,
  fontSizeMd,
  fontWeightBold,
  textTertiary,
  borderDefault,
  surfaceCard,
  radiusMd,
  radiusPill,
} from "../../tokens";

export interface GpsPoint {
  lat: number;
  lng: number;
}

interface GpsCoordinateTableProps {
  points: GpsPoint[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: "lat" | "lng",
    d: number | null,
    m: number | null,
    s: number | null,
  ) => void;
  error?: string | null;
  disabled?: boolean;
  hasPoints: boolean;
  label?: string;
  required?: boolean;
  /** Show "Thêm tọa độ" button only when there are existing points */
  showAddWhenHasPoints?: boolean;
}

const fmtInputNumber = (value: number | null | undefined): string =>
  value == null ? "" : String(value);

const ddToDms = (dd: number): { d: number | null; m: number | null; s: number | null } => {
  if (dd == null || isNaN(dd)) return { d: null, m: null, s: null };
  let abs = Math.abs(dd);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  if (mFloat > 59.999999999) { d += 1; mFloat = 0; }
  let m = Math.floor(mFloat);
  let sFloat = (mFloat - m) * 60;
  if (sFloat > 59.999999999) { m += 1; sFloat = 0; if (m >= 60) { m = 0; d += 1; } }
  let s = Math.round(sFloat * 100) / 100;
  if (s >= 60) { s = 0; m += 1; if (m >= 60) { m = 0; d += 1; } }
  return { d: d === 0 ? null : d, m: m === 0 ? null : m, s: s === 0 ? null : s };
};

const GpsCoordinateTable: React.FC<GpsCoordinateTableProps> = ({
  points,
  onAdd,
  onRemove,
  onUpdate,
  error,
  disabled,
  hasPoints,
  label = "Tọa độ GPS",
  required,
  showAddWhenHasPoints = true,
}) => {
  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          <span
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeMd,
            }}
          >
            {label}
            {required && !disabled && (
              <span style={{ color: colors.error, marginLeft: 4, fontSize: fontSizeMd }}>
                *
              </span>
            )}
          </span>
        </span>
        {hasPoints && showAddWhenHasPoints && (
          <Button
            type="dashed"
            size="small"
            icon={<span>+</span>}
            onClick={onAdd}
            disabled={disabled}
            style={{ borderRadius: radiusPill }}
          >
            Thêm tọa độ
          </Button>
        )}
      </div>
      {points.length === 0 ? (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            border: `1px dashed ${borderDefault}`,
            borderRadius: radiusMd,
            background: surfaceCard,
          }}
        >
          <span style={{ fontSize: fontSizeMd, color: textTertiary, display: "block", marginBottom: 12 }}>
            Chưa có tọa độ nào.
          </span>
          <Button
            type="dashed"
            icon={<span>+</span>}
            onClick={onAdd}
            disabled={disabled}
            style={{ borderRadius: radiusPill }}
          >
            Thêm tọa độ
          </Button>
        </div>
      ) : (
        <Table
          dataSource={points.map((p, i) => ({ ...p, _idx: i }))}
          pagination={false}
          scroll={{ x: 820 }}
          size="small"
          rowKey="_idx"
          columns={[
            {
              title: "Vĩ độ (N)",
              key: "lat",
              render: (_: any, record: GpsPoint & { _idx: number }) => {
                const dms = ddToDms(record.lat);
                return (
                  <Space.Compact size="small" style={{ width: "100%", display: "flex" }}>
                    <InputNumber
                      value={dms.d}
                      min={0}
                      max={90}
                      placeholder="Độ"
                      disabled={disabled}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lat", v ?? null, dms.m, dms.s)}
                      style={{ flex: 1 }}
                      controls={false}
                      formatter={fmtInputNumber}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        borderRight: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      °
                    </span>
                    <InputNumber
                      value={dms.m}
                      min={0}
                      max={59}
                      placeholder="Phút"
                      disabled={disabled}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lat", dms.d, v ?? null, dms.s)}
                      style={{ flex: 1 }}
                      controls={false}
                      formatter={fmtInputNumber}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        borderRight: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      '
                    </span>
                    <InputNumber
                      value={dms.s}
                      min={0}
                      max={59.99}
                      step={0.01}
                      placeholder="Giây"
                      disabled={disabled}
                      formatter={fmtInputNumber}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lat", dms.d, dms.m, v ?? null)}
                      style={{ flex: 1.2 }}
                      controls={false}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      "
                    </span>
                  </Space.Compact>
                );
              },
              onHeaderCell: () => ({
                style: {
                  background: colors.bodyBg,
                  color: colors.sidebarBg,
                  fontWeight: fontWeightBold,
                  fontSize: fontSizeMd,
                  textTransform: "uppercase" as const,
                  padding: "12px 12px",
                },
              }),
            },
            {
              title: "Kinh độ (E)",
              key: "lng",
              render: (_: any, record: GpsPoint & { _idx: number }) => {
                const dms = ddToDms(record.lng);
                return (
                  <Space.Compact size="small" style={{ width: "100%", display: "flex" }}>
                    <InputNumber
                      value={dms.d}
                      min={0}
                      max={180}
                      placeholder="Độ"
                      disabled={disabled}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lng", v ?? null, dms.m, dms.s)}
                      style={{ flex: 1 }}
                      controls={false}
                      formatter={fmtInputNumber}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        borderRight: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      °
                    </span>
                    <InputNumber
                      value={dms.m}
                      min={0}
                      max={59}
                      placeholder="Phút"
                      disabled={disabled}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lng", dms.d, v ?? null, dms.s)}
                      style={{ flex: 1 }}
                      controls={false}
                      formatter={fmtInputNumber}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        borderRight: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      '
                    </span>
                    <InputNumber
                      value={dms.s}
                      min={0}
                      max={59.99}
                      step={0.01}
                      placeholder="Giây"
                      disabled={disabled}
                      formatter={fmtInputNumber}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(v) => onUpdate(record._idx, "lng", dms.d, dms.m, v ?? null)}
                      style={{ flex: 1.2 }}
                      controls={false}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 6px",
                        background: "#f5f5f5",
                        border: `1px solid ${borderDefault}`,
                        borderLeft: 0,
                        fontSize: fontSizeSm,
                        color: textTertiary,
                      }}
                    >
                      "
                    </span>
                  </Space.Compact>
                );
              },
              onHeaderCell: () => ({
                style: {
                  background: colors.bodyBg,
                  color: colors.sidebarBg,
                  fontWeight: fontWeightBold,
                  fontSize: fontSizeMd,
                  textTransform: "uppercase" as const,
                  padding: "12px 12px",
                },
              }),
            },
            {
              title: "",
              key: "actions",
              width: 44,
              align: "center",
              render: (_: any, record: { _idx: number }) => (
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  disabled={disabled}
                  onClick={() => onRemove(record._idx)}
                />
              ),
              onHeaderCell: () => ({
                style: { background: colors.bodyBg, padding: "12px 6px" },
              }),
            },
          ]}
          locale={{ emptyText: "Chưa có tọa độ" }}
        />
      )}
      {error && (
        <div
          style={{
            marginTop: 8,
            color: colors.error,
            fontSize: fontSizeSm,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default GpsCoordinateTable;
