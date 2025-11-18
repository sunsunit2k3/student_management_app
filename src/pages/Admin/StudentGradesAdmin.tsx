import React, { useCallback, useMemo, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import studentGradeService from "../../api/studentGradeService";
import { StudentGradeResponseDto } from "../../types/studentgrade";

const StudentGradesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const enrollmentId = useMemo(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('enrollmentId') || undefined;
    } catch (e) {
      return undefined;
    }
  }, []);

  const columns: Column<StudentGradeResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (g) => g.id },
    { key: 'gradeItemId', header: 'Grade Item', render: (g) => g.gradeItemId },
    { key: 'score', header: 'Score', render: (g) => (g.score != null ? String(g.score) : '-') },
    { key: 'submitted', header: 'Submitted', render: (g) => (g.isSubmitted ? 'Yes' : 'No') },
  ];

  const fetchData = useCallback(async ({ page, size, query }: FetchParams) => {
    if (!enrollmentId) {
      // no enrollment filter provided — return empty
      return { items: [] as StudentGradeResponseDto[], total: 0 };
    }
    const res = await studentGradeService.getGradesByEnrollment(enrollmentId);
    const payload: any = res.data;
    let items: StudentGradeResponseDto[] = [];
    if (Array.isArray(payload)) items = payload;
    else if (payload && Array.isArray(payload.content)) items = payload.content;

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) => (it.gradeItemId || '').toLowerCase().includes(q) || (String(it.score || '')).toLowerCase().includes(q));
    }

    return { items, total: items.length };
  }, [enrollmentId, refreshTick]);

  async function handleDelete(g: StudentGradeResponseDto) {
    if (!g.id) return;
    const ok = window.confirm(`Xóa student grade ${g.id}?`);
    if (!ok) return;
    try {
      await studentGradeService.deleteStudentGrade(g.id);
      setRefreshTick(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(g: StudentGradeResponseDto) {
    alert(`Cập nhật student grade ${g.id}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Student Grades (Admin)</h1>
      {!enrollmentId && <div className="text-sm text-gray-500 mb-4">This page expects an `enrollmentId` query parameter to fetch grades via studentGradeService.getGradesByEnrollment(enrollmentId).</div>}
      <DataTable<StudentGradeResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        renderActions={(g) => (
          <>
            <Button size="md" variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleEdit(g)}>Cập nhật</Button>
            <Button size="md" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(g)}>Xóa</Button>
          </>
        )}
      />
    </div>
  );
};

export default StudentGradesAdmin;
