export function generateRowLabels(startRow, count) {
    const rows = [];
    let current = startRow;

    for (let i = 0; i < count; i++) {
        rows.push(current);

        if (current.length === 1) {
            if (current === "Z") {
                current = "AA";
            } else {
                current = String.fromCharCode(current.charCodeAt(0) + 1);
            }
        } else if (current.length === 2) {
            const first = current.charAt(0);
            const second = current.charAt(1);
            if (second === "Z") {
                current = `${String.fromCharCode(first.charCodeAt(0) + 1)}A`;
            } else {
                current = first + String.fromCharCode(second.charCodeAt(0) + 1);
            }
        }
    }

    return rows;
}

export function toNumber(str) {
    return str.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
}

export function toLetters(num) {
    let n = num;
    let res = "";
    while (n > 0) {
        const rem = (n - 1) % 26;
        res = String.fromCharCode(65 + rem) + res;
        n = Math.floor((n - 1) / 26);
    }
    return res;
}
