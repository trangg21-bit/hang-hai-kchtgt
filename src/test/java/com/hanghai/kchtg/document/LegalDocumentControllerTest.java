package com.hanghai.kchtg.document;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.document.dto.LegalDocumentCreateRequest;
import com.hanghai.kchtg.document.entity.DocumentType;
import com.hanghai.kchtg.document.entity.SearchSuggestion;
import com.hanghai.kchtg.document.repository.LegalDocumentRepository;
import com.hanghai.kchtg.document.repository.SearchSuggestionRepository;
import com.hanghai.kchtg.user.entity.User;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * F-128 Quản lý văn bản pháp lý — REAL-execution integration test (INC-039).
 *
 * <p>Boots the full production stack — {@code LegalDocumentController} →
 * {@code LegalDocumentService} → {@code LegalDocumentRepository} → the real test
 * datasource (H2 in-memory, {@code test} profile) — with NO
 * {@code @MockBean}/{@code @Mock}/{@code @InjectMocks} over any declared F-128
 * class. Every scenario drives the real HTTP boundary through MockMvc and asserts
 * Vietnamese business messages and payloads. The only test-side fixtures are
 * real-repository seeds (one SearchSuggestion row) and a ROLE_SYSTEM_ADMIN
 * principal so the real {@code @PreAuthorize} method security admits the calls.
 *
 * <p>F-128 is deliberately unscoped — {@code LegalDocumentController} has no
 * {@code @DataScope} and {@code LegalDocument} no orgUnit filter — so
 * DataScopeAspect never runs here. {@code @Transactional} rolls each test back and
 * keeps the shared in-memory database isolated between tests.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class LegalDocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LegalDocumentRepository legalDocumentRepository;

    @Autowired
    private SearchSuggestionRepository searchSuggestionRepository;

    @BeforeEach
    void setUpSecurityContext() {
        User principal = new User();
        principal.setId(UUID.randomUUID());
        principal.setUsername("legaldoc-qa-user");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))));
    }

    private LegalDocumentCreateRequest validRequest(String documentNumber, String documentName) {
        return LegalDocumentCreateRequest.builder()
                .documentName(documentName)
                .documentNumber(documentNumber)
                .issuingAuthority("Cục Hàng hải Việt Nam")
                .issueDate(LocalDate.of(2026, 8, 3))
                .effectiveDate(LocalDate.of(2026, 8, 3))
                .expirationDate(LocalDate.of(2026, 8, 30))
                .documentType(DocumentType.DECISION)
                .applicationArea("Toàn quốc")
                .signer("Nguyễn Văn A")
                .description("Văn bản phục vụ kiểm thử tích hợp F-128")
                .build();
    }

    private UUID createDocument(LegalDocumentCreateRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(body.get("data").get("id").asText());
    }

    // ── List ─────────────────────────────────────────────────────────

    @Test
    void list_shouldReturnOnlyActiveDocuments() throws Exception {
        UUID id = createDocument(validRequest("VB-LIST-01", "Văn bản danh sách"));

        mockMvc.perform(get("/api/v1/legal-documents").param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[*].documentName",
                        hasItem("Văn bản danh sách")));

        // Soft delete then the real findActive query must exclude it.
        mockMvc.perform(delete("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/legal-documents").param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(0));
    }

    // ── Create ───────────────────────────────────────────────────────

    @Test
    void create_shouldPersistAndReturnSuccess() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                validRequest("VB-01", "Quyết định thử nghiệm"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.documentName").value("Quyết định thử nghiệm"))
                .andExpect(jsonPath("$.data.documentNumber").value("VB-01"))
                .andExpect(jsonPath("$.data.validityStatus").value("EFFECTIVE"))
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        UUID id = UUID.fromString(body.get("data").get("id").asText());
        assertThat(legalDocumentRepository.findById(id)).isPresent();

        // The row must be readable back through the real stack.
        mockMvc.perform(get("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentName").value("Quyết định thử nghiệm"));
    }

    @Test
    void create_shouldRejectDuplicateDocumentNumber() throws Exception {
        LegalDocumentCreateRequest request = validRequest("VB-DUP", "Văn bản trùng số hiệu");
        createDocument(request);

        mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value(containsString("Số hiệu văn bản pháp lý đã tồn tại")));
    }

    @Test
    void create_shouldAllowSameDocumentNumberAfterSoftDelete() throws Exception {
        LegalDocumentCreateRequest request = validRequest("VB-REUSE", "Văn bản số tái sử dụng");
        UUID id = createDocument(request);

        mockMvc.perform(delete("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa văn bản pháp lý thành công"));

        // existsByDocumentNumberAndDeletedAtIsNull must now permit the same number.
        mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentNumber").value("VB-REUSE"));
    }

    @Test
    void create_shouldRejectExpirationDateBeforeEffectiveDate() throws Exception {
        LegalDocumentCreateRequest request = validRequest("VB-DATE-1", "Văn bản ngày hết hạn sai");
        request.setExpirationDate(LocalDate.of(2026, 1, 10));
        request.setIssueDate(LocalDate.of(2026, 1, 1));
        request.setEffectiveDate(LocalDate.of(2026, 1, 15));

        mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(containsString("Ngày hết hiệu lực phải sau hoặc bằng ngày có hiệu lực")));
    }

    @Test
    void create_shouldRejectEffectiveDateBeforeIssueDate() throws Exception {
        LegalDocumentCreateRequest request = validRequest("VB-DATE-2", "Văn bản ngày hiệu lực sai");
        request.setIssueDate(LocalDate.of(2026, 1, 15));
        request.setEffectiveDate(LocalDate.of(2026, 1, 1));

        mockMvc.perform(post("/api/v1/legal-documents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(containsString("Ngày hiệu lực phải sau hoặc bằng ngày ban hành")));
    }

    // ── Get ──────────────────────────────────────────────────────────

    @Test
    void get_shouldReturnRequestedDocument() throws Exception {
        UUID id = createDocument(validRequest("VB-GET", "Văn bản lấy theo id"));

        mockMvc.perform(get("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentName").value("Văn bản lấy theo id"))
                .andExpect(jsonPath("$.data.issuingAuthority").value("Cục Hàng hải Việt Nam"));
    }

    @Test
    void get_shouldReturnBadRequestForUnknownId() throws Exception {
        mockMvc.perform(get("/api/v1/legal-documents/" + UUID.randomUUID()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(containsString("Không tìm thấy văn bản với id")));
    }

    // ── Update ───────────────────────────────────────────────────────

    @Test
    void update_shouldApplyChangesAndReportSuccess() throws Exception {
        UUID id = createDocument(validRequest("VB-UPD", "Tên cũ trước cập nhật"));

        LegalDocumentCreateRequest change = validRequest("VB-UPD", "Tên mới sau cập nhật");
        mockMvc.perform(put("/api/v1/legal-documents/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(change)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật văn bản pháp lý thành công"))
                .andExpect(jsonPath("$.data.documentName").value("Tên mới sau cập nhật"));

        mockMvc.perform(get("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.documentName").value("Tên mới sau cập nhật"));
    }

    @Test
    void update_shouldRejectEditingExpiredDocument() throws Exception {
        UUID id = createDocument(validRequest("VB-EXP", "Văn bản sắp hết hiệu lực"));

        mockMvc.perform(post("/api/v1/legal-documents/" + id + "/invalidate"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/legal-documents/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                validRequest("VB-EXP", "Không được sửa văn bản này"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value(containsString("Không thể sửa văn bản đã hết hiệu lực")));
    }

    // ── Delete / invalidate ──────────────────────────────────────────

    @Test
    void delete_shouldSoftDeleteInDatabase() throws Exception {
        UUID id = createDocument(validRequest("VB-DEL", "Văn bản cần xóa"));

        mockMvc.perform(delete("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Xóa văn bản pháp lý thành công"));

        // Real persistence assertion: soft-delete columns set on the stored row.
        assertThat(legalDocumentRepository.findById(id)).isPresent();
        assertThat(legalDocumentRepository.findById(id).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void invalidate_shouldMarkDocumentExpired() throws Exception {
        UUID id = createDocument(validRequest("VB-INV", "Văn bản cần vô hiệu hóa"));

        mockMvc.perform(post("/api/v1/legal-documents/" + id + "/invalidate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Vô hiệu hóa văn bản thành công"));

        mockMvc.perform(get("/api/v1/legal-documents/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.validityStatus").value("EXPIRED"));
    }

    // ── History ──────────────────────────────────────────────────────

    @Test
    void history_shouldReturnRecordedActions() throws Exception {
        UUID id = createDocument(validRequest("VB-HIST", "Văn bản có lịch sử"));

        mockMvc.perform(get("/api/v1/legal-documents/" + id + "/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].action").value("CREATED"))
                .andExpect(jsonPath("$.data[0].documentName").value("Văn bản có lịch sử"))
                .andExpect(jsonPath("$.data[0].documentNumber").value("VB-HIST"));
    }

    // ── Search ───────────────────────────────────────────────────────

    @Test
    void search_shouldReturnFilteredResultsWithStatusCounts() throws Exception {
        createDocument(validRequest("LGT-01", "Luật Giao thông đường thủy nội địa"));

        mockMvc.perform(get("/api/v1/legal-documents/search")
                        .param("keyword", "Luật")
                        .param("issuingAuthority", "Cục Hàng hải Việt Nam")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.results[*].documentName",
                        hasItem("Luật Giao thông đường thủy nội địa")))
                .andExpect(jsonPath("$.data.statusCounts.EFFECTIVE").value(1));
    }

    // ── Suggestions ──────────────────────────────────────────────────

    @Test
    void suggestions_shouldReturnSuggestionsFromRealStore() throws Exception {
        searchSuggestionRepository.save(SearchSuggestion.builder()
                .keyword("Luật giao thông")
                .searchCount(10)
                .build());

        mockMvc.perform(get("/api/v1/legal-documents/suggestions").param("keyword", "Luật"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].keyword", hasItem("Luật giao thông")));
    }

    // ── Export PDF ───────────────────────────────────────────────────

    @Test
    void export_shouldProducePdfWithVietnameseTextAndLabels() throws Exception {
        UUID id = createDocument(validRequest("QD-EXPORT", "Quyết định thử nghiệm PDF"));

        MvcResult result = mockMvc.perform(get("/api/v1/legal-documents/" + id + "/export"))
                .andExpect(status().isOk())
                .andReturn();

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertThat(result.getResponse().getContentType()).isEqualTo(MediaType.APPLICATION_PDF_VALUE);
        assertThat(pdfBytes).isNotEmpty();
        assertThat(new String(pdfBytes, 0, Math.min(8, pdfBytes.length),
                StandardCharsets.ISO_8859_1)).startsWith("%PDF");

        try (PdfDocument pdf = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdfBytes)))) {
            String extracted = PdfTextExtractor.getTextFromPage(pdf.getPage(1));
            assertThat(extracted)
                    .contains("VĂN BẢN PHÁP LÝ")
                    .contains("Số hiệu: QD-EXPORT")
                    .contains("Tên văn bản: Quyết định thử nghiệm PDF")
                    .contains("Loại văn bản: Quyết định")
                    .contains("Trạng thái: Còn hiệu lực")
                    .contains("Ngày ban hành: 03/08/2026");
        }
    }
}
