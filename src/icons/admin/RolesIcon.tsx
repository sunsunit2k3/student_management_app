import React from 'react';

const RolesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default RolesIcon;
