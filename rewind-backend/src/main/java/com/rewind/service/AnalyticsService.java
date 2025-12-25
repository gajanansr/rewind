package com.rewind.service;

import com.rewind.model.*;
import com.rewind.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserQuestionRepository userQuestionRepository;
    private final RevisionScheduleRepository revisionScheduleRepository;
    private final UserPatternStatsRepository patternStatsRepository;
    private final QuestionRepository questionRepository;

    /**
     * Get weekly progress - questions solved per day for last 30 days.
     */
    public List<DailyProgress> getWeeklyProgress(User user, int days) {
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        List<UserQuestion> completed = userQuestionRepository.findCompletedByUserIdSince(user.getId(), startDate);

        // Group by day
        Map<LocalDate, Long> byDay = completed.stream()
                .filter(uq -> uq.getDoneAt() != null)
                .collect(Collectors.groupingBy(
                        uq -> uq.getDoneAt().atZone(ZoneOffset.UTC).toLocalDate(),
                        Collectors.counting()));

        // Build list for all days (including zeros)
        List<DailyProgress> result = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long count = byDay.getOrDefault(date, 0L);
            result.add(new DailyProgress(date.toString(), (int) count));
        }
        return result;
    }

    /**
     * Get pattern progress - completion rate per pattern.
     */
    public List<PatternProgress> getPatternProgress(User user) {
        List<Pattern> allPatterns = questionRepository.findAll().stream()
                .map(Question::getPattern)
                .distinct()
                .toList();

        List<PatternProgress> result = new ArrayList<>();
        for (Pattern pattern : allPatterns) {
            long total = questionRepository.countByPatternId(pattern.getId());
            var stats = patternStatsRepository.findByUserIdAndPatternId(user.getId(), pattern.getId());
            int completed = stats.map(UserPatternStats::getQuestionsCompleted).orElse(0);

            result.add(new PatternProgress(
                    pattern.getName(),
                    pattern.getCategory(),
                    completed,
                    (int) total,
                    total > 0 ? (int) ((completed * 100) / total) : 0));
        }

        // Sort by completion percentage (lowest first to show weak patterns)
        result.sort(Comparator.comparingInt(PatternProgress::percentComplete));
        return result;
    }

    /**
     * Get streak data - current and longest streak.
     */
    public StreakData getStreakData(User user) {
        List<UserQuestion> completed = userQuestionRepository.findCompletedByUserId(user.getId());

        if (completed.isEmpty()) {
            return new StreakData(0, 0, 0, null);
        }

        // Get unique dates when questions were completed
        Set<LocalDate> activeDates = completed.stream()
                .filter(uq -> uq.getDoneAt() != null)
                .map(uq -> uq.getDoneAt().atZone(ZoneOffset.UTC).toLocalDate())
                .collect(Collectors.toSet());

        // Calculate current streak
        int currentStreak = 0;
        LocalDate today = LocalDate.now();
        while (activeDates.contains(today.minusDays(currentStreak))) {
            currentStreak++;
        }

        // Calculate longest streak
        List<LocalDate> sortedDates = activeDates.stream().sorted().toList();
        int longestStreak = 0;
        int tempStreak = 1;

        for (int i = 1; i < sortedDates.size(); i++) {
            if (sortedDates.get(i).minusDays(1).equals(sortedDates.get(i - 1))) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Total questions completed (counting all, not unique)
        int totalCompleted = completed.size();

        // Last active date
        LocalDate lastActive = sortedDates.isEmpty() ? null : sortedDates.get(sortedDates.size() - 1);

        return new StreakData(currentStreak, longestStreak, totalCompleted, lastActive);
    }

    // Result records
    public record DailyProgress(String date, int count) {
    }

    public record PatternProgress(
            String name,
            String category,
            int completed,
            int total,
            int percentComplete) {
    }

    public record StreakData(
            int currentStreak,
            int longestStreak,
            int totalCompleted,
            LocalDate lastActive) {
    }
}
