import React from 'react';

export function Panel({ title, meta, icon: Icon, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`panel flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-300" />}
          <h2 className="panel-title truncate">{title}</h2>
        </div>
        {meta && <div className="shrink-0 text-eyebrow uppercase text-ink-3">{meta}</div>}
      </header>
      <div className="rule" />
      <div className={`flex-1 px-5 py-5 sm:px-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
