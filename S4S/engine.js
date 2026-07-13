/**
 * Chipmunk2D v7.0.3 — JavaScript port
 *
 * Original: https://github.com/slembcke/Chipmunk2D
 * License: MIT
 *
 * Core physics engine: space, body, shape (circle/segment/polygon/box),
 * arbiter, BB tree, hash set, array, collision detection.
 */

// ──────────────────────────── Constants ────────────────────────────
const PI = Math.PI;
const INFINITY = Infinity;
const FLT_MIN = 2.2250738585072014e-308;
const CPFLOAT_MIN = FLT_MIN;
const CP_NO_GROUP = 0;
const CP_ALL_CATEGORIES = ~0 >>> 0;
const CP_WILDCARD_COLLISION_TYPE = ~0 >>> 0;
const CP_MAX_CONTACTS_PER_ARBITER = 2;
const CP_BUFFER_BYTES = 32 * 1024;

const CP_BODY_TYPE_DYNAMIC = 0;
const CP_BODY_TYPE_KINEMATIC = 1;
const CP_BODY_TYPE_STATIC = 2;

const CP_CIRCLE_SHAPE = 0;
const CP_SEGMENT_SHAPE = 1;
const CP_POLY_SHAPE = 2;
const CP_NUM_SHAPES = 3;

const CP_ARBITER_STATE_FIRST_COLLISION = 0;
const CP_ARBITER_STATE_NORMAL = 1;
const CP_ARBITER_STATE_CACHED = 2;
const CP_ARBITER_STATE_IGNORE = 3;
const CP_ARBITER_STATE_INVALIDATED = 4;

const MAX_GJK_ITERATIONS = 30;
const MAX_EPA_ITERATIONS = 30;

// ──────────────────────────── cpVect ───────────────────────────────
function cpv(x, y) { return { x, y }; }
const cpvzero = cpv(0, 0);

function cpveql(a, b) { return a.x === b.x && a.y === b.y; }
function cpvadd(a, b) { return cpv(a.x + b.x, a.y + b.y); }
function cpvsub(a, b) { return cpv(a.x - b.x, a.y - b.y); }
function cpvneg(v) { return cpv(-v.x, -v.y); }
function cpvmult(v, s) { return cpv(v.x * s, v.y * s); }
function cpvdot(a, b) { return a.x * b.x + a.y * b.y; }
function cpvcross(a, b) { return a.x * b.y - a.y * b.x; }
function cpvperp(v) { return cpv(-v.y, v.x); }
function cpvrperp(v) { return cpv(v.y, -v.x); }
function cpvproject(v1, v2) { return cpvmult(v2, cpvdot(v1, v2) / cpvdot(v2, v2)); }
function cpvforangle(a) { return cpv(Math.cos(a), Math.sin(a)); }
function cpvtoangle(v) { return Math.atan2(v.y, v.x); }
function cpvrotate(v1, v2) { return cpv(v1.x * v2.x - v1.y * v2.y, v1.x * v2.y + v1.y * v2.x); }
function cpvunrotate(v1, v2) { return cpv(v1.x * v2.x + v1.y * v2.y, v1.y * v2.x - v1.x * v2.y); }
function cpvlengthsq(v) { return cpvdot(v, v); }
function cpvlength(v) { return Math.sqrt(cpvdot(v, v)); }
function cpvlerp(a, b, t) { return cpvadd(cpvmult(a, 1 - t), cpvmult(b, t)); }
function cpvnormalize(v) { return cpvmult(v, 1 / (cpvlength(v) + CPFLOAT_MIN)); }
function cpvslerp(v1, v2, t) {
  const dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
  const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
  if (omega < 1e-3) return cpvlerp(v1, v2, t);
  const denom = 1 / Math.sin(omega);
  return cpvadd(cpvmult(v1, Math.sin((1 - t) * omega) * denom), cpvmult(v2, Math.sin(t * omega) * denom));
}
function cpvslerpconst(v1, v2, a) {
  const dot = cpvdot(cpvnormalize(v1), cpvnormalize(v2));
  const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
  return cpvslerp(v1, v2, Math.min(a, omega) / omega);
}
function cpvclamp(v, len) { return cpvdot(v, v) > len * len ? cpvmult(cpvnormalize(v), len) : v; }
function cpvlerpconst(v1, v2, d) { return cpvadd(v1, cpvclamp(cpvsub(v2, v1), d)); }
function cpvdist(a, b) { return cpvlength(cpvsub(a, b)); }
function cpvdistsq(a, b) { return cpvlengthsq(cpvsub(a, b)); }
function cpvnear(a, b, dist) { return cpvdistsq(a, b) < dist * dist; }
function cpfmax(a, b) { return a > b ? a : b; }
function cpfmin(a, b) { return a < b ? a : b; }
function cpfabs(f) { return f < 0 ? -f : f; }
function cpfclamp(f, min, max) { return cpfmin(cpfmax(f, min), max); }
function cpfclamp01(f) { return cpfmax(0, cpfmin(f, 1)); }
function cpflerp(a, b, t) { return a * (1 - t) + b * t; }
function cpflerpconst(a, b, d) { return a + cpfclamp(b - a, -d, d); }

// ──────────────────────────── cpMat2x2 ────────────────────────────
function cpMat2x2New(a, b, c, d) { return { a, b, c, d }; }
function cpMat2x2Transform(m, v) { return cpv(v.x * m.a + v.y * m.b, v.x * m.c + v.y * m.d); }

// ──────────────────────────── cpBB ────────────────────────────────
function cpBBNew(l, b, r, t) { return { l, b, r, t }; }
function cpBBNewForExtents(c, hw, hh) { return cpBBNew(c.x - hw, c.y - hh, c.x + hw, c.y + hh); }
function cpBBNewForCircle(p, r) { return cpBBNewForExtents(p, r, r); }
function cpBBIntersects(a, b) { return a.l <= b.r && b.l <= a.r && a.b <= b.t && b.b <= a.t; }
function cpBBContainsBB(bb, other) { return bb.l <= other.l && bb.r >= other.r && bb.b <= other.b && bb.t >= other.t; }
function cpBBContainsVect(bb, v) { return bb.l <= v.x && bb.r >= v.x && bb.b <= v.y && bb.t >= v.y; }
function cpBBMerge(a, b) { return cpBBNew(cpfmin(a.l, b.l), cpfmin(a.b, b.b), cpfmax(a.r, b.r), cpfmax(a.t, b.t)); }
function cpBBExpand(bb, v) { return cpBBNew(cpfmin(bb.l, v.x), cpfmin(bb.b, v.y), cpfmax(bb.r, v.x), cpfmax(bb.t, v.y)); }
function cpBBCenter(bb) { return cpvlerp(cpv(bb.l, bb.b), cpv(bb.r, bb.t), 0.5); }
function cpBBArea(bb) { return (bb.r - bb.l) * (bb.t - bb.b); }
function cpBBMergedArea(a, b) { return (cpfmax(a.r, b.r) - cpfmin(a.l, b.l)) * (cpfmax(a.t, b.t) - cpfmin(a.b, b.b)); }
function cpBBSegmentQuery(bb, a, b) {
  const delta = cpvsub(b, a);
  let tmin = -INFINITY, tmax = INFINITY;
  if (delta.x === 0) {
    if (a.x < bb.l || bb.r < a.x) return INFINITY;
  } else {
    let t1 = (bb.l - a.x) / delta.x;
    let t2 = (bb.r - a.x) / delta.x;
    tmin = cpfmax(tmin, cpfmin(t1, t2));
    tmax = cpfmin(tmax, cpfmax(t1, t2));
  }
  if (delta.y === 0) {
    if (a.y < bb.b || bb.t < a.y) return INFINITY;
  } else {
    let t1 = (bb.b - a.y) / delta.y;
    let t2 = (bb.t - a.y) / delta.y;
    tmin = cpfmax(tmin, cpfmin(t1, t2));
    tmax = cpfmin(tmax, cpfmax(t1, t2));
  }
  if (tmin <= tmax && 0 <= tmax && tmin <= 1) return cpfmax(tmin, 0);
  return INFINITY;
}
function cpBBIntersectsSegment(bb, a, b) { return cpBBSegmentQuery(bb, a, b) !== INFINITY; }
function cpBBClampVect(bb, v) { return cpv(cpfclamp(v.x, bb.l, bb.r), cpfclamp(v.y, bb.b, bb.t)); }
function cpBBWrapVect(bb, v) {
  const dx = cpfabs(bb.r - bb.l);
  const modx = ((v.x - bb.l) % dx + dx) % dx;
  const dy = cpfabs(bb.t - bb.b);
  const mody = ((v.y - bb.b) % dy + dy) % dy;
  return cpv(modx + bb.l, mody + bb.b);
}
function cpBBOffset(bb, v) { return cpBBNew(bb.l + v.x, bb.b + v.y, bb.r + v.x, bb.t + v.y); }

// ──────────────────────────── cpTransform ─────────────────────────
const cpTransformIdentity = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };

function cpTransformNew(a, b, c, d, tx, ty) { return { a, b, c, d, tx, ty }; }
function cpTransformNewTranspose(a, c, tx, b, d, ty) { return { a, b, c, d, tx, ty }; }
function cpTransformInverse(t) {
  const inv_det = 1 / (t.a * t.d - t.c * t.b);
  return cpTransformNewTranspose(
    t.d * inv_det, -t.c * inv_det, (t.c * t.ty - t.tx * t.d) * inv_det,
    -t.b * inv_det, t.a * inv_det, (t.tx * t.b - t.a * t.ty) * inv_det
  );
}
function cpTransformMult(t1, t2) {
  return cpTransformNewTranspose(
    t1.a * t2.a + t1.c * t2.b, t1.a * t2.c + t1.c * t2.d, t1.a * t2.tx + t1.c * t2.ty + t1.tx,
    t1.b * t2.a + t1.d * t2.b, t1.b * t2.c + t1.d * t2.d, t1.b * t2.tx + t1.d * t2.ty + t1.ty
  );
}
function cpTransformPoint(t, p) { return cpv(t.a * p.x + t.c * p.y + t.tx, t.b * p.x + t.d * p.y + t.ty); }
function cpTransformVect(t, v) { return cpv(t.a * v.x + t.c * v.y, t.b * v.x + t.d * v.y); }
function cpTransformbBB(t, bb) {
  const center = cpBBCenter(bb);
  const hw = (bb.r - bb.l) * 0.5;
  const hh = (bb.t - bb.b) * 0.5;
  const a = t.a * hw, b = t.c * hh, d = t.b * hw, e = t.d * hh;
  const hw_max = cpfmax(cpfabs(a + b), cpfabs(a - b));
  const hh_max = cpfmax(cpfabs(d + e), cpfabs(d - e));
  return cpBBNewForExtents(cpTransformPoint(t, center), hw_max, hh_max);
}
function cpTransformTranslate(v) { return cpTransformNewTranspose(1, 0, v.x, 0, 1, v.y); }
function cpTransformScale(sx, sy) { return cpTransformNewTranspose(sx, 0, 0, 0, sy, 0); }
function cpTransformRotate(radians) {
  const rot = cpvforangle(radians);
  return cpTransformNewTranspose(rot.x, -rot.y, 0, rot.y, rot.x, 0);
}
function cpTransformRigid(translate, radians) {
  const rot = cpvforangle(radians);
  return cpTransformNewTranspose(rot.x, -rot.y, translate.x, rot.y, rot.x, translate.y);
}
function cpTransformRigidInverse(t) {
  return cpTransformNewTranspose(
    t.d, -t.c, (t.c * t.ty - t.tx * t.d),
    -t.b, t.a, (t.tx * t.b - t.a * t.ty)
  );
}

// ──────────────────────────── cpArray ─────────────────────────────
class cpArray {
  constructor(size) {
    this.num = 0;
    this.max = size || 4;
    this.arr = new Array(this.max).fill(null);
  }
  push(obj) {
    if (this.num === this.max) {
      this.max = Math.floor(3 * (this.max + 1) / 2);
      this.arr.length = this.max;
    }
    this.arr[this.num] = obj;
    this.num++;
  }
  pop() {
    this.num--;
    const val = this.arr[this.num];
    this.arr[this.num] = null;
    return val;
  }
  deleteObj(obj) {
    for (let i = 0; i < this.num; i++) {
      if (this.arr[i] === obj) {
        this.num--;
        this.arr[i] = this.arr[this.num];
        this.arr[this.num] = null;
        return;
      }
    }
  }
  contains(obj) {
    for (let i = 0; i < this.num; i++)
      if (this.arr[i] === obj) return true;
    return false;
  }
  each(func) {
    for (let i = 0; i < this.num; i++) func(this.arr[i]);
  }
}

// ──────────────────────────── cpHashSet ───────────────────────────
class cpHashSetBin {
  constructor() { this.elt = null; this.hash = 0; this.next = null; }
}

class cpHashSet {
  constructor(size, eqlFunc) {
    this.entries = 0;
    this.size = _nextPrime(size);
    this.eql = eqlFunc;
    this.default_value = null;
    this.table = new Array(this.size).fill(null);
    this.pooledBins = null;
  }

  count() { return this.entries; }

  insert(hash, ptr, trans, data) {
    const idx = hash % this.size;
    let bin = this.table[idx];
    while (bin && !this.eql(bin.elt, ptr)) bin = bin.next;

    if (!bin) {
      bin = this._getUnusedBin();
      bin.hash = hash;
      bin.elt = trans ? trans(ptr, data) : data;
      bin.next = this.table[idx];
      this.table[idx] = bin;
      this.entries++;
      if (this.entries >= this.size) this._resize();
    }
    return bin.elt;
  }

  remove(hash, ptr) {
    const idx = hash % this.size;
    let prevPtr = null;
    let bin = this.table[idx];

    while (bin && !this.eql(bin.elt, ptr)) {
      prevPtr = bin;
      bin = bin.next;
    }

    if (bin) {
      if (prevPtr) prevPtr.next = bin.next;
      else this.table[idx] = bin.next;
      this.entries--;
      const elt = bin.elt;
      this._recycleBin(bin);
      return elt;
    }
    return null;
  }

  find(hash, ptr) {
    const idx = hash % this.size;
    let bin = this.table[idx];
    while (bin && !this.eql(bin.elt, ptr)) bin = bin.next;
    return bin ? bin.elt : this.default_value;
  }

  each(func) {
    for (let i = 0; i < this.size; i++) {
      let bin = this.table[i];
      while (bin) {
        const next = bin.next;
        func(bin.elt);
        bin = next;
      }
    }
  }

  filter(func) {
    for (let i = 0; i < this.size; i++) {
      let prevPtr = null;
      let bin = this.table[i];
      while (bin) {
        const next = bin.next;
        if (func(bin.elt)) {
          prevPtr = bin;
        } else {
          if (prevPtr) prevPtr.next = next;
          else this.table[i] = next;
          this.entries--;
          this._recycleBin(bin);
        }
        bin = next;
      }
    }
  }

  _resize() {
    const newSize = _nextPrime(this.size + 1);
    const newTable = new Array(newSize).fill(null);
    for (let i = 0; i < this.size; i++) {
      let bin = this.table[i];
      while (bin) {
        const next = bin.next;
        const idx = bin.hash % newSize;
        bin.next = newTable[idx];
        newTable[idx] = bin;
        bin = next;
      }
    }
    this.table = newTable;
    this.size = newSize;
  }

  _recycleBin(bin) {
    bin.next = this.pooledBins;
    this.pooledBins = bin;
    bin.elt = null;
  }

  _getUnusedBin() {
    if (this.pooledBins) {
      const bin = this.pooledBins;
      this.pooledBins = bin.next;
      return bin;
    }
    return new cpHashSetBin();
  }
}

// ──────────────────────────── Primes ──────────────────────────────
const _primes = [0, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321, 1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487, 1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619, 1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783, 1787, 1789, 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949, 1951, 1973, 1979, 1987, 1993, 1997, 1999, 2003, 2011, 2017, 2027, 2029, 2039, 2053, 2063, 2069, 2081, 2083, 2087, 2089, 2099, 2111, 2113, 2129, 2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203, 2207, 2213, 2221, 2237, 2239, 2243, 2251, 2267, 2269, 2273, 2281, 2287, 2293, 2297, 2309, 2311, 2333, 2339, 2341, 2347, 2351, 2357, 2371, 2377, 2381, 2383, 2389, 2393, 2399, 2411, 2417, 2423, 2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503, 2521, 2531, 2539, 2543, 2549, 2551, 2557, 2579, 2591, 2593, 2609, 2617, 2621, 2633, 2647, 2657, 2659, 2663, 2671, 2677, 2683, 2687, 2689, 2693, 2699, 2707, 2711, 2713, 2719, 2729, 2731, 2741, 2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801, 2803, 2819, 2833, 2837, 2843, 2851, 2857, 2861, 2879, 2887, 2897, 2903, 2909, 2917, 2927, 2939, 2953, 2957, 2963, 2969, 2971, 2999, 3001, 3011, 3019, 3023, 3037, 3041, 3049, 3061, 3067, 3079, 3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167, 3169, 3181, 3187, 3191, 3203, 3209, 3217, 3221, 3229, 3251, 3253, 3257, 3259, 3271, 3299, 3301, 3307, 3313, 3319, 3323, 3329, 3331, 3343, 3347, 3359, 3361, 3371, 3373, 3389, 3391, 3407, 3413, 3433, 3449, 3457, 3461, 3463, 3467, 3469, 3491, 3499, 3511, 3517, 3527, 3529, 3533, 3539, 3541, 3547, 3557, 3559, 3571, 3581, 3583, 3593, 3607, 3613, 3617, 3623, 3631, 3637, 3643, 3659, 3671, 3673, 3677, 3691, 3697, 3701, 3709, 3719, 3727, 3733, 3739, 3761, 3767, 3769, 3779, 3793, 3797, 3803, 3821, 3823, 3833, 3847, 3851, 3853, 3863, 3877, 3881, 3889, 3907, 3911, 3917, 3919, 3923, 3929, 3931, 3943, 3947, 3967, 3989, 4001, 4003, 4007, 4013, 4019, 4021, 4027, 4049, 4051, 4057, 4073, 4079, 4091, 4093, 4099, 4111, 4127, 4129, 4133, 4139, 4153, 4157, 4159, 4177, 4201, 4211, 4217, 4219, 4229, 4231, 4241, 4243, 4253, 4259, 4261, 4271, 4273, 4283, 4289, 4297, 4327, 4337, 4339, 4349, 4357, 4363, 4373, 4391, 4397, 4409, 4421, 4423, 4441, 4447, 4451, 4457, 4463, 4481, 4483, 4493, 4507, 4513, 4517, 4519, 4523, 4547, 4549, 4561, 4567, 4583, 4591, 4597, 4603, 4621, 4637, 4639, 4643, 4649, 4651, 4657, 4663, 4673, 4679, 4691, 4703, 4721, 4723, 4729, 4733, 4751, 4759, 4783, 4787, 4789, 4793, 4799, 4801, 4813, 4817, 4831, 4861, 4871, 4877, 4889, 4903, 4909, 4919, 4931, 4933, 4937, 4943, 4951, 4957, 4967, 4969, 4973, 4987, 4993, 4999, 5003, 5009, 5011, 5021, 5023, 5039, 5051, 5059, 5077, 5081, 5087, 5099, 5101, 5107, 5113, 5119, 5147, 5153, 5167, 5171, 5179, 5189, 5197, 5209, 5227, 5231, 5233, 5237, 5261, 5273, 5279, 5281, 5297, 5303, 5309, 5323, 5333, 5347, 5351, 5381, 5387, 5393, 5399, 5407, 5413, 5417, 5419, 5431, 5437, 5441, 5443, 5449, 5471, 5477, 5479, 5483, 5501, 5503, 5507, 5519, 5521, 5527, 5531, 5557, 5563, 5569, 5573, 5581, 5591, 5623, 5639, 5641, 5647, 5651, 5653, 5657, 5659, 5669, 5683, 5689, 5693, 5701, 5711, 5717, 5737, 5741, 5743, 5749, 5779, 5783, 5791, 5801, 5807, 5813, 5821, 5827, 5839, 5843, 5849, 5851, 5857, 5861, 5867, 5869, 5879, 5881, 5897, 5903, 5923, 5927, 5939, 5953, 5981, 5987, 6007, 6011, 6029, 6037, 6043, 6047, 6053, 6067, 6073, 6079, 6089, 6091, 6101, 6113, 6121, 6131, 6133, 6143, 6151, 6163, 6173, 6197, 6199, 6203, 6211, 6217, 6221, 6229, 6247, 6257, 6263, 6269, 6271, 6277, 6287, 6299, 6301, 6311, 6317, 6323, 6329, 6337, 6343, 6353, 6359, 6361, 6367, 6373, 6379, 6389, 6397, 6421, 6427, 6449, 6451, 6469, 6473, 6481, 6491, 6521, 6529, 6547, 6551, 6553, 6563, 6569, 6571, 6577, 6581, 6599, 6607, 6619, 6637, 6653, 6659, 6661, 6673, 6679, 6689, 6691, 6701, 6703, 6709, 6719, 6733, 6737, 6761, 6763, 6779, 6781, 6791, 6793, 6803, 6823, 6827, 6829, 6833, 6841, 6857, 6863, 6869, 6871, 6883, 6899, 6907, 6911, 6917, 6947, 6949, 6959, 6961, 6967, 6971, 6977, 6983, 6991, 6997, 7001, 7013, 7019, 7027, 7039, 7043, 7057, 7069, 7079, 7103, 7109, 7121, 7127, 7129, 7151, 7159, 7177, 7187, 7193, 7207, 7211, 7213, 7219, 7229, 7237, 7243, 7247, 7253, 7283, 7297, 7307, 7309, 7321, 7331, 7333, 7349, 7351, 7369, 7393, 7411, 7417, 7433, 7451, 7457, 7459, 7477, 7481, 7487, 7489, 7499, 7507, 7517, 7523, 7529, 7537, 7541, 7547, 7549, 7559, 7561, 7573, 7577, 7583, 7589, 7591, 7603, 7607, 7621, 7639, 7643, 7649, 7669, 7673, 7681, 7687, 7691, 7699, 7703, 7717, 7723, 7727, 7741, 7753, 7757, 7759, 7789, 7793, 7817, 7823, 7829, 7841, 7853, 7867, 7873, 7877, 7879, 7883, 7901, 7907, 7919, 7927, 7933, 7937, 7949, 7951, 7963, 8009, 8011, 8017, 8039, 8053, 8059, 8069, 8081, 8087, 8089, 8093, 8101, 8111, 8117, 8123, 8147, 8161, 8167, 8171, 8179, 8191];

function _nextPrime(n) {
  if (n <= 2) return 2;
  for (let i = 1; i < _primes.length; i++) {
    if (_primes[i] >= n) return _primes[i];
  }
  // For very large n, just use n
  return n;
}

// ──────────────────────────── cpShapeFilter ───────────────────────
function cpShapeFilterNew(group, categories, mask) { return { group, categories, mask }; }
const CP_SHAPE_FILTER_ALL = cpShapeFilterNew(CP_NO_GROUP, CP_ALL_CATEGORIES, CP_ALL_CATEGORIES);
const CP_SHAPE_FILTER_NONE = cpShapeFilterNew(CP_NO_GROUP, ~CP_ALL_CATEGORIES >>> 0, ~CP_ALL_CATEGORIES >>> 0);

// ──────────────────────────── cpShape ─────────────────────────────
class cpShape {
  constructor(klass, body, massInfo) {
    this.klass = klass;
    this.body = body;
    this.massInfo = massInfo;
    this.sensor = false;
    this.e = 0;
    this.u = 0;
    this.surfaceV = cpvzero;
    this.type = 0;
    this.filter = cpShapeFilterNew(CP_NO_GROUP, CP_ALL_CATEGORIES, CP_ALL_CATEGORIES);
    this.userData = null;
    this.space = null;
    this.next = null;
    this.prev = null;
    this.spaceNext = null;
    this.spacePrev = null;
    this.bb = cpBBNew(0, 0, 0, 0);
    this.hashid = 0;
  }
}

class cpCircleShape extends cpShape {
  constructor(body, radius, offset) {
    const massInfo = { m: 0, i: 0, area: PI * radius * radius, cog: offset };
    super({ type: CP_CIRCLE_SHAPE, cacheData: _circleCacheData, pointQuery: _circlePointQuery, segmentQuery: _circleSegmentQuery }, body, massInfo);
    this.tc = cpvzero;
    this.r = radius;
    this.c = offset;
  }
}

class cpSegmentShape extends cpShape {
  constructor(body, a, b, radius) {
    const len = cpvdist(a, b);
    const massInfo = { m: 0, i: 0, area: radius * (PI * radius + 2 * len), cog: cpvlerp(a, b, 0.5) };
    super({ type: CP_SEGMENT_SHAPE, cacheData: _segmentCacheData, pointQuery: _segmentPointQuery, segmentQuery: _segmentSegmentQuery }, body, massInfo);
    this.ta = cpvzero;
    this.tb = cpvzero;
    this.tn = cpvzero;
    this.a = a;
    this.b = b;
    this.r = radius;
    this.a_tangent = cpvzero;
    this.b_tangent = cpvzero;
  }
}

class cpPolyShape extends cpShape {
  constructor(body, count, verts, radius) {
    const massInfo = _polyMassInfo(count, verts);
    super({ type: CP_POLY_SHAPE, cacheData: _polyCacheData, pointQuery: _polyPointQuery, segmentQuery: _polySegmentQuery }, body, massInfo);
    this.count = count;
    this.verts = verts.slice();
    this.planes = [];
    this.r = radius;
  }
}

function cpShapeGetBody(shape) { return shape.body; }
function cpShapeGetMass(shape) { return shape.massInfo.m; }
function cpShapeSetMass(shape, mass) {
  shape.body._activate();
  shape.massInfo.m = mass;
  shape.body._accumulateMassFromShapes();
}
function cpShapeGetDensity(shape) { return shape.massInfo.m / shape.massInfo.area; }
function cpShapeSetDensity(shape, density) { cpShapeSetMass(shape, density * shape.massInfo.area); }
function cpShapeGetMoment(shape) { return shape.massInfo.m * shape.massInfo.i; }
function cpShapeGetArea(shape) { return shape.massInfo.area; }
function cpShapeGetCenterOfGravity(shape) { return shape.massInfo.cog; }
function cpShapeGetElasticity(shape) { return shape.e; }
function cpShapeSetElasticity(shape, e) { shape.body._activate(); shape.e = e; }
function cpShapeGetFriction(shape) { return shape.u; }
function cpShapeSetFriction(shape, u) { shape.body._activate(); shape.u = u; }
function cpShapeGetSensor(shape) { return shape.sensor; }
function cpShapeSetSensor(shape, s) { shape.body._activate(); shape.sensor = s; }
function cpShapeGetFilter(shape) { return shape.filter; }
function cpShapeSetFilter(shape, f) { shape.body._activate(); shape.filter = f; }
function cpShapeGetCollisionType(shape) { return shape.type; }
function cpShapeSetCollisionType(shape, t) { shape.body._activate(); shape.type = t; }
function cpShapeGetBB(shape) { return shape.bb; }
function cpShapeGetSpace(shape) { return shape.space; }
function cpShapeGetUserData(shape) { return shape.userData; }
function cpShapeSetUserData(shape, d) { shape.userData = d; }

function cpShapeCacheBB(shape) { return cpShapeUpdate(shape, shape.body.transform); }
function cpShapeUpdate(shape, transform) { shape.bb = shape.klass.cacheData(shape, transform); return shape.bb; }

function cpShapeActive(shape) { return shape.space != null; }

// ──────────── Circle shape helpers ────────────────────────────────
function _circleCacheData(shape, transform) {
  shape.tc = cpTransformPoint(transform, shape.c);
  return cpBBNewForCircle(shape.tc, shape.r);
}

function _circlePointQuery(shape, p, info) {
  const delta = cpvsub(p, shape.tc);
  const dist = cpvlength(delta);
  const r = shape.r;

  info.shape = shape;
  info.point = dist !== 0 ? cpvadd(shape.tc, cpvmult(delta, r / dist)) : shape.tc;
  info.distance = dist - r;
  info.gradient = dist !== 0 ? cpvmult(delta, 1 / dist) : cpv(0, 1);
}

function _circleSegmentQuery(shape, a, b, r, info) {
  const info2 = { shape: null, point: cpvzero, normal: cpvzero, alpha: 0 };
  _circlePointQuery(shape, a, info2);
  if (info2.distance <= r) {
    info.shape = shape;
    info.alpha = 0;
    info.normal = cpvnormalize(cpvsub(a, shape.tc));
    return true;
  }

  const d = cpvsub(b, a);
  const discriminant = r * r - cpvdot(d, cpvsub(shape.tc, a)) * cpvdot(d, cpvsub(shape.tc, a)) / cpvdot(d, d);
  if (discriminant >= 0) {
    const t = (cpvdot(d, cpvsub(shape.tc, a)) - Math.sqrt(discriminant)) / cpvdot(d, d);
    if (0 <= t && t <= 1) {
      info.shape = shape;
      info.alpha = t;
      info.point = cpvadd(a, cpvmult(d, t));
      info.normal = cpvnormalize(cpvsub(cpTransformPoint(shape.body.transform, shape.c), info.point));
      return true;
    }
  }
  return false;
}

// ──────────── Segment shape helpers ───────────────────────────────
function _segmentCacheData(shape, transform) {
  shape.ta = cpTransformPoint(transform, shape.a);
  shape.tb = cpTransformPoint(transform, shape.b);
  shape.tn = cpTransformVect(transform, cpvperp(cpvnormalize(cpvsub(shape.b, shape.a))));

  const l = cpfmin(shape.a.x, shape.b.x) - shape.r;
  const r = cpfmax(shape.a.x, shape.b.x) + shape.r;
  const b = cpfmin(shape.a.y, shape.b.y) - shape.r;
  const t = cpfmax(shape.a.y, shape.b.y) + shape.r;
  return cpBBNew(l, b, r, t);
}

function _segmentPointQuery(shape, p, info) {
  const a = shape.ta;
  const b = shape.tb;
  const delta = cpvsub(b, a);
  const t = cpfclamp01(cpvdot(delta, cpvsub(p, a)) / cpvlengthsq(delta));
  const closest = cpvadd(a, cpvmult(delta, t));
  const dist = cpvdist(p, closest);

  info.shape = shape;
  info.point = closest;
  info.distance = dist - shape.r;
  info.gradient = dist > 0 ? cpvmult(cpvsub(p, closest), 1 / dist) : shape.tn;
}

function _segmentSegmentQuery(shape, a, b, r, info) {
  const da = cpvsub(shape.ta, a);
  const db = cpvsub(shape.tb, a);
  const d = cpvsub(b, a);

  const denom = cpvdot(d, d);
  if (denom === 0) return false;

  const tnda = cpvcross(d, da);
  const tndb = cpvcross(d, db);
  const tnc = cpvcross(da, db);

  const alpha_numerator = tnc - cpvdot(d, da) * tndb / cpvdot(d, d);
  const alpha_denom = tnda - tndb;
  if (alpha_denom === 0) return false;

  const alpha = alpha_numerator / alpha_denom;
  const t = (tnda + tndb) / (2 * alpha_denom);

  if (!(0 <= alpha && alpha <= 1) || !(0 <= t && t <= 1)) return false;

  const n = cpvmult(cpvrperp(d), alpha_denom < 0 ? -1 : 1);
  const r_sum = shape.r + r;
  if (cpvdot(n, cpvsub(shape.ta, a)) <= r_sum && cpvdot(n, cpvsub(shape.tb, a)) <= r_sum) {
    info.shape = shape;
    info.alpha = t;
    info.point = cpvadd(a, cpvmult(d, t));
    info.normal = n;
    return true;
  }
  return false;
}

// ──────────── Polygon shape helpers ───────────────────────────────
function _polyMassInfo(count, verts) {
  if (count === 2) {
    const offset = cpvlerp(verts[0], verts[1], 0.5);
    const len = cpvdist(verts[1], verts[0]);
    const area = len * 2; // Approximate
    return { m: 0, i: (len * len) / 12 + cpvlengthsq(offset), area, cog: offset };
  }

  let sum1 = 0, sum2 = 0;
  for (let i = 0; i < count; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 1) % count];
    const a = cpvcross(v2, v1);
    const b = cpvdot(v1, v1) + cpvdot(v1, v2) + cpvdot(v2, v2);
    sum1 += a * b;
    sum2 += a;
  }

  const area = cpfabs(sum2) / 2;
  const cog = cpvmult(cpCentroidForPoly(count, verts), 1);
  return { m: 0, i: sum1 / (6 * (sum2 || 1)), area: cpfabs(sum2) / 2, cog };
}

function cpCentroidForPoly(count, verts) {
  let sum = 0;
  let vsum = cpvzero;
  for (let i = 0; i < count; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 1) % count];
    const cross = cpvcross(v1, v2);
    sum += cross;
    vsum = cpvadd(vsum, cpvmult(cpvadd(v1, v2), cross));
  }
  return cpvmult(vsum, 1 / (3 * (sum || 1)));
}

function _polyCacheData(shape, transform) {
  const count = shape.count;
  const planes = [];
  for (let i = 0; i < count; i++) {
    const v0 = cpTransformPoint(transform, shape.verts[i]);
    const v1 = cpTransformPoint(transform, shape.verts[(i + 1) % count]);
    const n = cpvnormalize(cpvrperp(cpvsub(v1, v0)));
    planes.push({ v0, n });
  }
  shape.planes = planes;

  let l = planes[0].v0.x, b = planes[0].v0.y, r = l, t = b;
  for (let i = 1; i < count; i++) {
    const v = planes[i].v0;
    if (v.x < l) l = v.x;
    if (v.x > r) r = v.x;
    if (v.y < b) b = v.y;
    if (v.y > t) t = v.y;
  }
  return cpBBNew(l - shape.r, b - shape.r, r + shape.r, t + shape.r);
}

function _polyPointQuery(shape, p, info) {
  const count = shape.count;
  const planes = shape.planes;

  let minDist = -INFINITY;
  let closest = cpvzero;

  for (let i = 0; i < count; i++) {
    const n = planes[i].n;
    const dist = cpvdot(n, cpvsub(p, planes[i].v0));
    if (dist > shape.r) {
      info.shape = shape;
      info.distance = INFINITY;
      info.point = cpvzero;
      info.gradient = cpvzero;
      return;
    }
    if (dist > minDist) {
      minDist = dist;
      closest = cpvsub(p, cpvmult(n, dist));
    }
  }

  info.shape = shape;
  info.point = closest;
  info.distance = minDist;
  info.gradient = minDist > 0 ? cpvnormalize(cpvsub(p, closest)) : cpvzero;
}

function _polySegmentQuery(shape, a, b, r, info) {
  const count = shape.count;
  const planes = shape.planes;
  let tmin = -INFINITY;
  let tmax = INFINITY;
  let n_out = cpvzero;
  let d_out = 0;

  const d = cpvsub(b, a);

  for (let i = 0; i < count; i++) {
    const n = planes[i].n;
    const dist = cpvdot(n, cpvsub(a, planes[i].v0));
    const d_n = cpvdot(n, d);

    if (d_n < 0) {
      const t = (dist - shape.r - r) / (-d_n);
      if (t > tmin) {
        tmin = t;
        n_out = cpvneg(n);
        d_out = dist - shape.r - r;
      }
    } else if (d_n > 0) {
      const t = (dist + shape.r + r) / d_n;
      tmax = cpfmin(tmax, t);
    } else if (dist > shape.r + r) {
      return;
    }
  }

  if (tmin < tmax && tmin >= 0 && tmin <= 1) {
    info.shape = shape;
    info.alpha = tmin;
    info.point = cpvadd(a, cpvmult(d, tmin));
    info.normal = n_out;
    return true;
  }
  return false;
}

function cpCircleShapeNew(body, radius, offset) {
  const shape = new cpCircleShape(body, radius, offset || cpvzero);
  return shape;
}

function cpSegmentShapeNew(body, a, b, radius) {
  return new cpSegmentShape(body, a, b, radius);
}

function cpPolyShapeNew(body, count, verts, transform, radius) {
  const shape = new cpPolyShape(body, count, verts, radius || 0);
  if (transform) {
    for (let i = 0; i < count; i++) {
      shape.verts[i] = cpTransformPoint(transform, shape.verts[i]);
    }
  }
  return shape;
}

function cpPolyShapeNewRaw(body, count, verts, radius) {
  return cpPolyShapeNew(body, count, verts, null, radius);
}

function cpBoxShapeNew(body, width, height, radius) {
  const hw = width / 2;
  const hh = height / 2;
  const verts = [cpv(-hw, -hh), cpv(hw, -hh), cpv(hw, hh), cpv(-hw, hh)];
  return cpPolyShapeNew(body, 4, verts, null, radius || 0);
}

function cpPolyShapeGetCount(shape) { return shape.count; }
function cpPolyShapeGetVert(shape, i) { return shape.verts[i]; }
function cpPolyShapeGetRadius(shape) { return shape.r; }

function cpShapesCollide(a, b) {
  const contacts = [];
  const info = cpCollide(a, b, 0, contacts);
  const swapped = a !== info.a;
  return {
    count: info.count,
    normal: swapped ? cpvneg(info.n) : info.n,
    points: contacts.slice(0, info.count).map((c, i) => ({
      pointA: swapped ? c.r2 : c.r1,
      pointB: swapped ? c.r1 : c.r2,
      distance: cpvdot(cpvsub(c.r2, c.r1), info.n)
    }))
  };
}

// ──────────────────────────── cpBody ──────────────────────────────
class cpBody {
  constructor(mass, moment) {
    this.space = null;
    this.shapeList = null;
    this.arbiterList = null;
    this.constraintList = null;

    this.velocity_func = cpBodyUpdateVelocity;
    this.position_func = cpBodyUpdatePosition;

    this.sleeping = { root: null, next: null, idleTime: 0 };

    this.p = cpvzero;
    this.v = cpvzero;
    this.f = cpvzero;

    this.w = 0;
    this.t = 0;

    this.v_bias = cpvzero;
    this.w_bias = 0;

    this.userData = null;

    this.m = mass;
    this.i = moment;
    this.m_inv = mass === 0 ? INFINITY : 1 / mass;
    this.i_inv = moment === 0 ? INFINITY : 1 / moment;

    this.a = 0;
    this.cog = cpvzero;
    this.transform = cpTransformIdentity;
  }

  _activate() {
    if (this.space) {
      // TODO: activate body in space
    }
  }

  _accumulateMassFromShapes() {
    if (this.space && cpBodyGetType(this) !== CP_BODY_TYPE_DYNAMIC) return;

    this.m = 0;
    this.i = 0;
    this.cog = cpvzero;

    let shape = this.shapeList;
    while (shape) {
      const info = shape.massInfo;
      const m = info.m;
      if (m > 0) {
        const msum = this.m + m;
        this.i += m * info.i + cpvdistsq(this.cog, info.cog) * (m * this.m) / msum;
        this.cog = cpvlerp(this.cog, info.cog, m / msum);
        this.m = msum;
      }
      shape = shape.next;
    }

    this.m_inv = this.m > 0 ? 1 / this.m : INFINITY;
    this.i_inv = this.i > 0 ? 1 / this.i : INFINITY;

    cpBodySetPosition(this, cpBodyGetPosition(this));
  }
}

function cpBodyNew(mass, moment) {
  return new cpBody(mass, moment);
}

function cpBodyNewKinematic() {
  const body = cpBodyNew(0, 0);
  cpBodySetType(body, CP_BODY_TYPE_KINEMATIC);
  return body;
}

function cpBodyNewStatic() {
  const body = cpBodyNew(0, 0);
  cpBodySetType(body, CP_BODY_TYPE_STATIC);
  return body;
}

function cpBodyGetType(body) {
  if (body.sleeping.idleTime === INFINITY) return CP_BODY_TYPE_STATIC;
  if (body.m === INFINITY) return CP_BODY_TYPE_KINEMATIC;
  return CP_BODY_TYPE_DYNAMIC;
}

function cpBodySetType(body, type) {
  const oldType = cpBodyGetType(body);
  if (oldType === type) return;

  body.sleeping.idleTime = type === CP_BODY_TYPE_STATIC ? INFINITY : 0;

  if (type === CP_BODY_TYPE_DYNAMIC) {
    body.m = 0;
    body.i = 0;
    body.m_inv = INFINITY;
    body.i_inv = INFINITY;
    body._accumulateMassFromShapes();
  } else {
    body.m = INFINITY;
    body.i = INFINITY;
    body.m_inv = 0;
    body.i_inv = 0;
    body.v = cpvzero;
    body.w = 0;
  }
}

function cpBodyIsSleeping(body) { return body.sleeping.root != null; }
function cpBodyGetSpace(body) { return body.space; }
function cpBodyGetMass(body) { return body.m; }
function cpBodySetMass(body, mass) {
  body._activate();
  body.m = mass;
  body.m_inv = mass === 0 ? INFINITY : 1 / mass;
}
function cpBodyGetMoment(body) { return body.i; }
function cpBodySetMoment(body, moment) {
  body._activate();
  body.i = moment;
  body.i_inv = moment === 0 ? INFINITY : 1 / moment;
}
function cpBodyGetRotation(body) { return cpv(body.transform.a, body.transform.b); }

function _setTransform(body, p, a) {
  const rot = cpvforangle(a);
  const c = body.cog;
  body.transform = cpTransformNewTranspose(
    rot.x, -rot.y, p.x - (c.x * rot.x - c.y * rot.y),
    rot.y, rot.x, p.y - (c.x * rot.y + c.y * rot.x)
  );
}

function _setAngle(body, a) {
  body.a = a;
  return a;
}

function cpBodyGetPosition(body) { return cpTransformPoint(body.transform, cpvzero); }

function cpBodySetPosition(body, position) {
  body._activate();
  const p = body.p = cpvadd(cpTransformVect(body.transform, body.cog), position);
  _setTransform(body, p, body.a);
}

function cpBodyGetCenterOfGravity(body) { return body.cog; }
function cpBodySetCenterOfGravity(body, cog) { body._activate(); body.cog = cog; }
function cpBodyGetVelocity(body) { return body.v; }
function cpBodySetVelocity(body, v) { body._activate(); body.v = v; }
function cpBodyGetForce(body) { return body.f; }
function cpBodySetForce(body, f) { body._activate(); body.f = f; }
function cpBodyGetAngle(body) { return body.a; }

function cpBodySetAngle(body, angle) {
  body._activate();
  _setAngle(body, angle);
  _setTransform(body, body.p, angle);
}

function cpBodyGetAngularVelocity(body) { return body.w; }
function cpBodySetAngularVelocity(body, w) { body._activate(); body.w = w; }
function cpBodyGetTorque(body) { return body.t; }
function cpBodySetTorque(body, t) { body._activate(); body.t = t; }
function cpBodyGetUserData(body) { return body.userData; }
function cpBodySetUserData(body, d) { body.userData = d; }

function cpBodyUpdateVelocity(body, gravity, damping, dt) {
  if (cpBodyGetType(body) === CP_BODY_TYPE_KINEMATIC) return;
  body.v = cpvadd(cpvmult(body.v, damping), cpvmult(cpvadd(gravity, cpvmult(body.f, body.m_inv)), dt));
  body.w = body.w * damping + body.t * body.i_inv * dt;
  body.f = cpvzero;
  body.t = 0;
}

function cpBodyUpdatePosition(body, dt) {
  const p = body.p = cpvadd(body.p, cpvmult(cpvadd(body.v, body.v_bias), dt));
  const a = _setAngle(body, body.a + (body.w + body.w_bias) * dt);
  _setTransform(body, p, a);
  body.v_bias = cpvzero;
  body.w_bias = 0;
}

function cpBodyLocalToWorld(body, point) { return cpTransformPoint(body.transform, point); }
function cpBodyWorldToLocal(body, point) { return cpTransformPoint(cpTransformRigidInverse(body.transform), point); }

function cpBodyApplyForceAtWorldPoint(body, force, point) {
  body._activate();
  body.f = cpvadd(body.f, force);
  const r = cpvsub(point, cpTransformPoint(body.transform, body.cog));
  body.t += cpvcross(r, force);
}

function cpBodyApplyForceAtLocalPoint(body, force, point) {
  cpBodyApplyForceAtWorldPoint(body, cpTransformVect(body.transform, force), cpTransformPoint(body.transform, point));
}

function _applyImpulse(body, impulse, r) {
  body.v = cpvadd(body.v, cpvmult(impulse, body.m_inv));
  body.w += body.i_inv * cpvcross(r, impulse);
}

function cpBodyApplyImpulseAtWorldPoint(body, impulse, point) {
  body._activate();
  const r = cpvsub(point, cpTransformPoint(body.transform, body.cog));
  _applyImpulse(body, impulse, r);
}

function cpBodyApplyImpulseAtLocalPoint(body, impulse, point) {
  cpBodyApplyImpulseAtWorldPoint(body, cpTransformVect(body.transform, impulse), cpTransformPoint(body.transform, point));
}

function cpBodyGetVelocityAtLocalPoint(body, point) {
  const r = cpTransformVect(body.transform, cpvsub(point, body.cog));
  return cpvadd(body.v, cpvmult(cpvperp(r), body.w));
}

function cpBodyGetVelocityAtWorldPoint(body, point) {
  const r = cpvsub(point, cpTransformPoint(body.transform, body.cog));
  return cpvadd(body.v, cpvmult(cpvperp(r), body.w));
}

function cpBodyKineticEnergy(body) {
  const vsq = cpvdot(body.v, body.v);
  const wsq = body.w * body.w;
  return (vsq ? vsq * body.m : 0) + (wsq ? wsq * body.i : 0);
}

function cpBodyAddShape(body, shape) {
  const next = body.shapeList;
  if (next) next.prev = shape;
  shape.next = next;
  body.shapeList = shape;
  if (shape.massInfo.m > 0) body._accumulateMassFromShapes();
}

function cpBodyRemoveShape(body, shape) {
  const prev = shape.prev;
  const next = shape.next;
  if (prev) prev.next = next;
  else body.shapeList = next;
  if (next) next.prev = prev;
  shape.prev = null;
  shape.next = null;
  if (cpBodyGetType(body) === CP_BODY_TYPE_DYNAMIC && shape.massInfo.m > 0) {
    body._accumulateMassFromShapes();
  }
}

// ──────────────────────────── Misc physics functions ──────────────
function cpMomentForCircle(m, r1, r2, offset) {
  return m * (0.5 * (r1 * r1 + r2 * r2) + cpvlengthsq(offset));
}

function cpAreaForCircle(r1, r2) {
  return PI * cpfabs(r1 * r1 - r2 * r2);
}

function cpMomentForSegment(m, a, b, r) {
  const offset = cpvlerp(a, b, 0.5);
  const length = cpvdist(b, a) + 2 * r;
  return m * ((length * length + 4 * r * r) / 12 + cpvlengthsq(offset));
}

function cpAreaForSegment(a, b, r) {
  return r * (PI * r + 2 * cpvdist(a, b));
}

function cpMomentForPoly(m, count, verts, offset, r) {
  if (count === 2) return cpMomentForSegment(m, verts[0], verts[1], 0);

  let sum1 = 0, sum2 = 0;
  for (let i = 0; i < count; i++) {
    const v1 = cpvadd(verts[i], offset);
    const v2 = cpvadd(verts[(i + 1) % count], offset);
    const a = cpvcross(v2, v1);
    const b = cpvdot(v1, v1) + cpvdot(v1, v2) + cpvdot(v2, v2);
    sum1 += a * b;
    sum2 += a;
  }
  return (m * sum1) / (6 * sum2);
}

function cpAreaForPoly(count, verts, r) {
  let area = 0, perimeter = 0;
  for (let i = 0; i < count; i++) {
    const v1 = verts[i];
    const v2 = verts[(i + 1) % count];
    area += cpvcross(v1, v2);
    perimeter += cpvdist(v1, v2);
  }
  return r * (PI * cpfabs(r) + perimeter) + area / 2;
}

function cpMomentForBox(m, width, height) {
  return m * (width * width + height * height) / 12;
}

function cpMomentForBox2(m, box) {
  const width = box.r - box.l;
  const height = box.t - box.b;
  const offset = cpvmult(cpv(box.l + box.r, box.b + box.t), 0.5);
  return cpMomentForBox(m, width, height) + m * cpvlengthsq(offset);
}

// ──────────────────────────── Quick Hull ──────────────────────────
function cpLoopIndexes(verts, count, result) {
  result.start = 0;
  result.end = 0;
  let min = verts[0], max = min;
  for (let i = 1; i < count; i++) {
    const v = verts[i];
    if (v.x < min.x || (v.x === min.x && v.y < min.y)) {
      min = v;
      result.start = i;
    } else if (v.x > max.x || (v.x === max.x && v.y > max.y)) {
      max = v;
      result.end = i;
    }
  }
}

function _QHullPartition(verts, count, a, b, tol) {
  if (count === 0) return 0;

  let max = 0, pivot = 0;
  const delta = cpvsub(b, a);
  const valueTol = tol * cpvlength(delta);

  let head = 0;
  for (let tail = count - 1; head <= tail;) {
    const value = cpvcross(cpvsub(verts[head], a), delta);
    if (value > valueTol) {
      if (value > max) { max = value; pivot = head; }
      head++;
    } else {
      const tmp = verts[head]; verts[head] = verts[tail]; verts[tail] = tmp;
      tail--;
    }
  }

  if (pivot !== 0) { const tmp = verts[0]; verts[0] = verts[pivot]; verts[pivot] = tmp; }
  return head;
}

function _QHullReduce(tol, verts, count, a, pivot, b, result) {
  if (count < 0) return 0;
  if (count === 0) { result[0] = pivot; return 1; }

  const leftCount = _QHullPartition(verts, count, a, pivot, tol);
  let index = _QHullReduce(tol, verts.slice(1), leftCount - 1, a, verts[0], pivot, result);
  result[index++] = pivot;
  const rightCount = _QHullPartition(verts.slice(leftCount), count - leftCount, pivot, b, tol);
  return index + _QHullReduce(tol, verts.slice(leftCount + 1), rightCount - 1, pivot, verts[leftCount], b, result.slice(index));
}

function cpConvexHull(count, verts, result, first, tol) {
  result = result || [];
  if (verts !== result) {
    for (let i = 0; i < count; i++) result[i] = verts[i];
  }

  const idx = { start: 0, end: 0 };
  cpLoopIndexes(verts, count, idx);
  if (idx.start === idx.end) {
    if (first) first.value = 0;
    return 1;
  }

  const tmp = result[0]; result[0] = result[idx.start]; result[idx.start] = tmp;
  const endIdx = idx.end === 0 ? idx.start : idx.end;
  const tmp2 = result[1]; result[1] = result[endIdx]; result[endIdx] = tmp2;

  const a = result[0], b = result[1];
  if (first) first.value = idx.start;
  return _QHullReduce(tol || 0, result.slice(2), count - 2, a, b, a, result.slice(1)) + 1;
}

// ──────────────────────────── cpCollisionInfo ─────────────────────
function _cpCollisionInfoNew(a, b, id, contacts) {
  return { a, b, id, n: cpvzero, count: 0, arr: contacts };
}

function _cpCollisionInfoPushContact(info, p1, p2, hash) {
  if (info.count >= CP_MAX_CONTACTS_PER_ARBITER) return;
  const con = info.arr[info.count] || {};
  con.r1 = p1;
  con.r2 = p2;
  con.hash = hash;
  info.arr[info.count] = con;
  info.count++;
}

// ──────────────────────────── GJK/EPA ─────────────────────────────
function _polySupportPointIndex(count, planes, n) {
  let max = -INFINITY, index = 0;
  for (let i = 0; i < count; i++) {
    const d = cpvdot(planes[i].v0, n);
    if (d > max) { max = d; index = i; }
  }
  return index;
}

function _circleSupportPoint(circle, n) {
  return { p: circle.tc, index: 0 };
}

function _segmentSupportPoint(seg, n) {
  return cpvdot(seg.ta, n) > cpvdot(seg.tb, n) ? { p: seg.ta, index: 0 } : { p: seg.tb, index: 1 };
}

function _polySupportPoint(poly, n) {
  const i = _polySupportPointIndex(poly.count, poly.planes, n);
  return { p: poly.planes[i].v0, index: i };
}

function _supportPointNew(p, index) { return { p, index }; }
function _minkowskiPointNew(a, b) {
  return { a: a.p, b: b.p, ab: cpvsub(b.p, a.p), id: ((a.index & 0xFF) << 8) | (b.index & 0xFF) };
}

function _support(ctx, n) {
  return _minkowskiPointNew(ctx.func1(ctx.shape1, cpvneg(n)), ctx.func2(ctx.shape2, n));
}

function _closestT(a, b) {
  const delta = cpvsub(b, a);
  return -cpfclamp(cpvdot(delta, cpvadd(a, b)) / (cpvlengthsq(delta) || CPFLOAT_MIN), -1, 1);
}

function _lerpT(a, b, t) {
  const ht = 0.5 * t;
  return cpvadd(cpvmult(a, 0.5 - ht), cpvmult(b, 0.5 + ht));
}

function _closestPointsNew(v0, v1) {
  const t = _closestT(v0.ab, v1.ab);
  const p = _lerpT(v0.ab, v1.ab, t);
  const pa = _lerpT(v0.a, v1.a, t);
  const pb = _lerpT(v0.b, v1.b, t);
  const id = ((v0.id & 0xFFFF) << 16) | (v1.id & 0xFFFF);

  const delta = cpvsub(v1.ab, v0.ab);
  const n = cpvnormalize(cpvrperp(delta));
  const d = cpvdot(n, p);

  if (d <= 0 || (-1 < t && t < 1)) {
    return { a: pa, b: pb, n, d, id };
  } else {
    const d2 = cpvlength(p);
    const n2 = cpvmult(p, 1 / (d2 + CPFLOAT_MIN));
    return { a: pa, b: pb, n: n2, d: d2, id };
  }
}

function _closeDist(v0, v1) {
  return cpvlengthsq(_lerpT(v0, v1, _closestT(v0, v1)));
}

function _EPARecurse(ctx, count, hull, iteration) {
  iteration = iteration || 1;
  while (true) {
    var mini = 0, minDist = INFINITY;
    for (var j = 0, i = count - 1; j < count; i = j, j++) {
      var d = _closeDist(hull[i].ab, hull[j].ab);
      if (d < minDist) { minDist = d; mini = i; }
    }
    var v0 = hull[mini];
    var v1 = hull[(mini + 1) % count];
    var p = _support(ctx, cpvperp(cpvsub(v1.ab, v0.ab)));
    if (isNaN(p.ab.x) || isNaN(p.ab.y)) return _closestPointsNew(v0, v1);
    var duplicate = p.id === v0.id || p.id === v1.id;
    if (duplicate || iteration >= MAX_EPA_ITERATIONS) {
      return _closestPointsNew(v0, v1);
    }
    var hull2 = [p];
    var count2 = 1;
    for (var i = 0; i < count; i++) {
      var index = (mini + 1 + i) % count;
      var h0 = hull2[count2 - 1].ab;
      var h1 = hull[index].ab;
      var h2 = (i + 1 < count ? hull[(index + 1) % count] : p).ab;
      if (_cpCheckPointGreater(h0, h2, h1)) {
        hull2[count2] = hull[index];
        count2++;
      }
    }
    count = count2;
    hull = hull2;
    iteration++;
  }
}

function _EPA(ctx, v0, v1, v2) {
  return _EPARecurse(ctx, 3, [v0, v1, v2], 1);
}

function _GJKRecurse(ctx, v0, v1, iteration) {
  iteration = iteration || 1;
  while (iteration <= MAX_GJK_ITERATIONS) {
    if (isNaN(v0.ab.x) || isNaN(v0.ab.y) || isNaN(v1.ab.x) || isNaN(v1.ab.y)) {
      return _closestPointsNew(v0, v1);
    }
    if (_cpCheckPointGreater(v1.ab, v0.ab, cpvzero)) {
      var tmp = v0; v0 = v1; v1 = tmp;
      iteration++;
      continue;
    }
    var t = _closestT(v0.ab, v1.ab);
    var n = (-1 < t && t < 1) ? cpvperp(cpvsub(v1.ab, v0.ab)) : cpvneg(_lerpT(v0.ab, v1.ab, t));
    var p = _support(ctx, n);
    if (isNaN(p.ab.x) || isNaN(p.ab.y)) {
      return _closestPointsNew(v0, v1);
    }
    if (_cpCheckPointGreater(p.ab, v0.ab, cpvzero) && _cpCheckPointGreater(v1.ab, p.ab, cpvzero)) {
      return _EPA(ctx, v0, p, v1);
    } else {
      if (_cpCheckAxis(v0.ab, v1.ab, p.ab, n)) {
        return _closestPointsNew(v0, v1);
      } else {
        if (_closeDist(v0.ab, p.ab) < _closeDist(p.ab, v1.ab)) {
          v1 = p;
        } else {
          v0 = p;
        }
        iteration++;
        continue;
      }
    }
  }
  return _closestPointsNew(v0, v1);
}

function _GJK(ctx, id) {
  let v0, v1;
  if (id) {
    const sp0 = _shapePoint(ctx.shape1, (id >> 24) & 0xFF);
    const sp1 = _shapePoint(ctx.shape2, (id >> 16) & 0xFF);
    const sp2 = _shapePoint(ctx.shape1, (id >> 8) & 0xFF);
    const sp3 = _shapePoint(ctx.shape2, id & 0xFF);
    v0 = _minkowskiPointNew(sp0, sp1);
    v1 = _minkowskiPointNew(sp2, sp3);
  } else {
    // FIX: Add a small vertical offset to the initial GJK axis to avoid
    // a degenerate case when two objects have the same height and are
    // aligned on Y. In that case, the BB centers have the same Y, so
    // cpvperp((dx, 0)) = (0, -dx) — a purely vertical axis. For two
    // same-height rectangles, the support points on a vertical axis are
    // the top/bottom vertices, whose Minkowski difference is (0,0) — a
    // degenerate simplex that GJK cannot iterate. Adding a tiny Y offset
    // to the axis breaks the symmetry and lets GJK find the separating
    // axis correctly.
    var centerDiff = cpvsub(cpBBCenter(ctx.shape1.bb), cpBBCenter(ctx.shape2.bb));
    if (Math.abs(centerDiff.y) < 0.001) centerDiff.y = 0.001;
    const axis = cpvperp(centerDiff);
    v0 = _support(ctx, axis);
    v1 = _support(ctx, cpvneg(axis));
  }

  const points = _GJKRecurse(ctx, v0, v1, 1);
  return points;
}

function _shapePoint(shape, i) {
  switch (shape.klass.type) {
    case CP_CIRCLE_SHAPE: return _supportPointNew(shape.tc, 0);
    case CP_SEGMENT_SHAPE: return _supportPointNew(i === 0 ? shape.ta : shape.tb, i);
    case CP_POLY_SHAPE: {
      const index = i < shape.count ? i : 0;
      return _supportPointNew(shape.planes[index].v0, index);
    }
    default: return _supportPointNew(cpvzero, 0);
  }
}

function _cpCheckPointGreater(a, b, c) {
  return cpvcross(cpvsub(b, a), cpvsub(c, a)) >= 0;
}

function _cpCheckAxis(a, b, p, n) {
  return cpvdot(cpvsub(p, a), n) <= 0 || cpvdot(cpvsub(p, b), n) <= 0;
}

// ──────────────────────────── Contact clipping ────────────────────
function _supportEdgeForPoly(poly, n) {
  const count = poly.count;
  const i1 = _polySupportPointIndex(count, poly.planes, n);
  const i0 = (i1 - 1 + count) % count;
  const i2 = (i1 + 1) % count;
  const planes = poly.planes;
  const hashid = poly.hashid;

  if (cpvdot(n, planes[i1].n) > cpvdot(n, planes[i2].n)) {
    return {
      a: { p: planes[i0].v0, hash: ((hashid & 0xFFFF) << 16) | (i0 & 0xFFFF) },
      b: { p: planes[i1].v0, hash: ((hashid & 0xFFFF) << 16) | (i1 & 0xFFFF) },
      r: poly.r, n: planes[i1].n
    };
  } else {
    return {
      a: { p: planes[i1].v0, hash: ((hashid & 0xFFFF) << 16) | (i1 & 0xFFFF) },
      b: { p: planes[i2].v0, hash: ((hashid & 0xFFFF) << 16) | (i2 & 0xFFFF) },
      r: poly.r, n: planes[i2].n
    };
  }
}

function _supportEdgeForSegment(seg, n) {
  const hashid = seg.hashid;
  if (cpvdot(seg.tn, n) > 0) {
    return {
      a: { p: seg.ta, hash: ((hashid & 0xFFFF) << 16) },
      b: { p: seg.tb, hash: ((hashid & 0xFFFF) << 16) | 1 },
      r: seg.r, n: seg.tn
    };
  } else {
    return {
      a: { p: seg.tb, hash: ((hashid & 0xFFFF) << 16) | 1 },
      b: { p: seg.ta, hash: ((hashid & 0xFFFF) << 16) },
      r: seg.r, n: cpvneg(seg.tn)
    };
  }
}

function _contactPoints(e1, e2, points, info) {
  const mindist = e1.r + e2.r;
  if (points.d > mindist) return;

  const n = info.n = points.n;

  const d_e1_a = cpvcross(e1.a.p, n);
  const d_e1_b = cpvcross(e1.b.p, n);
  const d_e2_a = cpvcross(e2.a.p, n);
  const d_e2_b = cpvcross(e2.b.p, n);

  const e1_denom = 1 / (d_e1_b - d_e1_a + CPFLOAT_MIN);
  const e2_denom = 1 / (d_e2_b - d_e2_a + CPFLOAT_MIN);

  {
    const p1 = cpvadd(cpvmult(n, e1.r), cpvlerp(e1.a.p, e1.b.p, cpfclamp01((d_e2_b - d_e1_a) * e1_denom)));
    const p2 = cpvadd(cpvmult(n, -e2.r), cpvlerp(e2.a.p, e2.b.p, cpfclamp01((d_e1_a - d_e2_a) * e2_denom)));
    const dist = cpvdot(cpvsub(p2, p1), n);
    if (dist <= 0) {
      _cpCollisionInfoPushContact(info, p1, p2, ((e1.a.hash & 0xFFFF) << 16) | (e2.b.hash & 0xFFFF));
    }
  }
  {
    const p1 = cpvadd(cpvmult(n, e1.r), cpvlerp(e1.a.p, e1.b.p, cpfclamp01((d_e2_a - d_e1_a) * e1_denom)));
    const p2 = cpvadd(cpvmult(n, -e2.r), cpvlerp(e2.a.p, e2.b.p, cpfclamp01((d_e1_b - d_e2_a) * e2_denom)));
    const dist = cpvdot(cpvsub(p2, p1), n);
    if (dist <= 0) {
      _cpCollisionInfoPushContact(info, p1, p2, ((e1.b.hash & 0xFFFF) << 16) | (e2.a.hash & 0xFFFF));
    }
  }
  // FIX: If no contacts were found via edge clipping, but the shapes are
  // clearly overlapping (GJK distance <= 0), add a fallback contact at
  // the midpoint of the two support edges. This handles degenerate cases
  // where the clipping algorithm fails due to parallel edges or when one
  // shape is fully inside another.
  if (info.count === 0 && points.d <= mindist) {
    const mid1 = cpvmult(cpvadd(e1.a.p, e1.b.p), 0.5);
    const mid2 = cpvmult(cpvadd(e2.a.p, e2.b.p), 0.5);
    _cpCollisionInfoPushContact(info, mid1, mid2, 0);
  }
}

// ──────────────────────────── Collision functions ─────────────────
function _circleToCircle(c1, c2, info) {
  const mindist = c1.r + c2.r;
  const delta = cpvsub(c2.tc, c1.tc);
  const distsq = cpvlengthsq(delta);

  if (distsq < mindist * mindist) {
    const dist = Math.sqrt(distsq);
    info.n = dist ? cpvmult(delta, 1 / dist) : cpv(1, 0);
    _cpCollisionInfoPushContact(info, cpvadd(c1.tc, cpvmult(info.n, c1.r)), cpvadd(c2.tc, cpvmult(info.n, -c2.r)), 0);
  }
}

function _circleToSegment(circle, segment, info) {
  const seg_a = segment.ta;
  const seg_b = segment.tb;
  const center = circle.tc;

  const seg_delta = cpvsub(seg_b, seg_a);
  const closest_t = cpfclamp01(cpvdot(seg_delta, cpvsub(center, seg_a)) / (cpvlengthsq(seg_delta) || CPFLOAT_MIN));
  const closest = cpvadd(seg_a, cpvmult(seg_delta, closest_t));

  const mindist = circle.r + segment.r;
  const delta = cpvsub(closest, center);
  const distsq = cpvlengthsq(delta);

  if (distsq < mindist * mindist) {
    const dist = Math.sqrt(distsq);
    info.n = dist ? cpvmult(delta, 1 / dist) : segment.tn;
    _cpCollisionInfoPushContact(info, cpvadd(center, cpvmult(info.n, circle.r)), cpvadd(closest, cpvmult(info.n, -segment.r)), 0);
  }
}

function _circleToPoly(circle, poly, info) {
  const context = {
    shape1: circle, shape2: poly,
    func1: _circleSupportPoint, func2: _polySupportPoint
  };
  const points = _GJK(context, 0);

  if (points.d <= circle.r + poly.r) {
    info.n = points.n;
    _cpCollisionInfoPushContact(info, cpvadd(points.a, cpvmult(points.n, circle.r)), cpvadd(points.b, cpvmult(points.n, poly.r)), 0);
  }
}

function _segmentToSegment(seg1, seg2, info) {
  const context = {
    shape1: seg1, shape2: seg2,
    func1: _segmentSupportPoint, func2: _segmentSupportPoint
  };
  const points = _GJK(context, 0);

  if (points.d <= seg1.r + seg2.r) {
    _contactPoints(_supportEdgeForSegment(seg1, points.n), _supportEdgeForSegment(seg2, cpvneg(points.n)), points, info);
  }
}

function _segmentToPoly(seg, poly, info) {
  const context = {
    shape1: seg, shape2: poly,
    func1: _segmentSupportPoint, func2: _polySupportPoint
  };
  const points = _GJK(context, 0);

  if (points.d - seg.r - poly.r <= 0) {
    _contactPoints(_supportEdgeForSegment(seg, points.n), _supportEdgeForPoly(poly, cpvneg(points.n)), points, info);
  }
}

function _polyToPoly(poly1, poly2, info) {
  const context = {
    shape1: poly1, shape2: poly2,
    func1: _polySupportPoint, func2: _polySupportPoint
  };
  const points = _GJK(context, 0);

  if (points.d - poly1.r - poly2.r <= 0) {
    _contactPoints(_supportEdgeForPoly(poly1, points.n), _supportEdgeForPoly(poly2, cpvneg(points.n)), points, info);
  }
}

const _builtinCollisionFuncs = [
  _circleToCircle,
  null, null,
  _circleToSegment,
  _segmentToSegment,
  null,
  _circleToPoly,
  _segmentToPoly,
  _polyToPoly
];

function cpCollide(a, b, id, contacts) {
  const info = _cpCollisionInfoNew(a, b, id, contacts);

  if (a.klass.type > b.klass.type) {
    info.a = b;
    info.b = a;
  }

  const func = _builtinCollisionFuncs[info.a.klass.type + info.b.klass.type * CP_NUM_SHAPES];
  if (func) func(info.a, info.b, info);

  return info;
}

// ──────────────────────────── cpArbiter ───────────────────────────
class cpArbiter {
  constructor(a, b) {
    this.handler = null;
    this.swapped = false;
    this.handlerA = null;
    this.handlerB = null;
    this.e = 0;
    this.u = 0;
    this.surface_vr = cpvzero;
    this.count = 0;
    this.contacts = null;
    this.a = a;
    this.body_a = a.body;
    this.b = b;
    this.body_b = b.body;
    this.thread_a = { next: null, prev: null };
    this.thread_b = { next: null, prev: null };
    this.stamp = 0;
    this.state = CP_ARBITER_STATE_FIRST_COLLISION;
    this.data = null;
  }
}

function cpArbiterIsFirstContact(arb) { return arb.state === CP_ARBITER_STATE_FIRST_COLLISION; }
function cpArbiterIsRemoval(arb) { return arb.state === CP_ARBITER_STATE_INVALIDATED; }
function cpArbiterGetCount(arb) { return arb.state < CP_ARBITER_STATE_CACHED ? arb.count : 0; }

function cpArbiterGetNormal(arb) {
  return cpvmult(arb.n, arb.swapped ? -1 : 1);
}

function cpArbiterGetPointA(arb, i) {
  return cpvadd(arb.body_a.p, arb.contacts[i].r1);
}

function cpArbiterGetPointB(arb, i) {
  return cpvadd(arb.body_b.p, arb.contacts[i].r2);
}

function cpArbiterGetDepth(arb, i) {
  const con = arb.contacts[i];
  return cpvdot(cpvadd(cpvsub(con.r2, con.r1), cpvsub(arb.body_b.p, arb.body_a.p)), arb.n);
}

function cpArbiterGetContactPointSet(arb) {
  const count = cpArbiterGetCount(arb);
  const swapped = arb.swapped;
  const n = arb.n;
  const set = {
    count,
    normal: swapped ? cpvneg(n) : n,
    points: []
  };

  for (let i = 0; i < count; i++) {
    const p1 = cpvadd(arb.body_a.p, arb.contacts[i].r1);
    const p2 = cpvadd(arb.body_b.p, arb.contacts[i].r2);
    set.points.push({
      pointA: swapped ? p2 : p1,
      pointB: swapped ? p1 : p2,
      distance: cpvdot(cpvsub(p2, p1), n)
    });
  }
  return set;
}

function cpArbiterTotalImpulse(arb) {
  const contacts = arb.contacts;
  const n = arb.n;
  let sum = cpvzero;

  for (let i = 0, count = cpArbiterGetCount(arb); i < count; i++) {
    const con = contacts[i];
    sum = cpvadd(sum, cpvrotate(n, cpv(con.jnAcc, con.jtAcc)));
  }
  return arb.swapped ? sum : cpvneg(sum);
}

function cpArbiterTotalKE(arb) {
  const eCoef = (1 - arb.e) / (1 + arb.e);
  let sum = 0;
  const contacts = arb.contacts;

  for (let i = 0, count = cpArbiterGetCount(arb); i < count; i++) {
    const con = contacts[i];
    sum += eCoef * con.jnAcc * con.jnAcc / con.nMass + con.jtAcc * con.jtAcc / con.tMass;
  }
  return sum;
}

function cpArbiterIgnore(arb) {
  arb.state = CP_ARBITER_STATE_IGNORE;
  return false;
}

function cpArbiterGetRestitution(arb) { return arb.e; }
function cpArbiterSetRestitution(arb, e) { arb.e = e; }
function cpArbiterGetFriction(arb) { return arb.u; }
function cpArbiterSetFriction(arb, u) { arb.u = u; }
function cpArbiterGetSurfaceVelocity(arb) {
  return cpvmult(arb.surface_vr, arb.swapped ? -1 : 1);
}
function cpArbiterSetSurfaceVelocity(arb, vr) {
  arb.surface_vr = cpvmult(vr, arb.swapped ? -1 : 1);
}
function cpArbiterGetUserData(arb) { return arb.data; }
function cpArbiterSetUserData(arb, d) { arb.data = d; }

function cpArbiterGetShapes(arb) {
  if (arb.swapped) return [arb.b, arb.a];
  return [arb.a, arb.b];
}

function cpArbiterGetBodies(arb) {
  const shapes = cpArbiterGetShapes(arb);
  return [shapes[0].body, shapes[1].body];
}

// ──────────────────────────── cpSpace ─────────────────────────────
class cpSpace {
  constructor() {
    this.iterations = 10;
    this.gravity = cpvzero;
    this.damping = 1;
    this.idleSpeedThreshold = 0;
    this.sleepTimeThreshold = INFINITY;
    this.collisionSlop = 0.1;
    this.collisionBias = Math.pow(1 - 0.1, 60);
    this.collisionPersistence = 3;
    this.userData = null;
    this.curr_dt = 0;

    this.bodies = new cpArray(0);
    this.staticBodies = new cpArray(0);
    this.actingBodies = new cpArray(0);

    this.shapeList = null;
    this.arbiterList = null;
    this.constraintList = null;

    this.currentShapes = null;
    this.sleepingShapes = null;

    this.dynamicShapes = { root: null };
    this.staticShapes = { root: null };

    this.arbiters = new cpHashSet(0, (a, b) => a === b);
    this.collisionHandlers = new cpHashSet(0, (a, b) => a === b);
    this.defaultHandler = {
      typeA: 0, typeB: 0,
      beginFunc: () => true,
      preSolveFunc: () => true,
      postSolveFunc: () => {},
      separateFunc: () => {},
      userData: null
    };
    this.usesWildcards = false;

    this.postStepCallbacks = {};
    this.locked = false;
    this.stamp = 0;
    this.staticBody = cpBodyNewStatic();
    this.staticBody.space = this;
  }

  _addBody(body) {
    body.space = this;
    this.bodies.push(body);
  }

  _addShape(shape) {
    shape.space = this;
    shape.spaceNext = this.shapeList;
    if (this.shapeList) this.shapeList.spacePrev = shape;
    this.shapeList = shape;
  }

  _removeShape(shape) {
    shape.space = null;
    if (shape.spacePrev) shape.spacePrev.spaceNext = shape.spaceNext;
    else this.shapeList = shape.spaceNext;
    if (shape.spaceNext) shape.spaceNext.spacePrev = shape.spacePrev;
    shape.spacePrev = null;
    shape.spaceNext = null;
  }

  _removeBody(body) {
    body.space = null;
    this.bodies.deleteObj(body);
  }
}

function cpSpaceNew() { return new cpSpace(); }

function cpSpaceGetIterations(space) { return space.iterations; }
function cpSpaceSetIterations(space, i) { space.iterations = i; }
function cpSpaceGetGravity(space) { return space.gravity; }
function cpSpaceSetGravity(space, g) { space.gravity = g; }
function cpSpaceGetDamping(space) { return space.damping; }
function cpSpaceSetDamping(space, d) { space.damping = d; }
function cpSpaceGetIdleSpeedThreshold(space) { return space.idleSpeedThreshold; }
function cpSpaceSetIdleSpeedThreshold(space, t) { space.idleSpeedThreshold = t; }
function cpSpaceGetSleepTimeThreshold(space) { return space.sleepTimeThreshold; }
function cpSpaceSetSleepTimeThreshold(space, t) { space.sleepTimeThreshold = t; }
function cpSpaceGetCollisionSlop(space) { return space.collisionSlop; }
function cpSpaceSetCollisionSlop(space, s) { space.collisionSlop = s; }
function cpSpaceGetCollisionBias(space) { return space.collisionBias; }
function cpSpaceSetCollisionBias(space, b) { space.collisionBias = b; }
function cpSpaceGetCollisionPersistence(space) { return space.collisionPersistence; }
function cpSpaceSetCollisionPersistence(space, p) { space.collisionPersistence = p; }
function cpSpaceGetUserData(space) { return space.userData; }
function cpSpaceSetUserData(space, d) { space.userData = d; }
function cpSpaceGetStaticBody(space) { return space.staticBody; }
function cpSpaceGetCurrentTimeStep(space) { return space.curr_dt; }
function cpSpaceIsLocked(space) { return space.locked; }

function cpSpaceAddBody(space, body) {
  space._addBody(body);
  return body;
}

function cpSpaceAddShape(space, shape) {
  space._addShape(shape);
  cpBodyAddShape(shape.body, shape);
  cpShapeCacheBB(shape);
  return shape;
}

function cpSpaceRemoveBody(space, body) {
  space._removeBody(body);
}

function cpSpaceRemoveShape(space, shape) {
  cpBodyRemoveShape(shape.body, shape);
  space._removeShape(shape);
}

function cpSpaceStep(space, dt) {
  space.curr_dt = dt;
  space.locked = true;

  // Integrate velocities (gravity + damping)
  let body = space.bodies.arr[0];
  for (let i = 0; i < space.bodies.num; i++) {
    body = space.bodies.arr[i];
    if (body.sleeping.idleTime === INFINITY) continue; // Skip static
    // Only apply gravity, don't damp velocity (JS sets velocity directly).
    body.v = cpvadd(body.v, cpvmult(space.gravity, dt));
  }

  // Update shape BBs before collision detection
  let shapeUpd = space.shapeList;
  while (shapeUpd) {
    cpShapeCacheBB(shapeUpd);
    shapeUpd = shapeUpd.spaceNext;
  }

  // Broadphase: detect collisions
  const contacts = [];

  // Simple collision detection: check all shape pairs
  let shapeA = space.shapeList;
  while (shapeA) {
    let shapeB = shapeA.spaceNext;
    while (shapeB) {
      // Skip if BOTH shapes are sensors (no collision at all).
      // If one is a sensor, detect collision but don't resolve (no impulse).
      // Filter check: skip if shapes are in the same collision group
      // (e.g. chain links that shouldn't collide with each other).
      if (shapeA.filter.group !== CP_NO_GROUP && shapeA.filter.group === shapeB.filter.group) {
        shapeB = shapeB.spaceNext;
        continue;
      }
      if (cpBBIntersects(shapeA.bb, shapeB.bb)) {
        const arbContacts = new Array(CP_MAX_CONTACTS_PER_ARBITER).fill(null);
        const info = cpCollide(shapeA, shapeB, 0, arbContacts);

        if (info.count > 0) {
          // FIX: cpCollide may swap a/b — use info.a/info.b, not shapeA/shapeB.
          const arb = new cpArbiter(info.a, info.b);
          // Normal points from info.a to info.b — correct for arbiter body_a/body_b.
          arb.n = info.n;
          arb.count = info.count;
          arb.contacts = arbContacts.slice(0, info.count);
          arb.e = info.a.e * info.b.e;
          arb.u = info.a.u * info.b.u;

          const surface_vr = cpvsub(info.b.surfaceV, info.a.surfaceV);
          arb.surface_vr = cpvsub(surface_vr, cpvmult(info.n, cpvdot(surface_vr, info.n)));

          // Convert contact points from absolute to body-relative coordinates.
          // FIX: use info.a/info.b (which may be swapped from shapeA/shapeB).
          for (let j = 0; j < arb.count; j++) {
            const con = arb.contacts[j];
            con.r1 = cpvsub(con.r1, info.a.body.p);
            con.r2 = cpvsub(con.r2, info.b.body.p);
          }

          // Pre-step: compute effective masses for each contact.
          const a = arb.body_a, b = arb.body_b, n = arb.n;
          for (let j = 0; j < arb.count; j++) {
            const con = arb.contacts[j];
            const r1 = con.r1, r2 = con.r2;
            // Normal mass: 1 / (1/mA + 1/mB + (r1×n)²/I_A + (r2×n)²/I_B)
            const rn1 = cpvcross(r1, n);
            const rn2 = cpvcross(r2, n);
            const kNormal = a.m_inv + b.m_inv + rn1 * rn1 * a.i_inv + rn2 * rn2 * b.i_inv;
            con.nMass = kNormal > 0 ? 1 / kNormal : 0;
            // Tangent mass
            const t = cpvperp(n);
            const rt1 = cpvcross(r1, t);
            const rt2 = cpvcross(r2, t);
            const kTangent = a.m_inv + b.m_inv + rt1 * rt1 * a.i_inv + rt2 * rt2 * b.i_inv;
            con.tMass = kTangent > 0 ? 1 / kTangent : 0;
            // Restitution (bounce)
            const vr = cpvsub(
              cpvadd(b.v, cpvmult(cpvperp(r2), b.w)),
              cpvadd(a.v, cpvmult(cpvperp(r1), a.w))
            );
            const vrn = cpvdot(vr, n);
            con.bounce = -vrn * arb.e;
            con.bias = 0;
            con.jBias = 0;
            con.jnAcc = 0;
            con.jtAcc = 0;
          }

          // Call collision handler (beginFunc).
          var handler = space.defaultHandler;
          if (handler && handler.beginFunc) {
            handler.beginFunc(arb, space);
          }

          contacts.push(arb);
        }
      }
      shapeB = shapeB.spaceNext;
    }
    shapeA = shapeA.spaceNext;
  }

  // Solve constraints — multiple iterations for stable collisions.
  // Skip solver for sensor contacts (no physical response).
  var iterations = space.iterations || 10;
  var physicalContacts = [];
  for (var ci = 0; ci < contacts.length; ci++) {
    if (!contacts[ci].a.sensor && !contacts[ci].b.sensor) {
      physicalContacts.push(contacts[ci]);
    }
  }
  // Pre-solve joints
  var constraints = space.constraintList;
  while (constraints) {
    if (constraints.preSolve) constraints.preSolve.call(constraints, dt);
    constraints = constraints.spaceNext;
  }
  for (var iter = 0; iter < iterations; iter++) {
    for (let j = 0; j < physicalContacts.length; j++) {
      cpArbiterApplyImpulse(physicalContacts[j]);
    }
    // Solve joints
    constraints = space.constraintList;
    while (constraints) {
      if (constraints.solve) constraints.solve.call(constraints);
      constraints = constraints.spaceNext;
    }
  }

  // Integrate positions
  for (let i = 0; i < space.bodies.num; i++) {
    body = space.bodies.arr[i];
    if (body.sleeping.idleTime === INFINITY) continue;
    body.position_func(body, dt);
  }

  // Update shape BBs
  shapeA = space.shapeList;
  while (shapeA) {
    cpShapeCacheBB(shapeA);
    shapeA = shapeA.spaceNext;
  }

  space.stamp++;
  space.locked = false;
}

function cpArbiterApplyImpulse(arb) {
  const a = arb.body_a, b = arb.body_b;
  const n = arb.n;

  for (let i = 0; i < arb.count; i++) {
    const con = arb.contacts[i];
    const r1 = con.r1, r2 = con.r2;

    // Relative velocity at contact point
    const vr = cpvsub(
      cpvadd(b.v, cpvmult(cpvperp(r2), b.w)),
      cpvadd(a.v, cpvmult(cpvperp(r1), a.w))
    );

    // Normal impulse (uses effective mass nMass)
    const vrn = cpvdot(vr, n);
    const jn = -con.nMass * (vrn + con.bounce);
    const jnOld = con.jnAcc;
    con.jnAcc = cpfmax(jnOld + jn, 0);
    const jnApply = con.jnAcc - jnOld;

    // Tangent impulse (friction, uses effective mass tMass)
    const t = cpvperp(n);
    const vrt = cpvdot(vr, t);
    const jt = -con.tMass * vrt;
    const jtMax = arb.u * con.jnAcc;
    const jtOld = con.jtAcc;
    con.jtAcc = cpfclamp(jtOld + jt, -jtMax, jtMax);
    const jtApply = con.jtAcc - jtOld;

    // Apply combined impulse
    const j = cpvadd(cpvmult(n, jnApply), cpvmult(t, jtApply));
    a.v = cpvsub(a.v, cpvmult(j, a.m_inv));
    a.w -= a.i_inv * cpvcross(r1, j);
    b.v = cpvadd(b.v, cpvmult(j, b.m_inv));
    b.w += b.i_inv * cpvcross(r2, j);

    // Positional correction — push overlapping objects apart.
    // FIX: update transform after position change!
    var depth = cpvdot(cpvadd(cpvsub(con.r2, con.r1), cpvsub(b.p, a.p)), n);
    if (depth < 0) {
      var slop = 0.1;
      var percent = 0.4;
      var correction = cpvmult(n, Math.max(-depth - slop, 0) / (a.m_inv + b.m_inv) * percent);
      if (a.m_inv > 0 && a.m_inv !== Infinity) {
        a.p = cpvsub(a.p, cpvmult(correction, a.m_inv));
        _setTransform(a, a.p, a.a);  // FIX: update transform!
      }
      if (b.m_inv > 0 && b.m_inv !== Infinity) {
        b.p = cpvadd(b.p, cpvmult(correction, b.m_inv));
        _setTransform(b, b.p, b.a);  // FIX: update transform!
      }
    }
  }
}

// ──────────────────────────── cpConstraint ─────────────────
class cpConstraint {
  constructor(klass, a, b) {
    this.klass = klass;
    this.a = a;
    this.b = b;
    this.space = null;
    this.spaceNext = null;
    this.maxForce = 1e10;  // large but finite — prevents infinite force on joints
    this.errorBias = Math.pow(1 - 0.1, 60);
    this.maxBias = INFINITY;
    this.collideBodies = true;
    this.userData = null;
  }
  preSolve(dt) {}
  postSolve() {}
  solve() {}
}

function cpConstraintGetSpace(c) { return c.space; }
function cpConstraintGetBodyA(c) { return c.a; }
function cpConstraintGetBodyB(c) { return c.b; }
function cpConstraintGetUserData(c) { return c.userData; }
function cpConstraintSetUserData(c, data) { c.userData = data; }
function cpConstraintGetMaxForce(c) { return c.maxForce; }
function cpConstraintSetMaxForce(c, f) { c.maxForce = f; }
function cpConstraintGetCollideBodies(c) { return c.collideBodies; }
function cpConstraintSetCollideBodies(c, v) { c.collideBodies = v; }

// ─── cpPivotJoint: pins two bodies at a pivot point ───
// Full 2D pin — solves both X and Y constraints simultaneously.
class cpPivotJoint extends cpConstraint {
  constructor(a, b, anchorA, anchorB) {
    super('pivot', a, b);
    this.anchorA = anchorA;
    this.anchorB = anchorB;
    this.r1 = cpvzero;
    this.r2 = cpvzero;
    this.bias = cpvzero;
    // 2x2 mass matrix inverse (stored as array)
    this.k11 = 0; this.k12 = 0; this.k21 = 0; this.k22 = 0;
    this.jAccX = 0; this.jAccY = 0;
    this.maxForce = 1e10;
  }
  preSolve(dt) {
    const a = this.a, b = this.b;
    // Convert local anchors to world-space relative offsets from body centers
    this.r1 = cpvrotate(this.anchorA, cpBodyGetRotation(a));
    this.r2 = cpvrotate(this.anchorB, cpBodyGetRotation(b));
    // Delta = (b.p + r2) - (a.p + r1) — the error vector
    const delta = cpvsub(cpvadd(b.p, this.r2), cpvadd(a.p, this.r1));
    // Bias velocity to correct the position error
    // FIX: Use dt (not dt*60) — errorBias is per-second fraction like original Chipmunk.
    const biasCoef = 1 - Math.pow(1 - this.errorBias, dt);
    this.bias = cpvmult(delta, -biasCoef / dt);
    // Build 2x2 effective mass matrix K = Ma^-1 + Mb^-1
    const k11 = a.m_inv + b.m_inv + this.r1.y*this.r1.y*a.i_inv + this.r2.y*this.r2.y*b.i_inv;
    const k12 = -this.r1.x*this.r1.y*a.i_inv - this.r2.x*this.r2.y*b.i_inv;
    const k22 = a.m_inv + b.m_inv + this.r1.x*this.r1.x*a.i_inv + this.r2.x*this.r2.x*b.i_inv;
    // Invert 2x2 matrix
    const det = k11*k22 - k12*k12;
    if (Math.abs(det) > 1e-10) {
      const invDet = 1/det;
      this.k11 = k22 * invDet;
      this.k12 = -k12 * invDet;
      this.k22 = k11 * invDet;
    } else {
      this.k11 = this.k12 = this.k22 = 0;
    }
    cpBodyActivate(a);
    cpBodyActivate(b);
  }
  solve() {
    const a = this.a, b = this.b;
    // Relative velocity at anchor points
    const vr = cpvsub(
      cpvadd(b.v, cpvmult(cpvperp(this.r2), b.w)),
      cpvadd(a.v, cpvmult(cpvperp(this.r1), a.w))
    );
    // Compute impulse: J = K^-1 * -(vr + bias)
    const jx = -(vr.x + this.bias.x) * this.k11 - (vr.y + this.bias.y) * this.k12;
    const jy = -(vr.x + this.bias.x) * this.k12 - (vr.y + this.bias.y) * this.k22;
    // Accumulate and clamp
    let jAccX = this.jAccX + jx;
    let jAccY = this.jAccY + jy;
    // Clamp accumulated impulse magnitude
    const jMag = Math.sqrt(jAccX*jAccX + jAccY*jAccY);
    if (jMag > this.maxForce) {
      const scale = this.maxForce / jMag;
      jAccX *= scale;
      jAccY *= scale;
    }
    const djx = jAccX - this.jAccX;
    const djy = jAccY - this.jAccY;
    this.jAccX = jAccX;
    this.jAccY = jAccY;
    // Apply impulse
    const impulse = cpv(djx, djy);
    a.v = cpvsub(a.v, cpvmult(impulse, a.m_inv));
    a.w -= a.i_inv * cpvcross(this.r1, impulse);
    b.v = cpvadd(b.v, cpvmult(impulse, b.m_inv));
    b.w += b.i_inv * cpvcross(this.r2, impulse);
  }
}
function cpPivotJointNew(a, b, pivot) {
  const anchorA = cpBodyWorldToLocal(a, pivot);
  const anchorB = cpBodyWorldToLocal(b, pivot);
  return new cpPivotJoint(a, b, anchorA, anchorB);
}
function cpPivotJointNew2(a, b, anchorA, anchorB) {
  return new cpPivotJoint(a, b, anchorA, anchorB);
}

// ─── cpSlideJoint: flexible chain (min/max distance) ───
class cpSlideJoint extends cpConstraint {
  constructor(a, b, anchorA, anchorB, min, max) {
    super('slide', a, b);
    this.anchorA = anchorA;
    this.anchorB = anchorB;
    this.min = min;
    this.max = max;
    this.r1 = cpvzero;
    this.r2 = cpvzero;
    this.n = cpvzero;
    this.nMass = 0;
    this.jnAcc = 0;
    this.bias = 0;
  }
  preSolve(dt) {
    const a = this.a, b = this.b;
    this.r1 = cpvsub(this.anchorA, a.cog);
    this.r1 = cpvrotate(this.r1, cpBodyGetRotation(a));
    this.r2 = cpvsub(this.anchorB, b.cog);
    this.r2 = cpvrotate(this.r2, cpBodyGetRotation(b));
    const delta = cpvsub(cpvadd(b.p, this.r2), cpvadd(a.p, this.r1));
    const dist = cpvlength(delta);
    // FIX: Match original C Chipmunk — only reset jnAcc when in range.
    // Old code reset jnAcc=0 every frame, which prevented the joint from
    // accumulating impulse needed to hold bodies against gravity.
    let pdist = 0;
    if (dist > this.max) {
      pdist = dist - this.max;
      if (dist > 0.0001) this.n = cpvmult(delta, 1/dist);
      else this.n = cpv(1, 0);
    } else if (dist < this.min) {
      pdist = this.min - dist;
      if (dist > 0.0001) this.n = cpvmult(delta, -1/dist);
      else this.n = cpv(-1, 0);
    } else {
      this.n = cpvzero;
      this.jnAcc = 0;
    }
    const rn1 = cpvcross(this.r1, this.n);
    const rn2 = cpvcross(this.r2, this.n);
    const k = a.m_inv + b.m_inv + rn1*rn1*a.i_inv + rn2*rn2*b.i_inv;
    this.nMass = k > 0 ? 1/k : 0;
    // Bias: clamp to [-maxBias, maxBias] like original.
    // FIX: Use dt directly (not dt*60) — errorBias is per-second fraction
    // like original Chipmunk. dt*60 made bias 50x too large, causing jn to
    // become positive and get clamped to 0 by Math.min(0, jn) — solver did nothing.
    const biasCoef = 1 - Math.pow(1 - this.errorBias, dt);
    this.bias = -biasCoef * pdist / dt;
    const mb = this.maxBias;
    if (this.bias < -mb) this.bias = -mb;
    else if (this.bias > mb) this.bias = mb;
    cpBodyActivate(a);
    cpBodyActivate(b);
  }
  solve() {
    const a = this.a, b = this.b;
    // Early exit if normal is zero (joint in range).
    if (this.n.x === 0 && this.n.y === 0) return;
    const delta = cpvsub(cpvadd(b.p, this.r2), cpvadd(a.p, this.r1));
    const dist = cpvlength(delta);
    if (dist >= this.min && dist <= this.max) return;
    const vr = cpvsub(cpvadd(b.v, cpvmult(cpvperp(this.r2), b.w)),
                      cpvadd(a.v, cpvmult(cpvperp(this.r1), a.w)));
    const vrn = cpvdot(vr, this.n);
    // Impulse to counteract relative velocity + bias.
    let jn = -vrn * this.nMass - this.bias;
    // For max constraint: only allow negative impulse (push b toward a).
    // For min constraint: only allow positive impulse (push b away from a).
    // Note: this.n points from a to b for max, from b to a for min (negated).
    if (dist > this.max) jn = Math.min(0, jn);
    else jn = Math.max(0, jn);
    const jnOld = this.jnAcc;
    this.jnAcc = jnOld + jn;
    // Clamp accumulated impulse to maxForce.
    const mf = this.maxForce;
    if (this.jnAcc > mf) this.jnAcc = mf;
    else if (this.jnAcc < -mf) this.jnAcc = -mf;
    jn = this.jnAcc - jnOld;
    const impulse = cpvmult(this.n, jn);
    a.v = cpvsub(a.v, cpvmult(impulse, a.m_inv));
    a.w -= a.i_inv * cpvcross(this.r1, impulse);
    b.v = cpvadd(b.v, cpvmult(impulse, b.m_inv));
    b.w += b.i_inv * cpvcross(this.r2, impulse);
  }
}
function cpSlideJointNew(a, b, anchorA, anchorB, min, max) {
  return new cpSlideJoint(a, b, anchorA, anchorB, min, max);
}

// ─── cpGearJoint: rigid fixation (keeps relative angle) ───
class cpGearJoint extends cpConstraint {
  constructor(a, b, phase, ratio) {
    super('gear', a, b);
    this.phase = phase;
    this.ratio = ratio;
    this.iSum = 0;
    this.jAcc = 0;
    this.bias = 0;
  }
  preSolve(dt) {
    const a = this.a, b = this.b;
    this.iSum = 1 / (a.i_inv * this.ratio + b.i_inv);
    const diff = a.a * this.ratio - b.a - this.phase;
    this.bias = -diff * (1 - Math.pow(1 - this.errorBias, dt*60)) / dt;
    cpBodyActivate(a);
    cpBodyActivate(b);
  }
  solve() {
    const a = this.a, b = this.b;
    let j = (a.w * this.ratio - b.w + this.bias) * this.iSum;
    const jOld = this.jAcc;
    this.jAcc = Math.max(-this.maxForce, Math.min(this.maxForce, jOld + j));
    j = this.jAcc - jOld;
    a.w -= j * this.ratio * a.i_inv;
    b.w += j * b.i_inv;
  }
}
function cpGearJointNew(a, b, phase, ratio) {
  return new cpGearJoint(a, b, phase, ratio);
}

// ─── cpSpace constraint management ───
function cpSpaceAddConstraint(space, constraint) {
  constraint.space = space;
  constraint.spaceNext = space.constraintList;
  space.constraintList = constraint;
  return constraint;
}
function cpSpaceRemoveConstraint(space, constraint) {
  if (space.constraintList === constraint) {
    space.constraintList = constraint.spaceNext;
  } else {
    let prev = space.constraintList;
    while (prev && prev.spaceNext !== constraint) prev = prev.spaceNext;
    if (prev) prev.spaceNext = constraint.spaceNext;
  }
  constraint.space = null;
  constraint.spaceNext = null;
}

// ──────────────────────────── cpBBTree (simplified) ───────────────
class cpBBTree {
  constructor(bbfunc, staticIndex) {
    this.leaves = new cpHashSet(0, (leaf, obj) => leaf.obj === obj);
    this.root = null;
    this.stamp = 0;
    this.bbfunc = bbfunc;
  }

  insert(obj, hashid) {
    const bb = this.bbfunc(obj);
    const leaf = this.leaves.insert(hashid, obj, (o) => ({
      obj: o, bb: this.bbfunc(o), parent: null, a: null, b: null, stamp: 0, pairs: null
    }));
    this.root = this._insert(this.root, leaf);
    leaf.stamp = this.stamp;
    this.stamp++;
  }

  remove(obj, hashid) {
    const leaf = this.leaves.remove(hashid, obj);
    if (leaf) {
      this.root = this._remove(this.root, leaf);
    }
  }

  query(obj, bb, func) {
    if (this.root) this._query(this.root, obj, bb, func);
  }

  _insert(subtree, leaf) {
    if (!subtree) return leaf;
    if (subtree.obj) return { bb: cpBBMerge(subtree.bb, leaf.bb), a: leaf, b: subtree, parent: null };
    const costA = cpBBArea(subtree.b.bb) + cpBBMergedArea(subtree.a.bb, leaf.bb);
    const costB = cpBBArea(subtree.a.bb) + cpBBMergedArea(subtree.b.bb, leaf.bb);
    if (costA < costB) {
      subtree.a = this._insert(subtree.a, leaf);
    } else {
      subtree.b = this._insert(subtree.b, leaf);
    }
    subtree.bb = cpBBMerge(subtree.bb, leaf.bb);
    return subtree;
  }

  _remove(subtree, leaf) {
    if (leaf === subtree) return null;
    if (subtree.a && !subtree.a.obj) {
      subtree.a = this._remove(subtree.a, leaf);
      if (subtree.a) subtree.bb = cpBBMerge(subtree.a.bb, subtree.b.bb);
      return subtree;
    }
    if (subtree.b && !subtree.b.obj) {
      subtree.b = this._remove(subtree.b, leaf);
      if (subtree.b) subtree.bb = cpBBMerge(subtree.a.bb, subtree.b.bb);
      return subtree;
    }
    return subtree;
  }

  _query(subtree, obj, bb, func) {
    if (!cpBBIntersects(subtree.bb, bb)) return;
    if (subtree.obj) {
      func(obj, subtree.obj);
    } else {
      if (subtree.a) this._query(subtree.a, obj, bb, func);
      if (subtree.b) this._query(subtree.b, obj, bb, func);
    }
  }
}

// ──────────────────────────── Exports ─────────────────────────────
var __cp_exports = {
  // Constants
  PI, INFINITY, CPFLOAT_MIN, CP_NO_GROUP, CP_ALL_CATEGORIES,
  CP_WILDCARD_COLLISION_TYPE, CP_MAX_CONTACTS_PER_ARBITER,
  CP_BODY_TYPE_DYNAMIC, CP_BODY_TYPE_KINEMATIC, CP_BODY_TYPE_STATIC,
  CP_CIRCLE_SHAPE, CP_SEGMENT_SHAPE, CP_POLY_SHAPE, CP_NUM_SHAPES,
  CP_ARBITER_STATE_FIRST_COLLISION, CP_ARBITER_STATE_NORMAL,
  CP_ARBITER_STATE_CACHED, CP_ARBITER_STATE_IGNORE, CP_ARBITER_STATE_INVALIDATED,
  CP_SHAPE_FILTER_ALL, CP_SHAPE_FILTER_NONE,

  // cpVect
  cpv, cpvzero, cpveql, cpvadd, cpvsub, cpvneg, cpvmult, cpvdot, cpvcross,
  cpvperp, cpvrperp, cpvproject, cpvforangle, cpvtoangle, cpvrotate, cpvunrotate,
  cpvlengthsq, cpvlength, cpvlerp, cpvnormalize, cpvslerp, cpvslerpconst,
  cpvclamp, cpvlerpconst, cpvdist, cpvdistsq, cpvnear,

  // Math
  cpfmax, cpfmin, cpfabs, cpfclamp, cpfclamp01, cpflerp, cpflerpconst,

  // cpMat2x2
  cpMat2x2New, cpMat2x2Transform,

  // cpBB
  cpBBNew, cpBBNewForExtents, cpBBNewForCircle, cpBBIntersects,
  cpBBContainsBB, cpBBContainsVect, cpBBMerge, cpBBExpand, cpBBCenter,
  cpBBArea, cpBBMergedArea, cpBBSegmentQuery, cpBBIntersectsSegment,
  cpBBClampVect, cpBBWrapVect, cpBBOffset,

  // cpTransform
  cpTransformIdentity, cpTransformNew, cpTransformNewTranspose,
  cpTransformInverse, cpTransformMult, cpTransformPoint, cpTransformVect,
  cpTransformbBB, cpTransformTranslate, cpTransformScale, cpTransformRotate,
  cpTransformRigid, cpTransformRigidInverse,

  // cpArray
  cpArray,

  // cpHashSet
  cpHashSet,

  // cpShapeFilter
  cpShapeFilterNew,

  // cpShape
  cpShape, cpCircleShape, cpSegmentShape, cpPolyShape,
  cpCircleShapeNew, cpSegmentShapeNew, cpPolyShapeNew, cpPolyShapeNewRaw,
  cpBoxShapeNew,
  cpShapeGetBody, cpShapeGetMass, cpShapeSetMass,
  cpShapeGetDensity, cpShapeSetDensity, cpShapeGetMoment,
  cpShapeGetArea, cpShapeGetCenterOfGravity, cpShapeGetElasticity,
  cpShapeSetElasticity, cpShapeGetFriction, cpShapeSetFriction,
  cpShapeGetSensor, cpShapeSetSensor, cpShapeGetFilter, cpShapeSetFilter,
  cpShapeGetCollisionType, cpShapeSetCollisionType, cpShapeGetBB,
  cpShapeGetSpace, cpShapeGetUserData, cpShapeSetUserData,
  cpShapeCacheBB, cpShapeUpdate, cpShapesCollide,
  cpPolyShapeGetCount, cpPolyShapeGetVert, cpPolyShapeGetRadius,

  // cpBody
  cpBody, cpBodyNew, cpBodyNewKinematic, cpBodyNewStatic,
  cpBodyGetType, cpBodySetType, cpBodyIsSleeping,
  cpBodyGetSpace, cpBodyGetMass, cpBodySetMass,
  cpBodyGetMoment, cpBodySetMoment, cpBodyGetRotation,
  cpBodyGetPosition, cpBodySetPosition,
  cpBodyGetCenterOfGravity, cpBodySetCenterOfGravity,
  cpBodyGetVelocity, cpBodySetVelocity,
  cpBodyGetForce, cpBodySetForce,
  cpBodyGetAngle, cpBodySetAngle,
  cpBodyGetAngularVelocity, cpBodySetAngularVelocity,
  cpBodyGetTorque, cpBodySetTorque,
  cpBodyGetUserData, cpBodySetUserData,
  cpBodyUpdateVelocity, cpBodyUpdatePosition,
  cpBodyLocalToWorld, cpBodyWorldToLocal,
  cpBodyApplyForceAtWorldPoint, cpBodyApplyForceAtLocalPoint,
  cpBodyApplyImpulseAtWorldPoint, cpBodyApplyImpulseAtLocalPoint,
  cpBodyGetVelocityAtLocalPoint, cpBodyGetVelocityAtWorldPoint,
  cpBodyKineticEnergy,
  cpBodyAddShape, cpBodyRemoveShape,

  // Physics math
  cpMomentForCircle, cpAreaForCircle,
  cpMomentForSegment, cpAreaForSegment,
  cpMomentForPoly, cpAreaForPoly, cpCentroidForPoly,
  cpMomentForBox, cpMomentForBox2,
  cpConvexHull, cpLoopIndexes,

  // cpCollision
  cpCollide,

  // cpArbiter
  cpArbiter, cpArbiterIsFirstContact, cpArbiterIsRemoval,
  cpArbiterGetCount, cpArbiterGetNormal, cpArbiterGetPointA, cpArbiterGetPointB,
  cpArbiterGetDepth, cpArbiterGetContactPointSet,
  cpArbiterTotalImpulse, cpArbiterTotalKE, cpArbiterIgnore,
  cpArbiterGetRestitution, cpArbiterSetRestitution,
  cpArbiterGetFriction, cpArbiterSetFriction,
  cpArbiterGetSurfaceVelocity, cpArbiterSetSurfaceVelocity,
  cpArbiterGetUserData, cpArbiterSetUserData,
  cpArbiterGetShapes, cpArbiterGetBodies,

  // cpSpace
  cpSpace, cpSpaceNew,
  cpSpaceGetIterations, cpSpaceSetIterations,
  cpSpaceGetGravity, cpSpaceSetGravity,
  cpSpaceGetDamping, cpSpaceSetDamping,
  cpSpaceGetIdleSpeedThreshold, cpSpaceSetIdleSpeedThreshold,
  cpSpaceGetSleepTimeThreshold, cpSpaceSetSleepTimeThreshold,
  cpSpaceGetCollisionSlop, cpSpaceSetCollisionSlop,
  cpSpaceGetCollisionBias, cpSpaceSetCollisionBias,
  cpSpaceGetCollisionPersistence, cpSpaceSetCollisionPersistence,
  cpSpaceGetUserData, cpSpaceSetUserData,
  cpSpaceGetStaticBody, cpSpaceGetCurrentTimeStep, cpSpaceIsLocked,
  cpSpaceAddBody, cpSpaceAddShape, cpSpaceRemoveBody, cpSpaceRemoveShape,
  cpSpaceStep,

  // cpConstraint
  cpConstraint, cpConstraintGetSpace, cpConstraintGetBodyA, cpConstraintGetBodyB,
  cpConstraintGetUserData, cpConstraintSetUserData,
  cpConstraintGetMaxForce, cpConstraintSetMaxForce,
  cpConstraintGetCollideBodies, cpConstraintSetCollideBodies,
  cpPivotJoint, cpPivotJointNew, cpPivotJointNew2,
  cpSlideJoint, cpSlideJointNew,
  cpGearJoint, cpGearJointNew,
  cpSpaceAddConstraint, cpSpaceRemoveConstraint,

  // cpBBTree
  cpBBTree,
};

// Make all Chipmunk exports global.
(function() {
    for (var key in __cp_exports) {
        if (__cp_exports.hasOwnProperty(key)) {
            window[key] = __cp_exports[key];
        }
    }
    window.cp = __cp_exports;
})();
// Missing function wrappers
function cpBodyActivate(body) { if (body && body._activate) body._activate(); }
function cpBodySleep(body) {}
function cpBodyWake(body) { if (body && body._activate) body._activate(); }
function cpSpaceUseSpatialHash(space, dim, count) {}
function cpSpaceSetCollisionPersistence(space, p) { space.collisionPersistence = p; }
window.cpBodyActivate = cpBodyActivate;
window.cpBodySleep = cpBodySleep;
window.cpBodyWake = cpBodyWake;
window.cpSpaceUseSpatialHash = cpSpaceUseSpatialHash;
window.cpSpaceSetCollisionPersistence = cpSpaceSetCollisionPersistence;

// Основные переменные игры
const canvas = document.getElementById("cnv");
var g_ctx = canvas.getContext("2d");
// Инициализация графики
g_ctx.fillStyle = "rgb(0 0 0)";
g_ctx.fillRect(0, 0, 1280, 720);
// Глобальные переменные
var image_array = [];
var game_helper_timers = [];
var gravitation = 0;
var draw_bounding_box = false;
var draw_physics_shapes = false;  // draw all Chipmunk shapes as white outlines
var debugShowExpandedObjectsBorder = true;
let gamepads = {};
var inputState = {
        devices: [{ // Устройство 0 (геймпад или клавиатура)
                        keys: {},
                        pressKeys: {}, // Пресс-клавиши только для этого устройства
                        pressButton: [],
                        axes: []
                }, { // Устройство 1 (клавиатура, если есть геймпад)
                        keys: {},
                        pressKeys: {}, // Пресс-клавиши только для этого устройства
                        pressButton: [],
                        axes: []
                }
        ],
        hasGamepad: false
};
var local = {};
var Draw = {};
var Game = {
        allObject: [],
        sound_array: [],
        screenx: 0,
        screeny: 0,
        gravitation: 0,
        helper: {
                pause: false,
                enableDrawing: false,
                enableTouchInput: false,
                lastFrameTime: 0,
                deltaTime: 0,
        }
};

Game.helper.keyRemapping = {
        // Стандартные назначения (соответствуют оригинальным)
        "KeyA": "KeyA",
        "KeyB": "KeyS",
        "KeyX": "KeyX",
        "KeyY": "KeyZ",
        "KeyL": "KeyW",
        "KeyR": "KeyE",
        "KeyZL": "KeyQ",
        "KeyZR": "KeyR",
        "KeyPlus": "Enter",
        "KeyMinus": "Backspace",
        "ArrowLeft": "ArrowLeft",
        "ArrowUp": "ArrowUp",
        "ArrowRight": "ArrowRight",
        "ArrowDown": "ArrowDown",
        "KeyLStickLeft": "KeyJ",
        "KeyLStickUp": "KeyI",
        "KeyLStickRight": "KeyL",
        "KeyLStickDown": "KeyK",
        "KeyRStickLeft": "Numpad4",
        "KeyRStickUp": "Numpad8",
        "KeyRStickRight": "Numpad6",
        "KeyRStickDown": "Numpad2"
};


Game.physics = {
    space: null,
    staticBody: null,
    initialized: false,
    // JS-space distance joints (master/slave model) for PivotJoint/SlideJoint/GearJoint/RigidJoint.
    distanceJoints: [],
    // Native Chipmunk constraints (used by chains). These are solved by
    // Chipmunk's native solver with proper impulse-based correction, unlike
    // distanceJoints which use manual position correction + Verlet.
    nativeConstraints: [],
    // Counter for chain collision groups. Each new chain increments this,
    // so links within the same chain share a group id and don't collide
    // with each other. Start at 0 so the first chain gets group 1.
    _chainGroupCounter: 0,
    init: function() {
        if (this.initialized) return;
        this.space = cpSpaceNew();
        // Iterations: more = more stable stacks and collision response.
        // Increased from 20 to 40 for better stability with many stacked objects.
        cpSpaceSetIterations(this.space, 120);
        // Disable sleeping — sleeping bodies break joints when woken by impact.
        // A chain that's settled will sleep, then when an object hits it,
        // the woken bodies rip joints apart because sleeping bodies don't
        // participate in the solver until activated.
        cpSpaceSetSleepTimeThreshold(this.space, Infinity);
        cpSpaceSetDamping(this.space, 0.99);
        // Collision slop: reduced from 0.1 to 0.05 — less tolerance means
        // objects are pushed out of walls sooner, reducing tunneling when
        // many objects stack up.
        cpSpaceSetCollisionSlop(this.space, 0.05);
        this.staticBody = cpSpaceGetStaticBody(this.space);
        this.initialized = true;
        this.space.defaultHandler.beginFunc = function(arb, space) {
            var a = arb.a, b = arb.b;
            var obj_a = a.userData;
            var obj_b = b.userData;
            // Skip tile-vs-object and tile-vs-tile (tiles have userData=-1).
            if (obj_a && obj_b && obj_a !== -1 && obj_b !== -1) {
                if (!obj_a._collisionSet) obj_a._collisionSet = new Set();
                if (!obj_a._collisionSet.has(obj_b)) {
                    obj_a._collisionSet.add(obj_b);
                    if (!obj_a._collisions) obj_a._collisions = [];
                    obj_a._collisions.push(obj_b);
                }
                if (!obj_b._collisionSet) obj_b._collisionSet = new Set();
                if (!obj_b._collisionSet.has(obj_a)) {
                    obj_b._collisionSet.add(obj_a);
                    if (!obj_b._collisions) obj_b._collisions = [];
                    obj_b._collisions.push(obj_a);
                }
            }
            return true;
        };
    },
    createBody: function(obj, id) {
        if (!this.space) this.init();  // Auto-init if not yet initialized
        if (!this.space || obj._cpBody) return;
        // For static objects, create a STATIC body (like tiles).
        // JS controls position, but Chipmunk handles collision — dynamic
        // objects will bounce off static objects, not push them.
        var w = Math.max(obj.width, 1);
        var h = Math.max(obj.height, 1);
        var mass = Math.max(obj.mass, 0.0001);
        var shape_type = obj.collisionShape;
        var radius = 0;
        if (typeof shape_type === 'object' && shape_type !== null) {
            radius = shape_type.radius || 0;
            if (radius > 0) shape_type = 2; else shape_type = 0;
        }
        var moment;

        var body;
        if (obj.isStatic) {
            // Static body — infinite mass, not affected by gravity or collisions.
            // JS controls position directly via syncToBody.
            body = cpBodyNewStatic();
            cpBodySetPosition(body, cpv(obj.x + w * 0.5, obj.y + h * 0.5));
            cpBodySetAngle(body, obj.angle * Math.PI / 180.0);
            cpSpaceAddBody(this.space, body);
        } else {
            // Dynamic body — affected by gravity, pushed by collisions.
            if (shape_type === 2) {
                if (!radius) radius = (w + h) * 0.25;
                moment = cpMomentForCircle(mass, 0, radius, cpvzero);
            } else {
                moment = cpMomentForBox(mass, w, h);
            }
            body = cpBodyNew(mass, moment);
            cpBodySetPosition(body, cpv(obj.x + w * 0.5, obj.y + h * 0.5));
            cpBodySetAngle(body, obj.angle * Math.PI / 180.0);
            // Lock rotation by default (platformer-style). JS can unlock
            // via obj.lockRotation = 0.
            if (obj.lock_rotation !== 0) {
                body.i = Infinity;
                body.i_inv = 0;
            }
            cpSpaceAddBody(this.space, body);
        }
        // Create shape (same for both static and dynamic).
        var shape;
        if (shape_type === 2) {
            if (!radius) radius = (w + h) * 0.25;
            shape = cpCircleShapeNew(body, radius, cpvzero);
        } else {
            shape = cpBoxShapeNew(body, w, h, 0);
        }
        cpShapeSetFriction(shape, obj.friction !== undefined ? obj.friction : 0.7);
        cpShapeSetElasticity(shape, Math.min(obj.restitution || 0.1, 0.5));
        // FIX: Store the OBJECT REFERENCE (not array index) in userData.
        // This makes beginFunc immune to Array.splice() shifts caused by
        // Game.removeObject(). Tiles use userData = -1 as a sentinel.
        cpShapeSetUserData(shape, obj);
        // If solid=0, make sensor — detects collisions but no physical response.
        // NOTE: obj.solid may not be set yet at this point (default is 1).
        // We also check sensor in syncToBody/syncFromBody as a fallback.
        if (obj.solid === 0) cpShapeSetSensor(shape, true);
        cpSpaceAddShape(this.space, shape);
        obj._cpBody = body;
        obj._cpShape = shape;
        // Track the width/height the shape was created with, so syncToBody
        // can detect changes and recreate the shape.
        shape._lastWidth = w;
        shape._lastHeight = h;
        // Also update sensor status if solid changes later.
        obj._checkSensor = function() {
            if (this._cpShape) cpShapeSetSensor(this._cpShape, this.solid === 0);
        };
        obj._blockedRight = false;
        obj._blockedLeft = false;
        obj._blockedDown = false;
        obj._blockedUp = false;
    },
    destroyBody: function(obj) {
        if (!this.space || !obj._cpBody) return;
        if (obj._cpShape) { cpSpaceRemoveShape(this.space, obj._cpShape); obj._cpShape = null; }
        if (obj._cpBody) { cpSpaceRemoveBody(this.space, obj._cpBody); obj._cpBody = null; }
    },
    recreateShape: function(obj, id) {
        if (!this.space || !obj._cpBody) return;
        if (obj._cpShape) { cpSpaceRemoveShape(this.space, obj._cpShape); obj._cpShape = null; }
        var w = Math.max(obj.width, 1);
        var h = Math.max(obj.height, 1);
        var shape_type = obj.collisionShape;
        var radius = 0;
        if (typeof shape_type === 'object' && shape_type !== null) {
            radius = shape_type.radius || 0;
            if (radius > 0) shape_type = 2; else shape_type = 0;
        }
        var shape;
        if (shape_type === 2) {
            if (!radius) radius = (w + h) * 0.25;
            shape = cpCircleShapeNew(obj._cpBody, radius, cpvzero);
        } else {
            shape = cpBoxShapeNew(obj._cpBody, w, h, 0);
        }
        cpShapeSetFriction(shape, obj.friction !== undefined ? obj.friction : 0.7);
        cpShapeSetElasticity(shape, Math.min(obj.restitution || 0.1, 0.5));
        // FIX: Store OBJECT REFERENCE (not index) — same as createBody.
        cpShapeSetUserData(shape, obj);
        if (obj.solid === 0) cpShapeSetSensor(shape, true);
        // Preserve chain collision group across shape recreation.
        // Without this, recreateShape (called when width/height changes)
        // creates a new shape with default filter, and chain links would
        // start colliding with each other again.
        if (obj._chainGroup) {
            cpShapeSetFilter(shape, cpShapeFilterNew(obj._chainGroup, CP_ALL_CATEGORIES, CP_ALL_CATEGORIES));
        }
        cpSpaceAddShape(this.space, shape);
        obj._cpShape = shape;
        // Track the width/height the shape was created with.
        shape._lastWidth = w;
        shape._lastHeight = h;
        var mass = Math.max(obj.mass, 0.0001);
        var moment;
        if (shape_type === 2) {
            if (!radius) radius = (w + h) * 0.25;
            moment = cpMomentForCircle(mass, 0, radius, cpvzero);
        } else {
            moment = cpMomentForBox(mass, w, h);
        }
        // Re-apply rotation lock if enabled.
        if (obj.lock_rotation !== 0) {
            moment = Infinity;
        }
        cpBodySetMoment(obj._cpBody, moment);
    },
    createTiles: function() {
        if (!this.space) this.init();  // Auto-init if not yet initialized
        if (!this.space || !Game.helper.tiles || !Game.helper.tiles.grid) return;
        var ts = Game.helper.tiles.tileSize;
        var rows = Game.helper.tiles.rows;
        var cols = Game.helper.tiles.cols;
        for (var row = 0; row < rows; row++) {
            var col = 0;
            while (col < cols) {
                if (!Game.helper.tiles.solidMap[row + '_' + col]) { col++; continue; }
                var runStart = col;
                while (col < cols && Game.helper.tiles.solidMap[row + '_' + col]) { col++; }
                var runEnd = col;
                var runWidth = (runEnd - runStart) * ts;
                var centerX = runStart * ts + runWidth * 0.5;
                var centerY = row * ts + ts * 0.5;
                var staticBody = cpBodyNewStatic();
                cpBodySetPosition(staticBody, cpv(centerX, centerY));
                cpSpaceAddBody(this.space, staticBody);
                var shape = cpBoxShapeNew(staticBody, runWidth, ts, 0);
                cpShapeSetFriction(shape, 0.8);
                cpShapeSetElasticity(shape, 0.0);
                cpShapeSetUserData(shape, -1);
                cpSpaceAddShape(this.space, shape);
            }
        }
    },
    syncToBody: function(obj) {
        if (!obj._cpBody) return;
        // FIX: Recreate the shape if width/height changed since createBody
        // (e.g. new_rock sets obj.width = size AFTER addObject). Without
        // this, the shape stays at the original 128x128 while obj.width is
        // 32, causing BB mismatch → collisions missed or detected at wrong
        // positions. recreateShape creates a new shape with the current
        // obj.width/height and updates _lastWidth/_lastHeight.
        if (obj._cpShape && obj._cpShape._lastWidth !== obj.width) {
            this.recreateShape(obj, 0);
        }
        // Static objects: JS controls position, set it directly.
        if (obj.isStatic) {
            // Ensure Chipmunk body is also static (isStatic may have been
            // set AFTER createBody, which created a dynamic body).
            if (cpBodyGetType(obj._cpBody) !== CP_BODY_TYPE_STATIC) {
                cpBodySetType(obj._cpBody, CP_BODY_TYPE_STATIC);
            }
            var scx = obj.x + obj.width * 0.5;
            var scy = obj.y + obj.height * 0.5;
            cpBodySetPosition(obj._cpBody, cpv(scx, scy));
            cpBodySetAngle(obj._cpBody, obj.angle * Math.PI / 180.0);
            return;
        }
        // Dynamic objects: set velocity (with blocked direction checks).
        var pos = cpBodyGetPosition(obj._cpBody);
        var cx = obj.x + obj.width * 0.5;
        var cy = obj.y + obj.height * 0.5;
        // FIX: Only sync body position if JS code changed obj.x/y since last
        // frame. Compare with prev_x/prev_y (set at frame start BEFORE onStep).
        // EXCEPTION: if _bodyFresh is true (object just created), always sync.
        // This handles the pattern:
        //   var o = Game.addObject(name, 0, 0, w, h, s);
        //   o.x = realX; o.y = realY;
        // where the body is created at (0,0) but o.x/o/y are changed AFTER
        // addObject. Without _bodyFresh, prev_x would equal o.x (both set
        // to realX by the time the onStep loop runs) and the body would
        // never be updated, causing the object to teleport to (0,0).
        if (obj._bodyFresh || obj.x !== obj.prev_x || obj.y !== obj.prev_y) {
            cpBodySetPosition(obj._cpBody, cpv(cx, cy));
            obj._bodyFresh = false;
        }
        // DEBUG
        if ((obj.name === 'ball' || obj.name === 'knight') && window._sbDbg <= 30) {
            console.log('[st ' + obj.name + '] obj.x=' + obj.x.toFixed(1) + ' prev_x=' + (obj.prev_x||0).toFixed(1) + ' bodyPos=(' + pos.x.toFixed(1) + ',' + pos.y.toFixed(1) + ') posChanged=' + (obj.x !== obj.prev_x || obj.y !== obj.prev_y) + ' speedx=' + obj.speedx.toFixed(2) + ' speedy=' + obj.speedy.toFixed(2));
        }
        // Always set body angle from obj.angle. For chain links, obj.angle
        // is updated in applyDistanceJoints post-step to point along the
        // chain direction. With lock_rotation=1 (moment=Infinity), Chipmunk
        // won't change it.
        cpBodySetAngle(obj._cpBody, obj.angle * Math.PI / 180.0);
        // Sync mass: if obj.mass changed (e.g. from prototype copy after
        // addObject), update the Chipmunk body mass. Without this, all bodies
        // keep mass=1 (the default from addObject) regardless of obj.mass.
        // This is critical for chains — mass-based joint correction needs
        // the Chipmunk body to have the correct mass.
        if (obj._cpBody.m !== obj.mass) {
            cpBodySetMass(obj._cpBody, Math.max(obj.mass, 0.0001));
        }
        // Always set body velocity from obj.speedx/speedy. This is the
        // original engine model: JS is the authority on velocity.
        // Mass still matters for collision response (push force) because
        // Chipmunk uses body mass when resolving overlaps.
        var vx = obj.speedx * 60;
        var vy = obj.speedy * 60;
        if (obj.solid !== 0) {
            if (obj._blockedRight && vx > 0) vx = 0;
            if (obj._blockedLeft && vx < 0) vx = 0;
            if (obj._blockedUp && vy > 0) vy = 0;
            if (obj._blockedDown && vy < 0) vy = 0;
        }
        cpBodySetVelocity(obj._cpBody, cpv(vx, vy));
        // Handle lockRotation: if locked, zero angular velocity and set
        // moment to Infinity so collisions don't cause spin. If unlocked,
        // restore the computed moment so the body can rotate freely.
        // If obj.rotationSpeed is set (non-zero), apply it as angular velocity.
        if (obj.lock_rotation !== 0) {
            if (obj.rotationSpeed) {
                // Locked rotation but user wants to spin manually.
                // Don't zero angular velocity — apply rotationSpeed instead.
                cpBodySetAngularVelocity(obj._cpBody, obj.rotationSpeed * Math.PI / 180.0);
                if (obj._cpBody.i === Infinity) {
                    var m2 = Math.max(obj.mass, 0.0001);
                    var bw2 = Math.max(obj.boundingWidth || obj.width, 1);
                    var bh2 = Math.max(obj.boundingHeight || obj.height, 1);
                    var mom2;
                    if (typeof obj.collisionShape === 'object' && obj.collisionShape !== null && obj.collisionShape.radius > 0) {
                        mom2 = cpMomentForCircle(m2, 0, obj.collisionShape.radius, cpvzero);
                    } else {
                        mom2 = cpMomentForBox(m2, bw2, bh2);
                    }
                    cpBodySetMoment(obj._cpBody, mom2);
                }
            } else {
                cpBodySetAngularVelocity(obj._cpBody, 0);
                if (obj._cpBody.i !== Infinity) {
                    obj._cpBody.i = Infinity;
                    obj._cpBody.i_inv = 0;
                }
            }
        } else {
            if (obj.rotationSpeed) {
                cpBodySetAngularVelocity(obj._cpBody, obj.rotationSpeed * Math.PI / 180.0);
            }
            if (obj._cpBody.i === Infinity) {
                // Recompute moment from current dimensions.
                var m = Math.max(obj.mass, 0.0001);
                var w2 = Math.max(obj.width, 1);
                var h2 = Math.max(obj.height, 1);
                var mom;
                var st = obj.collisionShape;
                if (typeof st === 'object' && st !== null && st.radius > 0) {
                    mom = cpMomentForCircle(m, 0, st.radius, cpvzero);
                } else {
                    mom = cpMomentForBox(m, w2, h2);
                }
                cpBodySetMoment(obj._cpBody, mom);
            }
        }
        cpBodyActivate(obj._cpBody);
    },
    syncFromBody: function(obj) {
        if (!obj._cpBody) return;
        if (obj.isStatic) return;
        if (obj.solid === 0) return;
        var pos = cpBodyGetPosition(obj._cpBody);
        var vel = cpBodyGetVelocity(obj._cpBody);
        // NaN/Infinity guard — if physics explodes, reset to safe state.
        if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(vel.x) || !isFinite(vel.y)) {
            obj.speedx = 0; obj.speedy = 0;
            cpBodySetVelocity(obj._cpBody, cpv(0, 0));
            cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
            return;
        }
        // Clamp velocity to prevent runaway physics.
        var maxV = 3000;
        if (Math.abs(vel.x) > maxV || Math.abs(vel.y) > maxV) {
            vel.x = Math.max(-maxV, Math.min(maxV, vel.x));
            vel.y = Math.max(-maxV, Math.min(maxV, vel.y));
            cpBodySetVelocity(obj._cpBody, vel);
        }
        // Clamp angular velocity to prevent spinning explosion.
        var angVel = cpBodyGetAngularVelocity(obj._cpBody);
        if (!isFinite(angVel) || Math.abs(angVel) > 20) {
            cpBodySetAngularVelocity(obj._cpBody, Math.max(-20, Math.min(20, isFinite(angVel) ? angVel : 0)));
        }
        obj.x = pos.x - obj.width * 0.5;
        obj.y = pos.y - obj.height * 0.5;
        obj.speedx = vel.x / 60;
        obj.speedy = vel.y / 60;
        obj.angle = cpBodyGetAngle(obj._cpBody) * 180 / Math.PI;
        // DEBUG
        if ((obj.name === 'ball' || obj.name === 'knight') && typeof window._sbDbg === 'undefined') window._sbDbg = 0;
        if ((obj.name === 'ball' || obj.name === 'knight')) {
            window._sbDbg++;
            if (window._sbDbg <= 30) {
                console.log('[sb ' + obj.name + '] pos=(' + pos.x.toFixed(1) + ',' + pos.y.toFixed(1) + ') vel=(' + vel.x.toFixed(1) + ',' + vel.y.toFixed(1) + ') obj.x=' + obj.x.toFixed(1) + ' obj.y=' + obj.y.toFixed(1) + ' speedx=' + obj.speedx.toFixed(2) + ' speedy=' + obj.speedy.toFixed(2) + ' isOnGround=' + obj.isOnGround);
            }
        }
        var ts = Game.helper.tiles ? Game.helper.tiles.tileSize : 32;
        var grid = Game.helper.tiles ? Game.helper.tiles.grid : null;
        if (!grid) { obj.isOnGround = 0; return; }
        // FIX: Hard wall clamp using prev_x/prev_y (last known non-penetrating
        // position). ONLY applies for DEEP penetration (tunneling) — when the
        // object has moved more than half a tile into a wall in one frame.
        // Shallow penetration (1-2px from normal landing) is left to MTV
        // push-out, which handles it smoothly without breaking platformer
        // physics (jumping, walking on platforms).
        // Threshold: penetration depth > half tile size = tunneling.
        var prevX = obj.prev_x !== undefined ? obj.prev_x : obj.x;
        var prevY = obj.prev_y !== undefined ? obj.prev_y : obj.y;
        // Compute displacement this frame — large displacement = high speed.
        var dispX = obj.x - prevX;
        var dispY = obj.y - prevY;
        var dispLen = Math.sqrt(dispX * dispX + dispY * dispY);
        // Only use hard clamp for fast-moving objects (tunneling risk).
        // Threshold: moved more than 1 tile in one frame = tunneling.
        if (dispLen > ts) {
            // Quick check: is the object overlapping any solid tile at current pos?
            var leftNow = Math.floor(obj.x / ts);
            var rightNow = Math.floor((obj.x + obj.width - 0.01) / ts);
            var topNow = Math.floor(obj.y / ts);
            var bottomNow = Math.floor((obj.y + obj.height - 0.01) / ts);
            var penetratingNow = false;
            for (var r = topNow; r <= bottomNow && !penetratingNow; r++) {
                for (var c = leftNow; c <= rightNow && !penetratingNow; c++) {
                    if (c < 0 || r < 0 || r >= Game.helper.tiles.rows || c >= Game.helper.tiles.cols) continue;
                    if (Game.helper.tiles.solidMap[r + '_' + c]) { penetratingNow = true; }
                }
            }
            if (penetratingNow) {
                // Check if prev position was safe (not penetrating).
                var leftPrev = Math.floor(prevX / ts);
                var rightPrev = Math.floor((prevX + obj.width - 0.01) / ts);
                var topPrev = Math.floor(prevY / ts);
                var bottomPrev = Math.floor((prevY + obj.height - 0.01) / ts);
                var safePrev = true;
                for (var r = topPrev; r <= bottomPrev && safePrev; r++) {
                    for (var c = leftPrev; c <= rightPrev && safePrev; c++) {
                        if (c < 0 || r < 0 || r >= Game.helper.tiles.rows || c >= Game.helper.tiles.cols) continue;
                        if (Game.helper.tiles.solidMap[r + '_' + c]) { safePrev = false; }
                    }
                }
                if (safePrev) {
                    // Revert to previous safe position but DON'T zero velocity —
                    // Chipmunk's collision response handles velocity. Zeroing it
                    // breaks joints (joint sees zero velocity on one body and
                    // pulls the other body toward it).
                    obj.x = prevX;
                    obj.y = prevY;
                    if (obj._cpBody) {
                        cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                    }
                    obj.isOnGround = obj._blockedUp ? 1 : 0;
                    return;  // Skip MTV push-out, position is already safe.
                }
                // If prev position is ALSO penetrating, fall through to MTV.
            }
        }
        // FIX: Check tiles the object is OVERLAPPING (not adjacent).
        // This is more accurate — if any part of the object overlaps a solid tile,
        // that direction is blocked. The old code checked adjacent tiles (bottom+1 etc.)
        // which caused false positives (blocked when 1 tile away).
        var left = Math.floor(obj.x / ts);
        var right = Math.floor((obj.x + obj.width - 0.01) / ts);
        var top = Math.floor(obj.y / ts);
        var bottom = Math.floor((obj.y + obj.height - 0.01) / ts);
        function isSolid(col, row) {
            if (col < 0 || row < 0) return false;
            if (row >= Game.helper.tiles.rows || col >= Game.helper.tiles.cols) return false;
            return Game.helper.tiles.solidMap[row + '_' + col] || false;
        }
        // FIX: Snapshot colliding tiles BEFORE push-out so the debug overlay
        // can show them. Without this, push-out moves obj.x/obj.y outside
        // the wall BEFORE we get to the snapshot code at the end, so the
        // overlap check there fails and _debugCollidingTiles ends up empty.
        // We also avoid overwriting on the second syncFromBody call (the
        // post-onCollision-teleport re-validation) — that call would clear
        // legitimate collision tiles because the object has already been
        // pushed out of walls by the first call.
        if (draw_bounding_box) {
            if (!obj._debugCollidingTilesFrame || obj._debugCollidingTilesFrame !== Game.helper.frameCount) {
                obj._debugCollidingTiles = [];
                obj._debugCollidingTilesFrame = Game.helper.frameCount;
                for (var r = top; r <= bottom; r++) {
                    for (var c = left; c <= right; c++) {
                        if (!isSolid(c, r)) continue;
                        var tl = c * ts, tr = (c+1) * ts, tt = r * ts, tb = (r+1) * ts;
                        if (obj.x + obj.width > tl && obj.x < tr &&
                            obj.y + obj.height > tt && obj.y < tb) {
                            obj._debugCollidingTiles.push({col: c, row: r});
                        }
                    }
                }
            }
        }
        // Reset blocked flags.
        obj._blockedDown = false;
        obj._blockedUp = false;
        obj._blockedRight = false;
        obj._blockedLeft = false;
        // Check each tile the object overlaps.
        for (var r = top; r <= bottom; r++) {
            for (var c = left; c <= right; c++) {
                if (!isSolid(c, r)) continue;
                // Found a solid tile overlapping the object.
                var tileLeft = c * ts;
                var tileRight = (c + 1) * ts;
                var tileTop = r * ts;
                var tileBottom = (r + 1) * ts;
                var pushL = (obj.x + obj.width) - tileLeft;  // push left
                var pushR = tileRight - obj.x;                // push right
                var pushU = (obj.y + obj.height) - tileTop;   // push up
                var pushD = tileBottom - obj.y;                // push down
                var minPush = Math.min(pushL, pushR, pushU, pushD);
                if (minPush === pushU) {
                    obj._blockedUp = true;
                    obj.y = tileTop - obj.height;
                    if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                } else if (minPush === pushD) {
                    obj._blockedDown = true;
                    obj.y = tileBottom;
                    if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                } else if (minPush === pushL) {
                    obj._blockedRight = true;
                    obj.x = tileLeft - obj.width;
                    if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                } else if (minPush === pushR) {
                    obj._blockedLeft = true;
                    obj.x = tileRight;
                    if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                }
            }
        }
        // Also check static game objects (isStatic=1) as solid obstacles.
        for (var si = 0; si < Game.allObject.length; si++) {
            var sobj = Game.allObject[si];
            if (!sobj || sobj === obj || !sobj.isStatic || !sobj.solid) continue;
            // AABB overlap test.
            if (obj.x + obj.width <= sobj.x || obj.x >= sobj.x + sobj.width ||
                obj.y + obj.height <= sobj.y || obj.y >= sobj.y + sobj.height) continue;
            // DEBUG
            if (typeof window._cpDbg === 'undefined') window._cpDbg = 0;
            if (window._cpDbg < 10) {
                window._cpDbg++;
                console.log('[pushOut-static] obj.x=' + obj.x.toFixed(1) + ' sobj.x=' + sobj.x + ' pL=' + ((obj.x+obj.width)-sobj.x).toFixed(1) + ' pR=' + (sobj.x+sobj.width-obj.x).toFixed(1));
            }
            // Overlap found — push out using MTV.
            var sL = sobj.x, sR = sobj.x + sobj.width;
            var sT = sobj.y, sB = sobj.y + sobj.height;
            var pL = (obj.x + obj.width) - sL;
            var pR = sR - obj.x;
            var pU = (obj.y + obj.height) - sT;
            var pD = sB - obj.y;
            var sMin = Math.min(pL, pR, pU, pD);
            if (sMin === pU) {
                obj._blockedUp = true;
                obj.y = sT - obj.height;
                if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
            } else if (sMin === pD) {
                obj._blockedDown = true;
                obj.y = sB;
                if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
            } else if (sMin === pL) {
                obj._blockedRight = true;
                obj.x = sL - obj.width;
                if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
            } else if (sMin === pR) {
                obj._blockedLeft = true;
                obj.x = sR;
                if (obj._cpBody) cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
            }
        }
        // Ground proximity check: if no overlap was detected but the object's
        // bottom is within 4px of a solid tile below, snap it to the tile
        // top and mark as grounded. Chipmunk's collision slop leaves a small
        // gap (0.5-2px) between resting objects and tiles — this snaps them
        // flush so they visually touch the ground and isOnGround works.
        // IMPORTANT: Only zero downward velocity if the object is NOT jumping.
        // If JS set speedy < 0 (jump), the body has upward velocity — don't
        // kill it! syncFromBody reads body velocity back into obj.speedy, so
        // zeroing v.y here would destroy the jump.
        if (!obj.isStatic) {
            var proxBottom = obj.y + obj.height + 4;  // 4px tolerance
            var proxRow = Math.floor(proxBottom / ts);
            var proxLeft = Math.floor(obj.x / ts);
            var proxRight = Math.floor((obj.x + obj.width - 0.01) / ts);
            for (var pc = proxLeft; pc <= proxRight; pc++) {
                if (isSolid(pc, proxRow)) {
                    var tileTopY = proxRow * ts;
                    // Only snap if object is falling or resting (vy >= 0).
                    // If jumping (vy < 0), don't snap — let it fly up.
                    var curVelY = obj._cpBody ? cpBodyGetVelocity(obj._cpBody).y : 0;
                    if (curVelY >= -1) {
                        obj.y = tileTopY - obj.height;
                        obj._blockedUp = true;
                        if (obj._cpBody) {
                            cpBodySetPosition(obj._cpBody, cpv(obj.x + obj.width * 0.5, obj.y + obj.height * 0.5));
                            if (curVelY > 0) cpBodySetVelocity(obj._cpBody, cpv(cpBodyGetVelocity(obj._cpBody).x, 0));
                        }
                    }
                    break;
                }
            }
        }
        obj.isOnGround = obj._blockedUp ? 1 : 0;
    },
    step: function(dt) {
        if (!this.space) return;
        // gravitation is in px/frame². Chipmunk wants px/s².
        // JS engine: speedy += gravitation * dt * 60 (px/frame), then body.v.y = speedy * 60 (px/s)
        // Effective: gravitation * dt * 60 * 60 = gravitation * 3600 * dt px/s per frame
        // So acceleration = gravitation * 3600 px/s²
        cpSpaceSetGravity(this.space, cpv(0, gravitation * 3600));
        cpSpaceStep(this.space, dt);
    },
    // Joint API — creates and adds a constraint to the physics space.
    // Returns the constraint object (store it to remove later).
    // cpPivotJoint: pins two objects at a world-space pivot point.
    //   joint = Game.physics.createPivotJoint(objA, objB, pivotX, pivotY)
    // cpSlideJoint: flexible chain — objects stay within [min, max] distance.
    //   joint = Game.physics.createSlideJoint(objA, objB, ax, ay, bx, by, min, max)
    // cpGearJoint: rigid fixation — locks relative rotation.
    //   joint = Game.physics.createGearJoint(objA, objB, phase, ratio)
    // PIVOT JOINT — master/slave model.
    //   a = master (leading) — moves freely, joint does NOT affect it
    //   b = slave  (following) — pulled toward master
    createPivotJoint: function(a, b, px, py) {
        if (!this.space) this.init();
        if (!a || !b) {
            console.warn('createPivotJoint: null object', a, b);
            return null;
        }
        var cax = a.x + a.width * 0.5, cay = a.y + a.height * 0.5;
        var cbx = b.x + b.width * 0.5, cby = b.y + b.height * 0.5;
        var dx = cbx - cax, dy = cby - cay;
        // targetDist = center-to-center distance (NOT master-to-pivot).
        // The pivot point (px,py) was used by the old native cpPivotJoint
        // to pin bodies at a specific point. In master/slave model we only
        // need the distance between centers — using master-to-pivot distance
        // would be HALF the correct value, causing the chain to collapse.
        var targetDist = Math.sqrt(dx * dx + dy * dy);
        if (targetDist < 4) targetDist = 4;
        var joint = {
            type: 'distance', master: a, slave: b, targetDist: targetDist
        };
        this.distanceJoints.push(joint);
        return joint;
    },
    // SLIDE JOINT — master/slave model. Slave kept within [min, max] from master.
    createSlideJoint: function(a, b, ax, ay, bx, by, min, max) {
        if (!this.space) this.init();
        if (!a || !b) {
            console.warn('createSlideJoint: null object', a, b);
            return null;
        }
        var cax = a.x + a.width * 0.5, cay = a.y + a.height * 0.5;
        var cbx = b.x + b.width * 0.5, cby = b.y + b.height * 0.5;
        var dx = cbx - cax, dy = cby - cay;
        var curDist = Math.sqrt(dx * dx + dy * dy);
        if (typeof min !== 'number' || min < 0) min = 0;
        if (typeof max !== 'number' || max < min) max = Math.max(curDist, min + 4);
        var joint = {
            type: 'slide', master: a, slave: b, min: min, max: max
        };
        this.distanceJoints.push(joint);
        return joint;
    },
    // GEAR JOINT — slave's angle locked to master's angle.
    createGearJoint: function(a, b, phase, ratio) {
        if (!this.space) this.init();
        if (!a || !b) {
            console.warn('createGearJoint: null object', a, b);
            return null;
        }
        var masterInit = a.angle;
        var slaveInit = b.angle;
        var initialOffset = slaveInit - masterInit * (ratio || 1) - (phase || 0);
        var joint = {
            type: 'gear', master: a, slave: b,
            phase: phase || 0, ratio: ratio || 1, initialOffset: initialOffset
        };
        this.distanceJoints.push(joint);
        return joint;
    },
    removeJoint: function(joint) {
        if (!joint) return;
        if (joint.type === 'distance' || joint.type === 'slide' ||
            joint.type === 'gear') {
            var idx = this.distanceJoints.indexOf(joint);
            if (idx !== -1) this.distanceJoints.splice(idx, 1);
            return;
        }
        if (this.space) cpSpaceRemoveConstraint(this.space, joint);
    },
    // Pre-step: kill velocity that would violate the joint.
    applyDistanceJointsPreStep: function() {
        var joints = this.distanceJoints;
        // Global velocity damping for chain links — kill small vibrations
        // before they accumulate. Applied once per frame (pass 0, first link).
        if (joints.length > 0) {
            var damped = new Set();
            for (var di = 0; di < joints.length; di++) {
                var dj = joints[di];
                if (dj.type !== 'distance') continue;
                var dm = dj.master, ds = dj.slave;
                if (dm && !dm.isStatic && !damped.has(dm)) {
                    var dvm = cpBodyGetVelocity(dm._cpBody);
                    // Damp velocity by 20% (multiply by 0.8).
                    cpBodySetVelocity(dm._cpBody, cpv(dvm.x * 0.8, dvm.y * 0.8));
                    dm.speedx = dvm.x * 0.8 / 60;
                    dm.speedy = dvm.y * 0.8 / 60;
                    damped.add(dm);
                }
                if (ds && !ds.isStatic && !damped.has(ds)) {
                    var dvs = cpBodyGetVelocity(ds._cpBody);
                    cpBodySetVelocity(ds._cpBody, cpv(dvs.x * 0.8, dvs.y * 0.8));
                    ds.speedx = dvs.x * 0.8 / 60;
                    ds.speedy = dvs.y * 0.8 / 60;
                    damped.add(ds);
                }
            }
        }
        for (var pass = 0; pass < 2; pass++) {
            for (var ii = 0; ii < joints.length; ii++) {
                var i = (pass === 0) ? ii : (joints.length - 1 - ii);
                var j = joints[i];
                var m = j.master, s = j.slave;
                if (!m || !s || !m._cpBody || !s._cpBody) continue;
                if (j.type === 'gear') continue;
                var mcx = m.x + m.width * 0.5, mcy = m.y + m.height * 0.5;
                var scx = s.x + s.width * 0.5, scy = s.y + s.height * 0.5;
                var dx = scx - mcx, dy = scy - mcy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.001) continue;
                var nx = dx / dist, ny = dy / dist;
                var error = 0;
                if (j.type === 'distance') {
                    error = dist - j.targetDist;
                } else if (j.type === 'slide') {
                    if (dist > j.max) error = dist - j.max;
                    else if (dist < j.min) error = dist - j.min;
                    else continue;
                } else continue;
                var vm = cpBodyGetVelocity(m._cpBody);
                var vs = cpBodyGetVelocity(s._cpBody);
                var vAlongN = (vs.x - vm.x) * nx + (vs.y - vm.y) * ny;
                var shouldKill = false;
                if (error > 0.1 && vAlongN > 0) shouldKill = true;
                else if (error < -0.1 && vAlongN < 0) shouldKill = true;
                else if (Math.abs(error) <= 0.1 && vAlongN > 0.5) shouldKill = true;
                if (!shouldKill) continue;
                // Kill relative velocity along normal.
                // When both dynamic: distribute impulse by inverse mass.
                // When one static: only adjust the dynamic one.
                var mStatic = m.isStatic, sStatic = s.isStatic;
                if (mStatic && sStatic) continue;
                if (mStatic) {
                    // Only adjust slave
                    cpBodySetVelocity(s._cpBody, cpv(vs.x - nx * vAlongN, vs.y - ny * vAlongN));
                    s.speedx = (vs.x - nx * vAlongN) / 60;
                    s.speedy = (vs.y - ny * vAlongN) / 60;
                    cpBodyActivate(s._cpBody);
                } else if (sStatic) {
                    // Only adjust master (reversed)
                    cpBodySetVelocity(m._cpBody, cpv(vm.x + nx * vAlongN, vm.y + ny * vAlongN));
                    m.speedx = (vm.x + nx * vAlongN) / 60;
                    m.speedy = (vm.y + ny * vAlongN) / 60;
                    cpBodyActivate(m._cpBody);
                } else {
                    // Both dynamic: distribute velocity correction by mass.
                    var mInv = 1 / Math.max(m.mass || 1, 0.001);
                    var sInv = 1 / Math.max(s.mass || 1, 0.001);
                    var totalInv = mInv + sInv;
                    var sFrac = sInv / totalInv;
                    var mFrac = mInv / totalInv;
                    cpBodySetVelocity(s._cpBody, cpv(vs.x - nx * vAlongN * sFrac, vs.y - ny * vAlongN * sFrac));
                    s.speedx = (vs.x - nx * vAlongN * sFrac) / 60;
                    s.speedy = (vs.y - ny * vAlongN * sFrac) / 60;
                    cpBodySetVelocity(m._cpBody, cpv(vm.x + nx * vAlongN * mFrac, vm.y + ny * vAlongN * mFrac));
                    m.speedx = (vm.x + nx * vAlongN * mFrac) / 60;
                    m.speedy = (vm.y + ny * vAlongN * mFrac) / 60;
                    cpBodyActivate(s._cpBody);
                    cpBodyActivate(m._cpBody);
                }
            }
        }
    },
    // Post-step: correct dynamic body position to maintain the joint.
    applyDistanceJoints: function() {
        var joints = this.distanceJoints;
        // 8 iterations × 0.4 correction × 0.3 threshold — tuned for stability.
        // More iterations (8 vs 6) = better convergence.
        // Stronger correction (0.4 vs 0.3) = holds links together.
        // Lower threshold (0.3 vs 0.5) = correction starts sooner.
        var ITERATIONS = 8;
        for (var iter = 0; iter < ITERATIONS; iter++) {
            var forward = (iter % 2 === 0);
            for (var ii = 0; ii < joints.length; ii++) {
                var i = forward ? ii : (joints.length - 1 - ii);
                var j = joints[i];
                var m = j.master, s = j.slave;
                if (!m || !s || !m._cpBody || !s._cpBody) continue;
                if (j.type === 'gear') {
                    if (iter > 0) continue;
                    var dynGear = s.isStatic ? m : s;
                    var statGear = s.isStatic ? s : m;
                    if (dynGear.isStatic) continue;
                    dynGear.angle = statGear.angle * j.ratio + j.phase + j.initialOffset;
                    cpBodySetAngle(dynGear._cpBody, dynGear.angle * Math.PI / 180.0);
                    continue;
                }
                var mcx = m.x + m.width * 0.5, mcy = m.y + m.height * 0.5;
                var scx = s.x + s.width * 0.5, scy = s.y + s.height * 0.5;
                var dx = scx - mcx, dy = scy - mcy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.001) continue;
                var error = 0;
                if (j.type === 'distance') {
                    error = dist - j.targetDist;
                } else if (j.type === 'slide') {
                    if (dist > j.max) error = dist - j.max;
                    else if (dist < j.min) error = dist - j.min;
                    else continue;
                } else continue;
                if (Math.abs(error) < 0.3) continue;  // lower threshold = correction starts sooner
                var nx = dx / dist, ny = dy / dist;
                // 0.4 correction — stronger than 0.3 for better link cohesion.
                var corr = -error * 0.4;
                // Determine which bodies to move:
                // - One static, one dynamic: move only dynamic
                // - Both dynamic: move BOTH, split by inverse mass
                //   This is critical for chains — without it, only the slave
                //   end moves and the chain collapses toward the master.
                var mStatic = m.isStatic;
                var sStatic = s.isStatic;
                if (mStatic && sStatic) continue;
                if (mStatic) {
                    // Only move slave toward master
                    s.x += nx * corr;
                    s.y += ny * corr;
                    cpBodySetPosition(s._cpBody, cpv(s.x + s.width * 0.5, s.y + s.height * 0.5));
                } else if (sStatic) {
                    // Only move master toward slave
                    m.x -= nx * corr;
                    m.y -= ny * corr;
                    cpBodySetPosition(m._cpBody, cpv(m.x + m.width * 0.5, m.y + m.height * 0.5));
                } else {
                    // Both dynamic: split correction by inverse mass.
                    // This distributes tension to BOTH neighbors — like a
                    // real chain where each link is pulled from both sides.
                    var mInv = 1 / Math.max(m.mass || 1, 0.001);
                    var sInv = 1 / Math.max(s.mass || 1, 0.001);
                    var totalInv = mInv + sInv;
                    var mFrac = mInv / totalInv;  // master moves this fraction
                    var sFrac = sInv / totalInv;  // slave moves this fraction
                    // Master moves opposite to normal (toward slave when too far)
                    m.x -= nx * corr * mFrac;
                    m.y -= ny * corr * mFrac;
                    cpBodySetPosition(m._cpBody, cpv(m.x + m.width * 0.5, m.y + m.height * 0.5));
                    // Slave moves along normal (toward master when too far)
                    s.x += nx * corr * sFrac;
                    s.y += ny * corr * sFrac;
                    cpBodySetPosition(s._cpBody, cpv(s.x + s.width * 0.5, s.y + s.height * 0.5));
                }
            }
        }
        // After position correction, align angles of chain links to the
        // direction between master and slave. This makes links visually
        // point along the chain instead of staying at angle 0.
        // Use smoothing (70% old + 30% new) to reduce visible jitter from
        // frame-to-frame position oscillation.
        if (joints.length > 0) {
            for (var oi = 0; oi < joints.length; oi++) {
                var oj = joints[oi];
                if (oj.type !== 'distance') continue;
                var om = oj.master, os = oj.slave;
                if (!om || !os) continue;
                // Direction from master to slave.
                var dx = (os.x + os.width * 0.5) - (om.x + om.width * 0.5);
                var dy = (os.y + os.height * 0.5) - (om.y + om.height * 0.5);
                if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) continue;
                var targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                // Heavy smoothing: 90% old + 10% new — minimizes visible jitter.
                if (!os.isStatic) {
                    os.angle = (os.angle || 0) * 0.9 + targetAngle * 0.1;
                }
                if (!om.isStatic) {
                    om.angle = (om.angle || 0) * 0.9 + targetAngle * 0.1;
                }
            }
        }
    },
    // Update chain link angles from neighbor positions.
    // Body rotation is LOCKED (lock_rotation=1) so the body doesn't rotate
    // (keeps AABB stable for collisionPushOut). We compute the visual angle
    // from the direction to prev/next neighbors and apply it to obj.angle
    // for sprite rendering only. The body itself stays axis-aligned.
    updateChainAngles: function() {
        for (var i = 0; i < Game.allObject.length; i++) {
            var obj = Game.allObject[i];
            if (!obj._chainGroup) continue;
            if (obj.isStatic) continue;
            // Compute direction from prev and next neighbors.
            var dx = 0, dy = 0;
            if (obj._chainPrev) {
                dx += (obj._chainPrev.x + obj._chainPrev.width / 2) - (obj.x + obj.width / 2);
                dy += (obj._chainPrev.y + obj._chainPrev.height / 2) - (obj.y + obj.height / 2);
            }
            if (obj._chainNext) {
                dx += (obj._chainNext.x + obj._chainNext.width / 2) - (obj.x + obj.width / 2);
                dy += (obj._chainNext.y + obj._chainNext.height / 2) - (obj.y + obj.height / 2);
            }
            if (dx !== 0 || dy !== 0) {
                // atan2 gives angle from horizontal. +90° because sprites
                // typically face "up" by default.
                var targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
                // Smooth: 80% old + 20% new to reduce jitter.
                obj.angle = (obj.angle || 0) * 0.8 + targetAngle * 0.2;
            }
        }
    },
    // HARD position clamp for native chain joints (pivot joints).
    // After cpSpaceStep, check each pivot joint's anchor distance. If anchors
    // are not at the same position, FORCEFULLY move both bodies to bring them
    // together. This is a hard constraint (instant correction), unlike the
    // solver's soft bias-based correction which is too slow against gravity.
    clampNativeJoints: function() {
        var constraints = this.nativeConstraints;
        // Debug logging — enable with window._chainDebug = true
        var debug = (typeof window !== 'undefined' && window._chainDebug);
        if (debug && !this._dbgFrame) this._dbgFrame = 0;
        if (debug) this._dbgFrame++;
        var maxErrorLog = 0;
        for (var pass = 0; pass < 8; pass++) {
            for (var ci = 0; ci < constraints.length; ci++) {
                var c = constraints[ci];
                var a = c.a, b = c.b;
                if (!a || !b) continue;
                // Get anchor positions in world space.
                var r1 = cpvrotate(c.anchorA, cpBodyGetRotation(a));
                var r2 = cpvrotate(c.anchorB, cpBodyGetRotation(b));
                var ap = cpvadd(a.p, r1);
                var bp = cpvadd(b.p, r2);
                var dx = bp.x - ap.x, dy = bp.y - ap.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (debug && pass === 0 && dist > maxErrorLog) maxErrorLog = dist;
                // Dead zone: only correct if error > 0.2px.
                if (dist < 0.2 || dist < 0.001) continue;
                // Anchors are apart — push them together.
                var error = dist;
                var nx = dx / dist, ny = dy / dist;
                // Use 80% correction for fast convergence.
                var corr = error * 0.8;
                // Distribute by inverse mass (static bodies don't move).
                var aInv = (a.m_inv === 0 || a.m === Infinity) ? 0 : a.m_inv;
                var bInv = (b.m_inv === 0 || b.m === Infinity) ? 0 : b.m_inv;
                var totalInv = aInv + bInv;
                if (totalInv === 0) continue;
                var aFrac = aInv / totalInv;
                var bFrac = bInv / totalInv;
                // Move A toward B, B toward A.
                var ax = ap.x + nx * corr * aFrac;
                var ay = ap.y + ny * corr * aFrac;
                var bx = bp.x - nx * corr * bFrac;
                var by = bp.y - ny * corr * bFrac;
                // CRITICAL: Use cpBodySetPosition (not a.p =) to update the
                // body transform. Direct a.p assignment leaves the transform
                // stale, causing cpBodyGetRotation/cpBodyLocalToWorld to return
                // wrong values next frame → slow drift.
                cpBodySetPosition(a, cpv(ax - r1.x, ay - r1.y));
                cpBodySetPosition(b, cpv(bx - r2.x, by - r2.y));
                // Zero out separating velocity COMPLETELY to prevent drift.
                // No threshold — even tiny separating velocity accumulates over
                // hundreds of frames and causes slow drift.
                var av = cpBodyGetVelocity(a);
                var bv = cpBodyGetVelocity(b);
                var vrn = (bv.x - av.x) * nx + (bv.y - av.y) * ny;
                if (vrn > 0.001 || vrn < -0.001) {
                    var aDv = vrn * aFrac;
                    var bDv = vrn * bFrac;
                    cpBodySetVelocity(a, cpv(av.x + nx * aDv, av.y + ny * aDv));
                    cpBodySetVelocity(b, cpv(bv.x - nx * bDv, bv.y - ny * bDv));
                }
            }
        }
        // Log max error every 30 frames
        if (debug && this._dbgFrame % 30 === 0) {
            console.log('[clamp f' + this._dbgFrame + '] maxError=' + maxErrorLog.toFixed(3) + ' constraints=' + constraints.length);
        }
    },
    // JS Chipmunk's native collision response uses bias-based correction which
    // is soft — objects sink into each other under gravity. This pass applies
    // direct position correction (40% Baumgarte) like the native C engine.
    collisionPushOut: function() {
        if (!this.space) return;
        var objs = Game.allObject;
        // Helper: get circle radius if object has circle collision shape.
        function getRadius(o) {
            if (typeof o.collisionShape === 'object' && o.collisionShape !== null && o.collisionShape.radius > 0) {
                return o.collisionShape.radius;
            }
            return 0;
        }
        for (var pass = 0; pass < 2; pass++) {
            for (var i = 0; i < objs.length; i++) {
                var a = objs[i];
                if (!a || !a._cpBody || a.isStatic || a.solid === 0) continue;
                var aR = getRadius(a);
                for (var j = i + 1; j < objs.length; j++) {
                    var b = objs[j];
                    if (!b || !b._cpBody || b.solid === 0) continue;
                    // Skip collision push-out between objects in the same chain
                    // group. Chain links should interlock (connected by joints),
                    // not push each other apart. Without this, the collision
                    // push-out fights the joint constraint → vibration and
                    // eventual chain tear-apart.
                    if (a._chainGroup && a._chainGroup === b._chainGroup) continue;
                    var bR = getRadius(b);
                    // Circle-vs-Circle: use exact distance-based collision.
                    // AABB over-corrects for circles (bounding box is larger
                    // than the actual circle), causing oscillation.
                    if (aR > 0 && bR > 0) {
                        var acx = a.x + a.width * 0.5, acy = a.y + a.height * 0.5;
                        var bcx = b.x + b.width * 0.5, bcy = b.y + b.height * 0.5;
                        var ddx = bcx - acx, ddy = bcy - acy;
                        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
                        var minDist = aR + bR;
                        if (dist >= minDist || dist < 0.001) continue;
                        var overlap = minDist - dist;
                        var nx = ddx / dist, ny = ddy / dist;
                        var corr = overlap * 0.6;
                        var aStatic = a.isStatic, bStatic = b.isStatic;
                        if (aStatic && bStatic) continue;
                        var aInv = aStatic ? 0 : 1 / Math.max(a.mass || 1, 0.001);
                        var bInv = bStatic ? 0 : 1 / Math.max(b.mass || 1, 0.001);
                        var totalInv = aInv + bInv;
                        if (totalInv === 0) continue;
                        var aFrac = aInv / totalInv, bFrac = bInv / totalInv;
                        // Push A away from B (opposite to normal), B along normal.
                        if (!aStatic) {
                            a.x -= nx * corr * aFrac; a.y -= ny * corr * aFrac;
                            cpBodySetPosition(a._cpBody, cpv(a.x + a.width * 0.5, a.y + a.height * 0.5));
                        }
                        if (!bStatic) {
                            b.x += nx * corr * bFrac; b.y += ny * corr * bFrac;
                            cpBodySetPosition(b._cpBody, cpv(b.x + b.width * 0.5, b.y + b.height * 0.5));
                        }
                        // Set isOnGround if B is pushed down onto A (or vice versa).
                        if (ny < -0.5 && !aStatic) a.isOnGround = 1;
                        if (ny > 0.5 && !bStatic) b.isOnGround = 1;
                        continue;
                    }
                    // Circle-vs-Box: distance from circle center to box edge.
                    if (aR > 0 && bR === 0) {
                        var ccx = a.x + a.width * 0.5, ccy = a.y + a.height * 0.5;
                        var closestX = Math.max(b.x, Math.min(ccx, b.x + b.width));
                        var closestY = Math.max(b.y, Math.min(ccy, b.y + b.height));
                        var ddx2 = ccx - closestX, ddy2 = ccy - closestY;
                        var dist2 = Math.sqrt(ddx2 * ddx2 + ddy2 * ddy2);
                        if (dist2 >= aR || dist2 < 0.001) continue;
                        var overlap2 = aR - dist2;
                        var nx2 = ddx2 / dist2, ny2 = ddy2 / dist2;
                        var corr2 = overlap2 * 0.6;
                        var aS2 = a.isStatic, bS2 = b.isStatic;
                        if (aS2 && bS2) continue;
                        var aI2 = aS2 ? 0 : 1 / Math.max(a.mass || 1, 0.001);
                        var bI2 = bS2 ? 0 : 1 / Math.max(b.mass || 1, 0.001);
                        var tI2 = aI2 + bI2;
                        if (tI2 === 0) continue;
                        if (!aS2) {
                            a.x += nx2 * corr2 * (aI2 / tI2); a.y += ny2 * corr2 * (aI2 / tI2);
                            cpBodySetPosition(a._cpBody, cpv(a.x + a.width * 0.5, a.y + a.height * 0.5));
                            if (ny2 > 0.5) a.isOnGround = 1;
                        }
                        if (!bS2) {
                            b.x -= nx2 * corr2 * (bI2 / tI2); b.y -= ny2 * corr2 * (bI2 / tI2);
                            cpBodySetPosition(b._cpBody, cpv(b.x + b.width * 0.5, b.y + b.height * 0.5));
                        }
                        continue;
                    }
                    if (bR > 0 && aR === 0) {
                        // Swap: treat b as circle, a as box.
                        var ccx3 = b.x + b.width * 0.5, ccy3 = b.y + b.height * 0.5;
                        var closestX3 = Math.max(a.x, Math.min(ccx3, a.x + a.width));
                        var closestY3 = Math.max(a.y, Math.min(ccy3, a.y + a.height));
                        var ddx3 = ccx3 - closestX3, ddy3 = ccy3 - closestY3;
                        var dist3 = Math.sqrt(ddx3 * ddx3 + ddy3 * ddy3);
                        if (dist3 >= bR || dist3 < 0.001) continue;
                        var overlap3 = bR - dist3;
                        var nx3 = ddx3 / dist3, ny3 = ddy3 / dist3;
                        var corr3 = overlap3 * 0.6;
                        var aS3 = a.isStatic, bS3 = b.isStatic;
                        if (aS3 && bS3) continue;
                        var aI3 = aS3 ? 0 : 1 / Math.max(a.mass || 1, 0.001);
                        var bI3 = bS3 ? 0 : 1 / Math.max(b.mass || 1, 0.001);
                        var tI3 = aI3 + bI3;
                        if (tI3 === 0) continue;
                        if (!aS3) {
                            a.x -= nx3 * corr3 * (aI3 / tI3); a.y -= ny3 * corr3 * (aI3 / tI3);
                            cpBodySetPosition(a._cpBody, cpv(a.x + a.width * 0.5, a.y + a.height * 0.5));
                        }
                        if (!bS3) {
                            b.x += nx3 * corr3 * (bI3 / tI3); b.y += ny3 * corr3 * (bI3 / tI3);
                            cpBodySetPosition(b._cpBody, cpv(b.x + b.width * 0.5, b.y + b.height * 0.5));
                            if (ny3 > 0.5) b.isOnGround = 1;
                        }
                        continue;
                    }
                    // Box-vs-Box: AABB overlap (original behavior).
                    // AABB overlap test.
                    if (a.x + a.width <= b.x || a.x >= b.x + b.width ||
                        a.y + a.height <= b.y || a.y >= b.y + b.height) continue;
                    // Compute overlap on each axis.
                    var overlapL = (a.x + a.width) - b.x;
                    var overlapR = (b.x + b.width) - a.x;
                    var overlapT = (a.y + a.height) - b.y;
                    var overlapB = (b.y + b.height) - a.y;
                    var minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
                    // 60% Baumgarte correction (stronger than 40% to prevent sinking).
                    var corr = minOverlap * 0.6;
                    var aStatic = a.isStatic;
                    var bStatic = b.isStatic;
                    if (aStatic && bStatic) continue;
                    // Distribute correction by inverse mass.
                    // Heavy objects (mass 1.0) move less, light objects (mass 0.1) move more.
                    var aInv = aStatic ? 0 : 1 / Math.max(a.mass || 1, 0.001);
                    var bInv = bStatic ? 0 : 1 / Math.max(b.mass || 1, 0.001);
                    var totalInv = aInv + bInv;
                    if (totalInv === 0) continue;
                    var aFrac = aInv / totalInv;
                    var bFrac = bInv / totalInv;
                    if (minOverlap === overlapL) {
                        // Push A left, B right.
                        if (!aStatic) { a.x -= corr * aFrac; cpBodySetPosition(a._cpBody, cpv(a.x + a.width/2, a.y + a.height/2)); }
                        if (!bStatic) { b.x += corr * bFrac; cpBodySetPosition(b._cpBody, cpv(b.x + b.width/2, b.y + b.height/2)); }
                    } else if (minOverlap === overlapR) {
                        if (!aStatic) { a.x += corr * aFrac; cpBodySetPosition(a._cpBody, cpv(a.x + a.width/2, a.y + a.height/2)); }
                        if (!bStatic) { b.x -= corr * bFrac; cpBodySetPosition(b._cpBody, cpv(b.x + b.width/2, b.y + b.height/2)); }
                    } else if (minOverlap === overlapT) {
                        // A is above B (A's bottom overlaps B's top).
                        if (!aStatic) {
                            a.y -= corr * aFrac; cpBodySetPosition(a._cpBody, cpv(a.x + a.width/2, a.y + a.height/2));
                            a.isOnGround = 1;
                        }
                        if (!bStatic) { b.y += corr * bFrac; cpBodySetPosition(b._cpBody, cpv(b.x + b.width/2, b.y + b.height/2)); }
                    } else {
                        // B is above A (B's bottom overlaps A's top).
                        if (!aStatic) { a.y += corr * aFrac; cpBodySetPosition(a._cpBody, cpv(a.x + a.width/2, a.y + a.height/2)); }
                        if (!bStatic) {
                            b.y -= corr * bFrac; cpBodySetPosition(b._cpBody, cpv(b.x + b.width/2, b.y + b.height/2));
                            b.isOnGround = 1;
                        }
                    }
                }
            }
        }
    },
    // CHAIN — creates a chain of objects from a prototype.
    //   proto = object template
    //   sx, sy = start position (or attachObj position if attached)
    //   count = number of objects
    //   ex, ey = end position (optional — if provided, chain is anchored at both ends)
    //   attachObj = optional object to attach the chain to (instead of static anchor)
    //     If attachObj is a prototype (not in allObject), chains are created
    //     from every instance of that prototype on the level.
    createChain: function(proto, sx, sy, count, ex, ey, attachObj) {
        if (!proto) { console.warn('createChain: no prototype'); return []; }
        count = Math.max(1, Math.min(Math.floor(count) || 1, 50));
        // Only vertical chains anchored at the top (first link is static).
        // Horizontal/fixed chains are not supported — they caused too many
        // physics issues (OBB collision, angle sync, stretching).
        // ex/ey parameters are ignored — chain always hangs vertically.

        // If attachObj is a prototype (plain object, not a game object instance),
        // find all instances in allObject with the same name and create a chain
        // from each one.
        if (attachObj && attachObj.name && !attachObj._cpBody && !attachObj.id) {
            var allChains = [];
            for (var ai = 0; ai < Game.allObject.length; ai++) {
                var gameObj = Game.allObject[ai];
                if (gameObj && gameObj.name === attachObj.name && !gameObj.isStatic) {
                    var chain = this._createChainOne(proto,
                        gameObj.x + gameObj.width / 2,
                        gameObj.y + gameObj.height / 2,
                        count, null, null, gameObj);
                    allChains = allChains.concat(chain);
                }
            }
            return allChains;
        }

        return this._createChainOne(proto, sx, sy, count, null, null, attachObj);
    },
    // Internal: create a single vertical chain, anchored at the top.
    _createChainOne: function(proto, sx, sy, count, ex, ey, attachObj) {
        var objs = [];
        var size = Math.min(proto.width || 32, proto.height || 32);
        var chainGroup = (++this._chainGroupCounter);
        for (var i = 0; i < count; i++) {
            // Vertical chain: links stacked downward from anchor point.
            var x = sx;
            var y = sy + i * (proto.height || 32);
            var obj = Game.addObject(proto.name, x, y,
                proto.width || 32, proto.height || 32, proto.sprite || 0);
            for (var key in proto) {
                if (proto.hasOwnProperty(key)) {
                    if (key.charAt(0) === '_' || key === 'cp_body' || key === 'cp_shape' ||
                        key === 'id' || key === 'use' || key === 'is_delite' || key === 'is_new') continue;
                    obj[key] = Game.helper.deepCopy(proto[key]);
                }
            }
            obj.x = x;
            obj.y = y;
            // Use collision shape from prototype. If not defined, default to circle.
            if (!obj.collisionShape || obj.collisionShape === 0) {
                obj.collisionShape = { radius: size / 2 };
            }
            obj._chainGroup = chainGroup;
            // Allow free rotation — pivot joints need this so links can swing.
            obj.lock_rotation = 0;
            // Only the FIRST link is a static anchor (top of chain).
            // If attached to an object, no static anchor — the object is the anchor.
            if (!attachObj && i === 0) {
                obj.isStatic = 1;
            }
            if (obj.onCreate) obj.onCreate();
            // Recompute moment — createBody saw lock_rotation=1 (default).
            if (obj._cpBody && !obj.isStatic) {
                var cm = Math.max(obj.mass, 0.0001);
                var cmom = cpMomentForCircle(cm, 0, size / 2, cpvzero);
                cpBodySetMoment(obj._cpBody, cmom);
            }
            // Convert static anchor body to STATIC type.
            if (obj._cpBody && obj.isStatic) {
                if (cpBodyGetType(obj._cpBody) !== CP_BODY_TYPE_STATIC) {
                    cpBodySetType(obj._cpBody, CP_BODY_TYPE_STATIC);
                }
            }
            // Collision filter — links in the same chain don't collide.
            if (obj._cpShape) {
                cpShapeSetFilter(obj._cpShape, cpShapeFilterNew(chainGroup, CP_ALL_CATEGORIES, CP_ALL_CATEGORIES));
            }
            objs.push(obj);
        }
        // Store neighbor references.
        for (var i = 0; i < objs.length; i++) {
            objs[i]._chainPrev = (i > 0) ? objs[i - 1] : null;
            objs[i]._chainNext = (i < objs.length - 1) ? objs[i + 1] : null;
        }
        // Create NATIVE PIVOT joints between consecutive links.
        // Anchor = midpoint between centers (where edges meet).
        for (var i = 0; i < objs.length - 1; i++) {
            var a = objs[i];
            var b = objs[i + 1];
            if (!a._cpBody || !b._cpBody) continue;
            var acx = a.x + a.width * 0.5, acy = a.y + a.height * 0.5;
            var bcx = b.x + b.width * 0.5, bcy = b.y + b.height * 0.5;
            var px = (acx + bcx) * 0.5;
            var py = (acy + bcy) * 0.5;
            var anchorA = cpBodyWorldToLocal(a._cpBody, cpv(px, py));
            var anchorB = cpBodyWorldToLocal(b._cpBody, cpv(px, py));
            var nativeJoint = cpPivotJointNew2(a._cpBody, b._cpBody, anchorA, anchorB);
            nativeJoint.maxForce = Infinity;
            nativeJoint.errorBias = 0.3;
            nativeJoint.maxBias = Infinity;
            cpSpaceAddConstraint(this.space, nativeJoint);
            this.nativeConstraints.push(nativeJoint);
        }
        // If attached to an object, joint the first link to that object.
        if (attachObj && attachObj._cpBody) {
            this.createPivotJoint(attachObj, objs[0],
                objs[0].x + objs[0].width / 2,
                objs[0].y + objs[0].height / 2);
        }
        return objs;
    }
};


function drawGamepadButtonsPreview() {
    if (!Game.helper.showGamepadButtons) return;

    const buttonSize = 3;
    const stickRadius = 6;
    const thumbRadius = 2;
    const colors = {
        pressed: "#00fff0",
        unpressed: "#333333",
        background: "#ffffff66",
        stickBase: "#444444",
        stickThumb: "#ffffff"
    };

    // === НАСТРОЙКИ СМЕЩЕНИЯ СТИКОВ ===
    const stickOffsetX = -14;
    const stickOffsetY = 20; //

    // === ЛЕВЫЙ ГЕЙМПАД (устройство 0) ===
    g_ctx.fillStyle = colors.background;
    g_ctx.fillRect(1, 1, 50, 40);

    // --- D-Pad ---
    const dpadUpY = 8;
    const dpadDownY = 18;
    const dpadLeftX = 7;
    const dpadRightX = 17;
    const dpadCenterY = 13;

    const dpadLeft = [
        { x: 12, y: 8,  key: "ArrowUp" },
        { x: 12, y: 18, key: "ArrowDown" },
        { x: 7,  y: 13, key: "ArrowLeft" },
        { x: 17, y: 13, key: "ArrowRight" }
    ];

    dpadLeft.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 0);
        g_ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        g_ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- ABXY Кнопки ---
    const centerX = 38;
    const leftButtons = [
        { x: dpadRightX + 26, y: dpadCenterY, key: "KeyA", color: "#2dcd2d" },
        { x: dpadLeftX + 26,  y: dpadCenterY, key: "KeyY", color: "#f5f518" },
        { x: centerX, y: dpadUpY,       key: "KeyX", color: "#3a3aff" },
        { x: centerX, y: dpadDownY,    key: "KeyB", color: "#e61919" }
    ];

    leftButtons.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 0);
        g_ctx.fillStyle = isPressed ? colors.pressed : btn.color;
        g_ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Левые триггеры ---
    const leftTriggers = [
        { x: 20, y: 2, key: "KeyL", device: 0 },
        { x: 20, y: 0, key: "KeyZL", device: 0 },
        { x: 32, y: 2, key: "KeyR", device: 0 },
        { x: 32, y: 0, key: "KeyZR", device: 0 }
    ];

    leftTriggers.forEach(trigger => {
        const isPressed = Game.getKey(trigger.key, trigger.device);
        g_ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        g_ctx.fillRect(trigger.x, trigger.y, buttonSize * 2, buttonSize);
    });

    // === СТИКИ ЛЕВОГО ГЕЙМПАДА (устройство 0) ===
    const leftStickX = Game.getAxes(0, 0);
    const leftStickY = Game.getAxes(1, 0);
    const rightStickX = Game.getAxes(2, 0);
    const rightStickY = Game.getAxes(3, 0);

    // Базовые координаты стиков — смещены относительно левого угла
    const leftStickBaseX = 25 + stickOffsetX;
    const leftStickBaseY = 13 + stickOffsetY;
    const rightStickBaseX = 45 + stickOffsetX;
    const rightStickBaseY = 13 + stickOffsetY;

    // Левый стик (L-Stick)
    g_ctx.strokeStyle = colors.stickBase;
    g_ctx.fillStyle = colors.stickBase;
    g_ctx.beginPath();
    g_ctx.arc(leftStickBaseX, leftStickBaseY, stickRadius, 0, Math.PI * 2);
    g_ctx.stroke();
    g_ctx.globalAlpha = 0.5;
    g_ctx.fill();
    g_ctx.globalAlpha = 1.0;

    const leftThumbX = leftStickBaseX + leftStickX * (stickRadius - thumbRadius);
    const leftThumbY = leftStickBaseY + leftStickY * (stickRadius - thumbRadius);

    g_ctx.fillStyle = colors.stickThumb;
    g_ctx.beginPath();
    g_ctx.arc(leftThumbX, leftThumbY, thumbRadius, 0, Math.PI * 2);
    g_ctx.fill();

    // Правый стик (R-Stick)
    g_ctx.strokeStyle = colors.stickBase;
    g_ctx.fillStyle = colors.stickBase;
    g_ctx.beginPath();
    g_ctx.arc(rightStickBaseX, rightStickBaseY, stickRadius, 0, Math.PI * 2);
    g_ctx.stroke();
    g_ctx.globalAlpha = 0.5;
    g_ctx.fill();
    g_ctx.globalAlpha = 1.0;

    const rightThumbX = rightStickBaseX + rightStickX * (stickRadius - thumbRadius);
    const rightThumbY = rightStickBaseY + rightStickY * (stickRadius - thumbRadius);

    g_ctx.fillStyle = colors.stickThumb;
    g_ctx.beginPath();
    g_ctx.arc(rightThumbX, rightThumbY, thumbRadius, 0, Math.PI * 2);
    g_ctx.fill();


    // === ПРАВЫЙ ГЕЙМПАД (устройство 1) ===
    const offsetX = 28;

    g_ctx.fillStyle = colors.background;
    g_ctx.fillRect(1200 + offsetX, 1, 50, 40);

    // --- Правый D-Pad ---
    const rightDpadUpY = 8;
    const rightDpadDownY = 18;
    const rightDpadLeftX = 1207 + offsetX;
    const rightDpadRightX = 1217 + offsetX;
    const rightDpadCenterY = 13;
    const rightCenterX = 1238 + offsetX;

    const dpadRight = [
        { x: 1212 + offsetX, y: 8,  key: "ArrowUp" },
        { x: 1212 + offsetX, y: 18, key: "ArrowDown" },
        { x: 1207 + offsetX, y: 13, key: "ArrowLeft" },
        { x: 1217 + offsetX, y: 13, key: "ArrowRight" }
    ];

    dpadRight.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 1);
        g_ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        g_ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Правые ABXY ---
    const rightButtons = [
        { x: rightDpadRightX + 26, y: rightDpadCenterY, key: "KeyA", color: "#2dcd2d" },
        { x: rightDpadLeftX + 26,  y: rightDpadCenterY, key: "KeyY", color: "#f5f518" },
        { x: rightCenterX,    y: rightDpadUpY,     key: "KeyX", color: "#3a3aff" },
        { x: rightCenterX,    y: rightDpadDownY,   key: "KeyB", color: "#e61919" }
    ];

    rightButtons.forEach(btn => {
        const isPressed = Game.getKey(btn.key, 1);
        g_ctx.fillStyle = isPressed ? colors.pressed : btn.color;
        g_ctx.fillRect(btn.x, btn.y, buttonSize, buttonSize);
    });

    // --- Правые триггеры ---
    const rightTriggers = [
        { x: 1220 + offsetX, y: 2, key: "KeyL", device: 1 },
        { x: 1220 + offsetX, y: 0, key: "KeyZL", device: 1 },
        { x: 1232 + offsetX, y: 2, key: "KeyR", device: 1 },
        { x: 1232 + offsetX, y: 0, key: "KeyZR", device: 1 }
    ];

    rightTriggers.forEach(trigger => {
        const isPressed = Game.getKey(trigger.key, trigger.device);
        g_ctx.fillStyle = isPressed ? colors.pressed : colors.unpressed;
        g_ctx.fillRect(trigger.x, trigger.y, buttonSize * 2, buttonSize);
    });

    // === СТИКИ ПРАВОГО ГЕЙМПАДА (устройство 1) ===
    const leftStickX1 = Game.getAxes(0, 1);
    const leftStickY1 = Game.getAxes(1, 1);
    const rightStickX1 = Game.getAxes(2, 1);
    const rightStickY1 = Game.getAxes(3, 1);

    // База позиции для правого геймпада
    const rightPadBaseX = 1210 + offsetX;

    const rightLeftStickBaseX = rightPadBaseX + 25 + stickOffsetX;
    const rightLeftStickBaseY = 13 + stickOffsetY;
    const rightRightStickBaseX = rightPadBaseX + 45 + stickOffsetX;
    const rightRightStickBaseY = 13 + stickOffsetY;

    // Левый стик (устройство 1)
    g_ctx.strokeStyle = colors.stickBase;
    g_ctx.fillStyle = colors.stickBase;
    g_ctx.beginPath();
    g_ctx.arc(rightLeftStickBaseX, rightLeftStickBaseY, stickRadius, 0, Math.PI * 2);
    g_ctx.stroke();
    g_ctx.globalAlpha = 0.5;
    g_ctx.fill();
    g_ctx.globalAlpha = 1.0;

    const leftThumbX1 = rightLeftStickBaseX + leftStickX1 * (stickRadius - thumbRadius);
    const leftThumbY1 = rightLeftStickBaseY + leftStickY1 * (stickRadius - thumbRadius);

    g_ctx.fillStyle = colors.stickThumb;
    g_ctx.beginPath();
    g_ctx.arc(leftThumbX1, leftThumbY1, thumbRadius, 0, Math.PI * 2);
    g_ctx.fill();

    // Правый стик (устройство 1)
    g_ctx.strokeStyle = colors.stickBase;
    g_ctx.fillStyle = colors.stickBase;
    g_ctx.beginPath();
    g_ctx.arc(rightRightStickBaseX, rightRightStickBaseY, stickRadius, 0, Math.PI * 2);
    g_ctx.stroke();
    g_ctx.globalAlpha = 0.5;
    g_ctx.fill();
    g_ctx.globalAlpha = 1.0;

    const rightThumbX1 = rightRightStickBaseX + rightStickX1 * (stickRadius - thumbRadius);
    const rightThumbY1 = rightRightStickBaseY + rightStickY1 * (stickRadius - thumbRadius);

    g_ctx.fillStyle = colors.stickThumb;
    g_ctx.beginPath();
    g_ctx.arc(rightThumbX1, rightThumbY1, thumbRadius, 0, Math.PI * 2);
    g_ctx.fill();
};
// Основной объект Game
Game.initEngine = function () {
        // Инициализация массива изображений
        for (let i = 0; i < 1024; i++) {
                image_array[i] = -1; // Используем -1 для отсутствия изображения
        }
        Game.duc_helper_global_game_timers = {
                nextId: 1,
                timers: {},
                pending: [],
                length: 0,
                lengthAvg: 0,
                timerHistory: [],
                lastSampleTime: 0
        };
        Game.helper.tiles = {
                grid: [],
                cols: 0,
                rows: 0,
                tileSize: 32,
                sprite: -1, // -1 для отсутствия тайлсета
                tilesData: {}
        };
        Game.helper.showGamepadButtons = false;
        Game.debug = function(obj){
                const out = document.getElementById("debug");
                if(out)
                        out.innerText = JSON.stringify(obj).replace(/\n/g, '<br>');
        };
        Game.createDefaultKeysState = function (keysSet) {
                const state = {};
                // Используем как оригинальные ключи, так и ремаппированные значения
                for (const key of keysSet) {
                        state[key] = false;
                }
                return state;
        };
        Game.resetInputDevices = function () {
                // Получаем все возможные клавиши из keyRemapping
                const allKeys = new Set(Object.values(Game.helper.keyRemapping));

                inputState.devices = [{ // Устройство 0
                                keys: this.createDefaultKeysState(allKeys),
                                pressKeys: this.createDefaultKeysState(allKeys),
                                pressButton: [],
                                axes: inputState.hasGamepad ? [0, 0, 0, 0] : [0, 0]
                        }, { // Устройство 1
                                keys: this.createDefaultKeysState(allKeys),
                                pressKeys: this.createDefaultKeysState(allKeys),
                                pressButton: [],
                                axes: [0, 0]
                        }
                ];
        };
        this.resetInputDevices();
        Game.helper.deepCopy = function (obj) {
                if (obj === null || typeof obj !== 'object') {
                        return obj;
                }
                // Detect circular references to prevent infinite recursion.
                // This is critical when copying game objects (which have
                // _cpBody, _cpShape, local, etc. with back-references).
                if (!this._deepCopySeen) this._deepCopySeen = [];
                for (var i = 0; i < this._deepCopySeen.length; i++) {
                        if (this._deepCopySeen[i] === obj) return null; // circular
                }
                this._deepCopySeen.push(obj);
                // Создаем копию в зависимости от типа (массив или объект)
                var copy = Array.isArray(obj) ? [] : {};
                // Копируем каждое свойство
                for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                                copy[key] = Game.helper.deepCopy(obj[key]);
                        }
                }
                this._deepCopySeen.pop();
                return copy;
        };

        // Safe local variable helpers.
        // Usage: obj.getVar('name'), obj.setVar('name', value), obj.hasVar('name')
        Game.helper.getVar = function(obj, name, def) {
            if (!obj.local) obj.local = {};
            if (obj.local[name] === undefined) return def;
            return obj.local[name];
        };
        Game.helper.setVar = function(obj, name, value) {
            if (!obj.local) obj.local = {};
            obj.local[name] = value;
        };
        Game.helper.hasVar = function(obj, name) {
            return obj.local && obj.local[name] !== undefined;
        };

        canvas.addEventListener("keypress", function(e) {
                e.preventDefault();
                e.stopPropagation();
        }, false);

        canvas.setAttribute("tabindex", "0");

        canvas.addEventListener("mousedown", function() {
                canvas.focus();
        });

        canvas.addEventListener("touchstart", function() {
                canvas.focus();
        });
        canvas.addEventListener("keydown", e => {
                const deviceIndex = inputState.hasGamepad ? 1 : 0;
                const device = inputState.devices[deviceIndex];

                for (const originalKey in Game.helper.keyRemapping) {
                        if (Game.helper.keyRemapping[originalKey] === e.code) {
                                if (!device.keys[originalKey]) {
                                        device.pressKeys[originalKey] = true; // Теперь для конкретного устройства
                                }
                                device.keys[originalKey] = true;

                                // Обработка осей левого стика (для клавиатуры)
                                if (originalKey === "KeyLStickLeft") {
                                        inputState.devices[deviceIndex].axes[0] = -1.0;
                                } else if (originalKey === "KeyLStickRight") {
                                        inputState.devices[deviceIndex].axes[0] = 1.0;
                                } else if (originalKey === "KeyLStickUp") {
                                        inputState.devices[deviceIndex].axes[1] = -1.0;
                                } else if (originalKey === "KeyLStickDown") {
                                        inputState.devices[deviceIndex].axes[1] = 1.0;
                                }
                        }
                }
                e.stopPropagation();
        });
        canvas.addEventListener("keyup", e => {
                const deviceIndex = inputState.hasGamepad ? 1 : 0;

                for (const originalKey in Game.helper.keyRemapping) {
                        if (Game.helper.keyRemapping[originalKey] === e.code) {
                                inputState.devices[deviceIndex].keys[originalKey] = false;

                                // Сброс осей левого стика при отпускании клавиш
                                if (originalKey === "KeyLStickLeft" && inputState.devices[deviceIndex].axes[0] < 0) {
                                        inputState.devices[deviceIndex].axes[0] = 0;
                                } else if (originalKey === "KeyLStickRight" && inputState.devices[deviceIndex].axes[0] > 0) {
                                        inputState.devices[deviceIndex].axes[0] = 0;
                                } else if (originalKey === "KeyLStickUp" && inputState.devices[deviceIndex].axes[1] < 0) {
                                        inputState.devices[deviceIndex].axes[1] = 0;
                                } else if (originalKey === "KeyLStickDown" && inputState.devices[deviceIndex].axes[1] > 0) {
                                        inputState.devices[deviceIndex].axes[1] = 0;
                                }
                        }
                }
                e.preventDefault();
                e.stopPropagation();
        });
        Game.helper.getApproximateMemoryUsage = function(obj) {
                const jsonString = JSON.stringify(obj);
                return jsonString.length * 2;
        };
        Game.getJoystickCount = function () {
                return 0;
        };
        Game.Particles = {
                list: [],
                maxParticles: 1e3, // Максимальное количество частиц
                // Создание частиц
                create: function (x, y, count, options = {}) {
                        // Параметры по умолчанию
                        const {
                                color = "#ffffff",
                                size = 2,
                                speed = 1,
                                direction = 0, // в градусах (0 - вправо, 90 - вверх)
                                spread = 30, // разброс направления
                                life = 60, // время жизни в кадрах
                                gravity = .05,
                                fade = true,
                                randomColor = false
                        } = options;
                        // Создаем указанное количество частиц
                        for (let i = 0; i < count && this.list.length < this.maxParticles; i++) {
                                // Вычисляем направление с учетом разброса
                                const angle = (direction + (Math.random() * spread - spread / 2)) * Math.PI / 180;
                                // Вычисляем скорость
                                const particleSpeed = speed * (.8 + Math.random() * .4);
                                // Определяем цвет
                                let particleColor = color;
                                if (randomColor) {
                                        // Генерация случайного цвета
                                        particleColor = `hsl(${Math.random()*360}, 100%, 50%)`
                                }
                                // Добавляем частицу
                                this.list.push({
                                        x: x,
                                        y: y,
                                        vx: Math.cos(angle) * particleSpeed,
                                        vy: Math.sin(angle) * particleSpeed,
                                        size: size * (.5 + Math.random()),
                                        color: particleColor,
                                        life: life * (.5 + Math.random()),
                                        maxLife: life,
                                        gravity: gravity,
                                        fade: fade
                                })
                        }
                },
                // Обновление частиц
                update: function () {
                        for (let i = this.list.length - 1; i >= 0; i--) {
                                const p = this.list[i];
                                // Движение
                                p.x += p.vx;
                                p.y += p.vy;
                                p.vy += p.gravity;
                                // Уменьшение времени жизни
                                p.life--;
                                // Удаление "мертвых" частиц
                                if (p.life <= 0) {
                                        this.list.splice(i, 1)
                                }
                        }
                },
                // Отрисовка частиц
                draw: function () {
                        for (const p of this.list) {
                                // Прозрачность, если включено затухание
                                let alpha = 1;
                                if (p.fade) {
                                        alpha = p.life / p.maxLife
                                }
                                g_ctx.fillStyle = p.color;
                                g_ctx.globalAlpha = alpha;
                                g_ctx.fillRect(p.x - p.size / 2 - Game.screenx, p.y - p.size / 2 - Game.screeny, p.size, p.size)
                        }
                        g_ctx.globalAlpha = 1
                },
                // Очистка всех частиц
                clear: function () {
                        this.list = []
                }
        };
        Game.helper.drawTiles = function () {
                if (!Game.helper.tiles.grid || Game.helper.tiles.sprite === -1)
                        return;
                const tileSize = Game.helper.tiles.tileSize;
                const sprite = Game.helper.tiles.sprite;
                const offsetX = 0; //Game.screenx;
                const offsetY = 0; //Game.screeny;
                // Рассчитываем видимую область тайлов с учетом глобальных координат
                const startCol = Math.max(0, Math.floor((Game.screenx - offsetX) / tileSize));
                const startRow = Math.max(0, Math.floor((Game.screeny - offsetY) / tileSize));
                const endCol = Math.min(Game.helper.tiles.cols, Math.ceil((Game.screenx + 1280 - offsetX) / tileSize));
                const endRow = Math.min(Game.helper.tiles.rows, Math.ceil((Game.screeny + 720 - offsetY) / tileSize));
                for (let row = startRow; row < endRow; row++) {
                        for (let col = startCol; col < endCol; col++) {
                                const tileValue = Game.helper.tiles.grid[row][col];
                                if (tileValue > 0) {
                                        // Рассчитываем экранные координаты с учетом глобального смещения
                                        const x = offsetX + col * tileSize - Game.screenx;
                                        const y = offsetY + row * tileSize - Game.screeny;
                                        // Рисуем тайл
                                        Draw.image(sprite, x, y, tileSize, tileSize, 1, (tileValue - 1) % (image_array[sprite].width / tileSize) * tileSize, Math.floor((tileValue - 1) / (image_array[sprite].width / tileSize)) * tileSize, tileSize, tileSize)
                                }
                        }
                }
        };
        Game.save = function (n, s) {
                localStorage.setItem(n, s)
        };
        Game.load = function (n) {
                return localStorage.getItem(n)
        };
        Game.objectSerialize = function (v, depth) {
                if (depth === undefined)
                        depth = 0;
                if (depth > 10)
                        return null;
                if (v === null)
                        return null;
                if (typeof v === "function")
                        return undefined;
                if (typeof v !== "object")
                        return v;
                if (Array.isArray(v)) {
                        var arr = [];
                        for (var i = 0; i < v.length; i++) {
                                arr[i] = Game.objectSerialize(v[i], depth + 1)
                        }
                        return arr
                }
                var res = {};
                for (var key in v) {
                        if (key !== "id" && key !== "constructor") {
                                try {
                                        var val = v[key];
                                        if (typeof val !== "function") {
                                                val = Game.objectSerialize(val, depth + 1);
                                                if (val !== undefined)
                                                        res[key] = val
                                        }
                                } catch (e) {}
                        }
                }
                return res
        };
        Game.objectDeserialize = function (value, target, seenObjects, seenValues) {
                if (value === undefined)
                        return undefined;
                if (value === null || typeof value !== "object")
                        return value;
                seenObjects = seenObjects || [];
                seenValues = seenValues || [];
                for (var i = 0; i < seenValues.length; i++) {
                        if (seenValues[i] === value)
                                return seenObjects[i]
                }
                if (value.__type === "Date" && typeof value.value === "string") {
                        return new Date(value.value)
                }
                var result = target;
                var needsNewObject = result === undefined || result === null || Array.isArray(value) && !Array.isArray(result) || !Array.isArray(value) && Array.isArray(result);
                if (needsNewObject) {
                        if (Array.isArray(value)) {
                                result = []
                        } else {
                                result = {}
                        }
                }
                seenObjects.push(result);
                seenValues.push(value);
                if (Array.isArray(value)) {
                        for (var i = 0; i < value.length; i++) {
                                result[i] = Game.objectDeserialize(value[i], result[i], seenObjects, seenValues)
                        }
                        return result
                }
                var keys = Object.keys(value);
                for (var j = 0; j < keys.length; j++) {
                        var key = keys[j];
                        if (key === "__type")
                                continue;
                        try {
                                var newVal = Game.objectDeserialize(value[key], result[key], seenObjects, seenValues);
                                result[key] = newVal
                        } catch (e) {
                                console.log("Error " + key + ":", e)
                        }
                }
                return result
        };
        Game.copyState = function (source, target) {
                // Сериализуем исходный объект
                const serialized = dukSerialize(source);
                // Десериализуем в целевой объект
                return deserializeValue(serialized, target)
        };
        Game.alert = function (message, title, showCancel = false, primaryBtnText) {
                // Сохраняем текущее состояние канваса
                Game.helper.pause = true;
                g_ctx.save();
                // Проверка и установка значений по умолчанию
                title = title || "!";
                message = message || "";
                primaryBtnText = primaryBtnText || "OK";
                // Параметры модального окна
                const modalWidth = 700;
                const modalHeight = 400;
                const modalX = (1280 - modalWidth) / 2;
                const modalY = (720 - modalHeight) / 2;
                const padding = 20;
                const btnHeight = 40;
                const btnPadding = 30;
                const btnSpacing = 15;
                const fontSize = 16;
                const titleFontSize = 20;
                const lineHeight = fontSize * 1.5;
                // Цвета
                const bgColor = "rgb(50, 50, 50)";
                const borderColor = "rgb(100, 100, 100)";
                const textColor = "rgb(255, 255, 255)";
                const btnColor = "rgb(70, 130, 200)";
                const btnPressedColor = "rgb(40, 90, 150)";
                const btnCancelColor = "rgb(80, 80, 80)";
                const dimColor = "rgba(0, 0, 0, 0.7)";
                const scrollbarColor = "rgb(120, 120, 120)";
                const scrollbarHandleColor = "rgb(180, 180, 180)";
                // Состояние модального окна
                let scrollOffset = 0;
                let maxScrollOffset = 0;
                let isDragging = false;
                let dragStartY = 0;
                let startScrollOffset = 0;
                let primaryBtnPressed = false;
                let cancelBtnPressed = false;
                let modalClosed = false;
                let modalResult = null;
                const fontStyle = `${fontSize}px PressStart2P, monospace`;
                const titleFontStyle = `${titleFontSize}px PressStart2P, monospace`;
                function measureTextWidth(text, font) {
                        g_ctx.save();
                        g_ctx.font = font;
                        const width = g_ctx.measureText(text).width;
                        g_ctx.restore();
                        return width
                }
                // Кнопки
                const primaryBtnWidth = Math.max(100, measureTextWidth(primaryBtnText, fontStyle) + btnPadding);
                const primaryBtnX = modalX + modalWidth - padding - primaryBtnWidth;
                const primaryBtnRect = {
                        x: primaryBtnX,
                        y: modalY + modalHeight - padding - btnHeight,
                        w: primaryBtnWidth,
                        h: btnHeight
                };
                let cancelBtnRect = null;
                if (showCancel) {
                        const cancelText = "Cancel";
                        const cancelBtnWidth = Math.max(100, measureTextWidth(cancelText, fontStyle) + btnPadding);
                        const cancelBtnX = primaryBtnX - btnSpacing - cancelBtnWidth;
                        cancelBtnRect = {
                                x: cancelBtnX,
                                y: modalY + modalHeight - padding - btnHeight,
                                w: cancelBtnWidth,
                                h: btnHeight
                        }
                }
                // Функция для переноса текста
                function wrapText(text, maxWidth) {
                        const words = text ? text.toString().split(" ") : [];
                        const lines = [];
                        let currentLine = words[0] || "";
                        for (let i = 1; i < words.length; i++) {
                                const word = words[i];
                                const testLine = currentLine + " " + word;
                                const testWidth = measureTextWidth(testLine, fontStyle);
                                if (testWidth <= maxWidth) {
                                        currentLine = testLine
                                } else {
                                        lines.push(currentLine);
                                        currentLine = word
                                }
                        }
                        if (currentLine) {
                                lines.push(currentLine)
                        }
                        return lines
                }
                // Рассчитываем максимальный скролл
                const messageAreaWidth = modalWidth - 2 * padding - 10; // -10 для скроллбара
                const messageLines = wrapText(message, messageAreaWidth);
                const messageAreaHeight = modalHeight - 3 * padding - titleFontSize - btnHeight - 10;
                maxScrollOffset = Math.max(0, messageLines.length * lineHeight - messageAreaHeight);
                // Функция отрисовки модального окна
                function renderModal() {
                        g_ctx.fillStyle = dimColor;
                        g_ctx.fillRect(0, 0, 1280, 720);
                        g_ctx.fillStyle = bgColor;
                        g_ctx.strokeStyle = borderColor;
                        g_ctx.lineWidth = 2;
                        g_ctx.fillRect(modalX, modalY, modalWidth, modalHeight);
                        g_ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);
                        g_ctx.fillStyle = "rgb(40, 40, 40)";
                        g_ctx.fillRect(modalX, modalY, modalWidth, titleFontSize + padding * 2);
                        g_ctx.fillStyle = textColor;
                        g_ctx.font = titleFontStyle;
                        g_ctx.textAlign = "center";
                        g_ctx.textBaseline = "middle";
                        g_ctx.fillText(title, modalX + modalWidth / 2, modalY + padding + titleFontSize / 2);
                        g_ctx.save();
                        g_ctx.beginPath();
                        g_ctx.rect(modalX + padding, modalY + titleFontSize + padding * 2, messageAreaWidth, messageAreaHeight);
                        g_ctx.clip();
                        g_ctx.fillStyle = textColor;
                        g_ctx.font = fontStyle;
                        g_ctx.textAlign = "left";
                        g_ctx.textBaseline = "top";
                        let y = modalY + titleFontSize + padding * 2 - scrollOffset;
                        for (const line of messageLines) {
                                g_ctx.fillText(line, modalX + padding, y);
                                y += lineHeight
                        }
                        g_ctx.restore();
                        if (maxScrollOffset > 0) {
                                const scrollbarX = modalX + modalWidth - padding - 6;
                                const scrollbarY = modalY + titleFontSize + padding * 2;
                                g_ctx.fillStyle = scrollbarColor;
                                g_ctx.fillRect(scrollbarX, scrollbarY, 6, messageAreaHeight);
                                const scrollRatio = scrollOffset / maxScrollOffset;
                                const handleHeight = Math.max(20, messageAreaHeight * (messageAreaHeight / (maxScrollOffset + messageAreaHeight)));
                                const handleY = scrollbarY + scrollRatio * (messageAreaHeight - handleHeight);
                                g_ctx.fillStyle = scrollbarHandleColor;
                                g_ctx.fillRect(scrollbarX + 1, handleY, 4, handleHeight)
                        }
                        function drawButton(rect, text, isPressed, isCancel = false) {
                                g_ctx.fillStyle = isCancel ? isPressed ? "rgb(60, 60, 60)" : btnCancelColor : isPressed ? btnPressedColor : btnColor;
                                g_ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                                g_ctx.fillStyle = textColor;
                                g_ctx.font = fontStyle;
                                g_ctx.textAlign = "center";
                                g_ctx.textBaseline = "middle";
                                g_ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2)
                        }
                        if (showCancel) {
                                drawButton(cancelBtnRect, Blockly.Msg["DIALOG_CANCEL"], cancelBtnPressed, true)
                        }
                        drawButton(primaryBtnRect, primaryBtnText, primaryBtnPressed)
                }
                function getCanvasCoordinates(clientX, clientY) {
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        return {
                                x: (clientX - rect.left) * scaleX,
                                y: (clientY - rect.top) * scaleY
                        }
                }
                function handleMouseDown(clientX, clientY) {
                        const pos = getCanvasCoordinates(clientX, clientY);
                        const x = pos.x;
                        const y = pos.y;
                        if (maxScrollOffset > 0) {
                                const scrollbarX = modalX + modalWidth - padding - 6;
                                const scrollbarY = modalY + titleFontSize + padding * 2;
                                if (x >= scrollbarX && x <= scrollbarX + 6 && y >= scrollbarY && y <= scrollbarY + messageAreaHeight) {
                                        isDragging = true;
                                        dragStartY = y;
                                        startScrollOffset = scrollOffset;
                                        return
                                }
                        }
                        if (showCancel && isPointInRect(x, y, cancelBtnRect)) {
                                cancelBtnPressed = true;
                                return
                        }
                        if (isPointInRect(x, y, primaryBtnRect)) {
                                primaryBtnPressed = true
                        }
                }
                function handleMouseUp(clientX, clientY) {
                        if (isDragging) {
                                isDragging = false;
                                return
                        }
                        const pos = getCanvasCoordinates(clientX, clientY);
                        const x = pos.x;
                        const y = pos.y;
                        if (primaryBtnPressed && isPointInRect(x, y, primaryBtnRect)) {
                                modalClosed = true;
                                modalResult = true
                        }
                        if (cancelBtnPressed && showCancel && isPointInRect(x, y, cancelBtnRect)) {
                                modalClosed = true;
                                modalResult = false
                        }
                        primaryBtnPressed = false;
                        cancelBtnPressed = false
                }
                function handleMouseMove(clientX, clientY) {
                        if (isDragging) {
                                const pos = getCanvasCoordinates(clientX, clientY);
                                const y = pos.y;
                                const dy = y - dragStartY;
                                const scrollableHeight = messageAreaHeight * (1 - messageAreaHeight / (maxScrollOffset + messageAreaHeight));
                                scrollOffset = startScrollOffset + dy / scrollableHeight * maxScrollOffset;
                                scrollOffset = Math.max(0, Math.min(scrollOffset, maxScrollOffset));
                                dragStartY = y
                        }
                }
                function isPointInRect(x, y, rect) {
                        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
                }
                let modalPromise;
                let resolvePromise;
                modalPromise = new Promise(resolve => {
                        resolvePromise = resolve;
                        function modalLoop() {
                                if (Game.getKeyPress("KeyA", 0) || Game.getKeyPress("KeyA", 1)) {
                                        modalClosed = true;
                                        modalResult = true;
                                }
                                if (modalClosed) {
                                        canvas.removeEventListener("mousedown", mouseDownHandler);
                                        canvas.removeEventListener("mouseup", mouseUpHandler);
                                        canvas.removeEventListener("mousemove", mouseMoveHandler);
                                        g_ctx.restore();
                                        resolve(modalResult);
                                        Game.helper.pause = false;
                                        return
                                }
                                renderModal();
                                requestAnimationFrame(modalLoop)
                        }
                        function mouseDownHandler(e) {
                                handleMouseDown(e.clientX, e.clientY)
                        }
                        function mouseUpHandler(e) {
                                handleMouseUp(e.clientX, e.clientY)
                        }
                        function mouseMoveHandler(e) {
                                handleMouseMove(e.clientX, e.clientY)
                        }
                        canvas.addEventListener("mousedown", mouseDownHandler);
                        canvas.addEventListener("mouseup", mouseUpHandler);
                        canvas.addEventListener("mousemove", mouseMoveHandler);
                        modalLoop()
                });
                Game.alert.close = function (result = false) {
                        if (!modalClosed) {
                                modalClosed = true;
                                modalResult = result;
                                if (resolvePromise) {
                                        resolvePromise(result)
                                }
                        }
                };
                return modalPromise
        };
        
        const originalAlert = Game.alert;
        Game.alert = function(message, title, showCancel = false, primaryBtnText) {
                Game.alert.isOpen = true;
                const promise = originalAlert.call(this, message, title, showCancel, primaryBtnText);
                
                promise.finally(() => {
                        Game.alert.isOpen = false;
                        // Вызываем обработчик закрытия, если он установлен
                        if (Game.alert.onClose) {
                                Game.alert.onClose();
                        }
                });
                
                return promise;
        };
        // Добавляем флаг isOpen в Game.alert
        Game.alert.isOpen = false;

        // Модифицируем метод close
        Game.alert.close = function(result = false) {
                if (this.isOpen) {
                        this.isOpen = false;
                        // Вызываем обработчик закрытия, если он установлен
                        if (this.onClose) {
                                this.onClose();
                        }
                }
                // Вызываем оригинальный close
                if (originalAlert.close) {
                        originalAlert.close(result);
                }
        };
        // Функция для получения позиции касания/клика
        function getPosition(event) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = 1280 / rect.width; // Масштаб по X (логический/физический)
                const scaleY = 720 / rect.height; // Масштаб по Y (логический/физический)
                let clientX,
                clientY;
                // Для событий мыши
                if (event.clientX !== undefined) {
                        clientX = event.clientX - rect.left;
                        clientY = event.clientY - rect.top
                }
                // Для событий касания
                else if (event.touches && event.touches[0]) {
                        clientX = event.touches[0].clientX - rect.left;
                        clientY = event.touches[0].clientY - rect.top
                } else {
                        return null
                }
                // Масштабируем координаты к логическому размеру 1280x720
                return {
                        x: clientX * scaleX,
                        y: clientY * scaleY
                }
        }
        // Обработчики касаний/кликов
        function handleInteraction(event) {
                event.preventDefault();
                const pos = getPosition(event);
                if (pos) {
                        // Проверка нажатия на сенсорные кнопки перед обработкой обычного касания
                        if (!Game.helper.isTouchOnGamepad(pos.x, pos.y)) {
                                Game.getTouch.istouch = 1;
                                Game.getTouch.x = pos.x;
                                Game.getTouch.y = pos.y
                        }
                }
        }
        function handleMove(event) {
                event.preventDefault();
                const pos = getPosition(event);
                if (pos && Game.getTouch.istouch) {
                        Game.getTouch.x = pos.x;
                        Game.getTouch.y = pos.y
                }
        }
        function handleEnd(event) {
                event.preventDefault();
                // Проверяем, было ли это отпускание кнопки
                const pos = getPosition(event);
                if (pos) {
                        checkTouchButtons(pos.x, pos.y, false)
                }
                Game.getTouch.istouch = 0
        }
        // Добавление обработчиков событий
        canvas.addEventListener("mousedown", handleInteraction);
        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("mouseup", handleEnd);
        canvas.addEventListener("mouseleave", handleEnd);
        canvas.addEventListener("touchstart", handleInteraction);
        canvas.addEventListener("touchmove", handleInteraction);
        canvas.addEventListener("touchend", handleEnd);
        canvas.addEventListener("touchcancel", handleEnd);
        // Обработчики геймпада
        window.addEventListener("gamepadconnected", event => {
                console.log("✅ 🎮 Геймпад подключен (устройство 0):", event.gamepad);
                inputState.hasGamepad = true;
                this.resetInputDevices();
        });
        window.addEventListener("gamepaddisconnected", event => {
                console.log("❌ 🎮 Геймпад отключен:", event.gamepad);
                inputState.hasGamepad = false;
                this.resetInputDevices();
        });

        // Класс Vector2 для работы с 2D векторами
        class Vector2 {
                constructor(x, y) {
                        this.x = x;
                        this.y = y
                }
                static rotate(v, angle, result = new Vector2(0, 0)) {
                        const cos_a = Math.cos(angle);
                        const sin_a = Math.sin(angle);
                        const x = v.x * cos_a - v.y * sin_a;
                        const y = v.x * sin_a + v.y * cos_a;
                        result.x = x;
                        result.y = y;
                        return result
                }
                normalize() {
                        const len_sq = this.x * this.x + this.y * this.y;
                        if (len_sq > 0) {
                                const inv_len = 1 / Math.sqrt(len_sq);
                                this.x *= inv_len;
                                this.y *= inv_len
                        }
                        return this
                }
                static dot(v1, v2) {
                        return v1.x * v2.x + v1.y * v2.y
                }
                add(other) {
                        return new Vector2(this.x + other.x, this.y + other.y)
                }
                static add(v1, v2) {
                        return new Vector2(v1.x + v2.x, v1.y + v2.y)
                }
                sub(other) {
                        return new Vector2(this.x - other.x, this.y - other.y)
                }
                multiply(scalar) {
                        return new Vector2(this.x * scalar, this.y * scalar)
                }
        }
        function getPolygonAxes(points) {
                const axes = [];
                for (let i = 0; i < points.length; i++) {
                        const p1 = points[i];
                        const p2 = points[(i + 1) % points.length];
                        const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
                        const normal = new Vector2(-edge.y, edge.x).normalize();
                        axes.push(normal);
                }
                return axes;
        }

        function projectPolygon(axis, points) {
                let min = Vector2.dot(axis, points[0]);
                let max = min;
                for (let i = 1; i < points.length; i++) {
                        const projection = Vector2.dot(axis, points[i]);
                        if (projection < min)
                                min = projection;
                        if (projection > max)
                                max = projection;
                }
                return {
                        min,
                        max
                };
        }
        const TILE_NORMALS = [
                new Vector2(0, -1), // Верх
                new Vector2(1, 0), // Право
                new Vector2(0, 1), // Низ
                new Vector2(-1, 0) // Лево
        ];
        function getPolygonBounds(points) {
                let minX = Infinity,
                maxX = -Infinity,
                minY = Infinity,
                maxY = -Infinity;

                for (const v of points) {
                        minX = Math.min(minX, v.x);
                        maxX = Math.max(maxX, v.x);
                        minY = Math.min(minY, v.y);
                        maxY = Math.max(maxY, v.y);
                }

                return {
                        minX,
                        maxX,
                        minY,
                        maxY
                };
        }
        function getCornersBounds(obj) {
                const shape = Game.getCollisionShape(obj);

                if (shape.type === 'rectangle') {
                        if (shape.angle === 0) {
                                return {
                                        minX: shape.x,
                                        maxX: shape.x + shape.width,
                                        minY: shape.y,
                                        maxY: shape.y + shape.height
                                };
                        } else {
                                const angleRad = shape.angle * Math.PI / 180;
                                const halfW = shape.width / 2;
                                const halfH = shape.height / 2;
                                const center = new Vector2(shape.x + halfW, shape.y + halfH);

                                const corners = [
                                        Vector2.add(Vector2.rotate(new Vector2(-halfW, -halfH), angleRad), center),
                                        Vector2.add(Vector2.rotate(new Vector2(halfW, -halfH), angleRad), center),
                                        Vector2.add(Vector2.rotate(new Vector2(halfW, halfH), angleRad), center),
                                        Vector2.add(Vector2.rotate(new Vector2(-halfW, halfH), angleRad), center)
                                ];

                                return getPolygonBounds(corners);
                        }
                } else if (shape.type === 'circle') {
                        return {
                                minX: shape.x - shape.radius,
                                maxX: shape.x + shape.radius,
                                minY: shape.y - shape.radius,
                                maxY: shape.y + shape.radius
                        };
                }

                // По умолчанию возвращаем AABB объекта
                return {
                        minX: obj.x,
                        maxX: obj.x + obj.width,
                        minY: obj.y,
                        maxY: obj.y + obj.height
                };
        }
        function checkCollisionWithBuffer(obj) {
                const buffer = 2;
                const oldX = obj.x, oldY = obj.y;

                // Вниз
                obj.y += buffer;
                checkAABBTileCollision(obj);
                obj.y = oldY;

                // Влево
                obj.x -= buffer;
                checkAABBTileCollision(obj);
                obj.x = oldX;

                // Вправо
                obj.x += buffer;
                checkAABBTileCollision(obj);
                obj.x = oldX;
        }
        function forceResolveTileOverlap(obj) {
                const tileSize = Game.helper.tiles.tileSize;
                const safetyMargin = 0.5;

                const left = obj.x;
                const right = obj.x + obj.width;
                const top = obj.y;
                const bottom = obj.y + obj.height;

                const leftCol = Math.floor(left / tileSize);
                const rightCol = Math.floor(right / tileSize);
                const topRow = Math.floor(top / tileSize);
                const bottomRow = Math.floor(bottom / tileSize);

                let resolved = false;

                for (let row = topRow; row <= bottomRow; row++) {
                        for (let col = leftCol; col <= rightCol; col++) {
                                if (Game.isTileSolid(col, row)) {
                                        const tileX = col * tileSize;
                                        const tileY = row * tileSize;

                                        if (right > tileX && left < tileX + tileSize &&
                                                bottom > tileY && top < tileY + tileSize) {

                                                const overlapX = Math.min(right, tileX + tileSize) - Math.max(left, tileX);
                                                const overlapY = Math.min(bottom, tileY + tileSize) - Math.max(top, tileY);

                                                if (overlapX < overlapY) {
                                                        obj.x += (left < tileX ? -1 : 1) * (overlapX + safetyMargin);
                                                } else {
                                                        obj.y += (top < tileY ? -1 : 1) * (overlapY + safetyMargin);
                                                }

                                                obj.speedx = 0;
                                                obj.speedy = 0;
                                                resolved = true;
                                        }
                                }
                        }
                }

                return resolved;
        }
        function checkContinuousCollision(obj) {
                const tileSize = Game.helper.tiles.tileSize;
                const dx = obj.x - obj.prev_x;
                const dy = obj.y - obj.prev_y;
                const distance = Math.sqrt(dx*dx + dy*dy);

                if (distance < 0.1) return false;

                const steps = Math.min(Math.ceil(distance / (tileSize * 0.25)), 16);
                const origX = obj.prev_x;
                const origY = obj.prev_y;

                for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        obj.x = origX + dx * t;
                        obj.y = origY + dy * t;

                        if (checkAABBTileCollision(obj)) {
                                // Коллизия найдена → откатываемся к предыдущему шагу
                                obj.x = origX + dx * ((i - 1) / steps);
                                obj.y = origY + dy * ((i - 1) / steps);

                                // Обнуляем скорость (как в C)
                                obj.speedx = 0;
                                obj.speedy = 0;

                                return true;
                        }
                }

                // Восстанавливаем текущую позицию, если коллизий нет
                obj.x = origX + dx;
                obj.y = origY + dy;

                return false;
        }
        function forceResolveTileOverlap(obj) {
                const tileSize = Game.helper.tiles.tileSize;
                const left = obj.x;
                const right = obj.x + obj.width;
                const top = obj.y;
                const bottom = obj.y + obj.height;

                const leftCol = Math.floor(left / tileSize);
                const rightCol = Math.floor(right / tileSize);
                const topRow = Math.floor(top / tileSize);
                const bottomRow = Math.floor(bottom / tileSize);

                for (let row = topRow; row <= bottomRow; row++) {
                        for (let col = leftCol; col <= rightCol; col++) {
                                if (Game.isTileSolid(col, row)) {
                                        const tileX = col * tileSize;
                                        const tileY = row * tileSize;

                                        if (right > tileX && left < tileX + tileSize &&
                                                bottom > tileY && top < tileY + tileSize) {

                                                const overlapX = Math.min(right, tileX + tileSize) - Math.max(left, tileX);
                                                const overlapY = Math.min(bottom, tileY + tileSize) - Math.max(top, tileY);

                                                if (overlapX < overlapY) {
                                                        obj.x += (left < tileX ? -1 : 1) * (overlapX + 0.1);
                                                } else {
                                                        obj.y += (top < tileY ? -1 : 1) * (overlapY + 0.1);
                                                }
                                        }
                                }
                        }
                }
        }
        function checkCenterTileCollision(obj) {
                const tileSize = Game.helper.tiles.tileSize;
                const cx = obj.x + obj.width / 2;
                const cy = obj.y + obj.height / 2;
                const col = Math.floor(cx / tileSize);
                const row = Math.floor(cy / tileSize);

                if (Game.isTileSolid(col, row)) {
                        obj.isAnchored = true;
                        obj.anchorCount = (obj.anchorCount || 0) + 1;
                        if (row * tileSize >= obj.y + obj.height - 1) {
                                obj.isOnGround = true;
                        }
                }
        }
        function checkAABBTileCollision(obj) {
                const tileSize = Game.helper.tiles.tileSize;
                const left = obj.x;
                const right = obj.x + obj.width;
                const top = obj.y;
                const bottom = obj.y + obj.height;

                const leftCol = Math.floor(left / tileSize);
                const rightCol = Math.floor(right / tileSize);
                const topRow = Math.floor(top / tileSize);
                const bottomRow = Math.floor(bottom / tileSize);

                let collided = false;

                for (let row = topRow; row <= bottomRow; row++) {
                        for (let col = leftCol; col <= rightCol; col++) {
                                if (Game.isTileSolid(col, row)) {
                                        const tileX = col * tileSize;
                                        const tileY = row * tileSize;

                                        // Простое AABB
                                        if (right > tileX && left < tileX + tileSize &&
                                                bottom > tileY && top < tileY + tileSize) {

                                                // Вычисляем пересечение
                                                const overlapX = Math.min(right, tileX + tileSize) - Math.max(left, tileX);
                                                const overlapY = Math.min(bottom, tileY + tileSize) - Math.max(top, tileY);

                                                // Определяем минимальную ось
                                                if (overlapX < overlapY) {
                                                        const normalX = left < tileX ? -1 : 1;
                                                        resolveTileCollision(obj, { normal: { x: normalX, y: 0 }, overlap: overlapX });
                                                } else {
                                                        const normalY = top < tileY ? -1 : 1;
                                                        resolveTileCollision(obj, { normal: { x: 0, y: normalY }, overlap: overlapY });
                                                }

                                                obj.collidingTiles.push({ col, row });
                                                collided = true;
                                        }
                                }
                        }
                }

                return collided;
        }
        function checkOBBSATTileCollision(obj, objCorners, col, row) {
                if (row < 0 || row >= Game.helper.tiles.rows || col < 0 || col >= Game.helper.tiles.cols) {
                        return false
                }
                const tileValue = Game.helper.tiles.grid[row][col];
                if (tileValue <= 0) {
                        return false
                }
                // Проверяем, является ли тайл твердым
                if (!Game.isTileSolid(col, row)) {
                        return false
                }
                const tileSize = Game.helper.tiles.tileSize;
                const tileX = col * tileSize;
                const tileY = row * tileSize;
                // Углы тайла
                const tileCorners = [new Vector2(tileX, tileY), new Vector2(tileX + tileSize, tileY), new Vector2(tileX + tileSize, tileY + tileSize), new Vector2(tileX, tileY + tileSize)];
                // Оси для SAT (нормали ребер объекта + нормали ребер тайла)
                const axes = [];
                // Добавляем нормали объекта
                for (let i = 0; i < objCorners.length; i++) {
                        const p1 = objCorners[i];
                        const p2 = objCorners[(i + 1) % objCorners.length];
                        const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
                        const normal = new Vector2(-edge.y, edge.x).normalize();
                        axes.push(normal)
                }
                // Добавляем нормали тайла (горизонтальные и вертикальные)
                axes.push(new Vector2(1, 0));
                axes.push(new Vector2(0, 1));
                let minOverlap = Infinity;
                let smallestAxis = new Vector2(0, 0);
                for (const axis of axes) {
                        const projObj = projectPolygon(axis, objCorners);
                        const projTile = projectPolygon(axis, tileCorners);
                        if (projObj.max < projTile.min || projTile.max < projObj.min) {
                                return false; // Нет коллизии
                        }
                        const overlap = Math.min(projObj.max, projTile.max) - Math.max(projObj.min, projTile.min);
                        if (overlap < minOverlap) {
                                minOverlap = overlap;
                                smallestAxis = axis
                        }
                }
                // Определение направления нормали
                const centerObj = new Vector2((objCorners[0].x + objCorners[2].x) / 2, (objCorners[0].y + objCorners[2].y) / 2);
                const centerTile = new Vector2(tileX + tileSize / 2, tileY + tileSize / 2);
                if (Vector2.dot(new Vector2(centerTile.x - centerObj.x, centerTile.y - centerObj.y), smallestAxis) < 0) {
                        smallestAxis.x *= -1;
                        smallestAxis.y *= -1
                }
                // Добавляем информацию о столкнувшемся тайле
                obj.collidingTiles.push({
                        col: col,
                        row: row,
                        tileId: tileValue,
                        tileX: tileX,
                        tileY: tileY,
                        normalX: smallestAxis.x,
                        normalY: smallestAxis.y,
                        overlap: minOverlap
                });
                if (draw_bounding_box) {
                        g_ctx.beginPath();
                        g_ctx.moveTo(tileX + tileSize / 2 - Game.screenx, tileY + tileSize / 2 - Game.screeny);
                        g_ctx.lineTo(
                                (tileX + tileSize / 2 + collision.normal.x * 30) - Game.screenx,
                                (tileY + tileSize / 2 + collision.normal.y * 30) - Game.screeny);
                        g_ctx.strokeStyle = "red";
                        g_ctx.lineWidth = 2;
                        g_ctx.stroke();
                }
                return {
                        collides: true,
                        normal: smallestAxis,
                        overlap: minOverlap
                }
        }
        function getEdgeNormal(p1, p2) {
                const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
                return new Vector2(-edge.y, edge.x).normalize()
        }
        function updatePersistentContacts(obj, col, row, normal = null) {
                const tileX = col * Game.helper.tiles.tileSize;
                const tileY = row * Game.helper.tiles.tileSize;
                const tileSize = Game.helper.tiles.tileSize;

                // Если нормаль не предоставлена (AABB коллизия), вычисляем ее
                if (!normal) {
                        const objCenterX = obj.x + obj.width / 2;
                        const objCenterY = obj.y + obj.height / 2;
                        const tileCenterX = tileX + tileSize / 2;
                        const tileCenterY = tileY + tileSize / 2;

                        // Вычисляем направление от центра тайла к центру объекта
                        const dx = objCenterX - tileCenterX;
                        const dy = objCenterY - tileCenterY;

                        // Определяем главную ось столкновения
                        if (Math.abs(dx) > Math.abs(dy)) {
                                normal = new Vector2(dx > 0 ? 1 : -1, 0);
                        } else {
                                normal = new Vector2(0, dy > 0 ? 1 : -1);
                        }
                }

                // Определяем сторону столкновения на основе нормали
                let side = null;
                if (normal.y < -0.7)
                        side = 'top'; // Столкновение с низом тайла (верх объекта)
                else if (normal.y > 0.7)
                        side = 'bottom'; // Столкновение с верхом тайла (низ объекта)
                else if (normal.x < -0.7)
                        side = 'left'; // Столкновение с правом тайла (лево объекта)
                else if (normal.x > 0.7)
                        side = 'right'; // Столкновение с левом тайла (право объекта)

                if (side) {
                        obj.persistentContacts[side].count++;
                        obj.persistentContacts[side].tile = {
                                col,
                                row
                        };
                }
        }

        function checkPersistentContacts(obj) {
                let isStuck = false;

                // Проверяем все стороны на длительный контакт
                for (let side in obj.persistentContacts) {
                        const contact = obj.persistentContacts[side];

                        if (contact.count >= obj.minPersistentFrames) {
                                isStuck = true;

                                // Можно добавить специальные эффекты для разных сторон
                                if (side === 'bottom') {
                                        obj.isOnGround = true;
                                        // Дополнительные эффекты при длительном контакте с землей
                                }
                        }
                }

                obj.isStuck = isStuck;

                // Дополнительная логика при "залипании"
                if (obj.isStuck) {
                        // Например, уменьшение скорости или другие эффекты
                        obj.speedx *= 0.9;
                        obj.speedy *= 0.9;
                }
        }
        function resolveTileCollision(obj, collision) {
                const { normal, overlap } = collision;
                const safetyMargin = 0.1;

                // Определяем тип столкновения по доминирующей компоненте нормали
                if (Math.abs(normal.y) > 0.7) {
                        // Вертикальное столкновение (пол/потолок)
                        obj.y -= normal.y * (overlap + safetyMargin);

                        // Гасим только вертикальную скорость
                        if (normal.y < -0.7) {
                                // Удар снизу → объект стоит на земле
                                obj.speedy = Math.min(obj.speedy, 0); // обнуляем или отсекаем положительную
                                obj.isOnGround = true;
                                obj.isAnchored = true;
                                obj.anchorCount = (obj.anchorCount || 0) + 1;
                        } else {
                                // Удар в потолок
                                obj.speedy = Math.max(obj.speedy, 0);
                        }
                }
                else if (Math.abs(normal.x) > 0.7) {
                        // Горизонтальное столкновение (стены)
                        obj.x -= normal.x * (overlap + safetyMargin);

                        // Гасим только горизонтальную скорость
                        if (normal.x < 0) {
                                obj.speedx = Math.min(obj.speedx, 0);
                        } else {
                                obj.speedx = Math.max(obj.speedx, 0);
                        }
                }

                // Важно: НЕ применяем restitution (отскок) напрямую — это вызывает "взрыв"
                // Вместо этого — только гашение скорости
        }
        // Функции для работы с полигонами и коллизиями
        function getPolygonAxes(points) {
                const axes = [];
                for (let i = 0; i < points.length; i++) {
                        const p1 = points[i];
                        const p2 = points[(i + 1) % points.length];
                        const edge = new Vector2(p2.x - p1.x, p2.y - p1.y);
                        const normal = new Vector2(-edge.y, edge.x).normalize();
                        axes.push(normal)
                }
                return axes
        }
        function projectPolygon(axis, points) {
                let min = Vector2.dot(axis, points[0]);
                let max = min;
                for (let i = 1; i < points.length; i++) {
                        const projection = Vector2.dot(axis, points[i]);
                        if (projection < min)
                                min = projection;
                        if (projection > max)
                                max = projection
                }
                return {
                        min: min,
                        max: max
                }
        }
        // Функция для загрузки тайлов из массива
        Game.setTileFromArray = function (tileArray) {
                if (!Array.isArray(tileArray) || tileArray.length < 2) {
                        console.error("Invalid tile array format");
                        return
                }
                Game.helper.tiles.tileSize = tileArray[0];
                Game.helper.tiles.cols = tileArray[1];
                Game.helper.tiles.rows = tileArray[2];
                Game.helper.tiles.grid = Array(Game.helper.tiles.rows).fill().map(() => Array(Game.helper.tiles.cols).fill(0));
                Game.helper.tiles.tilesData = {}; // Для хранения дополнительных данных
                Game.physics.init();
                Game.helper.tiles.solidMap = {};
                let index = 3;
                let row = 0;
                let col = 0;
                while (index < tileArray.length && row < Game.helper.tiles.rows) {
                        const value = tileArray[index];
                        if (value >= 32768) {
                                // RLE-сжатие
                                const repeatCount = value - 32768;
                                const tileValue = tileArray[index + 1];
                                index += 2;
                                for (let i = 0; i < repeatCount; i++) {
                                        if (col >= Game.helper.tiles.cols) {
                                                col = 0;
                                                row++;
                                                if (row >= Game.helper.tiles.rows)
                                                        break
                                        }
                                        if (tileValue >= 16383 && tileValue <= 32765) {
                                                const originalId = tileValue - 16383;
                                                Game.helper.tiles.grid[row][col] = originalId;
                                                // По умолчанию тайлы с ID 16383-32765 - твердые
                                                Game.helper.tiles.solidMap[`${row}_${col}`] = true
                                        } else {
                                                Game.helper.tiles.grid[row][col] = tileValue;
                                                // По умолчанию обычные тайлы - мягкие
                                                Game.helper.tiles.solidMap[`${row}_${col}`] = false
                                        }
                                        col++
                                }
                        } else {
                                if (col >= Game.helper.tiles.cols) {
                                        col = 0;
                                        row++;
                                        if (row >= Game.helper.tiles.rows)
                                                break
                                }
                                if (value >= 16383 && value <= 32765) {
                                        const originalId = value - 16383;
                                        Game.helper.tiles.grid[row][col] = originalId;
                                        // Тайлы с ID 16383-32765 - твердые по умолчанию
                                        Game.helper.tiles.solidMap[`${row}_${col}`] = true
                                } else {
                                        Game.helper.tiles.grid[row][col] = value;
                                        // Обычные тайлы - мягкие по умолчанию
                                        Game.helper.tiles.solidMap[`${row}_${col}`] = false
                                }
                                col++;
                                index++
                        }
                }
        
        Game.physics.createTiles();
};
        // Функция для установки спрайта тайлов
        Game.setTileImage = function (spriteNumber) {
                Game.helper.tiles.sprite = spriteNumber
        };
        Game.isTileSolid = function (tileX, tileY) {
                if (!Game.helper.tiles.grid || tileY < 0 || tileY >= Game.helper.tiles.rows || tileX < 0 || tileX >= Game.helper.tiles.cols) {
                        return false
                }
                const tileValue = Game.helper.tiles.grid[tileY][tileX];
                if (tileValue <= 0)
                        return false;
                // Проверяем карту твердости
                return Game.helper.tiles.solidMap[`${tileY}_${tileX}`] || false
        };
        // Добавляем функцию для получения тайла в координатах
        Game.getTileAt = function (pixelX, pixelY) {
                if (!Game.helper.tiles.grid)
                        return 0;
                const tileX = Math.floor(pixelX / Game.helper.tiles.tileSize);
                const tileY = Math.floor(pixelY / Game.helper.tiles.tileSize);
                if (tileY < 0 || tileY >= Game.helper.tiles.rows || tileX < 0 || tileX >= Game.helper.tiles.cols) {
                        return 0
                }
                return Game.helper.tiles.grid[tileY][tileX]
        };
        Game.checkTileCollision = function(obj) {
                if (!Game.helper.tiles.grid || !obj.solid) return false;

                // Сброс временных данных
                obj.collidingTiles = [];
                obj.isAnchored = false;
                obj.anchorCount = 0;
                obj.isOnGround = false;

                const tileSize = Game.helper.tiles.tileSize;
                const halfTile = tileSize / 2;

                // Сохраняем исходную позицию
                const origX = obj.x;
                const origY = obj.y;

                // Вычисляем смещение за кадр
                const dx = obj.speedx;
                const dy = obj.speedy;
                const speed = Math.sqrt(dx*dx + dy*dy);

                // CCD: разбиваем движение на шаги
                const steps = Math.max(1, Math.min(Math.ceil(speed / tileSize), 5));

                let collided = false;

                for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        obj.x = origX + dx * t;
                        obj.y = origY + dy * t;

                        // Основная проверка AABB
                        if (checkAABBTileCollision(obj)) {
                                // Откатываемся к предыдущему шагу
                                obj.x = origX + dx * ((i - 1) / steps);
                                obj.y = origY + dy * ((i - 1) / steps);

                                // Обнуляем скорость
                                obj.speedx = 0;
                                obj.speedy = 0;

                                collided = true;
                                break;
                        }
                }

                if (!collided) {
                        // Если CCD не сработал, всё равно проверяем текущую позицию
                        obj.x = origX;
                        obj.y = origY;
                        checkAABBTileCollision(obj);
                }

                // Дополнительные проверки с буфером (аналог checkCollisionWithBuffer)
                checkCollisionWithBuffer(obj);

                // Проверка центра (чтобы точно определить "на земле")
                checkCenterTileCollision(obj);

                // Финальная коррекция, если осталось пересечение
                forceResolveTileOverlap(obj);

                return collided;
        };
        Game.checkCollision = function (a, b) {
                const shapeA = Game.getCollisionShape(a);
                const shapeB = Game.getCollisionShape(b);

                if (shapeA.type === 'rectangle' && shapeB.type === 'rectangle') {
                        return Game.checkRectRectCollision(a, b, shapeA, shapeB);
                } else if (shapeA.type === 'circle' && shapeB.type === 'circle') {
                        return Game.checkCircleCircleCollision(a, b, shapeA, shapeB);
                } else if (shapeA.type === 'rectangle' && shapeB.type === 'circle') {
                        return Game.checkRectCircleCollision(a, b, shapeA, shapeB);
                } else if (shapeA.type === 'circle' && shapeB.type === 'rectangle') {
                        const result = Game.checkRectCircleCollision(b, a, shapeB, shapeA);
                        if (result.collides) {
                                result.normal.x = -result.normal.x;
                                result.normal.y = -result.normal.y;
                        }
                        return result;
                }

                return {
                        collides: false
                };
        };
        Game.checkRectRectCollision = function(a, b, rect1, rect2) {
                // Fast AABB check first
                if (rect1.x + rect1.width < rect2.x || 
                        rect2.x + rect2.width < rect1.x || 
                        rect1.y + rect1.height < rect2.y || 
                        rect2.y + rect2.height < rect1.y) {
                        return { collides: false };
                }

                // Cache centers and half-sizes
                const cx1 = rect1.x + rect1.width/2, cy1 = rect1.y + rect1.height/2;
                const cx2 = rect2.x + rect2.width/2, cy2 = rect2.y + rect2.height/2;
                const hw1 = rect1.width/2, hh1 = rect1.height/2;
                const hw2 = rect2.width/2, hh2 = rect2.height/2;

                // Cache rotation values
                const a1 = rect1.angle * Math.PI/180, cos1 = Math.cos(a1), sin1 = Math.sin(a1);
                const a2 = rect2.angle * Math.PI/180, cos2 = Math.cos(a2), sin2 = Math.sin(a2);

                // Get rotated points for both rectangles
                const getPoints = (cx, cy, hw, hh, cos, sin) => [
                        {x: cx + (-hw*cos + hh*sin), y: cy + (-hw*sin - hh*cos)}, // TL
                        {x: cx + ( hw*cos + hh*sin), y: cy + ( hw*sin - hh*cos)}, // TR
                        {x: cx + ( hw*cos - hh*sin), y: cy + ( hw*sin + hh*cos)}, // BR
                        {x: cx + (-hw*cos - hh*sin), y: cy + (-hw*sin + hh*cos)}  // BL
                ];

                const pts1 = getPoints(cx1, cy1, hw1, hh1, cos1, sin1);
                const pts2 = getPoints(cx2, cy2, hw2, hh2, cos2, sin2);

                // Get all axes for SAT
                const axes = [];
                const getAxes = (points, axes) => {
                        for (let i = 0; i < points.length; i++) {
                                const p1 = points[i], p2 = points[(i+1)%4];
                                const dx = p2.x - p1.x, dy = p2.y - p1.y;
                                const len = Math.sqrt(dx*dx + dy*dy);
                                axes.push({x: -dy/len, y: dx/len}); // normalized normal
                        }
                };
                getAxes(pts1, axes);
                getAxes(pts2, axes);

                // Check all axes for overlap
                let minOverlap = Infinity, normal = {x: 0, y: 0};
                
                const project = (axis, points) => {
                        let min = Infinity, max = -Infinity;
                        for (const p of points) {
                                const dot = p.x*axis.x + p.y*axis.y;
                                min = Math.min(min, dot);
                                max = Math.max(max, dot);
                        }
                        return {min, max};
                };

                for (const axis of axes) {
                        const p1 = project(axis, pts1);
                        const p2 = project(axis, pts2);
                        
                        if (p1.max < p2.min || p2.max < p1.min) {
                                return {collides: false};
                        }
                        
                        const overlap = Math.min(p1.max, p2.max) - Math.max(p1.min, p2.min);
                        if (overlap < minOverlap) {
                                minOverlap = overlap;
                                normal = axis;
                        }
                }

                // Ensure normal points from rect1 to rect2
                const dx = cx2 - cx1, dy = cy2 - cy1;
                if (dx*normal.x + dy*normal.y < 0) {
                        normal = {x: -normal.x, y: -normal.y};
                }

                return {
                        collides: true,
                        normal: normal,
                        overlap: minOverlap
                };
        };
        // Вспомогательная функция для определения формы коллизии
        Game.getCollisionShape = function (obj) {
                // Предварительно вычисляем общие значения
                const offsetX = (obj.width - obj.boundingWidth) / 2;
                const offsetY = (obj.height - obj.boundingHeight) / 2;
                const centerX = offsetX + obj.boundingWidth / 2;
                const centerY = offsetY + obj.boundingHeight / 2;

                // Обрабатываем разные типы коллизий
                const shape = obj.collisionShape;
                if (shape === undefined || shape === 0 || shape === 1) {
                        return {
                                type: 'rectangle',
                                x: obj.x + offsetX,
                                y: obj.y + offsetY,
                                width: obj.boundingWidth,
                                height: obj.boundingHeight,
                                angle: obj.angle || 0
                        };
                } 
                else if (shape === 2) {
                        return {
                                type: 'circle',
                                x: obj.x + centerX,
                                y: obj.y + centerY,
                                radius: Math.min(obj.boundingWidth, obj.boundingHeight) / 2
                        };
                } 
                else if (shape && typeof shape === 'object' && shape.radius !== undefined) {
                        return {
                                type: 'circle',
                                x: obj.x + centerX,
                                y: obj.y + centerY,
                                radius: shape.radius
                        };
                }

                // По умолчанию — прямоугольник
                return {
                        type: 'rectangle',
                        x: obj.x + offsetX,
                        y: obj.y + offsetY,
                        width: obj.boundingWidth,
                        height: obj.boundingHeight,
                        angle: obj.angle || 0
                };
        };

        Game.checkCircleCircleCollision = function (a, b, shapeA, shapeB) {
                const dx = shapeB.x - shapeA.x;
                const dy = shapeB.y - shapeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = shapeA.radius + shapeB.radius;

                if (distance < minDistance) {
                        return {
                                collides: true,
                                normal: {
                                        x: dx / distance,
                                        y: dy / distance
                                },
                                overlap: minDistance - distance
                        };
                }
                return {
                        collides: false
                };
        };
        Game.checkCircleTileCollision = function (obj, circleShape, col, row) {
                if (row < 0 || row >= Game.helper.tiles.rows || col < 0 || col >= Game.helper.tiles.cols) {
                        return false;
                }

                const tileValue = Game.helper.tiles.grid[row][col];
                if (tileValue <= 0 || !Game.isTileSolid(col, row)) {
                        return false;
                }

                const tileSize = Game.helper.tiles.tileSize;
                const tileX = col * tileSize;
                const tileY = row * tileSize;

                // Находим ближайшую точку на тайле к центру круга
                let closestX = Math.max(tileX, Math.min(circleShape.x, tileX + tileSize));
                let closestY = Math.max(tileY, Math.min(circleShape.y, tileY + tileSize));

                // Если центр круга внутри тайла, корректируем ближайшую точку
                let circleInside = false;
                if (circleShape.x >= tileX && circleShape.x <= tileX + tileSize &&
                        circleShape.y >= tileY && circleShape.y <= tileY + tileSize) {
                        circleInside = true;

                        // Находим направление ближайшего выхода
                        const distLeft = circleShape.x - tileX;
                        const distRight = tileX + tileSize - circleShape.x;
                        const distTop = circleShape.y - tileY;
                        const distBottom = tileY + tileSize - circleShape.y;

                        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

                        if (minDist === distLeft) {
                                closestX = tileX;
                                closestY = circleShape.y;
                        } else if (minDist === distRight) {
                                closestX = tileX + tileSize;
                                closestY = circleShape.y;
                        } else if (minDist === distTop) {
                                closestX = circleShape.x;
                                closestY = tileY;
                        } else {
                                closestX = circleShape.x;
                                closestY = tileY + tileSize;
                        }
                }

                const distanceX = circleShape.x - closestX;
                const distanceY = circleShape.y - closestY;
                const distanceSquared = distanceX * distanceX + distanceY * distanceY;

                if (circleInside || distanceSquared < circleShape.radius * circleShape.radius) {
                        const distance = Math.sqrt(distanceSquared);
                        let overlap = circleShape.radius - (circleInside ? -distance : distance);

                        // Нормаль коллизии (направлена от тайла к кругу)
                        let normalX,
                        normalY;
                        if (distance === 0) {
                                // Случай, когда круг точно в углу
                                normalX = circleShape.x < tileX + tileSize / 2 ? -1 : 1;
                                normalY = circleShape.y < tileY + tileSize / 2 ? -1 : 1;
                                // Нормализуем
                                const len = Math.sqrt(normalX * normalX + normalY * normalY);
                                normalX /= len;
                                normalY /= len;
                        } else {
                                normalX = distanceX / distance;
                                normalY = distanceY / distance;
                        }

                        // Коррекция позиции (более агрессивная)
                        const correctionX = normalX * overlap * 1.05; // Небольшой дополнительный толчок
                        const correctionY = normalY * overlap * 1.05;

                        // Применяем коррекцию
                        circleShape.x += correctionX;
                        circleShape.y += correctionY;
                        obj.x += correctionX;
                        obj.y += correctionY;

                        // Коррекция скорости
                        const dot = obj.speedx * normalX + obj.speedy * normalY;
                        if (dot < 0) {
                                obj.speedx -= dot * normalX * (obj.restitution || 0.5);
                                obj.speedy -= dot * normalY * (obj.restitution || 0.5);
                        }

                        // Добавляем информацию о коллизии
                        obj.collidingTiles.push({
                                col: col,
                                row: row,
                                tileId: tileValue,
                                tileX: tileX,
                                tileY: tileY,
                                normalX: normalX,
                                normalY: normalY,
                                overlap: overlap
                        });

                        return true;
                }

                return false;
        };

        // Проверка столкновения прямоугольник-круг
        Game.checkRectCircleCollision = function (rect, circle, shapeRect, shapeCircle) {
                const angle = -shapeRect.angle * Math.PI / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                const rectCenterX = shapeRect.x + shapeRect.width / 2;
                const rectCenterY = shapeRect.y + shapeRect.height / 2;

                // Координаты круга относительно центра прямоугольника
                const dx = shapeCircle.x - rectCenterX;
                const dy = shapeCircle.y - rectCenterY;

                // Поворачиваем координаты круга
                const rotatedX = dx * cos - dy * sin;
                const rotatedY = dx * sin + dy * cos;

                // Ближайшая точка на прямоугольнике к кругу
                let closestX = Math.max(-shapeRect.width / 2, Math.min(rotatedX, shapeRect.width / 2));
                let closestY = Math.max(-shapeRect.height / 2, Math.min(rotatedY, shapeRect.height / 2));

                // Проверяем, находится ли центр круга внутри прямоугольника
                const circleInside = (rotatedX >= -shapeRect.width / 2 && rotatedX <= shapeRect.width / 2 &&
                        rotatedY >= -shapeRect.height / 2 && rotatedY <= shapeRect.height / 2);

                let distanceX,
                distanceY;
                if (circleInside) {
                        // Находим ближайшую грань
                        const distLeft = rotatedX - (-shapeRect.width / 2);
                        const distRight = shapeRect.width / 2 - rotatedX;
                        const distTop = rotatedY - (-shapeRect.height / 2);
                        const distBottom = shapeRect.height / 2 - rotatedY;

                        const minDist = Math.min(distLeft, distRight, distTop, distBottom);

                        if (minDist === distLeft) {
                                closestX = -shapeRect.width / 2;
                                closestY = rotatedY;
                        } else if (minDist === distRight) {
                                closestX = shapeRect.width / 2;
                                closestY = rotatedY;
                        } else if (minDist === distTop) {
                                closestX = rotatedX;
                                closestY = -shapeRect.height / 2;
                        } else {
                                closestX = rotatedX;
                                closestY = shapeRect.height / 2;
                        }

                        distanceX = rotatedX - closestX;
                        distanceY = rotatedY - closestY;
                } else {
                        distanceX = rotatedX - closestX;
                        distanceY = rotatedY - closestY;
                }

                const distanceSquared = distanceX * distanceX + distanceY * distanceY;
                const radiusSquared = shapeCircle.radius * shapeCircle.radius;

                if (circleInside || distanceSquared < radiusSquared) {
                        const distance = Math.sqrt(distanceSquared);
                        const overlap = shapeCircle.radius - (circleInside ? -distance : distance);

                        // Поворачиваем нормаль обратно в глобальные координаты
                        const globalNormalX = (distanceX / distance) * cos + (distanceY / distance) * sin;
                        const globalNormalY =  - (distanceX / distance) * sin + (distanceY / distance) * cos;

                        return {
                                collides: true,
                                normal: {
                                        x: globalNormalX,
                                        y: globalNormalY
                                },
                                overlap: overlap * 1.2 // Увеличиваем перекрытие для гарантированного разделения
                        };
                }

                return {
                        collides: false
                };
        };
        Game.addObjectsFromArray = function (objectsArray) {
                for (var arrIndex = 0; arrIndex < objectsArray.length; arrIndex++) {
                        var obj = objectsArray[arrIndex];
                        var xyArray = obj.xy;
                        var objectRef = obj.id;

                        // Check if object with such id exists
                        if (!objectRef) {
                                console.error('Object with id "' + objectRef + '" not found in window scope');
                                continue;
                        }

                        // Check that xyArray is an array and has correct number of elements (multiple of 3: x, y, angle)
                        if (!Array.isArray(xyArray)) {
                                console.error('xy property for object "' + objectRef + '" is not an array');
                                continue;
                        }
                        if (xyArray.length % 3 !== 0) {
                                console.error('xy array for object "' + objectRef + '" should have elements in triplets (x, y, angle)');
                                continue;
                        }

                        // Add objects
                        for (var i = 0; i < xyArray.length; i += 3) {
                                var x = xyArray[i];
                                var y = xyArray[i + 1];
                                var angle = xyArray[i + 2];

                                // Check that coordinates and angle are numbers
                                if (typeof x !== "number" || typeof y !== "number" || typeof angle !== "number") {
                                        console.error("Invalid coordinates or angle at position " + i + ' for object "' + objectRef + '"');
                                        continue;
                                }

                                // Call addObject method with parameters
                                var o = Game.addObject(objectRef.name, x, y, objectRef.width, objectRef.height, objectRef.sprite);

                                // Copy all properties from objectRef to the new object
                                for (var key in objectRef) {
                                        if (objectRef.hasOwnProperty(key)) {
                                                o[key] = Game.helper.deepCopy(objectRef[key]);
                                        }
                                }

                                // Ensure local is a unique object (not shared reference).
                                if (!o.local || typeof o.local !== 'object') o.local = {};
                                // Set position and angle
                                o.x = x;
                                o.y = y;
                                o.angle = angle;

                                // Call onCreate if it exists
                                if (o.onCreate)
                                        o.onCreate();
                        }
                }
        };
        Game.tileResolveCollision = function (obj, collision) {
                const {
                        normal,
                        overlap
                } = collision;
                const buffer = 0.1;

                // Коррекция позиции
                obj.x -= normal.x * (overlap + buffer);
                obj.y -= normal.y * (overlap + buffer);

                // Проверка "на земле" с учетом угла объекта
                if (gravitation > 0) {
                        if (normal.y > 0.7) { // Если нормаль вверх (y близко к 1)
                                obj.isOnGround = true;
                                obj.speedy = Math.max(0, obj.speedy);
                        }
                } else {
                        if (normal.y < -0.7) { // Если нормаль вверх (y близко к 1)
                                obj.isOnGround = true;
                                obj.speedy = Math.max(0, obj.speedy);
                        }
                }
                // Гашение микроскоростей
                if (Math.abs(obj.speedx) < 0.01)
                        obj.speedx = 0;
                if (Math.abs(obj.speedy) < 0.01)
                        obj.speedy = 0;
                //console.log("downDot:", downDot, "normal:", normal, "objDown:", {x: objDownX, y: objDownY});
        };
        // Проверяет, находится ли объект в длительном контакте с указанной стороной
        Game.isPersistentContact = function (obj, side) {
                return obj.persistentContacts[side].count >= obj.minPersistentFrames;
        };

        // Возвращает тайл, с которым есть длительный контакт
        Game.getPersistentContactTile = function (obj, side) {
                if (obj.persistentContacts[side].count >= obj.minPersistentFrames) {
                        return obj.persistentContacts[side].tile;
                }
                return null;
        };

        // Проверяет, "залип" ли объект к поверхностям
        Game.isObjectStuck = function (obj) {
                return obj.isStuck;
        };
        Game.resolveCollision = function (a, b, collisionInfo) {
                if (a.isStatic && b.isStatic)
                        return;
                const {
                        normal,
                        overlap
                } = collisionInfo;

                // Особый случай: если нормаль указывает на угол (обе компоненты значительны)
                const isCornerCollision = Math.abs(normal.x) > 0.5 && Math.abs(normal.y) > 0.5;
                if (a.isStatic || b.isStatic) {
                        const staticObj = a.isStatic ? a : b;
                        const dynamicObj = a.isStatic ? b : a;

                        // Увеличиваем overlap для статических объектов
                        const enhancedOverlap = overlap * 1.5;

                        // Применяем коррекцию только к динамическому объекту
                        dynamicObj.x -= normal.x * enhancedOverlap;
                        dynamicObj.y -= normal.y * enhancedOverlap;

                        // Коррекция скорости
                        const velocityAlongNormal = dynamicObj.speedx * normal.x + dynamicObj.speedy * normal.y;
                        if (velocityAlongNormal < 0) {
                                dynamicObj.speedx -= velocityAlongNormal * normal.x * dynamicObj.restitution;
                                dynamicObj.speedy -= velocityAlongNormal * normal.y * dynamicObj.restitution;
                        }

                        return;
                }

                if (isCornerCollision) {
                        // Для угловых столкновений увеличиваем overlap и применяем коррекцию по обеим осям
                        const buffer = 0.5; // Увеличиваем буфер для углов
                        const correction = new Vector2(
                                        normal.x * (overlap + buffer),
                                        normal.y * (overlap + buffer));

                        if (!a.isStatic) {
                                a.x -= correction.x;
                                a.y -= correction.y;
                        }
                        if (!b.isStatic) {
                                b.x += correction.x;
                                b.y += correction.y;
                        }

                        // Дополнительная коррекция скорости
                        const dot = (b.speedx - a.speedx) * normal.x + (b.speedy - a.speedy) * normal.y;
                        if (dot < 0) {
                                const restitution = Math.min(a.restitution, b.restitution);
                                const j =  - (1 + restitution) * dot;

                                if (!a.isStatic) {
                                        a.speedx -= j * normal.x / a.mass;
                                        a.speedy -= j * normal.y / a.mass;
                                }
                                if (!b.isStatic) {
                                        b.speedx += j * normal.x / b.mass;
                                        b.speedy += j * normal.y / b.mass;
                                }
                        }

                        return;
                }
                const maxSpeed = 30.0; // Лимит скорости

                // Защита от некорректных данных
                if (Math.abs(overlap) < 0.1)
                        return;
                if (Math.abs(normal.x) + Math.abs(normal.y) < 0.001)
                        return;

                // Усиленная коррекция позиции с увеличенным буфером
                const buffer = 0.2;
                const correction = new Vector2(
                                normal.x * (overlap + buffer),
                                normal.y * (overlap + buffer));

                const totalMass = a.isStatic ? b.mass : b.isStatic ? a.mass : a.mass + b.mass;
                const aRatio = b.isStatic ? 1 : a.isStatic ? 0 : b.mass / totalMass;
                const bRatio = a.isStatic ? 1 : b.isStatic ? 0 : a.mass / totalMass;

                if (!a.isStatic) {
                        a.x -= correction.x * aRatio;
                        a.y -= correction.y * aRatio;
                        if (a.updateCollisionShape)
                                a.updateCollisionShape();
                }
                if (!b.isStatic) {
                        b.x += correction.x * bRatio;
                        b.y += correction.y * bRatio;
                        if (b.updateCollisionShape)
                                b.updateCollisionShape();
                }

                // Импульс
                const relativeVelocity = new Vector2(b.speedx - a.speedx, b.speedy - a.speedy);
                const velocityAlongNormal = Vector2.dot(relativeVelocity, normal);
                if (velocityAlongNormal > 0)
                        return;

                const restitution = Math.min(a.restitution, b.restitution);
                let j =  - (1 + restitution) * velocityAlongNormal;
                j /= (a.isStatic ? 0 : 1 / Math.max(a.mass, 0.1)) + (b.isStatic ? 0 : 1 / Math.max(b.mass, 0.1));

                const impulse = new Vector2(normal.x * j, normal.y * j);

                // Функция применения импульса с ограничением скорости
                const clampSpeed = (obj) => {
                        const speed = Math.sqrt(obj.speedx * obj.speedx + obj.speedy * obj.speedy);
                        if (speed > maxSpeed) {
                                const ratio = maxSpeed / speed;
                                obj.speedx *= ratio;
                                obj.speedy *= ratio;
                        }

                        // Гасим микроскорости
                        if (Math.abs(obj.speedx) < 0.01)
                                obj.speedx = 0;
                        if (Math.abs(obj.speedy) < 0.01)
                                obj.speedy = 0;
                };

                if (!a.isStatic) {
                        a.speedx += -impulse.x / Math.max(a.mass, 0.1);
                        a.speedy += -impulse.y / Math.max(a.mass, 0.1);
                        clampSpeed(a);
                }

                if (!b.isStatic) {
                        b.speedx += impulse.x / Math.max(b.mass, 0.1);
                        b.speedy += impulse.y / Math.max(b.mass, 0.1);
                        clampSpeed(b);
                }

                // Обновляем состояние "на земле"
                if (normal.y > 0.5) {
                        a.isOnGround = true;
                }
                if (normal.y < -0.5) {
                        b.isOnGround = true;
                }
        };
};
// Функция для проверки нажатия на сенсорные кнопки
function checkTouchButtons(x, y, isPressed) {
        // Проверяем, включена ли обработка сенсорного ввода
        if (!Game.helper.enableTouchInput || !Game.helper.enableDrawing)
                return false;
        // Проверяем все сенсорные кнопки
        for (const btnId in inputState.devices[0].touchButtons) {
                const btn = inputState.devices[0].touchButtons[btnId];
                if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
                        // Обновляем состояние кнопки
                        btn.isPressed = isPressed;
                        inputState.devices[0].keys[btn.keyCode] = isPressed;
                        if (isPressed) {
                                inputState.devices[0].pressKeys[btn.keyCode] = true
                        }
                        return true; // Прерываем обработку, так как нажатие было на кнопку
                }
        }
        return false
}
// Функция для добавления сенсорной кнопки
Game.addTouchButton = function (id, x, y, width, height, keyCode) {
        inputState.devices[0].touchButtons[id] = {
                x: x,
                y: y,
                width: width,
                height: height,
                keyCode: keyCode,
                isPressed: false
        }
};
/**
 * Получает номер тайла по координатам в тайловой сетке
 * @param {number} x Координата X в тайлах (не в пикселях)
 * @param {number} y Координата Y в тайлах (не в пикселях)
 * @returns {number} Номер тайла или 0, если координаты вне сетки или тайл отсутствует
 */
Game.getTileInXY = function (x, y) {
        // Проверяем, инициализирована ли тайловая система
        if (!Game.helper.tiles.grid || y < 0 || y >= Game.helper.tiles.rows || x < 0 || x >= Game.helper.tiles.cols) {
                return 0
        }
        return Game.helper.tiles.grid[y][x] || 0
};
/**
 * Изменяет тайл в указанных координатах тайловой сетки
 * @param {number} x Координата X в тайлах (не в пикселях)
 * @param {number} y Координата Y в тайлах (не в пикселях)
 * @param {number} tileId Номер нового тайла (0 для удаления тайла)
 * @param {boolean} isSolid Определяет, должен ли тайл быть твердым
 */
Game.changeTileInXY = function (x, y, tileId, isSolid) {
        // Проверяем, инициализирована ли тайловая система
        if (!Game.helper.tiles.grid || y < 0 || y >= Game.helper.tiles.rows || x < 0 || x >= Game.helper.tiles.cols) {
                return
        }
        // Устанавливаем новый тайл
        Game.helper.tiles.grid[y][x] = tileId;
        // Обновляем данные о тайле
        if (tileId > 0) {
                if (!Game.helper.tiles.tilesData[tileId]) {
                        Game.helper.tiles.tilesData[tileId] = {}
                }
                Game.helper.tiles.tilesData[tileId].solid = isSolid
        }
};
// Функция для удаления сенсорной кнопки
Game.removeTouchButton = function (id) {
        if (inputState.devices[0].touchButtons[id]) {
                // Сбрасываем состояние кнопки, если она была нажата
                if (inputState.devices[0].touchButtons[id].isPressed) {
                        inputState.devices[0].keys[inputState.devices[0].touchButtons[id].keyCode] = false
                }
                delete inputState.devices[0].touchButtons[id]
        }
};
// Функции для работы с изображениями
Draw.loadImage = function (n, str) {
        if (n < 1024) {
                let img = new Image;
                img.src = str;
                image_array[n] = -1; // Устанавливаем -1 для изображения в процессе загрузки
                img.onload = function () {
                        image_array[n] = img
                };
                return n
        }
        return -1; // Возвращаем -1 при ошибке
};
Draw.text = function (x, y, size, colour, str) {
        // Настраиваем стиль текста
        g_ctx.font = `${size}px PressStart2P, monospace`;
        g_ctx.fillStyle = colour;
        g_ctx.textAlign = "left";
        g_ctx.textBaseline = "top"; // выравнивание по верхнему краю
        g_ctx.imageSmoothingEnabled = false; // отключаем сглаживание (если поддерживается)
        // Смещение на 0.5 пикселя для резкости (убирает размытие)
        const pixelPerfectX = Math.floor(x - Game.screenx) + .5;
        const pixelPerfectY = Math.floor(y - Game.screeny) + .5;
        // Рисуем текст
        g_ctx.fillText(str, pixelPerfectX, pixelPerfectY)
};
// Вспомогательная функция: конвертация hex в RGB
function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b]
}
Draw.plot = function (x, y, colour) {
        g_ctx.fillStyle = colour;
        g_ctx.fillRect(x - Game.screenx, y - Game.screeny, 1, 1)
};
Draw.line = function (x1, y1, x2, y2, color) {
        g_ctx.beginPath();
        g_ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
        g_ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
        g_ctx.strokeStyle = color;
        g_ctx.stroke()
};
Draw.triangle = function (x1, y1, x2, y2, x3, y3, color) {
        g_ctx.beginPath();
        g_ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
        g_ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
        g_ctx.lineTo(x3 - Game.screenx, y3 - Game.screeny);
        g_ctx.closePath();
        g_ctx.strokeStyle = color;
        g_ctx.stroke()
};
Draw.filledTriangle = function (x1, y1, x2, y2, x3, y3, color) {
        g_ctx.beginPath();
        g_ctx.moveTo(x1 - Game.screenx, y1 - Game.screeny);
        g_ctx.lineTo(x2 - Game.screenx, y2 - Game.screeny);
        g_ctx.lineTo(x3 - Game.screenx, y3 - Game.screeny);
        g_ctx.closePath();
        g_ctx.fillStyle = color;
        g_ctx.fill()
};
Draw.rect = function (x, y, width, height, color) {
        g_ctx.strokeStyle = color;
        g_ctx.strokeRect(x - Game.screenx, y - Game.screeny, width, height)
};
Draw.filledRect = function (x, y, width, height, color) {
        g_ctx.fillStyle = color;
        g_ctx.fillRect(x - Game.screenx, y - Game.screeny, width, height)
};
Draw.sprite = function (sprite, x, y, size, colour) {
        g_ctx.fillStyle = colour;
        if (size && size < 1) {
                size = 1
        }
        for (let i = 0; i < sprite.length; i++) {
                for (let j = 0; j < sprite[i].length; j++) {
                        if (sprite[i][j] != 0) {
                                g_ctx.fillRect(x + j * size - Game.screenx, y + i * size - Game.screeny, size, size)
                        }
                }
        }
};
Draw.image = function (n, x, y, width, height, alpha, srcX, srcY, srcWidth, srcHeight) {
    let img = image_array[n];
    if (img !== -1 && img !== 0) {
        // Сохраняем текущее состояние контекста
        g_ctx.save();
        
        // Устанавливаем прозрачность, если параметр alpha задан
        if (alpha !== undefined) {
            g_ctx.globalAlpha = alpha;
        }
        
        if (srcX !== undefined && srcY !== undefined && srcWidth !== undefined && srcHeight !== undefined) {
            // Рисуем часть изображения
            g_ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
        } else {
            // Рисуем все изображение
            g_ctx.drawImage(img, x, y, width, height);
        }
        
        // Восстанавливаем состояние контекста
        g_ctx.restore();
    }
};
Draw.clear_screen = function (color) {
        g_ctx.fillStyle = color;
        g_ctx.fillRect(0, 0, 1280, 720)
};
// Объект для работы с касаниями
Game.getTouch = {
        istouch: 0,
        x: 0,
        y: 0
};
// Функции управления игрой
Game.setGravity = function (v) {
        gravitation = v;
        if (Game.physics && Game.physics.space) cpSpaceSetGravity(Game.physics.space, cpv(0, v * 60));
};
Game.collision = function g_collision(x1, y1, width1, height1, x2, y2, width2, height2) {
        return Math.max(x1, x2) <= Math.min(x1 + width1, x2 + width2) && Math.max(y1, y2) <= Math.min(y1 + height1, y2 + height2)
};
Game.getKey = function (key, id) {
        // Проверяем корректность id устройства
        if (id !== 0 && id !== 1)
                return false;

        // Проверяем существование устройства и его keys
        if (!inputState.devices[id] || !inputState.devices[id].keys)
                return false;

        // Возвращаем состояние или false если ключа нет (но его всегда должно быть благодаря инициализации)
        return !!inputState.devices[id].keys[key];
};
Game.getKeyPress = function (key, id) {
        if (id !== 0 && id !== 1)
                return false;
        if (!inputState.devices[id] || !inputState.devices[id].pressKeys)
                return false;

        const pressed = !!inputState.devices[id].pressKeys[key];
        if (pressed) {
                inputState.devices[id].pressKeys[key] = false;
        }
        return pressed;
};
Game.getAxes = function (n, id) {
        if (inputState.hasGamepad) {
                // С геймпадом
                if (id === 0 && inputState.devices[0].axes && n >= 0 && n < inputState.devices[0].axes.length) {
                        return inputState.devices[0].axes[n] || 0; // Геймпад
                }
                if (id === 1 && inputState.devices[1].axes && n >= 0 && n < inputState.devices[1].axes.length) {
                        return inputState.devices[1].axes[n] || 0; // Клавиатура
                }
        } else {
                // Без геймпада
                if (id === 0 && inputState.devices[0].axes && n >= 0 && n < inputState.devices[0].axes.length) {
                        return inputState.devices[0].axes[n] || 0; // Клавиатура
                }
        }
        return 0;
};
Game.setScreenX = function (x) {
        Game.screenx = x
};
Game.setScreenY = function (y) {
        Game.screeny = y
};
Game.getScreenX = function () {
        return Game.screenx
};
Game.getScreenY = function () {
        return Game.screeny
};
Game.setTimeout = function (callback, delay) {
        if (delay < 0)
                delay = 0;
        var timerId = Game.duc_helper_global_game_timers.nextId++;
        var triggerTime = Date.now() + delay;
        Game.duc_helper_global_game_timers.timers[timerId] = {
                callback: callback,
                time: triggerTime,
                isInterval: false
        };
        return timerId
};
// Улучшенный setInterval
Game.setInterval = function (callback, interval) {
        if (interval < 0)
                interval = 0;
        var timerId = Game.duc_helper_global_game_timers.nextId++;
        var nextTime = Date.now() + interval;
        var wrappedCallback = function () {
                callback();
                if (interval > 0) { // Не планируем следующий вызов для interval=0
                        Game.duc_helper_global_game_timers.timers[timerId].time = Date.now() + interval
                }
        };
        Game.duc_helper_global_game_timers.timers[timerId] = {
                callback: wrappedCallback,
                time: nextTime,
                isInterval: true,
                interval: interval
        };
        return timerId
};
// Функции очистки
Game.clearTimeout = Game.clearInterval = function (timerId) {
        if (Game.duc_helper_global_game_timers[timerId]) {
                delete Game.duc_helper_global_game_timers.timers[timerId]
        }
};
Game.clearInterval = function (timerId) {
        if (Game.duc_helper_global_game_timers[timerId]) {
                delete Game.duc_helper_global_game_timers.timers[timerId]
        }
};
Game.Background = {
        sprite: -1,
        mode: 0, // 0 - stretch, 1 - tile
        x: 0,
        y: 0
};
// Функции для работы с фоном
Game.setBackground = function (sprite, mode) {
        Game.Background.sprite = sprite;
        Game.Background.mode = mode || 0
};
Game.setBackgroundXY = function (x, y) {
        Game.Background.x = x;
        Game.Background.y = y
};
// Функция отрисовки фона
Game.drawBackground = function () {
        if (Game.Background.sprite < 0 || Game.Background.sprite >= 1024 || !image_array[Game.Background.sprite])
                return;
        const bgImage = image_array[Game.Background.sprite];
        if (Game.Background.mode === 0) {
                // Режим растяжения
                g_ctx.drawImage(bgImage, 0, 0, 1280, 720)
        } else {
                // Режим плитки
                const startX = Game.Background.x % bgImage.width;
                const startY = Game.Background.y % bgImage.height;
                for (let y = -bgImage.height; y < 720; y += bgImage.height) {
                        for (let x = -bgImage.width; x < 1280; x += bgImage.width) {
                                g_ctx.drawImage(bgImage, x - startX, y - startY, bgImage.width, bgImage.height)
                        }
                }
        }
}
// Функции работы с игровыми объектами;
Game.addObject = function (name, x, y, width, height, sprite) {
        var obj = {
                name: name,
                x: x,
                y: y,
                prev_x: x,
                prev_y: y,
                width: width,
                height: height,
                // Свойства анимации
                _sprite: null, // внутреннее хранилище для спрайта
                currentFrame: 0,
                frameTime: 0,
                animationSpeed: 10, // кадров в секунду
                animationLoop: true,
                isAnimationPlaying: false,
                isAnimationEnd: false,
                // Остальные свойства...
                speedx: 0,
                speedy: 0,
                onCollision: function () {},
                onStep: function () {},
                boundingWidth: width,
                boundingHeight: height,
                visible: 1,
                solid: 1,
                angle: 0,
                flip: 0,
                mass: 1,
                restitution: .5,
                friction: 0.7,
                isStatic: 0,
                isOnGround: 0,
                lock_rotation: 1,  // 1 = rotation locked (default), 0 = rotation enabled
                rotationSpeed: 0,  // angular velocity in degrees/frame (0 = no spin)
                zIndex: 0,
                collisionShape: 0,
                collidingTiles: [],
                local: {},
                persistentContacts: {
                        top: {
                                count: 0,
                                tile: null
                        },
                        right: {
                                count: 0,
                                tile: null
                        },
                        bottom: {
                                count: 0,
                                tile: null
                        },
                        left: {
                                count: 0,
                                tile: null
                        }
                },
                minPersistentFrames: 3, // Минимальное количество кадров для "устойчивого" контакта
                isStuck: false,
                _cpBody: null, _cpShape: null,
                _blockedRight: false, _blockedLeft: false,
                _blockedDown: false, _blockedUp: false,
                _collisions: [],
                // _bodyFresh: set to true in addObject. syncToBody checks this
                // flag and ALWAYS syncs the body position on the first frame
                // after creation, ignoring the prev_x/prev_y check. This fixes
                // the bug where user code does:
                //   var o = Game.addObject(name, 0, 0, w, h, s);
                //   o.x = realX; o.y = realY;
                // The body was created at (0,0) but o.x/o.y were changed
                // AFTER addObject. Without this flag, syncToBody sees
                // o.x === o.prev_x and skips the position update.
                // The body stays at (0,0), then syncFromBody overwrites
                // o.x/o.y from the body → object teleports to (0,0).
                _bodyFresh: true
        };
        // Добавляем методы анимации
        obj.playAnimation = function () {
                if (Array.isArray(this._sprite)) {
                        this.isAnimationPlaying = true;
                        this.currentFrame = 0;
                        this.frameTime = 0;
                        this.isAnimationEnd = false;
                }
        };
        obj.stopAnimation = function () {
                this.isAnimationPlaying = false;
                this.isAnimationEnd = true;
        };
        obj.setAnimationFrame = function (frameIndex) {
                if (Array.isArray(this._sprite)) {
                        this.currentFrame = Math.max(0, Math.min(frameIndex, this._sprite.length - 1))
                }
        };
        // Сеттер для свойства sprite
        Object.defineProperty(obj, "sprite", {
                get: function () {
                        return this._sprite
                },
                set: function (value) {
                        this._sprite = value;
                        if (Array.isArray(value)) {
                                this.playAnimation(); // Автоматический запуск анимации
                        } else {
                                this.stopAnimation(); // Остановка анимации для статичного спрайта
                        }
                },
                enumerable: true,
                configurable: true
        });
        // Устанавливаем начальный спрайт (вызовет сеттер)
        obj.sprite = sprite;
        Game.allObject.push(obj);
        Game.physics.createBody(obj, Game.allObject.length - 1);
        return obj
};
Game.removeObject = function (obj) {
        function findObjectIndex(arr, obj) {
                for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === obj) {
                                return i
                        }
                }
                return -1
        }
        // Mark the object as removed so the collision-callback loop (which
        // snapshots pairs BEFORE calling onCollision) can skip pairs where
        // either object was already destroyed this frame.
        obj._removed = true;
        Game.physics.destroyBody(obj);
        const index = findObjectIndex(Game.allObject, obj);
        if (index !== -1) {
                Game.allObject.splice(index, 1)
        }
};
Game.mirrorObject = function (o) {
        var no = JSON.parse(JSON.stringify(o));
        no.onCollision = o.onCollision;
        no.onStep = o.onStep;
        Game.allObject.push(no);
        return no
};
Game.setVelocityTowards = function (obj1, x, y, speed) {
        const dx = x - obj1.x;
        const dy = y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
                obj1.speedx = dx / distance * speed;
                obj1.speedy = dy / distance * speed
        } else {
                obj1.speedx = 0;
                obj1.speedy = 0
        }
};
Game.exitScreen = function (o) {
        return o.x + o.width - Game.screenx < 0 || o.y + o.height - Game.screeny < 0 || o.x - Game.screenx > 1280 || o.y - Game.screeny > 720
};
Game.distance = function (x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy)
};
// Функция воспроизведения музыки
var globalAudioCtx = new(window.AudioContext || window.webkitAudioContext);
// Очередь и активные мелодии
const MAX_CONCURRENT_MELODIES = 8;
let activeMelodies = 0;
const melodyQueue = [];
Game.play_music = function (melodyString, bpm = 120) {
        if (!melodyString || typeof melodyString !== "string") {
                console.error("Invalid melodyString:", melodyString);
                return
        }
        if (globalAudioCtx.state === "suspended") {
                globalAudioCtx.resume().then(() => {
                        Game._continuePlayMusic(melodyString, bpm)
                })
        } else {
                Game._continuePlayMusic(melodyString, bpm)
        }
};
Game._continuePlayMusic = function (melodyString, bpm) {
        if (activeMelodies >= MAX_CONCURRENT_MELODIES) {
                melodyQueue.push({
                        melodyString: melodyString,
                        bpm: bpm
                });
                return
        }
        activeMelodies++;
        Game._playMelody(melodyString, bpm)
};
Game.play_sound = function (id) {
        const audio = new Audio(Game.sound_array[id].data);
        audio.play()
};
// Внутренняя функция для реального воспроизведения
Game._playMelody = function (melodyString, bpm) {
        // Проверяем, не закрыт ли контекст
        if (globalAudioCtx.state === "closed") {
                globalAudioCtx = new(window.AudioContext || window.webkitAudioContext)
        }
        // Проверяем, не приостановлен ли контекст
        if (globalAudioCtx.state === "suspended") {
                globalAudioCtx.resume().then(() => {
                        _continueMelodyPlayback()
                })
        } else {
                _continueMelodyPlayback()
        }
        if (typeof melodyString !== "string" || !/^(\d+,)*\d+$/.test(melodyString)) {
                console.error("Invalid melody string format");
                activeMelodies--;
                Game._checkQueue(); // Проверяем очередь, если была ошибка
                return
        }
        function _continueMelodyPlayback() {
                const steps = melodyString.split(",").map(Number);
                const totalSteps = steps.length;
                if (totalSteps === 0) {
                        activeMelodies--;
                        Game._checkQueue();
                        return
                }
                const instruments = [{
                                name: "C4",
                                freq: 261.63,
                                type: "square"
                        }, {
                                name: "D4",
                                freq: 293.66,
                                type: "square"
                        }, {
                                name: "E4",
                                freq: 329.63,
                                type: "square"
                        }, {
                                name: "F4",
                                freq: 349.23,
                                type: "square"
                        }, {
                                name: "G4",
                                freq: 392,
                                type: "square"
                        }, {
                                name: "A4",
                                freq: 440,
                                type: "square"
                        }, {
                                name: "B4",
                                freq: 493.88,
                                type: "square"
                        }, {
                                name: "C5",
                                freq: 523.25,
                                type: "square"
                        }, {
                                name: "Kick",
                                type: "drum",
                                drumType: "kick"
                        }, {
                                name: "Snare",
                                type: "drum",
                                drumType: "snare"
                        }, {
                                name: "HiHat",
                                type: "drum",
                                drumType: "hihat"
                        }, {
                                name: "Clap",
                                type: "drum",
                                drumType: "clap"
                        }, {
                                name: "Tom",
                                type: "drum",
                                drumType: "tom"
                        }
                ];
                const stepDuration = 60 / bpm / 2;
                let currentTime = globalAudioCtx.currentTime + .1;
                // Воспроизведение нот и ударных (как в исходном коде)
                for (let step = 0; step < totalSteps; step++) {
                        const stepValue = steps[step];
                        for (let i = 0; i < instruments.length; i++) {
                                if (stepValue & 1 << i) {
                                        const instrument = instruments[i];
                                        if (instrument.type === "drum") {
                                                playDrum(instrument.drumType, currentTime)
                                        } else {
                                                playNote(instrument.freq, currentTime, instrument.type)
                                        }
                                }
                        }
                        currentTime += stepDuration
                }
                // После завершения всей мелодии освобождаем слот
                const totalDuration = stepDuration * totalSteps;
                setTimeout(() => {
                        activeMelodies--;
                        Game._checkQueue(); // Проверяем очередь на наличие ожидающих мелодий
                }, totalDuration * 1e3 + 100);
                // Функции playNote и playDrum (с очисткой!)
                function playNote(freq, startTime, waveType) {
                        const oscillator = globalAudioCtx.createOscillator();
                        const gainNode = globalAudioCtx.createGain();
                        oscillator.type = waveType || "square";
                        oscillator.frequency.value = freq;
                        gainNode.gain.setValueAtTime(.1, startTime);
                        gainNode.gain.exponentialRampToValueAtTime(.001, startTime + stepDuration * .9);
                        oscillator.connect(gainNode);
                        gainNode.connect(globalAudioCtx.destination);
                        oscillator.start(startTime);
                        oscillator.stop(startTime + stepDuration);
                        // Очистка после завершения
                        oscillator.onended = () => {
                                oscillator.disconnect();
                                gainNode.disconnect()
                        }
                }
                function playDrum(type, startTime) {
                        const bufferSource = globalAudioCtx.createBufferSource();
                        const gainNode = globalAudioCtx.createGain();
                        const duration = .2;
                        const buffer = globalAudioCtx.createBuffer(1, globalAudioCtx.sampleRate * duration, globalAudioCtx.sampleRate);
                        const data = buffer.getChannelData(0);
                        switch (type) {
                        case "kick":
                                for (let i = 0; i < data.length; i++) {
                                        const t = i / globalAudioCtx.sampleRate;
                                        data[i] = Math.sin(t * 50 * Math.PI * 2) * Math.exp(-t * 10)
                                };
                                break;
                        case "snare":
                                for (let i = 0; i < data.length; i++) {
                                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * .1))
                                };
                                break;
                        case "hihat":
                                for (let i = 0; i < data.length; i++) {
                                        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (globalAudioCtx.sampleRate * .02))
                                };
                                break;
                        case "clap":
                                for (let i = 0; i < data.length; i++) {
                                        const t = i / globalAudioCtx.sampleRate;
                                        if (t < .02 || t > .03 && t < .05 || t > .06 && t < .08) {
                                                data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20)
                                        }
                                };
                                break;
                        case "tom":
                                for (let i = 0; i < data.length; i++) {
                                        const t = i / globalAudioCtx.sampleRate;
                                        data[i] = Math.sin(t * 100 * Math.PI * 2) * Math.exp(-t * 5)
                                };
                                break
                        }
                        gainNode.gain.setValueAtTime(.5, startTime);
                        gainNode.gain.exponentialRampToValueAtTime(.001, startTime + duration);
                        bufferSource.buffer = buffer;
                        bufferSource.connect(gainNode);
                        gainNode.connect(globalAudioCtx.destination);
                        bufferSource.start(startTime);
                        bufferSource.stop(startTime + duration);
                        // Очистка после завершения
                        bufferSource.onended = () => {
                                bufferSource.disconnect();
                                gainNode.disconnect()
                        }
                }
        }
};
// Проверка очереди и запуск следующей мелодии
Game._checkQueue = function () {
        if (melodyQueue.length > 0 && activeMelodies < MAX_CONCURRENT_MELODIES) {
                const nextMelody = melodyQueue.shift();
                Game._playMelody(nextMelody.melodyString, nextMelody.bpm)
        }
};
Game.getMemory = function () {
    // Вспомогательная функция для оценки размера объекта
    const estimate = (obj) => {
        if (obj === null || obj === undefined) return 0;
        try {
            return JSON.stringify(obj).length * 2; // грубая, но практичная оценка в байтах
        } catch (e) {
            return 0;
        }
    };

    let total = 0;

    // 1. Игровые объекты
    total += estimate(Game.allObject);

    // 2. Массив изображений
    total += estimate(image_array);

    // 3. Тайловая система
    if (Game.helper?.tiles) {
        total += estimate(Game.helper.tiles.grid);
        total += estimate(Game.helper.tiles.solidMap);
    };

    // 4. Таймеры
    total += estimate(Game.duc_helper_global_game_timers.timers);
    total += estimate(Game.duc_helper_global_game_timers.pending);
    total += estimate(game_helper_timers);

    // 5. Частицы
    if (Game.Particles?.list) {
        total += estimate(Game.Particles.list);
    };

    // 6. Состояние ввода
    total += estimate(inputState);

    // 7. Виртуальный геймпад
    if (Game.virtualGamepad) {
        total += estimate(Game.virtualGamepad);
    };

    // 8. Глобальные переменные
    if (Game.helper?.globalArray) {
        total += estimate(Game.helper.globalArray);
    };

    // 9. Код из Blockly
    const blocklyCode = Blockly.JavaScript.workspaceToCode(workspace);
    total += (blocklyCode?.length || 0) * 2;

    // 10. Аудио: очередь и активные мелодии
    total += estimate(melodyQueue);
    total += estimate(activeMelodies);

    // 11. Контекст аудио (условно, так как не сериализуется)
    if (globalAudioCtx) {
        total += 1024; // приблизительно: AudioContext, Oscillators и буферы
    };

    // 12. Состояние отладки (раскрытые объекты и переменные)
    if (objectsDebugPanel?.getExpandedStates) {
        total += estimate(objectsDebugPanel.getExpandedStates());
    };
    if (objectsDebugPanel?.getVarExpandedState) {
        total += 16; // минимальный объём состояния
    };

    return Math.round(total); // возвращаем целое число — общий объём памяти в байтах
};
Game.reset = function() {
    // Проверяем, открыто ли окно Game.alert
    if (Game.alert.isOpen) {
        // Если открыто, устанавливаем обработчик на закрытие
        Game.alert.onClose = function() {
            // Удаляем обработчик
            delete Game.alert.onClose;
            // Вызываем сброс после закрытия
            Game._resetInternal();
                        Game.init();
        };
        return;
    }
    
    // Если alert не открыт, сбрасываем сразу
    Game._resetInternal();
        Game.init();
};

// Внутренняя функция сброса
Game._resetInternal = function() {
    // Очистка таймеров
    game_helper_timers.length = 0;
    Game.Background.sprite = -1;
    // Очистка всех игровых объектов
    Game.allObject.length = 0;
    Game._isPaused = false;
    Game.pauseTime = 0;
    Game.pausedTimers = {};
    Game.Particles.clear();
    // FIX: Reset the Chipmunk physics space. Without this, old bodies, shapes,
    // and static tile shapes from the previous level remain in this.space,
    // causing ghost collisions with invisible walls/platforms. We null out
    // the space and clear the initialized flag so the next createBody call
    // will re-init a fresh space via Game.physics.init().
    if (Game.physics) {
        Game.physics.space = null;
        Game.physics.staticBody = null;
        Game.physics.initialized = false;
        Game.physics.distanceJoints.length = 0;
        Game.physics.nativeConstraints.length = 0;
    }
    
    // Сброс изображений (но сохраняем загруженные)
    for (let i = 0; i < image_array.length; i++) {
        if (image_array[i] === -1) { // Если изображение в процессе загрузки
            image_array[i] = -1; // Сбрасываем
        }
        // Загруженные изображения (объекты Image) не сбрасываем
    }
    
    // Сброс состояния ввода
    Game.resetInputDevices();
    Game.duc_helper_global_game_timers = {
        nextId: 1,
        timers: {},
        pending: [],
        length: 0,
        lengthAvg: 0,
        timerHistory: [],
        lastSampleTime: 0
    };
    
    // Сброс состояния касаний
    Game.virtualGamepad.touches = {};
    
    // Сброс кнопок геймпада
    Game.virtualGamepad.buttons.forEach(btn => {
        btn.active = false
    });
    Game.virtualGamepad.dpad.buttons.forEach(btn => {
        btn.active = false
    });
    
    // Сброс тайловой системы
    if (Game.helper.tiles) {
        Game.helper.tiles.grid = [];
        Game.helper.tiles.cols = 0;
        Game.helper.tiles.rows = 0;
        Game.helper.tiles.tilesData = {}
    }
    
    // Сброс звуков
    Game.sound_array.length = 0;
    
    // Сброс позиции камеры
    Game.screenx = 0;
    Game.screeny = 0;
    
    // Сброс гравитации
    gravitation = 0;
    
    // Сброс состояния касаний
    Game.getTouch.istouch = 0;
    Game.getTouch.x = 0;
    Game.getTouch.y = 0;
    
    // Остановка всей музыки
    if (globalAudioCtx.state !== "closed") {
        globalAudioCtx.close().catch(e => console.error("Error closing audio context:", e))
    }
    
    // Очистка очереди мелодий
    melodyQueue.length = 0;
    activeMelodies = 0;
    
    // Сброс отладочной панели
    if (objectsDebugPanel) {
        objectsDebugPanel.update()
    }
    
    // Сброс флагов отладки
    draw_bounding_box = false;
    debugShowExpandedObjectsBorder = true;
        Game.alert.close();
        Game.alert.isOpen = false;
        Game.loop = {};
};
// Виртуальный геймпад (стиль Nintendo Switch)
Game.virtualGamepad = {
        buttons: [{
                        id: "KeyB",
                        x: 1150,
                        y: 600,
                        r: 30,
                        color: "#e61919",
                        text: "B",
                        active: false
                }, // Красный (правая верхняя)
                {
                        id: "KeyA",
                        x: 1200,
                        y: 550,
                        r: 30,
                        color: "#2dcd2d",
                        text: "A",
                        active: false
                }, // Зеленый (правая нижняя)
                {
                        id: "KeyY",
                        x: 1100,
                        y: 550,
                        r: 30,
                        color: "#f5f518",
                        text: "Y",
                        active: false
                }, // Желтый (левая нижняя)
                {
                        id: "KeyX",
                        x: 1150,
                        y: 500,
                        r: 30,
                        color: "#3a3aff",
                        text: "X",
                        active: false
                }
        ],
        dpad: {
                x: 100,
                y: 550,
                size: 100,
                buttons: [{
                                id: "ArrowUp",
                                x: 0,
                                y: -35,
                                w: 30,
                                h: 35,
                                active: false
                        }, {
                                id: "ArrowDown",
                                x: 0,
                                y: 35,
                                w: 30,
                                h: 35,
                                active: false
                        }, {
                                id: "ArrowLeft",
                                x: -35,
                                y: 0,
                                w: 35,
                                h: 30,
                                active: false
                        }, {
                                id: "ArrowRight",
                                x: 35,
                                y: 0,
                                w: 35,
                                h: 30,
                                active: false
                        }
                ]
        },
        joystickLeft: {
                x: 100, // Adjust position as needed
                y: 300,
                r: 50,
                active: false,
                touchId: null,
                handle: {
                        x: 0,
                        y: 0,
                        r: 20
                }
        },
        joystickRight: {
                x: 1150, // Adjust position as needed
                y: 300,
                r: 50,
                active: false,
                touchId: null,
                handle: {
                        x: 0,
                        y: 0,
                        r: 20
                }
        },
        touches: {}
};
// Функция обновления состояния сенсорного ввода
Game.updateSensorKey = function () {
        if (!Game.helper.enableDrawing || !Game.helper.enableTouchInput)
                return;
        // Функция для обновления состояния кнопки с учетом ремаппинга
        function updateButtonState(button, active) {
                if (button.active !== active) {
                        button.active = active;

                        // Обновляем состояние оригинальной и ремаппированной клавиши
                        if (active && !inputState.devices[0].keys[button.id])
                                inputState.devices[0].pressKeys[button.id] = true;
                        inputState.devices[0].keys[button.id] = active;
                }
        }

        // Отрисовка виртуального геймпада
        function drawGamepad() {
                // Кнопки ABXY (раскладка Switch)
                Game.virtualGamepad.buttons.forEach(btn => {
                        // Внешний круг
                        g_ctx.beginPath();
                        g_ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
                        g_ctx.fillStyle = btn.active ? "#fff" : btn.color;
                        g_ctx.fill();
                        // Внутренний круг
                        g_ctx.beginPath();
                        g_ctx.arc(btn.x, btn.y, btn.r - 8, 0, Math.PI * 2);
                        g_ctx.fillStyle = btn.active ? btn.color : "#fff";
                        g_ctx.fill();
                        // Буква кнопки
                        g_ctx.fillStyle = btn.active ? "#fff" : btn.color;
                        g_ctx.font = "bold 20px Arial";
                        g_ctx.textAlign = "center";
                        g_ctx.textBaseline = "middle";
                        g_ctx.fillText(btn.text, btn.x, btn.y);
                });

                // D-Pad
                g_ctx.save();
                g_ctx.translate(Game.virtualGamepad.dpad.x, Game.virtualGamepad.dpad.y);
                // Центр D-Pad
                g_ctx.beginPath();
                g_ctx.arc(0, 0, 15, 0, Math.PI * 2);
                g_ctx.fillStyle = Game.virtualGamepad.dpad.buttons.some(b => b.active) ? "#fff" : "#777";
                g_ctx.fill();
                // Кнопки D-Pad
                Game.virtualGamepad.dpad.buttons.forEach(btn => {
                        g_ctx.fillStyle = btn.active ? "#fff" : "#777";
                        g_ctx.beginPath();
                        g_ctx.lineTo(btn.x - btn.w / 2, btn.y - btn.h / 2);
                        g_ctx.lineTo(btn.x + btn.w / 2, btn.y - btn.h / 2);
                        g_ctx.lineTo(btn.x + btn.w / 2, btn.y + btn.h / 2);
                        g_ctx.lineTo(btn.x - btn.w / 2, btn.y + btn.h / 2);
                        g_ctx.closePath();
                        g_ctx.fill();
                        // Стрелки
                        g_ctx.fillStyle = btn.active ? "#000" : "#fff";
                        g_ctx.font = "20px Arial";
                        g_ctx.textAlign = "center";
                        g_ctx.textBaseline = "middle";
                        let arrow = "";
                        if (btn.id === "ArrowUp")
                                arrow = "↑";
                        if (btn.id === "ArrowDown")
                                arrow = "↓";
                        if (btn.id === "ArrowLeft")
                                arrow = "←";
                        if (btn.id === "ArrowRight")
                                arrow = "→";
                        g_ctx.fillText(arrow, btn.x, btn.y);
                });
                g_ctx.restore();

                // Left joystick
                g_ctx.beginPath();
                g_ctx.arc(Game.virtualGamepad.joystickLeft.x, Game.virtualGamepad.joystickLeft.y, Game.virtualGamepad.joystickLeft.r, 0, Math.PI * 2);
                g_ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
                g_ctx.fill();
                g_ctx.strokeStyle = "#aaa";
                g_ctx.lineWidth = 2;
                g_ctx.stroke();
                // Left joystick handle
                g_ctx.beginPath();
                g_ctx.arc(
                        Game.virtualGamepad.joystickLeft.x + Game.virtualGamepad.joystickLeft.handle.x,
                        Game.virtualGamepad.joystickLeft.y + Game.virtualGamepad.joystickLeft.handle.y,
                        Game.virtualGamepad.joystickLeft.handle.r,
                        0, Math.PI * 2);
                g_ctx.fillStyle = Game.virtualGamepad.joystickLeft.active ? "#e60012" : "#e61919";
                g_ctx.fill();
                g_ctx.strokeStyle = "#c00";
                g_ctx.lineWidth = 2;
                g_ctx.stroke();

                // Right joystick
                g_ctx.beginPath();
                g_ctx.arc(Game.virtualGamepad.joystickRight.x, Game.virtualGamepad.joystickRight.y, Game.virtualGamepad.joystickRight.r, 0, Math.PI * 2);
                g_ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
                g_ctx.fill();
                g_ctx.strokeStyle = "#aaa";
                g_ctx.lineWidth = 2;
                g_ctx.stroke();
                // Right joystick handle
                g_ctx.beginPath();
                g_ctx.arc(
                        Game.virtualGamepad.joystickRight.x + Game.virtualGamepad.joystickRight.handle.x,
                        Game.virtualGamepad.joystickRight.y + Game.virtualGamepad.joystickRight.handle.y,
                        Game.virtualGamepad.joystickRight.handle.r,
                        0, Math.PI * 2);
                g_ctx.fillStyle = Game.virtualGamepad.joystickRight.active ? "#e60012" : "#e61919";
                g_ctx.fill();
                g_ctx.strokeStyle = "#c00";
                g_ctx.lineWidth = 2;
                g_ctx.stroke();
        }

        // Обновление состояния осей стиков с учетом ремаппинга
        function updateStickAxes(joystick, axisXIndex, axisYIndex, prefix) {
                const x = joystick.handle.x / joystick.r;
                const y = joystick.handle.y / joystick.r;

                inputState.devices[0].axes[axisXIndex] = x;
                inputState.devices[0].axes[axisYIndex] = y;

                // Обновляем состояния клавиш для стиков с учетом ремаппинга
                const stickKeys = {
                        Left: `Key${prefix}StickLeft`,
                        Right: `Key${prefix}StickRight`,
                        Up: `Key${prefix}StickUp`,
                        Down: `Key${prefix}StickDown`
                };

                // Очищаем предыдущие состояния
                for (const key in stickKeys) {
                        const originalKey = stickKeys[key];

                        inputState.devices[0].keys[originalKey] = false;
                }

                // Обновляем текущие состояния
                if (x < -0.5) {
                        const originalKey = stickKeys.Left;
                        inputState.devices[0].keys[originalKey] = true;
                } else if (x > 0.5) {
                        const originalKey = stickKeys.Right;
                        inputState.devices[0].keys[originalKey] = true;
                }

                if (y < -0.5) {
                        const originalKey = stickKeys.Up;
                        inputState.devices[0].keys[originalKey] = true;
                } else if (y > 0.5) {
                        const originalKey = stickKeys.Down;
                        inputState.devices[0].keys[originalKey] = true;
                }
        }

        // Обновляем состояния осей для джойстиков
        if (Game.virtualGamepad.joystickLeft.active) {
                updateStickAxes(Game.virtualGamepad.joystickLeft, 0, 1, "L");
        }

        if (Game.virtualGamepad.joystickRight.active) {
                updateStickAxes(Game.virtualGamepad.joystickRight, 2, 3, "R");
        }

        // Отрисовка геймпада
        drawGamepad();
};
// Draw ALL Chipmunk physics shapes as white outlines — shows exactly what
// the physics engine sees, regardless of obj.x/y/width/height.
// This is useful for diagnosing shape/position mismatches (e.g. shape not
// recreated after width change, body position not synced, etc.)
Game.drawPhysicsShapes = function () {
        if (!Game.physics || !Game.physics.space) return;
        g_ctx.save();
        g_ctx.strokeStyle = "#fff";
        g_ctx.lineWidth = 1;
        g_ctx.fillStyle = "rgba(255,255,255,0.05)";
        var s = Game.physics.space.shapeList;
        while (s) {
                var ud = s.userData;
                var label = (ud && ud !== -1) ? ud.name : 'TILE';
                // Draw the shape's BB (bounding box) as a white rectangle.
                var bb = s.bb;
                if (bb) {
                        var x = bb.l - Game.screenx;
                        var y = bb.b - Game.screeny;
                        var w = bb.r - bb.l;
                        var h = bb.t - bb.b;
                        g_ctx.strokeRect(x, y, w, h);
                        // Light fill to show overlap areas.
                        g_ctx.fillRect(x, y, w, h);
                        // Label.
                        g_ctx.fillStyle = "#fff";
                        g_ctx.font = "10px monospace";
                        g_ctx.textAlign = "left";
                        g_ctx.textBaseline = "top";
                        g_ctx.fillText(label, x + 2, y + 2);
                        g_ctx.fillStyle = "rgba(255,255,255,0.05)";
                }
                s = s.spaceNext;
        }
        // Draw constraints (joints) as green lines between ANCHOR points.
        var c = Game.physics.space.constraintList;
        if (c) {
                g_ctx.strokeStyle = "#0f0";
                g_ctx.fillStyle = "#0f0";
                g_ctx.lineWidth = 2;
                while (c) {
                        // Draw between actual anchor points (not body centers).
                        // anchorA/anchorB are in local coords; convert to world.
                        var pa, pb;
                        if (c.anchorA && c.anchorB) {
                                // Pivot/Slide joint: use anchor points
                                pa = cpBodyLocalToWorld(c.a, c.anchorA);
                                pb = cpBodyLocalToWorld(c.b, c.anchorB);
                        } else {
                                // Other constraints: fall back to body centers
                                pa = c.a.p;
                                pb = c.b.p;
                        }
                        var ax2 = pa.x - Game.screenx, ay2 = pa.y - Game.screeny;
                        var bx2 = pb.x - Game.screenx, by2 = pb.y - Game.screeny;
                        // Line between anchor points
                        g_ctx.beginPath();
                        g_ctx.moveTo(ax2, ay2);
                        g_ctx.lineTo(bx2, by2);
                        g_ctx.stroke();
                        // Dots at each anchor point
                        g_ctx.beginPath();
                        g_ctx.arc(ax2, ay2, 3, 0, Math.PI * 2);
                        g_ctx.fill();
                        g_ctx.beginPath();
                        g_ctx.arc(bx2, by2, 3, 0, Math.PI * 2);
                        g_ctx.fill();
                        c = c.spaceNext;
                }
        }
        // Draw JS-space distance joints (pivot/slide/gear/rigid) as green
        // lines between master and slave centers.
        var dj = Game.physics.distanceJoints;
        if (dj && dj.length) {
                g_ctx.strokeStyle = "#0f0";
                g_ctx.fillStyle = "#0f0";
                g_ctx.lineWidth = 2;
                for (var di = 0; di < dj.length; di++) {
                        var jm = dj[di].master, js = dj[di].slave;
                        if (!jm || !js) continue;
                        var dmax = jm.x + jm.width * 0.5 - Game.screenx;
                        var dmay = jm.y + jm.height * 0.5 - Game.screeny;
                        var dsx = js.x + js.width * 0.5 - Game.screenx;
                        var dsy = js.y + js.height * 0.5 - Game.screeny;
                        g_ctx.beginPath();
                        g_ctx.moveTo(dmax, dmay);
                        g_ctx.lineTo(dsx, dsy);
                        g_ctx.stroke();
                        // Dots at master (filled) and slave (hollow).
                        g_ctx.beginPath();
                        g_ctx.arc(dmax, dmay, 4, 0, Math.PI * 2);
                        g_ctx.fill();
                        g_ctx.beginPath();
                        g_ctx.arc(dsx, dsy, 4, 0, Math.PI * 2);
                        g_ctx.stroke();
                        // Joint type label at midpoint.
                        var dmx = (dmax + dsx) / 2, dmy = (dmay + dsy) / 2;
                        g_ctx.font = "9px monospace";
                        g_ctx.textAlign = "center";
                        g_ctx.textBaseline = "middle";
                        g_ctx.fillText(dj[di].type, dmx, dmy);
                }
        }
        g_ctx.restore();
};
Game.drawDebugCollisionShape = function (obj) {
        const shape = Game.getCollisionShape(obj);
        g_ctx.save();

        // Draw colliding tiles (red fill).
        if (obj._debugCollidingTiles && obj._debugCollidingTiles.length > 0) {
                var ts = Game.helper.tiles ? Game.helper.tiles.tileSize : 32;
                g_ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                for (var i = 0; i < obj._debugCollidingTiles.length; i++) {
                        var t = obj._debugCollidingTiles[i];
                        g_ctx.fillRect(
                                t.col * ts - Game.screenx,
                                t.row * ts - Game.screeny,
                                ts, ts);
                }
                // Red outline for colliding tiles.
                g_ctx.strokeStyle = "#f00";
                g_ctx.lineWidth = 2;
                for (var i = 0; i < obj._debugCollidingTiles.length; i++) {
                        var t = obj._debugCollidingTiles[i];
                        g_ctx.strokeRect(
                                t.col * ts - Game.screenx,
                                t.row * ts - Game.screeny,
                                ts, ts);
                }
        }

        // Draw thick red arrow between this object's center and each colliding
        // object's center. _collisions[] holds the IDs of objects that collided
        // this frame (set by the Chipmunk defaultHandler.beginFunc). We avoid
        // drawing the same line twice by only drawing when this object's index
        // is smaller than the other's.
        if (obj._collisions && obj._collisions.length > 0) {
                var myIdx = -1;
                for (var k = 0; k < Game.allObject.length; k++) {
                        if (Game.allObject[k] === obj) { myIdx = k; break; }
                }
                var myCx = obj.x + obj.width / 2 - Game.screenx;
                var myCy = obj.y + obj.height / 2 - Game.screeny;
                g_ctx.strokeStyle = "#f00";
                g_ctx.fillStyle = "#f00";
                g_ctx.lineWidth = 4;
                g_ctx.lineCap = "round";
                var headSize = 10;
                for (var i = 0; i < obj._collisions.length; i++) {
                        var other = obj._collisions[i];
                        if (!other) continue;
                        // Only draw the line once per pair: find the other
                        // object's index and skip if it's lower than mine.
                        var otherIdx = -1;
                        for (var k2 = 0; k2 < Game.allObject.length; k2++) {
                                if (Game.allObject[k2] === other) { otherIdx = k2; break; }
                        }
                        if (myIdx >= 0 && otherIdx >= 0 && otherIdx < myIdx) continue;
                        // FIX: Only draw the line if the two objects' bounding
                        // boxes actually overlap RIGHT NOW. beginFunc may have
                        // fired during the physics step when the shapes briefly
                        // touched, but by draw-time the physics push-out (or an
                        // onCollision teleport) may have separated them. Drawing
                        // a line between far-apart objects is misleading and
                        // makes the debug overlay look broken.
                        // Use a small tolerance (4px) to account for floating-
                        // point drift at the exact moment of separation.
                        if (obj.x + obj.width < other.x - 4 ||
                            obj.x > other.x + other.width + 4 ||
                            obj.y + obj.height < other.y - 4 ||
                            obj.y > other.y + other.height + 4) continue;
                        var oCx = other.x + other.width / 2 - Game.screenx;
                        var oCy = other.y + other.height / 2 - Game.screeny;
                        // Thick line from my center to other's center.
                        g_ctx.beginPath();
                        g_ctx.moveTo(myCx, myCy);
                        g_ctx.lineTo(oCx, oCy);
                        g_ctx.stroke();
                        // Arrowhead at the other end (pointing toward other).
                        var ang = Math.atan2(oCy - myCy, oCx - myCx);
                        g_ctx.beginPath();
                        g_ctx.moveTo(oCx, oCy);
                        g_ctx.lineTo(
                                oCx - headSize * Math.cos(ang - Math.PI / 6),
                                oCy - headSize * Math.sin(ang - Math.PI / 6));
                        g_ctx.lineTo(
                                oCx - headSize * Math.cos(ang + Math.PI / 6),
                                oCy - headSize * Math.sin(ang + Math.PI / 6));
                        g_ctx.closePath();
                        g_ctx.fill();
                        // Arrowhead at my end (pointing toward me) — bidirectional.
                        var ang2 = ang + Math.PI;
                        g_ctx.beginPath();
                        g_ctx.moveTo(myCx, myCy);
                        g_ctx.lineTo(
                                myCx - headSize * Math.cos(ang2 - Math.PI / 6),
                                myCy - headSize * Math.sin(ang2 - Math.PI / 6));
                        g_ctx.lineTo(
                                myCx - headSize * Math.cos(ang2 + Math.PI / 6),
                                myCy - headSize * Math.sin(ang2 + Math.PI / 6));
                        g_ctx.closePath();
                        g_ctx.fill();
                }
        }

        // Draw object collision shape outline.
        // Color: RED if the object is colliding with anything this frame,
        // CYAN otherwise. This makes collisions visible even when arrows
        // are hard to see (e.g. objects fully overlapping).
        var isColliding = obj._collisions && obj._collisions.length > 0;
        g_ctx.strokeStyle = isColliding ? "#f00" : "#0ff";
        g_ctx.lineWidth = isColliding ? 3 : 2;

        if (shape.type === 'rectangle') {
                if (shape.angle === 0) {
                        // Простой прямоугольник без вращения
                        if (isColliding) {
                                g_ctx.fillStyle = "rgba(255,0,0,0.15)";
                                g_ctx.fillRect(shape.x - Game.screenx, shape.y - Game.screeny, shape.width, shape.height);
                        }
                        g_ctx.strokeRect(
                                shape.x - Game.screenx,
                                shape.y - Game.screeny,
                                shape.width,
                                shape.height);
                } else {
                        // Повернутый прямоугольник
                        const centerX = shape.x + shape.width / 2 - Game.screenx;
                        const centerY = shape.y + shape.height / 2 - Game.screeny;

                        g_ctx.translate(centerX, centerY);
                        g_ctx.rotate(shape.angle * Math.PI / 180);
                        if (isColliding) {
                                g_ctx.fillStyle = "rgba(255,0,0,0.15)";
                                g_ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                        }
                        g_ctx.strokeRect(
                                -shape.width / 2,
                                -shape.height / 2,
                                shape.width,
                                shape.height);
                }
        } else if (shape.type === 'circle') {
                g_ctx.beginPath();
                g_ctx.arc(
                        shape.x - Game.screenx,
                        shape.y - Game.screeny,
                        shape.radius,
                        0,
                        Math.PI * 2);
                if (isColliding) {
                        g_ctx.fillStyle = "rgba(255,0,0,0.15)";
                        g_ctx.fill();
                }
                g_ctx.stroke();

                // Линия к центру объекта для ориентации
                g_ctx.beginPath();
                g_ctx.moveTo(shape.x - Game.screenx, shape.y - Game.screeny);
                g_ctx.lineTo(
                        obj.x + obj.width / 2 - Game.screenx,
                        obj.y + obj.height / 2 - Game.screeny);
                g_ctx.stroke();
        }

        g_ctx.restore();
};
// Инициализация сенсорного ввода
Game.initSensorInput = function () {
        // Проверка попадания в треугольную кнопку D-Pad
        function checkDPadHit(x, y, btn) {
                const centerX = Game.virtualGamepad.dpad.x;
                const centerY = Game.virtualGamepad.dpad.y;
                const btnX = centerX + btn.x;
                const btnY = centerY + btn.y;
                if (btn.id === "ArrowUp") {
                        return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
                        y <= btnY + btn.h / 2 && y >= centerY - Game.virtualGamepad.dpad.size / 2;
                }
                if (btn.id === "ArrowDown") {
                        return x >= btnX - btn.w / 2 && x <= btnX + btn.w / 2 &&
                        y >= btnY - btn.h / 2 && y <= centerY + Game.virtualGamepad.dpad.size / 2;
                }
                if (btn.id === "ArrowLeft") {
                        return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
                        x <= btnX + btn.w / 2 && x >= centerX - Game.virtualGamepad.dpad.size / 2;
                }
                if (btn.id === "ArrowRight") {
                        return y >= btnY - btn.h / 2 && y <= btnY + btn.h / 2 &&
                        x >= btnX - btn.w / 2 && x <= centerX + Game.virtualGamepad.dpad.size / 2;
                }
                return false;
        }

        // Обновленная функция для обновления состояния кнопки с учетом ремаппинга
        function updateButtonState(button, active) {
                if (button.active !== active) {
                        button.active = active;

                        // Получаем ремаппированную клавишу
                        const mappedKey = Game.helper.keyRemapping[button.id] || button.id;

                        // Обновляем состояние оригинальной клавиши
                        if (active && !inputState.devices[0].keys[button.id])
                                inputState.devices[0].pressKeys[button.id] = true;
                        inputState.devices[0].keys[button.id] = active;

                }
        }

        // Обновление положения джойстика с учетом ремаппинга
        function updateJoystick(joystick, x, y, axisXIndex, axisYIndex, prefix) {
                let dx = x - joystick.x;
                let dy = y - joystick.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > joystick.r) {
                        dx = dx * joystick.r / distance;
                        dy = dy * joystick.r / distance;
                }

                joystick.handle.x = dx;
                joystick.handle.y = dy;

                // Обновляем оси
                inputState.devices[0].axes[axisXIndex] = dx / joystick.r;
                inputState.devices[0].axes[axisYIndex] = dy / joystick.r;

                // Обновляем состояния клавиш для стиков с учетом ремаппинга
                const stickKeys = {
                        Left: `Key${prefix}StickLeft`,
                        Right: `Key${prefix}StickRight`,
                        Up: `Key${prefix}StickUp`,
                        Down: `Key${prefix}StickDown`
                };

                // Очищаем предыдущие состояния
                for (const key in stickKeys) {
                        const originalKey = stickKeys[key];

                        inputState.devices[0].keys[originalKey] = false;
                }

                // Обновляем текущие состояния
                if (dx < -joystick.r * 0.5) {
                        const originalKey = stickKeys.Left;
                        inputState.devices[0].keys[originalKey] = true;
                } else if (dx > joystick.r * 0.5) {
                        const originalKey = stickKeys.Right;
                        inputState.devices[0].keys[originalKey] = true;
                }

                if (dy < -joystick.r * 0.5) {
                        const originalKey = stickKeys.Up;
                        inputState.devices[0].keys[originalKey] = true;
                } else if (dy > joystick.r * 0.5) {
                        const originalKey = stickKeys.Down;
                        inputState.devices[0].keys[originalKey] = true;
                }
        }
        // Получение координат с учетом масштабирования canvas
        function getCanvasCoordinates(clientX, clientY) {
                if (!Game.helper.enableTouchInput)
                        return {
                                x: 0,
                                y: 0
                        };
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                return {
                        x: (clientX - rect.left) * scaleX,
                        y: (clientY - rect.top) * scaleY
                }
        }
        // Обработка начала касания
        function handleStart(x, y, id) {
                // Проверка кнопок ABXY
                for (const btn of Game.virtualGamepad.buttons) {
                        if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
                                updateButtonState(btn, true);
                                Game.virtualGamepad.touches[id] = {
                                        type: "button",
                                        button: btn
                                };
                                return
                        }
                }
                // Проверка D-Pad
                for (const btn of Game.virtualGamepad.dpad.buttons) {
                        if (checkDPadHit(x, y, btn)) {
                                updateButtonState(btn, true);
                                Game.virtualGamepad.touches[id] = {
                                        type: "dpad",
                                        button: btn
                                };
                                return
                        }
                }
                // Проверка левого джойстика
                if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
                        Game.virtualGamepad.joystickLeft.active = true;
                        Game.virtualGamepad.joystickLeft.touchId = id;
                        updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1);
                        Game.virtualGamepad.touches[id] = {
                                type: "joystickLeft"
                        };
                        return
                }
                // Проверка правого джойстика
                if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
                        Game.virtualGamepad.joystickRight.active = true;
                        Game.virtualGamepad.joystickRight.touchId = id;
                        updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3);
                        Game.virtualGamepad.touches[id] = {
                                type: "joystickRight"
                        };
                        return
                }
        }
        // Обработчики мыши
        canvas.addEventListener("mousedown", e => {
                const {
                        x,
                        y
                } = getCanvasCoordinates(e.clientX, e.clientY);
                handleStart(x, y, "mouse")
        });
        canvas.addEventListener("mousemove", e => {
                if (Game.virtualGamepad.joystickLeft.touchId === "mouse") {
                        const {
                                x,
                                y
                        } = getCanvasCoordinates(e.clientX, e.clientY);
                        updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1)
                } else if (Game.virtualGamepad.joystickRight.touchId === "mouse") {
                        const {
                                x,
                                y
                        } = getCanvasCoordinates(e.clientX, e.clientY);
                        updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3)
                }
        });
        canvas.addEventListener("mouseup", () => {
                if (Game.virtualGamepad.touches["mouse"]) {
                        const touch = Game.virtualGamepad.touches["mouse"];
                        if (touch.type === "button" || touch.type === "dpad") {
                                updateButtonState(touch.button, false)
                        } else if (touch.type === "joystickLeft") {
                                Game.virtualGamepad.joystickLeft.active = false;
                                Game.virtualGamepad.joystickLeft.touchId = null;
                                Game.virtualGamepad.joystickLeft.handle.x = 0;
                                Game.virtualGamepad.joystickLeft.handle.y = 0;
                                inputState.devices[0].axes[0] = 0;
                                inputState.devices[0].axes[1] = 0
                        } else if (touch.type === "joystickRight") {
                                Game.virtualGamepad.joystickRight.active = false;
                                Game.virtualGamepad.joystickRight.touchId = null;
                                Game.virtualGamepad.joystickRight.handle.x = 0;
                                Game.virtualGamepad.joystickRight.handle.y = 0;
                                inputState.devices[0].axes[2] = 0;
                                inputState.devices[0].axes[3] = 0
                        }
                        delete Game.virtualGamepad.touches["mouse"]
                }
        });
        // Обработчики касаний
        canvas.addEventListener("touchstart", e => {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                        const {
                                x,
                                y
                        } = getCanvasCoordinates(touch.clientX, touch.clientY);
                        handleStart(x, y, touch.identifier)
                })
        });
        canvas.addEventListener("touchmove", e => {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                        if (Game.virtualGamepad.touches[touch.identifier]?.type === "joystickLeft") {
                                const {
                                        x,
                                        y
                                } = getCanvasCoordinates(touch.clientX, touch.clientY);
                                updateJoystick(Game.virtualGamepad.joystickLeft, x, y, 0, 1)
                        } else if (Game.virtualGamepad.touches[touch.identifier]?.type === "joystickRight") {
                                const {
                                        x,
                                        y
                                } = getCanvasCoordinates(touch.clientX, touch.clientY);
                                updateJoystick(Game.virtualGamepad.joystickRight, x, y, 2, 3)
                        }
                })
        });
        canvas.addEventListener("touchend", e => {
                e.preventDefault();
                Array.from(e.changedTouches).forEach(touch => {
                        if (Game.virtualGamepad.touches[touch.identifier]) {
                                const touchData = Game.virtualGamepad.touches[touch.identifier];
                                if (touchData.type === "button" || touchData.type === "dpad") {
                                        updateButtonState(touchData.button, false)
                                } else if (touchData.type === "joystickLeft") {
                                        Game.virtualGamepad.joystickLeft.active = false;
                                        Game.virtualGamepad.joystickLeft.touchId = null;
                                        Game.virtualGamepad.joystickLeft.handle.x = 0;
                                        Game.virtualGamepad.joystickLeft.handle.y = 0;
                                        inputState.devices[0].axes[0] = 0;
                                        inputState.devices[0].axes[1] = 0
                                } else if (touchData.type === "joystickRight") {
                                        Game.virtualGamepad.joystickRight.active = false;
                                        Game.virtualGamepad.joystickRight.touchId = null;
                                        Game.virtualGamepad.joystickRight.handle.x = 0;
                                        Game.virtualGamepad.joystickRight.handle.y = 0;
                                        inputState.devices[0].axes[2] = 0;
                                        inputState.devices[0].axes[3] = 0
                                }
                                delete Game.virtualGamepad.touches[touch.identifier]
                        }
                })
        });
        Game.helper.isTouchOnGamepad = function (x, y) {
                // Проверка кнопок ABXY
                for (const btn of Game.virtualGamepad.buttons) {
                        if (Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2) <= btn.r) {
                                return true
                        }
                }
                // Проверка D-Pad
                for (const btn of Game.virtualGamepad.dpad.buttons) {
                        if (checkDPadHit(x, y, btn)) {
                                return true
                        }
                }
                // Проверка левого джойстика
                if (Math.sqrt((x - Game.virtualGamepad.joystickLeft.x) ** 2 + (y - Game.virtualGamepad.joystickLeft.y) ** 2) <= Game.virtualGamepad.joystickLeft.r) {
                        return true
                }
                // Проверка правого джойстика
                if (Math.sqrt((x - Game.virtualGamepad.joystickRight.x) ** 2 + (y - Game.virtualGamepad.joystickRight.y) ** 2) <= Game.virtualGamepad.joystickRight.r) {
                        return true
                }
                return false
        }
};
Game.helper.error = function (err) {
        showSwitchModal("error", err, false, "ok");
        Game.reset();
        Game.gameLoop = function () {}
};
Game.pause = function () {
        if (this._isPaused)
                return;
        this._isPaused = true;
        this.pauseTime = Date.now();
        // Запоминаем оставшееся время для всех активных таймеров
        this.pausedTimers = {};
        for (const id in this.duc_helper_global_game_timers.timers) {
                const timer = this.duc_helper_global_game_timers.timers[id];
                this.pausedTimers[id] = {
                        callback: timer.callback,
                        remaining: timer.time - this.pauseTime,
                        isInterval: timer.isInterval,
                        interval: timer.interval
                }
        }
};
Game.resume = function () {
        if (!this._isPaused)
                return;
        this._isPaused = false;
        const resumeTime = Date.now();
        const pauseDuration = resumeTime - this.pauseTime;
        // Восстанавливаем таймеры с корректировкой времени
        for (const id in this.pausedTimers) {
                const timer = this.pausedTimers[id];
                this.duc_helper_global_game_timers.timers[id] = {
                        callback: timer.callback,
                        time: resumeTime + timer.remaining,
                        isInterval: timer.isInterval,
                        interval: timer.interval
                }
        }
        this.pausedTimers = {}
};
Game.isPaused = function () {
        return Game._isPaused != 0
}
// Инициализируем свойства паузы;
Game._isPaused = false;
Game.pauseTime = 0;
Game.pausedTimers = {};
// Инициализация сенсорного ввода при запуске игры
Game.initSensorInput();
Game.vibrate = function(duration, weakMagnitude = 0.5, strongMagnitude = 0.5) {
    // 1. Базовая вибрация (для телефонов/тач-устройств)
    if (navigator.vibrate) {
        navigator.vibrate(duration); // Просто передаем длительность
    }

    // 2. Вибрация через Gamepad API (если есть геймпад)
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (gamepad?.vibrationActuator) {
            gamepad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: Math.min(1.0, Math.max(0, weakMagnitude)), // Ограничиваем 0-1
                strongMagnitude: Math.min(1.0, Math.max(0, strongMagnitude)) // Ограничиваем 0-1
            });
        }
    }
};
Game.updateGamepadKey = function () {
        if (!inputState.hasGamepad)
                return;
        const device = inputState.devices[0]; // Геймпад всегда device 0
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0];
        const buttonMappings = {
                0: "KeyB",
                1: "KeyA",
                2: "KeyY",
                3: "KeyX",
                4: "KeyZL",
                5: "KeyZR",
                6: "KeyL",
                7: "KeyR",
                8: "KeyMinus",
                9: "KeyPlus",
                10: "KeyLStick",
                11: "KeyRStick",
                12: "ArrowUp",
                13: "ArrowDown",
                14: "ArrowLeft",
                15: "ArrowRight"
        };

        // Обработка кнопок
        for (const[buttonIndex, originalKey]of Object.entries(buttonMappings)) {
                if (gamepad.buttons[buttonIndex]) {
                        const pressed = gamepad.buttons[buttonIndex].pressed;

                        if (pressed && !device.keys[originalKey]) {
                                device.pressKeys[originalKey] = true; // Пресс-клавиши для геймпада
                        }

                        device.keys[originalKey] = pressed;
                        device.pressButton[buttonIndex] = pressed;
                }
        }

        // Обработка осей стиков (устройство 0)
        if (gamepad.axes.length >= 4) {
                const deadZone = 0.1;
                inputState.devices[0].axes[0] = Math.abs(gamepad.axes[0]) > deadZone ? gamepad.axes[0] : 0;
                inputState.devices[0].axes[1] = Math.abs(gamepad.axes[1]) > deadZone ? gamepad.axes[1] : 0;
                inputState.devices[0].axes[2] = Math.abs(gamepad.axes[2]) > deadZone ? gamepad.axes[2] : 0;
                inputState.devices[0].axes[3] = Math.abs(gamepad.axes[3]) > deadZone ? gamepad.axes[3] : 0;
        }
};
// Основной игровой цикл
function game_loop(timestamp) {
        requestAnimationFrame(game_loop);
        if(document.getElementById("debug")) document.getElementById("debug").innerText = '';

        // Frame counter — used by syncFromBody to detect the second call in
        // the same frame (post-onCollision-teleport re-validation) and skip
        // overwriting the debug-colliding-tiles snapshot from the first call.
        if (typeof Game.helper.frameCount === 'undefined') Game.helper.frameCount = 0;
        Game.helper.frameCount++;

        // Рассчитываем helper.deltaTime (в секундах)
        if (!Game.helper.lastFrameTime)
                Game.helper.lastFrameTime = timestamp;
        Game.helper.deltaTime = (timestamp - Game.helper.lastFrameTime) / 1000;
        Game.helper.lastFrameTime = timestamp;

        // Ограничиваем helper.deltaTime для избежания "прыжков" при долгих паузах
        if (Game.helper.deltaTime > 0.1 || isNaN(Game.helper.deltaTime))
                Game.helper.deltaTime = 0.1;
        // Всегда обновляем ввод, даже во время паузы
        Game.updateGamepadKey();
        if (Game._isPaused) {
                Game.updateGamepadKey();
                if (Game.gameLoop) {
                        try { Game.gameLoop(); } // Для отрисовки меню паузы
                        catch(e) { Game.alert(e.message || String(e), 'Game Loop Error'); }
                }
                if (Game.helper.enableTouchInput && Game.helper.enableDrawing) {
                        Game.updateSensorKey(); // Обработка сенсорных кнопок
                }
                return; // Пропускаем всю остальную логику
        }
        function sortObjectsByY() {
                if (!Game.allObject || !Array.isArray(Game.allObject)) {
                        return []
                }
                const sortedObjects = [...Game.allObject];
                sortedObjects.sort((a, b) => {
                        const aSum = (Number(a.y) || 0) + (Number(a.zIndex) || 0);
                        const bSum = (Number(b.y) || 0) + (Number(b.zIndex) || 0);
                        return aSum - bSum
                });
                return sortedObjects
        }
        if (Game.gameLoop && !Game.helper.pause) {
                if (typeof objectsDebugPanel !== "undefined")
                        objectsDebugPanel.update();
                Game.updateGamepadKey();
                try { Game.gameLoop(); }
                catch(e) { Game.alert(e.message || String(e), 'Game Loop Error'); }
                Game.drawBackground();
                Game.helper.drawTiles();
                Game.Particles.update();
                //твймеры
                var now = Date.now();
                var timers = Game.duc_helper_global_game_timers.timers;
                var pending = Game.duc_helper_global_game_timers.pending;
                // 1. Собираем таймеры для выполнения
                for (var id in timers) {
                        if (timers.hasOwnProperty(id) && now >= timers[id].time) {
                                pending.push({
                                        id: parseInt(id),
                                        callback: timers[id].callback,
                                        isInterval: timers[id].isInterval
                                });
                                // Удаляем одноразовые таймеры
                                if (!timers[id].isInterval) {
                                        delete timers[id]
                                }
                        }
                }
                Game.duc_helper_global_game_timers.length = pending.length;
                // Обновляем историю для вычисления среднего значения
                if (now - Game.duc_helper_global_game_timers.lastSampleTime >= 100) { // Обновляем каждые 100мс
                        Game.duc_helper_global_game_timers.timerHistory.push({
                                time: now,
                                count: Object.keys(timers).length + pending.length
                        });
                        Game.duc_helper_global_game_timers.lastSampleTime = now;
                        // Удаляем старые записи (старше 1 секунды)
                        while (Game.duc_helper_global_game_timers.timerHistory.length > 0 && now - Game.duc_helper_global_game_timers.timerHistory[0].time > 1e3) {
                                Game.duc_helper_global_game_timers.timerHistory.shift()
                        }
                        // Вычисляем среднее значение
                        if (Game.duc_helper_global_game_timers.timerHistory.length > 0) {
                                var total = Game.duc_helper_global_game_timers.timerHistory.reduce(function (sum, entry) {
                                        return sum + entry.count
                                }, 0);
                                Game.duc_helper_global_game_timers.lengthAvg = Math.round(total / Game.duc_helper_global_game_timers.timerHistory.length)
                        }
                }
                // 2. Выполняем собранные колбэки
                for (var i = 0; i < pending.length; i++) {
                        try {
                                pending[i].callback()
                        } catch (e) {
                                console.error("Timer error:", e)
                        }
                        // Удаляем интервалы с interval=0 (чтобы не росли бесконечно)
                        if (pending[i].isInterval) {
                                var id = pending[i].id;
                                if (timers[id] && timers[id].interval === 0) {
                                        delete timers[id]
                                }
                        }
                }
                // 3. Очищаем очередь выполненных
                pending.length = 0;
                //конец таймеров
                // ═══ Chipmunk2D Physics Step ═══
                // 1. Call onStep BEFORE physics — JS code sets speedx/speedy here.
                for (var i = 0; i < Game.allObject.length; i++) {
                        var o = Game.allObject[i];
                        o._collisions = [];
                        o._collisionSet = new Set();  // per-frame dedup set for beginFunc
                        o.prev_x = o.x;
                        o.prev_y = o.y;
                        o._prev_speedx = o.speedx;
                        o._prev_speedy = o.speedy;
                        if (o.onStep) {
                                try { o.onStep(); }
                                catch(e) { Game.alert(e.message || String(e), 'onStep Error (' + (o.name||'?') + ')'); }
                        }
                }
                // 2. Apply gravity + sync to Chipmunk.
                // Chain links (objects in distance joints with type='distance')
                // use Verlet-style velocity: vel = (pos - prev_pos) * 0.98 + gravity.
                // This makes position corrections from applyDistanceJoints
                // automatically become next frame's velocity (self-correcting),
                // eliminating chain jitter. Regular objects use v118 physics.
                //
                // FIX: Must use new Set() with object references — NOT an object
                // keyed by o._cpBody. Chipmunk body objects all stringify to
                // "[object Object]" as keys, which would make EVERY dynamic
                // object match and break regular physics.
                var chainLinkSet = null;
                if (Game.physics.distanceJoints.length > 0) {
                        chainLinkSet = new Set();
                        for (var ci = 0; ci < Game.physics.distanceJoints.length; ci++) {
                                var cj = Game.physics.distanceJoints[ci];
                                if (cj.type !== 'distance') continue;
                                if (cj.master && !cj.master.isStatic) chainLinkSet.add(cj.master);
                                if (cj.slave && !cj.slave.isStatic) chainLinkSet.add(cj.slave);
                        }
                }
                var _dt60 = Game.helper.deltaTime * 60;
                for (var i = 0; i < Game.allObject.length; i++) {
                        var o = Game.allObject[i];
                        if (o._checkSensor) o._checkSensor();
                        // NATIVE chain links: Chipmunk's constraint solver owns
                        // velocity and position. Do NOT apply gravity here or
                        // call syncToBody — that would overwrite the solver's
                        // impulses. Gravity is applied via space.gravity during
                        // cpSpaceStep (see below — we use real gravity for the
                        // step, not zero). Only sync position if JS changed it.
                        if (o.isStatic == 0 && o._chainGroup) {
                                if (o.x !== o.prev_x || o.y !== o.prev_y) {
                                        cpBodySetPosition(o._cpBody, cpv(o.x + o.width * 0.5, o.y + o.height * 0.5));
                                }
                                cpBodyActivate(o._cpBody);
                                continue;
                        }
                        // JS-space chain links (Verlet for non-native distance joints).
                        if (o.isStatic == 0 && chainLinkSet && chainLinkSet.has(o)) {
                                if (o._verletPrevX === undefined) {
                                        o._verletPrevX = o.x; o._verletPrevY = o.y;
                                }
                                // If JS code (onStep) teleported this object,
                                // reset Verlet prev to avoid huge velocity spike.
                                if (o.x !== o.prev_x || o.y !== o.prev_y) {
                                        o._verletPrevX = o.x;
                                        o._verletPrevY = o.y;
                                }
                                // Save frame start position — needed after
                                // collisionPushOut to compute the correct
                                // _verletPrevX (only collision delta excluded,
                                // joint delta kept as next frame's velocity).
                                o._frameStartX = o.x;
                                o._frameStartY = o.y;
                                var verletVx = (o.x - o._verletPrevX) * 0.9;
                                var verletVy = (o.y - o._verletPrevY) * 0.9;
                                // Always apply gravity for chain links — the
                                // joint constraints will counteract it via
                                // position correction, which becomes velocity
                                // next frame (Verlet self-correction).
                                verletVy += gravitation * _dt60;
                                o.speedx = verletVx;
                                o.speedy = verletVy;
                                if (o.speedx > 30) o.speedx = 30; else if (o.speedx < -30) o.speedx = -30;
                                if (o.speedy > 30) o.speedy = 30; else if (o.speedy < -30) o.speedy = -30;
                                Game.physics.syncToBody(o);
                                continue;
                        }
                        // Regular objects: gravity is applied via space.gravity
                        // in cpSpaceStep (Game.physics.step sets it). We do NOT
                        // apply gravity here — that would double-apply.
                        if (o.speedx > 30) o.speedx = 30; else if (o.speedx < -30) o.speedx = -30;
                        if (o.speedy > 30) o.speedy = 30; else if (o.speedy < -30) o.speedy = -30;
                        Game.physics.syncToBody(o);
                }
                var dt = Math.min(Game.helper.deltaTime, 1/30);
                // Pre-step distance joints.
                if (Game.physics.distanceJoints.length > 0) {
                        Game.physics.applyDistanceJointsPreStep();
                }
                // Step — Game.physics.step sets space.gravity = gravitation*3600
                // and calls cpSpaceStep. Gravity is applied to ALL bodies by
                // the solver. This is critical for native chain links — the
                // solver must see gravity to counteract it with joint impulses.
                // Regular objects also get gravity here (not in syncToBody loop).
                Game.physics.step(dt);
                for (var i = 0; i < Game.allObject.length; i++) {
                        var o = Game.allObject[i];
                        Game.physics.syncFromBody(o);
                }
                // HARD clamp native chain joints — forcefully prevent links
                // from separating beyond max distance. The solver's soft
                // bias-based correction is too slow against strong gravity;
                // this hard clamp runs 4 passes to ensure anchors stay within
                // max distance. Without this, gravity stretches the chain
                // and links drift apart.
                if (Game.physics.nativeConstraints.length > 0) {
                        Game.physics.clampNativeJoints();
                        // Re-sync positions after hard clamp.
                        for (var i = 0; i < Game.allObject.length; i++) {
                                var o = Game.allObject[i];
                                if (o._chainGroup && o._cpBody) {
                                        var p = cpBodyGetPosition(o._cpBody);
                                        o.x = p.x - o.width * 0.5;
                                        o.y = p.y - o.height * 0.5;
                                }
                        }
                }
                // Post-step distance joints: correct slave position to
                // maintain target distance. Master is never moved.
                if (Game.physics.distanceJoints.length > 0) {
                        Game.physics.applyDistanceJoints();
                }
                // Chain links (Verlet): save position AFTER applyDistanceJoints,
                // BEFORE collisionPushOut. This is the "post-joint" position.
                // The joint correction (postJoint - postPhysics) should become
                // next frame's velocity (Verlet self-correction). The collision
                // correction (final - postJoint) should NOT become velocity
                // (otherwise chain links bounce off tiles).
                if (chainLinkSet) {
                        for (var i = 0; i < Game.allObject.length; i++) {
                                var o = Game.allObject[i];
                                if (chainLinkSet.has(o)) {
                                        o._postJointX = o.x;
                                        o._postJointY = o.y;
                                }
                        }
                }
                // Post-step collision push-out: push overlapping objects apart.
                // JS Chipmunk's native collision response is soft (bias-based),
                // causing objects to sink into each other under gravity.
                // This pass applies direct position correction (40% Baumgarte)
                // for all overlapping dynamic-vs-non-sensor shapes.
                Game.physics.collisionPushOut();
                // Re-clamp native joints AFTER collisionPushOut — collisions
                // may have pushed links apart, breaking the hard constraint.
                if (Game.physics.nativeConstraints.length > 0) {
                        Game.physics.clampNativeJoints();
                        for (var i = 0; i < Game.allObject.length; i++) {
                                var o = Game.allObject[i];
                                if (o._chainGroup && o._cpBody) {
                                        var p = cpBodyGetPosition(o._cpBody);
                                        o.x = p.x - o.width * 0.5;
                                        o.y = p.y - o.height * 0.5;
                                }
                        }
                        // Debug: log chain link positions every 60 frames
                        if (typeof window !== 'undefined' && window._chainDebug) {
                                if (!Game._chainLogFrame) Game._chainLogFrame = 0;
                                Game._chainLogFrame++;
                                if (Game._chainLogFrame % 60 === 0) {
                                        var chainLinks = [];
                                        for (var i = 0; i < Game.allObject.length; i++) {
                                                var o = Game.allObject[i];
                                                if (o._chainGroup && !o.isStatic) {
                                                        chainLinks.push({i: i, x: o.x.toFixed(1), y: o.y.toFixed(1), a: (o.angle||0).toFixed(0)});
                                                }
                                        }
                                        console.log('[chain f' + Game._chainLogFrame + '] links=' + JSON.stringify(chainLinks));
                                        // Log constraint distances
                                        var dists = [];
                                        for (var ci = 0; ci < Game.physics.nativeConstraints.length; ci++) {
                                                var c = Game.physics.nativeConstraints[ci];
                                                var r1 = cpvrotate(c.anchorA, cpBodyGetRotation(c.a));
                                                var r2 = cpvrotate(c.anchorB, cpBodyGetRotation(c.b));
                                                var ap = cpvadd(c.a.p, r1);
                                                var bp = cpvadd(c.b.p, r2);
                                                var d = Math.sqrt((bp.x-ap.x)*(bp.x-ap.x) + (bp.y-ap.y)*(bp.y-ap.y));
                                                dists.push(d.toFixed(2));
                                        }
                                        console.log('[chain f' + Game._chainLogFrame + '] dists=[' + dists.join(',') + ']');
                                }
                        }
                }
                // Native chain links: body rotates freely (lock_rotation=0),
                // syncFromBody reads cpBodyGetAngle → obj.angle for sprite.
                // No manual angle update needed — physics solver handles it.
                // JS-space chain links (Verlet): still need updateChainAngles.
                if (chainLinkSet) {
                        Game.physics.updateChainAngles();
                }
                // Chain links (Verlet): compute _verletPrevX so that on the
                // next frame, verletVx = (physics_motion + joint_motion),
                // excluding collision_motion.
                //
                //   verletVx_next = (o.x_next - _verletPrevX)
                //   o.x_next = final position this frame (after collision)
                //   We want: verletVx_next = (postJoint - frameStart)
                //   So: _verletPrevX = o.x_next - (postJoint - frameStart)
                //                     = final - postJoint + frameStart
                //                     = frameStart + (final - postJoint)
                //                     = frameStart + collision_delta
                if (chainLinkSet) {
                        for (var i = 0; i < Game.allObject.length; i++) {
                                var o = Game.allObject[i];
                                if (chainLinkSet.has(o) && o._postJointX !== undefined && o._frameStartX !== undefined) {
                                        // CRITICAL FIX: Don't turn ALL joint correction into velocity.
                                        // Old formula: _verletPrevX = frameStart + collision_delta
                                        //   → verletVx_next = joint_delta (100% becomes velocity)
                                        //   → joint pulls up, next frame velocity pulls up more,
                                        //     gravity pulls down → endless oscillation.
                                        //
                                        // New formula: keep only 30% of joint-induced velocity.
                                        //   _verletPrevX = postJoint - (postJoint - frameStart) * 0.3
                                        //   → verletVx_next = joint_delta * 0.3 (only 30%)
                                        //   → oscillation damps itself naturally.
                                        //   Plus subtract collision_delta entirely (collision
                                        //   corrections must NOT become velocity).
                                        var jointDx = o._postJointX - o._frameStartX;
                                        var jointDy = o._postJointY - o._frameStartY;
                                        var collDx = o.x - o._postJointX;
                                        var collDy = o.y - o._postJointY;
                                        o._verletPrevX = o._frameStartX + jointDx * 0.3 + collDx;
                                        o._verletPrevY = o._frameStartY + jointDy * 0.3 + collDy;
                                        // Additional post-joint velocity damping (kill residual
                                        // vibration from the 30% that does become velocity).
                                        var dvx = o.x - o._verletPrevX;
                                        var dvy = o.y - o._verletPrevY;
                                        o._verletPrevX = o.x - dvx * 0.5;
                                        o._verletPrevY = o.y - dvy * 0.5;
                                        o._postJointX = undefined;
                                        o._postJointY = undefined;
                                        o._frameStartX = undefined;
                                        o._frameStartY = undefined;
                                }
                        }
                }
                // FIX: Collect ALL (obj, other) pairs BEFORE calling any
                // onCollision. Game.removeObject() splices allObject, which
                // would (a) invalidate index-based lookups and (b) cause the
                // for-loop to SKIP objects that shift into the just-removed
                // slot. By snapshotting pairs first, the iteration is immune
                // to any array mutations inside onCollision handlers.
                var _collisionPairs = [];
                for (var i = 0; i < Game.allObject.length; i++) {
                        var o = Game.allObject[i];
                        if (o.onCollision && o._collisions) {
                                for (var j = 0; j < o._collisions.length; j++) {
                                        // _collisions holds object REFERENCES (not indices).
                                        var other = o._collisions[j];
                                        if (other) _collisionPairs.push([o, other]);
                                }
                        }
                }
                for (var p = 0; p < _collisionPairs.length; p++) {
                        var pair = _collisionPairs[p];
                        var o = pair[0], other = pair[1];
                        // Skip if the RECEIVING object was already removed
                        // this frame. We do NOT skip if only `other` was
                        // removed — the receiving object still needs to know
                        // it was hit (e.g. an asteroid must learn a bullet
                        // struck it, even if the bullet already destroyed
                        // itself in its own onCollision).
                        if (o._removed) continue;
                        try { o.onCollision(other); }
                        catch(e) { Game.alert(e.message || String(e), 'onCollision Error (' + (o.name||'?') + ')'); }
                        // After onCollision, JS may have changed position (teleport).
                        // Sync the new position to Chipmunk body.
                        if (o._cpBody && !o.isStatic) {
                                var ncx = o.x + o.width * 0.5;
                                var ncy = o.y + o.height * 0.5;
                                cpBodySetPosition(o._cpBody, cpv(ncx, ncy));
                                cpBodySetVelocity(o._cpBody, cpv(o.speedx * 60, o.speedy * 60));
                                // Reset Verlet prev for chain links — JS teleport
                                // in onCollision must not become velocity.
                                if (chainLinkSet && chainLinkSet.has(o)) {
                                        o._verletPrevX = o.x;
                                        o._verletPrevY = o.y;
                                }
                        }
                }
                const sortedArray = sortObjectsByY();
                for (var i = 0; i < sortedArray.length; i++) {
                        var o = sortedArray[i];
                        if (o.visible && o.isAnimationPlaying && Array.isArray(o.sprite)) {
                                o.frameTime += Game.helper.deltaTime; // Используем helper.deltaTime вместо фиксированного значения
                                const frameDuration = 1 / o.animationSpeed;
                                while (o.frameTime >= frameDuration) {
                                        o.frameTime -= frameDuration;
                                        o.currentFrame++;
                                        if (o.currentFrame >= o.sprite.length) {
                                                if (o.animationLoop) {
                                                        o.currentFrame = 0;
                                                } else {
                                                        o.currentFrame = o.sprite.length - 1;
                                                        o.isAnimationPlaying = false;
                                                        o.isAnimationEnd = true;
                                                }
                                        }
                                }
                        }
                        if (o.visible) {
                                g_ctx.save();
                                g_ctx.translate(o.x + o.width / 2 - Game.screenx, o.y + o.height / 2 - Game.screeny);
                                g_ctx.rotate(o.angle * Math.PI / 180);
                                const SDL_FLIP_NONE = 0;
                                const SDL_FLIP_HORIZONTAL = 1;
                                const SDL_FLIP_VERTICAL = 2;
                                const flipHorz = (o.flip & SDL_FLIP_HORIZONTAL) !== 0;
                                const flipVert = (o.flip & SDL_FLIP_VERTICAL) !== 0;
                                if (flipHorz || flipVert) {
                                        const scaleX = flipHorz ? -1 : 1;
                                        const scaleY = flipVert ? -1 : 1;
                                        g_ctx.scale(scaleX, scaleY)
                                }
                                const spriteToDraw = Array.isArray(o.sprite) ? o.sprite[o.currentFrame] : o.sprite;
                                Draw.image(spriteToDraw, -o.width / 2, -o.height / 2, o.width, o.height, o.visible);
                                // Отрисовка зеленой рамки для раскрытых объектов
                                if (debugShowExpandedObjectsBorder && objectsDebugPanel && objectsDebugPanel.isObjectExpanded(o)) {
                                        g_ctx.save();
                                        g_ctx.strokeStyle = "#0f0";
                                        g_ctx.lineWidth = 2;
                                        g_ctx.beginPath();
                                        g_ctx.rect(-o.width / 2, -o.height / 2, o.width, o.height);
                                        g_ctx.stroke();
                                        g_ctx.fillStyle = "#0f0";
                                        g_ctx.font = "12px Arial";
                                        g_ctx.textAlign = "center";
                                        g_ctx.textBaseline = "middle";
                                        g_ctx.fillText(o.name || "Unnamed", 0, 0);
                                        g_ctx.restore()
                                }
                                g_ctx.restore();
                        }
                }
                // FIX: Draw ALL debug overlay shapes AFTER all sprites are rendered.
                // Previously, debug shapes were drawn inside the sprite loop, so later
                // sprites (e.g. stop2) covered the arrows/lines drawn for earlier objects
                // (e.g. scull). Now all sprites are drawn first, then all debug shapes
                // on top — so arrows are always visible.
                //
                // Pass 1: draw all physics shapes as white outlines (shows what
                // the physics engine actually sees — may differ from visual sprites).
                if (draw_physics_shapes) {
                        Game.drawPhysicsShapes();
                }
                // Pass 2: draw bounding boxes + collision arrows (red).
                if (draw_bounding_box) {
                        for (var i = 0; i < sortedArray.length; i++) {
                                Game.drawDebugCollisionShape(sortedArray[i]);
                        }
                }
                Game.Particles.draw();
                if (Game.helper.enableTouchInput) {
                        Game.updateSensorKey()
                }
        }
        const allKeys = new Set([
                                ...Object.keys(Game.helper.keyRemapping),
                                ...Object.values(Game.helper.keyRemapping)
                        ]);

        for (let i = 0; i < inputState.devices.length; i++) {
                if (!inputState.devices[i] || !inputState.devices[i].pressKeys)
                        continue;

                for (const key of allKeys) {
                        if (key in inputState.devices[i].pressKeys) {
                                inputState.devices[i].pressKeys[key] = false;
                        }
                }
        }
        if (Game.helper.showGamepadButtons) {
        drawGamepadButtonsPreview();
    }
}
// Инициализация игры
Game.initEngine();
game_loop();
function initObjectsDebugPanel() {
    const container = document.getElementById("objectsList");
    if (!container) {
        return; // Standalone mode — no debug panel
    }

    // Стили контейнера
    container.style.overflowY = "auto";
    container.style.backgroundColor = "rgba(40, 40, 40, 0.9)";
    container.style.color = "#e0e0e0";
    container.style.fontFamily = "monospace";
    container.style.fontSize = "13px";
    container.style.width = 0;
    container.style.opacity = 0;

    const expandedStates = new Map();     // раскрытие объектов
    const varExpandedStates = new Map();  // раскрытие переменных
    const objectElements = new Map();     // кэш DOM-элементов объектов
    let lastObjectCount = 0;
    let lastVarCount = 0;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 200; // 5 раз в секунду

    // === СЧЕТЧИК В ВЕРХНЕЙ ЧАСТИ ===
    const counterElement = document.createElement("div");
    counterElement.style.padding = "6px 8px";
    counterElement.style.background = "#222";
    counterElement.style.borderBottom = "1px solid #444";
    counterElement.style.fontWeight = "bold";
    counterElement.style.position = "sticky";
    counterElement.style.top = "0";
    counterElement.style.zIndex = "1";
    container.appendChild(counterElement);

    // === БЛОК ДЛЯ ПЕРЕМЕННЫХ ===
    const variablesContainer = document.createElement("div");
    variablesContainer.id = "debug-variables-section";
    variablesContainer.style.position = "sticky";
    variablesContainer.style.top = "28px"; /* под счётчиком */
    variablesContainer.style.zIndex = "2";
    variablesContainer.style.backgroundColor = "rgba(42, 42, 42, 0.95)";
    variablesContainer.style.border = "1px solid #444";
    variablesContainer.style.maxHeight = "33vh"; /* максимум треть экрана */
    variablesContainer.style.display = "flex";
    variablesContainer.style.flexDirection = "column";
    variablesContainer.style.overflow = "hidden"; /* 🔴 УБИРАЕМ внешнюю прокрутку, оставляем только внутреннюю */
    variablesContainer.style.padding = "0";
    variablesContainer.style.marginBottom = "12px";

    // Вставляем сразу после счётчика
    container.insertBefore(variablesContainer, counterElement.nextSibling);

    // === ПЕРЕВОДЫ ПАРАМЕТРОВ ОБЪЕКТОВ (отсортированы один раз) ===
    const PARAM_TRANSLATIONS = {
        x: Blockly.Msg["OBJECT_PARAM_X"],
        y: Blockly.Msg["OBJECT_PARAM_Y"],
        prev_x: Blockly.Msg["OBJECT_PARAM_PREV_X"] || "prev X",
        prev_y: Blockly.Msg["OBJECT_PARAM_PREV_Y"] || "prev Y",
        width: Blockly.Msg["OBJECT_PARAM_WIDTH"],
        height: Blockly.Msg["OBJECT_PARAM_HEIGHT"],
        speedx: Blockly.Msg["OBJECT_PARAM_SPEEDX"],
        speedy: Blockly.Msg["OBJECT_PARAM_SPEEDY"],
        visible: Blockly.Msg["OBJECT_PARAM_VISIBLE"],
        name: Blockly.Msg["OBJECT_PARAM_NAME"],
        local: Blockly.Msg["OBJECT_PARAM_LOCAL"],
        solid: Blockly.Msg["OBJECT_PARAM_SOLID"],
        angle: Blockly.Msg["OBJECT_PARAM_ANGLE"],
        flip: Blockly.Msg["OBJECT_PARAM_FLIP"],
        mass: Blockly.Msg["OBJECT_PARAM_MASS"],
        restitution: Blockly.Msg["OBJECT_PARAM_RESTITUTION"],
        isStatic: Blockly.Msg["OBJECT_PARAM_ISSTATIC"],
        zIndex: Blockly.Msg["OBJECT_PARAM_ZINDEX"],
        isOnGround: Blockly.Msg["OBJECT_PARAM_ISONGROUND"],
        currentFrame: Blockly.Msg['OBJECT_PARAM_FRAME'],
        isAnimationEnd: Blockly.Msg['OBJECT_PARAM_ANIMATION_PLAY']
    };

    const sortedAllowedKeys = Object.keys(PARAM_TRANSLATIONS).sort();

    // === ГЕНЕРАЦИЯ УНИКАЛЬНОГО ID ДЛЯ ОБЪЕКТА ===
    function getObjectId(obj, index) {
        if (!obj.__debugId) {
            obj.__debugId = `obj_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        }
        return obj.__debugId;
    }

    // === БЕЗОПАСНАЯ СТРОКА (вместо JSON.stringify) ===
    function safeStringify(value, maxLength = 50) {
        if (value === null) return 'null';
        if (typeof value === 'undefined') return 'undefined';
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object') {
            try {
                const str = JSON.stringify(value);
                return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
            } catch (e) {
                return Object.prototype.toString.call(value);
            }
        }
        return String(value);
    }

    // === СОЗДАНИЕ ЭЛЕМЕНТА ОБЪЕКТА ===
    function createObjectElement(obj, id) {
        const element = document.createElement("div");
        element.className = "debug-object";
        element.dataset.objId = id;
        element.style.marginBottom = "8px";
        element.style.border = "1px solid #444";
        element.style.overflow = "hidden";

        const isExpanded = expandedStates.get(id) || false;

        // Заголовок
        const header = document.createElement("div");
        header.className = "debug-object-header";
        header.style.padding = "6px 8px";
        header.style.background = "#333";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.cursor = "pointer";
        header.style.userSelect = "none";

        const nameSpan = document.createElement("span");
        nameSpan.style.color = "#6af";
        nameSpan.textContent = obj.name || `Object ${id.split("_")[1]}`;

        const arrowSpan = document.createElement("span");
        arrowSpan.className = "debug-object-arrow";
        arrowSpan.style.fontSize = "10px";
        arrowSpan.textContent = isExpanded ? "▼" : "▶";

        header.appendChild(nameSpan);
        header.appendChild(arrowSpan);

        // Детали
        const details = document.createElement("div");
        details.className = "debug-object-details";
        details.style.padding = "8px";
        details.style.background = "#2a2a2a";
        details.style.borderTop = "1px solid #444";
        if (isExpanded) details.classList.add("expanded");

        updateObjectDetails(details, obj);

        element.appendChild(header);
        element.appendChild(details);

        // Клик по заголовку
        header.addEventListener("click", (e) => {
            const newState = !expandedStates.get(id);
            expandedStates.set(id, newState);
            arrowSpan.textContent = newState ? "▼" : "▶";
            if (newState) {
                details.classList.add("expanded");
            } else {
                details.classList.remove("expanded");
            }
            e.stopPropagation();
        });

        return element;
    }

    // === ОБНОВЛЕНИЕ ДЕТАЛЕЙ ОБЪЕКТА (без пересоздания DOM) ===
    function updateObjectDetails(container, obj) {
        // Если контейнер уже содержит правильные элементы — обновляем значения
        const existingChildren = container.children;
        const keyToElement = {};

        for (let child of existingChildren) {
            const keySpan = child.querySelector("span:first-child");
            if (keySpan) {
                const text = keySpan.textContent;
                const key = Object.entries(PARAM_TRANSLATIONS)
                    .find(([, trans]) => text.startsWith(trans + ":"))?.[0];
                if (key) keyToElement[key] = child;
            }
        }

        // Обновляем или создаём
        const fragment = document.createDocumentFragment();
        let changed = false;

        sortedAllowedKeys.forEach((key) => {
            if (!(key in obj)) return;

            const value = obj[key];
            const displayName = PARAM_TRANSLATIONS[key] || key;
            const color = typeof value === 'number' ? '#4caf50' :
                         typeof value === 'boolean' ? '#2196f3' :
                         typeof value === 'string' ? '#ff9800' :
                         typeof value === 'function' ? '#9c27b0' :
                         value === null ? '#9e9e9e' :
                         Array.isArray(value) ? '#e91e63' : '#ffffff';

            let stringValue;
            if (typeof value === 'function') {
                stringValue = '[Function]';
            } else {
                stringValue = safeStringify(value, 50);
            }

            let paramDiv = keyToElement[key];
            if (!paramDiv) {
                paramDiv = document.createElement('div');
                paramDiv.style.padding = '2px 0';
                paramDiv.style.fontSize = '12px';
                paramDiv.style.borderBottom = '1px solid #555';

                const keySpan = document.createElement('span');
                keySpan.textContent = displayName + ': ';
                keySpan.style.color = '#bbbbbb';

                const valueSpan = document.createElement('span');
                valueSpan.style.color = color;
                valueSpan.textContent = stringValue;

                paramDiv.appendChild(keySpan);
                paramDiv.appendChild(valueSpan);
                fragment.appendChild(paramDiv);
                changed = true;
            } else {
                const valueSpan = paramDiv.querySelector('span:last-child');
                if (valueSpan.textContent !== stringValue || valueSpan.style.color !== color) {
                    valueSpan.textContent = stringValue;
                    valueSpan.style.color = color;
                }
            }
        });

        // Удаляем старые ключи, которых больше нет
        for (let [key, el] of Object.entries(keyToElement)) {
            if (!sortedAllowedKeys.includes(key) || !(key in obj)) {
                container.removeChild(el);
                changed = true;
            }
        }

        if (fragment.hasChildNodes()) {
            container.appendChild(fragment);
        }
    }

    // === ОБНОВЛЕНИЕ ПЕРЕМЕННЫХ ===
        function updateVariablesSection() {
    const globalVars = Game.helper.globalArray;
    if (!globalVars || typeof globalVars !== 'object') {
        variablesContainer.innerHTML = '<div style="padding:6px;color:#aaa;text-align:center;">No global variables</div>';
        return;
    }

    // Фильтруем ключи: исключаем переменные со значением undefined
    const varKeys = Object.keys(globalVars).filter(key => globalVars[key] !== undefined);
    const currentVarCount = varKeys.length;

    // Ищем существующие элементы
    let sectionHeader = variablesContainer.querySelector('.debug-vars-header');
    let details = variablesContainer.querySelector('.debug-vars-details');
    const isExpanded = varExpandedStates.get('vars') || false;

    // === СОЗДАНИЕ ЗАГОЛОВКА (один раз) ===
    if (!sectionHeader) {
        sectionHeader = document.createElement('div');
        sectionHeader.className = 'debug-vars-header';
        sectionHeader.style.padding = '6px 8px';
        sectionHeader.style.background = '#333';
        sectionHeader.style.display = 'flex';
        sectionHeader.style.justifyContent = 'space-between';
        sectionHeader.style.alignItems = 'center';
        sectionHeader.style.cursor = 'pointer';
        sectionHeader.style.userSelect = 'none';
        sectionHeader.style.marginBottom = '8px';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = Blockly.Msg['VARIABLES'];
        titleSpan.style.color = '#ffeb3b';

        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'debug-vars-arrow';
        arrowSpan.style.fontSize = '10px';
        arrowSpan.textContent = isExpanded ? '▼' : '▶';

        sectionHeader.appendChild(titleSpan);
        sectionHeader.appendChild(arrowSpan);

        variablesContainer.appendChild(sectionHeader);

        // === ЕДИНСТВЕННЫЙ ОБРАБОТЧИК КЛИКА ===
        sectionHeader.addEventListener('click', () => {
            const newState = !varExpandedStates.get('vars');
            varExpandedStates.set('vars', newState);
            arrowSpan.textContent = newState ? '▼' : '▶';
            if (newState) {
                details.classList.add('expanded');
                updateVariablesContent(); // Обновляем при раскрытии
            } else {
                details.classList.remove('expanded');
            }
        });
    }

    // === СОЗДАНИЕ КОНТЕЙНЕРА ДЕТАЛЕЙ (один раз) ===
    if (!details) {
        details = document.createElement('div');
        details.className = 'debug-vars-details';
        details.style.flex = "1";
        details.style.padding = "8px";
        details.style.background = "#2a2a2a";
        details.style.border = "1px solid #444";
        details.style.overflowY = "auto";   /* 🔴 Прокрутка ТОЛЬКО здесь */
        details.style.overflowX = "hidden";
        details.style.maxHeight = "100%";  /* Занимает всё доступное пространство */
        variablesContainer.appendChild(details);
    }

    // === ОБНОВЛЕНИЕ СОДЕРЖИМОГО ===
    function updateVariablesContent() {
        details.innerHTML = '';
        const fragment = document.createDocumentFragment();

        varKeys.sort().forEach(key => {
            const value = globalVars[key];
            const div = document.createElement('div');
            div.style.padding = '2px 0';
            div.style.fontSize = '12px';
            div.style.borderBottom = '1px solid #555';

            let color = typeof value === 'number' ? '#4caf50' :
                       typeof value === 'boolean' ? '#2196f3' :
                       typeof value === 'string' ? '#ff9800' :
                       value === null ? '#9e9e9e' :
                       Array.isArray(value) ? '#e91e63' :
                       typeof value === 'object' ? '#8bc34a' :
                       '#ffffff';

            const keySpan = document.createElement('span');
            keySpan.textContent = key + ': ';
            keySpan.style.color = '#bbbbbb';

            const valueSpan = document.createElement('span');
            valueSpan.style.color = color;

            // Безопасное отображение значений
            let stringValue;
            try {
                stringValue = JSON.stringify(value);
                if (stringValue && stringValue.length > 50) {
                    stringValue = stringValue.substring(0, 50) + '…';
                    valueSpan.title = JSON.stringify(value); // Подсказка при наведении
                }
            } catch (e) {
                stringValue = String(value).substring(0, 50) + '…';
                valueSpan.title = String(value);
            }

            valueSpan.textContent = stringValue;

            div.appendChild(keySpan);
            div.appendChild(valueSpan);
            fragment.appendChild(div);
        });

        details.appendChild(fragment);

        // Сообщение, если после фильтрации нет переменных
        if (varKeys.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.color = '#aaa';
            emptyDiv.style.fontSize = '12px';
            emptyDiv.style.textAlign = 'center';
            emptyDiv.textContent = 'No defined variables';
            details.innerHTML = '';
            details.appendChild(emptyDiv);
        }
    }

    // Обновляем содержимое, если раскрыто или контейнер пуст
    if (isExpanded || details.children.length === 0) {
        updateVariablesContent();
    }

    lastVarCount = currentVarCount;
}

    // === ОБНОВЛЕНИЕ ОБЩЕГО СПИСКА (с дебаунсом и проверкой видимости) ===
    function updateObjectsList() {
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_INTERVAL) return;
        if (!Game.allObject || !Game.helper.debug) return;
        if (container.style.width === '0px' || container.style.opacity === '0') return;

        lastUpdateTime = now;

        const currentObjects = Game.allObject;
        const currentCount = currentObjects.length;

        // Обновляем счётчик
        const timerInfo = Game.duc_helper_global_game_timers;
        const timerCount = Array.isArray(timerInfo) ? timerInfo.length : 0;
        const avgTime = timerInfo.lengthAvg !== undefined ? timerInfo.lengthAvg.toFixed(2) : '?';
        counterElement.textContent = `${Blockly.Msg['OBJECTS']}: ${currentCount} | ${Blockly.Msg['VARIABLES']}: ${Object.keys(Game.helper.globalArray || {}).length} | ${Blockly.Msg['TIMERS']}: ${avgTime}`;

        // === ОБНОВЛЕНИЕ ОБЪЕКТОВ ===
        const currentIds = new Set();
        const indexMap = new Map();

        currentObjects.forEach((obj, index) => {
            const id = getObjectId(obj, index);
            currentIds.add(id);
            indexMap.set(id, { obj, index });
        });

        // Удаляем устаревшие состояния
        for (const id of expandedStates.keys()) {
            if (!currentIds.has(id)) {
                expandedStates.delete(id);
            }
        }

        // Добавляем новые объекты
        for (const [id, { obj }] of indexMap) {
            if (!objectElements.has(id)) {
                const element = createObjectElement(obj, id);
                container.appendChild(element);
                objectElements.set(id, element);
            }
        }

        // Удаляем удалённые объекты
        for (const [id, element] of objectElements) {
            if (!currentIds.has(id)) {
                container.removeChild(element);
                objectElements.delete(id);
                expandedStates.delete(id);
            }
        }

        // Обновляем существующие
        for (const [id, { obj }] of indexMap) {
            const element = objectElements.get(id);
            if (element) {
                const nameSpan = element.querySelector(".debug-object-header span:first-child");
                if (nameSpan) {
                    const expectedName = obj.name || `Object ${indexMap.get(id).index}`;
                    if (nameSpan.textContent !== expectedName) {
                        nameSpan.textContent = expectedName;
                    }
                }
                const details = element.querySelector(".debug-object-details");
                if (details && expandedStates.get(id)) {
                    updateObjectDetails(details, obj);
                }
            }
        }

        lastObjectCount = currentCount;

        // === ОБНОВЛЕНИЕ ПЕРЕМЕННЫХ ===
        updateVariablesSection();
    }

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    function isObjectExpanded(obj) {
        return obj.__debugId ? expandedStates.get(obj.__debugId) : false;
    }

    // Инициализация
    Game.helper.debug = false;
    updateObjectsList(); // Первый вызов

    return {
        update: updateObjectsList,
        isObjectExpanded,
        getExpandedStates: () => new Map(expandedStates),
        getObjectElements: () => new Map(objectElements),
        getVarExpandedState: () => varExpandedStates.get('vars'),
        getGlobalVars: () => ({ ...Game.helper.globalArray })
    };
}

// Инициализация панели
const objectsDebugPanel = initObjectsDebugPanel();