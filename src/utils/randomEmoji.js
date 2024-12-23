function randomEmoji() {
    const emojiLibrary = [
        "😀",
        "😭",
        "😂",
        "😍",
        "😜",
        "😎",
        "😡",
        "😱",
        "😇",
        "💀",
        "😢",
        "😈",
        "👿",
    ];

    return emojiLibrary[Math.floor(Math.random() * emojiLibrary.length)];
}

module.exports = {
    randomEmoji,
};
