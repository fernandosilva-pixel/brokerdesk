# BrokerDesk

Painel interno de suporte para controle de demandas de múltiplos brokers via WhatsApp.

## Requisitos

- Node.js 16+
- npm ou yarn

## Instalação

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## Estrutura do projeto

```
src/
├── App.tsx                  # Componente raiz, estado global
├── index.tsx                # Entry point React
├── index.css                # Estilos globais + CSS variables
├── types/
│   └── index.ts             # Tipos TypeScript (Demand, Broker, etc.)
├── data/
│   └── mockData.ts          # Dados mockados + constantes
└── components/
    ├── Header.tsx            # Cabeçalho com filtro de data e busca
    ├── KPIRow.tsx            # 8 KPIs no topo
    ├── FilterRow.tsx         # Filtros rápidos
    ├── BrokerGrid.tsx        # Grid de cards dos brokers
    ├── BrokerDrawer.tsx      # Drawer lateral com detalhes do broker
    ├── NewDemandModal.tsx    # Modal de criação de demanda
    ├── OperatorsModal.tsx    # Modal de visão por operador
    └── Toast.tsx             # Notificação de feedback
```

## Funcionalidades

- Dashboard com KPIs em tempo real
- Cards por broker com status visual (vermelho/amarelo/azul/verde)
- Filtros rápidos: Pendentes, Observação, Sem retorno, Críticas, Atrasadas, Follow-up hoje
- Modal de nova demanda com todos os campos
- Drawer de detalhes com abas: Demandas, Críticas, Follow-ups, Operador
- Detalhe da demanda: descrição, observações internas, checklist, histórico/timeline
- Mudança de status inline
- Visão consolidada por operador

## Próximos passos (v2)

- [ ] Integração com n8n para automações
- [ ] API WhatsApp para recebimento automático
- [ ] Alertas de SLA vencido
- [ ] Lembretes automáticos de follow-up
- [ ] Backend com banco de dados
- [ ] Autenticação por operador
