package com.piview.backend.domain.product.catalog.repository;

import com.piview.backend.domain.product.entity.SkinConcerns;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SkinConcernsRepository extends JpaRepository<SkinConcerns, Long> {

        List<SkinConcerns> findAllByOrderByIdAsc();
}
