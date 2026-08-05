package com.hanghai.kchtg.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentHistoryResponse;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.dto.SearchSuggestionResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.LegalDocumentHistoryAction;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(authorities = "ROLE_SYSTEM_ADMIN")
class LegalDocumentControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private LegalDocumentService legalDocumentService;

        private LegalDocumentResponse testResponse;
        private LegalDocumentCreateRequest createRequest;
        private UUID testId;
        private UUID testUserId;

        @BeforeEach
        void setUp() {
                testId = UUID.randomUUID();
                testUserId = UUID.randomUUID();
                testResponse = LegalDocumentResponse.builder()
                                .id(testId)
                                .documentName("Luật Giao thông đường thủy nội địa")
                                .documentNumber("50/2014/QH13")
                                .issuingAuthority("Quốc hội")
                                .issueDate(LocalDate.of(2014, 6, 25))
                                .effectiveDate(LocalDate.of(2015, 1, 1))
                                .documentType(DocumentType.LAW)
                                .applicationArea("Giao thông đường thủy")
                                .validityStatus(ValidityStatus.EFFECTIVE)
                                .createdBy(testUserId)
                                .build();

                createRequest = LegalDocumentCreateRequest.builder()
                                .documentName("Nghị định mới")
                                .documentNumber("01/2026/NĐ")
                                .issuingAuthority("Chính phủ")
                                .issueDate(LocalDate.of(2026, 1, 1))
                                .effectiveDate(LocalDate.of(2026, 1, 1))
                                .documentType(DocumentType.DECREE)
                                .validityStatus(ValidityStatus.EFFECTIVE)
                                .createdBy(testUserId)
                                .build();
        }

        @Test
        void listVanBan_shouldReturnAll() throws Exception {
                when(legalDocumentService.findAll(anyInt(), anyInt()))
                                .thenReturn(new PageImpl<>(java.util.Objects.requireNonNull(List.of(testResponse))));

                mockMvc.perform(get("/api/v1/legal-documents")
                                .param("page", "0").param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.content").isArray())
                                .andExpect(jsonPath("$.data.content[0].documentName").value("Luật Giao thông đường thủy nội địa"));
        }

        @Test
        void createVanBan_shouldReturnCreated() throws Exception {
                when(legalDocumentService.create(any(LegalDocumentCreateRequest.class)))
                                .thenReturn(testResponse);

                mockMvc.perform(post("/api/v1/legal-documents")
                                .contentType("application/json")
                                .content(java.util.Objects
                                                .requireNonNull(objectMapper.writeValueAsString(createRequest))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.documentName").value("Luật Giao thông đường thủy nội địa"));
        }

        @Test
        void getVanBan_shouldReturnOne() throws Exception {
                when(legalDocumentService.getById(testId)).thenReturn(testResponse);

                mockMvc.perform(get("/api/v1/legal-documents/" + testId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.documentName").value("Luật Giao thông đường thủy nội địa"));
        }

        @Test
        void updateVanBan_shouldReturnUpdated() throws Exception {
                LegalDocumentResponse updated = LegalDocumentResponse.builder()
                                .id(testId)
                                .documentName("Văn bản đã sửa đổi")
                                .build();
                when(legalDocumentService.update(eq(testId), any(LegalDocumentCreateRequest.class)))
                                .thenReturn(updated);

                mockMvc.perform(put("/api/v1/legal-documents/" + testId)
                                .contentType("application/json")
                                .content(java.util.Objects
                                                .requireNonNull(objectMapper.writeValueAsString(createRequest))))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.documentName").value("Văn bản đã sửa đổi"));
        }

        @Test
        void deleteVanBan_shouldReturnOk() throws Exception {
                doNothing().when(legalDocumentService).delete(testId);

                mockMvc.perform(delete("/api/v1/legal-documents/" + testId))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        void searchDocuments_shouldReturnPaginatedResults() throws Exception {
                SearchResultResponse searchResult = SearchResultResponse.builder()
                                .results(List.of(testResponse))
                                .totalElements(1L)
                                .totalPages(1)
                                .currentPage(0)
                                .pageSize(20)
                                .build();

                when(legalDocumentService.searchDocuments(
                                eq("Luật"), any(), eq("Quốc hội"), any(), any(), any(),
                                any(), any(), any(), any(), eq(0), eq(20)))
                                .thenReturn(searchResult);

                mockMvc.perform(get("/api/v1/legal-documents/search")
                                .param("keyword", "Luật")
                                .param("issuingAuthority", "Quốc hội")
                                .param("page", "0").param("size", "20"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.data.totalElements").value(1))
                                .andExpect(jsonPath("$.data.results[0].documentName")
                                                .value("Luật Giao thông đường thủy nội địa"));
        }

        @Test
        void exportPdf_shouldKeepVietnameseTextAndDisplayLabels() throws Exception {
                LegalDocumentResponse exportResponse = LegalDocumentResponse.builder()
                                .id(testId)
                                .documentName("Quyết định thử nghiệm")
                                .documentNumber("QD-01")
                                .issuingAuthority("Cục Hàng hải Việt Nam")
                                .signer("Nguyễn Văn A")
                                .issueDate(LocalDate.of(2026, 8, 3))
                                .effectiveDate(LocalDate.of(2026, 8, 3))
                                .expirationDate(LocalDate.of(2026, 8, 30))
                                .documentType(DocumentType.DECISION)
                                .validityStatus(ValidityStatus.EFFECTIVE)
                                .build();
                when(legalDocumentService.getById(testId)).thenReturn(exportResponse);

                byte[] pdfBytes = mockMvc.perform(get("/api/v1/legal-documents/" + testId + "/export"))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsByteArray();

                try (PdfDocument pdf = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
                        String text = PdfTextExtractor.getTextFromPage(pdf.getFirstPage());
                        org.junit.jupiter.api.Assertions.assertTrue(text.contains("VĂN BẢN PHÁP LÝ"));
                        org.junit.jupiter.api.Assertions.assertTrue(text.contains("Loại văn bản: Quyết định"));
                        org.junit.jupiter.api.Assertions.assertTrue(text.contains("Trạng thái: Còn hiệu lực"));
                        org.junit.jupiter.api.Assertions.assertTrue(text.contains("Ngày ban hành: 03/08/2026"));
                }
        }

        @Test
        void history_shouldReturnHistoryList() throws Exception {
                LegalDocumentHistoryResponse historyResp = LegalDocumentHistoryResponse.builder()
                                .id(UUID.randomUUID())
                                .action(LegalDocumentHistoryAction.CREATED)
                                .documentName("Luật Giao thông")
                                .build();
                when(legalDocumentService.getHistory(testId)).thenReturn(List.of(historyResp));

                mockMvc.perform(get("/api/v1/legal-documents/" + testId + "/history"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data[0].action").value("CREATED"));
        }

        @Test
        void invalidate_shouldReturnSuccess() throws Exception {
                doNothing().when(legalDocumentService).invalidate(testId);

                mockMvc.perform(post("/api/v1/legal-documents/" + testId + "/invalidate"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.message").value("Vô hiệu hóa văn bản thành công"));
        }

        @Test
        void suggestions_shouldReturnSuggestionsList() throws Exception {
                SearchSuggestionResponse suggestionResp = SearchSuggestionResponse.builder()
                                .id(UUID.randomUUID())
                                .keyword("Luật giao thông")
                                .searchCount(10)
                                .build();
                when(legalDocumentService.getSearchSuggestion("Luật")).thenReturn(List.of(suggestionResp));

                mockMvc.perform(get("/api/v1/legal-documents/suggestions").param("keyword", "Luật"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data[0].keyword").value("Luật giao thông"));
        }
}
