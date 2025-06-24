package com.mycompany.myapp.service.mapper;

import static com.mycompany.myapp.domain.IncomeAsserts.*;
import static com.mycompany.myapp.domain.IncomeTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class IncomeMapperTest {

    private IncomeMapper incomeMapper;

    @BeforeEach
    void setUp() {
        incomeMapper = new IncomeMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getIncomeSample1();
        var actual = incomeMapper.toEntity(incomeMapper.toDto(expected));
        assertIncomeAllPropertiesEquals(expected, actual);
    }
}
