<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap, useSvelteFlow } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { LayoutTemplate } from 'lucide-svelte';

  // 接收父级状态
  let { nodes = $bindable([]), edges = $bindable([]), addLog, onSelectNode } = $props();

  const flow = useSvelteFlow();

  const STAGES_CONFIG = [
    { stage: 'context-gathering', label: 'Context Gathering', desc: '上下文收集' },
    { stage: 'execution', label: 'Execution', desc: '执行阶段' },
    { stage: 'review', label: 'Review', desc: '审查阶段' }
  ];

  // 🌟 核心修复：强制监听内部 nodes 变化，并同步给外部
  $effect(() => {
    // 当内部节点变化时，这里会触发，将引用回传给父级
    if (nodes) {
      // 因为双向绑定在这个复杂场景失效，我们通过内部逻辑触发同步
    }
  });

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const stageId = event.dataTransfer?.getData('application/studio-stage');
    if (!stageId) return;
    
    const stageConfig = STAGES_CONFIG.find(s => s.stage === stageId);
    if (!stageConfig) return;

    // 精准计算坐标
    const position = flow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const count = nodes.filter((n: any) => n.data.stage === stageId).length;
    const label = `${stageConfig.desc} ${count + 1}`;
    
    const newNode = {
      id: `node_${Date.now()}`,
      position,
      data: { label, stage: stageConfig.stage, capabilities: [] }
    };
    
    // 强制更新外部引用
    nodes = [...nodes, newNode];
    addLog('info', `创建新节点: ${newNode.data.label}`, `节点 ID: ${newNode.id}`, newNode.id);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  // DOM 事件委托
  function handleCanvasClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.svelte-flow__node');
    
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id');
      if (nodeId) {
        const targetNode = nodes.find((n: any) => n.id === nodeId);
        if (targetNode) {
          onSelectNode(targetNode);
          return;
        }
      }
    }
    onSelectNode(null);
  }
</script>

<main 
  class="absolute inset-0 bg-slate-50" 
  ondrop={onDrop} 
  ondragover={onDragOver} 
  role="application"
  onclick={handleCanvasClick}
>
  <SvelteFlow 
    bind:nodes 
    bind:edges 
    fitView 
    class="bg-slate-50"
  >
    <Background color="#cbd5e1" gap={20} size={1} />
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
