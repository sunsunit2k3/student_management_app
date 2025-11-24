import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, CheckCircle, Loader2, FileCheck, Trash2 } from 'lucide-react';
import { GradeItemResponseDto } from '../../types/gradeitem';
import { StudentGradeResponseDto } from '../../types/studentgrade';
import { getFilesByStudentGrade, deleteSubmissionFile } from '../../api/submissionFileService';
import { SubmissionFileResponseDto } from '../../types/submissionfile';
import { toast } from 'react-toastify';
import DeleteConfirmModal from './DeleteConfirmModal';

interface SubmissionModalProps {
  isOpen: boolean;
  selectedItem: GradeItemResponseDto | null;
  myGrade?: StudentGradeResponseDto;
  onClose: () => void;
  onSubmit: (file: File) => Promise<string | void>;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  selectedItem,
  myGrade,
  onClose,
  onSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<SubmissionFileResponseDto | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SubmissionFileResponseDto | null>(null);

  // Determine if the assignment is past due
  const isPastDue = React.useMemo(() => {
    if (!selectedItem?.dueDate) return false;
    try {
      return new Date(selectedItem.dueDate).getTime() < Date.now();
    } catch (e) {
      return false;
    }
  }, [selectedItem?.dueDate]);
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setUploadSuccess(false);
      setIsUploading(false);
    }
  }, [isOpen, selectedItem]);

  // Load submission files when modal opens or myGrade changes
  useEffect(() => {
    const loadFiles = async () => {
      if (!isOpen || !myGrade?.id) {
        setSubmissionFiles(null);
        return;
      }
      setLoadingFiles(true);
      try {
        const res = await getFilesByStudentGrade(myGrade.id);
        const file = (res as any)?.data || res;
        setSubmissionFiles(file || null);
      } catch (err) {
        console.error('Failed to load submission files', err);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFiles();
  }, [isOpen, myGrade?.id]);

  if (!isOpen || !selectedItem) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // onSubmit may return the studentGradeId (if implemented)
      const result: any = await onSubmit(selectedFile as File);
      setUploadSuccess(true);

      // If we have a studentGradeId from result or myGrade, refresh files
      const studentGradeId = result || myGrade?.id;
      if (studentGradeId) {
        setLoadingFiles(true);
        try {
          const res = await getFilesByStudentGrade(studentGradeId);
          const file = (res as any)?.data || res;
          setSubmissionFiles(file || null);
        } catch (err) {
          console.error('Failed to refresh files after upload', err);
        } finally {
          setLoadingFiles(false);
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = (file: SubmissionFileResponseDto) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    const fileId = fileToDelete.id;
    setDeletingFileId(fileId);
    setDeleteModalOpen(false);
    setFileToDelete(null);
    
    try {
      await deleteSubmissionFile(fileId);
      toast.success('Xóa file thành công');
      // refresh
      if (myGrade?.id) {
        const res = await getFilesByStudentGrade(myGrade.id);
        const file = (res as any)?.data || res;
        setSubmissionFiles(file || null);
      }
    } catch (err) {
      console.error('Failed to delete file', err);
      toast.error('Xóa file thất bại');
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Không có hạn';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSubmitted = myGrade?.isSubmitted;
  const score = myGrade?.score;

  const buildFileUrl = (path?: string) => {
    if (!path) return '#';
    // If it's already an absolute URL, return as-is
    if (/^https?:\/\//i.test(path)) return path;
    // Otherwise, prefix with localhost:8080
    const prefix = 'http://localhost:8080';
    return `${prefix}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">
            {selectedItem.name}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-3 text-sm">
             {isPastDue && (
               <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 font-medium">
                 Hạn nộp đã qua. Bạn không thể nộp hoặc thay đổi tệp.
               </div>
             )}
             <div className="flex justify-between">
               <span className="text-gray-500">Hạn nộp:</span>
               <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedItem.dueDate)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Trọng số:</span>
               <span className="font-bold text-brand-600">{selectedItem.weight}%</span>
             </div>
             
             {score !== null && score !== undefined && (
                 <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex justify-between items-center">
                     <span className="font-bold text-green-700 dark:text-green-400">Điểm số:</span>
                     <span className="text-xl font-bold text-green-700 dark:text-green-400">{score} / 10</span>
                 </div>
             )}

             {selectedItem.description && (
               <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-line">
                 {selectedItem.description}
               </div>
             )}
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bài làm của bạn
                </label>
                {isSubmitted && !uploadSuccess && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <FileCheck size={12}/> Đã nộp
                    </span>
                )}
            </div>
            {!uploadSuccess ? (
              <div className="space-y-4">
                {loadingFiles ? (
                  <div className="text-sm text-gray-500">Đang tải file...</div>
                ) : submissionFiles ? (
                  <div className="space-y-2">
                    <div key={submissionFiles.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-500" />
                        <div className="text-sm">
                          <a href={buildFileUrl(submissionFiles.filePath)} target="_blank" rel="noreferrer" className="font-medium hover:underline text-gray-900 dark:text-white">
                            {submissionFiles.originalFileName || submissionFiles.filePath}
                          </a>
                          <div className="text-xs text-gray-500">{submissionFiles.fileSize ? `${(submissionFiles.fileSize/1024/1024).toFixed(2)} MB` : ''} {submissionFiles.uploadDate ? `• ${new Date(submissionFiles.uploadDate).toLocaleString('vi-VN')}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteFile(submissionFiles)}
                          disabled={!!deletingFileId || isPastDue}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 group ${
                    selectedFile 
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                      : 'border-gray-300 hover:border-brand-400 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      disabled={isUploading || isPastDue}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    
                    {selectedFile ? (
                      <>
                        <FileText size={40} className="text-brand-600 mb-2 animate-in zoom-in duration-300" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <span className="text-xs text-brand-600 font-medium hover:underline relative z-20">
                          Nhấn để thay đổi file
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-gray-400 mb-2 group-hover:scale-110 transition-transform duration-300" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Kéo thả hoặc nhấn để chọn file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, Word, Excel, ZIP (Tối đa 10MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-xl p-8 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                 <div className="relative">
                     <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-75"></div>
                     <CheckCircle size={56} className="text-green-600 relative z-10" />
                 </div>
                 <h4 className="text-xl font-bold text-green-700 dark:text-green-400 mt-4">Thành công!</h4>
                 <p className="text-sm text-green-600 dark:text-green-300 mt-1">Bài tập của bạn đã được nộp.</p>
              </div>
            )}
          </div>
        </div>

        {!uploadSuccess && (
          <div className="p-6 pt-0 bg-white dark:bg-gray-800">
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading || isPastDue}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-200 ${
                !selectedFile || isUploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                  : isPastDue
                    ? 'bg-red-100 text-red-400 cursor-not-allowed dark:bg-red-900'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-brand-500/30 transform active:scale-95'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  {isPastDue ? 'Quá hạn' : (isSubmitted ? 'Nộp lại bài' : 'Nộp bài ngay')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Xác nhận xóa"
        entityName={fileToDelete?.originalFileName || ''}
        description={`Bạn có chắc muốn xóa tệp ${fileToDelete?.originalFileName || ''}?`}
        onClose={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={confirmDelete}
        isProcessing={!!deletingFileId}
      />
    </div>
  );
};

export default SubmissionModal;