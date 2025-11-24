import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { getEnrollmentsByCourse } from '../../api/enrollmentService';
import { getStudentGradesByGradeItemId } from '../../api/studentGradeService';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { UserResponseDto } from '../../types/user';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const GradeItemSubmissions: React.FC = () => {
  const { id: gradeItemId } = useParams<{ id: string }>();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId') || undefined;

  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [grades, setGrades] = useState<StudentGradeResponseDto[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!gradeItemId) return;
      setLoading(true);
      try {
        if (courseId) {
          const enrRes = await getEnrollmentsByCourse(courseId);
          const enrData = (enrRes as any)?.data || enrRes || [];
          const list = Array.isArray(enrData) ? enrData : enrData?.content || [];
          setEnrollments(list);
        }

        const gRes = await getStudentGradesByGradeItemId(gradeItemId);
        const gData = (gRes as any)?.data || gRes || [];
        setGrades(Array.isArray(gData) ? gData : []);
      } catch (err) {
        console.error('Failed to load submissions for grade item', err);
        toast.error('Không thể tải danh sách nộp bài');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [gradeItemId, courseId]);

  if (loading) return <div className="text-center py-8 text-gray-500">Đang tải...</div>;

  // Build map enrollmentId -> grade
  const gradeByEnrollment: Record<string, StudentGradeResponseDto> = {};
  grades.forEach((g) => { if (g.enrollmentId) gradeByEnrollment[g.enrollmentId] = g; });

  // Build student rows from enrollments
  const rows = enrollments.map((e: any) => {
    const user = e.user || e.student || { id: e.userId || e.studentId, username: e.userName };
    const g = gradeByEnrollment[e.id];
    return {
      enrollmentId: e.id,
      studentId: user?.id,
      name: user && (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user?.username || 'Ẩn danh',
      email: user?.email || '',
      grade: g || null,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to={`/teacher/class-detail/${courseId || ''}`} className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-4">
          <ArrowLeft size={18} className="mr-2" /> Quay lại
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Danh sách nộp bài</h2>

        {rows.length === 0 ? (
          <div className="text-center text-gray-500 py-12">Không có sinh viên cho lớp này.</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 space-y-2">
            {rows.map((r) => (
              <div key={r.enrollmentId} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </div>
                <div className="text-right">
                  {r.grade ? (
                    <div>
                      <div className="text-sm">{r.grade.isSubmitted ? 'Đã nộp' : 'Chưa nộp'}</div>
                      <div className="text-sm font-semibold">{r.grade.score != null ? `${r.grade.score} điểm` : '-'}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Chưa có</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeItemSubmissions;
