import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <rect width="40" height="40" rx="8" fill="var(--foreground)"/>
        <path d="M12 20C12 16.134 15.134 13 19 13C22.866 13 26 16.134 26 20C26 23.866 22.866 27 19 27" stroke="var(--background)" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="12" cy="20" r="3" fill="var(--background)"/>
        <circle cx="19" cy="13" r="3" fill="var(--background)"/>
        <circle cx="26" cy="20" r="3" fill="var(--background)"/>
        <circle cx="19" cy="27" r="3" fill="var(--background)"/>
    </svg>
);
