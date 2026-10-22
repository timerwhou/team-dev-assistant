<script lang="ts">
  import { SvelteFlowProvider, type NodeTypes } from '@xyflow/svelte';
  import { Download, LayoutTemplate, Settings2, X, PanelLeftClose, PanelLeftOpen, Trash2, Info, Play, Activity } from 'lucide-svelte';
  import { Button } from '#lib/components/ui/button';
  import { Input } from '#lib/components/ui/input';
  import { Label } from '#lib/components/ui/label';
  import { toast } from 'svelte-sonner';
  import DebugPanel, { type LogEntry } from '#lib/components/DebugPanel.svelte';
  import CapabilitySelector from '#lib/components/CapabilitySelector.svelte';
  import FlowCanvas from '#lib/components/FlowCanvas.svelte';
  import StatusNode from '#lib/components/StatusNode.svelte';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

  // 🌟 注册自定义节点类型
  const nodeTypes: NodeTypes = {
    status: StatusNode,
  };

  const STAGES_CONFIG = [
    { stage: 'context-gathering', label: 'Context Gathering', desc: '上下文收集', color: 'bg-blue-500' },
    { stage: 'execution', label: 'Execution', desc: '执行阶段', color: 'bg-green-500' },
    { stage: 'review', label: 'Review', desc: '审查阶段', color: 'bg-purple-500' }
  ];

  let nodes = $state.raw<any[]>([]);
  let edges = $state.raw<any[]>([]);
  let selectedNode = $state<any>(null);
  let isSaving = $state(false);
  let isRunning = $state(false);
  let isSidebarOpen = $state(true);
  let isConsoleOpen = $state(false);
  let historyList = $state<any[]>([]);
  let showHistory = $state(false);
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

  async function fetchHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/traces`);
      if (res.ok) historyList = await res.json();
    } catch (e) {
      console.error(e);
    }
  }

  async function loadTrace(workflowId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/traces/${workflowId}`);
      if (!res.ok) throw new Error("未找到该记录");
      const record = await res.json();
      
      // 回填 Console
      logs = record.trace.map((t: any) => ({
        id: crypto.randomUUID(),
        type: t.action === "complete" ? "info" : "warn",
        title: `[回放] ${t.action}`,
        detail: t.detail,
        timestamp: new Date(t.timestamp).toLocaleTimeString()
      }));
      
      // 回填节点高亮（模拟最后一帧的状态）
      nodes = nodes.map((n: any) => {
        const hasEvent = record.trace.some((t: any) => t.detail === n.data.stage);
        return { ...n, data: { ...n.data, status: hasEvent ? "completed" : undefined } };
      });
      
      isConsoleOpen = true;
      showHistory = false;
      toast.success("历史记录已加载");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleRun() {
    if (nodes.length === 0) {
      addLog('warn', '画布为空，无法运行');
      toast.warning('画布为空', { description: '请先拖入节点' });
      return;
    }

    await handleSave();
    
    isRunning = true;
    addLog('info', '正在触发工作流执行...');

    try {
      const res = await fetch(`${API_BASE}/api/workflows/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: "current-workflow" })
      });

      if (!res.ok) throw new Error('执行请求失败');
      const { workflowId } = await res.json();
      
      addLog('info', `工作流已启动，ID: ${workflowId}`);
      toast.success('工作流已启动', { description: '正在实时监听执行状态...' });

      const eventSource = new EventSource(`${API_BASE}/trace/${workflowId}`);
      
      eventSource.onmessage = (event) => {
        const traceEvent = JSON.parse(event.data);
        addLog('info', `[SSE 收到] ${traceEvent.action}`, traceEvent.detail);

        // 🌟 正确方式：通过修改 data.status 来驱动自定义节点重新渲染
        nodes = nodes.map((n: any) => {
          if (n.data.stage === traceEvent.detail) {
            return { ...n, data: { ...n.data, status: 'running' } };
          }
          // 其他节点恢复普通状态
          return { ...n, data: { ...n.data, status: undefined } };
        });

        if (traceEvent.action === 'complete') {
          eventSource.close();
          isRunning = false;
          addLog('info', '✅ 工作流执行完成');
          toast.success('工作流执行完成');
          
          // 重置所有节点状态（恢复无高亮）
          nodes = nodes.map((n: any) => ({ ...n, data: { ...n.data, status: undefined } }));
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        isRunning = false;
        addLog('error', 'SSE 连接中断');
      };
      
    } catch (e: any) {
      addLog('error', '触发执行失败', e.message);
      isRunning = false;
    }
  }

  async function handleSave() {
    if (nodes.length === 0) return;
    
    isSaving = true;
    addLog('info', '正在保存工作流...');
    
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

      if (!res.ok) throw new Error('保存请求失败');
      addLog('info', '✅ 工作流保存成功', JSON.stringify(manifest, null, 2));
      toast.success('工作流已保存');
    } catch (e: any) {
      addLog('error', '保存失败', e.message);
      toast.error('保存失败');
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<SvelteFlowProvider>
  <div class="flex w-screen h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
    
    <!-- 🌟 将 nodeTypes 传递给 FlowCanvas -->
    <FlowCanvas bind:nodes bind:edges {addLog} {nodeTypes} onSelectNode={(n) => selectedNode = n} />
    
    <!-- 左侧组件库、顶部工具栏、右侧属性面板保持不变 -->
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

    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-2 py-1.5 bg-white/90 backdrop-blur-md shadow-sm rounded-lg border border-slate-200/60">
      <Button onclick={handleSave} disabled={isSaving || isRunning} variant="outline" class="bg-white hover:bg-slate-50 text-slate-700 shadow-sm">
        <Download size={16} class="mr-2" />
        {isSaving ? '保存中...' : '保存'}
      </Button>
      <div class="relative">
        <Button variant="outline" onclick={() => { showHistory = !showHistory; if (showHistory) fetchHistory(); }} class="bg-white">
          历史记录
        </Button>
        {#if showHistory}
          <div class="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-200 shadow-xl rounded-lg max-h-64 overflow-y-auto z-50">
            {#if historyList.length === 0}
              <div class="p-3 text-sm text-slate-500 text-center">暂无记录</div>
            {/if}
            {#each historyList as item}
              <button 
                class="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                onclick={() => loadTrace(item.workflowId)}
              >
                <div class="text-sm font-medium text-slate-700 truncate">{item.requirement}</div>
                <div class="text-xs text-slate-400 mt-1 flex justify-between">
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                  <span class="text-green-600">{item.status}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
      <Button onclick={handleRun} disabled={isRunning} class="bg-blue-600 hover:bg-blue-700 text-white shadow-sm min-w-[120px]">
        {#if isRunning}
          <Activity size={16} class="mr-2 animate-pulse" />
          执行中...
        {:else}
          <Play size={16} class="mr-2" />
          运行工作流
        {/if}
      </Button>
    </div>

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
