package com.piview.backend.skin.survey.repository;

import com.piview.backend.skin.survey.entity.MySkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MySkinRepository extends JpaRepository<MySkin, Long> {

    List<MySkin> findAllByUserId(Long userId);

    void deleteAllByUserId(Long userId);
}
