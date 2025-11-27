import { Injectable } from '@nestjs/common';
import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoService {
  private dynamo: DynamoDBClient;

  constructor(private config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.config.get<string>('AWS_SESSION_TOKEN'); // Para credenciales temporales

    this.dynamo = new DynamoDBClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
              ...(sessionToken ? { sessionToken } : {}), // Agregar session token si existe
            },
          }
        : {}),
    });
  }

  async storeSemantic(userId: string, pattern: any): Promise<any> {
    const params = {
      TableName:
        this.config.get('DYNAMODB_TABLE') || 'smartwallet-semantic-memory',
      Item: {
        user_id: { S: userId }, // Partition key
        pattern_type: { S: pattern.type || 'spending_habits' }, // Sort key
        data: { S: JSON.stringify(pattern) },
        updated_at: { S: new Date().toISOString() },
      },
    };
    return this.dynamo.send(new PutItemCommand(params));
  }

  async getSemantic(userId: string): Promise<any> {
    // Usar Query en lugar de GetItem porque tenemos sort key
    const params = {
      TableName:
        this.config.get('DYNAMODB_TABLE') || 'smartwallet-semantic-memory',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
    };

    const result = await this.dynamo.send(new QueryCommand(params));

    // Combinar todos los patrones en un objeto
    if (result.Items && result.Items.length > 0) {
      const patterns: any = {};
      result.Items.forEach((item) => {
        const patternType = item.pattern_type?.S || 'unknown';
        const data = item.data?.S ? JSON.parse(item.data.S) : {};
        patterns[patternType] = data;
      });
      return patterns;
    }

    return null;
  }
}
