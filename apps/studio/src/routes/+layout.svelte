<script lang="ts">
  import '../app.css';
  import { Toaster } from '#lib/components/ui/sonner';
  let { children } = $props();
</script>

{@render children()}
<!-- 🌟 修复：将 Toast 挪到右上角，避免遮挡顶部操作栏 -->
<Toaster offset="4.25rem" position="top-right" richColors />
