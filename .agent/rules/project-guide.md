---
trigger: always_on
---

# Project Guide: Smart Wallet Orchestrator Agent

## 1. Contexto del Proyecto

### Resumen General
Smart Wallet es una billetera digital inteligente diseñada para empoderar a usuarios en Colombia, especialmente de bajos ingresos, en la gestión financiera personal. El proyecto aborda ineficiencias manuales como errores humanos, falta de insights en tiempo real, evaluaciones subjetivas de metas/presupuestos y ausencia de motivación. El objetivo es mejorar la viabilidad de metas, optimizar presupuestos, fomentar hábitos sostenibles y promover inclusión financiera. Alcance: análisis de transacciones, asesoramiento en metas, balanceo de presupuestos, coaching motivacional y coordinación general. Excluye riesgos altos como inversiones o préstamos sin integraciones externas.

El sistema es un ecosistema multiagente de IA, donde agentes autónomos colaboran para procesar datos y generar recomendaciones personalizadas. Clave: Incorpora memoria para recordar interacciones pasadas, evitando "empezar desde cero" cada vez—esto es crucial para razonamiento continuo en finanzas.

### Componentes Principales
- **CoreSystem (Ya Implementado - Java/Spring Boot):** Maneja transacciones básicas, APIs CRUD y persistencia (e.g., RDS). Envía eventos como "NEW_GOAL_CREATED" o "NEW_TRANSACTION" al Orchestrator.
- **Frontend (Ya Implementado Básico - React Native):** App móvil para registro de transacciones/metas, visualización de balance/insights y notificaciones push. Usa polling para updates desde Orchestrator.
- **Agentes IA Especializados:**
  - **Financial Insight Agent:** Analiza ingresos/gastos, detecta anomalías y genera resúmenes (Node.js/LangChain).
  - **Goals Agent:** Evalúa viabilidad de metas, sugiere tiempos/montos (Python/CrewAI).
  - **Budget Balancer Agent:** Ajusta/redistribuye presupuestos (Make.com low-code).
  - **Motivational Coach Agent:** Genera mensajes personalizados basados en progreso (Make.com low-code).
- **Orchestrator Agent (Tu Tarea):** Hub central que recibe eventos de CoreSystem, consulta memoria, decide flujos con LangGraph, publica mensajes asíncronos a SQS para agentes, y maneja respuestas para updates en frontend/memoria.
- **Memoria (Crítica para Orchestrator):**
  - **Episódica:** Almacena eventos específicos (e.g., rechazos de sugerencias, transacciones pasadas) para trazabilidad inmediata. Usa Redis con TTL para expiración (evita sobrecarga).
  - **Semántica:** Generaliza patrones (e.g., "gastos altos en comida") para insights a largo plazo. Usa DynamoDB para persistencia estructurada.
  - Propósito: Permite personalización (e.g., "No repetir sugerencia rechazada"), evita errores repetidos y mejora recomendaciones.

### Arquitectura General
- **Flujo Típico:** Usuario registra transacción en app → CoreSystem envía evento via webhook/API → Orchestrator consulta memoria, orquesta agentes via SQS → Agentes procesan y responden → Orchestrator actualiza memoria y notifica frontend.
- **Infraestructura:** Todo en contenedores Docker, desplegado en AWS ECS con auto-scaling. Comunicación asíncrona (SQS), datos (DynamoDB/Redis), seguridad (IAM), monitoreo (CloudWatch).
- **Beneficios:** Resiliencia (reintentos SQS), escalabilidad (ECS), bajo costo (serverless-like).

## 2. Reglas y Guidelines para el Desarrollo del Orchestrator

### Reglas Generales
- **Tecnologías Obligatorias:** Node.js LTS con NestJS (estructura modular), LangGraph (para máquinas de estado/orquestación flujos), AWS SDK (para SQS/DynamoDB directo), ioredis (para Redis episódica). No uses BullMQ—directo a AWS SQS. Para memoria semántica: DynamoDB (no Mongo). Logs: Winston estructurados con correlación ID.
- **Flujo Principal:** 
  - Recibir eventos (POST /events de CoreSystem: JSON con user_id, type e.g., "NEW_TRANSACTION", data).
  - Consultar memoria: Fetch episódica (Redis: eventos recientes) y semántica (DynamoDB: patrones agregados).
  - Decidir con LangGraph: Graph simple (nodos: "analyze", "goals", etc.; edges basados en evento/context).
  - Publicar en SQS: Mensajes JSON a queue específica por agente (e.g., { "task": "analyze", "data": event + context }).
  - Manejar callbacks: Poll SQS callback queue, procesa resultados, actualiza memoria, envía update a frontend (e.g., webhook o SNS).
- **Manejo Excepciones/Alertas:** Usa NestJS interceptors para errors (e.g., HTTP 500 con log). Para SQS: Reintentos automáticos (config en queue). Alertas: Si DLQ recibe mensajes, trigger CloudWatch alarm (configura después).
- **Seguridad:** Usa AWS IAM para accesos (least privilege). En código: Valida inputs (e.g., user_id), encripta PII si necesario.
- **Memoria Rules:** Siempre consulta antes de decidir (evita repeticiones). Almacena post-proceso (e.g., update semántica con nuevos patrones via ML simple).
- **Tests:** 80% coverage con Jest (unit para services, e2e para flujos). Mock AWS SDK para local.
- **Despliegue:** Todo en Docker (Dockerfile con multi-stage build). ECS Task Definition con env vars de Secrets Manager.
- **Best Practices:** Código modular (services por función: sqs.service, dynamo.service, redis.service, langgraph.service). Env vars para configs (no hardcode). Logs con correlación ID para trazabilidad.

### Reglas Específicas para IA/Orquestación
- LangGraph: Usa para flujos condicionales (e.g., if anomalía detectada, invoca Motivational). Prompts básicos: "Dado [context], decide siguiente agente para [event]".
- No deep IA: Si no estás familiarizado, empieza con graphs sin LLM (lógica if-else); agrega OpenAI después para reasoning avanzado.
- Escalabilidad: Diseña para concurrency (Nest maneja async nativo).

## 3. Pasos Iniciales para Empezar
1. **Setup AWS (Si no hecho):** Crea SQS queues ("agents-queue", "callback-queue"), DynamoDB table ("semantic-memory": partition "user_id"). Configura IAM role para ECS.
2. **Proyecto Local:** Nest new, agrega deps (ver guía anterior). Docker Compose con Redis.
3. **Desarrolla Services:** Primero Dynamo/SQS/Redis services (código ejemplos previos).
4. **Implementa Core Logic:** Controller para events, LangGraph para decisión, publish SQS.
5. **Tests & Debug:** Run local, simula eventos con Postman.
6. **Dockeriza & ECS:** Dockerfile, push a ECR, crea ECS Service.

## 4. Recursos y Referencias
- Docs: NestJS (nestjs.com/docs), LangGraph (langchain.com/docs/langgraph), AWS SDK Node (docs.aws.amazon.com/sdk-for-javascript).
- Tutorials: "NestJS with AWS SQS" en Medium, LangGraph basics en LangChain docs.
- Código Ejemplos: Repos como nestjs-aws-sqs en GitHub.
- Herramientas: VS Code con extensions NestJS/ AWS Toolkit, Postman para APIs.

Sigue estas reglas para consistencia con docs proyecto. ¡Actualiza este guide con avances!