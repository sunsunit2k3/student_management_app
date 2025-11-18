import React from 'react';

const EnrollmentsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 2v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export default EnrollmentsIcon;
