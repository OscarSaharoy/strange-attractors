import base64, re

with open("rust/pkg/strange_attractors_bg.wasm", "rb") as file:

    encodedWasm = base64.b64encode( file.read() ).decode()


with open('js/wasm.js', 'r') as file:
    
    wasmjs_data = file.read()


replace_string = f"'{encodedWasm}'; // XXX"

new_wasmjs_data = re.sub( r"'.*'; // XXX", replace_string, wasmjs_data, flags=re.M )


with open('js/wasm.js', 'w') as file:
    
    file.write(new_wasmjs_data)
