import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import studentGradeService from "../../api/studentGradeService";
import { StudentGradeResponseDto } from "../../types/studentgrade";

const StudentGradesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<StudentGradeResponseDto>[] = [
    { key: "id", header: "ID", sortable: true, render: (g) => g.id },
    {
      key: "gradeItemId",
      header: "Grade Item",
      render: (g) => g.gradeItemId
    },
    {
      key: "score",
      header: "Score",
      render: (g) => (g.score != null ? String(g.score) : "-")
    },
    {
      key: "submitted",
      header: "Submitted",
      render: (g) => (g.isSubmitted ? "Yes" : "No")
    }
  ];

  const fetchData = useCallback(
    async ({ page, size }: FetchParams) => {
      const res = await studentGradeService.getAllGrades({
        page,
        size,
      });

      const payload = res.data;

      return {
        items: payload?.content || [],
        total: payload?.totalElements || 0
      };
    },
    [refreshTick]
  );

  async function handleDelete(g: StudentGradeResponseDto) {
    if (!g.id) return;
    const ok = window.confirm(`Xóa student grade ${g.id}?`);
    if (!ok) return;

    try {
      await studentGradeService.deleteStudentGrade(g.id);
      setRefreshTick((x) => x + 1);
    } catch (e) {
      console.error(e);
      alert("Xóa thất bại");
    }
  }

  function handleEdit(g: StudentGradeResponseDto) {
    alert(`Cập nhật student grade ${g.id}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Student Grades (Admin)</h1>

      <DataTable<StudentGradeResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        renderActions={(g) => (
          <>
            <Button
              size="md"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleEdit(g)}
            >
              Cập nhật
            </Button>

            <Button
              size="md"
              variant="primary"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDelete(g)}
            >
              Xóa
            </Button>
          </>
        )}
      />
    </div>
  );
};

export default StudentGradesAdmin;
