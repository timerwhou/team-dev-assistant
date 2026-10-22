<script lang="ts">
  import { Terminal, ChevronDown, ChevronUp, AlertCircle, Info, XCircle } from 'lucide-svelte';
  import { ScrollArea } from '#lib/components/ui/scroll-area';
  import { Separator } from '#lib/components/ui/separator';

  export type LogEntry = {
    id: string;
    type: 'info' | 'error' | 'warn';
    title: string;
    detail?: string;
    nodeId?: string;
    timestamp: string;
  };

  let { logs = [], isOpen = $bindable(false), onNodeClick, sidebarOpen = false }: { 
    logs: LogEntry[]; 
    isOpen: boolean;
    onNodeClick?: (nodeId: string) => void;
    sidebarOpen?: boolean;
  } = $props();

  let expandedLogId = $state<string | null>(null);
</script>

<!-- 使用 left-64 避开侧边栏，加上 transition 平滑过渡 -->
<div 
  class="absolute bottom-0 right-0 z-30 bg-white border-t border-l border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out
    {sidebarOpen ? 'left-64' : 'left-0'}"
  style="transform: translateY({isOpen ? '0' : 'calc(100% - 44px)'});"
>
  <button 
    class="w-full h-11 flex items-center justify-between px-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
    onclick={() => isOpen = !isOpen}
  >
    <div class="flex items-center gap-2">
      <Terminal size={16} class="text-slate-500" />
      <span class="text-sm font-semibold text-slate-700">运行控制台</span>
      {#if logs.filter(l => l.type === 'error').length > 0}
        <span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium ml-2">
          {logs.filter(l => l.type === 'error').length} 错误
        </span>
      {/if}
    </div>
    {#if isOpen} <ChevronDown size={16} class="text-slate-400" /> {:else} <ChevronUp size={16} class="text-slate-400" /> {/if}
  </button>

  <ScrollArea class="h-72">
    <div class="p-2 space-y-1">
      {#if logs.length === 0}
        <div class="text-sm text-slate-400 text-center py-8">暂无日志，请操作画布</div>
      {/if}
      {#each logs as log}
        <div class="rounded-md border border-transparent hover:border-slate-200 transition-colors">
          <button 
            class="w-full flex items-start gap-3 px-3 py-2 text-left"
            onclick={() => expandedLogId = expandedLogId === log.id ? null : log.id}
          >
            {#if log.type === 'error'}
              <XCircle size={16} class="text-red-500 mt-0.5 shrink-0" />
            {:else if log.type === 'warn'}
              <AlertCircle size={16} class="text-amber-500 mt-0.5 shrink-0" />
            {:else}
              <Info size={16} class="text-blue-500 mt-0.5 shrink-0" />
            {/if}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-700 truncate">{log.title}</span>
                <span class="text-xs text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
              {#if log.nodeId}
                <span class="text-xs text-slate-500">关联节点: {log.nodeId}</span>
              {/if}
            </div>
          </button>
          
          {#if expandedLogId === log.id && log.detail}
            <div class="px-3 pb-3 pl-10 animate-in slide-in-from-top-2 fade-in duration-200">
              <Separator class="mb-2" />
              <pre class="text-xs text-slate-700 bg-slate-100 p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono border border-slate-200">{log.detail}</pre>
              {#if log.nodeId && onNodeClick}
                <button 
                  class="mt-2 h-7 px-3 text-xs bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                  onclick={() => onNodeClick(log.nodeId!)}
                >
                  定位到节点
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </ScrollArea>
</div>
