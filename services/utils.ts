
export const formatPhone = (value: string | undefined | null) => {
    if (!value) return '';

    // Remove tudo que não é dígito
    let numbers = value.replace(/\D/g, '');

    // Trata código do país 55 se presente no início
    if (numbers.length > 11 && numbers.startsWith('55')) {
        numbers = numbers.substring(2);
    }

    // Formato Celular (11 dígitos): (XX) 9XXXX-XXXX
    if (numbers.length === 11) {
        return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }

    // Formato Fixo (10 dígitos): (XX) XXXX-XXXX
    if (numbers.length === 10) {
        return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }

    // Fallback para outros tamanhos (mantém apenas números ou formatação parcial se possível)
    if (numbers.length > 2) {
        if (numbers.length <= 6) {
            return numbers.replace(/^(\d{2})(\d+)/, '($1) $2');
        }
        if (numbers.length <= 10) {
            return numbers.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
        }
        return numbers.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
    }

    return numbers;
};

export const maskPhone = (value: string) => {
    let numbers = value.replace(/\D/g, '');

    if (numbers.length > 11) {
        numbers = numbers.substring(0, 11);
    }

    if (numbers.length === 11) {
        return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (numbers.length > 6) {
        return numbers.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (numbers.length > 2) {
        return numbers.replace(/^(\d{2})(\d+)/, '($1) $2');
    } else if (numbers.length > 0) {
        return `(${numbers}`;
    }

    return '';
};
