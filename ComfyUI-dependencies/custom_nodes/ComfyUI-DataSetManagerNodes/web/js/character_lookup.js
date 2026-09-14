import { app } from "../../scripts/app.js";

// Copies text to the clipboard, with a fallback for contexts where the
// modern Clipboard API isn't available (older browsers, some embedded
// webviews). navigator.clipboard requires a "secure context" — this is
// satisfied automatically for http://localhost / http://127.0.0.1, which
// is how ComfyUI is normally accessed, so this should work out of the box
// for a typical local install.
async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // fall through to legacy method below
        }
    }
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        return ok;
    } catch (err) {
        return false;
    }
}

app.registerExtension({
    name: "ClearableTextInput.DanbooruCharacterLookup",
    beforeRegisterNodeDef(nodeType, nodeData) {
        // Registered as "DSM Danbooru Character Lookup" — see
        // danbooru_character_detect/__init__.py for the rename.
        if (nodeData.name !== "DSM Danbooru Character Lookup") return;

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            onNodeCreated?.apply(this, arguments);

            // `serialize: false` is the ComfyUI-native way to mark a widget
            // as UI-only. Without it, ComfyUI includes this widget's value
            // in the prompt sent to Python (keyed by its name, "Copy") when
            // the workflow runs — and since
            // DanbooruCharacterLookup.lookup() only accepts `character`,
            // that extra key breaks execution with "unexpected keyword
            // argument 'Copy'". This is the same fix ComfyUI's own core
            // team used for their upload button — see
            // https://github.com/Comfy-Org/ComfyUI/issues/2093
            const button = this.addWidget(
                "button",
                "Copy",
                null,
                async () => {
                    const widget = this.widgets.find((w) => w.name === "character");
                    const value = widget ? widget.value : "";
                    if (!value) return;

                    // Copy in SD prompt-safe form: literal parens escaped as
                    // "\(" "\)" so pasting straight into a prompt box
                    // doesn't get read as emphasis weighting.
                    const escaped = value.replace(/\(/g, "\\(").replace(/\)/g, "\\)");

                    const ok = await copyToClipboard(escaped);
                    const original = button.name;
                    button.name = ok ? "Copied!" : "Copy failed";
                    this.setDirtyCanvas(true, true);
                    setTimeout(() => {
                        button.name = original;
                        this.setDirtyCanvas(true, true);
                    }, 1000);
                },
                { serialize: false }
            );
        };
    },
});
