
cd rust

wasm-pack build --target web

cd ..

python updateWasm.py
