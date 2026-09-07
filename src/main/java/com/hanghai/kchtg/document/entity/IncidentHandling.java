package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Chỉ đạo / xử lý sự cố — handling directive row of an incident (F-131 child table incident_handling).
 */
@Entity
@Table(name = "incident_handling")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentHandling {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(name = "handler", length = 150)
    private String handler;

    @Column(name = "directive_content", length = 2000)
    private String directiveContent;

    @Column(name = "directive_date")
    private LocalDate directiveDate;

    @Column(name = "measure", length = 2000)
    private String measure;

    @Column(name = "result", length = 2000)
    private String result;

    @Column(name = "note", length = 500)
    private String note;
}
