-- V71: Rename hinh_anh column in map_symbols table to image to match English naming convention
ALTER TABLE map_symbols RENAME COLUMN hinh_anh TO image;
