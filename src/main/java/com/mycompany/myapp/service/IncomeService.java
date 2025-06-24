package com.mycompany.myapp.service;

import com.mycompany.myapp.domain.Income;
import com.mycompany.myapp.repository.IncomeRepository;
import com.mycompany.myapp.service.dto.IncomeDTO;
import com.mycompany.myapp.service.mapper.IncomeMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.mycompany.myapp.domain.Income}.
 */
@Service
@Transactional
public class IncomeService {

    private static final Logger LOG = LoggerFactory.getLogger(IncomeService.class);

    private final IncomeRepository incomeRepository;

    private final IncomeMapper incomeMapper;

    public IncomeService(IncomeRepository incomeRepository, IncomeMapper incomeMapper) {
        this.incomeRepository = incomeRepository;
        this.incomeMapper = incomeMapper;
    }

    /**
     * Save a income.
     *
     * @param incomeDTO the entity to save.
     * @return the persisted entity.
     */
    public IncomeDTO save(IncomeDTO incomeDTO) {
        LOG.debug("Request to save Income : {}", incomeDTO);
        Income income = incomeMapper.toEntity(incomeDTO);
        income = incomeRepository.save(income);
        return incomeMapper.toDto(income);
    }

    /**
     * Update a income.
     *
     * @param incomeDTO the entity to save.
     * @return the persisted entity.
     */
    public IncomeDTO update(IncomeDTO incomeDTO) {
        LOG.debug("Request to update Income : {}", incomeDTO);
        Income income = incomeMapper.toEntity(incomeDTO);
        income = incomeRepository.save(income);
        return incomeMapper.toDto(income);
    }

    /**
     * Partially update a income.
     *
     * @param incomeDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<IncomeDTO> partialUpdate(IncomeDTO incomeDTO) {
        LOG.debug("Request to partially update Income : {}", incomeDTO);

        return incomeRepository
            .findById(incomeDTO.getId())
            .map(existingIncome -> {
                incomeMapper.partialUpdate(existingIncome, incomeDTO);

                return existingIncome;
            })
            .map(incomeRepository::save)
            .map(incomeMapper::toDto);
    }

    /**
     * Get all the incomes.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<IncomeDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Incomes");
        return incomeRepository.findAll(pageable).map(incomeMapper::toDto);
    }

    /**
     * Get all the incomes with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<IncomeDTO> findAllWithEagerRelationships(Pageable pageable) {
        return incomeRepository.findAllWithEagerRelationships(pageable).map(incomeMapper::toDto);
    }

    /**
     * Get one income by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<IncomeDTO> findOne(Long id) {
        LOG.debug("Request to get Income : {}", id);
        return incomeRepository.findOneWithEagerRelationships(id).map(incomeMapper::toDto);
    }

    /**
     * Delete the income by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Income : {}", id);
        incomeRepository.deleteById(id);
    }
}
