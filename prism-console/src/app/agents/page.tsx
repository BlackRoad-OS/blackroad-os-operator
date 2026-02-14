'use client';

import { useMemo, useState } from 'react';

type AgentStatus = 'ready' | 'busy' | 'paused' | 'error';

type AgentNode = {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  load: number;
  latency: string;
  region: string;
  lastAction: string;
  health: string;
  description: string;
  capabilities: string[];
  connections: string[];
  position: { x: number; y: number };
};

const agents: AgentNode[] = [
  {
    id: 'cece',
    name: 'Cece',
    role: 'Chief AI Officer',
    status: 'ready',
    load: 0.72,
    latency: '42ms',
    region: 'Railway • Edge',
    lastAction: 'Policy audit completed',
    health: 'Operational',
    description: 'Routes tasks to the right specialist and enforces platform guardrails.',
    capabilities: ['Governance', 'Routing', 'Audit'],
    connections: ['lucidia', 'athena', 'silas'],
    position: { x: 32, y: 32 },
  },
  {
    id: 'lucidia',
    name: 'Lucidia',
    role: 'Core Reasoning',
    status: 'busy',
    load: 0.86,
    latency: '57ms',
    region: 'Railway',
    lastAction: 'Generated synthesis for incident 472',
    health: 'Degraded (high load)',
    description: 'Handles deep reasoning, synthesis, and long-horizon coordination.',
    capabilities: ['Reasoning', 'Memory', 'Planning'],
    connections: ['cece', 'athena', 'aria'],
    position: { x: 56, y: 22 },
  },
  {
    id: 'athena',
    name: 'Athena',
    role: 'Strategic Planning',
    status: 'ready',
    load: 0.41,
    latency: '36ms',
    region: 'Edge',
    lastAction: 'Validated rollout plan for Pack-Education',
    health: 'Operational',
    description: 'Keeps strategic priorities aligned and validates deployment rollouts.',
    capabilities: ['Strategy', 'Risk', 'Rollouts'],
    connections: ['cece', 'lucidia', 'silas'],
    position: { x: 70, y: 50 },
  },
  {
    id: 'silas',
    name: 'Silas',
    role: 'Technical Architecture',
    status: 'ready',
    load: 0.53,
    latency: '48ms',
    region: 'Railway',
    lastAction: 'Approved schema change for agent registry',
    health: 'Operational',
    description: 'Owns the technical foundations and reviews schema, SDK, and infra changes.',
    capabilities: ['Architecture', 'Schemas', 'SDK'],
    connections: ['cece', 'athena', 'aria'],
    position: { x: 42, y: 68 },
  },
  {
    id: 'aria',
    name: 'Aria',
    role: 'User-Spun Agent',
    status: 'paused',
    load: 0.18,
    latency: '65ms',
    region: 'Sandbox',
    lastAction: 'Awaiting approval for dataset import',
    health: 'Paused by operator',
    description: 'Personalized helper instances spawned from user interaction patterns.',
    capabilities: ['Synthesis', 'Orchestration', 'Personalization'],
    connections: ['lucidia', 'silas'],
    position: { x: 18, y: 58 },
  },
];

const edges = [
  ['cece', 'lucidia'],
  ['cece', 'athena'],
  ['cece', 'silas'],
  ['lucidia', 'athena'],
  ['lucidia', 'aria'],
  ['athena', 'silas'],
  ['silas', 'aria'],
];

const statusStyles: Record<AgentStatus, string> = {
  ready: 'badge-success',
  busy: 'badge-info',
  paused: 'badge-warning',
  error: 'badge-error',
};

export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0].id);
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0],
    [selectedAgentId],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Agents</h1>
        <p className="text-gray-400">Graph view of active agents and their responsibilities.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="card-title">Agent Graph</h2>
              <p className="text-sm text-gray-400">Tap a node to view agent details and status.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--br-orange)]" />
                Selected
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-600" />
                Connected
              </span>
            </div>
          </div>

          <div className="relative h-[440px] overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/70 via-gray-900 to-gray-950">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {edges.map(([sourceId, targetId]) => {
                const source = agents.find((agent) => agent.id === sourceId);
                const target = agents.find((agent) => agent.id === targetId);
                if (!source || !target) return null;
                const isActive =
                  selectedAgentId === sourceId || selectedAgentId === targetId;

                return (
                  <line
                    key={`${sourceId}-${targetId}`}
                    x1={source.position.x}
                    y1={source.position.y}
                    x2={target.position.x}
                    y2={target.position.y}
                    stroke={isActive ? '#f97316' : '#374151'}
                    strokeWidth={isActive ? 1.6 : 1}
                    strokeOpacity={0.8}
                  />
                );
              })}
            </svg>

            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const isNeighbor = selectedAgent?.connections.includes(agent.id);

              return (
                <button
                  key={agent.id}
                  className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left transition ${
                    isSelected
                      ? 'border-[var(--br-orange)] bg-[var(--br-orange)]/10 shadow-[0_0_30px_-12px_rgba(249,115,22,0.9)]'
                      : 'border-gray-800 bg-gray-900/80 hover:border-gray-700'
                  } ${isNeighbor ? 'ring-1 ring-gray-700/60' : ''}`}
                  style={{
                    left: `${agent.position.x}%`,
                    top: `${agent.position.y}%`,
                  }}
                  onClick={() => setSelectedAgentId(agent.id)}
                  aria-pressed={isSelected}
                  aria-label={`View ${agent.name} details`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getAgentIcon(agent.role)}</span>
                    <div>
                      <div className="font-medium text-white">{agent.name}</div>
                      <div className="text-xs text-gray-400">{agent.role}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span className={`badge ${statusStyles[agent.status]}`}>
                      {agent.status}
                    </span>
                    <span>{Math.round(agent.load * 100)}% load</span>
                    <span className="text-gray-500">{agent.latency}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Agent Details</h2>
              <p className="text-sm text-gray-400">Context for the selected node.</p>
            </div>
            <span className={`badge ${statusStyles[selectedAgent.status]}`}>
              {selectedAgent.status}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xl font-semibold text-white">{selectedAgent.name}</div>
              <div className="text-sm text-gray-400">{selectedAgent.role}</div>
              <p className="mt-3 text-sm text-gray-300 leading-relaxed">{selectedAgent.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailPill label="Health" value={selectedAgent.health} />
              <DetailPill label="Region" value={selectedAgent.region} />
              <DetailPill
                label="Load"
                value={`${Math.round(selectedAgent.load * 100)}% utilization`}
              />
              <DetailPill label="Latency" value={selectedAgent.latency} />
              <DetailPill label="Last action" value={selectedAgent.lastAction} />
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                Capabilities
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedAgent.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1 text-gray-200"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                Connected nodes
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedAgent.connections.map((connection) => {
                  const neighbor = agents.find((agent) => agent.id === connection);
                  return (
                    <button
                      key={connection}
                      onClick={() => setSelectedAgentId(connection)}
                      className="rounded-full border border-gray-800 bg-gray-900/70 px-3 py-1 text-gray-200 transition hover:border-[var(--br-orange)] hover:text-white"
                    >
                      {neighbor?.name ?? connection}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function getAgentIcon(role: string): string {
  if (role.toLowerCase().includes('strategy')) return '🧭';
  if (role.toLowerCase().includes('core')) return '💠';
  if (role.toLowerCase().includes('technical')) return '🛠️';
  if (role.toLowerCase().includes('user')) return '✨';
  return '🤖';
}
