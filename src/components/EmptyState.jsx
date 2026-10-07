import React from 'react';
import { BANDS } from '../lib/verdict';
import { SeverityTag } from './ui/SeverityTag';

const MEANING = {
  critical: 'Neredeyse kesin olarak oltalama altyapısı.',
  high: 'Büyük olasılıkla oltalama amaçlı.',
  medium: 'Olası oltalama; ek doğrulama önerilir.',
  low: 'Bilinen bir gösterge saptanmadı. Temiz anlamına gelmez.',
};

const CONTENTS = [
  ['Değerlendirme', 'Karar kelimesi, tahmin cümlesi ve bantlı skor ölçeği.'],
  ['Bulgular', 'Tetiklenen her kural; önem derecesi, gerekçesi ve skora kaç puan kattığıyla birlikte.'],
  ['Kanıt', 'WHOIS, DNS, AbuseIPDB ve VirusTotal gözlemleri; sorgulanamayan kaynak açıkça belirtilir.'],
  ['Benzer alan adları', 'Taklit adayları ve benzerlik oranları.'],
];

// Ilk acilista arayuzu ogreten bos durum: skorun nasil okunacagi yayinlanir.
export function EmptyState() {
  return (
    <div className="sheet animate-rise">
      <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="px-5 py-6 sm:px-8" aria-labelledby="bands-h">
          <h2 id="bands-h" className="doc-h">
            Skor nasıl okunur
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-2">
            Skor 0–100 arasındadır. Her sinyal bağımsız bir risk olasılığı taşır; sinyaller birleştikçe skor azalan
            getiriyle yükselir ve 100’ü aşmaz. Eski alan adı veya temiz VirusTotal sonucu gibi güven sinyalleri, kesin kanıt
            yoksa skoru düşürür. Bulguların puanları toplandığında skoru verir.
          </p>
          <table className="mt-5 w-full text-left text-sm">
            <caption className="sr-only">Skor bantları</caption>
            <thead>
              <tr className="border-b border-line-strong text-xs text-ink-3">
                <th scope="col" className="w-20 py-2 pr-3 font-medium">Aralık</th>
                <th scope="col" className="py-2 pr-3 font-medium">Karar</th>
                <th scope="col" className="hidden py-2 font-medium sm:table-cell">Anlamı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...BANDS].reverse().map((b) => (
                <tr key={b.key}>
                  <td className="data py-2.5 pr-3 text-[0.8125rem] text-ink-2">
                    {b.from}–{b.to}
                  </td>
                  <td className="py-2.5 pr-3">
                    <SeverityTag severity={b.key} label={b.label} />
                  </td>
                  <td className="hidden py-2.5 text-ink-2 sm:table-cell">{MEANING[b.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-ink-3">
            Engel listesindeki bir kalıp eşleşirse skor doğrudan 100 olur; izin listesindeki bir kalıp eşleşirse harici
            sorgular atlanır ve gösterge İzinli olarak işaretlenir.
          </p>
        </section>

        <section className="border-t border-line bg-sunken px-5 py-6 sm:px-8 lg:border-l lg:border-t-0" aria-labelledby="contents-h">
          <h2 id="contents-h" className="doc-h">
            Brifing neleri içerir
          </h2>
          <dl className="mt-4 space-y-4">
            {CONTENTS.map(([t, d]) => (
              <div key={t}>
                <dt className="text-sm font-semibold text-ink">{t}</dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-ink-3">
            Her brifing bir TLP dağıtım işareti taşır; yazdırıldığında da korunur.
          </p>
        </section>
      </div>
    </div>
  );
}
