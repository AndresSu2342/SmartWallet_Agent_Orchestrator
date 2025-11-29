import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { ConfigModule } from '@nestjs/config';
import { PostgresEpisodicService } from './memory/postgres-episodic.service';
import { PostgresSemanticService } from './memory/postgres-semantic.service';
import { TransactionsDbService } from './memory/transactions-db.service';
import { GoalsDbService } from './memory/goals-db.service';
import { SqsService } from './services/sqs.service';
import { LangGraphService } from './services/langgraph.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    PostgresEpisodicService,
    PostgresSemanticService,
    TransactionsDbService,
    GoalsDbService,
    SqsService,
    LangGraphService,
  ],
})
export class AppModule {}
