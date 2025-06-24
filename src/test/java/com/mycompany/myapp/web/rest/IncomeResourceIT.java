package com.mycompany.myapp.web.rest;

import static com.mycompany.myapp.domain.IncomeAsserts.*;
import static com.mycompany.myapp.web.rest.TestUtil.createUpdateProxyForBean;
import static com.mycompany.myapp.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.myapp.IntegrationTest;
import com.mycompany.myapp.domain.Category;
import com.mycompany.myapp.domain.Income;
import com.mycompany.myapp.repository.IncomeRepository;
import com.mycompany.myapp.repository.UserRepository;
import com.mycompany.myapp.service.IncomeService;
import com.mycompany.myapp.service.dto.IncomeDTO;
import com.mycompany.myapp.service.mapper.IncomeMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link IncomeResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class IncomeResourceIT {

    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_AMOUNT = new BigDecimal(1);

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final Instant DEFAULT_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/incomes";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private UserRepository userRepository;

    @Mock
    private IncomeRepository incomeRepositoryMock;

    @Autowired
    private IncomeMapper incomeMapper;

    @Mock
    private IncomeService incomeServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restIncomeMockMvc;

    private Income income;

    private Income insertedIncome;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Income createEntity(EntityManager em) {
        Income income = new Income().amount(DEFAULT_AMOUNT).description(DEFAULT_DESCRIPTION).date(DEFAULT_DATE);
        // Add required entity
        Category category;
        if (TestUtil.findAll(em, Category.class).isEmpty()) {
            category = CategoryResourceIT.createEntity();
            em.persist(category);
            em.flush();
        } else {
            category = TestUtil.findAll(em, Category.class).get(0);
        }
        income.setCategory(category);
        return income;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Income createUpdatedEntity(EntityManager em) {
        Income updatedIncome = new Income().amount(UPDATED_AMOUNT).description(UPDATED_DESCRIPTION).date(UPDATED_DATE);
        // Add required entity
        Category category;
        if (TestUtil.findAll(em, Category.class).isEmpty()) {
            category = CategoryResourceIT.createUpdatedEntity();
            em.persist(category);
            em.flush();
        } else {
            category = TestUtil.findAll(em, Category.class).get(0);
        }
        updatedIncome.setCategory(category);
        return updatedIncome;
    }

    @BeforeEach
    void initTest() {
        income = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedIncome != null) {
            incomeRepository.delete(insertedIncome);
            insertedIncome = null;
        }
    }

    @Test
    @Transactional
    void createIncome() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);
        var returnedIncomeDTO = om.readValue(
            restIncomeMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            IncomeDTO.class
        );

        // Validate the Income in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedIncome = incomeMapper.toEntity(returnedIncomeDTO);
        assertIncomeUpdatableFieldsEquals(returnedIncome, getPersistedIncome(returnedIncome));

        insertedIncome = returnedIncome;
    }

    @Test
    @Transactional
    void createIncomeWithExistingId() throws Exception {
        // Create the Income with an existing ID
        income.setId(1L);
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restIncomeMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        income.setAmount(null);

        // Create the Income, which fails.
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        restIncomeMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        income.setDate(null);

        // Create the Income, which fails.
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        restIncomeMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllIncomes() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        // Get all the incomeList
        restIncomeMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(income.getId().intValue())))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllIncomesWithEagerRelationshipsIsEnabled() throws Exception {
        when(incomeServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restIncomeMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(incomeServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllIncomesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(incomeServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restIncomeMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(incomeRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getIncome() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        // Get the income
        restIncomeMockMvc
            .perform(get(ENTITY_API_URL_ID, income.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(income.getId().intValue()))
            .andExpect(jsonPath("$.amount").value(sameNumber(DEFAULT_AMOUNT)))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
            .andExpect(jsonPath("$.date").value(DEFAULT_DATE.toString()));
    }

    @Test
    @Transactional
    void getNonExistingIncome() throws Exception {
        // Get the income
        restIncomeMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingIncome() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the income
        Income updatedIncome = incomeRepository.findById(income.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedIncome are not directly saved in db
        em.detach(updatedIncome);
        updatedIncome.amount(UPDATED_AMOUNT).description(UPDATED_DESCRIPTION).date(UPDATED_DATE);
        IncomeDTO incomeDTO = incomeMapper.toDto(updatedIncome);

        restIncomeMockMvc
            .perform(
                put(ENTITY_API_URL_ID, incomeDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO))
            )
            .andExpect(status().isOk());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedIncomeToMatchAllProperties(updatedIncome);
    }

    @Test
    @Transactional
    void putNonExistingIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(
                put(ENTITY_API_URL_ID, incomeDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(incomeDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(incomeDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateIncomeWithPatch() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the income using partial update
        Income partialUpdatedIncome = new Income();
        partialUpdatedIncome.setId(income.getId());

        partialUpdatedIncome.description(UPDATED_DESCRIPTION).date(UPDATED_DATE);

        restIncomeMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedIncome.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedIncome))
            )
            .andExpect(status().isOk());

        // Validate the Income in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertIncomeUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedIncome, income), getPersistedIncome(income));
    }

    @Test
    @Transactional
    void fullUpdateIncomeWithPatch() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the income using partial update
        Income partialUpdatedIncome = new Income();
        partialUpdatedIncome.setId(income.getId());

        partialUpdatedIncome.amount(UPDATED_AMOUNT).description(UPDATED_DESCRIPTION).date(UPDATED_DATE);

        restIncomeMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedIncome.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedIncome))
            )
            .andExpect(status().isOk());

        // Validate the Income in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertIncomeUpdatableFieldsEquals(partialUpdatedIncome, getPersistedIncome(partialUpdatedIncome));
    }

    @Test
    @Transactional
    void patchNonExistingIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, incomeDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(incomeDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(incomeDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamIncome() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        income.setId(longCount.incrementAndGet());

        // Create the Income
        IncomeDTO incomeDTO = incomeMapper.toDto(income);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restIncomeMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(incomeDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Income in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteIncome() throws Exception {
        // Initialize the database
        insertedIncome = incomeRepository.saveAndFlush(income);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the income
        restIncomeMockMvc
            .perform(delete(ENTITY_API_URL_ID, income.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return incomeRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Income getPersistedIncome(Income income) {
        return incomeRepository.findById(income.getId()).orElseThrow();
    }

    protected void assertPersistedIncomeToMatchAllProperties(Income expectedIncome) {
        assertIncomeAllPropertiesEquals(expectedIncome, getPersistedIncome(expectedIncome));
    }

    protected void assertPersistedIncomeToMatchUpdatableProperties(Income expectedIncome) {
        assertIncomeAllUpdatablePropertiesEquals(expectedIncome, getPersistedIncome(expectedIncome));
    }
}
