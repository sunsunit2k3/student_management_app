import React from 'react';

const TeacherAssignmentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M8 8h8M8 12h6M8 16h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default TeacherAssignmentsIcon;
