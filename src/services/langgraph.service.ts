import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LangGraphService {
  constructor(private config: ConfigService) {}

  async decideFlow(event: any, context: any): Promise<any> {
    let agent: string;
    let queueUrl: string;
    let finalData: any = {
      event,
      context,
      timestamp: new Date().toISOString(),
    };

    switch (event.type) {
      // --- Financial Insight Agent ---
      case 'NEW_TRANSACTION':
      case 'TRANSACTION_UPDATED':
      case 'ANOMALY_DETECTION_REQUEST':
      case 'FINANCIAL_SUMMARY_REQUEST':
        agent = 'financial-insight';
        queueUrl =
          this.config.get('SQS_FINANCIAL_INSIGHT_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/financial-insight-queue';
        break;

      // --- Goals Agent ---
      case 'NEW_GOAL_CREATED': // Could map to track or evaluate depending on intent, keeping default for now
      case 'GOAL_UPDATED':
      case 'GOAL_VIABILITY_CHECK':
      case 'GOAL_DISCOVERY_REQUEST':
      case 'GOAL_ADJUSTMENT_REQUEST':
      case 'GOAL_PROGRESS_UPDATE':
        agent = 'goals';
        queueUrl =
          this.config.get('SQS_GOALS_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/goals-queue';

        // Apply specific formatting for Goals Agent
        finalData = this.formatGoalsPayload(event, context);
        break;

      // --- Budget Balancer Agent ---
      case 'BUDGET_UPDATE_REQUEST':
      case 'BUDGET_REBALANCE':
      case 'SPENDING_LIMIT_EXCEEDED':
        agent = 'budget-balancer';
        queueUrl =
          this.config.get('SQS_BUDGET_BALANCER_QUEUE_URL') ||
          'https://sqs.us-east-1.amazonaws.com/default/budget-balancer-queue';
        break;

      // --- Motivational Coach Agent ---
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
      data: finalData,
      id: `${event.userId}-${Date.now()}`,
    };
  }

  private formatGoalsPayload(event: any, context: any): any {
    const { userId, type, data } = event;
    const { semantic, transactions, goals, episodic } = context;

    // Helper to extract financial context from semantic memory or calculate it
    // Assuming semantic.financial_summary contains these fields or we default them
    const financialContext = {
      monthly_income: semantic?.financial_summary?.monthly_income || 0,
      excedente_mensual: semantic?.financial_summary?.excedente_mensual || 0,
      fixed_expenses_monthly:
        semantic?.financial_summary?.fixed_expenses_monthly || 0,
    };

    switch (type) {
      case 'GOAL_DISCOVERY_REQUEST':
        return {
          action: 'discover_goals',
          user_id: userId,
          semantic_memory: {
            spending_patterns: semantic?.spending_patterns || {},
            motivation_profile: semantic?.motivation_profile || {},
          },
          financial_context: financialContext,
          transactions: transactions || [],
          existing_goals: goals || [],
          episodic_samples: episodic || [],
        };

      case 'GOAL_VIABILITY_CHECK':
        return {
          action: 'evaluate_goal',
          user_id: userId,
          proposed_goal: data?.proposed_goal || {}, // Expecting proposed_goal in event.data
          financial_context: financialContext,
          semantic_memory: {
            motivation_profile: semantic?.motivation_profile || {},
          },
          existing_goals: goals || [],
        };

      case 'GOAL_ADJUSTMENT_REQUEST':
        return {
          action: 'adjust_goals',
          user_id: userId,
          excedente_mensual: financialContext.excedente_mensual, // Or from data if provided override
          goals: goals || [],
          semantic_memory: {
            motivation_profile: semantic?.motivation_profile || {},
          },
          episodic_samples: episodic || [],
        };

      case 'GOAL_PROGRESS_UPDATE':
        return {
          action: 'track_goal',
          user_id: userId,
          goal_id: data?.goalId,
          goal:
            goals?.find((g: any) => g.id === data?.goalId) || data?.goal || {},
          financial_context: financialContext,
          recent_transactions: transactions || [], // Should filter by relevance if possible
          episodic_samples: episodic || [],
        };

      default:
        // Default fallback if event type doesn't match specific actions
        return {
          action: 'unknown_goal_action',
          user_id: userId,
          event_type: type,
          data,
          context,
        };
    }
  }
}
