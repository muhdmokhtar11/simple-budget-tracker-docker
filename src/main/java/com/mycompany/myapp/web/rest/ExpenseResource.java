package com.mycompany.myapp.web.rest;

import com.mycompany.myapp.repository.ExpenseRepository;
import com.mycompany.myapp.service.ExpenseService;
import com.mycompany.myapp.service.dto.ExpenseDTO;
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
 * REST controller for managing {@link com.mycompany.myapp.domain.Expense}.
 */
@RestController
@RequestMapping("/api/expenses")
public class ExpenseResource {

    private static final Logger LOG = LoggerFactory.getLogger(ExpenseResource.class);

    private static final String ENTITY_NAME = "expense";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ExpenseService expenseService;

    private final ExpenseRepository expenseRepository;

    public ExpenseResource(ExpenseService expenseService, ExpenseRepository expenseRepository) {
        this.expenseService = expenseService;
        this.expenseRepository = expenseRepository;
    }

    /**
     * {@code POST  /expenses} : Create a new expense.
     *
     * @param expenseDTO the expenseDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new expenseDTO, or with status {@code 400 (Bad Request)} if the expense has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ExpenseDTO> createExpense(@Valid @RequestBody ExpenseDTO expenseDTO) throws URISyntaxException {
        LOG.debug("REST request to save Expense : {}", expenseDTO);
        if (expenseDTO.getId() != null) {
            throw new BadRequestAlertException("A new expense cannot already have an ID", ENTITY_NAME, "idexists");
        }
        expenseDTO = expenseService.save(expenseDTO);
        return ResponseEntity.created(new URI("/api/expenses/" + expenseDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, false, ENTITY_NAME, expenseDTO.getId().toString()))
            .body(expenseDTO);
    }

    /**
     * {@code PUT  /expenses/:id} : Updates an existing expense.
     *
     * @param id the id of the expenseDTO to save.
     * @param expenseDTO the expenseDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated expenseDTO,
     * or with status {@code 400 (Bad Request)} if the expenseDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the expenseDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody ExpenseDTO expenseDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Expense : {}, {}", id, expenseDTO);
        if (expenseDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, expenseDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!expenseRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        expenseDTO = expenseService.update(expenseDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, expenseDTO.getId().toString()))
            .body(expenseDTO);
    }

    /**
     * {@code PATCH  /expenses/:id} : Partial updates given fields of an existing expense, field will ignore if it is null
     *
     * @param id the id of the expenseDTO to save.
     * @param expenseDTO the expenseDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated expenseDTO,
     * or with status {@code 400 (Bad Request)} if the expenseDTO is not valid,
     * or with status {@code 404 (Not Found)} if the expenseDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the expenseDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ExpenseDTO> partialUpdateExpense(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody ExpenseDTO expenseDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Expense partially : {}, {}", id, expenseDTO);
        if (expenseDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, expenseDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!expenseRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ExpenseDTO> result = expenseService.partialUpdate(expenseDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, false, ENTITY_NAME, expenseDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /expenses} : get all the expenses.
     *
     * @param pageable the pagination information.
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of expenses in body.
     */
    @GetMapping("")
    public ResponseEntity<List<ExpenseDTO>> getAllExpenses(
        @org.springdoc.core.annotations.ParameterObject Pageable pageable,
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get a page of Expenses");
        Page<ExpenseDTO> page;
        if (eagerload) {
            page = expenseService.findAllWithEagerRelationships(pageable);
        } else {
            page = expenseService.findAll(pageable);
        }
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /expenses/:id} : get the "id" expense.
     *
     * @param id the id of the expenseDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the expenseDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpense(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Expense : {}", id);
        Optional<ExpenseDTO> expenseDTO = expenseService.findOne(id);
        return ResponseUtil.wrapOrNotFound(expenseDTO);
    }

    /**
     * {@code DELETE  /expenses/:id} : delete the "id" expense.
     *
     * @param id the id of the expenseDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Expense : {}", id);
        expenseService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, false, ENTITY_NAME, id.toString()))
            .build();
    }
}
