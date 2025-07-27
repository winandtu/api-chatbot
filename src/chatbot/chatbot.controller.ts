import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatDto } from './dto/chat.dto';
import { ChatResponseDto } from './dto/chatResponse.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message to the chatbot',
    description: 'Process user query and return chatbot response with access to product search and currency conversion tools',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful chatbot response',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request format',
  })
  async chat(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
    const response = await this.chatbotService.processQuery(chatDto.query);
    return { response };
  }
}