package com.hanghai.kchtg.port.dto.port;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO cho thông tin Khu bến thuộc Cảng biển (M-002).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortWharfAreaDto {

    private UUID id;

    @Size(max = 50, message = "Mã khu bến tối đa 50 ký tự")
    private String wharfCode;

    @NotBlank(message = "Tên khu bến không được để trống")
    @Size(max = 255, message = "Tên khu bến tối đa 255 ký tự")
    private String wharfName;

    @Size(max = 255, message = "Chức năng quy hoạch chính tối đa 255 ký tự")
    private String mainPlanningFunction;

    @Size(max = 255, message = "Phạm vi/địa bàn quy hoạch tối đa 255 ký tự")
    private String planningScope;

    @Size(max = 2000, message = "Văn bản quy định tối đa 2000 ký tự")
    private String regulatoryDocument;

    @Size(max = 2000, message = "Ghi chú tối đa 2000 ký tự")
    private String notes;
}
