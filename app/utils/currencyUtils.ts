export const countryToCurrency: Record<string, { symbol: string, code: string }> = {
    'United States': { symbol: '$', code: 'USD' },
    'USA': { symbol: '$', code: 'USD' },
    'United Kingdom': { symbol: '£', code: 'GBP' },
    'UK': { symbol: '£', code: 'GBP' },
    'India': { symbol: '₹', code: 'INR' },
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

export const getCurrencyConfig = (countryName?: string) => {
    if (!countryName) return countryToCurrency['USA'];

    // Exact match
    if (countryToCurrency[countryName]) return countryToCurrency[countryName];

    // Case insensitive match
    const found = Object.keys(countryToCurrency).find(
        k => k.toLowerCase() === countryName.toLowerCase()
    );
    if (found) return countryToCurrency[found];

    // Default to USD
    return countryToCurrency['USA'];
};

export const formatCurrency = (amount: number, countryName?: string) => {
    const config = getCurrencyConfig(countryName);
    return `${config.symbol}${amount.toLocaleString()}`;
};
