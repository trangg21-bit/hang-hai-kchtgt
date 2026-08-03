-- Rename legacy Vietnamese enum values to English in legal_documents table
UPDATE legal_documents SET document_type = 'LAW' WHERE document_type = 'LUAT';
UPDATE legal_documents SET document_type = 'DECREE' WHERE document_type = 'NGHI_DINH';
UPDATE legal_documents SET document_type = 'CIRCULAR' WHERE document_type = 'THONG_TU';
UPDATE legal_documents SET document_type = 'DECISION' WHERE document_type = 'QUYET_DINH';
UPDATE legal_documents SET status = 'EFFECTIVE' WHERE status = 'CON_HIEU_LUC';
UPDATE legal_documents SET status = 'EXPIRING_SOON' WHERE status = 'SAP_HET_HIEU_LUC';
UPDATE legal_documents SET status = 'EXPIRED' WHERE status = 'DA_HET_HIEU_LUC';
