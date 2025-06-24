package com.mycompany.myapp.repository;

import com.mycompany.myapp.domain.Income;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Income entity.
 */
@Repository
public interface IncomeRepository extends JpaRepository<Income, Long> {
    @Query("select income from Income income where income.user.login = ?#{authentication.name}")
    List<Income> findByUserIsCurrentUser();

    default Optional<Income> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Income> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Income> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select income from Income income left join fetch income.category left join fetch income.user",
        countQuery = "select count(income) from Income income"
    )
    Page<Income> findAllWithToOneRelationships(Pageable pageable);

    @Query("select income from Income income left join fetch income.category left join fetch income.user")
    List<Income> findAllWithToOneRelationships();

    @Query("select income from Income income left join fetch income.category left join fetch income.user where income.id =:id")
    Optional<Income> findOneWithToOneRelationships(@Param("id") Long id);
}
