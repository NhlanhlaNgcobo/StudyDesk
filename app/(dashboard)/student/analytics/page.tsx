"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart2,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Layout,
  Target,
  Flame,
  Activity,
  Zap,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const ACTIVITY_DATA = [
  { day: "Mon", hours: 4.2 }, { day: "Tue", hours: 6.8 }, { day: "Wed", hours: 2.5 },
  { day: "Thu", hours: 7.2 }, { day: "Fri", hours: 5.4 }, { day: "Sat", hours: 3.1 },
  { day: "Sun", hours: 1.8 },
];

const MODULE_RADAR = [
  { subject: "Maths", score: 85, full: 100 },
  { subject: "Law", score: 62, full: 100 },
  { subject: "Engineering", score: 91, full: 100 },
  { subject: "Medicine", score: 55, full: 100 },
  { subject: "Language", score: 78, full: 100 },
];

const GOAL_RINGS = [
  { label: "Hours Labored", current: 24, target: 40, color: "#4DA6FF" },
  { label: "Modules Cleared", current: 8, target: 12, color: "#10B981" },
  { label: "Quizzes Dominated", current: 16, target: 20, color: "#F59E0B" },
];

const RECENT_WINS = [
  { id: "1", title: "A+ Performance", subtitle: "Physics Mock Exam", date: "Today", score: "96%", color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "2", title: "7-Day Streak", subtitle: "Consistency Master", date: "Yesterday", score: "Keep it up!", color: "text-orange-500", bg: "bg-orange-50" },
  { id: "3", title: "Material Wizard", subtitle: "24 Notes Generated", date: "2 days ago", score: "Top 5%", color: "text-blue-500", bg: "bg-blue-50" },
];

const HEATMAP_INTENSITIES = [
  0, 1, 2, 1, 3, 4, 2, 3, 1, 0,
  2, 3, 4, 2, 1, 0, 1, 2, 3, 4,
  2, 2, 1, 3, 4, 4, 3, 2, 1, 0,
  1, 2, 2, 3, 1, 0, 4, 3, 2, 1,
  0, 1, 3, 4, 2, 1, 0, 2, 3, 4,
];

const DashboardStat = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-xl shadow-sm space-y-6 group hover:border-primary/30 hover:shadow-xl hover:shadow-black/5 transition-all">
    <div className="flex justify-between items-start">
      <div className={cn("w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-base flex items-center justify-center transition-all group-hover:scale-110", color)}>
        <Icon size={24} />
      </div>
      <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
        <ArrowUpRight size={14} /> {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">{label}</p>
      <h3 className="text-4xl font-bold italic tracking-tight">{value}</h3>
    </div>
  </div>
);

const HeatmapTile = ({ intensity }: { intensity: number }) => (
  <div
    className={cn(
      "w-4 h-4 rounded-sm transition-all hover:scale-125 border border-white/5 shadow-sm",
      intensity === 0 ? "bg-slate-50 dark:bg-slate-800" :
      intensity === 1 ? "bg-primary/20" :
      intensity === 2 ? "bg-primary/40" :
      intensity === 3 ? "bg-primary/60" :
      "bg-primary"
    )}
  />
);

export default function AnalyticsPage() {
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold italic tracking-tight underline decoration-primary decoration-4 uppercase">Academic Intelligence</h1>
          <p className="text-text-secondary font-semibold text-lg mt-2">Historical breakdown of your cognitive performance and study consistency.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900 text-white p-6 rounded-xl shadow-xl border-t-4 border-primary">
          <Flame className="text-orange-400" size={32} />
          <div>
            <p className="text-3xl font-black italic leading-none">12 Days</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Study Streak</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <DashboardStat label="Total Study Hours" value="142" icon={Clock} color="text-primary" trend="+12%" />
        <DashboardStat label="Completed Quizzes" value="48" icon={Target} color="text-emerald-500" trend="+5%" />
        <DashboardStat label="AI Notes Consumed" value="112" icon={Layout} color="text-blue-500" trend="+24%" />
        <DashboardStat label="Mastery Rank" value="Top 4%" icon={Star} color="text-orange-500" trend="+1%" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-10 shadow-sm space-y-10">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-xl font-bold uppercase italic tracking-tight underline decoration-primary decoration-4">Study Efficiency Trends</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
              {["Weeks", "Months", "Semesters"].map((t) => (
                <button key={t} className="shrink-0 px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest text-text-secondary hover:border-primary hover:text-primary transition-all shadow-sm">By {t}</button>
              ))}
            </div>
          </div>

          <div className="h-80 w-full min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4DA6FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4DA6FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 900, fill: "#64748b" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", padding: "16px" }}
                    labelStyle={{ fontWeight: 900, marginBottom: "8px", fontSize: "12px", color: "#000" }}
                    itemStyle={{ fontWeight: 700, fontSize: "10px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#4DA6FF"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-slate-50 dark:bg-slate-800 animate-pulse" />
            )}
          </div>

          <div className="pt-8 border-t space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contribution Concentration (GitHub-style)</p>
            <div className="flex flex-wrap gap-2">
              {HEATMAP_INTENSITIES.map((intensity, i) => (
                <HeatmapTile key={i} intensity={intensity} />
              ))}
              <div className="ml-4 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Less</span>
                <div className="flex gap-1.5"><HeatmapTile intensity={0} /><HeatmapTile intensity={1} /><HeatmapTile intensity={2} /><HeatmapTile intensity={3} /><HeatmapTile intensity={4} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">More</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-10 shadow-xl space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart2 size={120} /></div>
          <div className="flex items-center gap-4 relative z-10">
            <Award size={20} className="text-primary" />
            <h2 className="text-xl font-black italic tracking-tight uppercase underline decoration-primary decoration-2">Cognitive Radar</h2>
          </div>

          <div className="h-64 w-full relative z-10 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MODULE_RADAR}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 900 }} />
                  <PolarRadiusAxis hide />
                  <Radar name="Mastery" dataKey="score" stroke="#4DA6FF" strokeWidth={3} fill="#4DA6FF" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-slate-800/50 animate-pulse" />
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-800 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dominant Sector</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 text-primary border border-primary/40 rounded-base flex items-center justify-center font-black italic uppercase text-[10px]">91%</div>
              <div>
                <p className="text-md font-black tracking-tighter italic">Engineering Dominance</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top 1% Global Student Cohort</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-10 shadow-sm space-y-10">
          <div className="flex items-center gap-4">
            <Zap size={20} className="text-primary" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4">Power Goal Rings</h2>
          </div>
          <div className="space-y-10">
            {GOAL_RINGS.map((goal, i) => (
              <div key={i} className="flex items-center justify-between gap-8 group">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-text-secondary">{goal.label}</p>
                  <p className="text-2xl font-black italic">{goal.current} / {goal.target}</p>
                </div>
                <div className="relative w-16 h-16 min-w-0">
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: goal.current },
                            { value: Math.max(0, goal.target - goal.current) },
                          ]}
                          innerRadius={24}
                          outerRadius={32}
                          paddingAngle={0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <Cell fill={goal.color} stroke="none" />
                          <Cell fill="#f1f5f9" stroke="none" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: goal.color }}>{Math.round((goal.current / goal.target) * 100)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-10 shadow-sm space-y-10">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <Star size={20} className="text-primary" />
              <h2 className="text-xl font-black italic tracking-tighter uppercase underline decoration-primary decoration-4">Achievement History</h2>
            </div>
            <button className="text-primary font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">Audit Log <ChevronRight size={16} /></button>
          </div>

          <div className="space-y-4">
            {RECENT_WINS.map((win) => (
              <div key={win.id} className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-primary/20 rounded-xl transition-all group cursor-pointer shadow-sm">
                <div className="flex items-center gap-8">
                  <div className={cn("w-14 h-14 rounded-base flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", win.bg, win.color)}>
                    <Award size={28} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black tracking-tight uppercase italic">{win.title}</h4>
                    <p className="text-sm font-bold text-text-secondary">{win.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-md font-black text-primary italic leading-none mb-1">{win.score}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{win.date}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-xl flex items-center justify-between group overflow-hidden relative shadow-2xl">
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Advanced Insight</p>
              <h4 className="text-lg font-black tracking-tighter uppercase leading-tight italic underline decoration-primary decoration-2">Cognitive exhaustion Alert</h4>
              <p className="text-xs font-bold text-slate-400 max-w-sm">Our models detect a decrease in accuracy during late-night sessions. We suggest scheduling difficult modules before 6 PM.</p>
            </div>
            <Activity size={80} className="text-primary opacity-20 group-hover:rotate-12 transition-transform relative z-10" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary blur-[80px] opacity-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
