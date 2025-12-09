import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { CharacterService } from './characters.service';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  findAll() {
    return this.characterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.characterService.findOne(id);
  }
}