export function compileRegex(input, ci = true) {
    if (input === '') return null;
    try {
        return new RegExp(input, ci ? 'i' : '');
    } catch {
        return false;
    }
}

export function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function highlight(text, regex) {
    const str = String(text);
    if (!regex) return escapeHTML(str);

    const global = new RegExp(regex.source, regex.flags + 'g');
    let out = '';
    let last = 0;
    for (const match of str.matchAll(global)) {
        if (match[0] === '') continue;
        out += escapeHTML(str.slice(last, match.index)) + '<mark>' + escapeHTML(match[0]) + '</mark>';
        last = match.index + match[0].length;
    }
    return out + escapeHTML(str.slice(last));
}