import { Injectable } from '@nestjs/common';
// import { StateGraph } from '@langchain/langgraph';
// TODO: Integrar StateGraph correctamente cuando se configure LangGraph

@Injectable()
export class LangGraphService {
  constructor() {
    // Por ahora usamos lógica simple sin StateGraph
    // TODO: Implementar graph completo con @langchain/langgraph
  }

  async decideFlow(event: any, context: any): Promise<any> {
    // Lógica de decisión basada en tipo de evento
    // Mapea eventos a los 4 agentes especializados
    let agent: string;
    let queueUrl: string;

    // Decisión basada en tipo de evento
    switch (event.type) {
      // Financial Insight Agent: Analiza ingresos/gastos, detecta anomalías
      case 'NEW_TRANSACTION':
      case 'TRANSACTION_UPDATED':
      case 'ANOMALY_DETECTION_REQUEST':
      case 'FINANCIAL_SUMMARY_REQUEST':
        agent = 'financial-insight';
        queueUrl =
          process.env.SQS_FINANCIAL_INSIGHT_QUEUE_URL ||
          'https://sqs.us-east-1.amazonaws.com/default/financial-insight-queue';
        break;

      // Goals Agent: Evalúa viabilidad de metas, sugiere tiempos/montos
      case 'NEW_GOAL_CREATED':
      case 'GOAL_UPDATED':
      case 'GOAL_VIABILITY_CHECK':
        agent = 'goals';
        queueUrl =
          process.env.SQS_GOALS_QUEUE_URL ||
          'https://sqs.us-east-1.amazonaws.com/default/goals-queue';
        break;

      // Budget Balancer Agent: Ajusta/redistribuye presupuestos
      case 'BUDGET_UPDATE_REQUEST':
      case 'BUDGET_REBALANCE':
      case 'SPENDING_LIMIT_EXCEEDED':
        agent = 'budget-balancer';
        queueUrl =
          process.env.SQS_BUDGET_BALANCER_QUEUE_URL ||
          'https://sqs.us-east-1.amazonaws.com/default/budget-balancer-queue';
        break;

      // Motivational Coach Agent: Genera mensajes personalizados
      case 'GOAL_PROGRESS_UPDATE':
      case 'MILESTONE_REACHED':
      case 'MOTIVATION_REQUEST':
      case 'GOAL_REJECTED':
        agent = 'motivational-coach';
        queueUrl =
          process.env.SQS_MOTIVATIONAL_COACH_QUEUE_URL ||
          'https://sqs.us-east-1.amazonaws.com/default/motivational-coach-queue';
        break;

      // Default: Financial Insight (más común)
      default:
        agent = 'financial-insight';
        queueUrl =
          process.env.SQS_FINANCIAL_INSIGHT_QUEUE_URL ||
          'https://sqs.us-east-1.amazonaws.com/default/financial-insight-queue';
    }

    // Retorna decisión con datos del evento y contexto
    return {
      agent,
      queueUrl,
      data: {
        event,
        context,
        timestamp: new Date().toISOString(),
      },
      id: `${event.userId}-${Date.now()}`, // Correlation ID
    };
  }
}
