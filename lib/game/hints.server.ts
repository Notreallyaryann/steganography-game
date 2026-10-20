/** SERVER ONLY. Never import this from a client component. */
export const HINTS: Record<string, string[]> = {
  "mission-01": [
    "Start in the bit-plane viewer. Plane 1 of each channel is the least visible one.",
    "The defaults in the extractor are plane 1, all three channels, MSB first, row by row.",
    "Just press Extract with the default settings. The codeword is in the message.",
  ],
  "mission-02": [
    "In the viewer, flip through the planes. Natural photos look smooth; hidden data looks like static.",
    "The static appears in only one colour channel.",
    "Plane 3 of the green channel. Set the extractor to match.",
  ],
  "mission-03": [
    "Look at where the static sits in the viewer. Is it a band across the top, or a band down the side?",
    "The static runs down the left edge, so the data was written column by column.",
    "Plane 2, red and blue channels only, column scan, and the bits are written least-significant first.",
  ],
  "mission-04": [
    "Extract with the default settings first. The result is text made of letters and digits, not words.",
    "It is base64. Decode it, and you get bytes that still look like noise.",
    "XOR those bytes with the key FALCON, then read the result as text.",
  ],
};
