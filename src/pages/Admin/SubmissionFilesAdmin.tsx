import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import submissionFileService from "../../api/submissionFileService";
import { SubmissionFileResponseDto } from "../../types/submissionfile";

const SubmissionFilesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const studentGradeId = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('studentGradeId') || undefined;
    } catch (e) {
      return undefined;
    }
  }, []);

  const columns: Column<SubmissionFileResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (f) => f.id },
    { key: 'originalFileName', header: 'Filename', render: (f) => f.originalFileName || f.filePath },
    { key: 'uploadDate', header: 'Uploaded At', render: (f) => (f.uploadDate ? new Date(f.uploadDate).toLocaleString() : '-') },
  ];

  const fetchData = useCallback(async ({ page, size, query }: FetchParams) => {
    let res: any;
    if (studentGradeId) {
      res = await submissionFileService.getFilesByStudentGrade(studentGradeId);
    } else {
      res = await submissionFileService.getAllSubmissionFiles();
    }

    const payload: any = res.data;
    let items: SubmissionFileResponseDto[] = [];
    if (Array.isArray(payload)) items = payload;
    else if (payload && Array.isArray(payload.content)) items = payload.content;

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) => (it.originalFileName || it.filePath || '').toLowerCase().includes(q));
    }

    return { items, total: items.length };
  }, [studentGradeId, refreshTick]);

  async function handleDelete(f: SubmissionFileResponseDto) {
    if (!f.id) return;
    const ok = window.confirm(`Xóa file ${f.originalFileName || f.id}?`);
    if (!ok) return;
    try {
      await submissionFileService.deleteSubmissionFile(f.id);
      setRefreshTick(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleDownload(f: SubmissionFileResponseDto) {
    // Simple client-side open for filePath; in real app use a signed URL or API endpoint
    if (f.filePath) window.open(f.filePath, '_blank');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Submission Files (Admin)</h1>
      {!studentGradeId && <div className="text-sm text-gray-500 mb-4">This page can use `studentGradeId` query parameter to filter files via submissionFileService.getFilesByStudentGrade(studentGradeId).</div>}

      <DataTable<SubmissionFileResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        renderActions={(f) => (
          <>
            <Button size="md" variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleDownload(f)}>Tải</Button>
            <Button size="md" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(f)}>Xóa</Button>
          </>
        )}
      />
    </div>
  );
};

export default SubmissionFilesAdmin;
