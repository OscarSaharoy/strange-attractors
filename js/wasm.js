// Oscar Saharoy 2021


function webAssemblySupported() {
    
    try {
        
        if( typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" ) throw "no wasm";

        const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
        
        if( module instanceof WebAssembly.Module )
            return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
    }
    catch { return false };
}


function loadWasm(event) {

    if( !webAssemblySupported() ) return;

    // Smuggle WASM code into codepen as an inlined base-64 string literal. (https://rot47.net/base64encoder.html)
    const b64 = 'AGFzbQEAAAABBQFgAAF9AwIBAAUDAQARBxECBm1lbW9yeQIABHRlc3QAAAoJAQcAQ5qZ2T8LCwoBAEGAgMAACwEEAHsJcHJvZHVjZXJzAghsYW5ndWFnZQEEUnVzdAAMcHJvY2Vzc2VkLWJ5AwVydXN0Yx0xLjU0LjAgKGExNzhkMDMyMiAyMDIxLTA3LTI2KQZ3YWxydXMGMC4xOS4wDHdhc20tYmluZGdlbhIwLjIuNzYgKGE4ODFhODNjNSk='; // XXX
    
    const binaryString = window.atob(b64);
    const sourceBuffer = new Uint8Array( binaryString.length );

    [...binaryString].forEach( (v,i) => sourceBuffer[i] = binaryString.charCodeAt(i) );

    WebAssembly.instantiate( sourceBuffer.buffer, { env: {} } ).then( obj => console.log( obj.instance.exports.test() ) );
}


document.addEventListener( "DOMContentLoaded", loadWasm );
