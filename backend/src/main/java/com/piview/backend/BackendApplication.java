package com.piview.backend;

import com.piview.backend.global.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties(AppProperties.class)
@SpringBootApplication
public class BackendApplication {
    private int stttt_Sttt;
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
