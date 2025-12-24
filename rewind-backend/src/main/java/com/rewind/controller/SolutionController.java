package com.rewind.controller;

import com.rewind.dto.QuestionDTO.*;
import com.rewind.model.*;
import com.rewind.service.UserQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SolutionController {

    private final UserQuestionService userQuestionService;

    @PostMapping("/solutions")
    public ResponseEntity<Map<String, Object>> submitSolution(
            @AuthenticationPrincipal User user,
            @RequestBody SubmitSolutionRequest request) {
        Solution solution = userQuestionService.submitSolution(
                user,
                request.getUserQuestionId(),
                request.getCode(),
                request.getLanguage(),
                request.getLeetcodeSubmissionLink());

        return ResponseEntity.status(201).body(Map.of(
                "solutionId", solution.getId(),
                "isOptimal", solution.getIsOptimal() != null ? solution.getIsOptimal() : false,
                "nextStep", "RECORD_EXPLANATION",
                "message", "Solution saved. Please record your explanation."));
    }
}
