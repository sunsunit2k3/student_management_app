import React, { useCallback, useState } from "react";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import { getRoles, deleteRole } from "../../api/rolesService";
import { RoleResponseDto } from "../../types/role";

const RolesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);

  const columns: Column<RoleResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (r) => r.id },
    { key: 'name', header: 'Name', sortable: true, render: (r) => r.name },
    { key: 'createdAt', header: 'Created At', sortable: true, render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : '') },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (r) => (r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '') },
  ];

  const fetchData = useCallback(async ({ page, size }: FetchParams) => {
    const apiPage = Math.max(0, page - 1);
    const res = await getRoles({ page: apiPage, size });
    const list = res.data;
    const items = list?.content || [];
    return { items, total: list?.totalElements || items.length };
  }, [refreshTick]);

  async function handleDelete(r: RoleResponseDto) {
    if (!r.id) return;
    const ok = window.confirm(`Xóa role ${r.name}?`);
    if (!ok) return;
    try {
      await deleteRole(r.id);
      setRefreshTick(x => x + 1);
    } catch (e) {
      console.error(e);
      alert('Xóa thất bại');
    }
  }

  function handleEdit(r: RoleResponseDto) {
    alert(`Cập nhật role: ${r.name}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Roles (Admin)</h1>
      <DataTable<RoleResponseDto>
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

export default RolesAdmin;
