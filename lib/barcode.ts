/* ============================================================
   Code 39, by hand. The receipt wants a barcode that is actually its
   reference number, not a picture of one — and a barcode library is 30kB to
   draw some rectangles.

   Every character is nine elements: five bars and four spaces, alternating,
   three of the nine wide and six narrow (3:1). `1` marks a wide element.
   The symbol is wrapped in the start/stop character `*`.
   ============================================================ */

const C39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
  "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
  "8": "100100100", "9": "001100100",
  A: "100001001", B: "001001001", C: "101001000", D: "000011001",
  E: "100011000", F: "001011000", G: "000001101", H: "100001100",
  I: "001001100", J: "000011100", K: "100000011", L: "001000011",
  M: "101000010", N: "000010011", O: "100010010", P: "001010010",
  Q: "000000111", R: "100000110", S: "001000110", T: "000010110",
  U: "110000001", V: "011000001", W: "111000000", X: "010010001",
  Y: "110010000", Z: "011010000",
  "-": "010000101", "*": "010010100",
};

/** The bars of `text` as x/width pairs in narrow-element units, plus the total
 *  width so the caller can set a viewBox and let it scale to its column. */
export function code39(text: string) {
  const chars = ["*", ...text.toUpperCase().split("").filter((c) => C39[c]), "*"];
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    C39[ch].split("").forEach((wide, j) => {
      const w = wide === "1" ? 3 : 1;
      // even elements are bars, odd are the spaces between them
      if (j % 2 === 0) bars.push({ x, w });
      x += w;
    });
    // one narrow space separates each character from the next
    if (i < chars.length - 1) x += 1;
  });
  return { bars, width: x };
}
