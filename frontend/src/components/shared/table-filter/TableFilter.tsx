import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tooltip,
  InputNumber,
  Checkbox,
} from 'antd';
import type { Dayjs } from 'dayjs';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useThemeToken } from '../../../context/ThemeTokenContext';
import {
  colors,
  radiusPill,
  spaceSm,
  spaceFormField,
  fontSizeMd,
  fontWeightBold,
  borderDefault,
  textSecondary,
  actionPrimary,
  controlHeight,
} from '../../../tokens';
import { getRangePickerProps, getDatePickerProps } from '../../../themetokenchk';
import OrgUnitTreeSelect from '../../org-unit/OrgUnitTreeSelect';
import type {
  FilterOption,
  FilterControlOption,
  FilterAndControlConfig,
  TableFilterRef,
} from './table-filter.model';

export interface TableFilterProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Cấu hình bộ lọc theo format FilterAndControlConfig (tương thích mefobase-core) */
  config?: FilterAndControlConfig<T>;
  /** Danh sách các trường bộ lọc (dùng khi không truyền config) */
  filters?: FilterOption<T>[];
  /** Danh sách các nút điều khiển footer (nếu muốn tùy chỉnh) */
  controls?: FilterControlOption<T>[];
  /** Callback khi người dùng nhấn Tìm kiếm hoặc gõ Enter trong ô tìm kiếm */
  onSearch?: (values: T) => void;
  /** Callback khi người dùng nhấn Làm mới (Reload) */
  onReset?: () => void;
  /** Giá trị ban đầu của các trường lọc */
  initialValues?: Partial<T>;
  /** Giá trị điều khiển từ bên ngoài (controlled mode) */
  values?: Partial<T>;
  /** Callback khi giá trị draft thay đổi */
  onChange?: (values: T) => void;
  /**
   * Chế độ hiển thị:
   * - 'panel': Toàn bộ thanh Sidebar (bao gồm vùng cuộn trường + footer 3 nút)
   * - 'fieldsOnly': Chỉ hiển thị các trường nhập liệu (dùng khi cắm vào FilterTableLayout)
   */
  mode?: 'panel' | 'fieldsOnly';
  /** Chiều rộng của panel filter (mặc định 280px ở chế độ panel) */
  width?: number | string;
  /** Ẩn thanh footer điều khiển */
  hideControls?: boolean;
  /** Ẩn nút phễu lọc nâng cao */
  hideFilterToggle?: boolean;
  /** Khoảng cách đẩy xuống từ đỉnh container (px) */
  filterTopOffset?: number;
  /** Trạng thái loading khi đang tìm kiếm */
  loading?: boolean;
  /** Class CSS tùy biến */
  className?: string;
  /** Style inline tùy biến */
  style?: React.CSSProperties;
}

function TableFilterInternal<T extends Record<string, unknown> = Record<string, unknown>>(
  props: TableFilterProps<T>,
  ref: React.ForwardedRef<TableFilterRef<T>>
) {
  const {
    config,
    filters: propFilters,
    controls: propControls,
    onSearch,
    onReset,
    initialValues,
    values: controlledValues,
    onChange,
    mode = 'panel',
    width = 280,
    hideControls: propHideControls,
    hideFilterToggle: propHideFilterToggle,
    filterTopOffset: propFilterTopOffset,
    loading: propLoading,
    className,
    style,
  } = props;

  const { cardStyle } = useThemeToken();

  // Gom các thuộc tính từ config hoặc props
  const filterList = useMemo(() => {
    return config?.filters ?? propFilters ?? [];
  }, [config?.filters, propFilters]);

  const controlList = useMemo(() => {
    return config?.controls ?? propControls;
  }, [config?.controls, propControls]);

  const searchCallback = config?.search ?? onSearch;
  const resetCallback = config?.reset ?? onReset;
  const hideControls = config?.hideControls ?? propHideControls ?? (mode === 'fieldsOnly');
  const hideFilterToggle = config?.hideFilterToggle ?? propHideFilterToggle ?? false;
  const filterTopOffset = config?.filterTopOffset ?? propFilterTopOffset ?? 0;
  const loading = config?.loading ?? propLoading ?? false;

  // Tính toán giá trị mặc định ban đầu từ filterList
  const defaultValuesFromConfig = useMemo(() => {
    const res: Record<string, unknown> = {};
    filterList.forEach((filter) => {
      if (filter.defaultValue !== undefined) {
        res[filter.key] = filter.defaultValue;
      }
    });
    return res as T;
  }, [filterList]);

  // Quản lý state nháp nội bộ
  const [draftValues, setDraftValues] = useState<T>(() => {
    return {
      ...defaultValuesFromConfig,
      ...(initialValues ?? {}),
      ...(controlledValues ?? {}),
    } as T;
  });

  // Quản lý trạng thái mở rộng bộ lọc nâng cao
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Kiểm tra xem có trường nâng cao nào không
  const hasAdvancedFilters = useMemo(() => {
    return filterList.some((f) => f.isAdvanced);
  }, [filterList]);

  // Đồng bộ draftValues khi controlledValues thay đổi từ bên ngoài (hỗ trợ Reset bộ lọc hoàn toàn)
  useEffect(() => {
    if (controlledValues !== undefined) {
      setDraftValues((controlledValues || {}) as T);
    }
  }, [controlledValues]);

  // Giá trị hiện hành: Ưu tiên controlledValues khi ở chế độ Controlled Component
  const currentValues = useMemo(() => {
    if (controlledValues !== undefined) {
      return (controlledValues || {}) as T;
    }
    return draftValues;
  }, [controlledValues, draftValues]);

  // Xử lý thay đổi giá trị một trường
  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      const next = { ...(currentValues as Record<string, unknown>), [key]: value } as T;
      setDraftValues(next);
      onChange?.(next);
      config?.onValuesChange?.(key, value, next);
      const filterItem = filterList.find((f) => f.key === key);
      filterItem?.onValueChange?.(value, next);
    },
    [config, currentValues, filterList, onChange]
  );

  // Xử lý tìm kiếm
  const handleSearch = useCallback(() => {
    searchCallback?.(currentValues);
  }, [currentValues, searchCallback]);

  // Xử lý làm mới
  const handleReset = useCallback(() => {
    const cleared: Record<string, unknown> = { ...defaultValuesFromConfig };
    filterList.forEach((filter) => {
      if (filter.defaultValue !== undefined) {
        cleared[filter.key] = filter.defaultValue;
      } else {
        cleared[filter.key] = undefined;
      }
    });
    setDraftValues(cleared as T);
    onChange?.(cleared as T);
    resetCallback?.();
    searchCallback?.(cleared as T);
  }, [defaultValuesFromConfig, filterList, onChange, resetCallback, searchCallback]);

  // Xử lý toggle bộ lọc nâng cao
  const handleToggleAdvance = useCallback(() => {
    setShowAdvanced((prev) => !prev);
  }, []);

  // Expose ref
  useImperativeHandle(
    ref,
    () => ({
      getValues: () => currentValues,
      setValues: (values: Partial<T>) => {
        setDraftValues((prev) => ({ ...prev, ...values }));
      },
      reset: handleReset,
      submit: handleSearch,
    }),
    [currentValues, handleReset, handleSearch]
  );

  // Render từng trường lọc
  const renderFilterItem = (filter: FilterOption<T>, index: number) => {
    // Kiểm tra điều kiện ẩn
    if (typeof filter.hidden === 'function') {
      if (filter.hidden(currentValues)) return null;
    } else if (filter.hidden) {
      return null;
    }

    // Nếu là trường nâng cao và chưa mở thì ẩn
    if (filter.isAdvanced && !showAdvanced) {
      return null;
    }

    const value = currentValues[filter.key];

    return (
      <div
        key={filter.key}
        className={filter.className}
        style={{
          marginTop: index === 0 ? spaceFormField : undefined,
          marginBottom: spaceFormField,
          ...filter.style,
        }}
      >
        {/* Tiêu đề trường */}
        {filter.type !== 'checkbox' && (
          <div
            style={{
              color: colors.sidebarBg,
              fontWeight: fontWeightBold,
              fontSize: fontSizeMd,
              marginBottom: spaceSm,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span>{filter.label}</span>
            {filter.required && (
              <span style={{ color: '#E34948', marginLeft: 4 }}>*</span>
            )}
          </div>
        )}

        {/* Component nhập liệu theo từng loại */}
        {renderControlByType(filter, value)}
      </div>
    );
  };

  // Render control tương ứng với type
  const renderControlByType = (filter: FilterOption<T>, value: unknown) => {
    const { key, type, disabled, required, allowClear = true, showSearch = true } = filter;

    switch (type) {
      case 'text':
        return (
          <Input
            value={(value as string) ?? ''}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder={
              (filter.placeholder as string) || `Tìm theo ${filter.label.toLowerCase()}`
            }
            allowClear={allowClear}
            disabled={disabled}
            prefix={<SearchOutlined style={{ color: '#93A3B3', marginRight: 4 }} />}
            style={{
              borderRadius: radiusPill,
              height: controlHeight,
              width: '100%',
            }}
            {...(filter.inputProps as React.ComponentProps<typeof Input>)}
          />
        );

      case 'select':
        return (
          <Select
            value={value as string | number | undefined}
            onChange={(val) => handleFieldChange(key, val)}
            placeholder={
              (filter.placeholder as string) || `Chọn ${filter.label.toLowerCase()}`
            }
            allowClear={allowClear}
            showSearch={showSearch}
            optionFilterProp="label"
            disabled={disabled}
            options={filter.options}
            style={{
              width: '100%',
              borderRadius: radiusPill,
              height: controlHeight,
            }}
            {...(filter.selectProps as React.ComponentProps<typeof Select>)}
          />
        );

      case 'treeSelect':
        if (filter.organizations) {
          return (
            <OrgUnitTreeSelect
              organizations={filter.organizations}
              value={(value as string) || undefined}
              onChange={(val) => {
                const nextVal = val === '__all__' ? undefined : val;
                handleFieldChange(key, nextVal);
              }}
              placeholder={(filter.placeholder as string) || 'Chọn đơn vị...'}
              allowClear={allowClear}
              disabled={disabled}
              showPath
              allLabel="Tất cả"
              treeDefaultExpandAll={false}
              {...(filter.treeSelectProps as Record<string, unknown>)}
            />
          );
        }
        return (
          <Select
            value={value as string | number | undefined}
            onChange={(val) => handleFieldChange(key, val)}
            placeholder={(filter.placeholder as string) || 'Chọn...'}
            allowClear={allowClear}
            showSearch={showSearch}
            disabled={disabled}
            options={filter.options}
            style={{ width: '100%', borderRadius: radiusPill, height: controlHeight }}
            {...(filter.selectProps as React.ComponentProps<typeof Select>)}
          />
        );

      case 'dateRange': {
        const { popupClassName, ...rangeProps } = getRangePickerProps({
          placeholder: (filter.placeholder as [string, string]) || ['Từ ngày', 'Đến ngày'],
          ...(filter.dateProps as Record<string, unknown>),
        }) as { popupClassName?: string; [key: string]: unknown };
        return (
          <DatePicker.RangePicker
            value={value as [Dayjs | null, Dayjs | null] | null | undefined}
            onChange={(dates) => handleFieldChange(key, dates)}
            disabled={disabled}
            allowClear={allowClear}
            style={{
              width: '100%',
              borderRadius: radiusPill,
              height: controlHeight,
            }}
            classNames={{ popup: { root: popupClassName || 'chk-range-datepicker-popup' } }}
            {...rangeProps}
          />
        );
      }

      case 'date':
        return (
          <DatePicker
            value={value as Dayjs | null | undefined}
            onChange={(date) => handleFieldChange(key, date)}
            disabled={disabled}
            allowClear={allowClear}
            style={{
              width: '100%',
              borderRadius: radiusPill,
              height: controlHeight,
            }}
            {...getDatePickerProps({
              placeholder: (filter.placeholder as string) || 'Chọn ngày',
              ...(filter.dateProps as Record<string, unknown>),
            })}
          />
        );

      case 'number':
        return (
          <InputNumber
            value={value as number | null | undefined}
            onChange={(val) => handleFieldChange(key, val)}
            placeholder={
              (filter.placeholder as string) || `Nhập ${filter.label.toLowerCase()}`
            }
            disabled={disabled}
            style={{
              width: '100%',
              borderRadius: radiusPill,
              height: controlHeight,
            }}
            {...(filter.inputProps as React.ComponentProps<typeof InputNumber>)}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(key, e.target.checked)}
            disabled={disabled}
          >
            <span style={{ fontWeight: fontWeightBold, color: colors.sidebarBg }}>
              {filter.label}
            </span>
            {required && <span style={{ color: '#E34948', marginLeft: 4 }}>*</span>}
          </Checkbox>
        );

      case 'template':
        if (typeof filter.customComponent === 'function') {
          return filter.customComponent({
            value,
            onChange: (val) => handleFieldChange(key, val),
            values: currentValues,
            disabled,
          });
        }
        return filter.customComponent ?? null;

      default:
        return null;
    }
  };

  // Render các nút điều khiển footer
  const renderControls = () => {
    if (hideControls) return null;

    if (controlList && controlList.length > 0) {
      return (
        <div
          style={{
            borderTop: `1px solid ${borderDefault}`,
            padding: '12px 16px',
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {controlList.map((ctrl, idx) => {
            const isHidden =
              typeof ctrl.hide === 'function' ? ctrl.hide(currentValues) : ctrl.hide;
            if (isHidden) return null;

            const isDisabled =
              typeof ctrl.disabled === 'function'
                ? ctrl.disabled(currentValues)
                : ctrl.disabled;

            if (ctrl.type === 'reset') {
              return (
                <Tooltip key={idx} title={ctrl.tooltip || 'Làm mới bộ lọc'}>
                  <Button
                    icon={ctrl.icon || <ReloadOutlined />}
                    onClick={() => {
                      if (ctrl.action) {
                        ctrl.action(currentValues);
                      } else {
                        handleReset();
                      }
                    }}
                    shape="circle"
                    disabled={isDisabled}
                    className={ctrl.className}
                    style={{
                      color: textSecondary,
                      borderColor: borderDefault,
                      width: 38,
                      height: 38,
                      fontSize: fontSizeMd,
                      flexShrink: 0,
                      ...ctrl.style,
                    }}
                  />
                </Tooltip>
              );
            }

            if (ctrl.type === 'search') {
              return (
                <Button
                  key={idx}
                  type="primary"
                  icon={ctrl.icon || <SearchOutlined />}
                  onClick={() => {
                    if (ctrl.action) {
                      ctrl.action(currentValues);
                    } else {
                      handleSearch();
                    }
                  }}
                  loading={loading}
                  disabled={isDisabled}
                  className={ctrl.className}
                  style={{
                    background: actionPrimary,
                    borderColor: actionPrimary,
                    borderRadius: radiusPill,
                    height: controlHeight,
                    fontSize: fontSizeMd,
                    padding: '0 14px',
                    fontWeight: 500,
                    ...ctrl.style,
                  }}
                >
                  {ctrl.label || 'Tìm kiếm'}
                </Button>
              );
            }

            if (ctrl.type === 'advance') {
              return (
                <Tooltip
                  key={idx}
                  title={
                    ctrl.tooltip ||
                    (showAdvanced
                      ? 'Thu gọn bộ lọc nâng cao'
                      : 'Mở rộng bộ lọc nâng cao')
                  }
                >
                  <Button
                    icon={ctrl.icon || <FilterOutlined />}
                    onClick={handleToggleAdvance}
                    shape="circle"
                    disabled={isDisabled}
                    className={ctrl.className}
                    style={{
                      color: showAdvanced ? actionPrimary : textSecondary,
                      borderColor: showAdvanced ? actionPrimary : borderDefault,
                      background: showAdvanced ? `${actionPrimary}15` : undefined,
                      width: 38,
                      height: 38,
                      fontSize: fontSizeMd,
                      flexShrink: 0,
                      ...ctrl.style,
                    }}
                  />
                </Tooltip>
              );
            }

            return (
              <Button
                key={idx}
                icon={ctrl.icon}
                onClick={() => ctrl.action?.(draftValues)}
                disabled={isDisabled}
                className={ctrl.className}
                style={{
                  borderRadius: radiusPill,
                  height: controlHeight,
                  fontSize: fontSizeMd,
                  ...ctrl.style,
                }}
              >
                {ctrl.label}
              </Button>
            );
          })}
        </div>
      );
    }

    // Controls mặc định chuẩn (khớp đúng 100% hình ảnh người dùng cung cấp)
    return (
      <div
        style={{
          borderTop: `1px solid ${borderDefault}`,
          padding: '12px 16px',
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Nút Reload tròn */}
        <Tooltip title="Làm mới bộ lọc">
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            shape="circle"
            style={{
              color: textSecondary,
              borderColor: borderDefault,
              width: 38,
              height: 38,
              fontSize: fontSizeMd,
              flexShrink: 0,
            }}
          />
        </Tooltip>

        {/* Nút Tìm kiếm viên thuốc xanh navy */}
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          style={{
            background: actionPrimary,
            borderColor: actionPrimary,
            borderRadius: radiusPill,
            height: controlHeight,
            fontSize: fontSizeMd,
            padding: '0 14px',
            fontWeight: 500,
          }}
        >
          Tìm kiếm
        </Button>

        {/* Nút Phễu lọc tròn */}
        {!hideFilterToggle && hasAdvancedFilters && (
          <Tooltip
            title={
              showAdvanced
                ? 'Thu gọn bộ lọc nâng cao'
                : 'Mở rộng bộ lọc nâng cao'
            }
          >
            <Button
              icon={<FilterOutlined />}
              onClick={handleToggleAdvance}
              shape="circle"
              style={{
                color: showAdvanced ? actionPrimary : textSecondary,
                borderColor: showAdvanced ? actionPrimary : borderDefault,
                background: showAdvanced ? `${actionPrimary}15` : undefined,
                width: 38,
                height: 38,
                fontSize: fontSizeMd,
                flexShrink: 0,
              }}
            />
          </Tooltip>
        )}
      </div>
    );
  };

  // Nếu ở chế độ fieldsOnly (ví dụ dùng cho prop filterContent của FilterTableLayout)
  if (mode === 'fieldsOnly') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: filterTopOffset > 0 ? filterTopOffset : undefined,
          ...style,
        }}
      >
        {filterList.map((filter, index) => renderFilterItem(filter, index))}
      </div>
    );
  }

  // Chế độ 'panel' mặc định (toàn bộ cột Sidebar có cuộn dọc và footer cố định)
  return (
    <div
      className={className}
      style={{
        ...cardStyle,
        width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 0,
        ...style,
      }}
    >
      {/* Vùng cuộn dọc các trường lọc */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          paddingRight: 16,
          paddingBottom: 12,
          paddingLeft: 16,
          paddingTop: filterTopOffset > 0 ? filterTopOffset : 0,
        }}
      >
        {filterList.map((filter, index) => renderFilterItem(filter, index))}
      </div>

      {/* Thanh footer nút hành động cố định ở đáy */}
      {renderControls()}
    </div>
  );
}

export const TableFilter = forwardRef(TableFilterInternal) as <
  T extends Record<string, unknown> = Record<string, unknown>
>(
  props: TableFilterProps<T> & { ref?: React.ForwardedRef<TableFilterRef<T>> }
) => React.ReactElement;

export default TableFilter;
