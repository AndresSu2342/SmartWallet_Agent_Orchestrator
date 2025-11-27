import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './memory/redis.service';
import { DynamoService } from './memory/dynamodb.service';
import { SqsService } from './services/sqs.service';
import { LangGraphService } from './services/langgraph.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Variables de entorno accesibles globalmente
    }),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    RedisService,
    DynamoService,
    SqsService,
    LangGraphService,
  ],
})
export class AppModule {}
