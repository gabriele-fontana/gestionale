const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const euroSigned = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    signDisplay: 'exceptZero',
});

const dateTime = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
});

export const formatEuro = (value) => euro.format(value);
export const formatEuroSigned = (value) => euroSigned.format(value);


// Riceve i secondi UNIX dal server e mostra l'ora locale di chi legge
export const formatDateTime = (unixSeconds) => dateTime.format(new Date(unixSeconds * 1000));

// Le date arrivano dal server come "AAAA-MM-GG" (grazie a dateStrings: true)
export function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}