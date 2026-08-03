package com.hanghai.kchtg.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.dto.LegalDocumentResponse;
import com.hanghai.kchtg.document.dto.SearchResultResponse;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.ValidityStatus;
import com.hanghai.kchtg.document.service.LegalDocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

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
                                eq("Luật"), eq("Quốc hội"), any(), any(), any(), any(), any(), eq(0), eq(20)))
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
}
