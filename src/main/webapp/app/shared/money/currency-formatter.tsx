import React from 'react';

interface CurrencyFormatterProps {
  amount: number;
  currency?: string;
  locale?: string;
}

export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({ amount, currency = 'USD', locale = 'en-US' }) => {
  const formatCurrency = (value: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `${currency} ${value.toFixed(2)}`;
    }
  };

  return <span data-testid="currency-value">{formatCurrency(amount)}</span>;
};

export default CurrencyFormatter;
