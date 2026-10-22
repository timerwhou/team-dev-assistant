<script lang="ts">
  import { Terminal, X, ChevronUp, ChevronDown } from 'lucide-svelte';

  let { logs = [], isOpen = $bindable(false) }: { logs: { type: 'info'|'error', message: string, time: string }[], isOpen: boolean } = $props();
</script>

<!-- 控制台抽屉 -->
<div 
  class="absolute bottom-0 left-0 right-0 z-30 bg-slate-900 text-slate-300 font-mono text-xs transition-transform duration-300 ease-in-out border-t border-slate-700 shadow-2xl"
  style="transform: translateY({isOpen ? '0' : 'calc(100% - 40px)'});"
>
  <!-- 头部操作栏 -->
  <div class="h-10 flex items-center justify-between px-4 bg-slate-800 cursor-pointer border-b border-slate-700" onclick={() => isOpen = !isOpen}>
    <div class="flex items-center gap-2">
      <Terminal size={14} class="text-slate-400" />
      <span class="font-semibold tracking-wide text-slate-200">Console</span>
      <span class="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{logs.length} 条日志</span>
    </div>
    <button class="text-slate-400 hover:text-white transition-colors" aria-label="Toggle Console">
      {#if isOpen} <ChevronDown size={16} /> {:else} <ChevronUp size={16} /> {/if}
    </button>
  </div>
  
  <!-- 日志内容区 -->
  <div class="h-64 overflow-y-auto p-4 space-y-1">
    {#if logs.length === 0}
      <div class="text-slate-500 italic">暂无日志...</div>
    {/if}
    {#each logs as log}
      <div class="flex gap-2">
        <span class="text-slate-500 shrink-0">[{log.time}]</span>
        <span class={log.type === 'error' ? 'text-red-400' : 'text-blue-300'}>
          {log.message}
        </span>
      </div>
    {/each}
  </div>
</div>
