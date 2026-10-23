<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Button } from '#lib/components/ui/button';
  import { ScrollArea } from '#lib/components/ui/scroll-area';
  import { Separator } from '#lib/components/ui/separator';
  import { LayoutTemplate, ArrowLeft, RefreshCcw, CheckCircle2, Clock } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';
  const workflowId = new URLSearchParams(window.location.search).get('workflowId') || '';
  
  let tasks = $state<any[]>([]);
  let isLoading = $state(true);
  let eventSource: EventSource | null = null;

  onMount(() => {
    if (!workflowId) {
      toast.error('缺少 workflowId 参数');
      isLoading = false;
      return;
    }

    // 1. 建立 SSE 连接，订阅 A2A 任务状态
    eventSource = new EventSource(`${API_BASE}/api/a2a/stream/${workflowId}`);
    
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'task-updated' && payload.task) {
        // 更新或插入任务
        const idx = tasks.findIndex(t => t.id === payload.task.id);
        if (idx !== -1) {
          tasks[idx] = payload.task;
        } else {
          tasks = [...tasks, payload.task];
        }
        tasks = [...tasks]; // 触发 Svelte 更新
      }
    };

    eventSource.onerror = () => {
      toast.error('SSE 连接中断');
    };

    isLoading = false;
    return () => eventSource?.close();
  });

  async function approveTask(task: any) {
    try {
      const res = await fetch(`${API_BASE}/api/a2a/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentUrl: task.agentUrl, // 需要在 Task 里携带
          taskId: task.id,
          requestState: task.requestState,
          confirm: true,
        }),
      });
      if (!res.ok) throw new Error('审批失败');
      toast.success('已提交审批，Agent 将继续执行');
    } catch (e: any) {
      toast.error(e.message);
    }
  }
</script>

<div class="min-h-screen bg-slate-50 flex flex-col">
  <!-- 顶部导航 -->
  <header class="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" onclick={() => goto('/gallery')}>
        <ArrowLeft size={18} />
      </Button>
      <h1 class="text-base font-semibold text-slate-800">A2A 协同看板</h1>
      <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">ID: {workflowId}</span>
    </div>
    <Button variant="outline" size="sm">
      <RefreshCcw size={14} class="mr-2" /> 刷新状态
    </Button>
  </header>

  <!-- 主内容区 -->
  <main class="flex-1 p-6 overflow-hidden">
    {#if isLoading}
      <div class="text-center py-20 text-slate-400">正在加载协同状态...</div>
    {:else if tasks.length === 0}
      <div class="text-center py-20 text-slate-400">暂无 Agent 任务记录</div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each tasks as task}
          <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-slate-700">{task.agentName || 'Agent'}</span>
                <span class="text-xs px-2 py-0.5 rounded-full 
                  {task.status === 'input-required' ? 'bg-amber-100 text-amber-700' : 
                   task.status === 'completed' ? 'bg-green-100 text-green-700' : 
                   'bg-blue-100 text-blue-700'}">
                  {task.status}
                </span>
              </div>
            </div>
            <p class="text-xs text-slate-500 mb-4">Task ID: {task.id}</p>
            
            {#if task.status === 'input-required' && task.pendingElicit}
              <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p class="text-sm text-amber-800 font-medium mb-2">{task.pendingElicit.question}</p>
                {#if task.pendingElicit.proposedAction}
                  <p class="text-xs text-amber-600 mb-1">提议动作：{task.pendingElicit.proposedAction}</p>
                {/if}
                {#if task.pendingElicit.proposedFact}
                  <div class="mt-2 pt-2 border-t border-amber-200">
                    <p class="text-[10px] font-bold text-amber-700 uppercase">建议沉淀的知识</p>
                    <p class="text-xs text-amber-800">{task.pendingElicit.proposedFact.title}</p>
                  </div>
                {/if}
              </div>
              <Button onclick={() => approveTask(task)} class="w-full bg-amber-500 hover:bg-amber-600 text-white">
                审批并继续
              </Button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
