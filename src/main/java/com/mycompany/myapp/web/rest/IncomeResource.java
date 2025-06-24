package com.mycompany.myapp.web.rest;

import com.mycompany.myapp.repository.IncomeRepository;
import com.mycompany.myapp.service.IncomeService;
import com.mycompany.myapp.service.dto.IncomeDTO;
import com.mycompany.myapp.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.mycompany.myapp.domain.Income}.
 */
@RestController
@RequestMapping("/api/incomes")
public class IncomeResource {

    private static final Logger LOG = LoggerFactory.getLogger(IncomeResource.class);

    private static final String ENTITY_NAME = "income";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final IncomeService incomeService;

    private final IncomeRepository incomeRepository;

    public IncomeResource(IncomeService incomeService, IncomeRepository incomeRepository) {
        this.incomeService = incomeService;
        this.incomeRepository = incomeRepository;
    }

    /**
     * {@code POST  /incomes} : Create a new income.
     *
     * @param incomeDTO the incomeDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new incomeDTO, or with status {@code 400 (Bad Request)} if the income has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<IncomeDTO> createIncome(@Valid @RequestBody IncomeDTO incomeDTO) throws URISyntaxException {
        LOG.debug("REST request to save Income : {}", incomeDTO);
        if (incomeDTO.getId() != null) {
            throw new BadRequestAlertException("A new income cannot already have an ID", ENTITY_NAME, "idexists");
        }
        incomeDTO = incomeService.save(incomeDTO);
        return ResponseEntity.created(new URI("/api/incomes/" + incomeDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, incomeDTO.getId().toString()))
            .body(incomeDTO);
    }

    /**
     * {@code PUT  /incomes/:id} : Updates an existing income.
     *
     * @param id the id of the incomeDTO to save.
     * @param incomeDTO the incomeDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated incomeDTO,
     * or with status {@code 400 (Bad Request)} if the incomeDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the incomeDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<IncomeDTO> updateIncome(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody IncomeDTO incomeDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Income : {}, {}", id, incomeDTO);
        if (incomeDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, incomeDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!incomeRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        incomeDTO = incomeService.update(incomeDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, incomeDTO.getId().toString()))
            .body(incomeDTO);
    }

    /**
     * {@code PATCH  /incomes/:id} : Partial updates given fields of an existing income, field will ignore if it is null
     *
     * @param id the id of the incomeDTO to save.
     * @param incomeDTO the incomeDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated incomeDTO,
     * or with status {@code 400 (Bad Request)} if the incomeDTO is not valid,
     * or with status {@code 404 (Not Found)} if the incomeDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the incomeDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<IncomeDTO> partialUpdateIncome(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody IncomeDTO incomeDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Income partially : {}, {}", id, incomeDTO);
        if (incomeDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, incomeDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!incomeRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<IncomeDTO> result = incomeService.partialUpdate(incomeDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, incomeDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /incomes} : get all the incomes.
     *
     * @param pageable the pagination information.
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of incomes in body.
     */
    @GetMapping("")
    public ResponseEntity<List<IncomeDTO>> getAllIncomes(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of Incomes");
        Page<IncomeDTO> page;
        if (eagerload) {
            page = incomeService.findAllWithEagerRelationships(pageable);
        } else {
            page = incomeService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /incomes/:id} : get the "id" income.
     *
     * @param id the id of the incomeDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the incomeDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<IncomeDTO> getIncome(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Income : {}", id);
        Optional<IncomeDTO> incomeDTO = incomeService.findOne(id);
        return ResponseUtil.wrapOrNotFound(incomeDTO);
    }

    /**
     * {@code DELETE  /incomes/:id} : delete the "id" income.
     *
     * @param id the id of the incomeDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Income : {}", id);
        incomeService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
