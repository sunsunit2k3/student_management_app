import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  entityName?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isProcessing?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Xóa dữ liệu',
  entityName,
  description,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  onClose,
  onConfirm,
  isProcessing,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isProcessing ?? internalLoading;

  async function handleConfirm() {
    if (loading) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (error) {
      console.error(error);
    } finally {
      setInternalLoading(false);
    }
  }

  const subtitle = description ||
    (entityName
      ? `Hành động này sẽ xóa vĩnh viễn “${entityName}”. Bạn có chắc chắn?`
      : 'Hành động này không thể hoàn tác.');

  return (
    <Modal isOpen={isOpen} onClose={() => (loading ? null : onClose())} className="max-w-lg px-6 py-6 sm:px-10">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M15.5 4.5H8.5C7.39543 4.5 6.5 5.39543 6.5 6.5V18.1C6.5 19.1546 7.34543 20 8.4 20H15.6C16.6546 20 17.5 19.1546 17.5 18.1V6.5C17.5 5.39543 16.6046 4.5 15.5 4.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-white/80"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xóa...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
