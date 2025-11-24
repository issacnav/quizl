"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  TrendingDown,
  Globe,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// =============================================================================
// TYPES
// =============================================================================
interface KPIData {
  totalUsers: number;
  totalUsersChange: number;
  totalAttempts: number;
  completionRate: number;
  avgScore: number;
  maxScore: number;
}

interface ActivityDataPoint {
  date: string;
  attempts: number;
}

interface ScoreDistributionPoint {
  range: string;
  count: number;
  color: string;
}

interface LocationData {
  country: string;
  code: string;
  percentage: number;
  users: number;
}

// =============================================================================
// MOCK DATA (for geography - no real data available yet)
// =============================================================================
const MOCK_LOCATIONS: LocationData[] = [
  { country: "United States", code: "US", percentage: 38, users: 4691 },
  { country: "United Kingdom", code: "GB", percentage: 22, users: 2716 },
  { country: "Canada", code: "CA", percentage: 15, users: 1852 },
  { country: "Germany", code: "DE", percentage: 10, users: 1235 },
  { country: "Australia", code: "AU", percentage: 8, users: 988 },
  { country: "India", code: "IN", percentage: 7, users: 863 },
];

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================
interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 shadow-2xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="text-white font-semibold">
            {item.dataKey === "attempts" ? "Attempts" : "Users"}:{" "}
            {item.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// =============================================================================
// KPI CARD COMPONENT
// =============================================================================
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: {
    value: number;
    type: "increase" | "decrease";
  };
  showPulse?: boolean;
  progressBar?: number;
  isLoading?: boolean;
}

const KPICard = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  showPulse,
  progressBar,
  isLoading,
}: KPICardProps) => {
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 group hover:border-white/20 transition-colors"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5">
            {icon}
          </div>
          {badge && !isLoading && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                badge.type === "increase"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {badge.type === "increase" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {badge.value}%
            </div>
          )}
          {showPulse && !isLoading && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          )}
        </div>

        <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            <span className="text-zinc-500">Loading...</span>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-white tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
            )}
          </>
        )}

        {progressBar !== undefined && !isLoading && (
          <div className="mt-4">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressBar}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// =============================================================================
// DOTTED WORLD MAP SVG
// =============================================================================
const DottedWorldMap = () => (
  <svg
    viewBox="0 0 800 400"
    className="absolute inset-0 w-full h-full opacity-[0.03]"
    fill="currentColor"
  >
    {/* North America */}
    <circle cx="150" cy="120" r="2" />
    <circle cx="165" cy="115" r="2" />
    <circle cx="180" cy="110" r="2" />
    <circle cx="195" cy="115" r="2" />
    <circle cx="140" cy="135" r="2" />
    <circle cx="155" cy="140" r="2" />
    <circle cx="170" cy="135" r="2" />
    <circle cx="185" cy="140" r="2" />
    <circle cx="200" cy="135" r="2" />
    <circle cx="130" cy="155" r="2" />
    <circle cx="145" cy="160" r="2" />
    <circle cx="160" cy="155" r="2" />
    <circle cx="175" cy="160" r="2" />
    <circle cx="190" cy="155" r="2" />
    <circle cx="205" cy="160" r="2" />
    <circle cx="220" cy="155" r="2" />
    <circle cx="140" cy="175" r="2" />
    <circle cx="155" cy="180" r="2" />
    <circle cx="170" cy="175" r="2" />
    <circle cx="185" cy="180" r="2" />
    {/* Europe */}
    <circle cx="420" cy="100" r="2" />
    <circle cx="435" cy="105" r="2" />
    <circle cx="450" cy="100" r="2" />
    <circle cx="465" cy="105" r="2" />
    <circle cx="410" cy="120" r="2" />
    <circle cx="425" cy="115" r="2" />
    <circle cx="440" cy="120" r="2" />
    <circle cx="455" cy="115" r="2" />
    <circle cx="470" cy="120" r="2" />
    <circle cx="420" cy="135" r="2" />
    <circle cx="435" cy="140" r="2" />
    <circle cx="450" cy="135" r="2" />
    <circle cx="465" cy="140" r="2" />
    <circle cx="480" cy="135" r="2" />
    {/* Asia */}
    <circle cx="550" cy="120" r="2" />
    <circle cx="565" cy="125" r="2" />
    <circle cx="580" cy="120" r="2" />
    <circle cx="595" cy="125" r="2" />
    <circle cx="610" cy="120" r="2" />
    <circle cx="625" cy="125" r="2" />
    <circle cx="640" cy="130" r="2" />
    <circle cx="655" cy="135" r="2" />
    <circle cx="560" cy="145" r="2" />
    <circle cx="575" cy="150" r="2" />
    <circle cx="590" cy="145" r="2" />
    <circle cx="605" cy="150" r="2" />
    <circle cx="620" cy="155" r="2" />
    <circle cx="635" cy="160" r="2" />
    <circle cx="650" cy="155" r="2" />
    <circle cx="665" cy="165" r="2" />
    <circle cx="680" cy="170" r="2" />
    <circle cx="695" cy="165" r="2" />
    {/* South America */}
    <circle cx="230" cy="250" r="2" />
    <circle cx="245" cy="255" r="2" />
    <circle cx="260" cy="250" r="2" />
    <circle cx="240" cy="270" r="2" />
    <circle cx="255" cy="275" r="2" />
    <circle cx="250" cy="290" r="2" />
    <circle cx="265" cy="295" r="2" />
    <circle cx="255" cy="310" r="2" />
    <circle cx="260" cy="325" r="2" />
    <circle cx="250" cy="340" r="2" />
    {/* Africa */}
    <circle cx="440" cy="190" r="2" />
    <circle cx="455" cy="195" r="2" />
    <circle cx="470" cy="190" r="2" />
    <circle cx="485" cy="195" r="2" />
    <circle cx="450" cy="210" r="2" />
    <circle cx="465" cy="215" r="2" />
    <circle cx="480" cy="210" r="2" />
    <circle cx="495" cy="215" r="2" />
    <circle cx="510" cy="220" r="2" />
    <circle cx="460" cy="235" r="2" />
    <circle cx="475" cy="240" r="2" />
    <circle cx="490" cy="235" r="2" />
    <circle cx="505" cy="240" r="2" />
    <circle cx="470" cy="260" r="2" />
    <circle cx="485" cy="265" r="2" />
    <circle cx="480" cy="285" r="2" />
    {/* Australia */}
    <circle cx="660" cy="280" r="2" />
    <circle cx="675" cy="275" r="2" />
    <circle cx="690" cy="280" r="2" />
    <circle cx="705" cy="275" r="2" />
    <circle cx="655" cy="295" r="2" />
    <circle cx="670" cy="300" r="2" />
    <circle cx="685" cy="295" r="2" />
    <circle cx="700" cy="300" r="2" />
    <circle cx="715" cy="295" r="2" />
    <circle cx="665" cy="315" r="2" />
    <circle cx="680" cy="320" r="2" />
    <circle cx="695" cy="315" r="2" />
  </svg>
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getCountryFlag(code: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    DE: "🇩🇪",
    AU: "🇦🇺",
    IN: "🇮🇳",
  };
  return flags[code] || "🌍";
}

function getScoreColor(range: string): string {
  const colors: Record<string, string> = {
    "0-10k": "#ef4444",
    "10k-20k": "#f97316",
    "20k-30k": "#eab308",
    "30k-40k": "#22c55e",
    "40k+": "#10b981",
  };
  return colors[range] || "#8b5cf6";
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AnalyticsPage() {
  const [dateRange] = useState("Last 30 Days");
  const [isLoading, setIsLoading] = useState(true);

  // KPI State
  const [kpiData, setKpiData] = useState<KPIData>({
    totalUsers: 0,
    totalUsersChange: 0,
    totalAttempts: 0,
    completionRate: 0,
    avgScore: 0,
    maxScore: 50000,
  });

  // Chart Data State
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<
    ScoreDistributionPoint[]
  >([]);

  // Location data (mock for now)
  const [locationData] = useState<LocationData[]>(MOCK_LOCATIONS);

  // ==========================================================================
  // FETCH DATA
  // ==========================================================================
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Total unique users (distinct usernames from leaderboard)
      const { data: usersData, error: usersError } = await supabase
        .from("leaderboard")
        .select("username");

      const uniqueUsers = usersData
        ? new Set(usersData.map((u) => u.username)).size
        : 0;

      // 2. Total attempts (count from quiz_attempts table for accuracy)
      const { count: totalAttempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true });

      // 3. Average score (from quiz_attempts)
      const { data: scoresData, error: scoresError } = await supabase
        .from("quiz_attempts")
        .select("score");

      let avgScore = 0;
      let maxScore = 50000;
      if (scoresData && scoresData.length > 0) {
        const totalScore = scoresData.reduce((sum, s) => sum + (s.score || 0), 0);
        avgScore = Math.round(totalScore / scoresData.length);
        maxScore = Math.max(...scoresData.map((s) => s.score || 0), 50000);
      }

      // 4. Activity data (attempts per day over last 30 days from quiz_attempts)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      const { data: activityRaw, error: activityError } = await supabase
        .from("quiz_attempts")
        .select("created_at")
        .gte("created_at", thirtyDaysAgoStr)
        .order("created_at", { ascending: true });

      // Group by date
      const activityMap = new Map<string, number>();

      // Initialize all 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        activityMap.set(dateStr, 0);
      }

      // Fill in actual data
      if (activityRaw) {
        activityRaw.forEach((entry) => {
          const d = new Date(entry.created_at);
          const dateStr = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
        });
      }

      const activityChartData: ActivityDataPoint[] = Array.from(
        activityMap.entries()
      ).map(([date, attempts]) => ({
        date,
        attempts,
      }));

      // 5. Score distribution (bucket scores)
      const scoreRanges = [
        { range: "0-10k", min: 0, max: 10000 },
        { range: "10k-20k", min: 10000, max: 20000 },
        { range: "20k-30k", min: 20000, max: 30000 },
        { range: "30k-40k", min: 30000, max: 40000 },
        { range: "40k+", min: 40000, max: Infinity },
      ];

      const distributionData: ScoreDistributionPoint[] = scoreRanges.map(
        ({ range, min, max }) => {
          const count = scoresData
            ? scoresData.filter((s) => s.score >= min && s.score < max).length
            : 0;
          return {
            range,
            count,
            color: getScoreColor(range),
          };
        }
      );

      // 6. Calculate completion rate (users who scored > 0 / total attempts)
      const usersWithScores = scoresData
        ? scoresData.filter((s) => s.score > 0).length
        : 0;
      const completionRate =
        totalAttempts && totalAttempts > 0
          ? Math.round((usersWithScores / totalAttempts) * 100)
          : 0;

      // Log any errors
      if (usersError) console.error("Users fetch error:", usersError);
      if (attemptsError) console.error("Attempts fetch error:", attemptsError);
      if (scoresError) console.error("Scores fetch error:", scoresError);
      if (activityError) console.error("Activity fetch error:", activityError);

      // Update state
      setKpiData({
        totalUsers: uniqueUsers,
        totalUsersChange: 12.5, // Mock value - would need historical data to calculate
        totalAttempts: totalAttempts || 0,
        completionRate,
        avgScore,
        maxScore,
      });
      setActivityData(activityChartData);
      setScoreDistribution(distributionData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();

    // Real-time Subscription (Listen to quiz_attempts)
    const channel = supabase
      .channel('analytics_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quiz_attempts' },
        (payload) => {
          console.log('New anonymous quiz attempt detected:', payload);
          fetchAnalyticsData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalyticsData]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="w-full text-white font-sans selection:bg-zinc-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="px-6 h-16 flex items-center justify-between w-full">
          <div>
            <h1 className="font-bold text-lg tracking-tight">Analytics</h1>
            <p className="text-xs text-zinc-500">Real-time platform insights</p>
          </div>
          <Button
            variant="outline"
            className="bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white rounded-lg px-4"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {dateRange}
            <ChevronDown className="w-4 h-4 ml-2 text-zinc-500" />
          </Button>
        </div>
      </header>

      <main className="relative px-6 py-8 space-y-6 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 w-full"
        >
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <KPICard
              title="Total Users"
              value={
                isLoading ? "-" : kpiData.totalUsers.toLocaleString() || "0"
              }
              icon={<Users className="w-5 h-5 text-zinc-400" />}
              badge={
                !isLoading
                  ? {
                      value: kpiData.totalUsersChange,
                      type: "increase",
                    }
                  : undefined
              }
              isLoading={isLoading}
            />
            <KPICard
              title="Total Attempts"
              value={
                isLoading ? "-" : kpiData.totalAttempts.toLocaleString() || "0"
              }
              icon={<Activity className="w-5 h-5 text-emerald-400" />}
              showPulse={!isLoading}
              isLoading={isLoading}
            />
            <KPICard
              title="Completion Rate"
              value={isLoading ? "-" : `${kpiData.completionRate}%`}
              icon={<Target className="w-5 h-5 text-zinc-400" />}
              progressBar={isLoading ? undefined : kpiData.completionRate}
              isLoading={isLoading}
            />
            <KPICard
              title="Avg. Score"
              value={
                isLoading
                  ? "-"
                  : `${kpiData.avgScore.toLocaleString()}`
              }
              subtitle="Points per quiz"
              icon={<Trophy className="w-5 h-5 text-amber-400" />}
              isLoading={isLoading}
            />
          </div>

          {/* Main Chart */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Quiz Attempts
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Daily activity over the last 30 days
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                    <span className="text-xs text-zinc-400">Attempts</span>
                  </div>
                </div>
              </div>
              {isLoading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activityData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="attemptGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        dy={10}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        dx={-10}
                        tickFormatter={(value) =>
                          value >= 1000 ? `${value / 1000}k` : value
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="attempts"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#attemptGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* Bottom Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locations (Mock Data) */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <DottedWorldMap />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5">
                    <Globe className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Top Locations
                    </h3>
                    <p className="text-sm text-zinc-500">
                      User distribution by country{" "}
                      <span className="text-zinc-600">(sample data)</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {locationData.map((location, idx) => (
                    <motion.div
                      key={location.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx + 0.3 }}
                      className="group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {getCountryFlag(location.code)}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {location.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500">
                            {location.users.toLocaleString()} users
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {location.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${location.percentage}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.1 * idx + 0.5,
                            ease: "easeOut",
                          }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Score Distribution */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Score Distribution
                    </h3>
                    <p className="text-sm text-zinc-500">
                      How users perform across score ranges
                    </p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-[280px] w-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={scoreDistribution}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="range"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#71717a", fontSize: 12 }}
                          dx={-10}
                          tickFormatter={(value) =>
                            value >= 1000 ? `${value / 1000}k` : value
                          }
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-zinc-900 border border-white/10 rounded-lg px-4 py-3 shadow-2xl">
                                  <p className="text-zinc-400 text-xs mb-1">
                                    Score Range: {label}
                                  </p>
                                  <p className="text-white font-semibold">
                                    {(
                                      payload[0].value as number
                                    ).toLocaleString()}{" "}
                                    users
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-xs text-zinc-500">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                    <span className="text-xs text-zinc-500">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-zinc-500">High</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
