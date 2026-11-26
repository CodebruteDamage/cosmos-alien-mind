export function buildAnalyticsQuery({ windowMinutes, limit }) {
  if (!Number.isInteger(windowMinutes) || windowMinutes < 5 || windowMinutes > 1440
    || !Number.isInteger(limit) || limit < 1 || limit > 500) {
    const error = new Error("Analytics window must be 5-1440 minutes and limit must be 1-500.");
    error.code = "INVALID_ANALYTICS_QUERY";
    throw error;
  }
  return { windowMinutes, limit };
}
