import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({
    description: 'User query for the chatbot',
    example: 'I am looking for a phone',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}