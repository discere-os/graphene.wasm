graphene_wasm_cargs = ['-msimd128', '-DGRAPHENE_WASM=1']

graphene_main_link_args = [
  '-sWASM=1',
  '-sMODULARIZE=1',
  '-sEXPORT_ES6=1',
  '-sEXPORT_NAME=GrapheneModule',
  '-sALLOW_MEMORY_GROWTH=1',
  '-sENVIRONMENT=web,webview,worker',
  '-sNO_FILESYSTEM=1',
  '-sEXPORTED_RUNTIME_METHODS=["cwrap","ccall","UTF8ToString"]',
  '-O3',
  '-flto',
]

executable(
  'graphene-main',
  files('graphene_wasm_module.c'),
  dependencies: [graphene_dep],
  c_args: graphene_wasm_cargs,
  link_args: graphene_main_link_args,
  install: true,
  install_dir: get_option('bindir'),
)

graphene_side_link_args = [
  '-sSIDE_MODULE=2',
  '-fPIC',
  '-O3',
  '-flto',
  '-sERROR_ON_UNDEFINED_SYMBOLS=0',  # Host provides dependencies (glib, etc.)
  '-sEXPORTED_FUNCTIONS=["_graphene_wasm_version"]',
]

shared_module(
  'graphene-side',
  files('graphene_wasm_side.c'),
  dependencies: [graphene_dep],
  name_prefix: '',
  name_suffix: 'wasm',
  c_args: graphene_wasm_cargs,
  link_args: graphene_side_link_args,
  install: true,
  install_dir: get_option('libdir'),
)

