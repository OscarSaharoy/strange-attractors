// Oscar Saharoy 2021


function webAssemblySupported() {
    
    // if any of this raises an exception then wasm is unsupported
    try {
        
        // check for WebAssembly object and instantiate method
        if( typeof WebAssembly !== "object" || typeof WebAssembly.instantiate !== "function" ) throw "no wasm";

        // make dummy module with magic bytes
        const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
        
        // check it is working properly and return true if it is
        if( module instanceof WebAssembly.Module )
            return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
    }
    catch {};

    // if we got here wasm is unsupported
    return false;
}


function loadWasm(event) {

    // only proceed if we have webassembly
    if( !webAssemblySupported() ) return;

    // smuggle WASM code in as base 64 string 
    // need XXX at the end of the line to be able to find and replace it automatically
    const wasmb64 = 'AGFzbQEAAAABBgFgAX0BfQMCAQAFAwEAEQcRAgZtZW1vcnkCAAR0ZXN0AAAKBgEEACAACwsKAQBBgIDAAAsBBAB7CXByb2R1Y2VycwIIbGFuZ3VhZ2UBBFJ1c3QADHByb2Nlc3NlZC1ieQMFcnVzdGMdMS41NC4wIChhMTc4ZDAzMjIgMjAyMS0wNy0yNikGd2FscnVzBjAuMTkuMAx3YXNtLWJpbmRnZW4SMC4yLjc2IChhODgxYTgzYzUp'; // XXX
    
    // put the base64 into a buffer
    const wasmBinary   = window.atob(wasmb64);
    const sourceBuffer = new Uint8Array( wasmBinary.length );

    [...wasmBinary].forEach( (v,i) => sourceBuffer[i] = wasmBinary.charCodeAt(i) );

    // instantiate the wasm
    WebAssembly.instantiate( sourceBuffer.buffer, { env: {} } ).then( obj => console.log( obj.instance.exports.test( 2.2 ) ) );
}


function getVec3( address ) {

    
}


document.addEventListener( "DOMContentLoaded", loadWasm );
