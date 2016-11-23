function Dispatcher(){
    this.events=[];
}
Dispatcher.prototype.addEventListener=function(event,callback){
    this.events[event] = this.events[event] || [];
    if ( this.events[event] ) {
        this.events[event].push(callback);
    }
}
Dispatcher.prototype.removeEventListener=function(event,callback){
    if ( this.events[event] ) {
        var listeners = this.events[event];
        for ( var i = listeners.length-1; i>=0; --i ){
            if ( listeners[i] === callback ) {
                listeners.splice( i, 1 );
                return true;
            }
        }
    }
    return false;
}
Dispatcher.prototype.dispatch = function(event, data) {
    // default val for data;
    data = data || {};

    if(this.events[event])
    {
        var listeners = this.events[event];
        var len = listeners.length;

        while(len--)
        {
            listeners[len](data);
        }
    }
}

function Slext(settings) {
    this.style = null;
    this.setStyles = function() {
        if (this.style != null) {
            this.style.remove();
        }
        this.style = insertStylerules(`
        .ui-layout-container, .toolbar, .ui-layout-resizer {
            background-color:${settings.backgroundColor} !important;
        }
        .entity-name {
            color:${settings.fileColor} !important;
        }
        .entity-name:hover {
            color: ${settings.fileColorHover} !important;
        }

        ::-webkit-scrollbar {
          width: 10px;
        }
         
        ::-webkit-scrollbar-track {
          background: ${settings.scrollbarBackgroundColor};
        }
         
        ::-webkit-scrollbar-thumb {
          background: ${settings.scrollbarThumbColor}; 
        }

        .loading-panel, .loading-screen {
            background-color: ${settings.loadingBackgroundColor} !important;
        }
        .loading-screen .container h3 {
            color:${settings.loadingTextColor};
        }`);
    }
    this.setStyles();

    settings.addEventListener("themeChanged", function() {
        self.setStyles();
    });

    var self = this;
    Dispatcher.call(this);

    this.Files = indexAllFiles();
    // watch for changes in file tree
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var obs = new MutationObserver(function(mutations, observer) {
        if(mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
            self.Files = indexAllFiles();
            self.dispatch("FileTreeChanged");
        }
    });
    obs.observe( $(".file-tree-inner")[0], { childList:true, subtree:true });

    var fileClickListener = $("html").on("click", ".entity-name.ng-isolate-scope.ui-draggable.ui-draggable-handle", function(evt) {
        var el = this;
        self.dispatch("FileClicked", {event: evt, file: newFile(el)});
    });


    $("html").on("click", "div.pdf-viewer.ng-scope, .online-user", function() {
        setTimeout(function() {
            var selected = $('.selected').find(".entity-name.ng-isolate-scope.ui-draggable.ui-draggable-handle")[0];
            self.dispatch("PdfClicked", newFile(selected));
        }, 1000);
    });

    $("html").on("click", 'a[ng-click="gotoUser(user)"]', function() {
        setTimeout(function() {
            var selected = $('.selected').find(".entity-name.ng-isolate-scope.ui-draggable.ui-draggable-handle")[0];
            self.dispatch("UserClicked", newFile(selected));
        }, 1000);
    });
    this.getCurrentFile = function() {
        return newFile($('.selected').find(".entity-name.ng-isolate-scope.ui-draggable.ui-draggable-handle")[0]);
    }
    this.isFullScreenPdf = function() {
        var pdfButton = $('li[ng-controller="PdfViewToggleController"]');
        return (pdfButton.length && pdfButton.hasClass("selected"));
    }
    this.goToFullScreenPdf = function() {
        var pdfButton = $('div[ng-click="togglePdfView()"]');
        if (pdfButton.length) {
            pdfButton.click();
        }
    }
}

Slext.prototype = new Dispatcher();

Slext.prototype.constructor = Slext;

Slext.prototype.Files = [];

function indexAllFiles() {
    var allFiles = [];

    $('file-entity > li.ng-scope').each(
        function() {
            if(isFile($(this))) {
                allFiles.push(newFile($(this).find(".entity-name.ng-isolate-scope.ui-draggable.ui-draggable-handle")[0]));
            }
        }
    );
    return allFiles;

}

function isFile(el) {
    return $(el).children('div.entity[ng-if="entity.type != \'folder\'"]').length == 1;
}

function newFile(el) {
    var file = {el: el, name: getname(el), dir: getDir(el)};
    file.path = getDir(el)+getname(el);
    return file;
}

function getname(el) {
    return $(el).find("span.ng-binding").eq(0).text().replace(" ", "");
}

function getDir(selectedElement) {
    var folders = $(selectedElement).parentsUntil().filter("div[ng-controller='FileTreeFolderController']");
    var path = "";
    for (var i = folders.length - 1; i >= 0; i--) {
        var folderNameElement = $(folders[i]).find("div div span.ng-binding")[0];
        path += ($(folderNameElement).text().replace(" ", "")) + "/";
    }
    return path;
}

function insertStylerules(style) {
    var style = $("<style type='text/css'> " + style + "</style>");
    style.appendTo("head");
    return style;
}