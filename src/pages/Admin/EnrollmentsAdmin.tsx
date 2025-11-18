import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import enrollmentService from "../../api/enrollmentService";
import { EnrollmentResponseDto } from "../../types/enrollment";

const EnrollmentsAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<EnrollmentResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (e) => e.id },
    { key: 'user', header: 'User', render: (e) => (
        <div>
          <div className="font-medium">{e.userName ?? e.userId}</div>
          <div className="text-xs text-gray-400">{e.userName ? e.userId : ''}</div>
        </div>
      )
    },
    { key: 'course', header: 'Course', render: (e) => (
        <div>
          <div className="font-medium">{e.courseName ?? e.courseId}</div>
          <div className="text-xs text-gray-400">{e.courseName ? e.courseId : ''}</div>
        </div>
      )
    },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (e) => (e.createdAt ? new Date(e.createdAt).toLocaleString() : '-') },
  ];

  const fetchData = useCallback(async ({ page, size, query }: FetchParams) => {
    // enrollmentService.getAllEnrollments returns either array or paged response
    const res = await enrollmentService.getAllEnrollments();
    const payload: any = res.data;
    let items: EnrollmentResponseDto[] = [];
    let total = 0;
    if (Array.isArray(payload)) {
      items = payload;
      total = payload.length;
    } else if (payload && Array.isArray(payload.content)) {
      items = payload.content;
      total = payload.totalElements || items.length;
    }

    // basic client-side search
    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) =>
        (it.userName || it.userId || '').toLowerCase().includes(q) ||
        (it.courseName || it.courseId || '').toLowerCase().includes(q)
      );
      total = items.length;
    }

    return { items, total };
  }, [refreshTick]);

  async function handleDelete(e: EnrollmentResponseDto) {
    if (!e.id) return;
    const ok = window.confirm(`Xóa enrollment ${e.id}?`);
    if (!ok) return;
    try {
      await enrollmentService.deleteEnrollment(e.id);
      setRefreshTick((x) => x + 1);
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(e: EnrollmentResponseDto) {
    alert(`Cập nhật enrollment ${e.id}`);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Enrollments (Admin)</h1>
      </div>

      <DataTable<EnrollmentResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        renderActions={(r) => (
          <>
            <Button size="md" variant="primary" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleEdit(r)}>Cập nhật</Button>
            <Button size="md" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(r)}>Xóa</Button>
          </>
        )}
      />
    </div>
  );
};

export default EnrollmentsAdmin;
