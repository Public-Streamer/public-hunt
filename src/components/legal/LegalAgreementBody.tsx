import React from 'react';
import {
  LEGAL_NOTICE,
  LEGAL_TITLE,
  LEGAL_BODY_SECTIONS,
} from '@/content/legal/terms';
import ProhibitedCategories from '@/components/legal/ProhibitedCategories';

interface LegalAgreementBodyProps {
  size?: 'xs' | 'sm' | 'md';
  includeProhibited?: boolean;
  showImportantNotice?: boolean;
}

const sizes = {
  xs: {
    container: 'space-y-3',
    title: 'font-bold',
    sectionTitle: 'font-semibold',
    noticeTitle: 'font-bold',
    text: '',
  },
  sm: {
    container: 'space-y-4',
    title: 'text-lg font-bold',
    sectionTitle: 'font-semibold',
    noticeTitle: 'font-bold',
    text: '',
  },
  md: {
    container: 'space-y-6',
    title: 'text-xl font-bold',
    sectionTitle: 'font-semibold',
    noticeTitle: 'font-bold',
    text: '',
  },
};

const LegalAgreementBody: React.FC<LegalAgreementBodyProps> = ({
  size = 'sm',
  includeProhibited = true,
  showImportantNotice = true,
}) => {
  const s = sizes[size];

  return (
    <div className={s.container}>
      {showImportantNotice && (
        <div className="bg-red-50 p-3 sm:p-4 rounded border border-red-200">
          <h3 className={`text-red-700 mb-2 ${s.noticeTitle}`}>
            IMPORTANT LEGAL NOTICE
          </h3>
          <p className="text-red-700">{LEGAL_NOTICE}</p>
        </div>
      )}

      <div>
        <h4 className={`${s.title}`}>{LEGAL_TITLE}</h4>

        {LEGAL_BODY_SECTIONS.map((sec) => (
          <div key={sec.title} className="mt-2">
            <h5 className={`${s.sectionTitle}`}>{sec.title}</h5>
            <p className={s.text}>{sec.body}</p>
          </div>
        ))}

        {includeProhibited && (
          <div className="mt-2">
            <ProhibitedCategories heading="Acceptable Use & Prohibited Monetization Categories" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalAgreementBody;
