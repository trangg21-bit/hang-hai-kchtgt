import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import { getRangePickerProps, getDatePickerProps, appLocale } from '../themetokenchk';
import { ThemeTokenProvider } from '../context/ThemeTokenContext';
import * as themeTokenChk from '../themetokenchk';

describe('themetokenchk DatePicker format tests', () => {
  it('getRangePickerProps formats date to DD/MM/YYYY properly', () => {
    const props = getRangePickerProps({
      value: [dayjs('2026-09-30'), dayjs('2026-10-05')],
    });
    const html = renderToString(
      React.createElement(ConfigProvider, { locale: appLocale },
        React.createElement(DatePicker.RangePicker, props)
      )
    );
    expect(html).toContain('30/09/2026');
    expect(html).toContain('05/10/2026');
    expect(html).not.toContain('2026-09-30');
  });

  it('default DatePicker without format prop defaults to DD/MM/YYYY via appLocale', () => {
    const html = renderToString(
      React.createElement(ConfigProvider, { locale: appLocale },
        React.createElement(DatePicker, { value: dayjs('2026-09-30') })
      )
    );
    expect(html).toContain('30/09/2026');
    expect(html).not.toContain('2026-09-30');
  });

  it('DatePicker.RangePicker without format inside ThemeTokenProvider defaults to DD/MM/YYYY', () => {
    const html = renderToString(
      React.createElement(ThemeTokenProvider, { tokens: themeTokenChk as unknown as Parameters<typeof ThemeTokenProvider>[0]['tokens'] },
        React.createElement(DatePicker.RangePicker, {
          value: [dayjs('2026-09-30'), dayjs('2026-10-05')],
        })
      )
    );
    expect(html).toContain('30/09/2026');
    expect(html).toContain('05/10/2026');
    expect(html).not.toContain('2026-09-30');
  });

  it('getDatePickerProps formats single date to DD/MM/YYYY properly', () => {
    const props = getDatePickerProps({
      value: dayjs('2026-09-30'),
    });
    const html = renderToString(
      React.createElement(ConfigProvider, { locale: appLocale },
        React.createElement(DatePicker, props)
      )
    );
    expect(html).toContain('30/09/2026');
    expect(html).not.toContain('2026-09-30');
  });

  it('getRangePickerProps configures single-panel compact popup with chk-range-datepicker-popup', () => {
    const props = getRangePickerProps();
    expect(props.classNames.popup.root).toContain('chk-range-datepicker-popup');
    expect(props).not.toHaveProperty('popupClassName');
    const css = themeTokenChk.themeScopedCss('test-scope');
    expect(css).toContain('.chk-range-datepicker-popup .ant-picker-panel + .ant-picker-panel');
    expect(css).toContain('.chk-range-datepicker-popup .ant-picker-header button.ant-picker-header-next-btn');
  });

  it('verifies 13px font size configured for datepicker headers, day labels, and day cells', () => {
    const css = themeTokenChk.themeScopedCss('test-scope');
    expect(css).toContain('.chk-range-datepicker-popup .ant-picker-date-panel .ant-picker-content th');
    expect(css).toContain('.chk-range-datepicker-popup .ant-picker-date-panel .ant-picker-cell .ant-picker-cell-inner');
    expect(css).toMatch(/\.chk-range-datepicker-popup \.ant-picker-date-panel \.ant-picker-content th\s*\{[^}]*font-size:\s*13px\s*!important;/);
    expect(css).toMatch(/\.chk-range-datepicker-popup \.ant-picker-date-panel \.ant-picker-cell \.ant-picker-cell-inner\s*\{[^}]*font-size:\s*13px\s*!important;/);
  });

  it('getSidebarDatePickerProps with picker="year" sets format YYYY and chk-sidebar-datepicker-popup', () => {
    const props = themeTokenChk.getSidebarDatePickerProps({
      picker: 'year',
      value: dayjs('2026-05-15'),
    });
    expect(props.classNames.popup.root).toContain('chk-sidebar-datepicker-popup');
    expect(props).not.toHaveProperty('popupClassName');
    expect(props.format).toBe('YYYY');
    const html = renderToString(
      React.createElement(ConfigProvider, { locale: appLocale },
        React.createElement(DatePicker, props)
      )
    );
    expect(html).toContain('2026');
    const css = themeTokenChk.themeScopedCss('test-scope');
    expect(css).toContain('.chk-sidebar-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner');
    expect(css).toMatch(/\.chk-sidebar-datepicker-popup \.ant-picker-year-panel [^{]*\{[^}]*font-size:\s*13px\s*!important;/);
  });

  it('getDatePickerProps with picker="year" sets format YYYY and chk-form-datepicker-popup', () => {
    const props = getDatePickerProps({
      picker: 'year',
      value: dayjs('2024-01-01'),
    });
    expect(props.classNames.popup.root).toContain('chk-form-datepicker-popup');
    expect(props).not.toHaveProperty('popupClassName');
    expect(props.format).toBe('YYYY');
    const html = renderToString(
      React.createElement(ConfigProvider, { locale: appLocale },
        React.createElement(DatePicker, props)
      )
    );
    expect(html).toContain('2024');
    const css = themeTokenChk.themeScopedCss('test-scope');
    expect(css).toContain('.chk-form-datepicker-popup .ant-picker-year-panel .ant-picker-cell .ant-picker-cell-inner');
    expect(css).toMatch(/\.chk-form-datepicker-popup \.ant-picker-year-panel [^{]*\{[^}]*font-size:\s*13px\s*!important;/);
  });
});


