const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const euroSigned = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    signDisplay: 'exceptZero',
});

export const formatEuro = (value) => euro.format(value);
export const formatEuroSigned = (value) => euroSigned.format(value);

// Le date arrivano dal server come "AAAA-MM-GG" (grazie a dateStrings: true)
export function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}