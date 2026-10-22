<script lang="ts">
  import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { Download, LayoutTemplate, Settings2, X, PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';
  import { Button } from '#lib/components/ui/button';
  import { Input } from '#lib/components/ui/input';
  import { Label } from '#lib/components/ui/label';
  import DebugPanel, { type LogEntry } from '#lib/components/DebugPanel.svelte';

  let nodes = $state.raw([
    { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: '上下文检索', stage: 'context-gathering' } },
    { id: '2', position: { x: 300, y: 200 }, data: { label: '执行任务', stage: 'execution' } },
    { id: '3', type: 'output', position: { x: 500, y: 100 }, data: { label: '代码审查', stage: 'review' } }
  ]);

  let edges = $state.raw([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' }
  ]);

  let selectedNode = $state<any>(null);
  let isSaving = $state(false);
  let isSidebarOpen = $state(true);
  let isConsoleOpen = $state(false);
  let logs = $state<LogEntry[]>([]);

  function addLog(type: 'info'|'error'|'warn', title: string, detail?: string, nodeId?: string) {
    const time = new Date().toLocaleTimeString();
    logs = [...logs, { id: crypto.randomUUID(), type, title, detail, nodeId, timestamp: time }];
    if (type === 'error') isConsoleOpen = true;
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const stage = event.dataTransfer?.getData('application/studio-stage');
    if (!stage) return;
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const newNode = {
      id: `node_${Date.now()}`,
      position: { x: event.clientX - bounds.left - 100, y: event.clientY - bounds.top - 20 },
      data: { 
        label: stage === 'context-gathering' ? '上下文检索' : stage === 'execution' ? '执行任务' : '代码审查', 
        stage 
      }
    };
    nodes = [...nodes, newNode];
    addLog('info', `创建新节点: ${newNode.data.label}`, `节点 ID: ${newNode.id}`, newNode.id);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  function onNodeClick(event: any) {
    selectedNode = event.detail.node;
  }

  function updateNodeData(key: string, value: string) {
    if (!selectedNode) return;
    nodes = nodes.map((n: any) => n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n);
    selectedNode = nodes.find((n: any) => n.id === selectedNode.id);
  }

  function focusNode(nodeId: string) {
    const node = nodes.find((n: any) => n.id === nodeId);
    if (node) selectedNode = node;
  }

  async function handleSave() {
    isSaving = true;
    addLog('info', '开始导出 WorkflowManifest');
    try {
      const stages = nodes.map((n: any) => n.data.stage).filter(Boolean);
      const stageCapabilities: Record<string, string[]> = {};
      for (const stage of stages) stageCapabilities[stage] = ["tool", "retriever"];

      const manifest = {
        name: "studio-workflow-" + Date.now(),
        description: "Studio 生成的工作流",
        stages: Array.from(new Set(stages)),
        stageCapabilities,
        governance: { maxIterations: 5, maxResultsPerTool: 3 }
      };

      const res = await fetch("http://127.0.0.1:3000/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(errBody, null, 2));
      }
      addLog('info', '✅ 工作流保存成功', JSON.stringify(manifest, null, 2));
    } catch (e: any) {
      let detail = e.message;
      if (e.message === 'Failed to fetch') {
        detail = '无法连接到后端 API (http://127.0.0.1:3000)。\n请确认后端已启动。';
      }
      addLog('error', '保存工作流失败', detail);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="flex w-screen h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
  
  <!-- 中间画布 (全屏铺满) -->
  <main class="absolute inset-0 bg-slate-50" ondrop={onDrop} ondragover={onDragOver} role="application">
    <SvelteFlow bind:nodes bind:edges fitView on:nodeclick={onNodeClick} class="bg-slate-50">
      <Background color="#cbd5e1" gap={20} size={1} />
      <Controls class="bg-white border-slate-200 shadow-sm rounded-md fill-slate-600" />
      <MiniMap class="bg-slate-100 border-slate-200 rounded-md" nodeColor="#94a3b8" />
    </SvelteFlow>
  </main>

  <!-- 左侧侧边栏 -->
  <aside 
    class="absolute top-0 left-0 h-full w-64 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex flex-col transition-transform duration-300 ease-in-out"
    style="transform: translateX({isSidebarOpen ? '0%' : '-100%'})"
  >
    <div class="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-2">
        <LayoutTemplate size={18} class="text-slate-500" />
        <h2 class="text-sm font-semibold text-slate-800 whitespace-nowrap">组件库</h2>
      </div>
      <Button variant="ghost" size="icon" class="h-7 w-7 text-slate-400" onclick={() => isSidebarOpen = false}>
        <PanelLeftClose size={16} />
      </Button>
    </div>
    <div class="p-4 flex-1 overflow-y-auto space-y-3">
      <div class="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">基础阶段 (Stages)</div>
      
      <div role="button" tabindex="0" draggable="true" ondragstart={(e) => e.dataTransfer?.setData('application/studio-stage', 'context-gathering')} class="group flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all">
        <div class="w-2 h-2 rounded-full bg-blue-500 mr-3 group-hover:scale-125 transition-transform"></div>
        <div><div class="text-sm font-medium text-slate-700">Context Gathering</div><div class="text-xs text-slate-400 mt-0.5">上下文收集</div></div>
      </div>
      <div role="button" tabindex="0" draggable="true" ondragstart={(e) => e.dataTransfer?.setData('application/studio-stage', 'execution')} class="group flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-green-400 hover:shadow-md transition-all">
        <div class="w-2 h-2 rounded-full bg-green-500 mr-3 group-hover:scale-125 transition-transform"></div>
        <div><div class="text-sm font-medium text-slate-700">Execution</div><div class="text-xs text-slate-400 mt-0.5">执行阶段</div></div>
      </div>
      <div role="button" tabindex="0" draggable="true" ondragstart={(e) => e.dataTransfer?.setData('application/studio-stage', 'review')} class="group flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-purple-400 hover:shadow-md transition-all">
        <div class="w-2 h-2 rounded-full bg-purple-500 mr-3 group-hover:scale-125 transition-transform"></div>
        <div><div class="text-sm font-medium text-slate-700">Review</div><div class="text-xs text-slate-400 mt-0.5">审查阶段</div></div>
      </div>
    </div>
  </aside>

  <!-- 🚨 悬浮按钮锚点：固定在左上角，与侧边栏头部高度对齐 -->
  <div class="absolute top-4 left-4 z-30 transition-opacity duration-300" style="opacity: {isSidebarOpen ? '0' : '1'}; pointer-events: {isSidebarOpen ? 'none' : 'auto'};">
    <div class="bg-white/90 backdrop-blur-md shadow-sm rounded-lg border border-slate-200/60 p-1">
      <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-600" onclick={() => isSidebarOpen = true}>
        <PanelLeftOpen size={16} />
      </Button>
    </div>
  </div>

  <!-- 顶部操作栏：固定在正中央，永远不挤压偏移 -->
  <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-2 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-lg border border-slate-200/60">
    <Button onclick={handleSave} disabled={isSaving} class="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
      <Download size={16} class="mr-2" />
      {isSaving ? '保存中...' : '导出并保存'}
    </Button>
  </div>

  <!-- 右侧属性面板 -->
  <aside 
    class="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 flex flex-col transition-transform duration-300 ease-in-out"
    style="transform: translateX({selectedNode ? '0%' : '100%'})"
  >
    <div class="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
      <div class="flex items-center gap-2">
        <Settings2 size={18} class="text-slate-500" />
        <h2 class="text-sm font-semibold text-slate-800">节点属性</h2>
      </div>
      <Button variant="ghost" size="icon" class="h-7 w-7 text-slate-400" onclick={() => selectedNode = null}>
        <X size={16} />
      </Button>
    </div>
    {#if selectedNode}
      <div class="p-5 flex-1 overflow-y-auto space-y-6">
        <div class="space-y-2">
          <Label for="node-label" class="text-xs font-medium text-slate-500 uppercase tracking-wide">节点名称</Label>
          <Input id="node-label" type="text" value={selectedNode.data.label} oninput={(e) => updateNodeData('label', e.currentTarget.value)} class="bg-slate-50 focus-visible:ring-slate-900" />
        </div>
        <div class="space-y-2">
          <Label for="node-stage" class="text-xs font-medium text-slate-500 uppercase tracking-wide">绑定阶段</Label>
          <Input id="node-stage" type="text" value={selectedNode.data.stage} oninput={(e) => updateNodeData('stage', e.currentTarget.value)} class="bg-slate-50 focus-visible:ring-slate-900" />
        </div>
      </div>
    {/if}
  </aside>

  <!-- 底部调试面板 -->
  <DebugPanel bind:logs bind:isOpen={isConsoleOpen} onNodeClick={focusNode} sidebarOpen={isSidebarOpen} />
</div>
