// ============================================================================
// PLAY STORE STATS — install counts and ratings, keyed by app slug.
// One source of truth: the home cards (content.js) and the /apps/<slug>
// case studies both read from here, so a milestone is a one-line update.
//
// `rating` stays null until an app has enough public ratings for Play to
// publish a score — the UI omits the rating pill entirely while it is null.
// ============================================================================

export const playStats = {
  expensetrackr: { downloads: "50+", rating: null },
  pockettunes: { downloads: "100+", rating: "4.8" },
  statussaver: { downloads: "50+", rating: null },
};

export default playStats;
