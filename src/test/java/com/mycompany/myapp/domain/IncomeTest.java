package com.mycompany.myapp.domain;

import static com.mycompany.myapp.domain.CategoryTestSamples.*;
import static com.mycompany.myapp.domain.IncomeTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.mycompany.myapp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class IncomeTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Income.class);
        Income income1 = getIncomeSample1();
        Income income2 = new Income();
        assertThat(income1).isNotEqualTo(income2);

        income2.setId(income1.getId());
        assertThat(income1).isEqualTo(income2);

        income2 = getIncomeSample2();
        assertThat(income1).isNotEqualTo(income2);
    }

    @Test
    void categoryTest() {
        Income income = getIncomeRandomSampleGenerator();
        Category categoryBack = getCategoryRandomSampleGenerator();

        income.setCategory(categoryBack);
        assertThat(income.getCategory()).isEqualTo(categoryBack);

        income.category(null);
        assertThat(income.getCategory()).isNull();
    }
}
