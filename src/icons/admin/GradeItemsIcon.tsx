import React from 'react';

const GradeItemsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 8h10M7 12h6M7 16h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default GradeItemsIcon;
