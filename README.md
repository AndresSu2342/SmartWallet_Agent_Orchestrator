# 🎯 Smart Wallet Orchestrator Agent

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

> **Orchestrator Agent** para Smart Wallet - Sistema de orquestación inteligente que coordina agentes especializados de IA para gestión financiera personal.

---

## 📋 Descripción

El **Orchestrator Agent** es el cerebro central del ecosistema Smart Wallet. Recibe eventos del CoreSystem, consulta memoria contextual (episódica y semántica), decide qué agente especializado debe procesar cada evento, y coordina la comunicación asíncrona mediante AWS SQS.

### 🎯 Responsabilidades

- ✅ Recibir eventos del CoreSystem (transacciones, metas, presupuestos)
- ✅ Consultar memoria dual (Redis + DynamoDB) para contexto del usuario
- ✅ Decidir flujo con LangGraph basado en tipo de evento
- ✅ Publicar mensajes a colas SQS específicas por agente
- ✅ Generar correlation IDs para trazabilidad end-to-end

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CoreSystem (Java)                        │
│              (Transacciones, Metas, Presupuestos)            │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /events
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Orchestrator Agent (NestJS)                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Redis    │  │   DynamoDB   │  │   LangGraph      │    │
│  │ (Episódica)│  │  (Semántica) │  │   (Decisión)     │    │
│  └────────────┘  └──────────────┘  └──────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Publish to SQS
         ┌─────────────┼─────────────┬─────────────┐
         ↓             ↓             ↓             ↓
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Financial   │ │  Goals   │ │  Budget  │ │ Motivational │
│  Insight    │ │  Agent   │ │ Balancer │ │    Coach     │
│   Agent     │ │ (Python) │ │ (Make)   │ │   (Make)     │
│ (Node.js)   │ │          │ │          │ │              │
└─────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

---

## 🚀 Inicio Rápido

### **Prerrequisitos**

- Node.js 20+ LTS
- Docker & Docker Compose
- AWS CLI (opcional, para AWS real)
- Cuenta AWS con SQS y DynamoDB (o usar LocalStack para testing local)

### **Instalación**

```bash
# Clonar repositorio
git clone <repo-url>
cd orchestrator

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales AWS (ver sección siguiente)

# Levantar Redis
docker-compose up -d

# Modo desarrollo (hot reload)
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

### **Configuración del `.env`**

Crea el archivo `.env` con tus credenciales AWS reales:

```bash
# AWS Configuration (Credenciales Temporales)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...  # Tu Access Key ID
AWS_SECRET_ACCESS_KEY=wJalr...  # Tu Secret Access Key
AWS_SESSION_TOKEN=IQoJb3JpZ2luX2VjE...  # Session Token (para credenciales temporales)

# SQS URLs - Usar los nombres EXACTOS de tus colas en AWS
# Formato: https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}
SQS_FINANCIAL_INSIGHT_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/905418183802/smartwallet-financial-insight-queue
SQS_GOALS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/905418183802/smartwallet-goals-queue
SQS_BUDGET_BALANCER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/905418183802/smartwallet-budget-balancer-queue
SQS_MOTIVATIONAL_COACH_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/905418183802/smartwallet-motivational-coach-queue

# DynamoDB Configuration
DYNAMODB_TABLE=smartwallet-semantic-memory

# Redis Configuration (Local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Esto se encuentra de igual forma en el archivo `.env.example` como ejemplo.

> **⚠️ Importante**: 
> - Las URLs de SQS deben coincidir **exactamente** con los nombres de tus colas en AWS Console
> - Si usas credenciales temporales de AWS (ej: AWS Academy), incluye `AWS_SESSION_TOKEN`
> - Verifica los nombres de las colas con: `aws sqs list-queues --region us-east-1`

---

## 📡 API Endpoints

### **POST /events**

Recibe eventos del CoreSystem y los procesa.

**Request:**
```json
{
  "userId": "user123",
  "type": "NEW_TRANSACTION",
  "data": {
    "transactionId": "txn001",
    "amount": 50000,
    "category": "food",
    "description": "Supermercado"
  }
}
```

**Response:**
```json
{
  "status": "processed",
  "correlationId": "user123-1732659600000"
}
```

---

## 🎯 Mapeo de Eventos a Agentes

| Tipo de Evento | Agente Destino | Cola SQS |
|----------------|----------------|----------|
| `NEW_TRANSACTION`, `TRANSACTION_UPDATED` | Financial Insight | `financial-insight-queue` |
| `NEW_GOAL_CREATED`, `GOAL_UPDATED` | Goals Agent | `goals-queue` |
| `BUDGET_UPDATE_REQUEST`, `SPENDING_LIMIT_EXCEEDED` | Budget Balancer | `budget-balancer-queue` |
| `MILESTONE_REACHED`, `GOAL_PROGRESS_UPDATE` | Motivational Coach | `motivational-coach-queue` |

---

## 🧪 Testing

### **Tests Unitarios**

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test:cov

# Tests en watch mode
npm run test:watch
```

### **Tests E2E**

```bash
npm run test:e2e
```

### **Testing Manual con Postman/curl**

```bash
# Ejemplo: Crear nueva meta
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "type": "NEW_GOAL_CREATED",
    "data": {
      "goalId": "goal001",
      "name": "Comprar moto",
      "targetAmount": 5000000
    }
  }'
```

Ver más ejemplos en [`test-events.sh`](./test-events.sh)

---

## 🗂️ Estructura del Proyecto

```
orchestrator/
├── src/
│   ├── controllers/
│   │   └── events.controller.ts      # Endpoint POST /events
│   ├── services/
│   │   ├── events.service.ts         # Lógica principal de orquestación
│   │   ├── sqs.service.ts            # Cliente AWS SQS
│   │   └── langgraph.service.ts      # Decisiones con LangGraph
│   ├── memory/
│   │   ├── redis.service.ts          # Memoria episódica (eventos recientes)
│   │   └── dynamodb.service.ts       # Memoria semántica (patrones)
│   ├── app.module.ts                 # Módulo principal
│   └── main.ts                       # Bootstrap
├── test/
│   └── *.spec.ts                     # Tests unitarios
├── docker-compose.yml                # Redis local
├── .env.example                      # Template de variables de entorno
└── package.json
```

---

## 🔧 Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| **Framework** | NestJS 11 | Arquitectura modular y escalable |
| **Lenguaje** | TypeScript 5 | Type safety y mejor DX |
| **Orquestación** | LangGraph | Decisión de flujos (futuro: con LLM) |
| **Mensajería** | AWS SQS | Comunicación asíncrona con agentes |
| **Memoria Episódica** | Redis | Eventos recientes (TTL 24h) |
| **Memoria Semántica** | DynamoDB | Patrones agregados (partition key: `user_id`, sort key: `pattern_type`) |
| **Config** | @nestjs/config | Variables de entorno |
| **Testing** | Jest | Tests unitarios y E2E |

---

## 🔐 Seguridad

- ✅ Credenciales AWS via variables de entorno (nunca en código)
- ✅ IAM roles con least privilege
- ✅ Validación de inputs en controllers
- ✅ `.env` en `.gitignore` (nunca commitear secretos)

---

## 📊 Monitoreo

### **Logs**

Los logs incluyen correlation ID para trazabilidad:

```
[EventsService] Processing event: NEW_TRANSACTION for user123
[LangGraphService] Decided agent: financial-insight
[SqsService] Message sent to queue: financial-insight-queue
```

### **Métricas AWS CloudWatch**

- `ApproximateNumberOfMessagesVisible` - Mensajes pendientes en SQS
- `NumberOfMessagesSent` - Mensajes enviados
- `ApproximateAgeOfOldestMessage` - Edad del mensaje más antiguo

---

## 🚢 Despliegue

### **Docker**

```bash
# Build imagen
docker build -t orchestrator:latest .

# Run container
docker run -p 3000:3000 --env-file .env orchestrator:latest
```

### **AWS ECS (Producción)**

1. Push imagen a ECR
2. Crear ECS Task Definition
3. Configurar Service con auto-scaling
4. Variables de entorno via AWS Secrets Manager

---

## 🐛 Troubleshooting

### **Error: "AWS.SimpleQueueService.NonExistentQueue"**

**Causa**: La URL de la cola SQS no coincide con el nombre real en AWS.

**Solución**:
```bash
# 1. Listar tus colas reales
aws sqs list-queues --region us-east-1

# 2. Copiar las URLs EXACTAS a tu .env
# Ejemplo de salida:
# "https://sqs.us-east-1.amazonaws.com/905418183802/smartwallet-goals-queue"

# 3. Verificar que .env tenga las URLs correctas
cat .env | grep SQS
```

### **Error: "UnrecognizedClientException: The security token included in the request is invalid"**

**Causa**: Credenciales AWS inválidas o expiradas.

**Solución**:
```bash
# 1. Verificar credenciales
aws sts get-caller-identity

# 2. Si usas AWS Academy, regenera credenciales:
#    - Ve a AWS Academy → AWS Details → AWS CLI
#    - Copia las 3 variables (ACCESS_KEY, SECRET_KEY, SESSION_TOKEN)
#    - Pégalas en tu .env

# 3. Asegúrate de incluir AWS_SESSION_TOKEN en .env
```

### **Error: "Cannot connect to Redis"**

**Solución**:
```bash
# Verificar que Redis esté corriendo
docker-compose ps

# Si no está corriendo, iniciarlo
docker-compose up -d redis
```

### **Logs de Debugging**

Para ver qué URL de SQS se está usando:
```bash
# Los logs mostrarán:
[EventsService] Processing event: NEW_GOAL_CREATED for user user456
[EventsService] Decision: agent=goals, queueUrl=https://sqs...
[SqsService] Sending to queue URL: https://sqs...
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📝 Roadmap

- [x] Endpoint `/events` con procesamiento básico
- [x] Integración con Redis (memoria episódica)
- [x] Integración con DynamoDB (memoria semántica)
- [x] Decisión de flujos con LangGraph
- [x] Publicación a SQS por agente
- [ ] Worker de callbacks para respuestas de agentes
- [ ] Logging estructurado con Winston
- [ ] Integración con LLM (OpenAI) para decisiones inteligentes
- [ ] Tests E2E completos
- [ ] CI/CD con GitHub Actions
- [ ] Despliegue automatizado a ECS

---

## 📄 Licencia

Este proyecto es parte del ecosistema Smart Wallet.

---

## 👥 Equipo

Desarrollado con ❤️ por el equipo de Smart Wallet

---

## 📚 Documentación Adicional

- [Guía de Testing](./docs/testing.md)
- [Mapeo de Eventos](./docs/event-mapping.md)
- [Arquitectura Completa](./docs/architecture.md)

---

**¿Preguntas?** Abre un issue en GitHub o contacta al equipo de desarrollo.
