# Matching Algorithm — WellMatch

## Overview

The compatibility score (0-100) between two users is calculated across 6 dimensions with configurable weights. The algorithm uses only semantic band data from `public_wellness_profile` — no raw health metrics.

## Dimensions and Weights

| Dimension    | Weight | Source Field                  | Scoring Method       |
|-------------|--------|-------------------------------|----------------------|
| goals       | 0.25   | wellness_goals                 | Jaccard similarity   |
| activities  | 0.20   | preferred_activities           | Jaccard similarity   |
| chronotype  | 0.15   | chronotype_band                | Ordinal distance     |
| intensity   | 0.15   | intensity_preference           | Ordinal distance     |
| availability| 0.15   | availability_periods           | Jaccard similarity   |
| consistency | 0.10   | activity_consistency_band      | Ordinal distance     |

## Scoring Details

### Jaccard Similarity (goals, activities, availability)
```
score = (intersection_size / union_size) * 100
```
Default: 50 when either list is empty.

### Ordinal Distance (chronotype, intensity, consistency)
Each dimension has an ordered scale. Score decreases with distance:

- Chronotype: [early, morning, flexible, evening, night] → scores [100, 80, 50, 20, 0]
- Intensity: [low, moderate, flexible, high] → scores [100, 70, 30, 0]
- Consistency: [low, medium, high] → scores [100, 60, 20]

Default: 50 when value is unknown.

## Confidence

Score confidence is calculated from the number of populated profile fields:

- 4+ fields populated → "high"
- 2-3 fields populated → "medium"
- 0-1 fields populated → "low"

## Response Format

```json
{
  "total": 85,
  "confidence": "high",
  "reasons": ["Wellness goals align well", "Share preferred activities", "Similar daily energy rhythms"],
  "dimensions": [
    { "dimension": "goals", "score": 80, "weight": 0.25, "reason": "Wellness goals align well" },
    { "dimension": "chronotype", "score": 100, "weight": 0.15, "reason": "Similar daily energy rhythms" }
  ]
}
```

## Rate Limiting

- MAX_SWIPES_PER_DAY (default 50) — counted from `swipe_history` for current user
- Previously allowed unlimited swipes (B002) — now uses daily count via timestamp
- Swipe operation wrapped in database transaction to prevent race conditions on bilateral match (swipe + match creation in atomic block)
