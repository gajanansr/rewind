-- V2__seed_patterns.sql
-- Seed all 21 DSA patterns

INSERT INTO patterns (name, category, importance_weight, short_mental_model) VALUES
('Two Pointers', 'Array', 4, 'Use two pointers from different ends or directions to traverse an array'),
('Sliding Window', 'Array', 5, 'Maintain a window that slides across data to find contiguous subsets'),
('Fast & Slow Pointers', 'Linked List', 3, 'Two pointers moving at different speeds to detect cycles or find middle'),
('Merge Intervals', 'Interval', 4, 'Sort and merge overlapping intervals by comparing start/end times'),
('Cyclic Sort', 'Array', 3, 'Sort arrays where elements are in a known range using index placement'),
('In-place Reversal of a Linked List', 'Linked List', 3, 'Reverse linked list nodes in-place without extra space'),
('Tree Breadth First Search', 'Tree', 4, 'Level-by-level traversal using a queue'),
('Tree Depth First Search', 'Tree', 5, 'Traverse depth-wise before siblings using recursion or stack'),
('Two Heaps', 'Heap', 4, 'Use min and max heaps to track median or partition elements'),
('Subsets', 'Backtracking', 4, 'Generate all possible subsets using backtracking or iteration'),
('Modified Binary Search', 'Search', 5, 'Adapt binary search for rotated arrays, finding boundaries, etc.'),
('Top K Elements', 'Heap', 4, 'Use heap to efficiently find k largest/smallest elements'),
('Bitwise XOR', 'Bit Manipulation', 3, 'Use XOR properties to find single/missing numbers'),
('Backtracking', 'Recursion', 5, 'Explore all solutions and backtrack when hitting dead ends'),
('0/1 Knapsack (Dynamic Programming)', 'DP', 5, 'Choose to include or exclude items, building up optimal solution'),
('Topological Sort (Graph)', 'Graph', 4, 'Order nodes in DAG so dependencies come before dependents'),
('K-way Merge', 'Heap', 3, 'Merge k sorted lists using min-heap for efficiency'),
('Monotonic Stack', 'Stack', 4, 'Maintain stack in increasing/decreasing order for next greater/smaller'),
('Union Find', 'Graph', 3, 'Track disjoint sets with union and find operations for connectivity'),
('Island (Matrix Traversal)', 'Matrix', 4, 'Traverse matrix to find and count connected components'),
('Greedy', 'Algorithm', 4, 'Make locally optimal choices hoping for global optimum')
ON CONFLICT (name) DO NOTHING;
