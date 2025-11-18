import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getAllUsers } from '../../api/userService';
import { getRoles } from '../../api/rolesService';
import { getCourses } from '../../api/coursesService';
import apiService from '../../api/apiService';

type CountState = {
  users: number | null;
  roles: number | null;
  courses: number | null;
  enrollments: number | null;
  gradeItems: number | null;
  studentGrades: number | null;
  submissionFiles: number | null;
};

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchCounts() {
      setLoading(true);
      try {
        const requests = [
          getAllUsers({ page: 0, size: 1 }),
          getRoles({ page: 0, size: 1 }),
          getCourses({ page: 0, size: 1 }),
          apiService.get('/enrollments', { params: { page: 0, size: 1 }, skipLoading: true } as any),
          apiService.get('/grade-items', { params: { page: 0, size: 1 }, skipLoading: true } as any),
          apiService.get('/student-grades', { params: { page: 0, size: 1 }, skipLoading: true } as any),
          apiService.get('/submission-files', { params: { page: 0, size: 1 }, skipLoading: true } as any),
        ];

        const results = await Promise.allSettled(requests);

        if (!mounted) return;

        const next: CountState = { ...counts };

        // helper to extract totalElements safely
        const extractTotal = (res: any) => {
          try {
            return (res && res.data && typeof res.data.totalElements === 'number')
              ? res.data.totalElements
              : (Array.isArray(res?.data) ? res.data.length : null);
          } catch (e) {
            return null;
          }
        };

        // users, roles, courses
        next.users = results[0].status === 'fulfilled' ? extractTotal((results[0] as any).value) : null;
        next.roles = results[1].status === 'fulfilled' ? extractTotal((results[1] as any).value) : null;
        next.courses = results[2].status === 'fulfilled' ? extractTotal((results[2] as any).value) : null;

        // others
        next.enrollments = results[3].status === 'fulfilled' ? extractTotal((results[3] as any).value) : null;
        next.gradeItems = results[4].status === 'fulfilled' ? extractTotal((results[4] as any).value) : null;
        next.studentGrades = results[5].status === 'fulfilled' ? extractTotal((results[5] as any).value) : null;
        next.submissionFiles = results[6].status === 'fulfilled' ? extractTotal((results[6] as any).value) : null;

        setCounts(next);
      } catch (error) {
        console.error('Fetch dashboard counts error', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCounts();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stat = (label: string, value: number | null, href?: string, icon?: React.ReactNode) => (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-4 flex items-center gap-4 hover:shadow-xl transition-shadow min-h-[96px]">
      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-2xl">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <div className="text-xs text-slate-400">{label}</div>
          <div className="text-xs text-slate-400">{value === null ? '' : (value > 999 ? `${Math.round(value/1000)}k` : value)}</div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-3xl font-extrabold">{value === null ? <span className="text-slate-400">—</span> : value}</div>
          <div className="text-sm text-green-500 font-medium">{value ? `+${Math.min(9, Math.round((value % 10))) }%` : ''}</div>
        </div>
        {href && (
          <div className="mt-3">
            <Link to={href} className="text-sm text-brand-500 hover:underline">
              Quản lý {label.toLowerCase()}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // small sparkline generator based on numbers available
  const sparkline = (base: number | null) => {
    const points = Array.from({ length: 8 }).map((_) => {
      if (!base) return Math.round(5 + Math.random() * 10);
      const variance = Math.max(1, Math.round(base * 0.1));
      return Math.max(0, Math.round(base - variance + Math.random() * variance * 2));
    });
    const max = Math.max(...points);
    const step = 100 / Math.max(1, points.length - 1);
    const path = points
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${100 - (v / (max || 1)) * 100}`)
      .join(' ');
    return (
      <svg viewBox="0 0 100 100" className="w-28 h-12">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const pickColor = (i: number) => {
    const colors = ['#7c3aed', '#06b6d4', '#f97316', '#10b981', '#ef4444'];
    return colors[i % colors.length];
  };

  const generateActivity = (c: CountState): Activity[] => {
    const base = c.users ?? 12;
    const names = ['Linh Nguyen', 'Minh Tran', 'An Pham', 'Hoa Le', 'Tuan Vu'];
    const actions = [
      'submitted assignment',
      'joined course',
      'graded submission',
      'created grade item',
      'uploaded file',
    ];

    return names.slice(0, 5).map((n, i) => ({
      id: `${i}-${Date.now()}`,
      user: n,
      initials: getInitials(n),
      action: actions[i % actions.length],
      time: `${(i + 1) * 3}m ago`,
      meta: `${Math.max(1, Math.round(base / (i + 2)))} items`,
      color: pickColor(i),
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống và các liên kết nhanh</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-start">
        <div className="col-span-1 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stat('Users', counts.users, '/users', <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>)}
            {stat('Courses', counts.courses, '/courses', <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5 12.08 12.08 0 015.84 10.578L12 14z" /></svg>)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {stat('Roles', counts.roles, '/roles', <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2M4.2 7.2l1.4 1.4M18.4 16.8l1.4 1.4M3 12h2m14 0h2M4.2 16.8l1.4-1.4M18.4 7.2l1.4-1.4" /></svg>)}
            {stat('Enrollments', counts.enrollments, '/enrollments', <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-6h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M7 21v-4a1 1 0 011-1h8a1 1 0 011 1v4" /></svg>)}
            {stat('Grade Items', counts.gradeItems, '/grade-items', <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12V7a3 3 0 116 0v5" /></svg>)}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-1 self-start">
          <div className="sticky top-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-300">System Activity</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white mt-1">Live Overview</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Active</div>
                    <div className="font-semibold text-slate-800 dark:text-white">{counts.users ?? '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Submissions</div>
                    <div className="font-semibold text-slate-800 dark:text-white">{counts.submissionFiles ?? '—'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full rounded-md bg-slate-50 dark:bg-slate-900 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-300">Traffic (last hour)</div>
                    <div className="text-xs text-slate-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="mt-2">{sparkline(counts.users ?? 20)}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">Recent activity</div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 rounded-md overflow-hidden">
                  {generateActivity(counts).map((a) => (
                    <li key={a.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ background: a.color }}>
                          {a.initials}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-800 dark:text-white truncate">
                          <span className="font-semibold">{a.user}</span>
                          <span className="text-slate-500 dark:text-slate-300"> {a.action}</span>
                        </div>
                        <div className="text-xs text-slate-400">{a.time}</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="bg-slate-100 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 rounded-full px-2 py-1">{a.meta}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-right">
                  <Link to="/activity" className="text-sm text-brand-500 hover:underline">View all</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
