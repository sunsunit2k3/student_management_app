import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/modal';
import { toast } from 'react-toastify';
import { GradeItemResponseDto } from '../../types/gradeitem';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { UserResponseDto } from '../../types/user';
import { Save, Award, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import Button from '../ui/button/Button';
import {  courseGpaFromComponents } from '../../utils/grade';
import { getFilesByStudentGrade } from '../../api/submissionFileService';
import { SubmissionFileResponseDto } from '../../types/submissionfile';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  student: UserResponseDto | null;
  gradeItems: GradeItemResponseDto[];
  initialGradesMap: Record<string, StudentGradeResponseDto>;
  onSaveScore: (gradeItem: GradeItemResponseDto, score: number) => Promise<void>;
};

const GradingModal: React.FC<Props> = ({ isOpen, onClose, student, gradeItems, initialGradesMap, onSaveScore }) => {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [filesMap, setFilesMap] = useState<Record<string, SubmissionFileResponseDto[]>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    
    gradeItems.forEach((gi) => {
      const existing = initialGradesMap[gi.id];
      map[gi.id] = existing && existing.score != null ? String(existing.score) : '';
      
      // Fetch files if grade exists
      if (existing && existing.id) {
        setLoadingFiles(prev => ({ ...prev, [gi.id]: true }));
        getFilesByStudentGrade(existing.id)
          .then(res => {
            const data = (res as any)?.data || res;
            if (Array.isArray(data)) {
              setFilesMap(prev => ({ ...prev, [gi.id]: data }));
            } else if (data && (data as any).content) {
               setFilesMap(prev => ({ ...prev, [gi.id]: (data as any).content }));
            } else {
               // If single object or empty
               setFilesMap(prev => ({ ...prev, [gi.id]: Array.isArray(data) ? data : (data ? [data] : []) }));
            }
          })
          .catch(err => console.error('Failed to load files for grade', existing.id, err))
          .finally(() => setLoadingFiles(prev => ({ ...prev, [gi.id]: false })));
      }
    });
    setScores(map);
    // Reset files map on open/student change
    setFilesMap({});
  }, [isOpen, student, gradeItems, initialGradesMap]);

    // Compute course final score by aggregating component scores (using gradeItem.weight as component weight),
    // then convert that final score to 4.0 GPA. This follows: "tổng 3 điểm rồi mới quy ra gpa; tính 3 điểm nhân hệ số mới tính quy ra gpa".
    const gpaPreview = React.useMemo(() => {
        const components: { score: number; weight: number }[] = gradeItems.map((gi) => {
            const raw = scores[gi.id];
            const score = raw !== undefined && raw !== '' ? Number(raw) : (initialGradesMap[gi.id]?.score ?? 0);
            const weight = (gi as any).componentWeight !== undefined ? Number((gi as any).componentWeight) : Number(gi.weight) || 0;
            return { score: isNaN(score) ? 0 : score, weight: isNaN(weight) ? 0 : weight };
        }).filter((c) => c.weight > 0);

        // if no component weights found, fall back to equal-weight average across gradeItems
        if (components.length === 0 && gradeItems.length > 0) {
            const fallback = gradeItems.map((gi) => {
                const raw = scores[gi.id];
                const score = raw !== undefined && raw !== '' ? Number(raw) : (initialGradesMap[gi.id]?.score ?? 0);
                return { score: isNaN(score) ? 0 : score, weight: 1 };
            });
            return { finalScore: courseGpaFromComponents(fallback).finalScore, gpa: courseGpaFromComponents(fallback).gpa };
        }

        return courseGpaFromComponents(components);
    }, [scores, initialGradesMap, gradeItems]);

  const handleChange = (id: string, value: string) => {
    setScores((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (giId: string) => {
    const gi = gradeItems.find((g) => g.id === giId);
    if (!gi || !student) return;
    const raw = scores[giId];
    const val = raw ? Number(raw) : null;
    if (val === null || isNaN(val)) { toast.error('Nhập điểm hợp lệ'); return; }
    if (val < 0 || val > 10) { toast.error('Điểm phải từ 0-10'); return; }

    try {
      setSavingMap((s) => ({ ...s, [giId]: true }));
      await onSaveScore(gi, val);
    } catch (err) {
      console.error('Failed to save score', err);
    } finally {
      setSavingMap((s) => ({ ...s, [giId]: false }));
    }
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl p-0 overflow-hidden rounded-2xl" showCloseButton={true}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
                    {(student.firstName || student.lastName) ? ((student.firstName?.[0] || '') + (student.lastName?.[0] || '')).toUpperCase() : (student.username[0] || '?').toUpperCase()}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{(student.firstName && student.lastName) ? `${student.firstName} ${student.lastName}` : student.username}</h2>
                    <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1 text-sm"><User size={14}/> {student.email}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-sm">{gradeItems.length} bài tập</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-sm">GPA (4.0): <strong className="text-gray-900 dark:text-white">{gpaPreview.gpa.toFixed(2)}</strong></span>
                    </div>
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 max-h-[60vh] overflow-y-auto">
            {gradeItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Award size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Chưa có bài tập nào để chấm điểm.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {gradeItems.map((gi) => {
                        const score = scores[gi.id];
                        const isSaving = savingMap[gi.id];
                        
                        // Check if the current input value matches the initial value (already graded)
                        const initialScore = initialGradesMap[gi.id]?.score;
                        const isUnchanged = initialScore !== undefined && initialScore !== null && Number(score) === initialScore;
                        
                        const files = filesMap[gi.id] || [];
                        const isLoadingFiles = loadingFiles[gi.id];

                        return (
                            <div key={gi.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{gi.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1"><Award size={14} /> {gi.weight}%</span>
                                            {gi.dueDate && <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(gi.dueDate).toLocaleDateString('vi-VN')}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <input 
                                                value={scores[gi.id] ?? ''} 
                                                onChange={(e) => handleChange(gi.id, e.target.value)}
                                                type="number" 
                                                min={0} 
                                                max={10} 
                                                step={0.1} 
                                                placeholder="0"
                                                className="w-20 text-center font-medium rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none py-2 px-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                            <span className="absolute top-2.5 right-2 text-xs text-gray-400 pointer-events-none">/10</span>
                                        </div>
                                        <Button 
                                            onClick={() => handleSave(gi.id)} 
                                            disabled={isSaving || isUnchanged}
                                            variant="primary"
                                            size="sm"
                                            startIcon={isSaving ? undefined : <Save size={16} />}
                                            className="min-w-[120px]"
                                        >
                                            {isSaving ? 'Đang lưu...' : (isUnchanged ? 'Đã chấm' : 'Chấm điểm')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Submission Files Section */}
                                {(files.length > 0 || isLoadingFiles) && (
                                    <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bài nộp của sinh viên</h5>
                                        {isLoadingFiles ? (
                                            <div className="text-sm text-gray-400 italic">Đang tải file...</div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {files.map((file) => {
                                                    const rawPath = file.filePath || '';
                                                    const fileUrl = rawPath.startsWith('http')
                                                        ? rawPath
                                                        : `http://localhost:8080${rawPath.startsWith('/') ? '' : '/'}${rawPath}`;

                                                    return (
                                                        <a
                                                            key={file.id}
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800"
                                                        >
                                                            <FileText size={14} />
                                                            <span className="truncate max-w-[200px]">{file.originalFileName || 'File nộp'}</span>
                                                            <ExternalLink size={12} className="opacity-50" />
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
            <Button onClick={onClose} variant="outline">
                Đóng
            </Button>
        </div>
    </Modal>
  );
};

export default GradingModal;
