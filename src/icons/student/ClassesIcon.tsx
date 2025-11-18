import React from 'react';

const ClassesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect x="3" y="4" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14h12M6 18h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default ClassesIcon;
