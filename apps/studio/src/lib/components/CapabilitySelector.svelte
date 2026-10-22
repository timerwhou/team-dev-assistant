<script lang="ts">
  import { onMount } from 'svelte';
  import { ScrollArea } from '#lib/components/ui/scroll-area';

  let { selectedIds = $bindable<string[]>([]) } = $props();

  type Capability = {
    id: string;
    name: string;
    kind: string;
    description: string;
    stage: string;
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';

  let availableCapabilities = $state<Capability[]>([]);
  let isLoading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/capabilities`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      availableCapabilities = await res.json();
    } catch (e: any) {
      // 🌟 拦截网络错误，给出专业提示
      if (e.message.includes('fetch')) {
        error = '后端未启动或连接失败，请检查 API 地址。';
      } else {
        error = e.message;
      }
    } finally {
      isLoading = false;
    }
  });

  function toggleCapability(id: string) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((i: string) => i !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }
</script>

<div>
  <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">可用能力 (Capabilities)</h3>
  {#if isLoading}
    <div class="text-sm text-slate-400">加载中...</div>
  {:else if error}
    <div class="text-xs text-red-500 p-2 bg-red-50 border border-red-100 rounded-md">
      ⚠️ {error}
    </div>
  {:else}
    <ScrollArea class="h-64 border border-slate-200 rounded-md bg-slate-50">
      <div class="p-2 space-y-1">
        {#each availableCapabilities as cap}
          <label class="flex items-start gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              class="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              checked={selectedIds.includes(cap.id)}
              onchange={() => toggleCapability(cap.id)}
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-700">{cap.name}</span>
                <span class="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{cap.kind}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{cap.description}</p>
            </div>
          </label>
        {/each}
      </div>
    </ScrollArea>
  {/if}
</div>
