const zlib = require('zlib');
const xml2json = require("xml2json");
const NullProvider = require("./null.js");

/*
わかったこと
レイヤーのパッチデータの最後に必ず0〜3バイトの0x00や0x01、0x03が入る→パディングを入れている可能性
データで見ると結局ADLER32（チェックサムのアルゴリズム）の32ビット（4バイト）の後に0x00, 0x00, 0x00が入っている。
*/

class MDPProvider extends NullProvider {
    async parse(buf) {
        /*
        mdipack ファイル構造

            ヘッダ(XML)
            本文データ {
                [
                    レイヤーデータ(PAC\x20 から始まる) {
                        レイヤー名
                        共通パッチ情報(パッチ個数・パッチサイズ)
                        [
                            パッチヘッダ(パッチの位置・パッチサイズ)
                            パッチデータ(Zlib圧縮データ)
                        ]
                    }
                ]
            }
        */

        // ヘッダ終了位置を取得する
        var headerEnd = 0x14 + buf.readUIntLE(0xc, 4);

        // ヘッダを取得し、JSONにパースする
        var header = JSON.parse(xml2json.toJson(buf.slice(0x14, headerEnd).toString())).Mdiapp;

        // 本文データを取得する
        var rawContents = buf.slice(headerEnd);

        var splitedRawContents = [];
        while (true) {
            // 本文データを分割し、レイヤーごとに分割する
            var contentEnd = rawContents.readUIntLE(0x4, 4);
            var splitedRawContent = rawContents.slice(0x0, contentEnd);
            splitedRawContents.push(splitedRawContent);

            // 管理用レイヤー名を取得する
            var layerBinName = splitedRawContent.slice(0x44, 0x44 + 64).toString().replace(/\0/g, "");
            // レイヤーデータからヘッダ以外（共通パッチ情報＆パッチデータ）を取得する
            var layerData = splitedRawContent.slice(0x44 + 64);
            // サムネイルであればすぐに圧縮されたデータとなる。それ以外であればパッチの分割処理が必要となる。
            if (layerBinName !== "thumb") {
                console.log("\n\n\n:" + layerBinName + ":");
                // 共通パッチ情報を取得する
                var patchCount = layerData.readUIntLE(0x0, 4);
                var patchSize = layerData.readUIntLE(0x4, 4);

                // パッチを取得する
                var rawPatches = layerData.slice(0x8);

                var splitedCompressedDatas = [];
                while (true) {
                    // console.log("\n\n", layerBinName, "\x1b[31m\x1b[1mProcessing...\x1b[0m", rawPatches);

                    // パッチヘッダを取得する
                    var column = rawPatches.readUIntLE(0x0, 4);
                    var row = rawPatches.readUIntLE(0x4, 4);
                    var unknown = rawPatches.readUIntLE(0x8, 4);
                    var size = rawPatches.readUIntLE(0xc, 4);

                    // パッチ内容を取得する
                    var compressedPatchData = rawPatches.slice(0x10);

                    // console.log("\x1b[33m\x1b[1mResult\x1b[0m", column.toString(16), row.toString(16), unknown.toString(16), size.toString(16), compressedPatchData);
                    splitedCompressedDatas.push(compressedPatchData);

                    // 処理が完了したパッチデータを削除する（パッチヘッダに記入されている長さとパッチヘッダ長さの和〜最後を切り取ってrawPatchesに代入する）
                    rawPatches = rawPatches.slice(size + 0x10);
                    // rawPatches = rawPatches.slice(patchSize);
                    if (rawPatches.length === 0) break;
                }

                splitedCompressedDatas.forEach(async compressedPatchData => {
                    var decompressedPatchData = await new Promise((resolve, reject) => {
                        zlib.inflate(compressedPatchData, (err, data) => {
                            resolve(data);
                        });
                    });
                    // if (decompressedPatchData !== undefined) await require("fs").promises.writeFile("test.bin", decompressedPatchData);
                });


                console.log(splitedCompressedDatas);
                // var layerCompressedData = layerData;
            } else {
                var layerCompressedData = layerData;
            }


            // 処理が完了したレイヤーデータを削除する
            rawContents = rawContents.slice(contentEnd);
            if (rawContents.length === 0) break;
        }
    }

    static isSupport(buf) {
        return buf.slice(0, 12).equals(Buffer.from([0x6D, 0x64, 0x69, 0x70, 0x61, 0x63, 0x6B, 0x00, 0x00, 0x00, 0x00, 0x00]));
    }
}

module.exports = MDPProvider;
