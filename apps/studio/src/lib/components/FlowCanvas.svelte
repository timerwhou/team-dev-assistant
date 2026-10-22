<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap, useSvelteFlow, type NodeTypes } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { LayoutTemplate } from 'lucide-svelte';
  import type { FlowNode, FlowEdge, AddLogFn } from '#lib/types';
  import StatusNode from './StatusNode.svelte'; // 🌟 引入自定义节点

  let {
    nodes = $bindable<FlowNode[]>([]),
    edges = $bindable<FlowEdge[]>([]),
    addLog,
    onSelectNode
  }: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    addLog: AddLogFn;
    onSelectNode: (node: FlowNode | null) => void;
  } = $props();

  const flow = useSvelteFlow();

  // 🌟 核心修复：注册自定义节点类型
  const nodeTypes: NodeTypes = {
    status: StatusNode
  };

  const STAGES_CONFIG = [
    { stage: 'context-gathering', label: 'Context Gathering', desc: '上下文收集' },
    { stage: 'execution', label: 'Execution', desc: '执行阶段' },
    { stage: 'review', label: 'Review', desc: '审查阶段' }
  ];

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const stageId = event.dataTransfer?.getData('application/studio-stage');
    if (!stageId) return;
    const stageConfig = STAGES_CONFIG.find(s => s.stage === stageId);
    if (!stageConfig) return;

    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const count = nodes.filter(n => n.data.stage === stageId).length;
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: 'status',
      position,
      data: { label: `${stageConfig.desc} ${count + 1}`, stage: stageConfig.stage, capabilities: [], status: undefined }
    };
    nodes = [...nodes, newNode];
    addLog('info', `创建新节点: ${newNode.data.label}`, `节点 ID: ${newNode.id}`, newNode.id);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function handleCanvasClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.svelte-flow__node');
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      if (nodeId) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) { onSelectNode(targetNode); return; }
      }
    }
    onSelectNode(null);
  }
</script>

<main class="absolute inset-0 bg-slate-50" ondrop={onDrop} ondragover={onDragOver} role="application" tabindex="-1" onclick={handleCanvasClick}>
  <SvelteFlow bind:nodes bind:edges {nodeTypes} fitView class="bg-slate-50">
    <Background gap={20} size={1} />
    <Controls class="bg-white border-slate-200 shadow-sm rounded-md fill-slate-600" />
    <MiniMap class="bg-slate-100 border-slate-200 rounded-md" nodeColor="#94a3b8" />
  </SvelteFlow>
  {#if nodes.length === 0}
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center text-slate-400">
        <LayoutTemplate size={48} class="mx-auto mb-4 opacity-50" />
        <p class="text-sm font-medium">画布为空</p>
        <p class="text-xs mt-1">从左侧拖拽组件到此处开始编排</p>
      </div>
    </div>
  {/if}
</main>
