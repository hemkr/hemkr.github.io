'use strict';
function get_unzstd(cont)
{
    let mem8;

    const imports = {
        env: {}
    };

    const fetchopt = { cache: 'default' };

    fetch('unzstd.wasm', fetchopt)
        .then(response => response.arrayBuffer())
        .then(bytes => WebAssembly.compile(bytes))
        .then(module => new WebAssembly.Instance(module, imports))
        .then(instance => {
            instance.exports.memory.grow(2048);
            mem8 = new Uint8Array(instance.exports.memory.buffer);
            function unzstd(abuf) {
                const buf = new Uint8Array(abuf);
                const srcptr = instance.exports.malloc(buf.length);
                for (let i = 0; i < buf.length; i++)
                    mem8[srcptr + i] = buf[i];
                const dstlen = Number(instance.exports.ZSTD_decompressBound(srcptr, buf.length));
                const dstptr = instance.exports.malloc(dstlen);
                const dstlen2 = instance.exports.ZSTD_decompress(dstptr, dstlen,
                                                                 srcptr, buf.length);
                // todo: error
                const abufo = new ArrayBuffer(dstlen2);
                const bufo = new Uint8Array(abufo);
                for (let i = 0; i < dstlen2; i++)
                    bufo[i] = mem8[dstptr + i];
                return abufo;
            }
            cont(unzstd);
        });
}
