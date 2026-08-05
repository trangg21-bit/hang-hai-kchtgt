package com.hanghai.kchtg.document;

import com.hanghai.kchtg.document.dto.AttachedDocumentResponse;
import com.hanghai.kchtg.document.entity.AttachedDocument;
import com.hanghai.kchtg.document.entity.LegalDocument;
import com.hanghai.kchtg.document.repository.AttachedDocumentRepository;
import com.hanghai.kchtg.document.repository.LegalDocumentHistoryRepository;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.repository.SearchLogRepository;
import com.hanghai.kchtg.document.repository.SearchResultRepository;
import com.hanghai.kchtg.document.repository.SearchSuggestionRepository;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LegalDocumentAttachmentServiceTest {

    @InjectMocks
    private LegalDocumentService service;

    @Mock
    private LegalDocumentRepository legalDocumentRepository;

    @Mock
    private AttachedDocumentRepository attachedDocumentRepository;

    @Mock
    private SearchLogRepository searchLogRepository;

    @Mock
    private SearchResultRepository searchResultRepository;

    @Mock
    private SearchSuggestionRepository searchSuggestionRepository;

    @Mock
    private LegalDocumentHistoryRepository legalDocumentHistoryRepository;

    private UUID documentId;
    private LegalDocument document;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        document = LegalDocument.builder()
                .documentName("Quy định kiểm thử")
                .documentNumber("TEST-01")
                .build();
        ReflectionTestUtils.setField(document, "id", documentId);
    }

    @Test
    void uploadAndDeleteAttachment_shouldPersistAndRemovePhysicalFile(@org.junit.jupiter.api.io.TempDir Path uploadDirectory)
            throws Exception {
        ReflectionTestUtils.setField(service, "uploadDir", uploadDirectory.toString());
        when(legalDocumentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(attachedDocumentRepository.save(any(AttachedDocument.class))).thenAnswer(invocation -> {
            AttachedDocument saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });

        MockMultipartFile file = new MockMultipartFile(
                "file", "quy-dinh.pdf", "application/pdf", "noi dung".getBytes(StandardCharsets.UTF_8));

        AttachedDocumentResponse response = service.uploadAttachment(documentId, file);

        assertEquals("quy-dinh.pdf", response.getDocumentName());
        Path[] storedFiles;
        try (var paths = Files.list(uploadDirectory)) {
            storedFiles = paths.toArray(Path[]::new);
        }
        assertEquals(1, storedFiles.length);
        assertEquals("noi dung", Files.readString(storedFiles[0]));
        verify(legalDocumentHistoryRepository).save(any());

        UUID attachmentId = response.getId();
        AttachedDocument storedAttachment = AttachedDocument.builder()
                .id(attachmentId)
                .legalDocument(document)
                .documentName(response.getDocumentName())
                .filePath(storedFiles[0].toString())
                .build();
        when(attachedDocumentRepository.findById(attachmentId)).thenReturn(Optional.of(storedAttachment));

        service.deleteAttachment(documentId, attachmentId);

        assertFalse(Files.exists(storedFiles[0]));
        verify(attachedDocumentRepository).delete(storedAttachment);
        verify(legalDocumentHistoryRepository, times(2)).save(any());
    }

    @Test
    void uploadAttachment_shouldRejectUnsupportedExtension() {
        ReflectionTestUtils.setField(service, "uploadDir", "target/test-uploads");
        when(legalDocumentRepository.findById(documentId)).thenReturn(Optional.of(document));
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.exe", "application/octet-stream", new byte[]{1});

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.uploadAttachment(documentId, file));

        assertTrue(error.getMessage().contains("Chỉ chấp nhận PDF, DOC, DOCX, JPG, JPEG, PNG"));
        verify(attachedDocumentRepository, never()).save(any());
    }
}
