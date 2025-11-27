import { Controller, Post, Body } from '@nestjs/common';
import { EventsService } from '../services/events.service'; // Crea este service para lógica

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  async handleEvent(@Body() event: any) {
    return this.eventsService.processEvent(event); // Delega a service
  }
}
