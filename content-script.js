function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var scriptTag = document.createElement("script");
    scriptTag.setAttribute("type", "text/javascript");
    scriptTag.setAttribute("src", file_path);
    scriptTag.setAttribute("async", true);
    const body = new Promise((resolve) => {
        if (document.body) {
            return resolve(document.body);
        }
        const observer = new MutationObserver((_mutations, observer) => {
            if (document.body) {
                resolve(document.body);
                observer.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    });
    body.then((res) => {
        document.head.insertAdjacentElement("afterbegin", scriptTag);
    });
}

injectScript(chrome.runtime.getURL("inject-script.js"), "head");
