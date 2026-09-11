import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Table,
  Dropdown,
  Button,
  Tooltip,
  Spin,
  type TableProps,
  type MenuProps,
} from "antd";
import { MoreOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  TableColumnType,
  BaseSearchRequest,
  BaseSearchResponse,
  type TableOption,
  type TableActionOption,
  type CommonTableRef,
} from "./table.model";
import Pagination from "../../list-view/Pagination";
import EmptyState from "../../EmptyState";
import {
  useThemeToken,
  THEME_SCOPE_CLASS,
  type ThemeToken,
} from "../../../context/ThemeTokenContext";
import { layout } from "../../../theme";
import {
  fontSizeMd,
  fontWeightBold,
  fontWeightMedium,
  statusDraft,
  statusCritical,
  statusBadgeStyle,
  cellTitleStyle,
  cellSubtitleStyle,
  tableSortIcon,
} from "../../../themetokenchk";
import { DEFAULT_STATUS_MAP } from "./status-map.constants";

const ACTION_COLUMN_WIDTH = 60;
const HEADER_CHAR_WIDTH = 8.8;
const HEADER_HORIZONTAL_PADDING = 24;
const HEADER_SORTER_WIDTH = 22;

/**
 * Tính toán bề rộng tối thiểu để tiêu đề cột hiển thị đầy đủ 100% chữ,
 * tuyệt đối không bị cắt "..." theo quy chuẩn UI của hệ thống.
 */
function getHeaderMinWidth(title: React.ReactNode, hasSorter: boolean): number {
  const text = typeof title === "string" ? title : "";
  if (!text) return 0;
  const sorterSpace = hasSorter ? HEADER_SORTER_WIDTH : 0;
  return (
    Math.ceil(text.length * HEADER_CHAR_WIDTH) +
    HEADER_HORIZONTAL_PADDING +
    sorterSpace
  );
}

/**
 * Dropdown menu hành động dòng chuẩn với nút 3 chấm tròn.
 * Tự động đóng menu khi người dùng cuộn chuột bảng/trang.
 */
const RowActionDropdown: React.FC<{
  items: MenuProps["items"];
  themeToken: ThemeToken;
}> = ({ items, themeToken }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest(".ant-dropdown")
      )
        return;
      setOpen(false);
    };
    document.addEventListener("scroll", closeOnScroll, true);
    return () => document.removeEventListener("scroll", closeOnScroll, true);
  }, [open]);

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      rootClassName={THEME_SCOPE_CLASS}
    >
      <Button
        icon={<MoreOutlined />}
        onClick={(e) => e.stopPropagation()}
        style={themeToken.rowActionButtonStyle}
      />
    </Dropdown>
  );
};

export interface CommonTableProps<T = Record<string, unknown>> {
  /** Cấu hình tổng thể TableOption theo chuẩn mefobase-core */
  options: TableOption<T>;
  /** Dữ liệu bản ghi truyền trực tiếp từ bên ngoài (nếu không dùng serviceProvider) */
  dataSource?: T[];
  /** Tổng số bản ghi (dùng khi quản lý state bên ngoài) */
  total?: number;
  /** Trạng thái đang tải dữ liệu */
  loading?: boolean;
  /** Trang hiện tại (1-indexed) */
  page?: number;
  /** Số bản ghi trên mỗi trang */
  pageSize?: number;
  /** Callback khi đổi trang hoặc số lượng bản ghi/trang */
  onPageChange?: (page: number, pageSize: number) => void;
  /** Callback khi đổi sắp xếp cột */
  onSortChange?: (field: string, order: "ascend" | "descend" | null) => void;
  /** Tham số lọc tùy biến bổ sung (sẽ tự động truyền vào BaseSearchRequest) */
  filters?: Record<string, unknown>;
  /** Callback khi tải xong dữ liệu thành công */
  onLoadFinished?: (items: T[]) => void;
  /** Thông báo / giao diện lỗi */
  error?: string | boolean | null;
  /** Callback thử lại khi có lỗi */
  onRetry?: () => void;
  /** Giao diện tùy biến khi bảng không có dữ liệu */
  emptyState?: React.ReactNode;
  /** Custom CSS style cho wrapper */
  style?: React.CSSProperties;
  /** Custom class CSS cho wrapper */
  className?: string;
}

/**
 * CommonTable — Component bảng dữ liệu đa năng dùng chung cho toàn bộ hệ thống Hàng hải KCHTGT.
 * Kế thừa triết lý cấu hình hướng khai báo (declarative TableOption) của mefobase-core,
 * đồng thời kết hợp chuẩn thiết kế Design System React / Ant Design của dự án.
 */
function CommonTableInternal<T extends Record<string, unknown>>(
  {
    options,
    dataSource: externalDataSource,
    total: externalTotal,
    loading: externalLoading,
    page: externalPage,
    pageSize: externalPageSize,
    onPageChange,
    onSortChange,
    filters,
    onLoadFinished,
    error,
    onRetry,
    emptyState,
    style,
    className,
  }: CommonTableProps<T>,
  ref: React.ForwardedRef<CommonTableRef<T>>,
) {
  const themeToken = useThemeToken();
  const { textSecondary, colors, tableHeaderBg, tableRowStripeBg } = themeToken;

  const serviceProvider = options?.serviceProvider;
  const disableInitialSearch = options?.disableInitialSearch;

  // Quản lý state nội bộ khi dùng chế độ serviceProvider
  const [internalData, setInternalData] = useState<T[]>([]);
  const [internalTotal, setInternalTotal] = useState<number>(0);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);
  const [internalPage, setInternalPage] = useState<number>(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(
    options?.pageSize || 20,
  );
  const [sortField, setSortField] = useState<string | undefined>(
    options?.defaultSort?.field,
  );
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(
    options?.defaultSort?.order === -1 ||
      options?.defaultSort?.order === "descend"
      ? "descend"
      : options?.defaultSort?.order === 1 ||
          options?.defaultSort?.order === "ascend"
        ? "ascend"
        : null,
  );

  // Đồng bộ trạng thái sort với bộ lọc ngoài nếu được truyền
  useEffect(() => {
    if (filters && ("sortBy" in filters || "sortDir" in filters)) {
      setSortField(filters.sortBy as string | undefined);
      setSortOrder(
        filters.sortDir === "ASC"
          ? "ascend"
          : filters.sortDir === "DESC"
            ? "descend"
            : null,
      );
    }
  }, [filters?.sortBy, filters?.sortDir]);
  const [filterOverrides, setFilterOverrides] = useState<
    Record<string, unknown>
  >({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [measuredTableWidth, setMeasuredTableWidth] = useState<number>();

  const tableShellRef = useRef<HTMLDivElement>(null);
  const dataKey = (options?.dataKey as string) || "id";
  const isServiceProviderMode = Boolean(serviceProvider);

  // Gộp filters bên ngoài và override nội bộ
  const effectiveFilters = useMemo(
    () => ({ ...(filters || {}), ...filterOverrides }),
    [filters, filterOverrides],
  );

  // Xác định dữ liệu thực tế đang dùng
  const actualData: T[] =
    externalDataSource !== undefined ? externalDataSource : internalData;
  const actualTotal: number =
    externalTotal !== undefined ? externalTotal : internalTotal;
  const actualLoading: boolean =
    externalLoading !== undefined ? externalLoading : internalLoading;
  const actualPage: number =
    externalPage !== undefined ? externalPage : internalPage;
  const actualPageSize: number =
    externalPageSize !== undefined ? externalPageSize : internalPageSize;

  // Reset cuộn ngang về 0 khi đổi trang hoặc nạp dữ liệu
  const resetHorizontalScroll = useCallback(() => {
    if (!tableShellRef.current) return;
    tableShellRef.current
      .querySelectorAll<HTMLElement>(
        ".ant-table-header, .ant-table-body, .ant-table-content, .ant-table-container, .ant-table, .ant-table-sticky-scroll",
      )
      .forEach((el) => {
        el.scrollLeft = 0;
        el.scrollTo?.({ left: 0, behavior: "auto" });
      });
  }, []);

  useEffect(() => {
    resetHorizontalScroll();
    const frameId = window.requestAnimationFrame(resetHorizontalScroll);
    const timer = setTimeout(resetHorizontalScroll, 80);
    return () => {
      window.cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [actualPage, actualData.length, resetHorizontalScroll]);

  // Đo chiều rộng container để co giãn cột thông minh
  useLayoutEffect(() => {
    const shell = tableShellRef.current;
    if (!shell) return;
    const measure = () => {
      if (shell.clientWidth > 0) {
        setMeasuredTableWidth((current) =>
          current === shell.clientWidth ? current : shell.clientWidth,
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    return () => ro.disconnect();
  }, []);

  // Hàm tải dữ liệu qua ServiceProvider
  // sortFieldOverride / sortOrderOverride cho phép truyền giá trị sort mới ngay lập tức
  // (tránh race condition khi state chưa cập nhật)
  const fetchData = useCallback(
    async (
      pageToLoad = actualPage,
      sizeToLoad = actualPageSize,
      currentFilters = effectiveFilters,
      sortFieldOverride?: string,
      sortOrderOverride?: "ascend" | "descend" | null,
    ) => {
      if (!serviceProvider) return;

      // Dùng override nếu có, không thì dùng state hiện tại
      const activeSortField =
        sortFieldOverride !== undefined ? sortFieldOverride : sortField;
      const activeSortOrder =
        sortOrderOverride !== undefined ? sortOrderOverride : sortOrder;

      setInternalLoading(true);
      try {
        const req = new BaseSearchRequest({
          maxResultCount: sizeToLoad,
          skipCount: (pageToLoad - 1) * sizeToLoad,
          sorting: activeSortField
            ? `${activeSortField} ${activeSortOrder === "descend" ? "DESC" : "ASC"}`
            : undefined,
          ...currentFilters,
        });

        const res = await serviceProvider.searchAsync(req);
        let items: T[] = [];
        let totalCount = 0;

        if (res instanceof BaseSearchResponse) {
          items = res.items as T[];
          totalCount = res.totalCount;
        } else if (
          res &&
          typeof res === "object" &&
          "items" in res &&
          Array.isArray((res as { items: unknown }).items)
        ) {
          const typedRes = res as { items: T[]; totalCount?: number };
          items = typedRes.items;
          totalCount =
            typeof typedRes.totalCount === "number"
              ? typedRes.totalCount
              : items.length;
        } else if (Array.isArray(res)) {
          items = res as T[];
          totalCount = res.length;
        }

        setInternalData(items);
        setInternalTotal(totalCount);
        onLoadFinished?.(items);
      } catch (err) {
        console.error(
          "[CommonTable] Error loading data from serviceProvider:",
          err,
        );
      } finally {
        setInternalLoading(false);
      }
    },
    [
      serviceProvider,
      actualPage,
      actualPageSize,
      effectiveFilters,
      sortField,
      sortOrder,
      onLoadFinished,
    ],
  );

  // Tự động load lần đầu nếu bật serviceProvider và không cấm
  useEffect(() => {
    if (isServiceProviderMode && !disableInitialSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- nạp dữ liệu ban đầu cho bảng
      void fetchData(1, actualPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý đổi trang
  const handlePageChange = useCallback(
    (nextPage: number, nextSize: number) => {
      if (isServiceProviderMode) {
        setInternalPage(nextPage);
        setInternalPageSize(nextSize);
        void fetchData(nextPage, nextSize);
      }
      onPageChange?.(nextPage, nextSize);
    },
    [isServiceProviderMode, fetchData, onPageChange],
  );

  // Xử lý đổi sắp xếp
  // sorterObj.columnKey luôn khớp với columnKey được đặt tường minh trên cột (= col.sortField || col.dataIndex)
  const handleSortChange: NonNullable<TableProps<T>["onChange"]> = useCallback(
    (_pagination, _filters, sorter) => {
      const sorterObj = Array.isArray(sorter) ? sorter[0] : sorter;
      const field = sorterObj?.columnKey as string | undefined;
      const order = sorterObj?.order ?? null;

      setSortField(field);
      setSortOrder(order);

      if (isServiceProviderMode) {
        setInternalPage(1);
        void fetchData(1, actualPageSize, effectiveFilters, field, order);
      }
      onSortChange?.(field ?? "", order);
    },
    [
      isServiceProviderMode,
      actualPageSize,
      effectiveFilters,
      fetchData,
      onSortChange,
    ],
  );

  // Expose các phương thức điều khiển qua Ref
  useImperativeHandle(
    ref,
    () => ({
      reload: async (resetPaging = false) => {
        const targetPage = resetPaging ? 1 : actualPage;
        if (resetPaging) setInternalPage(1);
        if (isServiceProviderMode) {
          await fetchData(targetPage, actualPageSize);
        }
      },
      getSelectedItems: () => {
        const keyMap = new Set(selectedRowKeys);
        return actualData.filter((item) =>
          keyMap.has(item?.[dataKey] as React.Key),
        );
      },
      setSelectedItems: (items: T[]) => {
        setSelectedRowKeys(items.map((it) => it?.[dataKey] as React.Key));
      },
      setPage: (newPage: number) => {
        handlePageChange(newPage, actualPageSize);
      },
      setPageSize: (newSize: number) => {
        handlePageChange(1, newSize);
      },
      getCurrentPage: () => actualPage,
      getPageSize: () => actualPageSize,
      getTotal: () => actualTotal,
      getRecords: () => actualData,
      setFilters: (newFilters: Record<string, unknown>) => {
        setFilterOverrides(newFilters);
        setInternalPage(1);
        if (isServiceProviderMode) {
          void fetchData(1, actualPageSize, {
            ...(filters || {}),
            ...newFilters,
          });
        }
      },
    }),
    [
      actualPage,
      actualPageSize,
      actualTotal,
      actualData,
      dataKey,
      isServiceProviderMode,
      fetchData,
      handlePageChange,
      selectedRowKeys,
      filters,
    ],
  );

  // Row selection handler
  const rowSelection: TableProps<T>["rowSelection"] = useMemo(() => {
    if (!options?.enableSelection) return undefined;

    return {
      type: options.selectionMode === "single" ? "radio" : "checkbox",
      selectedRowKeys,
      onChange: (keys: React.Key[], rows: T[]) => {
        setSelectedRowKeys(keys);
        if (options.selectionMode === "single") {
          options.selectionChange?.(rows[0]);
        } else {
          options.selectionChange?.(rows);
        }
      },
      getCheckboxProps: (record: T) => ({
        disabled: options.customSelectionFilter
          ? !options.customSelectionFilter(record)
          : false,
      }),
      fixed: true,
      columnWidth: 46,
    };
  }, [options, selectedRowKeys]);

  // Xây dựng các cột Ant Design từ mainColumns
  const generatedColumns = useMemo(() => {
    const list: NonNullable<TableProps<T>["columns"]> = [];

    // 1. Cột STT tự động
    if (!options?.hideSttColumn) {
      list.push({
        key: "__stt",
        title: "STT",
        align: "center",
        width: 60,
        fixed: "left",
        render: (_: unknown, __: T, index: number) => {
          const continuousIndex = (actualPage - 1) * actualPageSize + index + 1;
          return (
            <span
              style={{
                fontSize: fontSizeMd,
                color: textSecondary,
                fontWeight: fontWeightMedium,
              }}
            >
              {continuousIndex}
            </span>
          );
        },
        onHeaderCell: () => ({
          style: {
            background: tableHeaderBg,
            fontWeight: fontWeightBold,
            fontSize: fontSizeMd,
            textTransform: "uppercase",
            textAlign: "center",
          },
        }),
      });
    }

    // 2. Chuyển đổi từng TableColumnOption thành AntD Column
    const activeColumns = (options?.mainColumns || []).filter((col) => {
      if (typeof col.hide === "function") return !col.hide();
      return !col.hide;
    });

    activeColumns.forEach((col) => {
      const colTitle =
        typeof col.title === "function"
          ? col.title()
          : col.title || col.label || "";
      // colField = single source of truth cho sort: sortField → dataIndex
      const colField = (col.sortField ?? col.dataIndex) as string;
      const isSortable = Boolean(col.allowSort || col.sorter);
      const safeMinWidth = getHeaderMinWidth(colTitle, isSortable);

      // Tính bề rộng thực tế đảm bảo không bị cắt chữ header
      let finalWidth: number | string | undefined = col.width;
      if (typeof col.width === "number") {
        finalWidth = Math.max(col.width, safeMinWidth);
      } else if (!col.width && safeMinWidth > 0) {
        finalWidth = safeMinWidth;
      }

      // Sorter: chỉ bật cờ để thu thập tham số sắp xếp gửi API (không sort memory)
      const effectiveSorter = Boolean(col.allowSort || col.sorter);
      // isCurrentSorted: so sánh chính xác với colField — không fallback
      const isCurrentSorted =
        effectiveSorter && Boolean(sortOrder) && sortField === colField;

      const antdCol: Record<string, unknown> = {
        // key và columnKey đều = colField — nguồn thực sự duy nhất, sorter callback trả đúng giá trị này
        key: colField || colTitle,
        dataIndex: col.dataIndex,
        title: colTitle,
        width: finalWidth,
        align: col.align || "left",
        fixed: col.fixed,
        ellipsis: false,
        sorter: effectiveSorter,
        columnKey: colField,
        sortOrder: isCurrentSorted ? sortOrder : null,
        showSorterTooltip: false,
        sortDirections: ["ascend", "descend", null],
        sortIcon: themeToken.tableSortIcon || tableSortIcon,
        onHeaderCell: () => ({
          className: isCurrentSorted
            ? "ant-table-column-has-sorters ant-table-column-sort"
            : effectiveSorter
              ? "ant-table-column-has-sorters"
              : undefined,
          style: {
            background: isCurrentSorted ? "#f8fafc" : tableHeaderBg,
            fontWeight: fontWeightBold,
            fontSize: fontSizeMd,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            cursor: effectiveSorter ? "pointer" : undefined,
            textAlign: col.align || "left",
          },
        }),
      };

      // Custom cell renderer dựa theo TableColumnType
      antdCol.render = (value: unknown, row: T, index: number) => {
        // Lấy giá trị chính
        const rawVal = col.valueRef ? col.valueRef(row, index) : value;

        // Custom render trực tiếp từ options nếu được định nghĩa
        if (col.render) {
          return col.render(rawVal, row, index);
        }

        switch (col.type) {
          // ── TwoLine (Chuẩn hiển thị Tên / Mã tài sản hoặc Cán bộ / Ngày) ──
          case TableColumnType.TwoLine: {
            const primaryText = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
            const subVal = col.subValueRef
              ? col.subValueRef(row, index)
              : col.subField
                ? (row as Record<string, unknown>)[col.subField]
                : undefined;
            const secondaryText =
              subVal !== undefined && subVal !== null
                ? String(subVal)
                : undefined;
            let formattedSub = secondaryText;
            if (
              secondaryText &&
              (col.subFormat || /^\d{4}-\d{2}-\d{2}/.test(secondaryText))
            ) {
              const d = dayjs(secondaryText);
              if (d.isValid()) {
                formattedSub = d.format(
                  col.subFormat ||
                    (secondaryText.includes("T") || secondaryText.includes(":")
                      ? "DD/MM/YYYY HH:mm:ss"
                      : "DD/MM/YYYY"),
                );
              }
            }

            return (
              <div style={{ maxWidth: "100%", overflow: "hidden" }}>
                {col.onClick ? (
                  <a
                    title={col.cellTitle ? col.cellTitle(row) : primaryText}
                    onClick={() => col.onClick?.(row)}
                    style={cellTitleStyle}
                  >
                    {primaryText}
                  </a>
                ) : (
                  <span
                    title={col.cellTitle ? col.cellTitle(row) : primaryText}
                    style={{ ...cellTitleStyle, cursor: "default" }}
                  >
                    {primaryText}
                  </span>
                )}
                {formattedSub && (
                  <span title={formattedSub} style={cellSubtitleStyle}>
                    {formattedSub}
                  </span>
                )}
              </div>
            );
          }

          // ── Status (Pill Badge bo tròn 2 đầu chuẩn UI Hàng hải) ──
          case TableColumnType.Status: {
            if (!rawVal) return '';
            const statusStr = String(rawVal);
            const statusKey = statusStr.toUpperCase();

            // 1. Tìm trong mapping riêng của cột nếu có
            let matchedLabel = statusStr;
            let matchedColor = statusDraft;

            if (col.statusMapping) {
              if (Array.isArray(col.statusMapping)) {
                const found = col.statusMapping.find(
                  (m) =>
                    String(m.value).toUpperCase() === statusKey ||
                    m.label === rawVal,
                );
                if (found) {
                  matchedLabel = found.label || String(found.value);
                  matchedColor = found.color || statusDraft;
                }
              } else if (
                col.statusMapping[statusStr] ||
                col.statusMapping[statusKey]
              ) {
                const found =
                  col.statusMapping[statusStr] || col.statusMapping[statusKey];
                matchedLabel = found.label;
                matchedColor = found.color;
              }
            } else if (
              DEFAULT_STATUS_MAP[statusStr] ||
              DEFAULT_STATUS_MAP[statusKey]
            ) {
              // 2. Tìm trong mapping mặc định của hệ thống
              const found =
                DEFAULT_STATUS_MAP[statusStr] || DEFAULT_STATUS_MAP[statusKey];
              matchedLabel = found.label;
              matchedColor = found.color;
            }

            return (
              <span style={statusBadgeStyle(matchedColor)}>{matchedLabel}</span>
            );
          }

          // ── Date (DD/MM/YYYY) ──
          case TableColumnType.Date: {
            if (!rawVal) return '';
            const fmt = col.format || 'DD/MM/YYYY';
            const dateStr = dayjs(rawVal as string | number | Date).isValid()
              ? dayjs(rawVal as string | number | Date).format(fmt)
              : String(rawVal);
            return <span style={{ color: textSecondary }}>{dateStr}</span>;
          }

          // ── DateTime (DD/MM/YYYY HH:mm:ss) ──
          case TableColumnType.DateTime: {
            if (!rawVal) return '';
            const fmt = col.format || 'DD/MM/YYYY HH:mm:ss';
            const dtStr = dayjs(rawVal as string | number | Date).isValid()
              ? dayjs(rawVal as string | number | Date).format(fmt)
              : String(rawVal);
            return <span style={{ color: textSecondary }}>{dtStr}</span>;
          }

          // ── NumberFormatted (1,000 / 1.000) ──
          case TableColumnType.NumberFormatted:
          case TableColumnType.Number: {
            if (rawVal === undefined || rawVal === null || rawVal === '') return '';
            const num = Number(rawVal);
            if (isNaN(num)) return String(rawVal);
            const formatted = new Intl.NumberFormat("vi-VN").format(num);
            return (
              <span
                style={{
                  fontWeight: col.bold ? fontWeightBold : fontWeightMedium,
                }}
              >
                {formatted}
              </span>
            );
          }

          // ── Money (1.000.000 đ) ──
          case TableColumnType.Money: {
            if (rawVal === undefined || rawVal === null || rawVal === '') return '';
            const num = Number(rawVal);
            if (isNaN(num)) return String(rawVal);
            const formatted = new Intl.NumberFormat("vi-VN").format(num) + " đ";
            return (
              <span
                style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}
              >
                {formatted}
              </span>
            );
          }

          // ── Text / Description (Mặc định: hiển thị ellipsis + title chuẩn) ──
          case TableColumnType.Text:
          case TableColumnType.Description:
          default: {
            const textStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
            const shouldEllipsis = col.ellipsis !== false;

            if (shouldEllipsis) {
              return (
                <span
                  title={col.showTooltip !== false ? textStr : undefined}
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: col.bold ? fontWeightBold : undefined,
                  }}
                >
                  {textStr}
                </span>
              );
            }
            return (
              <span
                title={col.showTooltip ? textStr : undefined}
                style={{ fontWeight: col.bold ? fontWeightBold : undefined }}
              >
                {textStr}
              </span>
            );
          }
        }
      };

      list.push(
        antdCol as unknown as NonNullable<TableProps<T>["columns"]>[number],
      );
    });

    // 3. Cột Thao tác hành động (Action Column)
    if (!options?.hideActionColumn && options?.actions) {
      list.push({
        key: "actions",
        title: "",
        width: ACTION_COLUMN_WIDTH,
        fixed: "right",
        align: "center",
        onHeaderCell: () => ({
          style: {
            background: tableHeaderBg,
            width: ACTION_COLUMN_WIDTH,
            maxWidth: ACTION_COLUMN_WIDTH,
            textAlign: "center",
            paddingInline: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        }),
        onCell: () => ({
          className: "common-table-action-cell",
          style: {
            width: ACTION_COLUMN_WIDTH,
            minWidth: ACTION_COLUMN_WIDTH,
            maxWidth: ACTION_COLUMN_WIDTH,
            paddingInline: 0,
            paddingLeft: 0,
            paddingRight: 0,
            textAlign: "center",
            verticalAlign: "middle",
            background: "#ffffff",
            zIndex: 10,
            overflow: "visible",
            textOverflow: "clip",
          },
        }),
        render: (_: unknown, record: T) => {
          const actionsList: TableActionOption<T>[] =
            typeof options.actions === "function"
              ? options.actions(record)
              : options.actions || [];
          const visibleActions = actionsList.filter(
            (act) => !act.hide?.(record),
          );

          if (visibleActions.length === 0) return null;

          // Chế độ Dropdown 3 chấm tròn chuẩn UI
          if (options.isDropdownAction !== false) {
            const menuItems: MenuProps["items"] = visibleActions.map(
              (act, i) => ({
                key: String(act.label || act.title || i),
                label: act.label || act.title,
                icon: act.icon,
                danger: act.danger,
                disabled:
                  typeof act.disabled === "function"
                    ? act.disabled(record)
                    : act.disabled,
                onClick: () => {
                  if (act.executeAsync) {
                    void act.executeAsync(record);
                  } else if (act.onClick) {
                    void act.onClick(record);
                  }
                },
              }),
            );

            return (
              <span
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RowActionDropdown items={menuItems} themeToken={themeToken} />
              </span>
            );
          }

          // Chế độ inline buttons
          return (
            <div
              style={{
                display: "inline-flex",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {visibleActions.map((act, i) => (
                <Tooltip key={i} title={act.label || act.title}>
                  <Button
                    size="small"
                    danger={act.danger}
                    icon={act.icon}
                    disabled={
                      typeof act.disabled === "function"
                        ? act.disabled(record)
                        : act.disabled
                    }
                    onClick={() => {
                      if (act.executeAsync) void act.executeAsync(record);
                      else if (act.onClick) void act.onClick(record);
                    }}
                  />
                </Tooltip>
              ))}
            </div>
          );
        },
      });
    }

    return list;
  }, [
    options,
    actualPage,
    actualPageSize,
    sortField,
    sortOrder,
    tableHeaderBg,
    textSecondary,
    colors.sidebarBg,
    themeToken,
  ]);

  // Tính toán độ rộng cuộn ngang an toàn
  const declaredColumnsWidth = useMemo(() => {
    return generatedColumns.reduce((acc, col) => {
      const w = typeof col.width === "number" ? col.width : 0;
      return acc + w;
    }, 0);
  }, [generatedColumns]);

  const customScrollX = options?.scroll?.x;
  const resolvedScrollX = useMemo(() => {
    if (typeof customScrollX === "number") return customScrollX;
    if (customScrollX === "max-content") {
      return Math.max(
        declaredColumnsWidth,
        measuredTableWidth ?? layout.listTableMinWidth,
      );
    }
    return Math.max(declaredColumnsWidth, layout.listTableMinWidth);
  }, [customScrollX, declaredColumnsWidth, measuredTableWidth]);

  return (
    <div
      ref={tableShellRef}
      className={`common-table-shell ${className || ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        ...style,
      }}
    >
      {/* Kẻ sọc hàng chẵn lẻ tinh tế và triệt tiêu ellipsis trên cột hành động */}
      <style>{`
        ${
          tableRowStripeBg !== "transparent"
            ? `
          .common-table-shell .list-view-row-stripe > td { background: ${tableRowStripeBg} !important; }
          .common-table-shell .list-view-row-stripe > td.ant-table-cell-fix-left,
          .common-table-shell .list-view-row-stripe > td.ant-table-cell-fix-right { background: ${tableRowStripeBg} !important; }
        `
            : ""
        }
        .common-table-shell .ant-table-tbody > tr > td.common-table-action-cell,
        .common-table-shell .ant-table-tbody > tr > td.ant-table-cell-fix-right:last-child {
          text-overflow: clip !important;
          overflow: visible !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          padding-inline: 0 !important;
        }
        .common-table-shell .ant-table-column-sorter-tooltip,
        .common-table-shell .ant-table-thead .ant-tooltip,
        .ant-tooltip:has(.ant-table-column-sorter-tooltip) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Hiển thị lỗi có nút Thử lại nếu có */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: 8,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: statusCritical,
            }}
          >
            <ExclamationCircleOutlined />
            <span>
              {typeof error === "string"
                ? error
                : "Có lỗi xảy ra khi tải dữ liệu."}
            </span>
          </div>
          {onRetry && (
            <Button size="small" onClick={onRetry}>
              Thử lại
            </Button>
          )}
        </div>
      )}

      {/* Thân bảng chính */}
      <Spin spinning={actualLoading}>
        <Table<T>
          className="list-view-table"
          showSorterTooltip={false}
          rowKey={(record: T) =>
            (record[dataKey] ??
              (record as Record<string, unknown>).id ??
              (record as Record<string, unknown>).key) as React.Key
          }
          dataSource={actualData}
          columns={generatedColumns}
          rowSelection={rowSelection}
          pagination={false}
          tableLayout="fixed"
          bordered={options?.bordered}
          scroll={{
            x: resolvedScrollX,
            y: options?.scroll?.y,
          }}
          rowClassName={(_: T, index: number) =>
            index % 2 === 1 ? "list-view-row-stripe" : ""
          }
          locale={{
            emptyText: emptyState || options?.emptyText || (
              <EmptyState
                title="Không có dữ liệu"
                description="Không tìm thấy bản ghi nào phù hợp với điều kiện tìm kiếm."
              />
            ),
          }}
          onChange={handleSortChange}
        />
      </Spin>

      {/* Thanh phân trang tích hợp */}
      {options?.enablePaging !== false && (
        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <Pagination
            total={actualTotal}
            current={actualPage}
            pageSize={actualPageSize}
            pageSizeOptions={options?.pageSizeOptions || [20, 50, 100, 5000]}
            onChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export const CommonTable = forwardRef(CommonTableInternal) as <
  T extends Record<string, unknown>,
>(
  props: CommonTableProps<T> & { ref?: React.ForwardedRef<CommonTableRef<T>> },
) => React.ReactElement;

export default CommonTable;
