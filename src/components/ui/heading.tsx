// components/ui/heading.tsx
import React from 'react';

interface HeadingProps {
  level: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ level, children, className }) => {
  switch (level) {
    case 1:
      return <h1 className={`${className} text-3xl font-bold`}>{children}</h1>;
    case 2:
      return <h2 className={`${className} text-2xl font-semibold`}>{children}</h2>;
    case 3:
      return <h3 className={`${className} text-xl font-medium`}>{children}</h3>;
    default:
      return <h1 className={className}>{children}</h1>;
  }
};
