
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sun, Cloud, Moon, Check, Target, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { isFeatureEnabled } from '../components/utils/featureFlags';
import WelcomeModal from '../components/onboarding/WelcomeModal'; // ADDED

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

const wellnessDomainsConfig = [
  { subject: 'Physical', key: 'physical', fullMark: 42, color: '#3b82f6' },
  { subject: 'Mental', key: 'mental', fullMark: 42, color: '#6366f1' },
  { subject: 'Emotional', key: 'emotional', fullMark: 42, color: '#ec4899' },
  { subject: 'Spiritual', key: 'spiritual', fullMark: 42, color: '#f59e0b' },
  { subject: 'Relational', key: 'relational', fullMark: 42, color: '#14b8a6' },
  { subject: 'Vocational', key: 'vocational', fullMark: 42, color: '#10b981' },
  { subject: 'Core Skills', key: 'core_skills', fullMark: 42, color: '#9333ea' },
];

const WeeklyProgressRing = ({ completed, total, percentage }) => {
    const radius = 70;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getColorByPercentage = (pct) => {
        if (pct >= 80) return '#10b981';
        if (pct >= 50) return '#3b82f6';
        return '#94a3b8';
    };

    return (
        <div className="flex flex-col items-center relative">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle
                    stroke="#e2e8f0"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <motion.circle
                    stroke={getColorByPercentage(percentage)}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span className="text-3xl font-bold" style={{ color: getColorByPercentage(percentage) }}>
                    {percentage}%
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                    {completed}/{total} completed
                </span>
            </div>
        </div>
    );
};

const WeekCadenceDots = ({ weekData }) => {
    return (
        <div className="flex justify-center gap-2 mt-4">
            {weekData.map((day, idx) => {
                const fillClass = 
                    day.status === 'full' ? 'bg-green-500' :
                    day.status === 'partial' ? 'bg-blue-300' :
                    'bg-gray-200';
                
                return (
                    <div
                        key={idx}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${fillClass} transition-all duration-300`}
                        title={`${day.label}: ${day.completed}/${day.total} rhythms`}
                    >
                        <span className="text-xs font-medium text-white">
                            {day.label[0]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const DailyRhythmCard = ({ rhythm, icon: Icon, title, isCompleted }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    const cardVariants = isFeatureEnabled('ux_microAnimations_v1') ? {
        initial: { scale: 1, y: 0 },
        hover: { scale: 1.02, y: -4 },
        tap: { scale: 0.98 }
    } : {};

    const checkmarkVariants = isFeatureEnabled('ux_microAnimations_v1') ? {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: "spring", stiffness: 200, damping: 15 }
    } : {};

    return (
        <motion.div
            variants={cardVariants}
            initial="initial"
            whileHover={isFeatureEnabled('ux_hoverStates_v1') ? "hover" : undefined}
            whileTap={isFeatureEnabled('ux_microAnimations_v1') ? "tap" : undefined}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <Card 
                className={`transition-all duration-300 ${
                    isCompleted ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white hover:shadow-lg'
                }`}
                role="article"
                aria-label={`${title} rhythm ${isCompleted ? 'completed' : 'pending'}`}
            >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <motion.div
                            animate={isFeatureEnabled('ux_progressPulse_v1') && isCompleted ? {
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                            } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            <Icon className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
                        </motion.div>
                        <span className={isFeatureEnabled('ux_accessibilityContrast_v1') ? 'text-gray-900' : ''}>
                            {title}
                        </span>
                    </CardTitle>
                    {rhythm?.scheduled_time && (
                        <Badge variant="outline" className="text-xs font-mono">
                            {rhythm.scheduled_time}
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    {rhythm ? (
                        <>
                            <p className={`text-lg font-bold truncate ${
                                isCompleted ? 'line-through text-gray-500' : 'text-gray-800'
                            }`}>
                                {rhythm.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline">{rhythm.wellness_area}</Badge>
                                {isFeatureEnabled('ux_accessibilityIcons_v1') && !isCompleted && (
                                    <Badge variant="secondary" className="text-xs">
                                        ⏳ Pending
                                    </Badge>
                                )}
                            </div>
                            {isCompleted && (
                                <AnimatePresence>
                                    <motion.div
                                        {...(isFeatureEnabled('ux_microAnimations_v1') ? checkmarkVariants : {})}
                                        className="flex items-center gap-1 mt-2 text-green-600"
                                    >
                                        <Check className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                            {isFeatureEnabled('ux_microcopyTone_v1') 
                                                ? 'Nice work! ✨' 
                                                : 'Completed'
                                            }
                                        </span>
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-4">
                            {isFeatureEnabled('ux_emptyStateVisuals_v1') ? (
                                <>
                                    <Target className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {isFeatureEnabled('ux_microcopyTone_v1')
                                            ? "Ready to set your rhythm? Let's build something great! 🚀"
                                            : "No habit set"
                                        }
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground">
                                    No habit set
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default function DashboardPage() { // Renamed Dashboard to DashboardPage
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyRhythms, setDailyRhythms] = useState({ morning: null, midday: null, evening: null });
  const [weeklyProgress, setWeeklyProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [weekCadence, setWeekCadence] = useState([]);
  const [completedToday, setCompletedToday] = useState(new Set());
  const [teamSummary, setTeamSummary] = useState(null);
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(false); // ADDED
  const [onboardingChecked, setOnboardingChecked] = useState(false); // ADDED
  
  const navigate = useNavigate();

  const wellnessData = useMemo(() => {
    if (!user) return [];
    return wellnessDomainsConfig.map(domain => ({
      ...domain,
      score: user[`${domain.key}_score`] || 0,
    })).filter(d => d.score > 0);
  }, [user]);

  const motivationalMessage = useMemo(() => {
    const pct = weeklyProgress.percentage;
    if (pct >= 80) return "Momentum is building — keep going!";
    if (pct >= 50) return "You're on your way — finish strong this week.";
    return "Small steps add up. Try one more rhythm today.";
  }, [weeklyProgress.percentage]);

    // ADDITIVE: Check if user needs onboarding
    const checkOnboardingState = async (userData) => {
        try {
            const states = await base44.entities.UserOnboardingState.filter({
                user_id: userData.id
            });

            if (states.length === 0 || !states[0].seen_welcome) {
                // Show welcome modal for new users or users who haven't seen it
                setShowWelcomeModal(true);
                console.info('[onboarding_triggered]', { userId: userData.id });
            }
        } catch (error) {
            console.error('[onboarding_check_error]', error);
        }
    };

  useEffect(() => {
    const fetchData = async () => {
        try {
            const userData = await base44.auth.me();
            setUser(userData);
            
            // ADDITIVE: Check onboarding state
            if (!onboardingChecked) {
                await checkOnboardingState(userData); // Added await here
                setOnboardingChecked(true);
            }

            const habits = await base44.entities.Habit.filter({ user_id: userData.id, is_active: true });
            const morningHabit = habits.find(h => h.daypart === 'morning');
            const middayHabit = habits.find(h => h.daypart === 'midday');
            const eveningHabit = habits.find(h => h.daypart === 'evening');
            
            setDailyRhythms({
                morning: morningHabit,
                midday: middayHabit,
                evening: eveningHabit
            });

            const today = new Date();
            const weekStart = startOfWeek(today, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

            const activeDailyRhythms = habits.filter(h => 
                h.daypart && ['morning', 'midday', 'evening'].includes(h.daypart)
            ).length;

            const completions = await base44.entities.RhythmCompletion.filter({
                user_id: userData.id,
                date: {
                    $gte: format(weekStart, 'yyyy-MM-dd'),
                    $lte: format(weekEnd, 'yyyy-MM-dd')
                },
                status: 'completed'
            });

            const totalPossible = activeDailyRhythms * 7;
            const totalCompleted = completions.length;
            const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

            setWeeklyProgress({
                completed: totalCompleted,
                total: totalPossible,
                percentage
            });

            const cadenceData = weekDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayCompletions = completions.filter(c => c.date === dayStr);
                const dayTotal = activeDailyRhythms;
                const dayCompleted = dayCompletions.length;

                return {
                    label: format(day, 'EEE'),
                    completed: dayCompleted,
                    total: dayTotal,
                    status: dayCompleted === dayTotal && dayTotal > 0 ? 'full' : 
                            dayCompleted > 0 ? 'partial' : 'empty'
                };
            });

            setWeekCadence(cadenceData);

            const todayStr = format(today, 'yyyy-MM-dd');
            const todayCompletions = completions.filter(c => c.date === todayStr);
            setCompletedToday(new Set(todayCompletions.map(c => c.rhythm_id)));

            // NEW: Load team summary
            await loadTeamSummary(userData.id);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, []); // Changed dependency to empty array as onboardingChecked handles single run logic

  const loadTeamSummary = async (userId) => {
      try {
          const memberRecords = await base44.entities.TeamMember.filter({ member_id: userId });
          if (memberRecords.length === 0) {
              setTeamSummary(null);
              return;
          }

          const teamId = memberRecords[0].team_id;
          const team = await base44.entities.Team.get(teamId);
          
          if (!team || team.is_deleted) {
              setTeamSummary(null);
              return;
          }

          // Load active rhythm
          const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const rhythms = await base44.entities.TeamRhythm.filter({
              team_id: teamId,
              start_date: weekStart,
              active: true
          });

          // Load today's completion
          const today = format(new Date(), 'yyyy-MM-dd');
          const dailyCompletions = await base44.entities.TeamDailyCompletion.filter({
              team_id: teamId,
              date: today
          });

          setTeamSummary({
              team,
              activeRhythm: rhythms.length > 0 ? rhythms[0] : null,
              todayCompletion: dailyCompletions.length > 0 ? dailyCompletions[0] : null
          });

      } catch (error) {
          console.error("Error loading team summary:", error);
          setTeamSummary(null);
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {isFeatureEnabled('ux_loadingStates_v1') ? (
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <div className="rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </motion.div>
        ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 max-w-7xl mx-auto bg-gray-50/50"> {/* MODIFIED main div classes */}
        {/* ADDITIVE: Welcome Modal */}
        {user && (
            <WelcomeModal
                user={user}
                isOpen={showWelcomeModal}
                onClose={() => setShowWelcomeModal(false)}
            />
        )}

        <motion.div 
            initial={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 0, y: -20 } : {}}
            animate={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between"
        >
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{getGreeting()}, {user?.display_name || user?.full_name}!</h1>
                <p className="text-muted-foreground">
                    {isFeatureEnabled('ux_microcopyTone_v1')
                        ? "Here's your wellness journey for today. You've got this! 💪"
                        : "Here's your wellness summary for today."
                    }
                </p>
            </div>
            <motion.div
                whileHover={isFeatureEnabled('ux_hoverStates_v1') ? { scale: 1.1 } : {}}
                transition={{ type: "spring", stiffness: 400 }}
            >
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={user?.photo_url} />
                    <AvatarFallback>{(user?.display_name || user?.full_name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
            </motion.div>
        </motion.div>

        {/* NEW: Team Summary Card (only if user is on a team) */}
        {teamSummary && (
            <motion.div
                initial={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 0, scale: 0.95 } : {}}
                animate={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                My Team
                            </CardTitle>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => navigate(createPageUrl('MyTeam'))}
                                className={isFeatureEnabled('ux_hoverStates_v1') ? 'hover:scale-105 transition-transform' : ''}
                            >
                                View Team
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-lg">{teamSummary.team.team_name}</p>
                            {teamSummary.activeRhythm && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground">This week's rhythm:</p>
                                    <p className="font-medium">{teamSummary.activeRhythm.rhythm_title}</p>
                                    <Badge variant="outline" className="mt-1">
                                        {teamSummary.activeRhythm.rhythm_category}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        {teamSummary.todayCompletion && (
                            <div className="pt-3 border-t">
                                <p className="text-sm text-muted-foreground mb-2">Today's team progress:</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-primary">
                                        {Math.round(teamSummary.todayCompletion.completion_pct || 0)}%
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {teamSummary.todayCompletion.members_completed} of {teamSummary.todayCompletion.members_total} completed
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        )}

        <motion.div
            initial={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 0, scale: 0.95 } : {}}
            animate={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        This Week's Rhythms
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d, yyyy')}
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {weeklyProgress.total === 0 ? (
                        <div className="text-center py-8">
                            {isFeatureEnabled('ux_emptyStateVisuals_v1') ? (
                                <>
                                    <motion.div
                                        animate={isFeatureEnabled('ux_microAnimations_v1') ? {
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    </motion.div>
                                    <p className="text-muted-foreground mb-4">
                                        {isFeatureEnabled('ux_microcopyTone_v1')
                                            ? "Nothing here yet—take your first step today! 🌟"
                                            : "Set your daily rhythms to begin tracking your progress."
                                        }
                                    </p>
                                    <Button onClick={() => navigate(createPageUrl('DailyRhythms'))}>
                                        Get Started
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-muted-foreground mb-4">Set your daily rhythms to begin tracking your progress.</p>
                                    <Button onClick={() => navigate(createPageUrl('DailyRhythms'))}>
                                        Go to Daily Rhythms
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="relative" role="img" aria-label={`This week: ${weeklyProgress.completed} of ${weeklyProgress.total} rhythms completed, ${weeklyProgress.percentage} percent`}>
                                <WeeklyProgressRing 
                                    completed={weeklyProgress.completed}
                                    total={weeklyProgress.total}
                                    percentage={weeklyProgress.percentage}
                                />
                            </div>
                            
                            <WeekCadenceDots weekData={weekCadence} />
                            
                            <p className="text-center text-sm font-medium text-muted-foreground italic">
                                {isFeatureEnabled('ux_microcopyTone_v1') && weeklyProgress.percentage >= 80
                                    ? "You're crushing it this week! Keep that momentum going! 🔥"
                                    : motivationalMessage
                                }
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>

        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Your Daily Rhythms</h2>
                <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('DailyRhythms'))}>
                    Manage Rhythms
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { rhythm: dailyRhythms.morning, icon: Sun, title: "Morning", delay: 0 },
                    { rhythm: dailyRhythms.midday, icon: Cloud, title: "Midday", delay: 0.1 },
                    { rhythm: dailyRhythms.evening, icon: Moon, title: "Evening", delay: 0.2 }
                ].map(({ rhythm, icon, title, delay }) => (
                    <motion.div
                        key={title}
                        initial={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 0, y: 20 } : {}}
                        animate={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay }}
                    >
                        <DailyRhythmCard 
                            rhythm={rhythm} 
                            icon={icon} 
                            title={title} 
                            isCompleted={rhythm && completedToday.has(rhythm.id)}
                        />
                    </motion.div>
                ))}
            </div>
        </section>

        {wellnessData.length > 0 && (
            <motion.div
                initial={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 0, scale: 0.95 } : {}}
                animate={isFeatureEnabled('ux_microAnimations_v1') ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.4 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Your Wellness Profile</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {isFeatureEnabled('ux_microcopyTone_v1')
                                ? "Discover where you shine and where you can grow 🌱"
                                : "Discover your strengths and growth opportunities across wellness domains"
                            }
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={wellnessData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis 
                                        dataKey="subject" 
                                        tick={{ fill: '#475569', fontSize: 14, fontWeight: 600 }}
                                    />
                                    <Radar 
                                        name="Score" 
                                        dataKey="score" 
                                        stroke="#3b82f6" 
                                        fill="#3b82f6" 
                                        fillOpacity={0.5}
                                        strokeWidth={2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button 
                                variant="outline" 
                                onClick={() => navigate(createPageUrl('WellnessAssessment'))}
                                className={isFeatureEnabled('ux_hoverStates_v1') ? 'hover:scale-105 transition-transform' : ''}
                            >
                                View Full Assessment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )}
    </div>
  );
}
