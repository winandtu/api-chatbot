import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty({
    description: 'Chatbot response to the user query',
    example: 'I found some phones for you...',
  })
  response: string;
}