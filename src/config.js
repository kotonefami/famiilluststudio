module.exports = {
    mimeTypes: {
        "png": "image/png",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "jpe": "image/jpeg",
        "tif": "image/tiff",
        "tiff": "image/tiff",
        "webp": "image/webp",
        "gif": "image/gif",
        "bmp": "image/bmp",
        "ico": "image/vnd.microsoft.icon"
    },
    darkModeColor: {
        dark: "#333333",
        light: "#ffffff"
    },
    contentSecurityPolicy: {
        // 別の Fetch ディレクティブに対する代替として提供します。
        "default-src": [],

        // script インターフェースによってロードされる URL を制限します。
        "connect-src": ["file:", "https://moltas.net", "data:"],

        // 画像や favicon に対する有効なソースを定義します。
        "img-src": ["self"],

        // ウェブワーカーと、 <frame> や <iframe> のような要素によってロードされる入れ子状の閲覧コンテキストに対する有効なソースを定義します。
        "child-src": [],

        // @font-face によってロードされるフォントに対する有効なソースを指定します。
        "font-src": ["self"],

        // <frame> や <iframe> のような要素によってロードされる入れ子状のコンテンツの閲覧に対する有効なソースを指定します。
        "frame-src": [],

        // アプリケーションのマニフェストファイルに対する有効なソースを指定します。
        "manifest-src": [],

        // <audio>、<video> や <track> 要素によってロードするメディアに対する有効なソースを指定します。
        "media-src": ["self"],

        // <object>、 <embed> や <applet> 要素に対する有効なソースを指定します。
        "object-src": [],

        // 事前にフェッチされるか描画される有効なソースを指定します。
        "prefetch-src": [],

        // JavaScript に対する有効なソースを指定します。
        "script-src": [],

        // JavaScript の <script> 要素に対する有効なソースを指定します。
        "script-src-elem": ["self", "sha256-RlziVEtEWLSlE9ZX2WNP+AbNJDLAZVvCv4OHoTQH0wY="],

        // JavaScript のインラインイベントハンドラーに対する有効なソースを指定します。
        "script-src-attr": ["unsafe-inline"],

        // スタイルシートに対する有効なソースを指定します。
        "style-src": [],

        // スタイルシートの <style> および <link> 要素に rel="stylesheet" がついたもののに対する有効なソースを指定します。
        "style-src-elem": ["self"],

        // 個々の DOM 要素に適用されるインラインスタイルの有効なソースを指定します。
        "style-src-attr": ["unsafe-inline"],

        // Worker, SharedWorker, ServiceWorker スクリプトに対する有効なソースを指定します。
        "worker-src": [],

        // 文書の <base> 要素で使用される URL を制限します。
        "base-uri": [],

        // 指定のコンテキストからフォームの送信先として使用される URL を制限します。
        "form-action": [],

        // <frame>, <iframe>, <object>, <embed>, もしくは <applet> によってページに埋め込まれた有効な親を指定します。
        "frame-ancestors": [],

        // <form> (form-action が指定されていない場合), <a>, window.location, window.open, など、あらゆる方法で文書からナビゲーションを行うことができる URL を制限します。
        "navigate-to": [],

        // 安全でない URL (HTTP で提供されているもの) をすべて安全な URL (HTTPS で提供されているもの) に置き換えたかのように扱うようにユーザエージェントに指示します。
        "upgradeInsecureRequests": true,

        // ページが HTTPS を使用して読み込まれた際に、 HTTP を使用して資産を読み込むことを防止します。
        "blockAllMixedContent": true
    }
};
