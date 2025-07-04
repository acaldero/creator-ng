import { decode_test } from "../common.mjs";
Deno.test("decode_instruction - fdiv.d instruction 1", () =>
    decode_test("00011010001000001000000001010011", "fdiv.d f0 f1 f2 rne"),
);

Deno.test("decode_instruction - fdiv.d instruction 2", () =>
    decode_test("00011010011000101001001001010011", "fdiv.d f4 f5 f6 rtz"),
);

Deno.test("decode_instruction - fdiv.d instruction 3", () =>
    decode_test("00011010101001001010010001010011", "fdiv.d f8 f9 f10 rdn"),
);

Deno.test("decode_instruction - fdiv.d instruction 4", () =>
    decode_test("00011010111001101011011001010011", "fdiv.d f12 f13 f14 rup"),
);

Deno.test("decode_instruction - fdiv.d instruction 5", () =>
    decode_test("00011011001010001100100001010011", "fdiv.d f16 f17 f18 rmm"),
);

Deno.test("decode_instruction - fdiv.d instruction 6", () =>
    decode_test("00011011011010101111101001010011", "fdiv.d f20 f21 f22"),
);

Deno.test("decode_instruction - fdiv.d instruction 7", () =>
    decode_test("00011010000000000111000001010011", "fdiv.d f0 f0 f0"),
);

Deno.test("decode_instruction - fdiv.d instruction 8", () =>
    decode_test("00011011111111111111111111010011", "fdiv.d f31 f31 f31"),
);

Deno.test("decode_instruction - fdiv.d instruction 9", () =>
    decode_test("00011011111100000111000001010011", "fdiv.d f0 f0 f31"),
);

Deno.test("decode_instruction - fdiv.d instruction 10", () =>
    decode_test("00011010000011111111111111010011", "fdiv.d f31 f31 f0"),
);

Deno.test("decode_instruction - fdiv.d instruction 11", () =>
    decode_test("00011010001100010111000011010011", "fdiv.d f1 f2 f3"),
);

Deno.test("decode_instruction - fdiv.d instruction 12", () =>
    decode_test("00011011111010100111010101010011", "fdiv.d f10 f20 f30"),
);

Deno.test("decode_instruction - fdiv.d instruction 13", () =>
    decode_test("00011011010101110111001111010011", "fdiv.d f7 f14 f21"),
);

Deno.test("decode_instruction - fdiv.d instruction 14", () =>
    decode_test("00011010010101010001101001010011", "fdiv.d f20 f10 f5 rtz"),
);

Deno.test("decode_instruction - fdiv.d instruction 15", () =>
    decode_test("00011010111100101010110011010011", "fdiv.d f25 f5 f15 rdn"),
);

Deno.test("decode_instruction - fdiv.d instruction 16", () =>
    decode_test("00011010100011000011100001010011", "fdiv.d f16 f24 f8 rup"),
);

Deno.test("decode_instruction - fdiv.d instruction 17", () =>
    decode_test("00011011000000000100111111010011", "fdiv.d f31 f0 f16 rmm"),
);

Deno.test("decode_instruction - fdiv.d instruction 18", () =>
    decode_test("00011010000110110111101101010011", "fdiv.d f22 f22 f1"),
);

Deno.test("decode_instruction - fdiv.d instruction 19", () =>
    decode_test("00011010001100011111000111010011", "fdiv.d f3 f3 f3"),
);

Deno.test("decode_instruction - fdiv.d instruction 20", () =>
    decode_test("00011011110100010111111011010011", "fdiv.d f29 f2 f29"),
);
