function decodeSignature(signature) {
  const sig = signature.slice(2);
  const r = `0x${sig.substring(0, 64)}`;
  const s = `0x${sig.substring(64, 128)}`;
  const v = `0x${sig.substring(128, 130)}`;
  return {v, r, s};
}

module.exports = {
  decodeSignature,
};
