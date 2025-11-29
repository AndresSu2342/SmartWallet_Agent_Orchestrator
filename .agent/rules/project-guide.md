---
trigger: always_on
---

# Project Guide: Smart Wallet Orchestrator Agent

## 1. Contexto del Proyecto

### Resumen General
Smart Wallet es una billetera digital inteligente diseñada para empoderar a usuarios en Colombia, especialmente de bajos ingresos, en la gestión financiera personal. El proyecto aborda ineficiencias manuales como errores humanos, falta de insights en tiempo real, evaluaciones subjetivas de metas/presupuestos y ausencia de motivación. El objetivo es mejorar la viabilidad de metas, optimizar presupuestos, fomentar hábitos sostenibles y promover inclusión financiera. Alcance: análisis de transacciones, asesoramiento en metas, balanceo de presupuestos, coaching motivacional y coordinación general. Excluye riesgos altos como inversiones o préstamos sin integraciones externas.

El sistema es un ecosistema multiagente de IA, donde agentes autónomos colaboran para procesar datos y generar recomendaciones personalizadas. Clave: Incorpora memoria para recordar interacciones pasadas, evitando "empezar desde cero" cada vez—esto es crucial para razonamiento continuo en finanzas.

### Componentes Principales
- **CoreSystem (Ya Implementado - Java/Spring Boot):** Maneja transacciones básicas, APIs CRUD y persistencia. Envía eventos como "NEW_GOAL_CREATED" o "NEW_TRANSACTION" al Orchestrator.
- **Frontend (Ya Implementado Básico - React Native):** App móvil para registro de transacciones/metas, visualización de balance/insights y notificaciones push. Usa polling para updates desde Orchestrator.
- **Agentes IA Especializados:**
  - **Financial Insight Agent:** Analiza ingresos/gastos, detecta anomalías y genera resúmenes (Node.js/LangChain).
  - **Goals Agent:** Evalúa viabilidad de metas, sugiere tiempos/montos (Python/CrewAI).
  - **Budget Balancer Agent:** Ajusta/redistribuye presupuestos (Make.com low-code).
  - **Motivational Coach Agent:** Genera mensajes personalizados basados en progreso (Make.com low-code). Ejemplo JSON de input para análisis:
    ```json
    {
      "user_id": 123,
      "financial_overview": {
        "total_income_month": 2500000,
        "total_expense_month": 1870000,
        "savings_month": 630000,
        "savings_trend": "increasing",
        "top_spending_category": {
          "name": "Eating Out",
          "percentage_of_budget": 82
        }
      },
      "budgets": [
        {
          "category": "Transport",
          "limit": 200000,
          "spent": 150000,
          "status": "good"
        },
        {
          "category": "Entertainment",
          "limit": 300000,
          "spent": 280000,
          "status": "warning"
        }
      ],
      "goals": [
        {
          "name": "Viaje Cartagena",
          "progress": 0.35,
          "target": 1200000,
          "saved": 420000,
          "due_date": "2025-06-20",
          "status": "ACTIVE",
          "time_risk": "medium"
        }
      ],
      "recent_behavior": {
        "weekly_savings": 45000,
        "expense_spike_category": "Snacks",
        "expense_spike_detected": true,
        "habit_patterns": ["daily small expenses", "weekend spending higher"]
      }
    }
    ```
- **Orchestrator Agent (Tu Tarea):** Hub central que recibe eventos de CoreSystem, consulta memoria, decide flujos con LangGraph, publica mensajes asíncronos a SQS dedicados por agente, y maneja respuestas para updates en frontend/memoria. Único manejador de memorias, actualizando tablas dedicadas por agente para trazabilidad.
- **Memoria (Crítica para Orchestrator - Desplegada en Railway con PostgreSQL Relacional):**
  - **Semántica:** Almacena información general/estable (e.g., perfiles financieros, patrones de gasto, preferencias motivacionales). Usa tabla única "semantic_profiles" para conocimiento consolidado transversal a agentes.
  - **Episódica:** Registra interacciones específicas por agente en tablas dedicadas (e.g., "episodic_memory_motivational" para mensajes generados). Orchestrator maneja todo: consulta antes de decidir, actualiza post-proceso para trazabilidad (e.g., qué agente hizo qué, con qué datos).
  - Propósito: Coherencia (evita contradicciones), continuidad (evoluciona perfiles), trazabilidad (auditoría por agente). Estructura relacional asegura integridad y queries eficientes.

### Arquitectura General
- **Flujo Típico:** Usuario registra transacción en app → CoreSystem envía evento via webhook/API → Orchestrator consulta memoria, orquesta agentes via SQS dedicados (uno por agente para escalabilidad/desacople), agentes procesan y responden → Orchestrator actualiza memoria (tablas por agente) y notifica frontend.
- **Infraestructura:** Todo en contenedores Docker, desplegado en AWS ECS con auto-scaling. Comunicación asíncrona (SQS por agente para evitar bloqueos), datos (PostgreSQL en Railway para memorias), seguridad (IAM), monitoreo (CloudWatch).
- **Beneficios:** Resiliencia (reintentos SQS, no bloqueo si agente falla), escalabilidad (ECS + queues independientes), bajo costo (serverless-like).

## 2. Reglas y Guidelines para el Desarrollo del Orchestrator
### Reglas Generales
- **Tecnologías Obligatorias:** Node.js LTS con NestJS (estructura modular), LangGraph (para máquinas de estado/orquestación flujos), AWS SDK (para SQS directo), pg (para PostgreSQL en Railway), ioredis si Redis auxiliar (pero focus en Postgres relacional). SQS: Uno por agente (e.g., "goals-queue", "financial-queue") para escalabilidad y desacople. Memoria: PostgreSQL relacional en Railway (semántica en tabla única, episódica en tablas por agente). Logs: Winston estructurados con correlación ID.
- **Flujo Principal:**
  - Recibir eventos (POST /events de CoreSystem: JSON con user_id, type e.g., "NEW_TRANSACTION", data).
  - Consultar memoria: Fetch semántica (Postgres: perfiles generales) y episódica (tablas por agente para eventos relevantes).
  - Decidir con LangGraph: Graph simple (nodos: "analyze", "goals", etc.; edges basados en evento/context).
  - Publicar en SQS dedicado: Mensajes JSON a queue por agente (e.g., { "task": "analyze", "data": event + context } a "financial-queue").
  - Manejar callbacks: Poll SQS callback queue (común o por agente), procesa resultados, actualiza memoria (insert en tabla episódica correspondiente al agente).
- **Manejo Excepciones/Alertas:** Usa NestJS interceptors para errors (e.g., HTTP 500 con log). Para SQS: Reintentos automáticos (config en queue). Alertas: Si DLQ recibe mensajes, trigger CloudWatch alarm (configura después). Maneja bloqueos: Queues independientes evitan impacto cruzado.
- **Seguridad:** Usa AWS IAM para accesos (least privilege). En código: Valida inputs (e.g., user_id), encripta PII si necesario. Para Postgres: Usa credenciales seguras de Railway en env.
- **Memoria Rules:** Orchestrator maneja todo: Consulta antes de decidir (evita repeticiones). Almacena post-proceso en tablas dedicadas por agente para trazabilidad (e.g., insert en "episodic_memory_goals" con event_type, message, context). Semántica: Actualiza tabla única "semantic_profiles" con perfiles consolidados.
- **Tests:** 80% coverage con Jest (unit para services, e2e para flujos). Mock AWS SDK para local.
- **Despliegue:** Todo en Docker (Dockerfile con multi-stage build). ECS Task Definition con env vars de Secrets Manager.
- **Best Practices:** Código modular (services por función: sqs.service, postgres.service, langgraph.service). Env vars para configs (no hardcode). Logs con correlación ID para trazabilidad.
### Reglas Específicas para IA/Orquestación
- LangGraph: Usa para flujos condicionales (e.g., if anomalía detectada, invoca Motivational). Prompts básicos: "Dado [context], decide siguiente agente para [event]".
- No deep IA: Si no estás familiarizado, empieza con graphs sin LLM (lógica if-else); agrega OpenAI después para reasoning avanzado.
- Escalabilidad: Diseña para concurrency (Nest maneja async nativo). Queues por agente evitan bottlenecks.

## 3. Pasos Iniciales para Empezar
1. **Setup AWS (Si no hecho):** Crea SQS queues por agente ("financial-queue", "goals-queue", "budget-queue", "motivational-queue"), más "callback-queue" común. Configura IAM role para ECS.
2. **Proyecto Local:** Nest new, agrega deps (ver guía anterior). Docker Compose con Postgres si local (aunque deployed en Railway).
3. **Desarrolla Services:** Primero Postgres service para memorias (usa @nestjs/typeorm o Prisma para ORM relacional).
4. **Implementa Core Logic:** Controller para events, LangGraph para decisión, publish SQS por agente.
5. **Tests & Debug:** Run local, simula eventos con Postman.
6. **Dockeriza & ECS:** Dockerfile, push a ECR, crea ECS Service.

## 4. Recursos y Referencias
- Docs: NestJS (nestjs.com/docs), LangGraph (langchain.com/docs/langgraph), AWS SDK Node (docs.aws.amazon.com/sdk-for-javascript), TypeORM/Prisma para Postgres.
- Tutorials: "NestJS with AWS SQS" en Medium, LangGraph basics en LangChain docs, "NestJS PostgreSQL Railway" en blogs.
- Código Ejemplos: Repos como nestjs-aws-sqs en GitHub.
- Herramientas: VS Code con extensions NestJS/AWS Toolkit/PostgreSQL, Postman para APIs.
Sigue estas reglas para consistencia con docs proyecto. ¡Actualiza este guide con avances!