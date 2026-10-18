import React from 'react';

interface GoogleIconProps {
  className?: string;
}

export const GoogleIcon = ({ className = 'w-4 h-4' }: GoogleIconProps) => (
  <img
    src="/google-g-logo.png"
    alt=""
    aria-hidden="true"
    className={`${className} shrink-0 object-contain`}
    draggable="false"
  />
);
