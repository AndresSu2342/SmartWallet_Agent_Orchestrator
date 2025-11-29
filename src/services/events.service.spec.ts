import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PostgresEpisodicService } from '../memory/postgres-episodic.service';
import { PostgresSemanticService } from '../memory/postgres-semantic.service';
import { TransactionsDbService } from '../memory/transactions-db.service';
import { GoalsDbService } from '../memory/goals-db.service';
import { SqsService } from './sqs.service';
import { LangGraphService } from './langgraph.service';

describe('EventsService', () => {
  let service: EventsService;
  let sqsService: SqsService;
  let langGraphService: LangGraphService;
  let postgresEpisodicServiceMock: any;
  let postgresSemanticServiceMock: any;
  let transactionsDbServiceMock: any;
  let goalsDbServiceMock: any;

  beforeEach(async () => {
    postgresEpisodicServiceMock = {
      getEpisodic: jest.fn().mockResolvedValue([]),
      storeEpisodic: jest.fn().mockResolvedValue({ id: 1 }),
    };
    postgresSemanticServiceMock = {
      getSemantic: jest.fn().mockResolvedValue({}),
    };
    transactionsDbServiceMock = {
      getRecentTransactions: jest.fn().mockResolvedValue([]),
      getCategories: jest.fn().mockResolvedValue([]),
    };
    goalsDbServiceMock = {
      getGoalsByUser: jest.fn().mockResolvedValue([]),
      getBudgetsByUser: jest.fn().mockResolvedValue([]),
    };
    sqsService = {
      sendToQueue: jest.fn().mockResolvedValue({}),
    } as any;
    langGraphService = {
      decideFlow: jest.fn().mockResolvedValue({
        agent: 'financial-insight',
        queueUrl: 'http://test-queue',
        data: {},
        id: 'test-123',
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PostgresEpisodicService,
          useValue: postgresEpisodicServiceMock,
        },
        {
          provide: PostgresSemanticService,
          useValue: postgresSemanticServiceMock,
        },
        {
          provide: TransactionsDbService,
          useValue: transactionsDbServiceMock,
        },
        {
          provide: GoalsDbService,
          useValue: goalsDbServiceMock,
        },
        {
          provide: SqsService,
          useValue: sqsService,
        },
        {
          provide: LangGraphService,
          useValue: langGraphService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
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
        transactions: [],
        goals: [],
      }),
    );
  });

  it('should query all PostgreSQL services before deciding', async () => {
    await service.processEvent({
      userId: 'user789',
      type: 'NEW_TRANSACTION',
      data: {},
    });

    expect(postgresEpisodicServiceMock.getEpisodic).toHaveBeenCalledWith(
      'user789',
    );
    expect(postgresSemanticServiceMock.getSemantic).toHaveBeenCalledWith(
      'user789',
    );
    expect(
      transactionsDbServiceMock.getRecentTransactions,
    ).toHaveBeenCalledWith('user789', 20);
    expect(goalsDbServiceMock.getGoalsByUser).toHaveBeenCalledWith('user789');
  });
});
