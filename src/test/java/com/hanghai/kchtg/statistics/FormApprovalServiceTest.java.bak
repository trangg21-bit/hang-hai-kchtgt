package com.hanghai.kchtg.statistics;

import com.hanghai.kchtg.statistics.entity.FormApprovalHistory;
import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.repository.FormApprovalHistoryRepository;
import com.hanghai.kchtg.statistics.repository.StatisticsFormRepository;
import com.hanghai.kchtg.statistics.service.FormApprovalService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FormApprovalServiceTest {

    @Mock
    private StatisticsFormRepository formRepository;

    @Mock
    private FormApprovalHistoryRepository historyRepository;

    @InjectMocks
    private FormApprovalService formApprovalService;

    @Test
    void submitForm_success() {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormStatus(StatFormStatus.DRAFT);

        when(formRepository.findById(1L)).thenReturn(Optional.of(form));
        when(formRepository.save(any(StatisticsForm.class))).thenReturn(form);

        StatisticsForm result = formApprovalService.submitForm(1L, "user1", "submit comments");

        assertThat(result).isNotNull();
        assertThat(result.getFormStatus()).isEqualTo(StatFormStatus.SUBMITTED);
        verify(formRepository, times(1)).save(any(StatisticsForm.class));
        verify(historyRepository, times(1)).save(any(FormApprovalHistory.class));
    }

    @Test
    void submitForm_notFound_throws() {
        when(formRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> formApprovalService.submitForm(999L, "user1", ""))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Form not found");
    }

    @Test
    void approveForm_success() {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormStatus(StatFormStatus.SUBMITTED);

        when(formRepository.findById(1L)).thenReturn(Optional.of(form));
        when(formRepository.save(any(StatisticsForm.class))).thenReturn(form);

        StatisticsForm result = formApprovalService.approveForm(1L, "approver1", "Approved");

        assertThat(result).isNotNull();
        assertThat(result.getFormStatus()).isEqualTo(StatFormStatus.APPROVED);
        assertThat(result.getApprovedBy()).isEqualTo("approver1");
        verify(formRepository, times(1)).save(any(StatisticsForm.class));
        verify(historyRepository, times(1)).save(any(FormApprovalHistory.class));
    }

    @Test
    void approveForm_notFound_throws() {
        when(formRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> formApprovalService.approveForm(999L, "approver1", "Approved"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Form not found");
    }

    @Test
    void rejectForm_success() {
        StatisticsForm form = new StatisticsForm();
        form.setId(1L);
        form.setFormStatus(StatFormStatus.SUBMITTED);

        when(formRepository.findById(1L)).thenReturn(Optional.of(form));
        when(formRepository.save(any(StatisticsForm.class))).thenReturn(form);

        StatisticsForm result = formApprovalService.rejectForm(1L, "rejecter1", "Rejected");

        assertThat(result).isNotNull();
        assertThat(result.getFormStatus()).isEqualTo(StatFormStatus.REJECTED);
        verify(formRepository, times(1)).save(any(StatisticsForm.class));
        verify(historyRepository, times(1)).save(any(FormApprovalHistory.class));
    }

    @Test
    void rejectForm_notFound_throws() {
        when(formRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> formApprovalService.rejectForm(999L, "rejecter1", "Rejected"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Form not found");
    }

    @Test
    void getHistory_returnsList() {
        FormApprovalHistory history1 = FormApprovalHistory.builder()
                .formId(1L)
                .action("APPROVE")
                .actor("approver1")
                .build();

        FormApprovalHistory history2 = FormApprovalHistory.builder()
                .formId(1L)
                .action("REJECT")
                .actor("rejecter1")
                .build();

        when(historyRepository.findByFormIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(history1, history2));

        List<FormApprovalHistory> result = formApprovalService.getHistory(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getAction()).isEqualTo("APPROVE");
        assertThat(result.get(1).getAction()).isEqualTo("REJECT");
    }

    @Test
    void getHistory_empty() {
        when(historyRepository.findByFormIdOrderByCreatedAtDesc(1L)).thenReturn(Collections.emptyList());

        List<FormApprovalHistory> result = formApprovalService.getHistory(1L);

        assertThat(result).isEmpty();
    }
}
