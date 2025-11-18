import React from 'react';

const CoursesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="4" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default CoursesIcon;
