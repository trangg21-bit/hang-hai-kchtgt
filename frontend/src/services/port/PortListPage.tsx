import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { PERMISSIONS } from '../../constants/permissions';
import {
  Button,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Space,
  DatePicker,
  Descriptions,
} from 'antd';
import { OrgUnitTreeSelect, resolveOrgLevel2Name } from '../../components/org-unit';
import {
  PlusOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { formatHistoryNumber, normalizeSafeNumber } from '../../utils/numFmt';
import { renderWharfAreaHistory } from '../../utils/changeHistoryRenderer';
import { berthCRUD, waterZoneCRUD, pierCRUD } from '../../services/portService';
import BerthDetailContent from '../../pages/port/BerthDetailContent';
import PierDetailContent from '../../pages/port/PierDetailContent';
import { userService } from '../../services/userService';
import { waterZoneApi } from '../../app/waterzone/api';
import { lineObjectService } from '../../services/lineObjectService';
import { LineObject } from '../../types/lineObject';
import {
  fetchCangBienList,
  deleteCangBien,
  approveCangBienC1,
  approveCangBienC2,

  rejectCangBien,
  fetchCangBienById,
  fetchportHistory,
} from './api';
import { portApproval } from '../portService';
import { trangThaiHoatDongBadge, trangThaiPheDuyetBadge } from './schema';
import type { CangBienResponse, PortWharfAreaItem } from './types';
import toast from '../../components/ToastNotification';
import { organizationService } from '../../services/organizationService';
import { documentApi } from '../../app/document/api';
import DocumentUploadModal from '../../app/document/DocumentUploadModal';
import api from '../../services/api';

// ── Helper file đính kèm Cảng biển (store attachment thật — giống Bến cảng) ──
// Cảng biển hiện đã có /v1/ports/{id}/attachments (AttachmentDto: id/fileName/fileSize/
// uploadedBy/uploadedAt, file thật trên đĩa) + try/catch chống lỗi. Không dùng kênh
// Document (/v1/documents/entity/port) nữa vì dòng đó lưu dạng storageKey/createdAt
// (stub) làm "Ngày tải lên" trống và thao tác tải/xem không hoạt động.
async function fetchPortAttachmentList(portId: string): Promise<any[]> {
  try {
    const res = await api.get(`/v1/ports/${portId}/attachments`);
    return res?.data?.data ?? [];
  } catch {
    return [];
  }
}

async function uploadPortAttachments(portId: string, files: any[], skipHistory = false): Promise<number> {
  const newFiles = (files || []).filter((f: any) => f && f.originFileObj);
  if (newFiles.length === 0) return 0;
  const formData = new FormData();
  newFiles.forEach((fi: any) => {
    formData.append('files', fi.originFileObj as File);
  });
  const url = `/v1/ports/${portId}/attachments${skipHistory ? '?skipHistory=true' : ''}`;
  await api.post(url, formData, { headers: { 'Content-Type': undefined } });
  return newFiles.length;
}
import dayjs from 'dayjs';
import { symbolService } from '../symbolService';
import { VIETNAM_PROVINCES } from '../../types/common';
import { ScreenHeader, DataTable, type ScreenHeaderAction } from '../../components/list-view';
import Pagination from '../../components/list-view/Pagination';
import FilterTableLayout from '../../components/list-view/FilterTableLayout';
import {
  statusDraft,
  statusOperational,
  statusCritical,
  statusAttention,
  actionPrimary,
  textPrimary,
  textSecondary,
  textTertiary,
  borderDefault,
  spaceMd,
  spaceSm,
  fontSizeLg,
  fontSizeSm,
  fontWeightBold,
  fontWeightMedium,
  spaceFormField,
  radiusPill,
  spaceXs,
  spaceXl,
  drawerTitleStyle,
  drawerFooterStyle,
  primaryButtonStyle,
  outlineButtonStyle,
  requiredMarkStyle,
  cellTitleStyle,
  icons,
  formatUserDisplayName,
} from '../../themetokenchk';
import { usePermissionStore } from '../../store/permissionStore';
import { colors } from '../../themetokenchk';
import * as themeTokenChk from '../../themetokenchk';
// Bảng/Button/nút toàn màn Cảng biển đồng bộ font 13.5px như Bến cảng (mặc định themeTokenChk = 13).

// ── Cỡ chữ 13.5px đồng bộ dòng với màn Bến cảng (BerthListPage const fontSizeMd = 13.5) ──
// Không dùng fontSizeMd=13 import từ themetokenchk để mọi cell trong list cao ngang nhau.
const fontSizeMd = 13.5;
import { ThemeTokenProvider } from '../../context/ThemeTokenContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  historyGroupGridStyle,
  historyTimeStyle,
  historyMetaRowStyle,
  historyInfoCardStyle,
  historyAccentBarStyle,
  historyFieldLabelStyle,
  historyOldValueStyle,
  historyNewValueStyle,
  historyArrowStyle,
  historyInfoTitleStyle,
  historyChangeRowStyle,
  historyCreateRowStyle,
} from '../../themetokenchk';
import ApprovalModal from '../../components/shared/ApprovalModal';
import DeleteConfirmModal from '../../components/shared/DeleteConfirmModal';
import { canEditApprovalRecord } from '../../utils/approvalEditPolicy';
import ApprovalStatusBadge from '../../components/shared/ApprovalStatusBadge';
import { AppDrawer } from '../../components/shared/AppDrawer';
import PortForm from './PortForm';
import PortDetailContent from './PortDetailContent';

// ── Render lịch sử thay đổi (giống màn Bến cảng) ─────────────────────
// Nhóm các thay đổi theo cùng thời điểm (đến giây) + người thao tác thành 1 card,
// cột trái: mốc thời gian + pill hành động; cột phải: info-card có vạch accent,
// tiêu đề 'Thông tin thêm mới'/'Thông tin thay đổi', từng dòng field cũ → mới.
function fmtPortHistoryThousands(s: string): string {
  return formatHistoryNumber(s);
}

const isBlankOrDash = (v: unknown): boolean => {
  if (v === null || v === undefined) return true;
  const s = String(v).trim();
  return (
    s === '' ||
    s === '—' ||
    s === '-' ||
    s === '–' ||
    s === '(null)' ||
    s === 'null' ||
    s === 'undefined' ||
    s.toLowerCase() === 'chưa có'
  );
};

function renderPortHistCards(records: any[], orgMap: Map<string, string>, symbolMap: Map<string, string>, symbolImageMap: Map<string, string>) {
  const norm = (v: string | null | undefined): string | null => {
    if (isBlankOrDash(v)) return null;
    return String(v).trim();
  };
  const unitName = (r: any): string => {
    const display = orgMap.get(String(r?.orgUnitId ?? ''));
    if (display) {
      const i = display.indexOf(' - ');
      return i >= 0 ? display.slice(i + 3) : display;
    }
    const fallback = r?.orgUnitName || r?.unitName;
    return isBlankOrDash(fallback) ? '' : String(fallback);
  };
  const fieldLabel = (fn: string): string => PORT_HISTORY_FIELD_LABELS[fn] || fn;

  const GROUP_ORDER = [
    'portCode', 'orgUnitId', 'portName', 'province', 'provinceId',
    'area', 'maxVesselCapacity', 'portGroup', 'portClass', 'detailedLocation',
    'waterAreaScope',
    'totalBerths', 'totalAnchoragesTransshipment', 'totalPublicChannels',
    'totalDedicatedChannels', 'totalPublicChannelLength', 'totalDedicatedChannelLength',
    'totalBuoysBeacons', 'totalDikes', 'totalDikeLength', 'totalLighthouses',
    'buoyBerthCount', 'anchorageCount', 'transshipmentCount', 'otherWaterAreas',
    'remarks',
    'geometryType', 'Loại đối tượng', 'Loại đối tượng GIS',
    'mapSymbolId', 'coordinateSystem', 'displayRule',
    'coordinates', 'Tọa độ GIS', 'Tọa độ GPS',
    'attachments', 'Tài liệu đính kèm', 'File đính kèm',
    'wharfAreas', 'Khu bến', 'Danh sách khu bến',
    'infrastructureList', 'Công trình KCHT trực thuộc', 'Danh sách hạ tầng',
  ];

  const IGNORED_FIELDS = new Set([
    'spatialId', 'infrastructureList_raw',
    'approvalStatus', 'approverLevel1', 'approvedDateLevel1',
    'approverLevel2', 'approvedDateLevel2', 'rejectionReason', 'Lý do từ chối',
    'Trạng thái phê duyệt',
  ]);

  const sorted = [...(records || [])].sort((a, b) => {
    const at = a.changedAt || a.createdAt || a.approvedDate || '';
    const bt = b.changedAt || b.createdAt || b.approvedDate || '';
    return String(bt) < String(at) ? -1 : String(bt) > String(at) ? 1 : 0;
  });

  const groups: { tsMs: number; ts: string; actor: string; items: any[] }[] = [];
  for (const r of sorted) {
    const ts = r.changedAt || r.createdAt || r.approvedDate || '';
    const timeMs = ts ? new Date(ts).getTime() || 0 : 0;
    const actor = String(r.changedBy ?? r.createdBy ?? r.approvedBy ?? r.actorName ?? '');
    const g = groups[groups.length - 1];
    if (g && g.actor === actor && Math.abs(g.tsMs - timeMs) <= 10000) {
      g.items.push(r);
    } else {
      groups.push({ tsMs: timeMs, ts, actor, items: [r] });
    }
  }

  const cards = groups.map((g, gi) => {
    // 1. Tách các trường thông thường và tệp đính kèm trong cùng nhóm 60s
    const attachmentItems: any[] = [];
    const nonAttachmentItems: any[] = [];

    for (const it of g.items) {
      const rawFn = (it.changedField ?? it.fieldName ?? '').trim();
      if (IGNORED_FIELDS.has(rawFn)) continue;

      if (rawFn === 'attachments' || rawFn === 'Tài liệu đính kèm' || rawFn === 'File đính kèm') {
        attachmentItems.push(it);
      } else {
        nonAttachmentItems.push(it);
      }
    }

    // 2. Gom nhóm các trường thông thường (giữ oldValue sớm nhất và newValue mới nhất)
    const fieldMap = new Map<string, { rowId: string; field: string; oldValue: string | null; newValue: string | null }>();
    for (const it of nonAttachmentItems) {
      let fn = (it.changedField ?? it.fieldName ?? '').trim();
      if (fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') {
        fn = 'Công trình KCHT trực thuộc';
      } else if (fn === 'wharfAreas' || fn === 'Danh sách khu bến') {
        fn = 'Khu bến';
      } else if (fn === 'Tọa độ GIS' || fn === 'coordinates') {
        fn = 'coordinates';
      } else if (fn === 'Loại đối tượng GIS') {
        fn = 'geometryType';
      }

      const oldV = norm(it.oldValue ?? it.previousValue);
      const newV = norm(it.newValue ?? it.value);

      if (!fieldMap.has(fn)) {
        fieldMap.set(fn, {
          rowId: String(it.id ?? `${g.tsMs}-${fn}`),
          field: fn,
          oldValue: oldV,
          newValue: newV,
        });
      } else {
        const existing = fieldMap.get(fn)!;
        // g.items duyệt từ MỚI NHẤT -> CŨ NHẤT:
        // Item đầu tiên duyệt qua đã có newValue mới nhất.
        // Item cũ hơn có oldV là trạng thái trước đó -> cập nhật oldValue về mốc ban đầu.
        if (oldV !== null && oldV !== undefined) {
          existing.oldValue = oldV;
        }
      }
    }

    // 3. Xử lý tệp đính kèm dạng snapshot bảng:
    // - File đã xóa bằng action KHÔNG BAO GIỜ được xuất hiện ở newValue!
    // - File vừa tải lên KHÔNG BAO GIỜ xuất hiện ở oldValue!
    // - Các file giữ nguyên không xóa sẽ xuất hiện ở cả oldValue và newValue.
    if (attachmentItems.length > 0) {
      const deletedFileNames = new Set<string>();
      const addedFileNames = new Set<string>();

      for (const it of attachmentItems) {
        const reason = String(it.reason || '');
        const mDel = reason.match(/xóa.*đính kèm:\s*(.*)/i);
        if (mDel && mDel[1]?.trim()) {
          mDel[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
        }
        const mUp = reason.match(/tải lên.*đính kèm:\s*(.*)/i);
        if (mUp && mUp[1]?.trim()) {
          mUp[1].split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
        }
        const st = it.status;
        if (st === 8 || st === 'ATTACHMENT_DELETED') {
          const raw = it.previousValue ?? it.oldValue;
          if (raw && isBlankOrDash(it.newValue ?? it.value)) {
            String(raw).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => deletedFileNames.add(f));
          }
        }
        if (st === 7 || st === 'ATTACHMENT_UPLOADED') {
          const raw = it.newValue ?? it.value;
          if (raw && isBlankOrDash(it.previousValue ?? it.oldValue)) {
            String(raw).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => addedFileNames.add(f));
          }
        }
      }

      // oldValue: Danh sách file ban đầu trước khi thực hiện thao tác sửa
      const oldFilesList: string[] = [];
      const oldestAtt = attachmentItems[attachmentItems.length - 1];
      const oldestOldV = norm(oldestAtt?.oldValue ?? oldestAtt?.previousValue);
      if (oldestOldV) {
        oldestOldV.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => {
          if (!oldFilesList.includes(f)) oldFilesList.push(f);
        });
      }
      for (let i = attachmentItems.length - 1; i >= 0; i--) {
        const it = attachmentItems[i];
        const oldV = norm(it.oldValue ?? it.previousValue);
        if (oldV) {
          oldV.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f) => {
            if (!oldFilesList.includes(f)) oldFilesList.push(f);
          });
        }
      }
      // Đảm bảo 100% mọi file đã bị xóa bằng thùng rác đều có mặt đầy đủ trong oldFilesList
      for (const f of deletedFileNames) {
        if (!oldFilesList.includes(f)) {
          oldFilesList.push(f);
        }
      }

      // Chỉ loại file khỏi oldFilesList nếu file đó vừa được tải lên trong chính phiên này
      // và KHÔNG hề có trong oldValue ban đầu hay trong danh sách xóa
      const initialOldSet = new Set(oldestOldV ? oldestOldV.split(',').map((s) => s.trim()).filter(Boolean) : []);
      const finalOldFilesList = oldFilesList.filter((f) => {
        if (addedFileNames.has(f) && !initialOldSet.has(f) && !deletedFileNames.has(f)) {
          return false;
        }
        return true;
      });

      // newValue: Danh sách file sau cùng sau khi hoàn tất thao tác sửa
      const newFilesList: string[] = [];
      const newestAtt = attachmentItems[0];
      const newestNewV = norm(newestAtt?.newValue ?? newestAtt?.value);
      if (newestNewV) {
        newestNewV.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((f: string) => {
          if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
            newFilesList.push(f);
          }
        });
      }
      for (const f of addedFileNames) {
        if (!newFilesList.includes(f) && !deletedFileNames.has(f)) {
          newFilesList.push(f);
        }
      }
      // Giữ lại các file cũ không bị xóa (retained files)
      for (const f of finalOldFilesList) {
        if (!deletedFileNames.has(f) && !newFilesList.includes(f)) {
          newFilesList.push(f);
        }
      }

      const finalOld = finalOldFilesList.length > 0 ? finalOldFilesList.join(', ') : null;
      const finalNew = newFilesList.length > 0 ? newFilesList.join(', ') : null;

      if (finalOld !== finalNew) {
        fieldMap.set('File đính kèm', {
          rowId: `att-${g.tsMs}`,
          field: 'File đính kèm',
          oldValue: finalOld,
          newValue: finalNew,
        });
      }
    }

    const rows = Array.from(fieldMap.values()).filter((r) => {
      const o = r.oldValue?.trim() || '';
      const n = r.newValue?.trim() || '';
      return o !== n;
    });

    const ordered = [...rows].sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a.field);
      const ib = GROUP_ORDER.indexOf(b.field);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    if (ordered.length === 0) return null;

    const meta = g.items?.[0] || {};
    const barColor = actionPrimary;
    const accent = historyAccentBarStyle(barColor);

    const paintValue = (fn: string, rawV: string | null) => {
      if (isBlankOrDash(rawV)) return '';
      if (fn === 'orgUnitId') {
        const full = orgMap.get(String(rawV));
        if (full) {
          const i = full.indexOf(' - ');
          return i >= 0 ? full.slice(i + 3) : full;
        }
        return isBlankOrDash(rawV) ? '' : String(rawV);
      }
      if (fn === 'mapSymbolId') {
        const img = symbolImageMap.get(rawV!);
        const nm = symbolMap.get(rawV!) || rawV;
        if (isBlankOrDash(nm)) return '';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {img ? <img src={img} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} /> : null}
            {nm}
          </span>
        );
      }
      if ((fn === 'attachments' || fn === 'Tài liệu đính kèm' || fn === 'File đính kèm') && rawV) {
        const files = String(rawV)
          .split(/\s*,\s*/)
          .map((f) => f.trim())
          .filter((f) => !isBlankOrDash(f));
        if (files.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {files.map((file, idx) => (
                <span key={idx} style={{ wordBreak: 'break-all' }}>
                  {file}
                </span>
              ))}
            </span>
          );
        }
      }
      if ((fn === 'Công trình KCHT trực thuộc' || fn === 'Danh sách hạ tầng' || fn === 'infrastructureList') && rawV) {
        const lines = String(rawV)
          .split(/\s*,\s*/)
          .map((seg) => seg.trim())
          .filter(Boolean)
          .map((seg) => {
            const m = seg.match(/^(.*?)\s*\(\s*([\d.]+)\s*\)\s*$/);
            if (m) return { label: m[1].trim() || seg, qty: m[2] };
            return { label: seg, qty: '' };
          })
          .filter((x) => x.label && !isBlankOrDash(x.label));
        if (lines.length > 0) {
          return (
            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: '20px' }}>
              {lines.map((x, i) => (
                <span key={i}>
                  Tên: {x.label}{x.qty && !isBlankOrDash(x.qty) ? `, Số lượng: ${fmtPortHistoryThousands(x.qty)}` : ''}
                </span>
              ))}
            </span>
          );
        }
      }
      if ((fn === 'Khu bến' || fn === 'wharfAreas' || fn === 'Danh sách khu bến') && rawV) {
        return renderWharfAreaHistory(rawV);
      }
      const resolved = resolvePortHistoryValue(fn, rawV, orgMap, symbolMap);
      if (resolved !== undefined) {
        return isBlankOrDash(resolved) ? '' : resolved;
      }
      const formatted = fmtPortHistoryThousands(String(rawV));
      return isBlankOrDash(formatted) ? '' : formatted;
    };

    return (
      <div key={g.tsMs !== 0 && g.tsMs ? `g-${g.tsMs}-${g.actor}` : `gi-${gi}`} style={{ ...historyGroupGridStyle, marginBottom: gi < groups.length - 1 ? spaceSm : 0 }}>
        <div style={{ minWidth: 0, paddingTop: spaceXs }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spaceSm }}>
            <Typography.Text style={historyTimeStyle}>
              {g.ts ? dayjs(g.ts).format('HH:mm DD/MM/YYYY') : ''}
            </Typography.Text>
            <span style={{ flexShrink: 0 }}>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: radiusPill, fontSize: fontSizeSm + 1, fontWeight: fontWeightMedium, background: `${actionPrimary}18`, color: actionPrimary, border: `1px solid ${actionPrimary}40`, whiteSpace: 'nowrap' }}>
                Cập nhật
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 0 }}>
            <Typography.Text style={historyMetaRowStyle}>
              Người cập nhật: {meta.changedBy ? String(meta.changedBy) : meta.createdBy ? String(meta.createdBy) : g.actor ? g.actor : ''}
            </Typography.Text>
            <Typography.Text style={historyMetaRowStyle}>
              Đơn vị: {unitName(g.items[0])}
            </Typography.Text>
          </div>
        </div>
        <div style={historyInfoCardStyle}>
          <div style={accent} />
          <Typography.Text style={historyInfoTitleStyle}>
            Thông tin thay đổi:
          </Typography.Text>
          {ordered.map((x, ri) => {
            const label = `${fieldLabel(x.field)}:`;
            const ov = paintValue(x.field, x.oldValue);
            const nv = paintValue(x.field, x.newValue);
            return (
              <div key={x.rowId} style={{ ...historyChangeRowStyle, paddingTop: ri > 0 ? spaceXs : 0 }}>
                <Typography.Text style={historyFieldLabelStyle}>{label}</Typography.Text>
                <span style={historyOldValueStyle} title={typeof ov === 'string' && ov ? ov : undefined}>
                  {ov}
                </span>
                <Typography.Text style={historyArrowStyle}>→</Typography.Text>
                <span style={historyNewValueStyle} title={typeof nv === 'string' && nv ? nv : undefined}>
                  {nv}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }).filter(Boolean);

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
        <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
        <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
      </div>
    );
  }
  return cards;
}

// ── Helper: format date ─────────────────────────────────────────────

// Font sàn của bộ lọc Cảng biển — đồng bộ 13.5px với bộ lọc Bến cảng (BerthListPage).
// Chỉ áp dụng cho nhãn + control trong sidebar lọc; không ảnh hưởng table/drawer/modal khác.
const filterFontSize = 13.5;

// ── DMS conversion helpers ────────────────────────────────────────

// ── List Page ───────────────────────────────────────────────────────

// Số lượng tọa độ mặc định tương ứng với từng loại đối tượng: điểm → 1, đường → 2, vùng → 3
const GEOMETRY_POINT_COUNT: Record<string, number> = { POINT: 1, LINE: 2, POLYGON: 3 };

// Số bản ghi mỗi trang khi tải lịch sử thay đổi (server-side pagination — chuẩn VTS)
const HISTORY_PAGE_SIZE = 20;

const PORT_HISTORY_FIELD_LABELS: Record<string, string> = {
  portCode: 'Mã cảng biển',
  orgUnitId: 'Đơn vị quản lý',
  portName: 'Tên cảng biển',
  province: 'Địa điểm (Tỉnh/Thành phố)',
  provinceId: 'Địa điểm (Tỉnh/Thành phố)',
  area: 'Diện tích (km²)',
  maxVesselCapacity: 'Khả năng tiếp nhận tàu',
  portGroup: 'Nhóm cảng biển',
  portClass: 'Phân cấp cảng biển',
  detailedLocation: 'Địa điểm chi tiết',
  waterAreaScope: 'Phạm vi vùng nước cảng biển',
  totalBerths: 'Tổng số bến cảng',
  totalAnchoragesTransshipment: 'Tổng số khu neo đậu, khu chuyển tải',
  totalPublicChannels: 'Tổng số tuyến luồng hàng hải công cộng',
  totalDedicatedChannels: 'Tổng số tuyến luồng hàng hải chuyên dùng',
  totalPublicChannelLength: 'Tổng chiều dài luồng hàng hải công cộng (km)',
  totalDedicatedChannelLength: 'Tổng chiều dài luồng hàng hải chuyên dùng (km)',
  totalBuoysBeacons: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng',
  totalDikes: 'Tổng số đê, kè',
  totalDikeLength: 'Tổng chiều dài hệ thống đê, kè (km)',
  totalLighthouses: 'Tổng số đèn biển, đăng, tiêu độc lập',
  buoyBerthCount: 'Số lượng bến phao',
  anchorageCount: 'Số lượng khu neo đậu',
  transshipmentCount: 'Số lượng khu chuyển tải',
  otherWaterAreas: 'Các khu nước, vùng nước khác',
  remarks: 'Ghi chú',
  geometryType: 'Loại đối tượng',
  'Loại đối tượng': 'Loại đối tượng',
  'Loại đối tượng GIS': 'Loại đối tượng',
  mapSymbolId: 'Biểu tượng',
  coordinateSystem: 'Hệ quy chiếu',
  displayRule: 'Quy tắc hiển thị',
  coordinates: 'Tọa độ GPS',
  'Tọa độ GIS': 'Tọa độ GPS',
  'Tọa độ GPS': 'Tọa độ GPS',
  spatialId: 'Vị trí không gian',
  attachments: 'File đính kèm',
  'Tài liệu đính kèm': 'File đính kèm',
  'File đính kèm': 'File đính kèm',
  wharfAreas: 'Khu bến',
  'Khu bến': 'Khu bến',
  'Danh sách khu bến': 'Khu bến',
  infrastructureList: 'Công trình KCHT trực thuộc',
  'Công trình KCHT trực thuộc': 'Công trình KCHT trực thuộc',
  'Danh sách hạ tầng': 'Công trình KCHT trực thuộc',
  operationalStatus: 'Tình trạng hoạt động',
};

const PORT_APPROVAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Lưu tạm',
  PROPOSED: 'Chờ Cảng vụ duyệt',
  APPROVED_LEVEL1: 'Chờ Cục duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const PORT_OPERATIONAL_STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Đang khai thác',
  NOT_YET_OPERATIONAL: 'Chưa khai thác',
  SUSPENDED: 'Dừng khai thác',
};

function resolvePortHistoryValue(field: string, val: unknown, orgMap: Map<string, string>, symbolMap: Map<string, string>): string | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const s = String(val).trim();
  if (isBlankOrDash(s)) return '';
  switch (field) {
    case 'orgUnitId': return orgMap.get(s) || s;
    case 'mapSymbolId': return symbolMap.get(s) || s;
    case 'spatialId': return '';
    case 'portGroup': return s ? (s.toLowerCase().startsWith('nhóm') ? s : `Nhóm ${s}`) : '';
    case 'portClass': return s ? (s === '5' || s === 'Cấp đặc biệt' ? 'Cấp đặc biệt' : s.startsWith('Cấp') ? s : `Cấp ${s}`) : '';
    case 'coordinateSystem': return s === '1' || s === 'WGS-84' ? 'WGS-84' : s === '2' || s === 'VN-2000' ? 'VN-2000' : s;
    case 'geometryType':
    case 'Loại đối tượng':
    case 'Loại đối tượng GIS':
      return s === 'POINT' ? 'Đối tượng điểm' : s === 'LINE' ? 'Đối tượng đường' : s === 'POLYGON' ? 'Đối tượng vùng' : s;
    case 'displayRule':
      return s === '1' || s === 'DMS' ? 'Độ, phút, giây (DMS)' : s;
    case 'approvalStatus': return PORT_APPROVAL_STATUS_LABELS[s] || s;
    case 'operationalStatus': return PORT_OPERATIONAL_STATUS_LABELS[s] || s;
    default: return undefined;
  }
}

export const translateFieldName = (fieldName: string): string => {
  const map: Record<string, string> = {
    // Port (Cảng biển)
    portCode: 'Mã cảng biển',
    orgUnitId: 'Đơn vị quản lý',
    portName: 'Tên cảng biển',
    province: 'Địa điểm (Tỉnh/Thành phố)',
    provinceId: 'Địa điểm (Tỉnh/Thành phố)',
    area: 'Diện tích (km²)',
    maxVesselCapacity: 'Khả năng tiếp nhận tàu',
    khaNangTiepNhan: 'Khả năng tiếp nhận tàu',
    portGroup: 'Nhóm cảng biển',
    portClass: 'Phân cấp cảng biển',
    detailedLocation: 'Địa điểm chi tiết',
    coordinateSystem: 'Hệ quy chiếu',
    displayRule: 'Quy tắc hiển thị',
    waterAreaScope: 'Phạm vi vùng nước cảng biển',
    totalBerths: 'Tổng số bến cảng',
    totalAnchoragesTransshipment: 'Tổng số khu neo đậu, khu chuyển tải',
    totalPublicChannels: 'Tổng số tuyến luồng hàng hải công cộng',
    totalDedicatedChannels: 'Tổng số tuyến luồng hàng hải chuyên dùng',
    totalPublicChannelLength: 'Tổng chiều dài luồng hàng hải công cộng (km)',
    totalDedicatedChannelLength: 'Tổng chiều dài luồng hàng hải chuyên dùng (km)',
    totalBuoysBeacons: 'Tổng số phao tiêu, báo hiệu hàng hải trên luồng',
    totalDikes: 'Tổng số đê, kè',
    totalDikeLength: 'Tổng chiều dài hệ thống đê, kè (km)',
    totalLighthouses: 'Tổng số đèn biển, đăng, tiêu độc lập',
    buoyBerthCount: 'Số lượng bến phao',
    anchorageCount: 'Số lượng khu neo đậu',
    transshipmentCount: 'Số lượng khu chuyển tải',
    otherWaterAreas: 'Các khu nước, vùng nước khác',
    remarks: 'Ghi chú',
    mapSymbolId: 'Biểu tượng',
    geometryType: 'Loại đối tượng',
    'Loại đối tượng': 'Loại đối tượng',
    'Loại đối tượng GIS': 'Loại đối tượng',
    coordinates: 'Tọa độ GPS',
    'Tọa độ GIS': 'Tọa độ GPS',
    'Tọa độ GPS': 'Tọa độ GPS',
    attachments: 'File đính kèm',
    'Tài liệu đính kèm': 'File đính kèm',
    'File đính kèm': 'File đính kèm',
    wharfAreas: 'Khu bến',
    'Khu bến': 'Khu bến',
    'Danh sách khu bến': 'Khu bến',
    infrastructureList: 'Công trình KCHT trực thuộc',
    'Công trình KCHT trực thuộc': 'Công trình KCHT trực thuộc',
    'Danh sách hạ tầng': 'Công trình KCHT trực thuộc',
    operationalStatus: 'Tình trạng hoạt động',
    // Berth (Bến cảng)
    berthCode: 'Mã bến cảng',
    berthName: 'Tên bến cảng',
    portId: 'Cảng biển chủ',
    waterway: 'Tuyến đường thủy',
    tuyenDuongThuy: 'Tuyến đường thủy',
    berthType: 'Loại bến',
    channelDepth: 'Độ sâu luồng (m)',
    doSauLuong: 'Độ sâu luồng (m)',
    operator: 'Đơn vị vận hành',
    operationalFunction: 'Công năng khai thác',
    totalArea: 'Tổng diện tích (ha)',
    designThroughput: 'Năng lực thiết kế',
    currentThroughput: 'Năng lực hiện tại',
    maxVesselSize: 'Cỡ tàu tối đa (DWT)',
    plannedThroughput: 'Năng lực quy hoạch',
    latestCargoVolume: 'Sản lượng hàng hóa gần nhất',
    openingAnnouncementDate: 'Ngày công bố mở',
    openingDecision: 'Quyết định mở',
    investmentAgreement: 'Thỏa thuận đầu tư',
    structureType: 'Loại kết cấu',
    provinceId: 'Mã tỉnh/thành',
    activityStatus: 'Trạng thái hoạt động',
    // Pier (Cầu cảng)
    pierCode: 'Mã cầu cảng',
    pierName: 'Tên cầu cảng',
    berthId: 'Bến cảng chủ',
    pierType: 'Loại cầu',
    loaiCau: 'Loại cầu',
    designLoad: 'Tải trọng thiết kế (tấn)',
    taiTrong: 'Tải trọng (tấn)',
    // DryPort (Cảng cạn)
    dryPortCode: 'Mã cảng cạn',
    dryPortName: 'Tên cảng cạn',
    viTri: 'Vị trí',
    dienTichDat: 'Diện tích đất (ha)',
    dienTichNuoc: 'Diện tích nước (ha)',
    nangLucThongQua: 'Năng lực thông qua',
    // WaterZone (Vùng nước)
    waterZoneCode: 'Mã vùng nước',
    waterZoneName: 'Tên vùng nước',
    viTriVungNuoc: 'Vị trí vùng nước',
    chieuDaiVungNuoc: 'Chiều dài vùng nước (m)',
    chieuRongVungNuoc: 'Chiều rộng vùng nước (m)',
    doSauVungNuoc: 'Độ sâu vùng nước (m)',
    // Common
    width: 'Chiều rộng (m)',
    length: 'Chiều dài (m)',
    operationalStatus: 'Trạng thái hoạt động',
    approvalStatus: 'Trạng thái phê duyệt',
    orgUnitId: 'Đơn vị quản lý',
    operationalCapacity: 'Công năng khai thác',
    bieuTuongId: 'Biểu tượng',
    iconId: 'Biểu tượng',
    lineSymbolId: 'Ký hiệu đường',
    fillSymbolId: 'Ký hiệu vùng',
    khongGianId: 'Vị trí không gian',
    spatialId: 'Vị trí không gian',
    // GIS
    constructionGrade: 'Phân cấp công trình',
    conditionStatus: 'Tình trạng',
    navigationChannelId: 'Thuộc luồng hàng hải',
    // Collections (fallback label)
    wharfAreas: 'Khu bến',
    infrastructureList: 'Công trình KCHT trực thuộc',
    attachments: 'File đính kèm',
    attachmentList: 'File đính kèm',
  };
  return map[fieldName] || fieldName;
};

// 7 trạng thái chuẩn (approval-2-level-spec §3.1). Lưu ý APPROVED_LEVEL1 nghĩa là
// ĐÃ qua vòng 1, tức đang chờ Cục duyệt — trước đây bị gán nhầm thành "Chờ Cảng vụ
// duyệt". APPROVED_LEVEL2 / REJECTED / PROPOSED là giá trị legacy, chỉ giữ để đọc
// dữ liệu cũ chứ không phát sinh mới.
const APPROVAL_STYLE_MAP: Record<string, { color: string; label: string }> = {
  DRAFT: { color: statusDraft, label: 'Lưu tạm' },
  PENDING_APPROVAL: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL1: { color: actionPrimary, label: 'Chờ Cục duyệt' },
  APPROVED: { color: statusOperational, label: 'Đã phê duyệt' },
  REJECTED_LEVEL1: { color: statusCritical, label: 'Cảng vụ trả về' },
  REJECTED_LEVEL2: { color: statusCritical, label: 'Cục trả về' },
  ARCHIVED: { color: statusDraft, label: 'Đã xóa (lịch sử)' },
  // ── legacy ──
  NHAP: { color: statusDraft, label: 'Lưu tạm' },
  PROPOSED: { color: statusAttention, label: 'Chờ Cảng vụ duyệt' },
  APPROVED_LEVEL2: { color: statusOperational, label: 'Đã duyệt' },
  DA_PHE_DUYET: { color: statusOperational, label: 'Đã duyệt' },
  REJECTED: { color: statusCritical, label: 'Từ chối' },
  TU_CHOI: { color: statusCritical, label: 'Từ chối' },
};

const STRUCTURE_TYPE_OPTIONS = [
  { value: 1, label: 'Bến nước' }, { value: 2, label: 'Bến bờ' },
  { value: 3, label: 'Bến phao' }, { value: 4, label: 'Khác' },
];

// Chi tiết vùng nước (Drawer lồng — tham chiếu WaterZoneListPage detail modal)
function WaterZoneDetailMini({ record, symbols, files, userMap }: { record: any; symbols: any[]; files: any[]; userMap: Map<string, string> }) {
  const sym = symbols.find((s: any) => s.id === record.bieuTuongId);
  return (
    <div style={{ paddingTop: 8 }}>
      <Descriptions bordered column={2} size="small" style={{ marginBottom: spaceMd }}>
        <Descriptions.Item label="Mã vùng nước"><Tag color="cyan">{record.waterZoneCode || '—'}</Tag></Descriptions.Item>
        <Descriptions.Item label="Tên vùng nước">{record.waterZoneName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Cảng biển chủ">{record.tenCangBien || record.portId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Loại vùng nước">{record.loaiVungNuoc || '—'}</Descriptions.Item>
        <Descriptions.Item label="Biểu tượng bản đồ">
          {sym?.image ? <img src={sym.image} alt={sym.name} style={{ width: 20, height: 20, objectFit: 'contain', marginRight: 8 }} /> : null}
          {sym?.name || record.bieuTuongId || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Diện tích">{record.area != null ? `${Number(record.area).toFixed(2)} m²` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu tối đa">{record.doSauMax != null ? `${Number(record.doSauMax).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Độ sâu TB">{record.doSauTrungBinh != null ? `${Number(record.doSauTrungBinh).toFixed(2)} m` : '—'}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái hoạt động">
          {record.operationalStatus ? <Tag color={trangThaiHoatDongBadge(record.operationalStatus).color}>{trangThaiHoatDongBadge(record.operationalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái phê duyệt">
          {record.approvalStatus ? <Tag color={trangThaiPheDuyetBadge(record.approvalStatus).color}>{trangThaiPheDuyetBadge(record.approvalStatus).label}</Tag> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Người tạo">{userMap.get(record.createdBy) || record.createdBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
        <Descriptions.Item label="Người cập nhật">{userMap.get(record.updatedBy) || record.updatedBy || '—'}</Descriptions.Item>
        <Descriptions.Item label="Ngày cập nhật">{record.updatedAt ? new Date(record.updatedAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
      </Descriptions>
      <Typography.Text style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Tài liệu đính kèm</Typography.Text>
      {files.length === 0 ? (
        <div style={{ color: textTertiary, fontSize: fontSizeMd, padding: `${spaceSm}px 0` }}>Không có tài liệu đính kèm</div>
      ) : (
        <div>
          {files.map((f: any) => (
            <div key={f.id} style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography.Text strong>{f.fileName}</Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {f.fileSize} bytes — {new Date(f.createdAt).toLocaleString('vi-VN')}
                </Typography.Text>
              </div>
              <Button type="link" icon={<DownloadOutlined />} onClick={() => window.open(documentApi.downloadUrl(f.minioKey), '_blank')} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortListPage() {
  // ── Permission ──────────────────────────────────────────────────
  const hasPerm = usePermissionStore((s: any) => s.hasPermission);
  const canSubmitForApproval = hasPerm?.('port:update') || hasPerm?.('port:approve') || hasPerm?.('port:manage');

  // ── State ───────────────────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterTinh, setFilterTinh] = useState('');
  const [filterOrgUnitId, setFilterOrgUnitId] = useState<string | undefined>();
  const [filterPortGroup, setFilterPortGroup] = useState<number | undefined>();
  const [filterPortClass, setFilterPortClass] = useState<number | undefined>();
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState<string | undefined>();
  const [filterUpdatedTo, setFilterUpdatedTo] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterApprovalStatus, setFilterApprovalStatus] = useState<string | undefined>();
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const defaultOrgUnitId = useRef<string | undefined>(undefined);
  const [orgUnitReady, setOrgUnitReady] = useState(false);
  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [sortField, setSortField] = useState('updatedByName');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeStatusTab, setActiveStatusTab] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dataSource, setDataSource] = useState<CangBienResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [totalAll, setTotalAll] = useState(0);

  // Modals visibility
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CangBienResponse | null>(null);
  const [detailFiles, setDetailFiles] = useState<any[]>([]);

  // Kết cấu hạ tầng khác thuộc cảng biển (tab chi tiết)
  const [infraFilter, setInfraFilter] = useState<string | undefined>(undefined);
  const [infraPage, setInfraPage] = useState(1);
  const [infraPageSize, setInfraPageSize] = useState(20);
  const [otherInfra, setOtherInfra] = useState<Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }>>([]);

  // Chi tiết KCHT khác — Drawer lồng (mở tại chỗ, không chuyển trang, tham chiếu BuoyStationList)
  const [kchtDetailOpen, setKchtDetailOpen] = useState(false);
  const [kchtDetailType, setKchtDetailType] = useState<'berth' | 'waterzone'>('berth');
  const [kchtDetailRecord, setKchtDetailRecord] = useState<any>(null);
  const [kchtDetailFiles, setKchtDetailFiles] = useState<any[]>([]);
  const [kchtDetailLoading, setKchtDetailLoading] = useState(false);
  const [pierDetailOpen, setPierDetailOpen] = useState(false);
  const [pierDetailRecord, setPierDetailRecord] = useState<any>(null);
  const [pierDetailFiles, setPierDetailFiles] = useState<any[]>([]);
  const [pierDetailLoading, setPierDetailLoading] = useState(false);

  const openPierDetail = useCallback(async (id: string) => {
    setPierDetailLoading(true); setPierDetailOpen(true); setPierDetailRecord(null);
    try {
      const [rec, fileRes] = await Promise.all([
        pierCRUD.findById(id),
        documentApi.listByEntity('pier', id, { page: 1, size: 20 }),
      ]);
      setPierDetailRecord(rec);
      setPierDetailFiles((fileRes as any)?.data || []);
    } catch { toast.error('Không thể tải chi tiết cầu cảng'); setPierDetailRecord(null); }
    finally { setPierDetailLoading(false); }
  }, []);

  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        const resp = await userService.list({ pageSize: 1000 });
        const users: any[] = (resp as any)?.data || (Array.isArray(resp) ? resp : []);
        const map = new Map<string, string>();
        users.forEach((u: any) => map.set(u.id, u.fullName || u.username || u.id));
        setUserMap(map);
      } catch { /* silent — hiển thị raw id */ }
    })();
  }, []);

  const [waterwayMap, setWaterwayMap] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    lineObjectService.list({ status: 'PUBLISHED', objectType: LineObject.ObjectType.WATERWAY, pageSize: 1000 })
      .then((r: any) => { const m = new Map<string, string>(); (r.data || []).forEach((l: any) => { m.set(l.id, l.name || l.code); }); setWaterwayMap(m); })
      .catch(() => {});
  }, []);

  const openKchtDetail = useCallback(async (type: 'berth' | 'waterzone', id: string) => {
    setKchtDetailType(type);
    setKchtDetailLoading(true);
    setKchtDetailOpen(true);
    try {
      const [rec, fileRes] = await Promise.all([
        type === 'berth' ? berthCRUD.findById(id) : waterZoneApi.findById(id),
        documentApi.listByEntity(type === 'berth' ? 'berth' : 'water-zone', id, { page: 1, size: 20 }),
      ]);
      setKchtDetailRecord(rec);
      setKchtDetailFiles((fileRes as any)?.data || []);
    } catch {
      toast.error('Không thể tải chi tiết kết cấu hạ tầng');
      setKchtDetailRecord(null);
    } finally {
      setKchtDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedRecord?.id) { setOtherInfra([]); return; }
    let cancelled = false;
    Promise.allSettled([
      berthCRUD.search({ portId: selectedRecord.id, pageSize: 50 }),
      waterZoneCRUD.findAll({ portId: selectedRecord.id, size: 50 }),
    ]).then(([b, w]) => {
      if (cancelled) return;
      const rows: Array<{ id: string; name: string; typeLabel: string; kchtType: 'berth' | 'waterzone' }> = [];
      if (b.status === 'fulfilled') {
        rows.push(...(b.value.data || []).map((x: any) => ({
          id: x.id, name: x.berthName || x.berthCode || '—', typeLabel: 'Bến cảng',
          kchtType: 'berth' as const,
        })));
      }
      if (w.status === 'fulfilled') {
        rows.push(...(w.value.data || []).map((x: any) => ({
          id: x.id, name: x.waterZoneName || x.waterZoneCode || '—', typeLabel: 'Khu neo đậu',
          kchtType: 'waterzone' as const,
        })));
      }
      setOtherInfra(rows);
    });
    return () => { cancelled = true; };
  }, [selectedRecord?.id]);

  // ── History drawer state (lọc real-time tại chỗ — giống Bến cảng) ──
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<{ keyword: string; fromDate?: string; toDate?: string }>({ keyword: '' });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CangBienResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reject modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<CangBienResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Approve modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvingRecord, setApprovingRecord] = useState<CangBienResponse | null>(null);

  // Auto-generate port code for create modal
  const [portCodeLoading, setPortCodeLoading] = useState(false);
  const [createTabKey, setCreateTabKey] = useState('general');

  // Infrastructure list for create modal
  const [infraList, setInfraList] = useState<Array<{ stt: number; infraName: string; quantity: number | null }>>([]);
  const [wharfAreaList, setWharfAreaList] = useState<PortWharfAreaItem[]>([]);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [pendingDeletedAttachmentIds, setPendingDeletedAttachmentIds] = useState<string[]>([]);
  // GPS coordinates — 6 trường DMS riêng (latD/latM/latS/lngD/lngM/lngS — chuẩn VTS CHK)
  const [gpsCoordList, setGpsCoordList] = useState<Array<{ latD: number | null; latM: number | null; latS: number | null; lngD: number | null; lngM: number | null; lngS: number | null }>>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsPage, setGpsPage] = useState(1);

  // DMS ↔ DD conversion helpers
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
  const dmToDd = (d: number | null, m: number | null, s: number | null): number => (d ?? 0) + (m ?? 0) / 60 + (s ?? 0) / 3600;

  const addGpsPoint = () => { setGpsCoordList([...gpsCoordList, { latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }]); setGpsError(null); };
  const removeGpsPoint = (i: number) => {
    const next = gpsCoordList.filter((_, idx) => idx !== i);
    setGpsCoordList(next);
    setGpsError(null);
  };
  const updateGpsPoint = (i: number, field: 'lat' | 'lng', d: number | null, m: number | null, s: number | null) => {
    const next = [...gpsCoordList];
    next[i] = field === 'lat'
      ? { ...next[i], latD: d, latM: m, latS: s }
      : { ...next[i], lngD: d, lngM: m, lngS: s };
    setGpsCoordList(next);
    setGpsError(null);
  };

  // Infra helpers
  const addInfra = () => setInfraList((prev) => [...prev, { stt: prev.length + 1, infraName: '', quantity: null }]);
  const removeInfra = (i: number) => {
    setInfraList((prev) => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, stt: idx + 1 })));
  };
  const updateInfraName = (i: number, val: string) => {
    setInfraList((prev) => {
      const next = [...prev];
      if (next[i]) next[i] = { ...next[i], infraName: val };
      return next;
    });
  };
  const updateInfraQty = (i: number, val: number | null) => {
    setInfraList((prev) => {
      const next = [...prev];
      if (next[i]) next[i] = { ...next[i], quantity: val };
      return next;
    });
  };

  // Debounce search 300ms (F-012 AC-012-02) — tên và mã tách riêng
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedName(filterName);
      setDebouncedCode(filterCode);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterName, filterCode]);

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const [updateTabKey, setUpdateTabKey] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  // Cờ đã bấm Lưu/Lưu và phê duyệt (2 form create/update) — bật message "bắt buộc" dưới ô DMS khi validation lỗi.

  const [actionType, setActionType] = useState<'draft' | 'submit' | 'approve'>('submit');
  const actionTypeRef = useRef<'draft' | 'submit' | 'approve'>('submit');
  const editActionRef = useRef<'draft' | 'approve'>('approve');
  const [orgUnits, setOrgUnits] = useState<any[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);

  // Tên đơn vị cấp 2 trong chuỗi phân cấp — dùng cho cột Đơn vị quản lý (giống chi tiết).
  const orgLevel2Map = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => {
      const name = resolveOrgLevel2Name(orgUnits, o.id);
      if (name) map.set(o.id, name);
    });
    return map;
  }, [orgUnits]);

  const symbolMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [symbols]);

  const symbolImageMap = useMemo(() => {
    const map = new Map<string, string>();
    symbols.forEach((s: any) => {
      if (s.image) map.set(s.id, s.image);
    });
    return map;
  }, [symbols]);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    orgUnits.forEach((o: any) => map.set(o.id, o.code ? `${o.code} - ${o.name}` : o.name));
    return map;
  }, [orgUnits]);

  // Lọc lịch sử thay đổi real-time trên TẤT CẢ bản ghi đã nạp (không reload server khi sửa filter),
  // theo hành vi màn "Lịch sử thay đổi" của Bến cảng: từ khóa đối chiếu trên nhãn & giá trị hiển thị
  // (raw + phân giải orgUnit/phân cấp/biểu tượng), khoảng ngày so trên dấu mốc thay đổi.
  const filteredHistory = useMemo(() => {
    const q = (historyFilters.keyword || '').trim().toLowerCase();
    const from = historyFilters.fromDate || '';
    const to = historyFilters.toDate || '';
    return (Array.isArray(historyRecords) ? historyRecords : []).filter((r: any) => {
      if (q) {
        const fn = String(r?.changedField ?? r?.fieldName ?? '');
        const label = translateFieldName(fn) || fn;
        const rawHits = [fn, label, r?.oldValue, r?.newValue, r?.previousValue, r?.value, r?.reason]
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v).toLowerCase());
        const resOld = resolvePortHistoryValue(fn, r?.oldValue ?? r?.previousValue ?? '', orgMap, symbolMap);
        const resNew = resolvePortHistoryValue(fn, r?.newValue ?? r?.value ?? '', orgMap, symbolMap);
        if (!rawHits.some((s) => s.includes(q)) && !(resOld && resOld.toLowerCase().includes(q)) && !(resNew && resNew.toLowerCase().includes(q))) return false;
      }
      if (from || to) {
        const ts = String(r?.changedAt || r?.createdAt || r?.approvedDate || '');
        const d = ts.substring(0, 10);
        if (from && d < from) return false;
        if (to && d > to) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyRecords, historyFilters, orgMap, symbolMap]);
  const hasActiveHistoryFilter = !!(historyFilters.keyword?.trim() || historyFilters.fromDate || historyFilters.toDate);

  const handleFilterApply = useCallback(() => {
    setFilterName((filterValues.portName || '').trim());
    setFilterCode((filterValues.portCode || '').trim());
    setFilterOrgUnitId(filterValues.orgUnitId === '__all__' ? undefined : filterValues.orgUnitId || undefined);
    setFilterPortClass(filterValues.portClass ? Number(filterValues.portClass) : undefined);
    setFilterPortGroup(filterValues.portGroup ? Number(filterValues.portGroup) : undefined);
    setFilterTinh(filterValues.province || '');
    setFilterUpdatedFrom(filterValues.updatedFrom || undefined);
    setFilterUpdatedTo(filterValues.updatedTo || undefined);
    setPage(1);
  }, [filterValues]);

  const handleFilterReset = useCallback(() => {
    const defaultOrg = defaultOrgUnitId.current;
    setFilterValues(defaultOrg ? { orgUnitId: defaultOrg } : {});
    setFilterName('');
    setFilterCode('');
    setFilterOrgUnitId(defaultOrg === '__all__' ? undefined : defaultOrg || undefined);
    setFilterTinh('');
    setFilterPortGroup(undefined);
    setFilterPortClass(undefined);
    setFilterUpdatedFrom(undefined);
    setFilterUpdatedTo(undefined);
    setFilterStatus(undefined);
    setFilterApprovalStatus(undefined);
    setActiveStatusTab('');
    setPage(1);
  }, []);

  // Lọc live như Bến cảng: chọn/thay đổi bất cứ ô điều kiện nào trong sidebar là lọc ngay
  // (lắng nghe filterValues → forward sang các biến thật trong handleFilterApply → setPage(1)).
  const filterValuesRef = useRef(filterValues);
  useEffect(() => {
    if (filterValuesRef.current !== filterValues) {
      filterValuesRef.current = filterValues;
      handleFilterApply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues]);

  const closeUpdateModal = useCallback(() => {
    setUpdateModalVisible(false);
    setInfraList([]);
    setWharfAreaList([]);
    setUploadFileList([]);
    setPendingDeletedAttachmentIds([]);
    setGpsCoordList([]);
    updateForm.resetFields();
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, [updateForm]);

  const closeDetailModal = useCallback(() => {
    setDetailModalVisible(false);
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'CLOSE_KCHT_MODAL' }, '*');
    }
  }, []);

  const [searchParams] = useSearchParams();
  const isIframeModal = (window.self !== window.top) && searchParams.has('action');
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  // ── Iframe auto-load effect ─────────────────────────────────────
  useEffect(() => {
    if (id && (action === 'detail' || action === 'edit')) {
      (async () => {
        try {
          setIsLoading(true);
          const cached = (window.parent as any)?.kchtDetailCache?.[id];
          const data = cached || await fetchCangBienById(id);
          setSelectedRecord(data);
          if (action === 'detail') {
            const rows = await fetchPortAttachmentList(id);
            setDetailFiles(rows);
            setDetailModalVisible(true);
          } else if (action === 'edit') {
            updateForm.setFieldsValue({
              id: data.id,
              portCode: data.portCode,
              portName: data.portName,
              province: data.province || undefined,
              orgUnitId: data.orgUnitId || undefined,
              portGroup: data.portGroup != null ? data.portGroup : undefined,
              geometryType: data.geometryType || undefined,
              mapSymbolId: data.mapSymbolId || undefined,
              detailedLocation: data.detailedLocation || undefined,
              portClass: data.portClass != null ? data.portClass : undefined,
              heQuyChieu: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              quyTacHienThi: data.displayRule != null ? data.displayRule : undefined,
              phamViVungNuoc: data.waterAreaScope || undefined,
              tongSoBenCang: data.totalBerths != null ? data.totalBerths : undefined,
              tongSoKhuNeoDauChuyenTai: data.totalAnchoragesTransshipment != null ? data.totalAnchoragesTransshipment : undefined,
              tongSoTuyenLuongCongCong: data.totalPublicChannels != null ? data.totalPublicChannels : undefined,
              tongSoTuyenLuongChuyenDung: data.totalDedicatedChannels != null ? data.totalDedicatedChannels : undefined,
              tongChieuDaiLuongCongCong: normalizeSafeNumber(data.totalPublicChannelLength),
              tongChieuDaiLuongChuyenDung: normalizeSafeNumber(data.totalDedicatedChannelLength),
              tongSoPhaoTieuBaoHieu: data.totalBuoysBeacons != null ? data.totalBuoysBeacons : undefined,
              tongSoDeKe: data.totalDikes != null ? data.totalDikes : undefined,
              tongChieuDaiDeKe: normalizeSafeNumber(data.totalDikeLength),
              tongSoDenBienDangTieu: data.totalLighthouses != null ? data.totalLighthouses : undefined,
              quantityBenPhao: data.buoyBerthCount != null ? data.buoyBerthCount : undefined,
              quantityKhuNeoDau: data.anchorageCount != null ? data.anchorageCount : undefined,
              quantityKhuChuyenTai: data.transshipmentCount != null ? data.transshipmentCount : undefined,
              cacKhuNuocKhac: data.otherWaterAreas || undefined,
              coordinateSystem: data.coordinateSystem != null ? data.coordinateSystem : undefined,
              displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
              waterAreaScope: data.waterAreaScope || undefined,
              remarks: data.remarks || undefined,
            });
            // Load infrastructure & attachments for edit
            setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
            setWharfAreaList(((data as any).wharfAreas || []).map((w: any) => ({ ...w })));
            // Load attachments via API
            try {
              const attRows = await fetchPortAttachmentList(id);
              setUploadFileList(attRows.map((a: any) => ({
                uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const,
                uploadedBy: a.uploadedBy, uploadedAt: a.uploadedAt,
                uploadedDate: a.uploadedDate || a.uploadedAt,
                uploadedByName: ((a.uploadedBy && userMap.get(a.uploadedBy)) || a.uploadedByName) ?? undefined,
              })));
            } catch { setUploadFileList([]); }
            // Parse coordinates from API response (coordinateList array, WKT string, or single lat/lng)
            const wktCoords: string = data.coordinates || '';
            const coordArr = data.coordinateList;
            const pts: Array<{ lat: number; lng: number }> = [];
            if (coordArr && Array.isArray(coordArr) && coordArr.length > 0) {
              pts.push(...coordArr.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
            } else if (wktCoords) {
              const multiMatch = wktCoords.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
              if (multiMatch) {
                const rawPts = multiMatch[1].split('),(');
                pts.push(...rawPts.map((pt: string) => {
                  const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                  return { lat: Number(parts[1]), lng: Number(parts[0]) };
                }));
              } else {
                const match = wktCoords.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                if (match) {
                  pts.push({ lat: Number(match[2]), lng: Number(match[1]) });
                }
              }
            } else if (data.latitude != null && data.longitude != null) {
              pts.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
            }
            setGpsCoordList(pts.map((p) => {
              const la = ddToDms(p.lat);
              const lo = ddToDms(p.lng);
              return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
            }));
            setUpdateModalVisible(true);
          }
        } catch (err) {
          console.error('Failed to auto-load details in iframe:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [action, id, updateForm]);

  const fetchSymbols = useCallback(async () => {
    try {
      const res = await symbolService.list({ page: 1, pageSize: 1000, status: 'active' });
      setSymbols(res.data);
    } catch (err) {
      console.error('Failed to load symbols', err);
    }
  }, []);

  useEffect(() => {
    const isIframe = window.self !== window.top;
    const parentOrgUnits = isIframe ? (window.parent as any)?.kchtOrgUnits : undefined;
    const parentSymbols = isIframe ? (window.parent as any)?.kchtSymbols : undefined;

    if (parentOrgUnits && parentOrgUnits.length > 0) {
      setOrgUnits(parentOrgUnits);
      if (!filterOrgUnitId) {
        defaultOrgUnitId.current = parentOrgUnits[0].id;
        setFilterValues(prev => ({ ...prev, orgUnitId: parentOrgUnits[0].id }));
        setFilterOrgUnitId(parentOrgUnits[0].id);
      }
      setOrgUnitReady(true);
    }
    if (parentSymbols && parentSymbols.length > 0) {
      setSymbols(parentSymbols);
    }

    const needOrgUnits = (!parentOrgUnits || parentOrgUnits.length === 0);
    const needSymbols = (!parentSymbols || parentSymbols.length === 0);

    if (needSymbols) {
      void fetchSymbols();
    }
    if (needOrgUnits) {
      (async () => {
        try {
          const resp = await organizationService.list();
          setOrgUnits(resp.data || []);
          const data = resp.data || [];
          if (data.length > 0 && !filterOrgUnitId) {
            try {
              const profileRes = await api.get('/users/me');
              const profile = profileRes.data?.data ?? profileRes.data;
              const userOrgId = profile?.orgUnitId;
              const match = userOrgId && data.find((o: any) => o.id === userOrgId);
              const defaultId = userOrgId ? (match ? userOrgId : data[0].id) : undefined;
              defaultOrgUnitId.current = defaultId;
              setFilterValues(prev => ({ ...prev, orgUnitId: defaultId }));
              setFilterOrgUnitId(defaultId === '__all__' ? undefined : defaultId);
            } catch {
              defaultOrgUnitId.current = data[0].id;
              setFilterValues(prev => ({ ...prev, orgUnitId: data[0].id }));
              setFilterOrgUnitId(data[0].id);
            }
          }
          setOrgUnitReady(true);
        } catch (err) {
          console.error('Failed to load org units', err);
          setOrgUnitReady(true);
        }
      })();
    }
  }, [fetchSymbols, isIframeModal, action]);

  // Form watches
  const createGeometryType = Form.useWatch('geometryType', createForm);
  const updateGeometryType = Form.useWatch('geometryType', updateForm);

  /** true khi field đã đạt giới hạn — 'chars': đủ max ký tự; 'value': giá trị >= max. Bật viền đỏ + message bên dưới. */
  const useAtMax = (form: any, name: string, max: number, mode: 'chars' | 'value' = 'chars'): boolean => {
    const raw = Form.useWatch(name, form) ?? '';
    if (mode === 'value') {
      const n = typeof raw === 'number' ? raw : Number(raw ?? NaN);
      return !Number.isNaN(n) && n >= max;
    }
    const len = (typeof raw === 'string' ? raw : String(raw ?? '')).length;
    return len >= max;
  };
  const atMaxCreate = {
    portName: useAtMax(createForm, 'portName', 255), detailedLocation: useAtMax(createForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(createForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(createForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(createForm, 'remarks', 2000),
    totalBerths: useAtMax(createForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(createForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(createForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(createForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(createForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(createForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(createForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(createForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(createForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(createForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(createForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(createForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(createForm, 'transshipmentCount', 5),
  };
  const atMaxUpdate = {
    portName: useAtMax(updateForm, 'portName', 255), detailedLocation: useAtMax(updateForm, 'detailedLocation', 500),
    waterAreaScope: useAtMax(updateForm, 'waterAreaScope', 2000), otherWaterAreas: useAtMax(updateForm, 'otherWaterAreas', 2000),
    remarks: useAtMax(updateForm, 'remarks', 2000),
    totalBerths: useAtMax(updateForm, 'totalBerths', 5), totalAnchoragesTransshipment: useAtMax(updateForm, 'totalAnchoragesTransshipment', 5),
    totalPublicChannels: useAtMax(updateForm, 'totalPublicChannels', 5), totalDedicatedChannels: useAtMax(updateForm, 'totalDedicatedChannels', 5),
    totalPublicChannelLength: useAtMax(updateForm, 'totalPublicChannelLength', 20), totalDedicatedChannelLength: useAtMax(updateForm, 'totalDedicatedChannelLength', 20),
    totalBuoysBeacons: useAtMax(updateForm, 'totalBuoysBeacons', 5), totalDikes: useAtMax(updateForm, 'totalDikes', 5),
    totalDikeLength: useAtMax(updateForm, 'totalDikeLength', 20), totalLighthouses: useAtMax(updateForm, 'totalLighthouses', 5),
    buoyBerthCount: useAtMax(updateForm, 'buoyBerthCount', 5), anchorageCount: useAtMax(updateForm, 'anchorageCount', 5),
    transshipmentCount: useAtMax(updateForm, 'transshipmentCount', 5),
  };

  // Khi chọn loại đối tượng → tự set hệ quy chiếu & quy tắc hiển thị
  useEffect(() => {
    if (!createGeometryType) {
      createForm.setFieldsValue({ mapSymbolId: undefined, coordinateSystem: undefined, displayRule: undefined });
      createForm.setFields([{ name: 'mapSymbolId', errors: [] }]);
      setGpsCoordList([]);
      return;
    }
    createForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Form thêm mới: điểm → 1 tọa độ, đường → 2 tọa độ, vùng → 3 tọa độ
    const count = GEOMETRY_POINT_COUNT[createGeometryType] ?? 0;
    setGpsCoordList(Array.from({ length: count }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null })));
  }, [createGeometryType]);
  useEffect(() => {
    if (!updateGeometryType) {
      updateForm.setFieldsValue({ mapSymbolId: undefined, coordinateSystem: undefined, displayRule: undefined });
      updateForm.setFields([{ name: 'mapSymbolId', errors: [] }]);
      setGpsCoordList([]);
      return;
    }
    updateForm.setFieldsValue({ coordinateSystem: 1, displayRule: 'Độ, phút, giây (DMS)' });
    // Chỉnh sửa: giữ tọa độ đã có, tự thêm dòng trống cho đủ số lượng theo loại đối tượng (điểm → 1, đường → 2, vùng → 3)
    const count = GEOMETRY_POINT_COUNT[updateGeometryType] ?? 1;
    setGpsCoordList((prev) => {
      if (prev.length >= count) return prev;
      const added = Array.from({ length: count - prev.length }, () => ({ latD: null, latM: null, latS: null, lngD: null, lngM: null, lngS: null }));
      return [...prev, ...added];
    });
  }, [updateGeometryType]);

  const handleCreateFinish = async (values: Record<string, unknown>) => {
    const portCode = String(values.portCode || '').trim();
    const portName = String(values.portName).trim();

    // BR-008-08: Validate công trình KCHT (chỉ cần tên HOẶC số lượng là đủ)
    for (const infra of infraList) {
      const name = (infra.infraName || '').trim();
      const qty = infra.quantity == null ? null : Number(infra.quantity);
      if (name.length > 500) { toast.error('Tên công trình KCHT không quá 500 ký tự'); return; }
      if (qty != null && qty > 5) { toast.error('Số lượng công trình KCHT không quá 5'); return; }
    }

    // Validate required fields for submit/approve — tọa độ GPS không bắt buộc khi gửi duyệt
    const currentAction = actionTypeRef.current;
    if (currentAction === 'submit' || currentAction === 'approve') {
      const fieldErrors: Array<{ name: Array<string | number>; errors: string[] }> = [];
      if (!values.orgUnitId) fieldErrors.push({ name: ['orgUnitId'], errors: ['Đơn vị quản lý là bắt buộc khi gửi phê duyệt'] });
      if (!values.province) fieldErrors.push({ name: ['province'], errors: ['Tỉnh/Thành phố là bắt buộc khi gửi phê duyệt'] });
      if (values.portClass == null || values.portClass === '') fieldErrors.push({ name: ['portClass'], errors: ['Phân cấp cảng biển là bắt buộc khi gửi phê duyệt'] });
      if (fieldErrors.length) { createForm.setFields(fieldErrors); return; }
    }

    if (values.geometryType) {
      if (!values.mapSymbolId) {
        setCreateTabKey('gis');
        createForm.setFields([{ name: ['mapSymbolId'], errors: ['Biểu tượng là bắt buộc khi đã chọn loại đối tượng'] }]);
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return;
      }

      const minCount = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      const validCoords = gpsCoordList.filter(
        c => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null
      );

      if (validCoords.length < minCount) {
        setCreateTabKey('gis');
        toast.error(
          values.geometryType === 'POLYGON'
            ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
            : values.geometryType === 'LINE'
            ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
            : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ'
        );
        return;
      }

      // Đối tượng điểm (POINT) chỉ cho phép đúng 1 tọa độ GPS — nếu nhiều hơn thì chặn & báo.
      if (values.geometryType === 'POINT' && validCoords.length > 1) {
        setCreateTabKey('gis');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return;
      }

      // Tọa độ GPS: nếu 1 hàng đã bắt đầu nhập nhưng ô con (Độ/Phút/Giây của Vĩ hoặc Kinh) chưa đủ → chặn & báo khi ấn Lưu
      const partial = gpsCoordList.find((c) => {
        const latSet = c.latD != null || c.latM != null || c.latS != null;
        const lngSet = c.lngD != null || c.lngM != null || c.lngS != null;
        const latFull = c.latD != null && c.latM != null && c.latS != null;
        const lngFull = c.lngD != null && c.lngM != null && c.lngS != null;
        return (latSet && !latFull) || (lngSet && !lngFull);
      });
      if (partial) {
        setCreateTabKey('gis');
        toast.error('Chưa nhập đủ Độ/Phút/Giây cho một tọa độ GPS trong tab Thông tin vị trí');
        return;
      }
    }

    setSubmitting(true);
    try {
      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
        .map(c => ({ latitude: dmToDd(c.latD, c.latM, c.latS), longitude: dmToDd(c.lngD, c.lngM, c.lngS) }));

      // AC-008-09: Kiểm tra trùng tên cảng trong cùng tỉnh (warning, không chặn)
      if (portName && values.province) {
        try {
          const dupRes = await api.get('/v1/ports', {
            params: { portName, province: values.province, page: 1, size: 1 },
          });
          const dupData = dupRes.data?.data?.content ?? dupRes.data?.content ?? [];
          if (Array.isArray(dupData) && dupData.length > 0) {
            toast.warning('Tên cảng đã tồn tại. Bạn có chắc muốn tiếp tục?');
          }
        } catch {
          // non-blocking
        }
      }

      const payload = {
        portCode,
        portName,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: currentAction === 'draft' ? 'DRAFT' : currentAction === 'submit' ? 'PENDING' : 'APPROVED',
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || undefined,
        totalBerths: values.totalBerths != null && !Number.isNaN(values.totalBerths as number)
          ? Number(values.totalBerths) : undefined,
        totalAnchoragesTransshipment: values.totalAnchoragesTransshipment != null && !Number.isNaN(values.totalAnchoragesTransshipment as number)
          ? Number(values.totalAnchoragesTransshipment) : undefined,
        totalPublicChannels: values.totalPublicChannels != null && !Number.isNaN(values.totalPublicChannels as number)
          ? Number(values.totalPublicChannels) : undefined,
        totalDedicatedChannels: values.totalDedicatedChannels != null && !Number.isNaN(values.totalDedicatedChannels as number)
          ? Number(values.totalDedicatedChannels) : undefined,
        totalPublicChannelLength: values.totalPublicChannelLength != null && !Number.isNaN(values.totalPublicChannelLength as number)
          ? Number(values.totalPublicChannelLength) : undefined,
        totalDedicatedChannelLength: values.totalDedicatedChannelLength != null && !Number.isNaN(values.totalDedicatedChannelLength as number)
          ? Number(values.totalDedicatedChannelLength) : undefined,
        totalBuoysBeacons: values.totalBuoysBeacons != null && !Number.isNaN(values.totalBuoysBeacons as number)
          ? Number(values.totalBuoysBeacons) : undefined,
        totalDikes: values.totalDikes != null && !Number.isNaN(values.totalDikes as number)
          ? Number(values.totalDikes) : undefined,
        totalDikeLength: values.totalDikeLength != null && !Number.isNaN(values.totalDikeLength as number)
          ? Number(values.totalDikeLength) : undefined,
        totalLighthouses: values.totalLighthouses != null && !Number.isNaN(values.totalLighthouses as number)
          ? Number(values.totalLighthouses) : undefined,
        buoyBerthCount: values.buoyBerthCount != null && !Number.isNaN(values.buoyBerthCount as number)
          ? Number(values.buoyBerthCount) : undefined,
        anchorageCount: values.anchorageCount != null && !Number.isNaN(values.anchorageCount as number)
          ? Number(values.anchorageCount) : undefined,
        transshipmentCount: values.transshipmentCount != null && !Number.isNaN(values.transshipmentCount as number)
          ? Number(values.transshipmentCount) : undefined,
        otherWaterAreas: (values.otherWaterAreas as string) || undefined,
        coordinateList,
        wharfAreas: wharfAreaList,
        infrastructureList: infraList
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
        action: currentAction,
      };
      const createdPort = await import('./api').then((m) => m.createCangBien(payload as any));
      const createdPortId = createdPort?.id || (createdPort as any)?.portId;
      toast.success(currentAction === 'draft' ? 'Lưu tạm thành công' : 'Lưu và phê duyệt thành công');
      createForm.resetFields();

      const pendingFiles = [...uploadFileList];
      setInfraList([]);
      setWharfAreaList([]);
      setGpsCoordList([]);
      setUploadFileList([]);
      setCreateModalVisible(false);

      // Upload files after port created successfully (skipHistory = true: Thêm mới không ghi lịch sử)
      if (createdPortId && pendingFiles.length > 0) {
        let uploaded = 0;
        try {
          uploaded = await uploadPortAttachments(createdPortId, pendingFiles, true);
          if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
        } catch { /* non-blocking */ }
      }

      setSortField('updatedByName');
      setSortOrder('descend');
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('mã cảng') || msg.includes('Ma cang') || msg.includes('Duplicate')) {
          toast.error('Mã cảng đã tồn tại. Vui lòng nhập mã khác.');
        } else {
          toast.error(msg);
        }
      } else {
        toast.error('Có lỗi xảy ra khi tạo mới');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Khi lưu thất bại do thiếu trường bắt buộc, tự chuyển về đúng tab chứa lỗi để người dùng biết
  // (tab 'gis' = Thông tin vị trí chứa nhóm loại đối tượng/hệ quy chiếu; còn lại là tab Thông tin chung).
  const jumpToTabWithError = (setKey: (k: string) => void) => (info?: unknown) => {
    const f0 = (info as { errorFields?: { name?: (string | number)[] }[] } | undefined)?.errorFields?.[0]?.name?.[0];
    setKey(['geometryType', 'mapSymbolId', 'coordinateSystem', 'displayRule'].includes(String(f0)) ? 'gis' : 'general');
  };

  const handleUpdateFinish = async (values: Record<string, unknown>) => {
    if (!selectedRecord) return;

    if (values.geometryType) {
      if (!values.mapSymbolId) {
        setUpdateTabKey('gis');
        updateForm.setFields([{ name: ['mapSymbolId'], errors: ['Biểu tượng là bắt buộc khi đã chọn loại đối tượng'] }]);
        toast.error('Biểu tượng là bắt buộc khi đã chọn loại đối tượng');
        return;
      }

      const minCount = GEOMETRY_POINT_COUNT[values.geometryType as string] ?? 1;
      const validCoords = gpsCoordList.filter(
        c => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null
      );

      if (validCoords.length < minCount) {
        setUpdateTabKey('gis');
        toast.error(
          values.geometryType === 'POLYGON'
            ? 'Đối tượng vùng cần ít nhất 3 tọa độ hợp lệ'
            : values.geometryType === 'LINE'
            ? 'Đối tượng đường cần ít nhất 2 tọa độ hợp lệ'
            : 'Đối tượng điểm cần ít nhất 1 tọa độ hợp lệ'
        );
        return;
      }

      // Đối tượng điểm (POINT) chỉ cho phép đúng 1 tọa độ GPS — nếu nhiều hơn thì chặn & báo.
      if (values.geometryType === 'POINT' && validCoords.length > 1) {
        setUpdateTabKey('gis');
        toast.error('Loại đối tượng điểm chỉ cho phép 1 tọa độ GPS');
        return;
      }

      // Tọa độ GPS: nếu 1 hàng đã bắt đầu nhập nhưng ô con (Độ/Phút/Giây của Vĩ hoặc Kinh) chưa đủ → chặn & báo khi ấn Lưu
      const partial = gpsCoordList.find((c) => {
        const latSet = c.latD != null || c.latM != null || c.latS != null;
        const lngSet = c.lngD != null || c.lngM != null || c.lngS != null;
        const latFull = c.latD != null && c.latM != null && c.latS != null;
        const lngFull = c.lngD != null && c.lngM != null && c.lngS != null;
        return (latSet && !latFull) || (lngSet && !lngFull);
      });
      if (partial) {
        setUpdateTabKey('gis');
        toast.error('Chưa nhập đủ Độ/Phút/Giây cho một tọa độ GPS trong tab Thông tin vị trí');
        return;
      }
    }

    setSubmitting(true);
    try {
      const n = (v: unknown): number | undefined =>
        v != null && !Number.isNaN(v as number) ? Number(v) : undefined;

      const coordinateList: Array<{ latitude: number; longitude: number }> = gpsCoordList
        .filter(c => c.latD != null && c.latM != null && c.latS != null && c.lngD != null && c.lngM != null && c.lngS != null)
        .map(c => ({ latitude: dmToDd(c.latD, c.latM, c.latS), longitude: dmToDd(c.lngD, c.lngM, c.lngS) }));

      const payload = {
        id: selectedRecord.id,
        portCode: (values.portCode as string) || undefined,
        portName: (values.portName as string) || undefined,
        province: (values.province as string) || undefined,
        area: values.area as number | undefined,
        maxVesselCapacity: values.khaNangTiepNhan as number | undefined,
        operationalStatus: (values.operationalStatus as string) || undefined,
        approvalStatus: editActionRef.current === 'draft' ? 'DRAFT' : 'APPROVED',
        orgUnitId: (values.orgUnitId as string) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.orgUnitId as string) ? (values.orgUnitId as string) : undefined,
        portGroup: values.portGroup ? Number(values.portGroup) : undefined,
        mapSymbolId: (values.gisLocation as any)?.mapSymbolId || (values.mapSymbolId as string) || undefined,
        geometryType: values.geometryType as string,
        coordinates: (values.gisLocation as any)?.coordinates || undefined,
        detailedLocation: (values.detailedLocation as string) || undefined,
        portClass: values.portClass != null && !Number.isNaN(values.portClass as number)
          ? Number(values.portClass) : undefined,
        coordinateSystem: values.coordinateSystem != null && !Number.isNaN(values.coordinateSystem as number)
          ? Number(values.coordinateSystem) : undefined,
        displayRule: values.displayRule != null && !Number.isNaN(values.displayRule as number)
          ? Number(values.displayRule) : undefined,
        waterAreaScope: (values.waterAreaScope as string) || null,
        totalBerths: n(values.totalBerths),
        totalAnchoragesTransshipment: n(values.totalAnchoragesTransshipment),
        totalPublicChannels: n(values.totalPublicChannels),
        totalDedicatedChannels: n(values.totalDedicatedChannels),
        totalPublicChannelLength: n(values.totalPublicChannelLength),
        totalDedicatedChannelLength: n(values.totalDedicatedChannelLength),
        totalBuoysBeacons: n(values.totalBuoysBeacons),
        totalDikes: n(values.totalDikes),
        totalDikeLength: n(values.totalDikeLength),
        totalLighthouses: n(values.totalLighthouses),
        buoyBerthCount: n(values.buoyBerthCount),
        anchorageCount: n(values.anchorageCount),
        transshipmentCount: n(values.transshipmentCount),
        otherWaterAreas: (values.otherWaterAreas as string) || null,
        coordinateList,
        wharfAreas: wharfAreaList,
        infrastructureList: infraList
          .filter((inf) => (inf.infraName || '').trim() || (inf.quantity != null && Number(inf.quantity) > 0))
          .map((inf, idx) => ({ stt: idx + 1, infraName: (inf.infraName || '').trim(), quantity: inf.quantity != null && Number(inf.quantity) > 0 ? Number(inf.quantity) : 1 })),
        remarks: (values.remarks as string) || undefined,
      };
      const res = await import('./api').then((m) => m.updateCangBien(payload));
      toast.success(editActionRef.current === 'draft' ? 'Lưu tạm thành công' : 'Lưu và phê duyệt thành công');
      if (window.parent && (window.parent as any).kchtDetailCache) {
        (window.parent as any).kchtDetailCache[selectedRecord.id] = res;
      }
      // Delete removed attachments (tuần tự tránh race condition trong DB)
      if (selectedRecord?.id && pendingDeletedAttachmentIds.length > 0) {
        for (const attId of pendingDeletedAttachmentIds) {
          await api.delete(`/v1/ports/${selectedRecord.id}/attachments/${attId}`).catch(() => {});
        }
      }
      // Upload files after port updated
      const pendingFiles = [...uploadFileList];
      if (selectedRecord?.id && pendingFiles.length > 0) {
        let uploaded = 0;
        try {
          uploaded = await uploadPortAttachments(selectedRecord.id, pendingFiles);
          if (uploaded > 0) toast.success(`Đã tải lên ${uploaded} tệp đính kèm`);
        } catch { /* non-blocking */ }
      }
      closeUpdateModal();
      if (!isIframeModal) {
        setSortField('updatedByName');
        setSortOrder('descend');
        setPage(1);
        fetchData();
        fetchTabCounts();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetchCangBienList({
        page: page - 1,
        size: pageSize,
        orgUnitId: filterOrgUnitId,
        portName: debouncedName || undefined,
        portCode: debouncedCode || undefined,
        province: filterTinh || undefined,
        operationalStatus: filterStatus,
        approvalStatus: filterApprovalStatus,
        portGroup: filterPortGroup,
        portClass: filterPortClass,
        updatedFrom: filterUpdatedFrom,
        updatedTo: filterUpdatedTo,
      });
      setDataSource(res.content || []);
      setTotal(res.totalElements ?? 0);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách cảng biển';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedName, debouncedCode, filterTinh, filterOrgUnitId, filterPortGroup, filterPortClass, filterUpdatedFrom, filterUpdatedTo, filterStatus, filterApprovalStatus]);

  const fetchTabCounts = useCallback(async () => {
    const statuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
    const counts: Record<string, number> = {};
    await Promise.all([
      ...statuses.map(async (status) => {
        try {
          const res = await fetchCangBienList({ approvalStatus: status, page: 0, size: 1, orgUnitId: filterOrgUnitId });
          counts[status] = res?.totalElements ?? 0;
        } catch { counts[status] = 0; }
      }),
      fetchCangBienList({ page: 0, size: 1, orgUnitId: filterOrgUnitId }).then(res => setTotalAll(res?.totalElements ?? 0)).catch(() => { }),
    ]);
    setTabCounts(counts);
  }, [filterOrgUnitId]);

  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchData(); }, [fetchData, isIframeModal, orgUnitReady]);
  useEffect(() => { if (!isIframeModal && orgUnitReady) void fetchTabCounts(); }, [fetchTabCounts, isIframeModal, orgUnitReady]);

  const handleDelete = useCallback((record: CangBienResponse) => {
    setDeleteTarget(record);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCangBien(deleteTarget.id);
      toast.success('Đã xóa cảng biển');
      setDeleteTarget(null);
      setSortField('updatedByName');
      setSortOrder('descend');
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Xóa thất bại');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteTarget, fetchData, fetchTabCounts]);

  const handleApprove = useCallback(
    (record: CangBienResponse) => {
      setApprovingRecord(record);
      setApproveModalOpen(true);
    },
    [],
  );

  const handleConfirmApprove = useCallback(async (content?: string) => {
    if (!approvingRecord) return;
    try {
      const st = approvingRecord.approvalStatus;
      if (st === 'DRAFT' || st === 'NHAP') {
        // Trạng thái Nháp → phê duyệt thẳng thành Đã phê duyệt (mô hình 2 trạng thái)
        await portApproval.approve(approvingRecord.id);
        toast.success('Đã phê duyệt');
      } else {
        // Vòng duyệt do trạng thái hiện tại quyết định: "Chờ Cảng vụ duyệt" là
        // vòng 1, "Chờ Cục duyệt" là vòng 2 (approval-2-level-spec §3.2).
        const isLevel2 = st === 'APPROVED_LEVEL1';
        if (isLevel2) {
          await approveCangBienC2(approvingRecord.id, content);
        } else {
          await approveCangBienC1(approvingRecord.id, content);
        }
        toast.success(isLevel2 ? 'Phê duyệt cấp Cục thành công' : 'Phê duyệt cấp Cảng vụ thành công');
      }
      setApproveModalOpen(false);
      setApprovingRecord(null);
      setSortField('updatedByName');
      setSortOrder('descend');
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Phê duyệt thất bại';
      toast.error(msg);
    }
  }, [approvingRecord, fetchData, fetchTabCounts]);

  const handleReject = useCallback((record: CangBienResponse) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectError('');
    setRejectModalVisible(true);
  }, []);

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason || rejectReason.trim().length < 10) {
      setRejectError('Lý do từ chối phải có ít nhất 10 ký tự');
      return;
    }
    try {
      await rejectCangBien(rejectTarget.id, rejectReason.trim());
      toast.success('Từ chối thành công');
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
      setSortField('updatedByName');
      setSortOrder('descend');
      setPage(1);
      fetchData();
      fetchTabCounts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại');
    }
  };

  const handleViewHistory = useCallback((record: CangBienResponse) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
    setHistoryRecords([]);
    setLoadingHistory(false);
    setLoadingMoreHistory(false);
    setHasMoreHistory(true);
    setHistoryFilters({ keyword: '' });
    setHistoryPage(0);
  }, []);

  const getPortGroupLabel = (val: number | null): string => {
    if (!val) return '';
    return `Nhóm ${val}`;
  };

  // ── Detail drawer (giống BerthListPage.openDetailDrawer: mở ngay với dòng hiện tại,
  //    fetch dữ liệu mới ở nền — KHÔNG bật isLoading để tránh load lại/remount danh sách) ──
  const openDetail = useCallback(async (record: CangBienResponse) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
    try {
      const data = await fetchCangBienById(record.id);
      setSelectedRecord(data);
    } catch {
      toast.error('Không thể tải thông tin chi tiết cảng biển');
    }
    fetchPortAttachmentList(record.id)
      .then((rows) => setDetailFiles(rows))
      .catch(() => setDetailFiles([]));
  }, []);

  // ── rowActions callback ──────────────────────────────────────────
  // Thứ tự: Xem chi tiết → Chỉnh sửa → Lịch sử → Phê duyệt/Từ chối → Xóa
  const rowActions = useCallback(
    (record: CangBienResponse) => {
      const actions: any[] = [
        {
          key: 'view',
          label: 'Xem chi tiết',
          icon: icons.view,
          onClick: () => openDetail(record),
        },
      ];
      const status = record.approvalStatus;
      // Chỉnh sửa — quy tắc 12 (approval-2-level-spec.md mục 3.9)
      if (canEditApprovalRecord(status, { hasPerm: (k: string) => !!hasPerm?.(k), resource: 'port' })) {
        actions.push({
          key: 'edit',
          label: 'Chỉnh sửa',
          icon: icons.edit,
          onClick: async () => {
            // Giống Bến cảng: mở modal NGAY với dòng hiện tại, fetch dữ liệu ở nền —
            // KHÔNG bật setIsLoading để tránh load lại/remount danh sách
            setSelectedRecord(record);
            setUpdateModalVisible(true);
            setInfraList(((record as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
            setWharfAreaList(((record as any).wharfAreas || []).map((w: any) => ({ ...w })));
            try {
              const data = await fetchCangBienById(record.id);
              setSelectedRecord(data);
              updateForm.setFieldsValue({
                portCode: data.portCode,
                portName: data.portName,
                province: data.province || undefined,
                orgUnitId: data.orgUnitId || undefined,
                portGroup: data.portGroup != null ? data.portGroup : undefined,
                detailedLocation: data.detailedLocation || undefined,
                portClass: data.portClass,
                waterAreaScope: data.waterAreaScope || undefined,
                totalBerths: data.totalBerths,
                totalAnchoragesTransshipment: data.totalAnchoragesTransshipment,
                totalPublicChannels: data.totalPublicChannels,
                totalDedicatedChannels: data.totalDedicatedChannels,
                totalPublicChannelLength: data.totalPublicChannelLength,
                totalDedicatedChannelLength: data.totalDedicatedChannelLength,
                totalBuoysBeacons: data.totalBuoysBeacons,
                totalDikes: data.totalDikes,
                totalDikeLength: data.totalDikeLength,
                totalLighthouses: data.totalLighthouses,
                buoyBerthCount: data.buoyBerthCount,
                anchorageCount: data.anchorageCount,
                transshipmentCount: data.transshipmentCount,
                otherWaterAreas: data.otherWaterAreas || undefined,
                remarks: data.remarks || undefined,
                gisLocation: data.coordinates ? {
                  geometryType: data.geometryType || undefined,
                  coordinates: data.coordinates,
                  mapSymbolId: data.mapSymbolId,
                } : undefined,
                geometryType: data.geometryType || undefined,
                mapSymbolId: data.mapSymbolId,
                coordinateSystem: data.coordinateSystem,
                displayRule: (data.geometryType || data.coordinates) ? 'Độ, phút, giây (DMS)' : undefined,
              });
              // Load infrastructure & attachments for edit
              setInfraList(((data as any).infrastructureList || []).map((i: any) => ({ stt: i.stt, infraName: i.infraName, quantity: i.quantity })));
              setWharfAreaList(((data as any).wharfAreas || []).map((w: any) => ({ ...w })));
              try {
                const attRows = await fetchPortAttachmentList(record.id);
                setUploadFileList(attRows.map((a: any) => ({
                uid: a.id, name: a.fileName, size: a.fileSize, status: 'done' as const,
                uploadedBy: a.uploadedBy, uploadedAt: a.uploadedAt,
                uploadedDate: a.uploadedDate || a.uploadedAt,
                uploadedByName: ((a.uploadedBy && userMap.get(a.uploadedBy)) || a.uploadedByName) ?? undefined,
              })));
              } catch { setUploadFileList([]); }
              // Parse coordinates from API response
              const wktCoords2: string = data.coordinates || '';
              const coordArr2 = data.coordinateList;
              const pts2: Array<{ lat: number; lng: number }> = [];
              if (coordArr2 && Array.isArray(coordArr2) && coordArr2.length > 0) {
                pts2.push(...coordArr2.map((c: any) => ({ lat: c.latitude ?? c.lat, lng: c.longitude ?? c.lng })));
              } else if (wktCoords2) {
                const multiMatch2 = wktCoords2.match(/MULTIPOINT\s*\(((?:\([^)]*\),?)+)\)/);
                if (multiMatch2) {
                  const rawPts2 = multiMatch2[1].split('),(');
                  pts2.push(...rawPts2.map((pt: string) => {
                    const parts = pt.replace(/[()]/g, '').trim().split(/\s+/);
                    return { lat: Number(parts[1]), lng: Number(parts[0]) };
                  }));
                } else {
                  const match2 = wktCoords2.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/);
                  if (match2) {
                    pts2.push({ lat: Number(match2[2]), lng: Number(match2[1]) });
                  }
                }
              } else if (data.latitude != null && data.longitude != null) {
                pts2.push({ lat: Number(data.latitude), lng: Number(data.longitude) });
              }
              setGpsCoordList(pts2.map((p) => {
                const la = ddToDms(p.lat);
                const lo = ddToDms(p.lng);
                return { latD: la.d, latM: la.m, latS: la.s, lngD: lo.d, lngM: lo.m, lngS: lo.s };
              }));
            } catch (err) {
              toast.error('Không thể tải thông tin chỉnh sửa cảng biển');
              setUpdateModalVisible(false);
            }
          },
        });
      }
      // Lịch sử — luôn hiển thị khi có quyền
      if (hasPerm?.(PERMISSIONS.PORT.HISTORY)) {
        actions.push({
          key: 'history',
          label: 'Lịch sử',
          icon: icons.history,
          onClick: () => handleViewHistory(record),
        });
      }
      // Phê duyệt / Từ chối — theo trạng thái, hiển thị trước Xóa
      // Nháp (DRAFT/NHAP): phê duyệt thẳng thành Đã phê duyệt
      if ((status === 'DRAFT' || status === 'NHAP') && hasPerm?.('port:approve')) {
        actions.push({ key: 'approve', label: 'Phê duyệt', icon: icons.approve, onClick: () => handleApprove(record) });
      }
      // CHO_PHE_DUYET / PENDING / PENDING_APPROVAL: Phê duyệt + Từ chối
      if ((status === 'CHO_PHE_DUYET' || status === 'PENDING' || status === 'PENDING_APPROVAL') && hasPerm?.('port:approve')) {
        actions.push({
          key: 'approve',
          label: 'Phê duyệt',
          icon: icons.approve,
          onClick: () => handleApprove(record),
        });
        actions.push({
          key: 'reject',
          label: 'Từ chối',
          icon: icons.reject,
          danger: true,
          onClick: () => handleReject(record),
        });
      }
      // Xóa: chỉ trạng thái DRAFT/NHAP — luôn ở cuối cùng
      if (hasPerm?.(PERMISSIONS.PORT.DELETE) && (status === 'DRAFT' || status === 'NHAP')) {
        actions.push({
          key: 'delete',
          label: 'Xóa',
          icon: icons.delete,
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      return actions;
    },
    [hasPerm, updateForm, handleApprove, handleDelete, handleReject, handleViewHistory, openDetail],
  );

  // ── Columns (DataTable format) ───────────────────────────────────
  const columns = useMemo(
    () => [
      {
        key: 'sequenceNo',
        label: 'STT',
        width: 60,
        fixed: 'left' as const,
        type: 'mono' as const,
        align: 'center' as const,
        render: (_: unknown, __: CangBienResponse, idx: number) => (
          <span style={{ fontSize: fontSizeMd }}>{(page - 1) * pageSize + idx + 1}</span>
        ),
      },
      // Ẩn cột mã cảng theo yêu cầu
      // {
      //   key: 'portCode',
      //   label: 'Mã cảng',
      //   dataIndex: 'portCode',
      //   width: 160,
      //   render: (portCode: string) => <Tag color="cyan">{portCode}</Tag>,
      // },
      {
        key: 'portName',
        label: 'Tên cảng biển',
        dataIndex: 'portName',
        width: 280,
        fixed: 'left' as const,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'portName' ? sortOrder : null,
        render: (v: string, record: CangBienResponse) => (
          <a
            title={v}
            onClick={() => openDetail(record)}
            style={{ ...cellTitleStyle, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {v}
          </a>
        ),
      },
      {
        key: 'orgUnitId',
        label: 'Đơn vị quản lý',
        dataIndex: 'orgUnitId',
        width: 260,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'orgUnitId' ? sortOrder : null,
        render: (_v: string | null, record: CangBienResponse) => {
          const level2 = record.orgUnitId ? orgLevel2Map.get(record.orgUnitId) : undefined;
          return <span style={{ fontWeight: fontWeightBold }}>{level2 || record.orgUnitName || _v || ''}</span>;
        },
      },
      {
        key: 'portGroup',
        label: 'Nhóm cảng biển',
        dataIndex: 'portGroup',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'portGroup' ? sortOrder : null,
        render: (v: number | null) => getPortGroupLabel(v),
      },
      {
        key: 'portClass',
        label: 'Phân cấp cảng biển',
        dataIndex: 'portClass',
        width: 250,
        sortable: true,
        sortOrder: sortField === 'portClass' ? sortOrder : null,
        render: (v: number | null) => v != null ? (v === 5 ? 'Cấp đặc biệt' : `Cấp ${v}`) : '',
      },
      {
        key: 'province',
        label: 'Địa điểm (Tỉnh/Thành phố)',
        dataIndex: 'province',
        width: 250,
        ellipsis: false,
        sortable: true,
        sortOrder: sortField === 'province' ? sortOrder : null,
        render: (v: string | null) => v || '',
      },
      {
        key: 'approvalStatus',
        label: 'Trạng thái',
        dataIndex: 'approvalStatus',
        width: 170,
        sortable: true,
        sortOrder: sortField === 'approvalStatus' ? sortOrder : null,
        render: (v: string) => <ApprovalStatusBadge status={v} />,
      },
      {
        key: 'updatedBy',
        label: 'Cán bộ cập nhật',
        dataIndex: 'updatedByName',
        width: 190,
        ellipsis: false,
        sortable: true,
        sortOrder: (sortField === 'updatedByName' || sortField === 'updatedAt' || sortField === 'updatedBy') ? sortOrder : null,
        render: (v: string | null, record: CangBienResponse) => {
          const name = formatUserDisplayName(record.updatedBy, record.updatedByName, userMap, record.createdBy, (record as any).createdByName);
          const date = record.updatedAt || (record as any).createdAt;
          return (
            <div style={{ lineHeight: '1.35' }}>
              <div style={{ fontWeight: fontWeightBold, color: textPrimary, fontSize: fontSizeMd, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </div>
              <div style={{ fontSize: fontSizeMd, color: textSecondary, whiteSpace: 'nowrap' }}>
                {date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </div>
            </div>
          );
        },
      },
    ],
    [page, pageSize, getPortGroupLabel, orgLevel2Map, sortField, sortOrder, userMap, openDetail],
  );

  // ── History drawer ──────────────────────────────────────────────

  useEffect(() => {
    if (!historyModalOpen || !selectedRecord) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      setLoadingMoreHistory(false);
      setHasMoreHistory(true);
      setHistoryRecords([]);
      setHistoryPage(0);
      try {
        // Nạp TOÀN BỘ lịch sử (không lọc/phân trang server) một lần khi mở drawer.
        // Việc lọc từ khóa/khoảng ngày được làm real-time tại chỗ trên dữ liệu đã nạp
        // (giống màn "Lịch sử thay đổi" của Bến cảng) — không reload server mỗi lần set filter.
        const all: any[] = [];
        let page = 0;
        while (!cancelled) {
          const history = await fetchportHistory(selectedRecord.id, page, HISTORY_PAGE_SIZE);
          if (cancelled) break;
          const batch = (history || []).filter((r: any) => r && !['spatialId', 'infrastructureList_raw'].includes(r.changedField));
          all.push(...batch);
          if (!history || history.length < HISTORY_PAGE_SIZE) break;
          page += 1;
        }
        if (cancelled) return;
        setHistoryRecords(all);
        setHistoryPage(page);
        setHasMoreHistory(false);
      } catch {
        if (!cancelled) toast.error('Không thể tải lịch sử');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [historyModalOpen, selectedRecord?.id]);

  const loadMoreHistory = async () => {
    if (!selectedRecord || loadingHistory || loadingMoreHistory || !hasMoreHistory) return;
    setLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const history = await fetchportHistory(selectedRecord.id, nextPage, HISTORY_PAGE_SIZE);
      if (history && history.length > 0) {
        const filteredMore = history.filter((r: any) => r && !['spatialId', 'infrastructureList_raw'].includes(r.changedField));
        setHistoryRecords(prev => [...prev, ...filteredMore]);
        setHistoryPage(nextPage);
        setHasMoreHistory(history.length === HISTORY_PAGE_SIZE);
      } else {
        setHistoryPage(nextPage);
        setHasMoreHistory(false);
      }
    } catch { /* ignore */ }
    finally { setLoadingMoreHistory(false); }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <ThemeTokenProvider tokens={{ ...themeTokenChk, fontSizeMd: 13.5 }}>
    <>
      {!isIframeModal && (
        <div className="port-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <style>{`
            .port-page-wrapper,
            .port-page-wrapper .ant-table,
            .port-page-wrapper .ant-table-cell,
            .port-page-wrapper .ant-table-thead > tr > th,
            .port-page-wrapper .ant-table-tbody > tr > td,
            .port-page-wrapper .ant-input,
            .port-page-wrapper .ant-select,
            .port-page-wrapper .ant-select-selection-item,
            .port-page-wrapper .ant-select-item-option-content,
            .port-page-wrapper .ant-picker,
            .port-page-wrapper .ant-picker-input > input,
            .port-page-wrapper .ant-btn,
            .port-page-wrapper .ant-pagination,
            .port-page-wrapper .ant-pagination-item,
            .port-page-wrapper .ant-pagination-total-text,
            .port-page-wrapper .ant-breadcrumb,
            .port-page-wrapper .ant-form-item-label > label,
            .port-page-wrapper .ant-tabs-tab,
            .port-page-wrapper .port-drawer-scope,
            .port-page-wrapper .port-drawer-scope .ant-drawer-content,
            .port-page-wrapper .port-drawer-scope .ant-tabs-tab,
            .port-page-wrapper .port-drawer-scope .ant-input,
            .port-page-wrapper .port-drawer-scope .ant-select,
            .port-page-wrapper .port-drawer-scope .ant-btn,
            .port-page-wrapper .port-drawer-scope .ant-table,
            .port-page-wrapper .port-drawer-scope .ant-table-cell,
            .port-page-wrapper .port-drawer-scope .ant-table-thead > tr > th,
            .port-page-wrapper .port-drawer-scope .ant-form-item-label > label {
              font-size: 13.5px !important;
            }
            /* ── Drawer tạo/sửa (antd Drawer render panel ở body portal, ngoài .port-page-wrapper) ── */
            .port-drawer-scope,
            .port-drawer-scope .ant-drawer-content,
            .port-drawer-scope .ant-tabs-tab,
            .port-drawer-scope .ant-drawer-content .ant-form-item-label > label,
            .port-drawer-scope .chk-detail-label,
            .port-drawer-scope .chk-detail-value,
            .port-drawer-scope .ant-table,
            .port-drawer-scope .ant-table-cell,
            .port-drawer-scope .ant-table-thead > tr > th,
            .port-drawer-scope .ant-table-tbody > tr > td,
            .port-drawer-scope .ant-input,
            .port-drawer-scope .ant-select,
            .port-drawer-scope .ant-btn {
              font-size: 13.5px !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed]) {
              display: flex !important;
              flex-wrap: nowrap !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              justify-content: safe center !important;
              align-items: center !important;
              scrollbar-width: thin !important;
              scrollbar-color: #cbd5e1 #f8fafc !important;
              padding: 2px 16px 6px 16px !important;
              gap: 20px !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed]) > button {
              white-space: nowrap !important;
              flex-shrink: 0 !important;
              cursor: pointer !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar {
              height: 6px !important;
              display: block !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-track {
              background: #f1f5f9 !important;
              border-radius: 999px !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb {
              background: #cbd5e1 !important;
              border-radius: 999px !important;
            }
            .port-page-wrapper div:has(> button[aria-pressed])::-webkit-scrollbar-thumb:hover {
              background: #94a3b8 !important;
            }
            /* ── Responsive Drawers: Không tràn viền khi màn hình nhỏ / zoom cao (đồng bộ Bến cảng) ── */
            .port-drawer-scope .ant-drawer-content-wrapper {
              max-width: 100vw !important;
            }
            @media (max-width: 1024px) {
              .port-drawer-scope .chk-detail-grid {
                grid-template-columns: 1fr !important;
                column-gap: 0 !important;
              }
              .port-drawer-scope .chk-detail-row--full {
                grid-column: 1 !important;
              }
            }
            @media (max-width: 640px) {
              .port-drawer-scope .chk-detail-row {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 4px !important;
                padding: 8px 0 !important;
              }
              .port-drawer-scope .chk-detail-label {
                width: 100% !important;
              }
              .port-drawer-scope .chk-detail-value {
                width: 100% !important;
              }
            }
          `}</style>
          <ScreenHeader
            breadcrumb={[{ label: 'Tài sản KCHTGT' }, { label: 'Quản lý cảng biển' }]}
            actions={[
              hasPerm?.('Port:create')
                ? {
                  key: 'create',
                  label: 'Thêm mới',
                  icon: <PlusOutlined />,
                  variant: 'primary' as const,
                  onClick: () => setCreateModalVisible(true),
                }
                : null,

            ].filter((x) => x !== null) as ScreenHeaderAction[]}
          />

          <FilterTableLayout
            filterCollapsed={filterCollapsed}
            onToggleCollapse={() => setFilterCollapsed(!filterCollapsed)}
            onFilterApply={handleFilterApply}
            onFilterReset={handleFilterReset}
            loading={isLoading}
            error={isError}
            onRetry={fetchData}
            filterContent={<>
              <div style={{ marginBottom: 12, marginTop: spaceMd }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>
                  Đơn vị quản lý
                </div>
                <OrgUnitTreeSelect
                  organizations={orgUnits}
                  placeholder="Chọn đơn vị..."
                  allowClear
                  showPath
                  allLabel="Tất cả"
                  treeDefaultExpandAll={false}
                  value={filterValues.orgUnitId || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, orgUnitId: val }))}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Tên cảng biển</div>
                <Input placeholder="Tìm theo tên cảng biển..." allowClear
                  value={filterValues.portName || ''}
                  onChange={(e) => setFilterValues((prev) => ({ ...prev, portName: e.target.value }))}
                  onPressEnter={handleFilterApply}
                  style={{ borderRadius: radiusPill, height: 40 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Phân cấp cảng biển</div>
                <Select placeholder="Chọn phân cấp" allowClear
                  value={filterValues.portClass || undefined}
                  onChange={(val) => setFilterValues((prev) => ({ ...prev, portClass: val }))}
                  options={[{ value: '5', label: 'Cấp đặc biệt' }, { value: '1', label: 'Cấp 1' }, { value: '2', label: 'Cấp 2' }, { value: '3', label: 'Cấp 3' }, { value: '4', label: 'Cấp 4' }]}
                  style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
              </div>
              {filterCollapsed && (<>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Nhóm cảng biển</div>
                  <Select placeholder="Chọn nhóm" allowClear
                    value={filterValues.portGroup || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, portGroup: val }))}
                    options={[{ value: '1', label: 'Nhóm 1' }, { value: '2', label: 'Nhóm 2' }, { value: '3', label: 'Nhóm 3' }, { value: '4', label: 'Nhóm 4' }, { value: '5', label: 'Nhóm 5' }]}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Mã cảng biển</div>
                  <Input placeholder="Tìm theo mã cảng biển..." allowClear
                    value={filterValues.portCode || ''}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, portCode: e.target.value }))}
                    onPressEnter={handleFilterApply}
                    style={{ borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Địa điểm (Tỉnh/Thành phố)</div>
                  <Select placeholder="Chọn tỉnh/thành phố" allowClear showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    value={filterValues.province || undefined}
                    onChange={(val) => setFilterValues((prev) => ({ ...prev, province: val }))}
                    options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: filterFontSize, marginBottom: spaceSm }}>Ngày cập nhật</div>
                  <DatePicker.RangePicker format="DD/MM/YYYY"
                    placeholder={['Từ ngày', 'Đến ngày']} allowClear className="port-range-picker" classNames={{ popup: { root: 'range-single-panel' } }}
                    value={[filterValues.updatedFrom ? dayjs(filterValues.updatedFrom) : null, filterValues.updatedTo ? dayjs(filterValues.updatedTo) : null]}
                    onChange={(dates) => setFilterValues((prev) => ({ ...prev, updatedFrom: dates?.[0] ? dates[0].format('YYYY-MM-DD 00:00:00') : undefined, updatedTo: dates?.[1] ? dates[1].format('YYYY-MM-DD 23:59:59') : undefined }))}
                    style={{ width: '100%', borderRadius: radiusPill, height: 40, fontSize: filterFontSize }} />
                </div>
                <style>{`.port-range-picker .ant-picker-cell-selected .ant-picker-cell-inner{background:${actionPrimary}!important}.port-range-picker .ant-picker-ok button{background:${actionPrimary}!important;border-color:${actionPrimary}!important;border-radius:${radiusPill}px!important}.port-range-picker .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner{background:${actionPrimary}15!important;color:${actionPrimary}!important}.port-range-picker .ant-picker-today-btn{color:${actionPrimary}!important}.range-single-panel .ant-picker-panel-container .ant-picker-panel:last-child{display:none!important}`}</style>
              </>)}
            </>}
            statusTabs={[
              { key: 'all', label: 'Tất cả', count: totalAll || 0, color: actionPrimary, active: !activeStatusTab },
              { key: 'DRAFT', label: 'Lưu tạm', count: tabCounts['DRAFT'] ?? 0, color: statusDraft, active: activeStatusTab === 'DRAFT' },
              { key: 'APPROVED', label: 'Đã phê duyệt', count: tabCounts['APPROVED'] ?? 0, color: statusOperational, active: activeStatusTab === 'APPROVED' },
            ]}
            onStatusTabChange={(key) => {
              setActiveStatusTab(key === 'all' ? '' : key);
              setFilterApprovalStatus(key === 'all' ? undefined : key);
              if (key === 'all') { setFilterStatus(undefined); setFilterTinh(''); setFilterName(''); setFilterCode(''); }
              setPage(1);
            }}
          >
            <DataTable columns={columns}
              dataSource={[...dataSource].sort((a: any, b: any) => {
                if (!sortField) return 0;
                const resolve = (r: any) => {
                  if (sortField === 'orgUnitId') return orgLevel2Map.get(r.orgUnitId) ?? r.orgUnitName ?? '';
                  // Cột "Cán bộ cập nhật" — nhấn sort phải sắp theo THỜI GIAN cập nhật (mới nhất/cũ nhất),
                  // chứ không phải theo tên cán bộ. DataTable đánh dấu cột theo dataKey = dataIndex = 'updatedByName'
                  // (khác col.key 'updatedBy') — phải so sánh đúng 'updatedByName' thì vòng lặp asc→desc→… mới chạy tiếp.
                  if (sortField === 'updatedByName' || sortField === 'updatedAt' || sortField === 'updatedBy') {
                    const t = r.updatedAt || r.createdAt;
                    return t ? new Date(t).getTime() : 0;
                  }
                  if (sortField === 'approvalStatus') {
                    const rank: Record<string, number> = { DRAFT: 1, PROPOSED: 1, PENDING: 2, PENDING_APPROVAL: 2, APPROVED: 3, REJECTED: 4 };
                    return rank[String(r.approvalStatus || '').toUpperCase()] ?? 99;
                  }
                  return r[sortField] ?? '';
                };
                const aVal = resolve(a);
                const bVal = resolve(b);
                const cmp = typeof aVal === 'number' && typeof bVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal), 'vi');
                return sortOrder === 'ascend' ? cmp : -cmp;
              })}
              rowKey="id" rowActions={rowActions} loading={false}
              onSort={(key: string, order: 'asc' | 'desc') => { setSortField(key); setSortOrder(order === 'asc' ? 'ascend' : 'descend'); setPage(1); }}
              scroll={{ x: 'max-content' }}
            />
            <Pagination total={total} current={page} pageSize={pageSize}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </FilterTableLayout>
        </div>
      )}

      {/* ── Create Drawer ─────────────────────────────── */}
      {!isIframeModal && (
        <AppDrawer
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Thêm mới Cảng biển
            </span>
          }
          width="min(920px, 96vw)"
          rootClassName="port-drawer-scope"
          className="port-drawer-scope"
          destroyOnHidden
          open={createModalVisible}
          onClose={() => { setCreateModalVisible(false); setInfraList([]); setWharfAreaList([]); setUploadFileList([]); setGpsCoordList([]); createForm.resetFields(); }}
          footer={
            <div style={drawerFooterStyle}>
              <Button onClick={() => { actionTypeRef.current = 'draft'; setActionType('draft'); createForm.submit(); }} loading={submitting && actionType === 'draft'} style={outlineButtonStyle}>Lưu tạm</Button>
              {canSubmitForApproval && <Button type="primary" onClick={() => { actionTypeRef.current = 'approve'; setActionType('approve'); createForm.submit(); }} loading={submitting && actionType === 'approve'} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>}
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
          afterOpenChange={async (open) => {
            if (open) {
              // Reset toàn bộ trước khi mở form mới
              createForm.resetFields();
              setInfraList([]);
              setWharfAreaList([]);
              setUploadFileList([]);
              setGpsCoordList([]);
              setCreateTabKey('general');
              // Auto-generate mã cảng mới
              setPortCodeLoading(true);
              try {
                const res = await api.get('/v1/ports/generate-code');
                const code: string | undefined = res.data?.data?.portCode;
                if (code) {
                  createForm.setFieldsValue({ portCode: code });
                }
              } catch {
                toast.error('Không thể tạo mã cảng. Vui lòng thử lại.');
              } finally {
                setPortCodeLoading(false);
              }
            }
          }}
        >
          <style>{requiredMarkStyle}</style>
          <PortForm
            form={createForm}
            mode="create"
            geometryType={createGeometryType}
            atMax={atMaxCreate}
            activeTabKey={createTabKey}
            onTabChange={setCreateTabKey}
            portCodeLoading={portCodeLoading}
            orgUnits={orgUnits}
            symbols={symbols}
            gpsCoordList={gpsCoordList}
            gpsError={gpsError}
            gpsPage={gpsPage}
            onGpsPageChange={setGpsPage}
            addGpsPoint={addGpsPoint}
            removeGpsPoint={removeGpsPoint}
            updateGpsPoint={updateGpsPoint}
            setGpsCoordList={setGpsCoordList}
            infraList={infraList}
            addInfra={addInfra}
            removeInfra={removeInfra}
            updateInfraName={updateInfraName}
            updateInfraQty={updateInfraQty}
            wharfAreaList={wharfAreaList}
            setWharfAreaList={setWharfAreaList}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            userMap={userMap}
            onFinish={handleCreateFinish}
            onFinishFailed={jumpToTabWithError(setCreateTabKey)}
          />
        </AppDrawer>
      )}

      {/* ── Edit Drawer ──────────────────────────────────────────────── */}
      {(!isIframeModal || action === 'edit') && (
        <AppDrawer
          size={isIframeModal ? '100%' : 1000}
          width={isIframeModal ? '100%' : 'min(920px, 96vw)'}
          rootClassName="port-drawer-scope"
          className="port-drawer-scope"
          destroyOnHidden
          mask={!isIframeModal}
          title={
            <span style={{ ...drawerTitleStyle, fontSize: 16 }}>
              Chỉnh sửa thông tin Cảng biển
            </span>
          }
          open={updateModalVisible}
          onClose={closeUpdateModal}
          footer={
            <div style={drawerFooterStyle}>
              {!(selectedRecord?.approvalStatus === 'APPROVED' || selectedRecord?.approvalStatus === 'APPROVED_LEVEL2') && (
                <Button htmlType="submit" loading={submitting} onClick={() => { editActionRef.current = 'draft'; updateForm.submit(); }} style={outlineButtonStyle}>Lưu tạm</Button>
              )}
              <Button type="primary" htmlType="submit" loading={submitting} onClick={() => { editActionRef.current = 'approve'; updateForm.submit(); }} style={{ ...primaryButtonStyle, background: statusOperational, borderColor: statusOperational }}>Lưu và phê duyệt</Button>
            </div>
          }
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          <style>{requiredMarkStyle}</style>
          <PortForm
            form={updateForm}
            mode="update"
            geometryType={updateGeometryType}
            atMax={atMaxUpdate}
            orgUnits={orgUnits}
            symbols={symbols}
            gpsCoordList={gpsCoordList}
            gpsError={gpsError}
            gpsPage={gpsPage}
            onGpsPageChange={setGpsPage}
            addGpsPoint={addGpsPoint}
            removeGpsPoint={removeGpsPoint}
            updateGpsPoint={updateGpsPoint}
            setGpsCoordList={setGpsCoordList}
            infraList={infraList}
            addInfra={addInfra}
            removeInfra={removeInfra}
            updateInfraName={updateInfraName}
            updateInfraQty={updateInfraQty}
            wharfAreaList={wharfAreaList}
            setWharfAreaList={setWharfAreaList}
            uploadFileList={uploadFileList}
            setUploadFileList={setUploadFileList}
            onDeleteAttachment={(attId) => setPendingDeletedAttachmentIds((prev) => [...prev, attId])}
            recordId={selectedRecord?.id}
            userMap={userMap}
            onFinish={handleUpdateFinish}
            onFinishFailed={jumpToTabWithError(setUpdateTabKey)}
            activeTabKey={updateTabKey}
            onTabChange={setUpdateTabKey}
          />
        </AppDrawer>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────── */}
      {(!isIframeModal || action === 'detail') && (
        <AppDrawer
          size={isIframeModal ? '100%' : 1000}
          width={isIframeModal ? '100%' : 'min(1000px, 96vw)'}
          rootClassName="port-drawer-scope"
          className="port-drawer-scope"
          mask={!isIframeModal}
          title={
            selectedRecord
              ? <span style={drawerTitleStyle}>Chi tiết cảng biển - {selectedRecord.portName}</span>
              : <span style={drawerTitleStyle}>Chi tiết cảng biển</span>
          }
          open={detailModalVisible}
          onClose={closeDetailModal}
          footer={null}
          styles={{
            header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
            body: { padding: '0 24px 12px 24px' },
          }}
        >
          {selectedRecord && (
            <PortDetailContent
              selectedRecord={selectedRecord}
              orgLevel2Map={orgLevel2Map}
              userMap={userMap}
              symbols={symbols}
              detailFiles={detailFiles}
              otherInfra={otherInfra}
              infraFilter={infraFilter}
              setInfraFilter={setInfraFilter}
              infraPage={infraPage}
              setInfraPage={setInfraPage}
              infraPageSize={infraPageSize}
              setInfraPageSize={setInfraPageSize}
              openKchtDetail={openKchtDetail}
              ddToDms={ddToDms}
            />
          )}

        </AppDrawer>
      )}


      {/* ── Chi tiết KCHT khác (Drawer lồng — không chuyển trang) ── */}
      <AppDrawer
        size={isIframeModal ? '100%' : 1000}
        width={isIframeModal ? '100%' : 'min(1000px, 96vw)'}
        rootClassName="port-drawer-scope"
        className="port-drawer-scope"
        mask={!isIframeModal}
        title={
          <span style={drawerTitleStyle}>
            {kchtDetailRecord
              ? `Chi tiết ${kchtDetailType === 'berth' ? 'bến cảng' : 'vùng nước'} - ${kchtDetailRecord.berthName || kchtDetailRecord.waterZoneName || ''}`
              : 'Chi tiết kết cấu hạ tầng'}
          </span>
        }
        open={kchtDetailOpen}
        onClose={() => setKchtDetailOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {kchtDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : kchtDetailRecord && kchtDetailType === 'berth' ? (
          <BerthDetailContent
            selectedRecord={kchtDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            portOptions={selectedRecord ? [{ value: selectedRecord.id, label: selectedRecord.portName || selectedRecord.portCode }] : []}
            userMap={userMap}
            detailFiles={kchtDetailFiles}
            ddToDms={(dd: number) => { const r = ddToDms(dd); return { d: r.d ?? 0, m: r.m ?? 0, s: r.s ?? 0 }; }}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            structureTypeOptions={STRUCTURE_TYPE_OPTIONS}
            waterwayMap={waterwayMap}
            onViewPierDetail={openPierDetail}
          />
        ) : kchtDetailRecord && kchtDetailType === 'waterzone' ? (
          <WaterZoneDetailMini record={kchtDetailRecord} symbols={symbols as any[]} files={kchtDetailFiles} userMap={userMap} />
        ) : null}
      </AppDrawer>

      {/* ── Pier Detail Drawer (sibling — tránh drawer lồng bị đẩy kích thước) ── */}
      <AppDrawer
        size={isIframeModal ? '100%' : 1000}
        width={isIframeModal ? '100%' : 'min(1000px, 96vw)'}
        rootClassName="port-drawer-scope"
        className="port-drawer-scope"
        mask={!isIframeModal}
        title={<span style={drawerTitleStyle}>Chi tiết cầu cảng{pierDetailRecord ? ` - ${pierDetailRecord.pierName || pierDetailRecord.pierCode || ''}` : ''}</span>}
        open={pierDetailOpen}
        onClose={() => setPierDetailOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '0 24px 12px 24px' },
        }}
      >
        {pierDetailLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải chi tiết...</div>
        ) : pierDetailRecord ? (
          <PierDetailContent
            selectedRecord={pierDetailRecord}
            orgMap={new Map((orgUnits || []).map((o: any) => [o.id, o.name]))}
            organizations={orgUnits as any}
            portMap={new Map([[selectedRecord?.id ?? '', selectedRecord?.portName || '']])}
            berthOptions={kchtDetailRecord ? [{ value: kchtDetailRecord.id, label: kchtDetailRecord.berthName || kchtDetailRecord.berthCode || '' }] : []}
            symbolMap={new Map((symbols || []).map((s: any) => [s.id, s.name]))}
            symbolImageMap={new Map((symbols || []).filter((s: any) => s.image).map((s: any) => [s.id, s.image]))}
            detailFiles={pierDetailFiles}
            ddToDms={(dd: number) => { const r = ddToDms(dd); return { d: r.d ?? 0, m: r.m ?? 0, s: r.s ?? 0 }; }}
            approvalStyleMap={APPROVAL_STYLE_MAP}
            operationalStyleMap={{
              OPERATIONAL: { color: statusOperational, label: 'Đang khai thác/vận hành' },
              NOT_YET_OPERATIONAL: { color: statusAttention, label: 'Chưa khai thác/vận hành' },
              SUSPENDED: { color: statusCritical, label: 'Dừng khai thác/vận hành' },
            }}
            userMap={userMap}
            waterwayMap={waterwayMap}
          />
        ) : null}
      </AppDrawer>

      {/* ── History drawer (timeline theo chuẩn màn Bến cảng) ── */}
      <AppDrawer
        width="min(880px, 96vw)"
        rootClassName="port-drawer-scope"
        className="port-drawer-scope"
        mask
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Space size={spaceSm} style={{ alignItems: 'center' }}>
              <HistoryOutlined style={{ fontSize: fontSizeLg, color: colors.sidebarBg }} />
              <span style={drawerTitleStyle}>
                Lịch sử thay đổi — {selectedRecord?.portName || selectedRecord?.portCode || ''}
              </span>
              <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: fontSizeLg - 1, fontWeight: fontWeightBold, background: `${colors.sidebarBg}15`, color: colors.sidebarBg, lineHeight: '20px' }}>
                Tổng cộng {Array.isArray(filteredHistory) ? filteredHistory.length : 0}
              </span>
            </Space>
          </div>
        }
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        footer={null}
        styles={{
          header: { padding: '12px 24px', borderBottom: `1px solid ${borderDefault}`, flexShrink: 0 },
          body: { padding: '16px 24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        }}
      >
        <style>{`.history-dt-popup .ant-picker-now-btn { color: ${actionPrimary} !important; }`}</style>
        <div style={{ flexShrink: 0 }}>
          {!loadingHistory && (
            <div style={{ display: 'flex', gap: spaceSm, marginBottom: spaceMd }}>
              <Input
                placeholder="Tìm kiếm nội dung thay đổi..."
                allowClear
                value={historyFilters.keyword || ''}
                onChange={(e) => setHistoryFilters((p) => ({ ...p, keyword: e.target.value }))}
                style={{ flex: 1, borderRadius: radiusPill, height: 40 }}
              />
              <DatePicker
                placeholder="Từ ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFilters.fromDate ? dayjs(historyFilters.fromDate) : null}
                onChange={(d) => setHistoryFilters((p) => ({ ...p, fromDate: d ? d.format('YYYY-MM-DD') : '' }))}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY"
              />
              <DatePicker
                placeholder="Đến ngày"
                classNames={{ popup: { root: 'history-dt-popup' } }}
                value={historyFilters.toDate ? dayjs(historyFilters.toDate) : null}
                onChange={(d) => setHistoryFilters((p) => ({ ...p, toDate: d ? d.format('YYYY-MM-DD') : '' }))}
                style={{ width: 140, borderRadius: radiusPill, height: 40 }} format="DD/MM/YYYY"
              />
              <Button type="primary" icon={<SearchOutlined />} style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, background: actionPrimary, borderColor: actionPrimary }}
                onClick={() => { /* Lọc real-time theo từng thao tác nhập/chọn — giống Bến cảng */ }}>
                Tìm kiếm
              </Button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loadingHistory ? (
            <div style={{ padding: `${spaceMd}px 0` }}>
              <LoadingSkeleton rows={5} />
            </div>
          ) : historyRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <HistoryOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Chưa có thay đổi nào được ghi nhận</div>
            </div>
          ) : hasActiveHistoryFilter && filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: `${spaceXl}px 0` }}>
              <SearchOutlined style={{ fontSize: 40, color: textTertiary, marginBottom: spaceMd }} />
              <div style={{ color: textTertiary, fontSize: fontSizeMd }}>Không tìm thấy kết quả phù hợp</div>
            </div>
          ) : (
            renderPortHistCards(filteredHistory, orgMap, symbolMap, symbolImageMap)
          )}
          {loadingMoreHistory && (
            <div style={{ padding: spaceMd, textAlign: 'center', color: textTertiary, fontSize: fontSizeMd }}>Đang tải thêm…</div>
          )}
        </div>
      </AppDrawer>

      {selectedRecord && (
        <DocumentUploadModal
          entityType="port"
          entityId={selectedRecord.id}
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
        />
      )}

      {/* Approve Modal (chuẩn VTS CHK) */}
      <ApprovalModal
        visible={approveModalOpen}
        level={approvingRecord?.approvalStatus === 'APPROVED_LEVEL1' ? 'c2' : 'c1'}
        onConfirm={(content) => { void handleConfirmApprove(content); }}
        onCancel={() => { setApproveModalOpen(false); setApprovingRecord(null); }}
      />

      {/* Reject Modal */}
      <Modal styles={{ mask: { background: 'rgba(0, 0, 0, 0.4)' } }}
        title={<span style={{ color: colors.sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeLg }}>Từ chối phê duyệt</span>}
        open={rejectModalVisible} onCancel={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setRejectModalVisible(false); setRejectTarget(null); setRejectReason(''); }}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd, borderColor: borderDefault, color: textSecondary }}>Hủy</Button>,
          <Button key="reject" type="primary" danger onClick={handleConfirmReject}
            style={{ borderRadius: radiusPill, height: 40, fontSize: fontSizeMd }}>Xác nhận từ chối</Button>,
        ]}
        width={480}>
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: fontSizeMd, color: textPrimary, marginBottom: spaceFormField }}>Vui lòng nhập lý do từ chối cho cảng biển:</p>
          {rejectTarget && <p style={{ fontSize: fontSizeMd, color: textSecondary, marginBottom: spaceFormField }}><strong style={{ color: textPrimary }}>{rejectTarget.portCode} — {rejectTarget.portName}</strong></p>}
          <Input.TextArea placeholder="Nhập lý do từ chối..." value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={3} style={{ borderRadius: 8, fontSize: fontSizeMd, borderColor: rejectError ? statusCritical : undefined }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {rejectError ? <span style={{ color: statusCritical, fontSize: fontSizeMd }}>{rejectError}</span> : <span />}
            <span style={{ color: rejectReason.trim().length < 10 ? statusCritical : textTertiary, fontSize: fontSizeMd }}>
              {rejectReason.length}/10
            </span>
          </div>
        </div>
      </Modal>

      {/* Xóa cảng biển — giống Bến cảng (DeleteConfirmModal) */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        itemType="cảng biển"
        itemName={deleteTarget?.portName}
        itemCode={deleteTarget?.portCode}
      />
    </>
    </ThemeTokenProvider>
  );
}
