import { Injectable } from '@nestjs/common';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoService {
  private dynamo: DynamoDBClient;

  constructor(private config: ConfigService) {
    const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');

    this.dynamo = new DynamoDBClient({
      region,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  async storeSemantic(userId: string, pattern: any): Promise<any> {
    const params = {
      TableName: this.config.get('DYNAMODB_TABLE'),
      Item: {
        user_id: { S: userId },
        pattern_type: { S: 'spending' },
        data: { S: JSON.stringify(pattern) },
      },
    };
    return this.dynamo.send(new PutItemCommand(params));
  }

  async getSemantic(userId: string): Promise<any> {
    const params = {
      TableName: this.config.get('DYNAMODB_TABLE'),
      Key: { user_id: { S: userId } },
    };
    const result = await this.dynamo.send(new GetItemCommand(params));
    return result.Item && result.Item.data?.S
      ? JSON.parse(result.Item.data.S)
      : null;
  }
}
