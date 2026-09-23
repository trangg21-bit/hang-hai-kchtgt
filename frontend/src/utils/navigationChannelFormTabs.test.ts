import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  MAIN_FORM_DEFAULT_TAB,
  ROUTE_DRAWER_DEFAULT_TAB,
  firstErrorFieldName,
  firstErrorMessage,
  resolveMainFormTabForField,
  resolveRouteDrawerTabForField,
} from './navigationChannelFormTabs';

describe('Luồng hàng hải — tự động chuyển tab chứa trường bắt buộc bị bỏ trống (chuẩn /beacon-station)', () => {
  it('TC-TABJUMP-01: trường bắt buộc của tab "Thông tin chung" trả về basic-info', () => {
    ['orgUnitId', 'channelName', 'conditionStatus', 'provinceId', 'seaportId'].forEach((field) => {
      expect(resolveMainFormTabForField(field)).toBe(MAIN_FORM_DEFAULT_TAB);
    });
  });

  it('TC-TABJUMP-02: trường tọa độ / biểu tượng bản đồ trả về tab location (form chính)', () => {
    ['geometryType', 'mapIconId', 'symbolId', 'coordinateReferenceSystem', 'displayRule'].forEach((field) => {
      expect(resolveMainFormTabForField(field)).toBe('location');
    });
  });

  it('TC-TABJUMP-03: drawer "Tuyến luồng" — lỗi Tên tuyến luồng KHÔNG còn nhảy nhầm sang tab vị trí', () => {
    expect(resolveRouteDrawerTabForField('routeName')).toBe(ROUTE_DRAWER_DEFAULT_TAB);
    expect(resolveRouteDrawerTabForField('routeClassification')).toBe(ROUTE_DRAWER_DEFAULT_TAB);
    expect(resolveRouteDrawerTabForField('designDepthMeters')).toBe(ROUTE_DRAWER_DEFAULT_TAB);
    expect(resolveRouteDrawerTabForField('geometryType')).toBe('location');
    expect(resolveRouteDrawerTabForField('mapIconId')).toBe('location');
  });

  it('TC-TABJUMP-04: trường lạ (form bổ sung trường mới) luôn rơi về tab mặc định, không trả key tab rỗng', () => {
    expect(resolveMainFormTabForField('someFutureField')).toBe(MAIN_FORM_DEFAULT_TAB);
    expect(resolveMainFormTabForField('')).toBe(MAIN_FORM_DEFAULT_TAB);
    expect(resolveMainFormTabForField(undefined)).toBe(MAIN_FORM_DEFAULT_TAB);
    expect(resolveRouteDrawerTabForField(null)).toBe(ROUTE_DRAWER_DEFAULT_TAB);
  });

  it('TC-TABJUMP-05: lấy đúng trường lỗi ĐẦU TIÊN và thông điệp lỗi tiếng Việt của Ant Design', () => {
    const errorFields = [
      { name: ['channelName'], errors: ['Tên luồng hàng hải là bắt buộc'] },
      { name: ['conditionStatus'], errors: ['Tình trạng là bắt buộc'] },
    ];
    expect(firstErrorFieldName(errorFields)).toBe('channelName');
    expect(resolveMainFormTabForField(firstErrorFieldName(errorFields))).toBe(MAIN_FORM_DEFAULT_TAB);
    expect(firstErrorMessage(errorFields)).toBe('Tên luồng hàng hải là bắt buộc');
    expect(firstErrorFieldName([])).toBe('');
    expect(firstErrorMessage(undefined)).toContain('bắt buộc');
    expect(firstErrorMessage([{ name: [] }], 'dự phòng')).toBe('dự phòng');
  });

  it('TC-TABJUMP-06: hai form /navigation-channel và /navigation-channel-chk đều nối onFinishFailed + forceRender', () => {
    const readSource = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

    const mainForm = readSource('src/pages/navigationchannel/NavigationChannelForm.tsx');
    expect(mainForm).toContain('onFinishFailed={handleSubmitFailed}');
    expect(mainForm).toContain('resolveMainFormTabForField');
    expect(mainForm).toContain('resolveRouteDrawerTabForField');
    expect(mainForm).toContain('form.scrollToField');
    // 3 tab chính luôn được render → rule của tab chưa mở vẫn được validate và scroll tới được.
    expect(mainForm.match(/forceRender: true,/g)?.length).toBe(3);

    const chkForm = readSource('src/pages/navigationchannelchk/NavigationChannelChkForm.tsx');
    expect(chkForm).toContain('onFinishFailed={handleSubmitFailed}');
    expect(chkForm).toContain('resolveMainFormTabForField');
    expect(chkForm).toContain('form.scrollToField');
  });
});
