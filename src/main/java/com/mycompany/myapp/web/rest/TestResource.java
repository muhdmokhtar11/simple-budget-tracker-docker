package com.mycompany.myapp.web.rest;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing test-related operations.
 */
@RestController
@RequestMapping("/api/test")
public class TestResource {

    /**
     * {@code GET  /api/test/coverage} : Get code coverage data.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the coverage data.
     */
    @GetMapping("/coverage")
    public ResponseEntity<String> getCoverage() {
        try {
            // Look for coverage data in the static directory
            Path coveragePath = Path.of("target/classes/static/coverage.json");
            if (Files.exists(coveragePath)) {
                String coverageData = Files.readString(coveragePath);
                return ResponseEntity.ok().header("Content-Type", "application/json").body(coverageData);
            }

            // Return empty coverage if file doesn't exist
            return ResponseEntity.ok().header("Content-Type", "application/json").body("{}");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Failed to read coverage data\"}");
        }
    }
}
