<script lang="ts">
  import { fly } from 'svelte/transition';
  import { CheckCircle2, XCircle } from 'lucide-svelte';

  // 🌟 Svelte 5 最佳实践：使用 $props() 接收双向绑定
  let { message = $bindable(''), type = 'success' }: { message: string; type: 'success' | 'error' } = $props();

  // 自动消失逻辑
  $effect(() => {
    if (message) {
      const timer = setTimeout(() => {
        message = '';
      }, 3000);
      return () => clearTimeout(timer);
    }
  });
</script>

{#if message}
  <div 
    transition:fly={{ y: -20, duration: 300 }}
    class="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium
      {type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}"
  >
    {#if type === 'success'}
      <CheckCircle2 size={18} class="text-green-600" />
    {:else}
      <XCircle size={18} class="text-red-600" />
    {/if}
    {message}
  </div>
{/if}
