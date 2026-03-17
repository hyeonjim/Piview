package com.piview.backend.product.catalog.repository;

import com.piview.backend.product.entity.Allergen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AllergenRepository extends JpaRepository<Allergen, Long> {

    @Query("SELECT a.ingredient.ingredientId FROM Allergen a WHERE a.ingredient.ingredientId IN :ingredientIds")
    List<Long> findAllergenIngredientIds(@Param("ingredientIds") Collection<Long> ingredientIds);
}
