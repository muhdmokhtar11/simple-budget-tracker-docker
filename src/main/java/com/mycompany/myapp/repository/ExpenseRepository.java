package com.mycompany.myapp.repository;

import com.mycompany.myapp.domain.Expense;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Expense entity.
 */
@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    @Query("select expense from Expense expense where expense.user.login = ?#{authentication.name}")
    List<Expense> findByUserIsCurrentUser();

    default Optional<Expense> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Expense> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Expense> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select expense from Expense expense left join fetch expense.category left join fetch expense.user",
        countQuery = "select count(expense) from Expense expense"
    )
    Page<Expense> findAllWithToOneRelationships(Pageable pageable);

    @Query("select expense from Expense expense left join fetch expense.category left join fetch expense.user")
    List<Expense> findAllWithToOneRelationships();

    @Query("select expense from Expense expense left join fetch expense.category left join fetch expense.user where expense.id =:id")
    Optional<Expense> findOneWithToOneRelationships(@Param("id") Long id);
}
