import React from 'react';
import { Link } from 'react-router';

const StudentDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Student Dashboard</h1>
      <p className="mb-4">Các nhiệm vụ chính cho Student:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li>Xem khóa học của tôi</li>
        <li>Nộp bài: <Link to="/submission-files" className="text-brand-500 underline">Submission Files</Link></li>
        <li>Xem điểm: <Link to="/student-grades" className="text-brand-500 underline">My Grades</Link></li>
      </ul>
    </div>
  );
};

export default StudentDashboard;
