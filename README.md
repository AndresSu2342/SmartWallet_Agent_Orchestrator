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
- ✅ Consultar memoria unificada en PostgreSQL (Episódica + Semántica + Transacciones + Metas)
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
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  PostgreSQL  │  │  PostgreSQL  │  │   LangGraph      │    │
│  │ (Episódica)  │  │  (Semántica) │  │   (Decisión)     │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
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
- AWS CLI (opcional, para AWS real)
- Cuenta AWS con SQS (o usar LocalStack para testing local)
- Bases de datos PostgreSQL (Railway)

### **Instalación**

```bash
# Clonar repositorio
git clone <repo-url>
cd orchestrator

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de AWS y PostgreSQL

# Modo desarrollo (hot reload)
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

### **Configuración del `.env`**

Crea el archivo `.env` con tus credenciales AWS y de PostgreSQL:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# SQS URLs
SQS_FINANCIAL_INSIGHT_QUEUE_URL=...

# PostgreSQL Configuration
EPISODIC_DB_HOST=...
SEMANTIC_DB_HOST=...
TRANSACTIONS_DB_HOST=...
GOALS_DB_HOST=...
```

---

## 🔧 Stack Tecnológico

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| **Framework** | NestJS 11 | Arquitectura modular y escalable |
| **Lenguaje** | TypeScript 5 | Type safety y mejor DX |
| **Orquestación** | LangGraph | Decisión de flujos (futuro: con LLM) |
| **Mensajería** | AWS SQS | Comunicación asíncrona con agentes |
| **Memoria Episódica** | PostgreSQL | Trazabilidad de acciones de agentes |
| **Memoria Semántica** | PostgreSQL | Contexto general del usuario |
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
- [x] Integración con PostgreSQL (memoria episódica)
- [x] Integración con PostgreSQL (memoria semántica)
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
