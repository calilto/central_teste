import { addDays, isWeekend, format, parseISO } from 'date-fns';

// Tabela de IOF Regressivo conforme o Excel
const IOF_TABLE = {
    1: 0.96, 2: 0.90, 3: 0.83, 4: 0.76, 5: 0.73, 6: 0.70, 7: 0.66, 8: 0.63, 9: 0.60, 10: 0.56,
    11: 0.53, 12: 0.50, 13: 0.46, 14: 0.43, 15: 0.40, 16: 0.36, 17: 0.33, 18: 0.30, 19: 0.26, 20: 0.23,
    21: 0.20, 22: 0.16, 23: 0.13, 24: 0.10, 25: 0.06, 26: 0.03, 27: 0, 28: 0, 29: 0, 30: 0
};

// Simplified holidays
const HOLIDAYS = [
    '2025-12-25', '2026-01-01', '2026-04-21', '2026-05-01', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25'
];

export const isBusinessDay = (date) => {
    if (!date || isNaN(date.getTime())) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !isWeekend(date) && !HOLIDAYS.includes(dateStr);
};

export const getNextBusinessDay = (date, days = 1) => {
    let count = 0;
    let current = date;
    while (count < days) {
        current = addDays(current, 1);
        if (isBusinessDay(current)) {
            count++;
        }
    }
    return current;
};

export const calculateRendimentos = (financeiro, selic, dataInicio, taxaConta, taxaCDB, taxaCompromissada) => {
    const cdiDiario = Math.pow(1 + (selic - 0.001), 1 / 252) - 1;
    const irRate = 0.225; // Conforme Excel (fixado para curto prazo)

    const results = [];
    if (!dataInicio) return results;
    
    const startDate = parseISO(dataInicio);
    if (isNaN(startDate.getTime())) return results;

    for (let du = 1; du <= 20; du++) {
        const dataFim = getNextBusinessDay(startDate, du);
        const diasCorridos = Math.ceil((dataFim - startDate) / (1000 * 60 * 60 * 24));
        const iof = IOF_TABLE[diasCorridos] || 0;

        const calcRendimentoBase = (taxa) => {
            const fator = Math.pow(1 + taxa * cdiDiario, du) - 1;
            return fator * financeiro;
        };

        const rendimentoConta = calcRendimentoBase(taxaConta) * (1 - iof) * (1 - irRate);
        const rendimentoCDB = calcRendimentoBase(taxaCDB) * (1 - iof) * (1 - irRate);
        const rendimentoCompromissada = calcRendimentoBase(taxaCompromissada) * (1 - irRate);

        const equivCDB = taxaCompromissada / (1 - iof);

        results.push({
            du,
            data: format(dataFim, 'dd/MM/yyyy'),
            iof: (iof * 100).toFixed(0) + '%',
            contaRemunerada: rendimentoConta,
            cdb: rendimentoCDB,
            compromissada: rendimentoCompromissada,
            equivCDB: (equivCDB * 100).toFixed(2) + '%'
        });
    }

    return results;
};
