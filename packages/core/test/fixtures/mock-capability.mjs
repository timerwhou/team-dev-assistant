export default [
  {
    metadata: {
      id: "mock:hello_world",
      name: "hello_world",
      kind: "tool",
      version: "1.0.0",
      description: "测试用的远程能力",
      stage: "execution",
      sideEffects: ["read"]
    },
    inputSchema: { shape: {} }, // 简化测试
    execute: async () => ({ content: [{ type: "text", text: "Hello from remote!" }] })
  }
];
