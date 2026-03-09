package com.piview.backend.global.security;

import com.piview.backend.auth.entity.Auth;
import com.piview.backend.auth.repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final AuthRepository authRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    // DB에서 이메일로 진짜 유저 데이터(Auth) 찾기
    Auth auth = authRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("해당 이메일을 가진 유저를 찾을 수 없습니다: " + email));

    // 찾은 유저 데이터를 시큐리티 표준 신분증(UserPrincipal)으로 포장해서 반환
    return UserPrincipal.create(auth);
  }
}