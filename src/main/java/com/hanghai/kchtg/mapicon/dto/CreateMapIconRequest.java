package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMapIconRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    @NotNull
    private Category category;

    private String iconUrl;

    private String size;

    @Builder.Default
    private Status status = Status.ACTIVE;
}