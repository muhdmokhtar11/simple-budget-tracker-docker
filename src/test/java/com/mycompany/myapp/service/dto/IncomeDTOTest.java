package com.mycompany.myapp.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.mycompany.myapp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class IncomeDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(IncomeDTO.class);
        IncomeDTO incomeDTO1 = new IncomeDTO();
        incomeDTO1.setId(1L);
        IncomeDTO incomeDTO2 = new IncomeDTO();
        assertThat(incomeDTO1).isNotEqualTo(incomeDTO2);
        incomeDTO2.setId(incomeDTO1.getId());
        assertThat(incomeDTO1).isEqualTo(incomeDTO2);
        incomeDTO2.setId(2L);
        assertThat(incomeDTO1).isNotEqualTo(incomeDTO2);
        incomeDTO1.setId(null);
        assertThat(incomeDTO1).isNotEqualTo(incomeDTO2);
    }
}
