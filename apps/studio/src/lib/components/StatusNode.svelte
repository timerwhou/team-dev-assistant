<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';

  // 接收 Svelte Flow 传入的节点数据
  let { id, data }: NodeProps = $props();
</script>

<!-- 🌟 根据 data.status 动态应用 CSS 类 -->
<div 
  class="node-content px-6 py-3 bg-white border-2 rounded-lg shadow-sm transition-all duration-300
    {data.status === 'running' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse' : ''}
    {data.status === 'completed' ? 'border-green-500' : ''}
    {data.status === 'error' ? 'border-red-500' : ''}
    {!data.status ? 'border-slate-200' : ''}"
>
  <span class="text-sm font-medium text-slate-700">{data.label}</span>
  
  <Handle type="target" position={Position.Top} />
  <Handle type="source" position={Position.Bottom} />
</div>
