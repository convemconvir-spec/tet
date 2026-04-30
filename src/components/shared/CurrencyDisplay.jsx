import React from 'react';

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

export default function CurrencyDisplay({ value, className }) {
  return <span className={className}>{formatCurrency(value)}</span>;
}