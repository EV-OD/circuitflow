export const COSTS = {
  BASE_MOVE: 10,
  TURN_PENALTY: 500,
  CROSSING_WIRE: 2000,
  PROXIMITY_PENALTY: 150,
};

// Tie-breaker multiplier for heuristic to make A* slightly greedy
export const HEURISTIC_MULTIPLIER = 1.01;