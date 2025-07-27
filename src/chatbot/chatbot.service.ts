import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ToolsService } from '../tools/tools.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private toolsService: ToolsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    //const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Process user query and return chatbot response
   */
  async processQuery(userQuery: string): Promise<string> {
    try {
      this.logger.log(`Processing user query: "${userQuery}"`);

      // Step 1: First call to LLM with available functions
      const firstResponse = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful shopping assistant. Use the available functions to help users find products or convert currencies. 
          
          IMPORTANT RULES:
          - If the user asks for product prices in a different currency (like "price in euros", "cost in CAD", etc.), you MUST:
            1. First use searchProducts to find the product
            2. Then use convertCurrencies to convert the price to the requested currency
          - If the user asks for product recommendations, use the searchProducts function.
          - If the user asks for currency conversion, use the convertCurrencies function.
          - Always use the available functions to provide accurate and complete information.
          - When you see queries like "price of X in Y currency", this requires BOTH functions.
            `,
          },
          {
            role: 'user',
            content: userQuery,
          },
        ],
        functions: [
          {
            name: 'searchProducts',
            description: 'Search for products based on user query',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query for products (e.g., "present", "phone", "watch")',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'convertCurrencies',
            description: 'Convert amount from one currency to another',
            parameters: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                  description: 'The amount to convert',
                },
                fromCurrency: {
                  type: 'string',
                  description: 'The source currency code (e.g., USD, EUR)',
                },
                toCurrency: {
                  type: 'string',
                  description: 'The target currency code (e.g., USD, EUR)',
                },
              },
              required: ['amount', 'fromCurrency', 'toCurrency'],
            },
          },
        ],
        function_call: 'auto',
      });

      const message = firstResponse.choices[0].message;

      // Step 2: Check if function was called
      if (message.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments);

        this.logger.log(`Function called: ${functionName} with args:`, functionArgs);

        let functionResult: any;

        // Step 3: Execute the appropriate function
        if (functionName === 'searchProducts') {
          const products = this.toolsService.searchProducts(functionArgs.query);
          functionResult = products.map(product => ({
            title: product.displayTitle,
            price: product.price,
            url: product.url,
            imageUrl: product.imageUrl,
            productType: product.productType,
            variants: product.variants,
          }));

          // Check if user query mentions currency conversion
          // Example: "What is the price of this phone in EUR?"
          // Define keywords to match for price/cost queries
          const priceKeywords = 'price|cost|costs|expensive|fee|fees|charge|charges';
          // Build a flexible regex using the keywords
          const currencyMatch = userQuery.match(new RegExp(`(?:${priceKeywords}).*in\\s+([A-Z]{3})`, 'i'));
          if (currencyMatch) {
            try {
              const targetCurrency = currencyMatch[1].toUpperCase();
              const convertedProducts = await Promise.all(
                functionResult.map(async product => {
                  const convertedPrice = await this.toolsService.convertCurrencies(
                    product.price,
                    'USD', // Assuming the base price is in USD
                    targetCurrency,
                  );
                  return {
                    ...product,
                    convertedPrice,
                  };
                }),
              );
              functionResult = convertedProducts;
            } catch (error) {
              this.logger.error('Currency conversion failed:', error);
              functionResult = { error: 'Currency conversion failed. Please try again.' };
            }

          } else {
            // No currency conversion needed, return products as is
            functionResult = functionResult;
          }


        } else if (functionName === 'convertCurrencies') {
          try {
            functionResult = await this.toolsService.convertCurrencies(
              functionArgs.amount,
              functionArgs.fromCurrency,
              functionArgs.toCurrency,
            );
          } catch (error) {
            this.logger.error('Currency conversion failed:', error);
            functionResult = { error: 'Currency conversion failed. Please try again.' };
          }
        }
        // Step 4: Second call to LLM with function result
        const secondResponse = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful shopping assistant. Provide a friendly and informative response based on the function results.

              IMPORTANT INSTRUCTIONS:
              - If multiple products are found, you MUST show ALL of them to the user
              - Include details for each product: title, original price, converted price (if applicable), and URL
              - Format the response clearly with each product as a separate item
              - Use bullet points or numbered lists when showing multiple products
              - Always be thorough and show complete information when asking about a product; otherwise, only perform currency conversions.
              
              `,
            },
            {
              role: 'user',
              content: userQuery,
            },
            {
              role: 'assistant',
              content: null,
              function_call: message.function_call,
            },
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResult),
            },
          ],
        });

        const finalResponse = secondResponse.choices[0].message.content ?? 'I apologize, but I couldn\'t process your request. Please try rephrasing your question.';
        this.logger.log(`Generated final response for user query`);
        return finalResponse;
      } else {
        // No function call needed, return direct response
        return message.content || 'I apologize, but I couldn\'t process your request. Please try rephrasing your question.';
      }
    } catch (error) {
      this.logger.error('Error processing query:', error);
      return 'I apologize, but I encountered an error while processing your request. Please try again later.';
    }
  }
}