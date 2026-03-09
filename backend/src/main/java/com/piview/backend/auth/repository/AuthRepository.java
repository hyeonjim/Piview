package com.piview.backend.auth.repository;

import com.piview.backend.auth.entity.Auth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthRepository extends JpaRepository<Auth, Long> {

    // 이메일을 통해 이미 가입된 유저인지 확인
    Optional<Auth> findByEmail(String email);
}