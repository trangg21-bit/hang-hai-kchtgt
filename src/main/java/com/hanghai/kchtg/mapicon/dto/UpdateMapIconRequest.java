package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMapIconRequest {

    private String name;

    private String code;

    private Category category;

    private String iconUrl;

    private String size;

    private Status status;
}