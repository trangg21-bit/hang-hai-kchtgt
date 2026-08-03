// ── Document Zod schemas ────────────────────────────────────────────────

import { z } from 'zod';

// File upload schema
export const documentUploadSchema = z.object({
  file: z.instanceof(File).refine((f) => f.size > 0, {
    message: 'File upload không được để trống',
  }),
});

export type DocumentUploadValues = z.infer<typeof documentUploadSchema>;

// File size validation (10MB limit)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= MAX_FILE_SIZE, {
      message: 'Kích thước file tối đa 10MB',
    })
    .refine((f) => f.size > 0, {
      message: 'File upload không được để trống',
    }),
});

export type FileSchemaValues = z.infer<typeof fileSchema>;
