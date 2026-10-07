// FIRST Traffic Light Protocol 2.0 isaretleri
export const TLP = {
  clear: {
    label: 'TLP:CLEAR',
    color: 'text-tlp-clear',
    name: 'Açık',
    rule: 'Dağıtım kısıtı yoktur; kamuya açık paylaşılabilir.',
  },
  green: {
    label: 'TLP:GREEN',
    color: 'text-tlp-green',
    name: 'Topluluk',
    rule: 'Topluluk içinde paylaşılabilir; kamuya açık kanallara konulamaz.',
  },
  amber: {
    label: 'TLP:AMBER',
    color: 'text-tlp-amber',
    name: 'Kurum',
    rule: 'Kurum içinde ve kurumun müşterileriyle, bilmesi gerekenlerle sınırlı paylaşılabilir.',
  },
  red: {
    label: 'TLP:RED',
    color: 'text-tlp-red',
    name: 'Kişisel',
    rule: 'Yalnızca adı geçen alıcılar içindir; başkasıyla paylaşılamaz.',
  },
};

export const TLP_ORDER = ['clear', 'green', 'amber', 'red'];
