/*
 * Decimen Optical Transfer fountain codec
 * Adapted from https://github.com/bashalarmistalt/decimen-optical-transfer
 * Upstream commit: 13e86c26a187882637015b9267bb0361d67f1033
 * Copyright (c) 2026 BashAlarmist
 * SPDX-License-Identifier: MIT
 */
(function (global) {
  "use strict";

  const HEADER_LEN = 20;
  const MAGIC0 = 0xd1;
  const MAGIC1 = 0x0c;
  const LN2 = 0.6931471805599453;
  const SOLITON_C = 0.1;
  const SOLITON_DELTA = 0.5;

  function packFrame(header, block) {
    const out = new Uint8Array(HEADER_LEN + block.length);
    const view = new DataView(out.buffer);
    view.setUint8(0, MAGIC0);
    view.setUint8(1, MAGIC1);
    view.setUint16(2, header.sessionId, true);
    view.setUint32(4, header.seq, true);
    view.setUint16(8, header.k, true);
    view.setUint16(10, header.blockLen, true);
    view.setUint32(12, header.totalLen, true);
    view.setUint32(16, header.payloadFnv, true);
    out.set(block, HEADER_LEN);
    return out;
  }

  function parseFrame(bytes) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes || 0);
    if (bytes.length <= HEADER_LEN || bytes[0] !== MAGIC0 || bytes[1] !== MAGIC1) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const header = {
      sessionId: view.getUint16(2, true),
      seq: view.getUint32(4, true),
      k: view.getUint16(8, true),
      blockLen: view.getUint16(10, true),
      totalLen: view.getUint32(12, true),
      payloadFnv: view.getUint32(16, true)
    };
    if (!header.k || !header.blockLen || !header.totalLen) return null;
    if (bytes.length !== HEADER_LEN + header.blockLen) return null;
    return { header, block: bytes.subarray(HEADER_LEN) };
  }

  function fnv1a(bytes) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < bytes.length; index++) {
      hash ^= bytes[index];
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  function splitmix32(seed) {
    let state = seed | 0;
    return () => {
      state = (state + 0x9e3779b9) | 0;
      let value = state ^ (state >>> 16);
      value = Math.imul(value, 0x21f0aaad);
      value ^= value >>> 15;
      value = Math.imul(value, 0x735a2d97);
      value ^= value >>> 15;
      return value >>> 0;
    };
  }

  function deterministicLog(value) {
    let exponent = 0;
    let mantissa = value;
    while (mantissa >= 1.5) {
      mantissa /= 2;
      exponent++;
    }
    while (mantissa < 0.75) {
      mantissa *= 2;
      exponent--;
    }
    const z = (mantissa - 1) / (mantissa + 1);
    const z2 = z * z;
    let term = z;
    let sum = 0;
    for (let n = 1; n <= 21; n += 2) {
      sum += term / n;
      term *= z2;
    }
    return exponent * LN2 + 2 * sum;
  }

  function solitonCdf(k) {
    const cdf = new Float64Array(k);
    if (k === 1) {
      cdf[0] = 1;
      return cdf;
    }
    const robust = Math.max(1, SOLITON_C * deterministicLog(k / SOLITON_DELTA) * Math.sqrt(k));
    const spike = Math.min(k, Math.ceil(k / robust));
    let total = 0;
    for (let degree = 1; degree <= k; degree++) {
      const rho = degree === 1 ? 1 / k : 1 / (degree * (degree - 1));
      let tau = 0;
      if (degree < spike) tau = robust / (degree * k);
      else if (degree === spike) tau = (robust * Math.max(0, deterministicLog(robust / SOLITON_DELTA))) / k;
      total += rho + tau;
      cdf[degree - 1] = total;
    }
    for (let index = 0; index < k; index++) cdf[index] /= total;
    cdf[k - 1] = 1;
    return cdf;
  }

  function frameSeed(sessionId, sequence) {
    let hash = (Math.imul(sessionId + 1, 0x9e3779b1) ^ (sequence + 0x85ebca6b)) | 0;
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    return (hash ^ (hash >>> 16)) | 0;
  }

  function frameIndices(k, cdf, sessionId, sequence) {
    const random = splitmix32(frameSeed(sessionId, sequence));
    const sample = random() * 2 ** -32;
    let low = 0;
    let high = k - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (cdf[middle] >= sample) high = middle;
      else low = middle + 1;
    }
    const degree = Math.min(k, low + 1);
    if (degree > k >> 3) {
      const scratch = new Uint32Array(k);
      for (let index = 0; index < k; index++) scratch[index] = index;
      const result = new Array(degree);
      for (let index = 0; index < degree; index++) {
        const swapIndex = index + (random() % (k - index));
        const previous = scratch[index];
        scratch[index] = scratch[swapIndex];
        scratch[swapIndex] = previous;
        result[index] = scratch[index];
      }
      return result;
    }
    const result = new Set();
    while (result.size < degree) result.add(random() % k);
    return [...result];
  }

  function xorInto(target, source) {
    for (let index = 0; index < target.length; index++) {
      target[index] = (target[index] ^ source[index]) >>> 0;
    }
  }

  class LTEncoder {
    constructor(payload, blockLen, sessionId) {
      this.blockLen = blockLen;
      this.sessionId = sessionId;
      this.k = Math.max(1, Math.ceil(payload.length / blockLen));
      this.words = Math.ceil(blockLen / 4);
      this.blocks = new Uint32Array(this.k * this.words);
      const bytes = new Uint8Array(this.blocks.buffer);
      for (let block = 0; block < this.k; block++) {
        const source = payload.subarray(block * blockLen, Math.min((block + 1) * blockLen, payload.length));
        bytes.set(source, block * this.words * 4);
      }
      this.cdf = solitonCdf(this.k);
    }

    encode(sequence) {
      const indices = frameIndices(this.k, this.cdf, this.sessionId, sequence);
      const result = new Uint32Array(this.words);
      for (const block of indices) {
        const offset = block * this.words;
        for (let word = 0; word < this.words; word++) {
          result[word] = (result[word] ^ this.blocks[offset + word]) >>> 0;
        }
      }
      return new Uint8Array(result.buffer, 0, this.blockLen);
    }
  }

  class LTDecoder {
    constructor(k, blockLen, sessionId, totalLen) {
      this.k = k;
      this.blockLen = blockLen;
      this.sessionId = sessionId;
      this.totalLen = totalLen;
      this.words = Math.ceil(blockLen / 4);
      this.cdf = solitonCdf(k);
      this.solved = new Array(k).fill(null);
      this.byBlock = new Map();
      this.seen = new Set();
      this.solvedCount = 0;
      this.framesNew = 0;
      this.framesDup = 0;
    }

    get isComplete() {
      return this.solvedCount >= this.k;
    }

    addFrame(sequence, block) {
      if (this.seen.has(sequence)) {
        this.framesDup++;
        return;
      }
      this.seen.add(sequence);
      this.framesNew++;
      if (this.isComplete) return;
      const indices = new Set(frameIndices(this.k, this.cdf, this.sessionId, sequence));
      const words = new Uint32Array(this.words);
      new Uint8Array(words.buffer).set(block.subarray(0, this.blockLen));
      for (const index of [...indices]) {
        const solved = this.solved[index];
        if (!solved) continue;
        xorInto(words, solved);
        indices.delete(index);
      }
      if (indices.size === 0) return;
      if (indices.size === 1) {
        this.resolve(indices.values().next().value, words);
        return;
      }
      const pending = { idx: indices, words };
      for (const index of indices) {
        let waiting = this.byBlock.get(index);
        if (!waiting) {
          waiting = new Set();
          this.byBlock.set(index, waiting);
        }
        waiting.add(pending);
      }
    }

    resolve(firstBlock, firstWords) {
      const queue = [[firstBlock, firstWords]];
      while (queue.length) {
        const [block, words] = queue.pop();
        if (this.solved[block]) continue;
        this.solved[block] = words;
        this.solvedCount++;
        const waiting = this.byBlock.get(block);
        if (!waiting) continue;
        this.byBlock.delete(block);
        for (const pending of waiting) {
          xorInto(pending.words, words);
          pending.idx.delete(block);
          if (pending.idx.size !== 1) continue;
          const remaining = pending.idx.values().next().value;
          this.byBlock.get(remaining)?.delete(pending);
          if (!this.solved[remaining]) queue.push([remaining, pending.words]);
        }
      }
    }

    assemble() {
      if (!this.isComplete) return null;
      const result = new Uint8Array(this.totalLen);
      for (let block = 0; block < this.k; block++) {
        const start = block * this.blockLen;
        const length = Math.min(this.blockLen, this.totalLen - start);
        if (length > 0) result.set(new Uint8Array(this.solved[block].buffer, 0, length), start);
      }
      return result;
    }
  }

  global.DecimenOpticalTransfer = Object.freeze({
    HEADER_LEN,
    LTEncoder,
    LTDecoder,
    fnv1a,
    packFrame,
    parseFrame
  });
})(window);
