import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { getAllUsers } from "../../api/userService";
import { getRoles } from "../../api/rolesService";
import { getCourses } from "../../api/coursesService";
import apiService from "../../api/apiService";
import Button from "../../components/ui/button/Button";

import StatCard from "../../components/ui/card/StatCard";
import { motion } from "framer-motion";

import {
  Users,
  BookOpen,
  Shield,
  UserPlus,
  FileCheck,
  FileText,
  UploadCloud,
  Clock,
  ArrowRight
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type CountState = {
  users: number | null;
  roles: number | null;
  courses: number | null;
  enrollments: number | null;
  gradeItems: number | null;
  studentGrades: number | null;
  submissionFiles: number | null;
};

// Mock chart data
const chartData = [
  { name: 'T2', visits: 4000, submissions: 2400 },
  { name: 'T3', visits: 3000, submissions: 1398 },
  { name: 'T4', visits: 2000, submissions: 9800 },
  { name: 'T5', visits: 2780, submissions: 3908 },
  { name: 'T6', visits: 1890, submissions: 4800 },
  { name: 'T7', visits: 2390, submissions: 3800 },
  { name: 'CN', visits: 3490, submissions: 4300 },
];

const AdminDashboard: React.FC = () => {
  const [counts, setCounts] = useState<CountState>({
    users: null,
    roles: null,
    courses: null,
    enrollments: null,
    gradeItems: null,
    studentGrades: null,
    submissionFiles: null,
  });

  const [, setLoading] = useState(false);

  // useRef to guard setState after unmount
  const isMountedRef = React.useRef(true);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const requests = [
        getAllUsers({ page: 0, size: 1 }),
        getRoles({ page: 0, size: 1 }),
        getCourses({ page: 0, size: 1 }),
        apiService.get("/enrollments", { params: { page: 0, size: 1 }, skipLoading: true } as any),
        apiService.get("/grade-items", { params: { page: 0, size: 1 }, skipLoading: true } as any),
        apiService.get("/student-grades", { params: { page: 0, size: 1 }, skipLoading: true } as any),
        apiService.get("/submission-files", { params: { page: 0, size: 1 }, skipLoading: true } as any),
      ];

      const results = await Promise.allSettled(requests);

      if (!isMountedRef.current) return;

      const next: CountState = { ...counts };

      const extractTotal = (res: any) => {
        try {
          if (res && res.data && typeof res.data.totalElements === "number") return res.data.totalElements;
          if (Array.isArray(res?.data)) return res.data.length;
          return null;
        } catch {
          return null;
        }
      };

      next.users = results[0].status === "fulfilled" ? extractTotal((results[0] as any).value) : null;
      next.roles = results[1].status === "fulfilled" ? extractTotal((results[1] as any).value) : null;
      next.courses = results[2].status === "fulfilled" ? extractTotal((results[2] as any).value) : null;
      next.enrollments = results[3].status === "fulfilled" ? extractTotal((results[3] as any).value) : null;
      next.gradeItems = results[4].status === "fulfilled" ? extractTotal((results[4] as any).value) : null;
      next.studentGrades = results[5].status === "fulfilled" ? extractTotal((results[5] as any).value) : null;
      next.submissionFiles = results[6].status === "fulfilled" ? extractTotal((results[6] as any).value) : null;

      setCounts(next);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu Dashboard", error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchCounts();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sparkline = (base: number | null) => {
    // Simplified logic for demo, utilizing SVG directly
    const points = [50, 45, 60, 40, 70, 35, 80, 20]; 
    const path = points.map((y, x) => `${x === 0 ? "M" : "L"} ${x * 14} ${y}`).join(" ");

    return (
      <svg viewBox="0 0 100 100" className="w-full h-12 overflow-visible">
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#gradient)" stroke="none" opacity="0.5" />
      </svg>
    );
  };

  type Activity = {
    id: string;
    user: string;
    initials: string;
    action: string;
    time: string;
    meta: string;
    color: string;
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const pickColor = (i: number) => {
    const colors = ["#7c3aed", "#06b6d4", "#f97316", "#10b981", "#ef4444"];
    return colors[i % colors.length];
  };

  const generateActivity = (c: CountState): Activity[] => {
    const base = c.users ?? 12;
    const names = ["Linh Nguyen", "Minh Tran", "An Pham", "Hoa Le", "Tuan Vu"];
    const actions = ["đã nộp bài", "tham gia khóa học", "chấm bài", "tạo mục điểm", "tải tệp lên"];

    return names.slice(0, 5).map((n, i) => ({
      id: `${i}-${Date.now()}`,
      user: n,
      initials: getInitials(n),
      action: actions[i % actions.length],
      time: `${(i + 1) * 3} phút trước`,
      meta: `${Math.max(1, Math.round(base / (i + 2)))} items`,
      color: pickColor(i),
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bảng điều khiển Admin
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Chào mừng trở lại, đây là tổng quan về hệ thống đào tạo hôm nay.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-2"></span>
             Hệ thống hoạt động tốt
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Area */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          {/* Primary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard 
              label="Tổng Người dùng" 
              value={counts.users} 
              href="/admin/users" 
              icon={<Users className="w-6 h-6" />}
            />
            <StatCard 
              label="Tổng Khóa học" 
              value={counts.courses} 
              href="/admin/courses" 
              icon={<BookOpen className="w-6 h-6" />}
            />
          </div>

          {/* Secondary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              label="Vai trò hệ thống" 
              value={counts.roles} 
              href="/admin/roles" 
              icon={<Shield className="w-5 h-5" />}
            />
            <StatCard 
              label="Lượt đăng ký mới" 
              value={counts.enrollments} 
              href="/admin/enrollments" 
              icon={<UserPlus className="w-5 h-5" />}
            />
            <StatCard 
              label="Tệp đã nộp" 
              value={counts.submissionFiles} 
              href="/admin/grade-items" 
              icon={<UploadCloud className="w-5 h-5" />}
            />
          </div>

          {/* Analytics Chart Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Xu hướng truy cập & Nộp bài</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Dữ liệu 7 ngày qua</p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-brand-500">
                <option>7 ngày qua</option>
                <option>30 ngày qua</option>
              </select>
            </div>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" name="Truy cập" />
                  <Area type="monotone" dataKey="submissions" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSubs)" name="Nộp bài" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-span-1">
          <div className="sticky top-6 space-y-6">
            
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-transparent relative overflow-hidden transition-colors duration-200">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                      <h4 className="text-slate-500 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">Tổng quan trực tiếp</h4>
                      <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                        {counts.users ? counts.users.toLocaleString() : '...'}
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></span>
                        Đang trực tuyến
                      </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-lg backdrop-blur-sm transition-colors">
                      <Clock className="w-5 h-5 text-slate-600 dark:text-white" />
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <span>Lưu lượng</span>
                      <span>Bây giờ</span>
                  </div>
                  <div className="h-16 w-full">
                      {sparkline(counts.users ?? 20)}
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 dark:bg-brand-500/30 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white">Hoạt động gần đây</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  onClick={() => fetchCounts()}
                >
                  Làm mới
                </Button>
              </div>

              <ul className="space-y-4">
                {generateActivity(counts).map((a, index) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group flex gap-3 items-start"
                  >
                    <div className="relative mt-1">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-slate-800"
                        style={{ backgroundColor: a.color }}
                      >
                        {a.initials}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{a.user}</p>
                        <span className="text-xs text-slate-400">{a.time}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {a.action} <span className="text-brand-600 dark:text-brand-400 font-medium">Assessment #4</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                          <FileText className="w-3 h-3" /> {a.meta}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
              
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Link to="/activity" className="flex items-center justify-center w-full py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors gap-2 group">
                  Xem tất cả hoạt động <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
