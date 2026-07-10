-- V38: Align map_symbols table structure with the original project
ALTER TABLE map_symbols DROP COLUMN IF EXISTS category;
ALTER TABLE map_symbols DROP COLUMN IF EXISTS icon;
ALTER TABLE map_symbols DROP COLUMN IF EXISTS color;
ALTER TABLE map_symbols DROP COLUMN IF EXISTS symbol_value;
ALTER TABLE map_symbols ADD COLUMN IF NOT EXISTS hinh_anh TEXT;

UPDATE map_symbols SET hinh_anh = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+PGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTAiIGZpbGw9IiMxNjc3ZmYiLz48L3N2Zz4=' WHERE hinh_anh IS NULL;
