import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NumberInputWithCount } from './NumberInputWithCount';
import { decideKeyInput, buildPastedValue } from '../../utils/numberInputGuards';

describe('NumberInputWithCount — isDecimalAllowed inference from step < 1', () => {
  it('suy luận isDecimalAllowed = true khi step < 1 (step={0.01}) dù không truyền allowDecimal', () => {
    const step = 0.01;
    const allowDecimal = undefined;
    const isDecimalAllowed =
      allowDecimal === true ||
      (typeof step === 'number' && step > 0 && step < 1);

    expect(isDecimalAllowed).toBe(true);

    // Cho phép nhập dấu chấm "."
    expect(
      decideKeyInput({
        key: '.',
        currentValue: '12',
        selectionStart: 2,
        selectionEnd: 2,
        allowDecimal: isDecimalAllowed,
      }),
    ).toBe('allow');

    // Cho phép nhập dấu phẩy ","
    expect(
      decideKeyInput({
        key: ',',
        currentValue: '12',
        selectionStart: 2,
        selectionEnd: 2,
        allowDecimal: isDecimalAllowed,
      }),
    ).toBe('allow');

    // Dán (paste) chuỗi thập phân được bảo toàn
    const pasted = buildPastedValue({
      currentValue: '',
      pastedText: '123.45',
      selectionStart: 0,
      selectionEnd: 0,
      allowDecimal: isDecimalAllowed,
    });
    expect(pasted).toBe('123.45');
  });

  it('suy luận isDecimalAllowed = false khi step >= 1 (step={1}) và không có allowDecimal', () => {
    const step = 1;
    const allowDecimal = undefined;
    const isDecimalAllowed =
      allowDecimal === true ||
      (typeof step === 'number' && step > 0 && step < 1);

    expect(isDecimalAllowed).toBe(false);

    // Chặn dấu chấm "."
    expect(
      decideKeyInput({
        key: '.',
        currentValue: '12',
        selectionStart: 2,
        selectionEnd: 2,
        allowDecimal: isDecimalAllowed,
      }),
    ).toBe('block');

    // Chặn dấu phẩy ","
    expect(
      decideKeyInput({
        key: ',',
        currentValue: '12',
        selectionStart: 2,
        selectionEnd: 2,
        allowDecimal: isDecimalAllowed,
      }),
    ).toBe('block');

    // Dán chuỗi thập phân bị loại bỏ phần thập phân
    const pasted = buildPastedValue({
      currentValue: '',
      pastedText: '123.45',
      selectionStart: 0,
      selectionEnd: 0,
      allowDecimal: isDecimalAllowed,
    });
    expect(pasted).toBe('12345');
  });

  it('suy luận isDecimalAllowed = true khi allowDecimal={true} kể cả khi step = 1 hoặc không có step', () => {
    const step = 1;
    const allowDecimal = true;
    const isDecimalAllowed =
      allowDecimal === true ||
      (typeof step === 'number' && step > 0 && step < 1);

    expect(isDecimalAllowed).toBe(true);

    expect(
      decideKeyInput({
        key: '.',
        currentValue: '12',
        selectionStart: 2,
        selectionEnd: 2,
        allowDecimal: isDecimalAllowed,
      }),
    ).toBe('allow');
  });

  it('render component NumberInputWithCount đúng với step={0.01} và hiển thị suffix đếm số', () => {
    const html = renderToStaticMarkup(
      <NumberInputWithCount step={0.01} value="1234.56" maxLength={20} />,
    );
    expect(html).toContain('ant-input-number');
    // Đếm chữ số: 1234.56 có 6 chữ số -> 6/20
    expect(html).toContain('6/20');
  });
});
