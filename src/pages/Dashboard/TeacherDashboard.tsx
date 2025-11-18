import React from 'react';
import { Link } from 'react-router';

const TeacherDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Teacher Dashboard</h1>
      <p className="mb-4">Các nhiệm vụ chính cho Teacher:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li>Quản lý bài tập và grade items: <Link to="/grade-items" className="text-brand-500 underline">Grade Items</Link></li>
        <li>Quản lý sinh viên theo khóa học</li>
        <li>Xem và chấm điểm: <Link to="/student-grades" className="text-brand-500 underline">Student Grades</Link></li>
      </ul>
    </div>
  );
};

export default TeacherDashboard;
