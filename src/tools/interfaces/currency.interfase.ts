export interface CurrencyConversionResult {
  from: string;
  to: string;
  amount: number;
  convertedAmount: number;
  rate: number;
}

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
}