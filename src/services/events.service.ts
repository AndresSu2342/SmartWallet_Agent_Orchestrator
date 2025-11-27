import { Injectable } from '@nestjs/common';
import { RedisService } from '../memory/redis.service';
import { DynamoService } from '../memory/dynamodb.service';
import { SqsService } from '../services/sqs.service';
import { LangGraphService } from '../services/langgraph.service';

@Injectable()
export class EventsService {
  constructor(
    private redisService: RedisService,
    private dynamoService: DynamoService,
    private sqsService: SqsService,
    private langGraphService: LangGraphService,
  ) {}

  async processEvent(event: any) {
    const userId = event.userId;
    // Paso 1: Consulta memoria
    const episodic = (await this.redisService.getEpisodic(userId)) || [];
    const semantic = (await this.dynamoService.getSemantic(userId)) || {};

    const context = { episodic, semantic };

    // Paso 2: Decidir con LangGraph
    const decision = await this.langGraphService.decideFlow(event, context); // { agent: 'financial', data: { ... } }

    // Paso 3: Publicar en SQS
    await this.sqsService.sendToQueue(decision);

    // Paso 4: Manejar callback (en worker separate, ver abajo)
    return { status: 'processed', correlationId: decision.id }; // Retorna ID para tracking
  }
}
