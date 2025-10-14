/**
 * Graphene WASM Benchmarks
 */

import GrapheneWASM from "../src/lib/index.ts"

Deno.bench("graphene initialization", {
  baseline: true
}, async () => {
  const lib = new GrapheneWASM()
  await lib.initialize()
})
