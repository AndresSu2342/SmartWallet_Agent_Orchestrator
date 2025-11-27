import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { RedisService } from '../memory/redis.service';
import { DynamoService } from '../memory/dynamodb.service';
import { SqsService } from './sqs.service';
import { LangGraphService } from './langgraph.service';

describe('EventsService', () => {
  let service: EventsService;
  let sqsService: SqsService;
  let langGraphService: LangGraphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: RedisService,
          useValue: {
            getEpisodic: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: DynamoService,
          useValue: {
            getSemantic: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: SqsService,
          useValue: {
            sendToQueue: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: LangGraphService,
          useValue: {
            decideFlow: jest.fn().mockResolvedValue({
              agent: 'financial-insight',
              queueUrl: 'http://test-queue',
              data: {},
              id: 'test-123',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    sqsService = module.get<SqsService>(SqsService);
    langGraphService = module.get<LangGraphService>(LangGraphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process NEW_TRANSACTION event', async () => {
    const event = {
      userId: 'user123',
      type: 'NEW_TRANSACTION',
      data: { amount: 50000, category: 'food' },
    };

    const result = await service.processEvent(event);

    expect(result.status).toBe('processed');
    expect(result.correlationId).toBe('test-123');
    expect(sqsService.sendToQueue).toHaveBeenCalled();
  });

  it('should route NEW_GOAL_CREATED to goals agent', async () => {
    const event = {
      userId: 'user456',
      type: 'NEW_GOAL_CREATED',
      data: { goalId: 'goal001', name: 'Comprar moto' },
    };

    await service.processEvent(event);

    expect(langGraphService.decideFlow).toHaveBeenCalledWith(
      event,
      expect.objectContaining({
        episodic: [],
        semantic: {},
      }),
    );
  });

  it('should query memory before deciding', async () => {
    const redisService = {
      getEpisodic: jest.fn().mockResolvedValue(['event1', 'event2']),
    };
    const dynamoService = {
      getSemantic: jest.fn().mockResolvedValue({ pattern: 'spending' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: RedisService, useValue: redisService },
        { provide: DynamoService, useValue: dynamoService },
        {
          provide: SqsService,
          useValue: { sendToQueue: jest.fn() },
        },
        {
          provide: LangGraphService,
          useValue: {
            decideFlow: jest.fn().mockResolvedValue({
              agent: 'financial-insight',
              queueUrl: 'test',
              data: {},
              id: 'test-123',
            }),
          },
        },
      ],
    }).compile();

    const testService = module.get<EventsService>(EventsService);

    await testService.processEvent({
      userId: 'user789',
      type: 'NEW_TRANSACTION',
      data: {},
    });

    expect(redisService.getEpisodic).toHaveBeenCalledWith('user789');
    expect(dynamoService.getSemantic).toHaveBeenCalledWith('user789');
  });
});
