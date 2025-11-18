import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/modal';
import Button from '../ui/button/Button';

export type CrudFormModalRenderArgs<T extends Record<string, any>> = {
  values: T;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
};

interface CrudFormModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  mode: 'create' | 'update';
  title?: string;
  description?: string;
  initialValues: T;
  onClose: () => void;
  onSubmit: (values: T) => Promise<void> | void;
  renderFields: (args: CrudFormModalRenderArgs<T>) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  autoCloseOnSuccess?: boolean;
  widthClassName?: string;
}

function getDefaultTitle(mode: 'create' | 'update') {
  return mode === 'create' ? 'Tạo mới' : 'Cập nhật thông tin';
}

function getDefaultSubmitLabel(mode: 'create' | 'update') {
  return mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi';
}

export function CrudFormModal<T extends Record<string, any>>({
  isOpen,
  mode,
  title,
  description,
  initialValues,
  onClose,
  onSubmit,
  renderFields,
  submitLabel,
  cancelLabel = 'Hủy',
  autoCloseOnSuccess = true,
  widthClassName = 'max-w-2xl',
}: CrudFormModalProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
    }
  }, [isOpen, initialValues]);

  const computedTitle = useMemo(() => title || getDefaultTitle(mode), [title, mode]);
  const computedSubmitLabel = useMemo(() => submitLabel || getDefaultSubmitLabel(mode), [submitLabel, mode]);

  function handleFieldChange<K extends keyof T>(field: K, value: T[K]) {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(values);
      if (autoCloseOnSuccess) {
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => (submitting ? null : onClose())} className={`${widthClassName} px-6 py-6 sm:px-10`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-100">
            {mode === 'create' ? 'Create' : 'Update'}
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{computedTitle}</h2>
          {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 shadow-inner dark:border-white/10 dark:bg-white/5">
          {renderFields({ values, handleChange: handleFieldChange })}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-white/80"
            onClick={onClose}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
            disabled={submitting}
          >
            {submitting ? 'Đang lưu...' : computedSubmitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CrudFormModal;
