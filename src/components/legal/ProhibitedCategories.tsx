import React from 'react';
import { PROHIBITED_CATEGORIES } from '@/content/legal/terms';

interface ProhibitedCategoriesProps {
  className?: string;
  listClassName?: string;
  headingClassName?: string;
  heading?: string;
}

const ProhibitedCategories: React.FC<ProhibitedCategoriesProps> = ({
  className = '',
  listClassName = 'list-disc pl-4 space-y-1',
  headingClassName = 'font-semibold',
  heading = 'Prohibited Content Monetization Categories',
}) => {
  return (
    <div className={className}>
      <h5 className={headingClassName}>{heading}</h5>
      <ul className={listClassName}>
        {PROHIBITED_CATEGORIES.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProhibitedCategories;
