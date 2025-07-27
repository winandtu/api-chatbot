import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import axios from 'axios';
import { Product } from './interfaces/product.interface';
import { CurrencyConversionResult } from './interfaces/currency.interfase';
import { ExchangeRatesResponse } from './interfaces/currency.interfase';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private products: Product[] = [];

  constructor(private configService: ConfigService) {
    this.loadProducts();
  }

  /**
   * Load products from CSV file on service initialization
   */
  private loadProducts() {
    try {
      // Change this line to point to the correct path
      const csvPath = path.join(process.cwd(), 'src', 'products_list.csv');

      const csvContent = fs.readFileSync(csvPath, 'utf8');

      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      this.products = parseResult.data as Product[];
      this.logger.log(`Loaded ${this.products.length} products from CSV`);
    } catch (error) {
      this.logger.error('Error loading products from CSV:', error);
      this.products = [];
    }
  }

  /**
   * Search for products based on user query
   * Returns the 2 products
   */
  searchProducts(query: string): Product[] {
    try {
      const searchTerm = query.toLowerCase();

      // Define gender-specific filters
      const maleKeywords = ['dad', 'father', 'padre', 'men', 'man', 'boy', 'boys', 'male', 'him', 'his'];
      const femaleKeywords = ['mom', 'mother', 'madre', 'women', 'woman', 'girl', 'girls', 'female', 'her'];

      const isMaleTarget = maleKeywords.some(keyword => searchTerm.includes(keyword));
      const isFemaleTarget = femaleKeywords.some(keyword => searchTerm.includes(keyword));

      // Scoring algorithm based on relevance
      const scoredProducts = this.products.map(product => {
        let score = 0;
        const title = product.displayTitle.toLowerCase();
        const embeddingText = product.embeddingText.toLowerCase();
        const productType = product.productType.toLowerCase();

        // Gender filtering - heavily penalize wrong gender products
        if (isMaleTarget) {
          // Penalize women's products heavily
          if (title.includes('women') || title.includes('woman') || embeddingText.includes('women')) {
            score -= 100;
          }
          // Boost men's or unisex products
          if (title.includes('men') || title.includes('boy') || title.includes('boys')) {
            score += 15;
          }
        }

        if (isFemaleTarget) {
          // Penalize men's products heavily
          if (title.includes('men') || title.includes('boy') || title.includes('boys') || embeddingText.includes('men')) {
            score -= 100;
          }
          // Boost women's products
          if (title.includes('women') || title.includes('woman') || embeddingText.includes('women')) {
            score += 15;
          }
        }

        // Exact match in title gets highest score
        if (title.includes(searchTerm)) {
          score += 10;
        }

        // Match in embedding text
        if (embeddingText.includes(searchTerm)) {
          score += 5;
        }

        // Match in product type
        if (productType.includes(searchTerm)) {
          score += 3;
        }

        // Individual word matches
        const queryWords = searchTerm.split(' ');
        queryWords.forEach(word => {
          if (word.length > 2 && !maleKeywords.includes(word) && !femaleKeywords.includes(word)) {
            if (title.includes(word)) score += 2;
            if (embeddingText.includes(word)) score += 1;
          }
        });

        // Special logic for gift searches
        if (searchTerm.includes('present') || searchTerm.includes('gift') || searchTerm.includes('regalo')) {
          // For gifts, prefer items that are more universal or appropriate
          if (productType.includes('home')) score += 5; // Home items can be good gifts
          if (title.includes('safely') || title.includes('detergent')) score += 3; // Practical gifts
        }

        return { product, score };
      });

      // Sort by score and return top 2, but only positive scores
      const topProducts = scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(item => item.product);

      this.logger.log(`Found ${topProducts.length} products for query: "${query}"`);

      // Log scores for debugging
      scoredProducts
        .filter(item => item.score > 0)
        .slice(0, 3)
        .forEach(item => {
          this.logger.log(`Product: ${item.product.displayTitle}, Score: ${item.score}`);
        });

      return topProducts;
    } catch (error) {
      this.logger.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Convert currency using Open Exchange Rates API
   */
  async convertCurrencies(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<CurrencyConversionResult> {
    try {
      const apiKey = this.configService.get<string>('OPENEXCHANGERATES_API_KEY');

      if (!apiKey) {
        throw new Error('Open Exchange Rates API key not configured');
      }

      // Get latest exchange rates
      const response = await axios.get<ExchangeRatesResponse>(
        `https://openexchangerates.org/api/latest.json?app_id=${apiKey}`,
      );

      const rates = response.data.rates;

      // Convert from USD base to target currencies
      let convertedAmount: number;
      let rate: number;

      if (fromCurrency.toUpperCase() === 'USD') {
        rate = rates[toCurrency.toUpperCase()];
        convertedAmount = amount * rate;
      } else if (toCurrency.toUpperCase() === 'USD') {
        rate = 1 / rates[fromCurrency.toUpperCase()];
        convertedAmount = amount * rate;
      } else {
        // Convert through USD
        const fromRate = rates[fromCurrency.toUpperCase()];
        const toRate = rates[toCurrency.toUpperCase()];
        rate = toRate / fromRate;
        convertedAmount = amount * rate;
      }

      const result: CurrencyConversionResult = {
        from: fromCurrency.toUpperCase(),
        to: toCurrency.toUpperCase(),
        amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: Math.round(rate * 10000) / 10000,
      };

      this.logger.log(`Currency conversion: ${amount} ${fromCurrency} = ${result.convertedAmount} ${toCurrency}`);
      return result;
    } catch (error) {
      this.logger.error('Error converting currencies:', error);
      throw new Error(`Failed to convert currency: ${error.message}`);
    }
  }
}