//
// Copyright (c) 2015, Nirvana Research
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the copyright holder nor the names of
//       contributors may be used to endorse or promote products derived from
//       this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
// BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
// OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
// EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// i.e. Modified BSD License
//
// ==============================================================================
//
// the main module of the file-scheme-get-from-script Add-on
//
// ==============================================================================
//
// Idea and first implementation - Leo Baschy <srguiwiz12 AT nrvr DOT com>
//

exports.main = function() {

  var pageMod = require("sdk/page-mod");
  var urls = require("sdk/url");
  const {XMLHttpRequest} = require("sdk/net/xhr");
  const {Cu} = require("chrome");
  const {OS} = Cu.import("resource://gre/modules/osfile.jsm", {});
  //
  var uiModule = require("sdk/ui");

  // a required friendly string description used for
  // accessibility, title bars, and error reporting
  var friendlyName = "File URI Scheme GET from Page Script";

  var emptyStringRegExp = new RegExp("^$"); // only matches empty string

  var getOnlyIfDocumentURIMatchesRegExp = function getOnlyIfDocumentURIMatchesRegExp () {
    var prefs = require("sdk/simple-prefs").prefs;
    var onlyIfDocumentURIMatchesRegEx = prefs.onlyIfDocumentURIMatchesRegEx;
    if (onlyIfDocumentURIMatchesRegEx) {
      onlyIfDocumentURIMatchesRegEx = onlyIfDocumentURIMatchesRegEx.trim();
    }
    if (!onlyIfDocumentURIMatchesRegEx) { // e.g. empty string
      console.error("empty onlyIfDocumentURIMatchesRegEx", prefs.onlyIfDocumentURIMatchesRegEx);
      return emptyStringRegExp;
    }
    // remove a leading ^ and a trailing $ if any
    onlyIfDocumentURIMatchesRegEx = onlyIfDocumentURIMatchesRegEx.replace(new RegExp("^\\^?(.*?)\\$?$"), "$1");
    // remove a leading file:// if any
    onlyIfDocumentURIMatchesRegEx = onlyIfDocumentURIMatchesRegEx.replace(new RegExp("^file://(.*)$"), "$1");
    // resolve a leading ~ if any
    var hasLeadingTilde = new RegExp("^~.*$").test(onlyIfDocumentURIMatchesRegEx);
    var hasLeadingSlash = new RegExp("^/.*$").test(onlyIfDocumentURIMatchesRegEx);
    if (hasLeadingTilde) {
      // replace ~ with homeDir URI, which includes a leading file://
      onlyIfDocumentURIMatchesRegEx = OS.Path.toFileURI(OS.Constants.Path.homeDir) + onlyIfDocumentURIMatchesRegEx.substring(1);
    } else if (hasLeadingSlash) {
      // prepend file://
      onlyIfDocumentURIMatchesRegEx = "file://" + onlyIfDocumentURIMatchesRegEx;
    } else { // apparently not absolute
      console.error("unacceptable onlyIfDocumentURIMatchesRegEx", prefs.onlyIfDocumentURIMatchesRegEx);
      return emptyStringRegExp;
    }
    // prepend ^ and append $
    onlyIfDocumentURIMatchesRegEx = "^" + onlyIfDocumentURIMatchesRegEx + "$";
    //
    //console.log("from prefs.onlyIfDocumentURIMatchesRegEx got", onlyIfDocumentURIMatchesRegEx);
    try { // common case
      return new RegExp(onlyIfDocumentURIMatchesRegEx);
    } catch (e) {
      console.error("invalid onlyIfDocumentURIMatchesRegEx", prefs.onlyIfDocumentURIMatchesRegEx);
      return emptyStringRegExp;
    }
  };

  var getOnlyIfFileURIMatchesRegExp = function getOnlyIfFileURIMatchesRegExp () {
    var prefs = require("sdk/simple-prefs").prefs;
    var onlyIfFileURIMatchesRegEx = prefs.onlyIfFileURIMatchesRegEx;
    if (onlyIfFileURIMatchesRegEx) {
      onlyIfFileURIMatchesRegEx = onlyIfFileURIMatchesRegEx.trim();
    }
    if (!onlyIfFileURIMatchesRegEx) { // e.g. empty string
      console.error("empty onlyIfFileURIMatchesRegEx", prefs.onlyIfFileURIMatchesRegEx);
      return emptyStringRegExp;
    }
    // remove a leading ^ and a trailing $ if any
    onlyIfFileURIMatchesRegEx = onlyIfFileURIMatchesRegEx.replace(new RegExp("^\\^?(.*?)\\$?$"), "$1");
    // remove a leading file:// if any
    onlyIfFileURIMatchesRegEx = onlyIfFileURIMatchesRegEx.replace(new RegExp("^file://(.*)$"), "$1");
    // resolve a leading ~ if any
    var hasLeadingTilde = new RegExp("^~.*$").test(onlyIfFileURIMatchesRegEx);
    var hasLeadingSlash = new RegExp("^/.*$").test(onlyIfFileURIMatchesRegEx);
    if (hasLeadingTilde) {
      // replace ~ with homeDir URI, which includes a leading file://
      onlyIfFileURIMatchesRegEx = OS.Path.toFileURI(OS.Constants.Path.homeDir) + onlyIfFileURIMatchesRegEx.substring(1);
    } else if (hasLeadingSlash) {
      // prepend file://
      onlyIfFileURIMatchesRegEx = "file://" + onlyIfFileURIMatchesRegEx;
    } else { // apparently not absolute
      console.error("unacceptable onlyIfFileURIMatchesRegEx", prefs.onlyIfFileURIMatchesRegEx);
      return emptyStringRegExp;
    }
    // prepend ^ and append $
    onlyIfFileURIMatchesRegEx = "^" + onlyIfFileURIMatchesRegEx + "$";
    //
    //console.log("from prefs.onlyIfFileURIMatchesRegEx got", onlyIfFileURIMatchesRegEx);
    try { // common case
      return new RegExp(onlyIfFileURIMatchesRegEx);
    } catch (e) {
      console.error("invalid onlyIfFileURIMatchesRegEx", prefs.onlyIfFileURIMatchesRegEx);
      return emptyStringRegExp;
    }
  };

  var createActivePageMod = function createActivePageMod () {
    // getting regular expressions here avoids repeated function calls
    var onlyIfDocumentURIMatchesRegExp = getOnlyIfDocumentURIMatchesRegExp();
    var onlyIfFileURIMatchesRegExp = getOnlyIfFileURIMatchesRegExp();
    return pageMod.PageMod({
      include: onlyIfDocumentURIMatchesRegExp,
      contentScriptWhen: "start",
      contentScript:
        "var serNo = 1001;" +
        "var onlyIfFileURIMatchesRegExp = new RegExp(self.options.onlyIfFileURIMatchesRegExpSource);" +
        "var nrvrGetTextFile = function nrvrGetTextFile(fileUrl, gotFileCallback) {" +
        "  try {" +
             // trim fileUrl at # if any
        "    fileUrl = fileUrl.replace(new RegExp('^([^#]*).*$'), '$1');" +
             // turn relative into absolute, if relative
        "    var absoluteFileUrl = new URL(fileUrl, document.location.href);" +
        "    if (onlyIfFileURIMatchesRegExp.test(absoluteFileUrl.href)) {" +
               // ask more privileged code to get text
        "      self.port.once('nrvrFileProtocolGotText' + serNo, function(messagePayload) {" +
                 // an object as if a simplified version of an XMLHttpRequest
        "        gotFileCallback(messagePayload.responseText, messagePayload.status);" +
        "      });" +
        "      self.port.emit('nrvrFileProtocolGetText', { fileUrl: absoluteFileUrl.href, serNo: serNo++ });" +
        "    } else {" +
               // rather traditionally get text
               // note http://www.w3.org/TR/XMLHttpRequest/
        "      var xhr = new XMLHttpRequest();" +
        "      xhr.onloadend = function () {" +
                 // intentionally asynchronous to a fault,
                 // a safeguard against onloadend ever being call synchronously,
                 // ensure consistency for easier consumption
        "        window.setTimeout(function () {" +
        "          gotFileCallback(xhr.responseText, xhr.status);" +
        "        }, 0);" +
        "      };" +
        "      xhr.open('GET', absoluteFileUrl, true);" +
        "      xhr.responseType = 'text';" +
        "      xhr.send();" +
        "    }" +
        "  } catch (e) {" +
        "    console.error('error attempting to GET', absoluteFileUrl.href, e);" +
             // intentionally asynchronous even when failing this way, consistency for easier consumption
        "    window.setTimeout(function () {" +
        "      gotFileCallback('', 0);" +
        "    }, 0);" +
        "  }" +
        "};" +
        "exportFunction(nrvrGetTextFile, unsafeWindow, {defineAs: 'nrvrGetTextFile'});",
      contentScriptOptions: {
        onlyIfFileURIMatchesRegExpSource: onlyIfFileURIMatchesRegExp.source,
      },
      onAttach: function(worker) {
        // getting regular expressions here would be somewhat more responsive but not perfect either, e.g. wouldn't change include option
        worker.port.on('nrvrFileProtocolGetText', function(messagePayload) {
          // getting regular expressions here would be even more responsive but not perfect either, e.g. wouldn't change include option
          var pageUrl = worker.url;
          var fileUrl = messagePayload.fileUrl;
          var serNo = messagePayload.serNo;
          var returnMessageName = 'nrvrFileProtocolGotText' + serNo; // same for success and failure
          var emitFailureMessage = function() {
            worker.port.emit(
              returnMessageName,
              Cu.waiveXrays({ status: 0, statusText: "", responseText: "" }));
          }
          //
          // trim pageUrl at # if any
          pageUrl = pageUrl.replace(new RegExp("^([^#]*).*$"), "$1");
          // possibly redundant safeguard to ensure pageUrl starts with file://
          if (!new RegExp("^file://.*$").test(pageUrl)) {
            console.error("not allowed unless page URL has file:// schema");
            return emitFailureMessage();
          }
          // possibly redundant safeguard to ensure pageUrl complies with onlyIfDocumentURIMatchesRegEx
          if (!onlyIfDocumentURIMatchesRegExp.test(pageUrl)) {
            console.error("not allowed unless page URL matches regular expression");
            return emitFailureMessage();
          }
          //
          // trim fileUrl at # if any
          fileUrl = fileUrl.replace(new RegExp("^([^#]*).*$"), "$1");
          // turn relative into absolute, if relative
          // per https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/url
          try { // common case
            var absoluteFileUrl = new urls.URL(fileUrl, pageUrl);
          } catch (e) {
            console.error("apparently not a valid URI");
            return emitFailureMessage();
          }
          // possibly redundant safeguard to ensure absoluteFileUrl.href starts with file://
          if (!new RegExp("^file://.*$").test(absoluteFileUrl.href)) {
            console.error("not allowed unless file URL has file:// schema");
            return emitFailureMessage();
          }
          // ensure absoluteFileUrl.href complies with onlyIfFileURIMatchesRegEx
          if (!onlyIfFileURIMatchesRegExp.test(absoluteFileUrl.href)) {
            console.error("not allowed unless file URL matches regular expression");
            return emitFailureMessage();
          }
          //
          // note http://www.w3.org/TR/XMLHttpRequest/
          // versus https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/net_xhr
          var xhr = new XMLHttpRequest();
          xhr.onloadend = function() {
            worker.port.emit(returnMessageName,
              // an object as if a simplified version of this XMLHttpRequest
              Cu.waiveXrays(
                { status: this.status,
                  statusText: this.statusText,
                  responseText: this.responseText,
                }));
          };
          try {
            xhr.open('GET', absoluteFileUrl, true);
            xhr.responseType = 'text';
            xhr.send();
          } catch (e) {
            console.error(e);
            return emitFailureMessage();
          }
        });
      },
    });
  };

  var activePageMod = null;
  var onRegExpsChange = function onRegExpsChange () {
    if (activePageMod) {
      activePageMod.destroy();
      activePageMod = null;
    }
    activePageMod = createActivePageMod();
  };
  // initial invocation
  onRegExpsChange();
  // invoke when preferences change
  require("sdk/simple-prefs").on("onlyIfDocumentURIMatchesRegEx", onRegExpsChange);
  require("sdk/simple-prefs").on("onlyIfFileURIMatchesRegEx", onRegExpsChange);

  // the UI button is merely informational
  // https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/ui
  // https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/ui_button_action
  var newActionButton = function newActionButton () {
    return uiModule.ActionButton({
      // mandatory string used to identify your action button in order to
      // save its location when the user moves it in the browser;
      // has to be unique and must not be changed over time
      id: "file-scheme-get-from-script-1",

      label: friendlyName,

      icon: "./fileschemeget.png",

      // no function to trigger when the action button is clicked
      disabled: true,

      // no function to trigger when the action button is clicked
      });
  };

  var actionButton = null;
  var setActionButtonExistence = function setActionButtonExistence (toExist) {
    if (actionButton && toExist) {
      return;
    }
    if (!actionButton && !toExist) {
      return;
    }
    if (toExist) {
      actionButton = newActionButton();
    } else {
      actionButton.destroy();
      actionButton = null;
    }
  };

  var onShowActionButtonChange = function onShowActionButtonChange () {
    var prefs = require("sdk/simple-prefs").prefs;
    setActionButtonExistence(prefs.showActionButton);
  };
  // initial invocation
  onShowActionButtonChange();
  // invoke when preferences change
  require("sdk/simple-prefs").on("showActionButton", onShowActionButtonChange);
};

