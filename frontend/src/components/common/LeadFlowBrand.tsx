import React from 'react';

const sizes = {
  navbar: {
    icon: 'w-8 h-8',
    name: 'text-sm',
    tagline: 'text-[7px] tracking-[0.1em]',
  },
  footer: {
    icon: 'w-9 h-9',
    name: 'text-base',
    tagline: 'text-[8px] tracking-[0.12em]',
  },
  sidebar: {
    icon: 'w-8 h-8',
    name: 'text-[15px]',
    tagline: 'text-[7.5px] tracking-[0.07em]',
  },
} as const;

interface LeadFlowBrandProps {
  size?: keyof typeof sizes;
}

export const LeadFlowBrand = ({ size = 'navbar' }: LeadFlowBrandProps) => {
  const style = sizes[size];

  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/leadflow-icon.svg"
        alt=""
        aria-hidden="true"
        className={`${style.icon} shrink-0`}
      />
      <span className="flex flex-col items-start gap-0.5">
        <span className={`${style.name} font-semibold leading-none`}>
          <span className="text-slate-100">Lead</span>
          <span className="text-indigo-400">Flow</span>
        </span>
        <span className={`${style.tagline} whitespace-nowrap font-medium leading-tight text-slate-400`}>
          Turn Leads Into Conversations
        </span>
      </span>
    </span>
  );
};
