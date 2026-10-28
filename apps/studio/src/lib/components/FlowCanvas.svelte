<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap, useSvelteFlow, type NodeTypes } from '@xyflow/svelte';
  import type { Node as XYNode } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { LayoutTemplate } from 'lucide-svelte';
  import type { FlowNode, FlowEdge, AddLogFn } from '#lib/types';
  import StatusNode from './StatusNode.svelte';

  let {
    nodes = $bindable<FlowNode[]>([]),
    edges = $bindable<FlowEdge[]>([]),
    addLog,
    onSelectNode,
    registerZoomGetter
  }: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    addLog: AddLogFn;
    onSelectNode: (node: FlowNode | null) => void;
    registerZoomGetter?: (fn: () => number) => void;
  } = $props();

  const flow = useSvelteFlow();

  // 拖拽幽灵按画布缩放渲染：向页面注册缩放读取器（getViewport 可用则读取，否则回退 1）
  function currentZoom(): number {
    const f = flow as unknown as { getViewport?: () => { zoom: number } };
    const vp = f.getViewport?.();
    return vp ? vp.zoom : 1;
  }
  registerZoomGetter?.(currentZoom);

  // 注册自定义节点类型
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

    const cursor = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    let position = cursor;
    const ghostRaw = event.dataTransfer?.getData('application/studio-ghost');
    if (ghostRaw) {
      try {
        const g = JSON.parse(ghostRaw) as { w: number; h: number; zoom: number };
        const z = g.zoom || 1;
        // 幽灵居中于光标 → 节点同规格居中落点（w/h 为屏幕像素，除以 zoom 得画布单位半径）
        position = { x: cursor.x - g.w / z / 2, y: cursor.y - g.h / z / 2 };
      } catch {
        // 幽灵信息不可用：回退光标落点
      }
    }
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
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  /**
   * 选中态同步：鼠标点击、框选、键盘 Enter 选中最终都收敛到 xyflow 的
   * 选中状态，由 onselectionchange 派生到外层检查器面板。
   * 以库的状态机为单一事实源，不在组件里用 DOM 查询二次模拟点击语义。
   */
  function handleSelectionChange({ nodes: selected }: { nodes: XYNode[] }) {
    const node = selected.length > 0 ? selected[selected.length - 1] : undefined;
    onSelectNode(node ? (node as FlowNode) : null);
  }
</script>

<!-- 画布容器只承担 drop zone 语义；节点导航与键盘操作由 SvelteFlow 原生
     无障碍能力承担（nodesFocusable 默认开启：Tab 循环节点、Enter 选中），
     不在非交互元素上挂鼠标/键盘事件。 -->
<div
  class="absolute top-0 bg-slate-50 transition-all duration-300 ease-in-out"
  style="left: var(--canvas-left, 0px); right: var(--canvas-right, 0px); bottom: var(--canvas-bottom, 2.75rem);"
  role="region"
  aria-label="工作流编排画布，从左侧拖入组件开始编排"
  ondrop={onDrop}
  ondragover={onDragOver}
>
  <SvelteFlow
    bind:nodes
    bind:edges
    {nodeTypes}
    fitView
    fitViewOptions={{ padding: 0.15, minZoom: 0.25, maxZoom: 1 }}
    minZoom={0.25}
    maxZoom={2}
    class="bg-slate-50"
    onselectionchange={handleSelectionChange}
    onnodeclick={({ node }) => onSelectNode(node as FlowNode)}
    onedgeclick={() => onSelectNode(null)}
  >
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
</div>