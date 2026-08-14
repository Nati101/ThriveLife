export const FEATURE_FLAGS = {
  daily_rhythms_v2: true,
  teams_shared_weekly_rhythm_v1: true,
  teams_wins_board_v1: true,
  teams_dailyCheckin_v1: true,
  teams_weeklyBackfill_v1: true,
  teams_chat_v1: true,
  teams_memberWins_v1: true,
  teams_weeklyStats_v1: true,
  teams_personalGoals_v1: true,
  teams_headToHead_v2: true,
  teams_teamChallenge_v1: true,
  teams_checkinAutoPost_v1: true,
  teams_teamProgressBanner_v1: true,
  teams_teamChallengeLink_v1: true,
  teams_optimisticUpdate_v1: true,
  teams_cheerReactions_v1: true,
  teams_toastCelebration_v1: true,
  teams_accessibilityIcons_v1: true,
  
  // UX Enhancement Flags v1
  ux_microAnimations_v1: true,
  ux_microcopyTone_v1: true,
  ux_feedbackToasts_v1: true,
  ux_emptyStateVisuals_v1: true,
  ux_accessibilityContrast_v1: true,
  ux_realTimeVisuals_v1: true,
  ux_progressPulse_v1: true,
  ux_hoverStates_v1: true,
  ux_loadingStates_v1: true,
  ux_celebrationEffects_v1: true,
  
  // World-Class UX Enhancement Flags v2
  ux_microAnimations_v2: true,
  ux_motivationEffects_v2: true,
  ux_feedbackSystem_v2: true,
  ux_realTimeVisualSync_v2: true,
  ux_accessibilityEnhancements_v2: true,
  ux_ambientGradients_v2: true,
  ux_glassBlur_v2: true,
  ux_depthLayers_v2: true,
  ux_teamPulse_v2: true,
  ux_smartToasts_v2: true,
  ux_psychologicalSafety_v2: true,
  ux_weeklyGratitude_v2: true,
  
  // NEW: Onboarding & Chat Fix Flags
  onboarding_welcomeModal: true,
  onboarding_stepBanners: true,
  onboarding_coachmarks: true,
  chat_reactions: true,
  chat_threading: true,
  chat_systemMessageInteractions: true,
  
  // Backup configurations
  legacy_menu_backup: {
    original_items: ["Home", "My Teams", "Habits", "Challenges", "Wellness Assessment", "Journal", "Settings"],
    timestamp: new Date().toISOString()
  }
};

export const isFeatureEnabled = (flagName) => {
  return FEATURE_FLAGS[flagName] === true;
};
