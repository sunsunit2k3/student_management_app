import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import submissionFileService from "../../api/submissionFileService";
import { SubmissionFileResponseDto } from "../../types/submissionfile";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";

const SubmissionFilesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SubmissionFileResponseDto | null>(null);

  const columns: Column<SubmissionFileResponseDto>[] = [
    { key: "id", header: "ID", sortable: true, render: (f) => f.id },
    {
      key: "originalFileName",
      header: "Filename",
      render: (f) => f.originalFileName || f.filePath
    },
    {
      key: "uploadDate",
      header: "Uploaded At",
      render: (f) =>
        f.uploadDate ? new Date(f.uploadDate).toLocaleString() : "-"
    }
  ];

  const fetchData = useCallback(
    async ({ page, size, query }: FetchParams) => {
      const res = await submissionFileService.getAllSubmissionFiles({
        page,
        size,
        search: query
      });

      const payload = res.data;

      return {
        items: payload?.content || [],
        total: payload?.totalElements || 0
      };
    },
    [refreshTick]
  );

  function openDeleteModal(f: SubmissionFileResponseDto) {
    setSelectedFile(f);
    setDeleteOpen(true);
  }

  async function handleDeleteFile() {
    if (!selectedFile?.id) return;
    await submissionFileService.deleteSubmissionFile(selectedFile.id);
    setRefreshTick((x) => x + 1);
  }

  function handleDownload(f: SubmissionFileResponseDto) {
    if (f.filePath) window.open(f.filePath, "_blank");
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Submission Files (Admin)</h1>
        <p className="text-sm text-gray-500">Quản lý các file nộp bài của sinh viên.</p>
      </div>

      <DataTable<SubmissionFileResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        emptyState={{
          title: 'Chưa có file nộp bài',
          description: 'Chưa có file nào được tải lên.',
        }}
        renderActions={(f) => (
          <>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => handleDownload(f)}
            >
              Tải xuống
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="rounded-full px-4 py-2 text-xs font-semibold"
              onClick={() => openDeleteModal(f)}
            >
              Xóa
            </Button>
          </>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedFile?.originalFileName || selectedFile?.id}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedFile(null);
        }}
        onConfirm={async () => {
          await handleDeleteFile();
          setDeleteOpen(false);
          setSelectedFile(null);
        }}
        title="Xóa file"
      />
    </div>
  );
};

export default SubmissionFilesAdmin;
