package com.hanghai.kchtg.datasharing;

import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.ShareHistory;
import com.hanghai.kchtg.datasharing.entity.ShareStatus;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.ShareHistoryRepository;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import com.hanghai.kchtg.datasharing.service.ShareWorkflowService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ShareWorkflowService Unit Tests — M-018 Wave 3")
class ShareWorkflowServiceTest {

    @Mock
    private SharedDataRepository shareRepository;

    @Mock
    private ShareHistoryRepository historyRepository;

    @InjectMocks
    private ShareWorkflowService shareWorkflowService;

    // ------------------------------------------------------------------
    // Submit for share
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-W3-01: submitForShare_success — sets SHARED status")
    void submitForShare_success() {
        SharedData data = SharedData.builder()
                .id(1L)
                .code("SD-2026-0001")
                .name("Ben Caang 1")
                .dataType(ShareDataType.PORT)
                .shareStatus(ShareStatus.DRAFT)
                .sharedWith("KCHTGT-CN")
                .sharedCreated(Instant.now())
                .build();

        when(shareRepository.findById(1L)).thenReturn(Optional.of(data));
        when(shareRepository.save(any(SharedData.class))).thenReturn(data);

        SharedData result = shareWorkflowService.submitForShare(1L, "ADMIN-01", "Gửi chia sẻ dữ liệu");

        assertThat(result).isNotNull();
        assertEquals("SHARED", result.getStatus());
        assertThat(result.getSharedAt()).isEqualTo(LocalDate.now());
        verify(shareRepository).findById(1L);
        verify(shareRepository).save(data);
        verify(historyRepository).save(any(ShareHistory.class));
    }

    @Test
    @DisplayName("F-018-W3-02: submitForShare_notFound_throws — EntityNotFoundException")
    void submitForShare_notFound_throws() {
        when(shareRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareWorkflowService.submitForShare(999L, "ADMIN-01", null))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SharedData not found: 999");

        verify(shareRepository).findById(999L);
        verify(shareRepository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    // ------------------------------------------------------------------
    // Approve share
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-W3-03: approveShare_success — sets SHARED + approvedBy")
    void approveShare_success() {
        SharedData data = SharedData.builder()
                .id(2L)
                .code("SD-2026-0002")
                .name("Den Bien 1")
                .dataType(ShareDataType.LIGHTHOUSE)
                .shareStatus(ShareStatus.DRAFT)
                .sharedWith("VTS-DNAI")
                .sharedCreated(Instant.now())
                .build();

        when(shareRepository.findById(2L)).thenReturn(Optional.of(data));
        when(shareRepository.save(any(SharedData.class))).thenReturn(data);

        SharedData result = shareWorkflowService.approveShare(2L, "MANAGER-01", "Phê duyệt");

        assertThat(result).isNotNull();
        assertEquals("SHARED", result.getStatus());
        assertEquals("MANAGER-01", result.getApprovedBy());
        verify(shareRepository).findById(2L);
        verify(shareRepository).save(data);
        verify(historyRepository).save(any(ShareHistory.class));
    }

    // ------------------------------------------------------------------
    // Revoke share
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-W3-04: revokeShare_success — sets REVOKED")
    void revokeShare_success() {
        SharedData data = SharedData.builder()
                .id(3L)
                .code("SD-2026-0003")
                .name("Cau Caang 1")
                .dataType(ShareDataType.DOCK)
                .shareStatus(ShareStatus.SHARED)
                .sharedWith("KCHTGT-TH")
                .sharedCreated(Instant.now())
                .build();

        when(shareRepository.findById(3L)).thenReturn(Optional.of(data));
        when(shareRepository.save(any(SharedData.class))).thenReturn(data);

        SharedData result = shareWorkflowService.revokeShare(3L, "ADMIN-01", "Thu hồi");

        assertThat(result).isNotNull();
        assertEquals("REVOKED", result.getStatus());
        verify(shareRepository).findById(3L);
        verify(shareRepository).save(data);
        verify(historyRepository).save(any(ShareHistory.class));
    }

    @Test
    @DisplayName("F-018-W3-05: revokeShare_notFound_throws — EntityNotFoundException")
    void revokeShare_notFound_throws() {
        when(shareRepository.findById(888L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shareWorkflowService.revokeShare(888L, "ADMIN-01", "Lỗi"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("SharedData not found: 888");

        verify(shareRepository).findById(888L);
        verify(shareRepository, never()).save(any());
        verify(historyRepository, never()).save(any());
    }

    // ------------------------------------------------------------------
    // Get history
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-W3-06: getHistory_returnsList — returns list of 3")
    void getHistory_returnsList() {
        ShareHistory h1 = ShareHistory.builder()
                .id(1L)
                .sharedDataId(4L)
                .action("SHARE")
                .actor("ADMIN-01")
                .recipient("KCHTGT-CN")
                .createdAt(Instant.now().minusSeconds(200))
                .build();
        ShareHistory h2 = ShareHistory.builder()
                .id(2L)
                .sharedDataId(4L)
                .action("APPROVE")
                .actor("MANAGER-01")
                .createdAt(Instant.now().minusSeconds(100))
                .build();
        ShareHistory h3 = ShareHistory.builder()
                .id(3L)
                .sharedDataId(4L)
                .action("REVOKE")
                .actor("ADMIN-01")
                .createdAt(Instant.now())
                .build();

        when(historyRepository.findBySharedDataIdOrderByCreatedAtDesc(4L))
                .thenReturn(List.of(h1, h2, h3));

        List<ShareHistory> result = shareWorkflowService.getHistory(4L);

        assertThat(result).isNotEmpty();
        assertEquals(3, result.size());
        assertEquals("REVOKE", result.get(2).getAction());
        verify(historyRepository).findBySharedDataIdOrderByCreatedAtDesc(4L);
    }

    @Test
    @DisplayName("F-018-W3-07: getHistory_empty — returns empty list")
    void getHistory_empty() {
        when(historyRepository.findBySharedDataIdOrderByCreatedAtDesc(777L))
                .thenReturn(Collections.emptyList());

        List<ShareHistory> result = shareWorkflowService.getHistory(777L);

        assertThat(result).isEmpty();
        verify(historyRepository).findBySharedDataIdOrderByCreatedAtDesc(777L);
    }

    // ------------------------------------------------------------------
    // Save history (private helper called by workflow methods)
    // ------------------------------------------------------------------

    @Test
    @DisplayName("F-018-W3-08: saveHistory_callsRepository — verifies save called via submit")
    void saveHistory_callsRepository() {
        SharedData data = SharedData.builder()
                .id(5L)
                .code("SD-2026-0005")
                .name("VTS System 1")
                .dataType(ShareDataType.VTS_SYSTEM)
                .shareStatus(ShareStatus.DRAFT)
                .sharedWith("VTS-DNAI")
                .sharedCreated(Instant.now())
                .build();

        when(shareRepository.findById(5L)).thenReturn(Optional.of(data));
        when(shareRepository.save(any(SharedData.class))).thenReturn(data);
        when(historyRepository.save(any(ShareHistory.class))).thenAnswer(inv -> {
            ShareHistory h = inv.getArgument(0);
            h.setId(10L);
            return h;
        });

        shareWorkflowService.submitForShare(5L, "SYSTEM", "Kiểm thử history");

        verify(historyRepository).save(argThat(h ->
                h.getSharedDataId().equals(5L)
                        && h.getAction().equals("SHARE")
                        && h.getActor().equals("SYSTEM")
                        && h.getRecipient().equals("VTS-DNAI")
                        && h.getComments().equals("Kiểm thử history")
        ));
    }
}
