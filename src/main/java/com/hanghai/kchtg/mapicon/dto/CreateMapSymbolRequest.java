package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMapSymbolRequest {
    @NotBlank(message = "Tên biểu tượng không được để trống")
    @Size(max = 255, message = "Tên biểu tượng tối đa 255 ký tự")
    private String name;

    @Size(max = 500)
    private String description;

    @NotBlank(message = "Hình ảnh không được để trống")
    private String image;

    @jakarta.validation.constraints.NotNull(message = "Trạng thái không được để trống")
    private MapSymbolStatus status;
}
