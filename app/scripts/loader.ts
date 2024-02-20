import "reflect-metadata";
import { Container } from "typedi";
import { Slext } from "./slext";
import { TabModule } from "./tabs";
import { Settings } from "./settings";
import { CommandPalette } from "./commandpalette/commandpalette";
import { ThemeModule } from "./theme";
import { EditorCommands } from "./editorcommands/editorcommands";
import { PageHook } from "./pagehook.service";
import { ElementHiderModule } from "./elementhider";
import { PdfTweaksModule } from "./pdftweaks";
import { Utils } from "./utils";
import { Shortcut } from "./shortcut.service";

function projectLoaded(url) {
    return Utils.isShareLatex(url) || Utils.isOverleaf(url);
}

(function () {
    const i = setInterval(() => {
        if (projectLoaded(window.location.href)) {
            clearInterval(i);
            PageHook.inject();
            const slext: Slext = Container.get(Slext);
            const interval = setInterval(() => {
                if (!slext.isLoaded()) return;
                PageHook.initialize();
                clearInterval(interval);
                Container.get(Settings);
                Container.get(Shortcut);
                Container.get(ThemeModule);
                Container.get(TabModule);
                Container.get(CommandPalette);
                Container.get(EditorCommands);
                Container.get(ElementHiderModule);
                Container.get(PdfTweaksModule);
            }, 100);
        }
    }, 500);
})();
