package com.mycompany.myapp.service.mapper;

import static com.mycompany.myapp.domain.CategoryAsserts.*;
import static com.mycompany.myapp.domain.CategoryTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class CategoryMapperTest {

    private CategoryMapper categoryMapper;

    @BeforeEach
    void setUp() {
        categoryMapper = Mappers.getMapper(CategoryMapper.class);
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getCategorySample1();
        var actual = categoryMapper.toEntity(categoryMapper.toDto(expected));
        assertCategoryAllPropertiesEquals(expected, actual);
    }
}
