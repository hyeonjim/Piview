package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    @Query("SELECT i FROM Ingredient i WHERE i.nameKo IN :names OR i.nameEn IN :names")
    List<Ingredient> findAllByNames(@Param("names") Collection<String> names);
}
