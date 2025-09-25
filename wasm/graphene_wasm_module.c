#include <emscripten.h>
#include <graphene.h>
#include <graphene-version-macros.h>

EMSCRIPTEN_KEEPALIVE
const char* graphene_wasm_version(void) {
  return GRAPHENE_VERSION;
}

