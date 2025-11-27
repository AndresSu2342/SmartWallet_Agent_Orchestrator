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

    console.log(
      `[EventsService] Processing event: ${event.type} for user ${userId}`,
    );

    // Paso 1: Consulta memoria
    const episodic = (await this.redisService.getEpisodic(userId)) || [];
    const semantic = (await this.dynamoService.getSemantic(userId)) || {};

    const context = { episodic, semantic };

    // Paso 2: Decidir con LangGraph
    const decision = await this.langGraphService.decideFlow(event, context);

    console.log(
      `[EventsService] Decision: agent=${decision.agent}, queueUrl=${decision.queueUrl}`,
    );

    // Paso 3: Publicar en SQS (pasar queueUrl como segundo parámetro)
    await this.sqsService.sendToQueue(decision.data, decision.queueUrl);

    // Paso 4: Manejar callback (en worker separate, ver abajo)
    return { status: 'processed', correlationId: decision.id };
  }
}
