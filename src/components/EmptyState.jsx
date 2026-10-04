import React from 'react';
import { Radar, Gauge, ShieldCheck, FileText } from 'lucide-react';

const CAPABILITIES = [
  { icon: Gauge, title: 'Ağırlıklı tehdit skoru', desc: 'WHOIS, sertifika, itibar ve içerik sinyalleri tek bir 0–100 skorunda birleşir.' },
  { icon: ShieldCheck, title: 'Whitelist & Blacklist', desc: 'Özel güvenli ve zararlı alan adı/IP kurallarıyla anında tehdit doğrulaması yapılır.' },
  { icon: FileText, title: 'Açıklanabilir CTI Raporu', desc: 'Risk skorunu oluşturan tüm güvenlik bulguları gerekçeleriyle açıkça listelenir.' },
];

export function EmptyState() {
  return (
    <div className="animate-fade-up">
      <div className="panel px-6 py-12 text-center sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface-2">
          <Radar aria-hidden="true" className="h-6 w-6 text-brand-300" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">Analiz için bir gösterge girin</h2>
        <p className="mx-auto mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-2">
          Bir URL veya alan adı gönderdiğinizde platform, açık kaynak istihbarat sağlayıcılarını sorgular ve
          gerekçeleriyle birlikte tek sayfalık bir tehdit raporu üretir.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="panel p-5">
            <Icon aria-hidden="true" className="h-5 w-5 text-brand-300" />
            <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
