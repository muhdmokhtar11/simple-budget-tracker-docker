package com.mycompany.myapp.service.mapper;

import static com.mycompany.myapp.domain.ExpenseAsserts.*;
import static com.mycompany.myapp.domain.ExpenseTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class ExpenseMapperTest {

    private ExpenseMapper expenseMapper;

    @BeforeEach
    void setUp() {
        expenseMapper = Mappers.getMapper(ExpenseMapper.class);
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getExpenseSample1();
        var actual = expenseMapper.toEntity(expenseMapper.toDto(expected));
        assertExpenseAllPropertiesEquals(expected, actual);
    }
}
