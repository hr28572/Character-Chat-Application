import { Module } from '@nestjs/common';
import { AIService } from './openai.service';

@Module({
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}