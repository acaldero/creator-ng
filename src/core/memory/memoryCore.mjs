/*
 *  Copyright 2018-2025 Felix Garcia Carballeira, Alejandro Calderon Mateos, Diego Camarmas Alonso
 *
 *  This file is part of CREATOR.
 *
 *  CREATOR is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  CREATOR is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with CREATOR.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
"use strict";
import { ENDIANNESS, WORDSIZE } from "../core.mjs";
import { creator_memory_value_by_type } from "./memoryManager.mjs";
import { creator_memory_updateall } from "./memoryViewManager.mjs";
import { hex2float, hex2double } from "../utils/utils.mjs";

export let main_memory = [];
//  [
//    addr: { addr: addr, bin: "00", def_bin: "00", tag: null, data_type: ref <main_memory_datatypes>, reset: true, break: false },
//    ...
//  ]

export let main_memory_datatypes = {};
//  {
//    addr: { address: addr, "type": type, "address": addr, "value": value, "default": "00", "size": 0 },
//    ...
//  }

/********************
 * Internal API     *
 ********************/
// Address

export function main_memory_get_addresses() {
    return Object.keys(main_memory).sort(function (a, b) {
        const ia = parseInt(a);
        const ib = parseInt(b);
        if (ia > ib) return -1;
        if (ib > ia) return 1;
        return 0;
    });
}

export function main_memory_datatype_get_addresses() {
    return Object.keys(main_memory_datatypes).sort(function (a, b) {
        const ia = parseInt(a);
        const ib = parseInt(b);
        if (ia > ib) return -1;
        if (ib > ia) return 1;
        return 0;
    });
}
// Full value (stored in address)
function main_memory_packs_forav(addr, value) {
    return {
        addr: addr,
        bin: value,
        def_bin: "00",
        tag: null,
        data_type: null,
        reset: true,
        break: false,
    };
}
function main_memory_datatypes_packs_foravt(addr, value, type, size) {
    let default_value = "00";

    if (typeof main_memory_datatypes[addr] !== "undefined") {
        default_value = main_memory_datatypes[addr].default_value;
    }

    return {
        address: addr,
        value: value,
        default: default_value,
        type: type,
        size: size,
    };
}
// reset (set to defaults) and clear (remove all values)

export function main_memory_reset() {
    let i = 0;

    // reset memory
    let addrs = main_memory_get_addresses();
    for (i = 0; i < addrs.length; i++) {
        main_memory[addrs[i]].bin = main_memory[addrs[i]].def_bin;
    }

    // reset datatypes
    addrs = main_memory_datatype_get_addresses();
    for (i = 0; i < addrs.length; i++) {
        main_memory_datatypes[addrs[i]].value =
            main_memory_datatypes[addrs[i]].default;
    }
}

export function main_memory_clear() {
    // reset memory and datatypes
    main_memory = [];
    main_memory_datatypes = {};
}
//// Read/write (1/3): object level (compilation)

export function main_memory_read(addr) {
    if (typeof main_memory[addr] !== "undefined") {
        return main_memory[addr];
    }

    return main_memory_packs_forav(addr, "00");
}
function main_memory_write(addr, value) {
    main_memory[addr] = value;
}

export function main_memory_zerofill(addr, size) {
    const base = {
        addr: 0,
        bin: "00",
        def_bin: "00",
        tag: null,
        data_type: null,
        reset: true,
        break: false,
    };

    // Thanks for this line to Gonzalo Juarez Tello :-)
    const value = Array(size)
        .fill(base)
        .map((x, i) => {
            return { ...x, addr: addr + i };
        });

    main_memory.splice(addr, size, ...value);
}
//// Read/write (2/3): byte level (execution)
export function main_memory_read_value(addr) {
    // main_memory_read_value  ( addr: integer )
    return main_memory_read(addr).bin;
}
export function main_memory_write_value(addr, value) {
    // main_memory_write_value ( addr: integer,  value: string (hexadecimal) )
    const value_obj = main_memory_read(addr);
    value_obj.bin = value;
    main_memory_write(addr, value_obj);
}

export function main_memory_write_tag(addr, tag) {
    // main_memory_write_tag ( addr: integer,  tag: string )
    const value_obj = main_memory_read(addr);
    value_obj.tag = tag;
    main_memory_write(addr, value_obj);
}
export function main_memory_read_default_value(addr) {
    return main_memory_read(addr).def_bin;
}
//// Read/write nbytes
function main_memory_read_nbytes(addr, n) {
    addr = BigInt(addr);
    let value = "";

    if (ENDIANNESS === "big_endian") {
        // Big-endian: concatenate bytes from low address to high address
        for (let i = 0n; i < BigInt(n); i++) {
            value += main_memory_read_value(addr + i);
        }
    } else {
        // Little-endian: concatenate bytes from high address to low address
        for (let i = BigInt(n) - 1n; i >= 0n; i--) {
            value += main_memory_read_value(addr + i);
        }
    }

    return value;
}

function main_memory_write_nbytes(addr, value, n, type = null) {
    const value_str = value.toString(16).padStart(2 * n, "0");
    let chunks = value_str.match(/.{1,2}/g);

    if (ENDIANNESS === "little_endian") {
        // Reverse the order of chunks for little-endian
        chunks = chunks.slice(0, n).reverse();
    }

    for (let i = 0n; i < BigInt(n); i++) {
        main_memory_write_value(BigInt(addr) + i, chunks[i]);
    }
}
//// Read/write (3/3): DATAtype level (byte, ..., integer, space, ...)
const string_length_limit = 4 * 1024;
function create_memory_read_string(addr) {
    let ch = "";
    let ret_msg = "";

    for (let i = 0; i < string_length_limit; i++) {
        ch = main_memory_read_value(addr + i);
        if (ch == "00") {
            return ret_msg;
        }

        ret_msg += String.fromCharCode(parseInt(ch, 16));
    }

    return (
        ret_msg +
        "... (string length greater than " +
        string_length_limit +
        " chars)"
    );
}

export function main_memory_read_bydatatype(addr, type) {
    let ret = 0n;
    const word_size_bytes = WORDSIZE / 8;

    switch (type) {
        case "b":
        case "bu":
        case "byte":
            ret = BigInt("0x" + main_memory_read_value(addr));
            break;

        case "h":
        case "hu":
        case "half":
        case "half_word":
            ret = BigInt(
                "0x" + main_memory_read_nbytes(addr, word_size_bytes / 2),
            );
            break;

        case "w":
        case "wu":
        case "integer":
        case "word":
            ret = BigInt("0x" + main_memory_read_nbytes(addr, word_size_bytes));
            break;

        // case "float":
        //     ret = "0x" + main_memory_read_nbytes(addr, word_size_bytes);
        //     ret = hex2float(ret);
        //     break;

        // case "float64":
        //     ret = "0x" + main_memory_read_nbytes(addr, word_size_bytes * 2);
        //     ret = hex2double(ret);
        //     break;

        case "d":
        case "double":
        case "double_word":
            ret = "0x" + main_memory_read_nbytes(addr, word_size_bytes * 2);
            break;

        case "c":
        case "cu":
        case "char": {
            const ch = main_memory_read_value(addr);
            ret = String.fromCharCode(Number(BigInt("0x" + ch)));
            break;
        }

        case "asciiz":
        case "string":
        case "ascii_null_end":
            ret = create_memory_read_string(addr);
            break;

        case "ascii":
        case "ascii_not_null_end":
            // TODO
            break;

        case "space":
            // TODO
            break;
    }

    return ret;
}
function main_memory_datatypes_update(addr) {
    const data = main_memory_read(addr);
    const data_type = data.data_type;
    if (data_type != null) {
        const new_value = main_memory_read_bydatatype(addr, data_type.type);
        data_type.value = new_value;
        return true;
    }

    return false;
}
function main_memory_datatypes_update_or_create(addr, value_human, size, type) {
    let addr_i;

    // get main-memory entry for the associated byte at addr
    let data = main_memory_read(addr);

    // get associated datatype to this main-memory entry
    let data_type = data.data_type;

    // if not associated datatype, make on... otherwise update it
    if (data_type == null) {
        data_type = main_memory_datatypes_packs_foravt(
            addr,
            value_human,
            type,
            size,
        );
        main_memory_datatypes[addr] = data_type;
    } else {
        const new_value = main_memory_read_bydatatype(
            data_type.address,
            data_type.type,
        );
        data_type.value = new_value;
    }

    // update main-memory referencies...
    data = null;
    for (let i = 0n; i < BigInt(size); i++) {
        data = main_memory_read(BigInt(addr) + i);
        data.data_type = data_type;
        main_memory_write(BigInt(addr) + i, data);
    }
}

// eslint-disable-next-line max-lines-per-function
export function main_memory_write_bydatatype(addr, value, type, value_human) {
    let ret = 0x0;
    let size = 0;
    let convertedValue;
    const word_size_bytes = WORDSIZE / 8;

    // store byte to byte...
    switch (type) {
        case "b":
        case "byte":
            size = 1;
            convertedValue = creator_memory_value_by_type(value, "bu");
            ret = main_memory_write_nbytes(addr, convertedValue, size, type);
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;

        case "h":
        case "half":
        case "half_word":
            size = word_size_bytes / 2;
            convertedValue = creator_memory_value_by_type(value, "hu");
            ret = main_memory_write_nbytes(addr, convertedValue, size, type);
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;

        case "w":
        case "integer":
        case "float":
        case "word":
            size = word_size_bytes;
            convertedValue = creator_memory_value_by_type(value, "wu");
            ret = main_memory_write_nbytes(addr, convertedValue, size, type);
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;

        case "d":
        case "double":
        case "double_word":
            size = word_size_bytes * 2;
            ret = main_memory_write_nbytes(addr, value, size, type);
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;

        case "string":
        case "ascii_null_end":
        case "asciiz":
        case "ascii_not_null_end":
        case "ascii":
            let bytes = new Uint8Array(4);
            let encoder = new TextEncoder();
            for (const ch_h of value) {
                const n = encoder.encodeInto(ch_h, bytes).written;
                let ch = "";
                for (let i = 0; i < n; i++) {
                    ch += bytes[i].toString(16).padStart(2, "0");
                }
                main_memory_write_nbytes(addr, ch, n, type);
                main_memory_datatypes_update_or_create(addr, ch_h, n, "char");
                addr += n;
            }

            if (type != "ascii" && type != "ascii_not_null_end") {
                main_memory_write_nbytes(addr, "00", 1, type);
                main_memory_datatypes_update_or_create(addr, "0", 1, "char");
            }
            break;

        case "space":
            for (let i = 0; i < parseInt(value); i++) {
                main_memory_write_nbytes(addr + i, "00", 1, type);
                size++;
            }
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;

        case "instruction":
            size = Math.ceil(value.toString().length / 2);
            ret = main_memory_write_nbytes(addr, value, size, type);
            main_memory_datatypes_update_or_create(
                addr,
                value_human,
                size,
                type,
            );
            break;
    }

    // update view
    creator_memory_updateall();

    return ret;
}

/********************
 * Memory Persistence API *
 ********************/

/**
 * Serializes main memory to JSON format
 * @returns {string} JSON string of memory state
 */
export function main_memory_serialize() {
    // Create a simplified copy of memory structures to save
    const memoryState = {
        main_memory: {},
        main_memory_datatypes: main_memory_datatypes,
    };

    // Only save non-empty addresses to reduce size
    const addresses = main_memory_get_addresses();
    for (const addr of addresses) {
        memoryState.main_memory[addr] = main_memory[addr];
    }

    return JSON.stringify(memoryState);
}
/**
 * Restores memory state from a memoryState object
 * @param {Object} memoryState - The memory state to restore
 * @param {Object} memoryState.main_memory - The main memory to restore
 * @param {Object} memoryState.main_memory_datatypes - The main memory datatypes to restore
 * @return {boolean} - True if successful, false otherwise
 */
export function main_memory_restore(memoryState) {
    try {
        // Clear existing memory
        main_memory_clear();

        // Restore main_memory
        if (memoryState.main_memory) {
            for (const [addr, value] of Object.entries(
                memoryState.main_memory,
            )) {
                main_memory[addr] = value;
            }
        }

        // Restore main_memory_datatypes
        if (memoryState.main_memory_datatypes) {
            main_memory_datatypes = memoryState.main_memory_datatypes;
        }

        return true;
    } catch (error) {
        console.error("Failed to deserialize memory:", error);
        return false;
    }
}
