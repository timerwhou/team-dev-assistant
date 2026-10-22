<script lang="ts">
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import { Download, LayoutTemplate, Settings2, X, PanelLeftClose, PanelLeftOpen, Trash2, Info } from 'lucide-svelte';
  import { Button } from '#lib/components/ui/button';
  import { Input } from '#lib/components/ui/input';
  import { Label } from '#lib/components/ui/label';
  import { toast } from 'svelte-sonner';
  import DebugPanel, { type LogEntry } from '#lib/components/DebugPanel.svelte';
  import CapabilitySelector from '#lib/components/CapabilitySelector.svelte';
  import FlowCanvas from '#lib/components/FlowCanvas.svelte';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

  const STAGES_CONFIG = [
    { stage: 'context-gathering', label: 'Context Gathering', desc: '上下文收集', color: 'bg-blue-500' },
    { stage: 'execution', label: 'Execution', desc: '执行阶段', color: 'bg-green-500' },
    { stage: 'review', label: 'Review', desc: '审查阶段', color: 'bg-purple-500' }
  ];

  let nodes = $state.raw<any[]>([]);
  let edges = $state.raw<any[]>([]);
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

  function updateNodeData(key: string, value: any) {
    if (!selectedNode) return;
    nodes = nodes.map((n: any) => n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n);
    selectedNode = nodes.find((n: any) => n.id === selectedNode.id);
  }

  function deleteSelectedNode() {
    if (!selectedNode) return;
    const idToDelete = selectedNode.id;
    nodes = nodes.filter((n: any) => n.id !== idToDelete);
    edges = edges.filter((e: any) => e.source !== idToDelete && e.target !== idToDelete);
    selectedNode = null;
    addLog('warn', `删除节点成功`, `节点 ID: ${idToDelete}`);
    toast.success('节点已删除');
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Backspace' || event.key === 'Delete') && selectedNode) {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      event.preventDefault();
      deleteSelectedNode();
    }
  }

  function focusNode(nodeId: string) {
    const node = nodes.find((n: any) => n.id === nodeId);
    if (node) selectedNode = node;
  }

  async function handleSave() {
    if (nodes.length === 0) {
      addLog('warn', '当前画布为空，无法保存');
      toast.warning('画布为空', { description: '请先拖入至少一个节点' });
      return;
    }
    
    isSaving = true;
    addLog('info', '开始导出 WorkflowManifest');
    
    try {
      const stages = nodes.map((n: any) => n.data.stage).filter(Boolean);
      
      const stageCapabilities: Record<string, string[]> = {};
      for (const stage of Array.from(new Set(stages))) {
        const capsForStage = nodes.filter((n: any) => n.data.stage === stage).flatMap((n: any) => n.data.capabilities || []);
        stageCapabilities[stage] = Array.from(new Set(capsForStage));
      }

      const manifest = {
        name: "studio-workflow-" + Date.now(),
        description: "Studio 生成的工作流",
        stages: Array.from(new Set(stages)),
        stageCapabilities,
        governance: { maxIterations: 5, maxResultsPerTool: 3 }
      };

      const res = await fetch(`${API_BASE}/api/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(errBody, null, 2));
      }
      
      addLog('info', '✅ 工作流保存成功', JSON.stringify(manifest, null, 2));
      toast.success('工作流导出成功', { description: '已安全写入本地存储' });
      
    } catch (e: any) {
      let detail = e.message;
      if (e.message === 'Failed to fetch') detail = `无法连接到后端 API (${API_BASE})。\n请确认后端已启动。`;
      addLog('error', '保存工作流失败', detail);
      toast.error('保存失败', { description: '请检查后端服务或底部控制台' });
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<SvelteFlowProvider>
  <div class="flex w-screen h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
    
    <FlowCanvas bind:nodes bind:edges {addLog} onSelectNode={(n) => selectedNode = n} />
    
    <!-- 左侧组件库 -->
    <aside class="absolute top-0 left-0 h-full w-64 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex flex-col transition-transform duration-300 ease-in-out" style="transform: translateX({isSidebarOpen ? '0%' : '-100%'})">
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
        {#each STAGES_CONFIG as stage}
          <div role="button" tabindex="0" draggable="true" ondragstart={(e) => e.dataTransfer?.setData('application/studio-stage', stage.stage)} class="group flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-slate-400 hover:shadow-md transition-all">
            <div class="w-2 h-2 rounded-full {stage.color} mr-3 group-hover:scale-125 transition-transform"></div>
            <div><div class="text-sm font-medium text-slate-700">{stage.label}</div><div class="text-xs text-slate-400 mt-0.5">{stage.desc}</div></div>
          </div>
        {/each}
      </div>
    </aside>

    <div class="absolute top-4 left-4 z-30 transition-opacity duration-300" style="opacity: {isSidebarOpen ? '0' : '1'}; pointer-events: {isSidebarOpen ? 'none' : 'auto'};">
      <div class="bg-white/90 backdrop-blur-md shadow-sm rounded-lg border border-slate-200/60 p-1">
        <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-600" onclick={() => isSidebarOpen = true}>
          <PanelLeftOpen size={16} />
        </Button>
      </div>
    </div>

    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-2 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-lg border border-slate-200/60">
      <Button onclick={handleSave} disabled={isSaving} class="bg-slate-900 hover:bg-slate-800 text-white shadow-sm min-w-[120px]">
        {#if isSaving}
          <span class="animate-spin mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4"></span>
          保存中...
        {:else}
          <Download size={16} class="mr-2" />
          导出并保存
        {/if}
      </Button>
    </div>

    <!-- 右侧属性面板 -->
    <aside class="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 flex flex-col transition-transform duration-300 ease-in-out" style="transform: translateX({selectedNode ? '0%' : '100%'})">
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
            <div class="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-md">
              <Info size={14} class="text-slate-500" />
              <span class="text-sm text-slate-600 font-medium">{selectedNode.data.stage}</span>
            </div>
            <p class="text-[10px] text-slate-400">阶段不可修改，如需修改请重新拖入</p>
          </div>

          <div class="pt-4 border-t border-slate-100">
            <CapabilitySelector bind:selectedIds={selectedNode.data.capabilities} />
          </div>

          <div class="pt-6 border-t border-slate-100">
            <Button variant="destructive" class="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-sm" onclick={deleteSelectedNode}>
              <Trash2 size={16} class="mr-2" />
              删除当前节点
            </Button>
          </div>
        </div>
      {/if}
    </aside>

    <DebugPanel bind:logs bind:isOpen={isConsoleOpen} onNodeClick={focusNode} sidebarOpen={isSidebarOpen} />
  </div>
</SvelteFlowProvider>
