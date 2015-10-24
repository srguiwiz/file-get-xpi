An Add-on for Mozilla Firefox

Provide an API to GET file:// URI scheme files, as allowed by regular
expressions in Preferences.

If so set may allow more than browser default limitations of XMLHttpRequest.

Page scripts should provide an equivalent API to be used
when this add-on isn't present:

if (!window.nrvrGetTextFile) {
  window.nrvrGetTextFile = function nrvrGetTextFile (fileUrl, gotFileCallback) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.onloadend = function () {
        window.setTimeout(function () {
          gotFileCallback(xhr.responseText, xhr.status);
        }, 0);
      };
      xhr.open('GET', fileUrl, true);
      xhr.responseType = 'text';
      xhr.send();
    } catch (e) {
      console.error('error attempting to GET', fileUrl.href, e);
      window.setTimeout(function () {
        gotFileCallback('', 0);
      }, 0);
    }
  }
}

Designed specifically for use with https://github.com/srguiwiz/adj-js
command include http://srguiwiz.github.io/adj-js/user-docs/#L3450

Built version ready to install will be linked here once available.

Build with a local https://developer.mozilla.org/en-US/Add-ons/SDK/Builder

