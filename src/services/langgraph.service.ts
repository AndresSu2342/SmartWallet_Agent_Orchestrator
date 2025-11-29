import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LangGraphService {
  constructor(private config: ConfigService) {}

  async decideFlow(event: any, context: any): Promise<any> {
    
    let agent: string;
    let queueUrl: string;

    
    switch (event.type) {
      
      case 'NEW_TRANSACTION':
      case 'TRANSACTION_UPDATED':
      case 'ANOMALY_DETECTION_REQUEST':
      case 'FINANCIAL_SUMMARY_REQUEST':
        agent = 'financial-insight';
        queueUrl =
          this.config.get('SQS_FINANCIAL_INSIGHT_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/financial-insight-queue';
        break;

      
      case 'NEW_GOAL_CREATED':
      case 'GOAL_UPDATED':
      case 'GOAL_VIABILITY_CHECK':
        agent = 'goals';
        queueUrl =
          this.config.get('SQS_GOALS_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/goals-queue';
        break;

      
      case 'BUDGET_UPDATE_REQUEST':
      case 'BUDGET_REBALANCE':
      case 'SPENDING_LIMIT_EXCEEDED':
        agent = 'budget-balancer';
        queueUrl =
          this.config.get('SQS_BUDGET_BALANCER_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/budget-balancer-queue';
        break;

      
      case 'GOAL_PROGRESS_UPDATE':
      case 'MILESTONE_REACHED':
      case 'MOTIVATION_REQUEST':
      case 'GOAL_REJECTED':
        agent = 'motivational-coach';
        queueUrl =
          this.config.get('SQS_MOTIVATIONAL_COACH_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/motivational-coach-queue';
        break;

      
      default:
        agent = 'financial-insight';
        queueUrl =
          this.config.get('SQS_FINANCIAL_INSIGHT_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/financial-insight-queue';
    }

    return {
      agent,
      queueUrl,
      data: {
        event,
        context,
        timestamp: new Date().toISOString(),
      },
      id: `${event.userId}-${Date.now()}`,
    };
  }
}
