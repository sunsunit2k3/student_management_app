import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import { getCourses, deleteCourse } from "../../api/coursesService";
import { CourseResponseDto } from "../../types/course";

const CoursesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<CourseResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (c) => c.id },
    { key: 'code', header: 'Code', sortable: true, render: (c) => c.code },
    { key: 'name', header: 'Name', sortable: true, render: (c) => c.name || '' },
    { key: 'userId', header: 'Owner ID', render: (c) => c.userId || '' },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (c) => (c.createdAt ? new Date(c.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (c) => (c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size }: FetchParams) => {
    const apiPage = Math.max(0, page - 1);
    const res = await getCourses({ page: apiPage, size });
    const list = res.data;
    const items = list?.content || [];
    return { items, total: list?.totalElements || items.length };
  }, [refreshTick]);

  async function handleDelete(c: CourseResponseDto) {
    if (!c.id) return;
    const ok = window.confirm(`Xóa course ${c.code}?`);
    if (!ok) return;
    try {
      await deleteCourse(c.id);
      setRefreshTick(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(c: CourseResponseDto) {
    alert(`Cập nhật course: ${c.code}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Courses (Admin)</h1>
      <DataTable<CourseResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        renderActions={(c) => (
          <>
            <Button size="md" variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleEdit(c)}>Cập nhật</Button>
            <Button size="md" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(c)}>Xóa</Button>
          </>
        )}
      />
    </div>
  );
};

export default CoursesAdmin;
