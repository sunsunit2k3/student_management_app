import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { getStudentGradesByGradeItemId } from '../../api/studentGradeService';
import { GradeItemResponseDto } from '../../types/gradeitem';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { UserResponseDto } from '../../types/user';

interface SubmissionsListProps {
  gradeItems: GradeItemResponseDto[];
  enrollmentsById: Record<string, any>;
  onGradeStudent: (student: UserResponseDto) => void;
}

interface SubmissionEntry {
  enrollmentId: string;
  studentId: string;
  name: string;
  email: string;
  grade: StudentGradeResponseDto;
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({
  gradeItems,
  enrollmentsById,
  onGradeStudent,
}) => {
  const [loading, setLoading] = useState(false);
  const [submissionsByGradeItem, setSubmissionsByGradeItem] = useState<Record<string, SubmissionEntry[]>>({});

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const byGrade: Record<string, SubmissionEntry[]> = {};

      await Promise.all(
        gradeItems.map(async (gi) => {
          try {
            const res = await getStudentGradesByGradeItemId(gi.id);
            const data = (res as any)?.data || res || [];
            const grades: StudentGradeResponseDto[] = Array.isArray(data) ? data : [];

            byGrade[gi.id] = grades.map((g) => {
              const enrollment = enrollmentsById[g.enrollmentId] || {};
              const userObj = enrollment.user || enrollment.student || null;
              const studentId =
                userObj && typeof userObj === 'object'
                  ? userObj.id
                  : enrollment.userId || enrollment.studentId;

              const name =
                userObj && (userObj.firstName || userObj.lastName)
                  ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim()
                  : (userObj && userObj.username) ||
                    enrollment.userName ||
                    enrollment.user?.username ||
                    'Ẩn danh';

              const email = userObj?.email || enrollment.user?.email || '';

              return {
                enrollmentId: g.enrollmentId,
                studentId,
                name,
                email,
                grade: g,
              };
            });
          } catch (err) {
            console.error('Failed to load grades for grade item', gi.id, err);
            byGrade[gi.id] = [];
          }
        })
      );

      setSubmissionsByGradeItem(byGrade);
    } catch (err) {
      console.error('Failed to load submissions', err);
      toast.error('Không thể tải danh sách nộp bài');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gradeItems.length > 0 && Object.keys(enrollmentsById).length > 0) {
      loadSubmissions();
    }
  }, [gradeItems.length, Object.keys(enrollmentsById).length]);

  if (loading) {
    return <div className="text-center text-gray-500">Đang tải danh sách nộp bài...</div>;
  }

  if (gradeItems.length === 0) {
    return <div className="text-center py-12 text-gray-500">Chưa có bài tập nào.</div>;
  }

  return (
    <div className="space-y-4">
      {gradeItems.map((gi) => {
        const submissions = submissionsByGradeItem[gi.id] || [];
        const submittedCount = submissions.filter((s) => s.grade.isSubmitted).length;

        return (
          <div key={gi.id} className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{gi.name}</div>
                <div className="text-xs text-gray-500">
                  Trọng số: {gi.weight}% • Hạn:{' '}
                  {gi.dueDate ? new Date(gi.dueDate).toLocaleString('vi-VN') : 'Không có'}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {submittedCount}/{submissions.length} đã nộp
              </div>
            </div>

            <div className="space-y-2">
              {submissions.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  Chưa có sinh viên nào trong bài tập này.
                </div>
              ) : (
                submissions.map((entry) => {
                  const studentObj =
                    (enrollmentsById[entry.enrollmentId] &&
                      (enrollmentsById[entry.enrollmentId].user ||
                        enrollmentsById[entry.enrollmentId].student)) || {
                      id: entry.studentId,
                      username: entry.name,
                      email: entry.email,
                    };

                  const g = entry.grade;

                  return (
                    <div
                      key={entry.enrollmentId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {entry.name}
                          </div>
                          <div className="text-xs text-gray-500">{entry.email || ''}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm text-right">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {g.isSubmitted ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">Đã nộp</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded text-xs font-medium">Chưa nộp</span>
                              )}

                              {g.score != null && (
                                <span className="font-semibold text-blue-600 dark:text-blue-400">{g.score} điểm</span>
                              )}
                            </div>

                            {g.submissionDate && (
                              <div className="text-xs text-gray-500">{new Date(g.submissionDate).toLocaleString('vi-VN')}</div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onGradeStudent(studentObj as UserResponseDto)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <FileText size={14} /> Ghi điểm
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SubmissionsList;
