# Chatbot API

An intelligent chatbot API built with NestJS that provides product search and currency conversion functionalities using OpenAI GPT-3.5-turbo.

## Features

- Product search from a CSV file (`searchProducts`)
- Currency conversion using Open Exchange Rates (`convertCurrencies`)
- OpenAI Chat Completion API with Function Calling
- Swagger API documentation

## Technologies Used

- **Framework**: NestJS
- **Language**: TypeScript
- **AI**: OpenAI GPT-3.5-turbo
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **CSV Processing**: PapaParse
- **HTTP Client**: Axios

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **OpenAI Account** with API key
- **Open Exchange Rates Account** with API key


## Installation and Setup

### 1. Clone the repository

   ```bash
   git clone https://github.com/winandtu/api-chatbot.git
   cd chatbot-api
   ```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

#### Create environment file

 - Copy `.env-example` to `.env`:

      ```bash
     cp .env_example .env
     ```

#### Configure your credentials

Edit the `.env` file and add your API credentials:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENEXCHANGERATES_API_KEY=your_openexchangerates_api_key_here
PORT=3000
```

#### How to obtain API Keys:

**OpenAI API Key:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the key and paste it in your `.env` file

**Open Exchange Rates API Key:**
1. Go to [https://openexchangerates.org/signup/free](https://openexchangerates.org/signup/free)
2. Sign up for a free account
3. Get your App ID from the dashboard
4. Copy the App ID and paste it in your `.env` file

### 4. Run the application

Start the server:

```bash
npm run start
```

The application will be available at `http://localhost:3000`

## API Documentation

### Interactive Swagger Documentation

Once the application is running, you can access the interactive Swagger documentation at:

```
http://localhost:3000/api
```

### Available Endpoints

#### POST /chatbot/chat

Send a message to the chatbot and receive an intelligent response.

**URL**: `http://localhost:3000/chatbot/chat`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "Your message here"
}
```

**Response**:
```json
{
  "response": "Chatbot response"
}
```

## Usage Examples

### 1. Product Search

```bash
curl -X POST http://localhost:3000/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I am looking for a phone"
  }'
```

### 2. Product Search with Currency Conversion

```bash
curl -X POST http://localhost:3000/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the price of the watch in Euros?"
  }'
```

### 3. Direct Currency Conversion

```bash
curl -X POST http://localhost:3000/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How many Canadian Dollars are 350 Euros"
  }'
```


## Chatbot Capabilities

### 1. Smart Product Search

- Searches through product catalog from CSV file
- Relevance-based scoring algorithm
- Gender-specific filtering (male/female products)
- Returns the 2 most relevant products
- Supports queries like "gift for dad", "present for mom"

### 2. Real-time Currency Conversion

- Live exchange rates using Open Exchange Rates API
- Support for multiple currencies (USD, EUR, GBP, CAD, etc.)
- Automatic integration with product searches
- Handles queries like "price in euros", "cost in CAD"

### 3. Natural Language Processing

- Understands complex queries
- Automatically combines search and conversion
- Context-aware responses
- Handles multiple request types in one query

## Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── products_list.csv          # Product catalog
├── chatbot/                   # Chatbot module
│   ├── chatbot.controller.ts  # REST controller
│   ├── chatbot.service.ts     # Chatbot business logic
│   ├── chatbot.module.ts      # Chatbot module
│   └── dto/                   # Data Transfer Objects
│       ├── chat.dto.ts        # Chat request DTO
│       └── chatResponse.dto.ts # Chat response DTO
├── tools/                     # Tools module
│   ├── tools.service.ts       # Search and conversion logic
│   ├── tools.module.ts        # Tools module
│   └── interfaces/            # TypeScript interfaces
│       ├── product.interface.ts
│       └── currency.interface.ts
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start in development mode with hot reload
npm run start:debug        # Start in debug mode

# Production
npm run build              # Build the project
npm run start:prod         # Start in production mode

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## Troubleshooting

### Error: "OpenAI API key not configured"
- Verify that the `.env` file exists and contains `OPENAI_API_KEY`
- Make sure the API key is valid and has sufficient credits
- Check that there are no extra spaces or quotes around the key

### Error: "Open Exchange Rates API key not configured"
- Verify that the `.env` file contains `OPENEXCHANGERATES_API_KEY`
- Confirm your Open Exchange Rates account is active
- Check the API key format (should be alphanumeric)

### Error: "Cannot read file products_list.csv"
- Verify that `src/products_list.csv` exists
- Make sure the CSV format is correct
- Check file permissions

### Application not starting on specified port
- Make sure the port is not in use by another application
- Try changing the `PORT` variable in `.env`
- Check firewall settings

### Invalid API responses
- Check API service status
- Ensure API keys have proper permissions



### Basic Health Check

```bash
curl http://localhost:3000
```

Expected response: `Hello World!`

### Test Chatbot Endpoint

```bash
curl -X POST http://localhost:3000/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Hello"}'
```

### Validate Swagger Documentation

Visit `http://localhost:3000/api` to ensure Swagger is properly configured.

## Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start:prod
```

### Environment Variables for Production

Make sure to set the following environment variables in your production environment:
- `OPENAI_API_KEY`
- `OPENEXCHANGERATES_API_KEY`
- `PORT` (optional, defaults to 3000)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
