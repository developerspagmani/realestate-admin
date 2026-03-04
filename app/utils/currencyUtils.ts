export const countryToCurrency: Record<string, { symbol: string, code: string }> = {
    'United States': { symbol: '$', code: 'USD' },
    'USA': { symbol: '$', code: 'USD' },
    'United Kingdom': { symbol: '£', code: 'GBP' },
    'UK': { symbol: '£', code: 'GBP' },
    'India': { symbol: '₹', code: 'INR' },
    'IN': { symbol: '₹', code: 'INR' },
    'Canada': { symbol: '$', code: 'CAD' },
    'Australia': { symbol: '$', code: 'AUD' },
    'Germany': { symbol: '€', code: 'EUR' },
    'France': { symbol: '€', code: 'EUR' },
    'Italy': { symbol: '€', code: 'EUR' },
    'Spain': { symbol: '€', code: 'EUR' },
    'Netherlands': { symbol: '€', code: 'EUR' },
    'Nigeria': { symbol: '₦', code: 'NGN' },
    'South Africa': { symbol: 'R', code: 'ZAR' },
    'United Arab Emirates': { symbol: 'AED ', code: 'AED' },
    'UAE': { symbol: 'AED ', code: 'AED' },
    'Saudi Arabia': { symbol: 'SR ', code: 'SAR' },
    'Kenya': { symbol: 'KSh ', code: 'KES' },
    'Ghana': { symbol: 'GH₵ ', code: 'GHS' },
};

export const currencyCodeToConfig: Record<string, { symbol: string, code: string }> = {
    'USD': { symbol: '$', code: 'USD' },
    'EUR': { symbol: '€', code: 'EUR' },
    'GBP': { symbol: '£', code: 'GBP' },
    'INR': { symbol: '₹', code: 'INR' },
    'CAD': { symbol: '$', code: 'CAD' },
    'AUD': { symbol: '$', code: 'AUD' },
    'NGN': { symbol: '₦', code: 'NGN' },
    'ZAR': { symbol: 'R', code: 'ZAR' },
    'AED': { symbol: 'AED ', code: 'AED' },
    'SAR': { symbol: 'SR ', code: 'SAR' },
    'KES': { symbol: 'KSh ', code: 'KES' },
    'GHS': { symbol: 'GH₵ ', code: 'GHS' },
};

export const getCurrencyConfig = (input?: string) => {
    if (!input) return currencyCodeToConfig['USD'];

    // Check if it's a known currency code
    if (currencyCodeToConfig[input.toUpperCase()]) {
        return currencyCodeToConfig[input.toUpperCase()];
    }

    // Check if it's a known country name (exact match)
    if (countryToCurrency[input]) return countryToCurrency[input];

    // Case insensitive country match
    const foundCountry = Object.keys(countryToCurrency).find(
        k => k.toLowerCase() === input.toLowerCase()
    );
    if (foundCountry) return countryToCurrency[foundCountry];

    // Default to USD
    return currencyCodeToConfig['USD'];
};

export const formatCurrency = (amount: number, input?: string) => {
    const config = getCurrencyConfig(input);
    return `${config.symbol}${amount.toLocaleString('en-US')}`;
};
