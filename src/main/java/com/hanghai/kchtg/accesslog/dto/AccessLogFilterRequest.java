package com.hanghai.kchtg.accesslog.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessLogFilterRequest {

    private UUID userId;
    private String module;
    private String action;
    private LocalDateTime from;
    private LocalDateTime to;
    private String type;
    private String severity;
    private String keyword;
    private String email;
    private String orgUnit;
    private String sessionId;
    private String username;
    private Boolean granted;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LocalDateTime getFrom() { return from; }
    public void setFrom(LocalDateTime from) { this.from = from; }
    public LocalDateTime getTo() { return to; }
    public void setTo(LocalDateTime to) { this.to = to; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOrgUnit() { return orgUnit; }
    public void setOrgUnit(String orgUnit) { this.orgUnit = orgUnit; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Boolean getGranted() { return granted; }
    public void setGranted(Boolean granted) { this.granted = granted; }
}
