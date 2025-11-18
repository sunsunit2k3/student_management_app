import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import gradeItemService from "../../api/gradeItemService";
import { GradeItemResponseDto } from "../../types/gradeitem";

const GradeItemsAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<GradeItemResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (g) => g.id },
    { key: 'name', header: 'Name', sortable: true, render: (g) => g.name },
    { key: 'weight', header: 'Weight', render: (g) => (g.weight ?? '-') },
    { key: 'dueDate', header: 'Due Date', render: (g) => (g.dueDate ? new Date(g.dueDate).toLocaleString() : '-') },
  ];

  const fetchData = useCallback(async ({ page, size, query }: FetchParams) => {
    const res = await gradeItemService.getAllGradeItems();
    const payload: any = res.data;
    let items: GradeItemResponseDto[] = [];
    let total = 0;
    if (Array.isArray(payload)) {
      items = payload;
      total = payload.length;
    } else if (payload && Array.isArray(payload.content)) {
      items = payload.content;
      total = payload.totalElements || items.length;
    }

    if (query) {
      const q = query.toLowerCase();
      items = items.filter((it) => (it.name || '').toLowerCase().includes(q));
      total = items.length;
    }

    return { items, total };
  }, [refreshTick]);

  async function handleDelete(g: GradeItemResponseDto) {
    if (!g.id) return;
    const ok = window.confirm(`Xóa grade item ${g.name}?`);
    if (!ok) return;
    try {
      await gradeItemService.deleteGradeItem(g.id);
      setRefreshTick(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(g: GradeItemResponseDto) {
    alert(`Cập nhật grade item: ${g.name}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Grade Items (Admin)</h1>
      <DataTable<GradeItemResponseDto>
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

export default GradeItemsAdmin;
