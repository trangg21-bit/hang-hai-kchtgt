package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMapSymbolRequest {
    @NotBlank(message = "Mã ký hiệu không được để trống")
    @Size(max = 50, message = "Mã ký hiệu tối đa 50 ký tự")
    private String code;

    @NotBlank(message = "Tên ký hiệu không được để trống")
    @Size(max = 100, message = "Tên ký hiệu tối đa 100 ký tự")
    private String name;

    private String description;

    @NotBlank(message = "Hình ảnh không được để trống")
    private String hinhAnh;

    @jakarta.validation.constraints.NotNull(message = "Trạng thái không được để trống")
    private MapSymbolStatus status;
}
