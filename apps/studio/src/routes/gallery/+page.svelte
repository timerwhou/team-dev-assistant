<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Clock, Layers, Trash2, ArrowRight } from 'lucide-svelte';
  import { Button } from '#lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000';
  let assets = $state<any[]>([]);
  let isLoading = $state(true);

  onMount(async () => {
    await fetchAssets();
  });

  async function fetchAssets() {
    try {
      const res = await fetch(`${API_BASE}/api/assets`);
      if (res.ok) assets = await res.json();
    } catch (e) {
      toast.error('无法连接到后端服务');
    } finally {
      isLoading = false;
    }
  }

  async function deleteAsset(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (!confirm('确定要删除这个工作流资产吗？')) return;
    try {
      const res = await fetch(`${API_BASE}/api/assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('已删除');
        await fetchAssets();
      }
    } catch {
      toast.error('删除失败');
    }
  }

  function createNew() {
    goto('/');
  }
</script>

<div class="min-h-screen bg-slate-50 p-8">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">工作流画廊</h1>
        <p class="text-sm text-slate-500 mt-1">管理和加载你的研发工作流资产</p>
      </div>
      <Button onclick={createNew} class="bg-slate-900 text-white hover:bg-slate-800">
        <Plus size={16} class="mr-2" /> 新建工作流
      </Button>
    </div>

    {#if isLoading}
      <div class="text-center py-20 text-slate-400">加载中...</div>
    {:else if assets.length === 0}
      <div class="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
        还没有任何工作流，点击右上角创建一个吧。
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each assets.filter((a) => a?.manifest?.stages) as asset}
          <div 
            class="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col"
            onclick={() => goto(`/?id=${asset.id}`)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && goto(`/?id=${asset.id}`)}
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-slate-900">{asset.name}</h3>
                  <p class="text-xs text-slate-400">v{asset.version} · {asset.manifest?.stages?.length ?? 0} 个阶段</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onclick={(e) => deleteAsset(asset.id, e)}>
                <Trash2 size={16} />
              </Button>
            </div>
            
            <p class="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
              {asset.manifest?.description || '暂无描述'}
            </p>

            <div class="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
              <div class="flex items-center gap-1">
                <Clock size={14} />
                {new Date(asset.updatedAt).toLocaleDateString()}
              </div>
              <div class="flex items-center gap-1 text-slate-600 font-medium group-hover:translate-x-1 transition-transform">
                进入编辑 <ArrowRight size={14} />
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
