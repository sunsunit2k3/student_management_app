import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import DataTable, { Column, FetchParams } from "../../components/tables/DataTable";
import Button from "../../components/ui/button/Button";
import { createCourse, deleteCourse, getCourses, updateCourse } from "../../api/coursesService";
import { CourseResponseDto } from "../../types/course";
import { UserResponseDto } from "../../types/user"; 
import CrudFormModal from "../../components/modals/CrudFormModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import userService from "../../api/userService";

// --- TYPE DEFINITIONS ---

type CourseFormValues = {
  code: string;
  name: string;
  teacherId: string;
};

// --- COMPONENT CON: USER SEARCH SELECT (ĐÃ TỐI ƯU) ---
interface UserSearchSelectProps {
  value: string;             
  initialDisplayName?: string; 
  onChange: (userId: string) => void;
  placeholder?: string;
}

const UserSearchSelect: React.FC<UserSearchSelectProps> = ({
  initialDisplayName,
  onChange,
  placeholder,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialDisplayName || "");
  const [suggestions, setSuggestions] = useState<UserResponseDto[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Logic tìm kiếm (Debounce)
  useEffect(() => {
    if (!searchTerm.trim() || !showDropdown) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoading(true);
        const role = 'TEACHER'
        const page=0
        const size=5
        const res = await userService.getAllUsers({ search: searchTerm , role, page, size});
        const userList = res.data?.content || []; 
        setSuggestions(userList);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, showDropdown]);

  // Click outside để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (user: UserResponseDto) => {
    onChange(user.id); // Bắn ID ra ngoài
    // Hiển thị tên đẹp trên UI
    setSearchTerm(user.firstName || user.username || user.email || "");
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setShowDropdown(true);
    
    // QUAN TRỌNG: Khi xóa hết chữ, reset ID về rỗng ngay
    if (val === "") {
      onChange("");
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => {
          setShowDropdown(true);
          // Nếu input đang có chữ, trigger lại việc tìm kiếm (hoặc hiện lại suggestions cũ nếu muốn)
        }}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
        placeholder={placeholder || "Tìm kiếm giảng viên..."}
        autoComplete="off"
      />
      
      {/* DROPDOWN KẾT QUẢ: Chỉ hiện khi có suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <ul>
            {suggestions.map((user) => (
              <li
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="cursor-pointer px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-50 last:border-none dark:border-gray-700"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    {user.firstName || user.username}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>@{user.username}</span>
                    {user.email && <span>• {user.email}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Logic hiển thị "Không tìm thấy" - Chỉ hiện khi KHÔNG loading, CÓ search term và KHÔNG có kết quả */}
      {showDropdown && !isLoading && suggestions.length === 0 && searchTerm.trim() !== "" && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-100 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          Không tìm thấy kết quả phù hợp.
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const CoursesAdmin: React.FC = () => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponseDto | null>(null);

  const baseFormValues = useMemo<CourseFormValues>(() => ({ code: "", name: "", teacherId: "" }), []);
  
  const editFormValues = useMemo<CourseFormValues>(
    () => ({
      code: selectedCourse?.code || "",
      name: selectedCourse?.name || "",
      teacherId: selectedCourse?.teacherId || "",
    }),
    [selectedCourse]
  );

  const columns: Column<CourseResponseDto>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (c) => c.id },
    { key: 'code', header: 'Code', sortable: true, render: (c) => c.code },
    { key: 'name', header: 'Name', sortable: true, render: (c) => c.name || '' },
    { key: 'teacherName', header: 'Teacher', render: (c) => (
      <div>
        <div className="font-medium">{c.teacherName ?? 'Chưa phân công'}</div>
        <div className="text-xs text-gray-400">{c.teacherId ? c.teacherId : ''}</div>
      </div>
    ) },
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

  function openCreateModal() {
    setSelectedCourse(null);
    setCreateOpen(true);
  }

  function openEditModal(course: CourseResponseDto) {
    setSelectedCourse(course);
    setEditOpen(true);
  }

  function openDeleteModal(course: CourseResponseDto) {
    setSelectedCourse(course);
    setDeleteOpen(true);
  }

  // CREATE
  async function handleCreateCourse(values: CourseFormValues) {
    try {
      const normalizedName = values.name.trim();
      const normalizedTeacher = values.teacherId.trim();
      
      await createCourse({ 
        code: values.code.trim(), 
        name: normalizedName || undefined, 
        userId: normalizedTeacher || undefined 
      });

      toast.success('Tạo khóa học thành công!');
      setRefreshTick((x) => x + 1);
      setCreateOpen(false); // Đóng modal sau khi tạo thành công
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Tạo khóa học thất bại.');
      throw error; 
    }
  }

  // UPDATE
  async function handleUpdateCourse(values: CourseFormValues) {
      if (!selectedCourse?.id) {
        toast.error("Không tìm thấy ID khóa học!");
        return;
      }

      const newCode = values.code.trim();
      const newName = values.name.trim();
      const newTeacherId = values.teacherId.trim();

      const oldCode = selectedCourse.code || "";
      const oldName = selectedCourse.name || "";
      const oldTeacherId = selectedCourse.teacherId || "";
      const payload: any = {}; 

      if (newCode !== oldCode) payload.code = newCode;
      if (newName !== oldName) payload.name = newName;
      if (newTeacherId !== oldTeacherId) payload.userId = newTeacherId;

      if (Object.keys(payload).length === 0) {
        toast.info("Không có sự thay đổi dữ liệu nào!");
        return;
      }

      try {
        await updateCourse(selectedCourse.id, payload);
        toast.success('Cập nhật khóa học thành công!');
        setRefreshTick((prev) => prev + 1); 
        setEditOpen(false); 
        setSelectedCourse(null); 
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Cập nhật thất bại.';
        toast.error(errorMessage);
      }
    }

  // DELETE
  async function handleDeleteCourse() {
    if (!selectedCourse?.id) return;
    try {
      await deleteCourse(selectedCourse.id);
      toast.success('Đã xóa khóa học!');
      setRefreshTick((x) => x + 1);
    } catch (error: any) {
      console.error(error);
      toast.error('Xóa thất bại. Có thể khóa học đang được sử dụng.');
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Quản lý</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Courses (Admin)</h1>
        <p className="text-sm text-gray-500">Thêm, Sửa và theo dõi các khóa học cùng giảng viên phụ trách.</p>
      </div>
      
      <DataTable<CourseResponseDto>
        columns={columns}
        fetchData={fetchData}
        initialPageSize={10}
        toolbarSlot={<Button size="sm" onClick={openCreateModal}>Tạo mới</Button>}
        emptyState={{
          title: 'Chưa có khóa học',
          description: 'Bấm “+ Khóa học” để tạo bản ghi đầu tiên.',
          action: (<Button size="sm" onClick={openCreateModal} >Tạo ngay</Button>),
        }}
        renderActions={(c) => (
          <>
            <Button size="sm" variant="outline" className="rounded-full px-4 py-2 text-xs font-semibold" onClick={() => openEditModal(c)}>Sửa</Button>
            <Button size="sm" variant="danger" className="rounded-full px-4 py-2 text-xs font-semibold" onClick={() => openDeleteModal(c)}>Xóa</Button>
          </>
        )}
      />

      {/* === CREATE MODAL === */}
      <CrudFormModal<CourseFormValues>
        isOpen={createOpen}
        mode="create"
        initialValues={baseFormValues}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateCourse}
        description="Nhập thông tin khóa học và tìm kiếm giảng viên để liên kết."
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mã khóa học</label>
              <input
                value={values.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="VD: CS101"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên khóa học</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                placeholder="Nhập tên khóa học"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Giảng viên phụ trách</label>
              {/* SỬ DỤNG KEY ĐỂ RESET STATE KHI MỞ FORM MỚI */}
              <UserSearchSelect
                key="create-user-select"
                value={values.teacherId}
                onChange={(newId) => handleChange('teacherId', newId)}
                placeholder="Nhập tên hoặc username để tìm kiếm..."
              />
            </div>
          </div>
        )}
      />

      {/* === UPDATE MODAL === */}
      <CrudFormModal<CourseFormValues>
        isOpen={editOpen}
        mode="update"
        initialValues={editFormValues}
        onClose={() => {
          setEditOpen(false);
          setSelectedCourse(null);
        }}
        onSubmit={handleUpdateCourse}
        description={`Cập nhật thông tin cho khóa học ${selectedCourse?.code || ''}.`}
        renderFields={({ values, handleChange }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mã khóa học</label>
              <input
                value={values.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tên khóa học</label>
              <input
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-white/10 dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Giảng viên phụ trách</label>
              {/* SỬ DỤNG KEY ĐỂ RESET STATE KHI ID KHÓA HỌC THAY ĐỔI */}
              <UserSearchSelect
                key={selectedCourse?.id || 'edit-user-select'}
                value={values.teacherId}
                initialDisplayName={selectedCourse?.teacherName}
                onChange={(newId) => handleChange('teacherId', newId)}
                placeholder="Nhập tên hoặc username để thay đổi giảng viên..."
              />
            </div>
          </div>
        )}
      />

      <DeleteConfirmModal
        isOpen={deleteOpen}
        entityName={selectedCourse?.code}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedCourse(null);
        }}
        onConfirm={async () => {
          await handleDeleteCourse();
          setDeleteOpen(false);
          setSelectedCourse(null);
        }}
        title="Xóa khóa học"
      />
    </div>
  );
};

export default CoursesAdmin;