import { describe, expect, it } from 'vitest';
import { mergeAttachmentHistoryChanges } from './historyAttachmentDedup';

describe('mergeAttachmentHistoryChanges', () => {
  it('merges a multi-delete session into one full before/after snapshot', () => {
    const changes = [
      { field: 'Tài liệu đính kèm', oldValue: 'a.pdf, b.pdf', newValue: 'a.pdf' },
      { field: 'Tài liệu đính kèm', oldValue: 'a.pdf, b.pdf, c.pdf', newValue: 'a.pdf, b.pdf' },
    ];

    expect(mergeAttachmentHistoryChanges(changes)).toEqual([
      expect.objectContaining({
        field: 'Tài liệu đính kèm',
        oldValue: 'a.pdf, b.pdf, c.pdf',
        newValue: 'a.pdf',
      }),
    ]);
  });

  it('keeps an empty-to-file upload visible', () => {
    const changes = [
      { field: 'Tài liệu đính kèm', oldValue: '—', newValue: 'new-file.pdf' },
    ];

    expect(mergeAttachmentHistoryChanges(changes)).toEqual(changes);
  });
});
