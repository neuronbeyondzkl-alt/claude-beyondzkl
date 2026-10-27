"""Particle formations for the Determined video.

Every formation is a pure function of time: get(name, t) returns
(pos[N,3], col[N,3] linear RGB, inten[N]). Nothing carries state from
frame to frame, so any frame can be rendered by any worker process.

World units: y up, 1 unit = 540 px at z = 0 (camera distance 4).
"""
import zlib

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import timeline as TL

N = 24000
T = TL.T


def lin(hexs):
    h = hexs.lstrip("#")
    c = np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)]) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


PAL = {k: lin(v) for k, v in {
    "white": TL.L10, "ice": TL.L30, "b1": TL.L40, "b2": TL.L50, "b3": TL.L60, "b4": TL.L70,
    "ember": TL.EMBER, "ember_hi": TL.EMBER_HI, "gold": "#F6C08A",
}.items()}


def colors(rng, n, spec):
    names = [s[0] for s in spec]
    w = np.array([s[1] for s in spec], float)
    idx = rng.choice(len(names), size=n, p=w / w.sum())
    c = np.stack([PAL[k] for k in names])[idx]
    return c * rng.uniform(0.85, 1.15, (n, 1))


def rot_y(p, a):
    c, s = np.cos(a), np.sin(a)
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    return np.stack([c * x + s * z, y, -s * x + c * z], 1)


def rot_x(p, a):
    c, s = np.cos(a), np.sin(a)
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    return np.stack([x, c * y - s * z, s * y + c * z], 1)


def rot_z(p, a):
    c, s = np.cos(a), np.sin(a)
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    return np.stack([c * x - s * y, s * x + c * y, z], 1)


def place(p, scale, off):
    return p * scale + np.asarray(off, float)


def smooth(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0, 1)
    return u * u * (3 - 2 * u)


def poly_sample(rng, n, segs, thick):
    """Sample n points along a list of polylines (each (k,3)), uniform by length."""
    a = np.concatenate([s[:-1] for s in segs])
    b = np.concatenate([s[1:] for s in segs])
    ln = np.linalg.norm(b - a, axis=1) + 1e-9
    pick = rng.choice(len(a), size=n, p=ln / ln.sum())
    u = rng.random(n)[:, None]
    p = a[pick] + (b[pick] - a[pick]) * u
    return p + rng.normal(0, thick, (n, 3)), pick, u[:, 0]


def mask_points(rng, n, size, draw_fn, xform):
    img = Image.new("L", size, 0)
    draw_fn(ImageDraw.Draw(img))
    a = np.asarray(img) > 127
    ys, xs = np.nonzero(a)
    k = rng.integers(0, len(xs), n)
    x = xs[k] + rng.random(n)
    y = ys[k] + rng.random(n)
    return xform(x, y)


HEAD_POLY = [(360, 980), (370, 860), (350, 780), (300, 700), (255, 600), (240, 500), (250, 400),
             (285, 300), (345, 215), (430, 160), (530, 135), (620, 140), (700, 170), (760, 220),
             (795, 290), (810, 360), (815, 400), (812, 420), (800, 440), (815, 470), (860, 545),
             (868, 560), (850, 575), (820, 585), (825, 600), (830, 620), (815, 635), (825, 650),
             (818, 670), (800, 690), (810, 720), (805, 755), (785, 775), (740, 790), (690, 800),
             (650, 820), (640, 900), (650, 980)]
HEAD_LOCAL = np.array([((x - 555) / 420.0, (560 - y) / 420.0) for x, y in HEAD_POLY])
HEAD_BRAIN = np.array([-0.05, 0.45, 0.0])

HEADS = {  # placement (centre, scale), ember share, extras
    "head": ((0.2, 0.33, 0.0), 0.6, 0.33),
    "head_lit": ((0.2, 0.33, 0.0), 0.6, 0.45),
    "head_soft": ((-0.75, 0.05, 0.0), 0.55, 0.12),
    "head_warm": ((-0.72, 0.0, 0.0), 0.62, 0.55),
    "head_title": ((0.2, 0.33, 0.0), 0.6, 0.35),
    "puppet": ((0.98, 0.0, 0.0), 0.52, 0.30),
}
CHAIN_OFF, CHAIN_S = (0.0, 0.36, 0.0), 0.55
DROP_OFF, DROP_S = (0.0, 0.3, 0.0), 0.62

BRAIN_POLY = [(150, 430), (120, 340), (140, 250), (200, 170), (290, 110), (400, 75), (520, 65),
              (640, 80), (740, 120), (820, 180), (870, 260), (885, 340), (870, 410), (830, 460),
              (760, 480), (690, 470), (640, 500), (620, 560), (560, 600), (470, 610), (400, 590),
              (330, 560), (300, 600), (240, 610), (180, 580), (150, 530)]
STEM_POLY = [(360, 570), (350, 680), (395, 690), (420, 595)]

FAMILY = {  # morphs inside a family keep particle identity
    "head": "head", "head_lit": "head", "head_soft": "head", "head_warm": "head",
    "head_title": "head", "dust": "dust", "dust_calm": "dust", "dust_out": "dust",
    "network": "network", "synapse": "network", "brain": "brain", "brain_blue": "brain",
}


class Formations:
    def __init__(self, seed=7):
        self.rng = np.random.default_rng(seed)
        r = self.rng
        self.R = r.random((N, 8))
        self.perm = {}
        self._head()
        self._dust()
        self._network()
        self._neuron()
        self._waves()
        self._molecule()
        self._dendrite()
        self._brain()
        self._rings()
        self._embryo()
        self._dna()
        self._globe()
        self._tree()
        self._lorenz()
        self._quantum()
        self._puppet()
        self._pyramid()
        self._misc()

    # ------------------------------------------------------------ helpers
    def permute(self, name, pos, col, inten):
        fam = FAMILY.get(name, name)
        if fam not in self.perm:
            self.perm[fam] = np.random.default_rng(zlib.crc32(fam.encode())).permutation(N)
        p = self.perm[fam]
        return pos[p], col[p], inten[p]

    def get(self, name, t):
        fn = getattr(self, "f_" + name)
        pos, col, inten = fn(t)
        return self.permute(name, pos, col, inten)

    # ------------------------------------------------------------ head (cover homage)
    def _head(self):
        r = self.rng
        poly = [tuple(p) for p in HEAD_POLY]
        x, y = mask_points(r, N, (1000, 1000), lambda d: d.polygon(poly, fill=255),
                           lambda x, y: ((x - 555) / 420.0, (560 - y) / 420.0))
        # dots dissolve toward the back of the head like the cover
        w = np.clip((-0.15 - x) / 0.6, 0, 1) ** 1.3
        drift = r.exponential(0.32, N) * w * (r.random(N) < 0.75)
        x = x - drift
        y = y + r.normal(0, 0.08, N) * w
        far = r.random(N) < 0.07
        x[far] -= r.uniform(0.2, 1.4, far.sum())
        y[far] += r.normal(0, 0.25, far.sum())
        rr = np.sqrt(((x + 0.02) / 0.8) ** 2 + (y / 1.05) ** 2)
        z = 0.32 * np.sqrt(np.clip(1 - rr ** 2, 0, 1)) * np.where(r.random(N) < 0.5, 1, -1)
        self.head_p = np.stack([x, y, z], 1)
        self.head_blue = colors(r, N, [("b1", 4), ("b2", 3), ("ice", 2), ("b3", 1.5)])
        self.head_ember = colors(r, N, [("ember", 5), ("ember_hi", 2), ("gold", 0.6)])
        self.head_brain = np.exp(-(((x - HEAD_BRAIN[0]) / 0.45) ** 2 + ((y - HEAD_BRAIN[1]) / 0.35) ** 2))

    def head_world(self, name, t):
        off, s, ember = HEADS[name]
        p = rot_y(self.head_p, 0.14 * np.sin(0.45 * t))
        p = p * (1 + 0.008 * np.sin(2.0 * t))
        return place(p, s, off), ember

    def _head_fn(self, name, t):
        R = self.R
        p, ember = self.head_world(name, t)
        is_ember = R[:, 1] < ember
        col = np.where(is_ember[:, None], self.head_ember, self.head_blue)
        inten = 0.85 + 0.35 * np.sin(2.3 * t + 6.28 * R[:, 0])
        if name in ("head_lit", "head_warm"):
            pulse = 0.5 + 0.5 * np.sin(2 * np.pi * t / TL.BEAT)
            inten = inten * (1 + 1.2 * self.head_brain * pulse)
        if name == "head_warm":
            off, s, _ = HEADS[name]
            m = R[:, 2] < 0.16
            u = (0.22 * t + R[:, 3]) % 1.0
            p = p.copy()
            p[m, 1] += u[m] * 1.7
            p[m, 0] += 0.12 * np.sin(5 * u[m] + 6.28 * R[m, 4]) * u[m]
            inten = np.where(m, inten * (1 - u) ** 1.3 * 1.4, inten)
        return p, col, inten

    def f_head(self, t):
        return self._head_fn("head", t)

    def f_head_lit(self, t):
        return self._head_fn("head_lit", t)

    def f_head_soft(self, t):
        return self._head_fn("head_soft", t)

    def f_head_warm(self, t):
        return self._head_fn("head_warm", t)

    def f_head_title(self, t):
        return self._head_fn("head_title", t)

    # ------------------------------------------------------------ dust / point
    def _dust(self):
        r = self.rng
        self.dust_p = np.stack([r.uniform(-3.4, 3.4, N), r.uniform(-2.0, 2.0, N), r.uniform(-4.0, 0.9, N)], 1)
        self.dust_c = colors(r, N, [("b2", 4), ("b3", 3), ("b1", 2), ("ember", 0.9)])
        self.point_c = colors(r, N, [("white", 3), ("ice", 3), ("ember_hi", 1.5)])

    def _dust_fn(self, t, speed=1.0, spread=0.0, level=0.42):
        R = self.R
        ph = 6.28 * R[:, :3]
        d = 0.08 * np.sin(0.35 * speed * t + ph)
        p = self.dust_p * (1 + spread) + d
        inten = level * (0.55 + 0.45 * np.sin(1.3 * t + 6.28 * R[:, 4])) * (0.15 + 1.6 * R[:, 5] ** 4)
        return p, self.dust_c, inten

    def f_dust(self, t):
        return self._dust_fn(t)

    def f_dust_calm(self, t):
        return self._dust_fn(t, 0.6, 0.0, 0.32)

    def f_dust_out(self, t):
        u = max(0.0, t - T(62, 2))
        return self._dust_fn(t, 1.0, 0.35 * u, 0.4 * max(0.0, 1 - u / 3.0))

    def f_point(self, t):
        R = self.R
        g = np.stack([np.cos(6.28 * R[:, 0]) * np.sqrt(1 - (2 * R[:, 1] - 1) ** 2),
                      np.sin(6.28 * R[:, 0]) * np.sqrt(1 - (2 * R[:, 1] - 1) ** 2), 2 * R[:, 1] - 1], 1)
        rad = 0.045 * R[:, 2] ** 0.5 * (1 + 0.25 * np.sin(9 * t))
        p = rot_z(g * rad[:, None], 3.0 * t)
        return p, self.point_c, np.full(N, 0.32)

    # ------------------------------------------------------------ network / synapse
    def _network(self):
        r = self.rng
        K = 70
        nodes = np.stack([r.uniform(-1, 1, K) * 2.5, r.uniform(-1, 1, K) * 1.25, r.uniform(-1, 1, K) * 1.1], 1)
        nodes[0] = 0
        d = np.linalg.norm(nodes[:, None] - nodes[None], axis=2)
        edges = set()
        for i in range(K):
            for j in np.argsort(d[i])[1:4]:
                edges.add((min(i, j), max(i, j)))
        edges = np.array(sorted(edges))
        self.net_nodes, self.net_edges = nodes, edges
        n_node = int(N * 0.22)
        ni = r.integers(0, K, n_node)
        self.net_node_idx = ni
        self.net_node_off = r.normal(0, 0.035, (n_node, 3))
        a, b = nodes[edges[:, 0]], nodes[edges[:, 1]]
        ln = np.linalg.norm(b - a, axis=1)
        n_edge = N - n_node
        ei = r.choice(len(edges), n_edge, p=ln / ln.sum())
        self.net_ei = ei
        self.net_s = r.random(n_edge)
        self.net_jit = r.normal(0, 0.008, (n_edge, 3))
        self.net_speed = r.uniform(0.25, 0.7, len(edges))
        self.net_phase = r.random(len(edges))
        mid = (a + b) / 2
        order = np.argsort(np.linalg.norm(mid * [1, 1.6, 1], axis=1))
        rank = np.empty(len(edges))
        rank[order] = np.arange(len(edges)) / len(edges)
        self.net_rank = rank
        self.net_col = np.concatenate([colors(r, n_node, [("white", 2), ("ice", 3), ("ember_hi", 1.6)]),
                                       colors(r, n_edge, [("b1", 3), ("b2", 3), ("b3", 2)])])

    def _net_fn(self, t, grow=None, rot=0.12):
        nodes, edges = self.net_nodes, self.net_edges
        ei, s = self.net_ei, self.net_s
        a, b = nodes[edges[ei, 0]], nodes[edges[ei, 1]]
        if grow is None:
            k = np.ones(len(ei))
        else:
            k = np.clip((grow - self.net_rank[ei]) / 0.08, 0, 1)
        pe = a + (b - a) * (s * k)[:, None] + self.net_jit
        pn = nodes[self.net_node_idx] + self.net_node_off
        p = np.concatenate([pn, pe])
        p = rot_x(rot_y(p, rot * t), 0.18)
        pp = (t * self.net_speed[ei] + self.net_phase[ei]) % 1.0
        boost = 2.6 * np.exp(-((s - pp) / 0.05) ** 2)
        ie = 0.5 * (1 + boost)
        if grow is not None:
            front = np.exp(-((s * 1.0 - k) / 0.05) ** 2) * (k < 1) * (k > 0)
            ie = np.where(k > 0, ie + 3.0 * front, 0.0)
            node_on = np.ones(len(pn))
            rank_node = np.linalg.norm(nodes[self.net_node_idx] * [1, 1.6, 1], axis=1) / 3.2
            node_on = smooth(rank_node, rank_node + 0.08, grow)
            inn = 0.9 * node_on
        else:
            inn = np.full(len(pn), 0.9)
        inten = np.concatenate([inn * (0.8 + 0.4 * np.sin(3 * t + 6.28 * self.R[: len(pn), 0])), ie])
        return p, self.net_col.copy(), inten

    def f_network(self, t):
        return self._net_fn(t)

    def f_synapse(self, t):
        g = 0.05 + 1.15 * np.clip((t - T(52)) / 4.5, 0, 1)
        p, c, i = self._net_fn(t, grow=g, rot=0.08)
        return p * [1.08, 1.05, 0.6], c, i

    # ------------------------------------------------------------ chain formations
    def _neuron(self):
        r = self.rng
        segs = []
        soma = np.array([-0.75, 0.0, 0.0])
        for k in range(7):
            ang = np.pi * (0.55 + 0.9 * k / 6) + r.normal(0, 0.12)
            self._branch(r, segs, soma + 0.15 * np.array([np.cos(ang), np.sin(ang), 0]), ang, 10, 0.055, 2)
        xs = np.linspace(-0.6, 1.25, 120)
        axon = np.stack([xs, 0.07 * np.sin(3.2 * xs), 0.03 * np.sin(2 * xs)], 1)
        term = []
        for k in range(6):
            ang = -0.7 + 1.4 * k / 5
            e = axon[-1] + 0.2 * np.array([np.cos(ang), np.sin(ang), r.normal(0, 0.2)])
            term.append(np.stack([axon[-1], (axon[-1] + e) / 2 + r.normal(0, 0.02, 3), e]))
        n_soma, n_den, n_ax = int(N * 0.2), int(N * 0.33), int(N * 0.33)
        n_term = N - n_soma - n_den - n_ax
        g = r.normal(0, 1, (n_soma, 3))
        g /= np.linalg.norm(g, axis=1, keepdims=True)
        soma_p = soma + g * 0.15 * r.random(n_soma)[:, None] ** 0.3
        den_p, _, _ = poly_sample(r, n_den, segs, 0.008)
        ax_p, pick, u = poly_sample(r, n_ax, [axon], 0.012)
        self.neu_s = (pick + u) / (len(axon) - 1)
        tp, _, _ = poly_sample(r, n_term, term, 0.01)
        bulbs = r.random(n_term) < 0.4
        ends = np.array([tt[-1] for tt in term])
        tp[bulbs] = ends[r.integers(0, len(ends), bulbs.sum())] + r.normal(0, 0.025, (bulbs.sum(), 3))
        self.neu_p = np.concatenate([soma_p, den_p, ax_p, tp])
        self.neu_ax = slice(n_soma + n_den, n_soma + n_den + n_ax)
        self.neu_c = np.concatenate([colors(r, n_soma, [("white", 2), ("ice", 3), ("ember_hi", 1)]),
                                     colors(r, n_den, [("b1", 3), ("b2", 3)]),
                                     colors(r, n_ax, [("ice", 2), ("b1", 3)]),
                                     colors(r, n_term, [("ember_hi", 2), ("ice", 2)])])

    def _branch(self, r, segs, start, ang, steps, step, depth):
        pts = [start]
        p = start.copy()
        for i in range(steps):
            ang += r.normal(0, 0.28)
            p = p + step * np.array([np.cos(ang), np.sin(ang), r.normal(0, 0.3)])
            pts.append(p.copy())
            if depth > 0 and r.random() < 0.22:
                self._branch(r, segs, p.copy(), ang + r.choice([-1, 1]) * r.uniform(0.4, 0.8),
                             steps - i - 1, step * 0.9, depth - 1)
        segs.append(np.array(pts))

    def f_neuron(self, t):
        p = rot_y(self.neu_p, 0.25 * np.sin(0.7 * t))
        p = place(p, CHAIN_S * 1.05, CHAIN_OFF)
        inten = np.full(N, 0.7)
        sp = ((t - T(12)) / TL.BEAT) % 1.0
        boost = 3.0 * np.exp(-((self.neu_s - sp) / 0.05) ** 2)
        col = self.neu_c.copy()
        ax = self.neu_ax
        col[ax] = col[ax] + (PAL["ember_hi"] - col[ax]) * np.clip(boost / 2.5, 0, 1)[:, None]
        inten[ax] *= 1 + boost
        return p, col, inten

    def _waves(self):
        r = self.rng
        n_eye = int(N * 0.42)
        th = r.uniform(0, 2 * np.pi, n_eye)
        part = r.random(n_eye)
        ex, ey = np.cos(th) * 0.95, np.sin(th) * 0.42 * np.abs(np.cos(th)) ** 0.2 * np.sign(np.sin(th))
        ir = 0.3 * np.sqrt(r.random(n_eye))
        ix, iy = ir * np.cos(th * 7), ir * np.sin(th * 7)
        sel = part < 0.45
        px = np.where(sel, ex, ix)
        py = np.where(sel, ey, iy)
        self.eye_p = np.stack([px, py, r.normal(0, 0.015, n_eye)], 1) + r.normal(0, 0.01, (n_eye, 3))
        self.eye_iris = ~sel
        self.wave_k = r.integers(0, 7, N - n_eye)
        self.wave_th = r.uniform(0, 2 * np.pi, N - n_eye)
        self.wave_c = np.concatenate([colors(r, n_eye, [("ice", 3), ("white", 1), ("b1", 2)]),
                                      colors(r, N - n_eye, [("b1", 3), ("b2", 3), ("ember", 0.8)])])
        self.wave_c[:n_eye][self.eye_iris] = colors(r, int(self.eye_iris.sum()), [("ember_hi", 2), ("gold", 1), ("ice", 1)])

    def f_waves(self, t):
        n_eye = len(self.eye_p)
        rad = 2.1 * (1 - ((0.55 * t + self.wave_k / 7.0) % 1.0)) + 0.35
        wp = np.stack([rad * np.cos(self.wave_th) * 1.35, rad * np.sin(self.wave_th), np.zeros_like(rad)], 1)
        p = np.concatenate([self.eye_p, wp])
        p = place(rot_x(p, 0.25 * np.sin(0.5 * t)), CHAIN_S, CHAIN_OFF)
        inten = np.concatenate([np.full(n_eye, 0.85), 0.9 * np.clip(1.2 - rad / 2.4, 0, 1) ** 1.5])
        return p, self.wave_c, inten

    def _molecule(self):
        r = self.rng
        a = 0.32
        hexa = lambda c: [c + a * np.array([np.cos(np.pi / 6 + k * np.pi / 3), np.sin(np.pi / 6 + k * np.pi / 3)]) for k in range(6)]
        A = np.array([0.0, 0.0])
        B = A + [np.sqrt(3) * a, 0]
        C = B + [np.sqrt(3) * a / 2, 1.5 * a]
        Dc = C + [np.sqrt(3) * a / 2 + a / (2 * np.tan(np.pi / 5)), 0]
        Rp = a / (2 * np.sin(np.pi / 5))
        pent = [Dc + Rp * np.array([np.cos(np.pi + k * 2 * np.pi / 5), np.sin(np.pi + k * 2 * np.pi / 5)]) for k in range(5)]
        rings = [hexa(A), hexa(B), hexa(C), pent]
        atoms, bonds = [], []

        def aid(p):
            for i, q in enumerate(atoms):
                if np.linalg.norm(q - p) < 1e-3:
                    return i
            atoms.append(np.asarray(p, float))
            return len(atoms) - 1
        for ring in rings:
            ids = [aid(p) for p in ring]
            for i in range(len(ids)):
                bonds.append((ids[i], ids[(i + 1) % len(ids)]))
        left = min(range(len(atoms)), key=lambda i: atoms[i][0])
        right = max(range(len(atoms)), key=lambda i: atoms[i][0])
        o1 = aid(atoms[left] + [-a * 0.9, 0])
        o2 = aid(atoms[right] + [a * 0.6, a * 0.7])
        bonds += [(left, o1), (right, o2)]
        top = sorted(range(len(atoms)), key=lambda i: -atoms[i][1])[:2]
        for i in top:
            m = aid(atoms[i] + [0, a * 0.9])
            bonds.append((i, m))
        bonds = list({tuple(sorted(b)) for b in bonds})
        at = np.array([[p[0], p[1], 0.0] for p in atoms])
        at[:, :2] -= at[:, :2].mean(0)
        at *= 1.25
        self.mol_atoms = at
        n_at = int(N * 0.42)
        ai = r.integers(0, len(at), n_at)
        g = r.normal(0, 1, (n_at, 3))
        g /= np.linalg.norm(g, axis=1, keepdims=True)
        rad = np.where(np.isin(ai, [o1, o2]), 0.09, 0.065)
        pa = at[ai] + g * rad[:, None] * r.random(n_at)[:, None] ** 0.35
        segs = [np.stack([at[i], at[j]]) for i, j in bonds]
        pb, _, _ = poly_sample(r, N - n_at, segs, 0.01)
        self.mol_p = np.concatenate([pa, pb])
        ca = colors(r, n_at, [("white", 2), ("ice", 3), ("b1", 1)])
        ox = np.isin(ai, [o1, o2])
        ca[ox] = colors(r, int(ox.sum()), [("ember_hi", 3), ("ember", 2)])
        self.mol_c = np.concatenate([ca, colors(r, N - n_at, [("b1", 3), ("b2", 2)])])
        self.mol_isatom = np.arange(N) < n_at

    def f_molecule(self, t):
        p = rot_x(rot_y(self.mol_p, 0.6 * np.sin(0.8 * (t - T(14))) + 0.3), 0.2)
        p = place(p, CHAIN_S, CHAIN_OFF)
        beat = np.exp(-(((t - T(14)) % TL.BEAT) / 0.12))
        inten = np.where(self.mol_isatom, 0.75 * (1 + 0.6 * beat), 0.55)
        return p, self.mol_c, inten

    def _dendrite(self):
        r = self.rng
        segs, depth0, depth1 = [], [], []

        def grow(p, ang, length, lvl, d0, zang):
            e = p + length * np.array([np.cos(ang), np.sin(ang), np.sin(zang) * 0.5])
            pts = np.stack([p + (e - p) * u + r.normal(0, 0.012 * length, 3) * (0 < u < 1)
                            for u in np.linspace(0, 1, 6)])
            segs.append(pts)
            depth0.append(d0)
            depth1.append(d0 + length)
            if lvl < 7:
                for k in range(2 if r.random() < 0.7 else 3):
                    grow(e, ang + r.uniform(-0.65, 0.65), length * r.uniform(0.66, 0.8), lvl + 1,
                         d0 + length, zang + r.normal(0, 0.5))
        for k in range(3):
            grow(np.array([0.0, -1.05, 0.0]), np.pi / 2 + (k - 1) * 0.5, 0.42, 0, 0.0, r.normal(0, 0.4))
        p, pick, u = poly_sample(r, N, segs, 0.006)
        nseg = np.array([len(s) - 1 for s in segs])
        owner = np.repeat(np.arange(len(segs)), nseg)[pick]
        start = np.concatenate([[0], np.cumsum(nseg)[:-1]])
        f = (pick - start[owner] + u) / nseg[owner]
        d0, d1 = np.array(depth0)[owner], np.array(depth1)[owner]
        d = d0 + (d1 - d0) * f
        self.den_p = p
        self.den_d = d / d.max()
        self.den_c = colors(r, N, [("b1", 3), ("ice", 2), ("b2", 2), ("ember_hi", 0.6)])

    def f_dendrite(self, t):
        g = 0.12 + 1.0 * np.clip((t - T(15)) / 1.8, 0, 1)
        vis = smooth(0.0, 0.04, g - self.den_d)
        front = np.exp(-((self.den_d - g) / 0.025) ** 2)
        p = place(rot_y(self.den_p, 0.3 * np.sin(0.5 * t)), CHAIN_S * 0.95, CHAIN_OFF)
        col = self.den_c + (PAL["ember_hi"] - self.den_c) * np.clip(front, 0, 1)[:, None]
        return p, col, 0.7 * vis + 3.0 * front

    def _brain(self):
        r = self.rng
        xf = lambda x, y: ((x - 500) / 400.0, (360 - y) / 400.0)

        def draw(d):
            d.polygon([tuple(p) for p in BRAIN_POLY], fill=255)
            d.polygon([tuple(p) for p in STEM_POLY], fill=255)
        x, y = mask_points(r, N * 3, (1000, 760), draw, xf)
        f = (np.sin(7.1 * x + 2.0 * np.sin(5.3 * y)) + np.sin(6.3 * y + 1.7 * np.sin(4.1 * x) + 1.0)
             + 0.6 * np.sin(13 * x + 11 * y))
        band = np.abs(np.sin(f * 2.2)) < 0.42
        img = Image.new("L", (1000, 760), 0)
        draw(ImageDraw.Draw(img))
        edge = np.asarray(img.filter(ImageFilter.FIND_EDGES)) > 0
        ey, ex = np.nonzero(edge)
        keep = np.nonzero(band)[0][: int(N * 0.8)]
        ne = N - len(keep)
        k = r.integers(0, len(ex), ne)
        exx, eyy = xf(ex[k] + r.random(ne), ey[k] + r.random(ne))
        bx = np.concatenate([x[keep], exx])
        by = np.concatenate([y[keep], eyy])
        bz = 0.25 * np.sqrt(np.clip(1 - (bx / 0.95) ** 2 - (by / 0.75) ** 2, 0, 1)) * np.where(r.random(N) < 0.5, 1, -1)
        self.brain_p = np.stack([bx, by, bz], 1)
        self.brain_front = smooth(0.25, 0.5, bx) * (by > -0.35)
        self.brain_blue = colors(r, N, [("b1", 3), ("b2", 3), ("ice", 2)])
        self.brain_hot = colors(r, N, [("ember_hi", 3), ("ember", 2), ("gold", 1)])

    def f_brain(self, t):
        p = place(rot_y(self.brain_p, 0.35 * np.sin(0.6 * t)), CHAIN_S * 1.15, CHAIN_OFF)
        fr = self.brain_front
        flick = (np.sin(37 * t + 50 * self.R[:, 0]) > 0.2).astype(float)
        col = self.brain_blue + (self.brain_hot - self.brain_blue) * fr[:, None]
        inten = 0.65 * (1 - fr) + fr * (0.25 + 0.9 * flick * self.R[:, 1])
        return p, col, inten

    def f_brain_blue(self, t):
        p = place(rot_y(self.brain_p, 0.3 * np.sin(0.5 * t)), 0.62, (0.0, 0.32, 0.0))
        x = self.brain_p[:, 0]
        wave = np.maximum(0, np.sin(2 * np.pi * (t * 1.0) - x * 5.0)) ** 6
        inten = 0.5 + 1.6 * wave
        col = self.brain_blue + (PAL["white"] - self.brain_blue) * (0.5 * wave)[:, None]
        return p, col, inten

    def _rings(self):
        r = self.rng
        K = 18
        k = r.integers(0, K, N)
        th = r.uniform(0, 2 * np.pi, N)
        base = 0.08 + 0.92 * ((k + 1) / K) ** 0.9
        ph = r.random((K, 3)) * 6.28
        wob = 1 + 0.05 * np.sin(3 * th + ph[k, 0]) + 0.03 * np.sin(7 * th + ph[k, 1])
        stress = np.isin(k, [5, 9, 13])
        rad = base * wob + r.normal(0, 0.006 + 0.01 * stress, N)
        p = np.stack([rad * np.cos(th), rad * np.sin(th), r.normal(0, 0.01, N)], 1)
        crack = r.random(N) < 0.06
        cr = r.random(crack.sum())
        p[crack] = np.stack([cr * 1.0 * np.cos(0.9) + r.normal(0, 0.012, crack.sum()),
                             cr * 1.0 * np.sin(0.9) + 0.04 * np.sin(cr * 30), np.zeros(crack.sum())], 1)
        self.ring_p = p
        self.ring_hot = stress | crack
        self.ring_c = colors(r, N, [("b1", 3), ("b2", 3), ("ice", 1)])
        self.ring_c[self.ring_hot] = colors(r, int(self.ring_hot.sum()), [("ember", 3), ("ember_hi", 2)])

    def f_rings(self, t):
        p = rot_x(rot_z(self.ring_p, 0.2 * t), -0.85)
        p = place(p, CHAIN_S * 1.15, CHAIN_OFF)
        inten = np.where(self.ring_hot, 1.0, 0.55)
        return p, self.ring_c, inten

    def _embryo(self):
        r = self.rng
        n_w, n_f, n_h, n_b = int(N * 0.3), int(N * 0.12), int(N * 0.25), 0
        n_b = N - n_w - n_f - n_h
        th = r.uniform(0, 2 * np.pi, n_w)
        womb = np.stack([np.cos(th), np.sin(th) * 1.0, np.zeros(n_w)], 1) * (1.0 + r.normal(0, 0.012, n_w))[:, None]
        rr = np.sqrt(r.random(n_f)) * 0.95
        th2 = r.uniform(0, 2 * np.pi, n_f)
        fluid = np.stack([rr * np.cos(th2), rr * np.sin(th2), r.normal(0, 0.1, n_f)], 1)
        hr = 0.3 * np.sqrt(r.random(n_h))
        th3 = r.uniform(0, 2 * np.pi, n_h)
        head = np.stack([0.2 + hr * np.cos(th3), 0.3 + hr * np.sin(th3), r.normal(0, 0.05, n_h)], 1)
        u = r.random(n_b)
        ang = np.deg2rad(-30 - 250 * u)
        thick = 0.2 * (1 - 0.7 * u)
        rad = 0.42 + r.normal(0, 1, n_b) * thick * 0.45
        body = np.stack([0.02 + rad * np.cos(ang) * 0.9, -0.02 + rad * np.sin(ang), r.normal(0, 0.06, n_b)], 1)
        self.emb_p = np.concatenate([womb, fluid, head, body])
        self.emb_c = np.concatenate([colors(r, n_w, [("b1", 3), ("ice", 2)]), colors(r, n_f, [("b3", 2), ("b2", 2)]),
                                     colors(r, n_h, [("ember_hi", 2), ("gold", 1), ("ice", 1)]),
                                     colors(r, n_b, [("ember", 2), ("ember_hi", 2), ("ice", 1)])])
        self.emb_i = np.concatenate([np.full(n_w, 0.7), np.full(n_f, 0.25), np.full(n_h, 0.8), np.full(n_b, 0.8)])

    def f_embryo(self, t):
        hb = np.exp(-(((t - T(18)) % TL.BEAT) / 0.09))
        p = self.emb_p * (1 + 0.035 * hb)
        p = place(rot_y(p, 0.25 * np.sin(0.6 * t)), CHAIN_S * 1.05, CHAIN_OFF)
        return p, self.emb_c, self.emb_i * (1 + 0.5 * hb)

    def _dna(self):
        r = self.rng
        n_s = int(N * 0.32)
        self.dna_x = np.concatenate([r.uniform(-1.75, 1.75, 2 * n_s), np.zeros(N - 2 * n_s)])
        self.dna_strand = np.concatenate([np.zeros(n_s), np.ones(n_s), np.full(N - 2 * n_s, 2)])
        rung = r.integers(0, 47, N - 2 * n_s)
        self.dna_x[2 * n_s:] = -1.75 + rung * 3.5 / 46
        self.dna_u = np.concatenate([np.zeros(2 * n_s), r.random(N - 2 * n_s)])
        self.dna_jit = r.normal(0, 0.014, (N, 3))
        c = np.concatenate([colors(r, n_s, [("ice", 3), ("b1", 2)]), colors(r, n_s, [("b1", 2), ("b2", 3)]),
                            np.zeros((N - 2 * n_s, 3))])
        rc = np.where((rung % 2 == 0)[:, None], colors(r, N - 2 * n_s, [("ember_hi", 2), ("ember", 1)]),
                      colors(r, N - 2 * n_s, [("white", 1), ("ice", 2)]))
        c[2 * n_s:] = rc
        self.dna_c = c

    def f_dna(self, t):
        x = self.dna_x
        a = x * 2 * np.pi * 0.62 + 1.6 * t
        R = 0.34
        ya, za = R * np.cos(a), R * np.sin(a)
        yb, zb = R * np.cos(a + np.pi), R * np.sin(a + np.pi)
        s = self.dna_strand
        u = self.dna_u
        y = np.where(s == 0, ya, np.where(s == 1, yb, ya + (yb - ya) * u))
        z = np.where(s == 0, za, np.where(s == 1, zb, za + (zb - za) * u))
        p = np.stack([x, y, z], 1) + self.dna_jit
        p = place(rot_z(p, 0.12), CHAIN_S * 1.05, CHAIN_OFF)
        inten = np.where(s == 2, 0.6, 0.75) * (0.75 + 0.25 * np.cos(a - 0.6))
        return p, self.dna_c, inten

    def _globe(self):
        r = self.rng
        M = 90000
        i = np.arange(M) + 0.5
        phi = np.arccos(1 - 2 * i / M)
        th = np.pi * (1 + 5 ** 0.5) * i
        sp = np.stack([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)], 1)
        land_f = (np.sin(3 * sp[:, 0] + 1.3) + np.sin(2.5 * sp[:, 1] + 2) + np.sin(3.7 * sp[:, 2] + 0.5)
                  + 0.5 * np.sin(7 * sp[:, 0] + 5 * sp[:, 1]))
        land = sp[land_f > 0.75]
        n_land, n_grid, n_city = int(N * 0.5), int(N * 0.14), int(N * 0.18)
        n_arc = N - n_land - n_grid - n_city
        pl = land[r.integers(0, len(land), n_land)] * 0.92
        lat = r.integers(-4, 5, n_grid // 2) * np.pi / 10
        lo = r.uniform(0, 2 * np.pi, n_grid // 2)
        g1 = np.stack([np.cos(lat) * np.cos(lo), np.sin(lat), np.cos(lat) * np.sin(lo)], 1)
        lo2 = r.integers(0, 12, n_grid - n_grid // 2) * np.pi / 6
        la2 = r.uniform(-np.pi / 2, np.pi / 2, n_grid - n_grid // 2)
        g2 = np.stack([np.cos(la2) * np.cos(lo2), np.sin(la2), np.cos(la2) * np.sin(lo2)], 1)
        pg = np.concatenate([g1, g2]) * 0.92
        centers = land[r.integers(0, len(land), 36)] * 0.92
        ci = r.integers(0, 36, n_city)
        pc = centers[ci] + r.normal(0, 0.025, (n_city, 3))
        pairs = [(r.integers(36), r.integers(36)) for _ in range(14)]
        segs = []
        for a_, b_ in pairs:
            A, B = centers[a_], centers[b_]
            ss = np.linspace(0, 1, 30)[:, None]
            v = A * (1 - ss) + B * ss
            v = v / np.linalg.norm(v, axis=1, keepdims=True) * (0.92 + 0.28 * np.sin(np.pi * ss))
            segs.append(v)
        pa, pick, u = poly_sample(r, n_arc, segs, 0.004)
        self.glb_arc_s = (pick % 29 + u) / 29
        self.glb_p = np.concatenate([pl, pg, pc, pa])
        self.glb_c = np.concatenate([colors(r, n_land, [("b1", 3), ("b2", 2), ("ice", 1)]),
                                     colors(r, n_grid, [("b3", 2), ("b4", 1)]),
                                     colors(r, n_city, [("ember_hi", 3), ("gold", 2), ("white", 1)]),
                                     colors(r, n_arc, [("ember", 2), ("ice", 2)])])
        self.glb_i = np.concatenate([np.full(n_land, 0.6), np.full(n_grid, 0.3), np.full(n_city, 1.0), np.full(n_arc, 0.6)])
        self.glb_n_arc = n_arc

    def f_globe(self, t):
        p = rot_x(rot_y(self.glb_p, 0.45 * t), 0.4)
        p = place(p, CHAIN_S * 1.1, CHAIN_OFF)
        inten = self.glb_i.copy()
        s = self.glb_arc_s
        pp = (t * 0.8) % 1.0
        inten[-self.glb_n_arc:] *= 1 + 2.5 * np.exp(-((s - pp) / 0.06) ** 2)
        return p, self.glb_c, inten

    def _tree(self):
        r = self.rng
        segs, leaves = [], []

        def node(level, a0, a1, rad):
            am = (a0 + a1) / 2
            if level == 7:
                leaves.append(np.array([rad * np.cos(am), rad * np.sin(am), 0]))
                return am
            k = 2 if r.random() < 0.8 else 3
            cuts = np.sort(r.uniform(a0, a1, k - 1))
            bounds = [a0, *cuts, a1]
            child_angles = []
            r2 = rad + r.uniform(0.09, 0.15)
            for i in range(k):
                ca = node(level + 1, bounds[i], bounds[i + 1], r2)
                child_angles.append(ca)
                rr = np.linspace(rad, r2, 6)
                segs.append(np.stack([rr * np.cos(ca), rr * np.sin(ca), np.zeros(6)], 1))
            arc = np.linspace(min(child_angles), max(child_angles), 16)
            segs.append(np.stack([rad * np.cos(arc), rad * np.sin(arc), np.zeros(16)], 1))
            return am
        node(0, 0, 2 * np.pi, 0.0)
        n_leaf = int(N * 0.18)
        lv = np.array(leaves)
        pl = lv[r.integers(0, len(lv), n_leaf)] + r.normal(0, 0.012, (n_leaf, 3))
        pe, _, _ = poly_sample(r, N - n_leaf, segs, 0.004)
        self.tree_p = np.concatenate([pl, pe])
        self.tree_p[:, :2] /= np.abs(self.tree_p[:, :2]).max()
        self.tree_c = np.concatenate([colors(r, n_leaf, [("ember_hi", 2), ("gold", 1), ("ice", 2)]),
                                      colors(r, N - n_leaf, [("b1", 3), ("b2", 3), ("ice", 1)])])
        self.tree_i = np.concatenate([np.full(n_leaf, 1.0), np.full(N - n_leaf, 0.5)])

    def f_tree(self, t):
        p = rot_x(rot_z(self.tree_p, 0.15 * t), 0.35)
        p = place(p, CHAIN_S * 1.05, CHAIN_OFF)
        return p, self.tree_c, self.tree_i * (0.85 + 0.15 * np.sin(3 * t + 6.28 * self.R[:, 0]))

    def f_tunnel(self, t):
        R = self.R
        K = 14
        k = (R[:, 0] * K).astype(int)
        z = 3.0 - ((k * 1.2 + 2.6 * (t - T(22))) % 16.8)
        th = R[:, 1] * 2 * np.pi
        seg = np.floor(th / (np.pi / 3))
        a0, a1 = seg * np.pi / 3, (seg + 1) * np.pi / 3
        f = (th - a0) / (np.pi / 3)
        x = (np.cos(a0) * (1 - f) + np.cos(a1) * f) * 1.3
        y = (np.sin(a0) * (1 - f) + np.sin(a1) * f) * 1.3
        p = np.stack([x, y, z], 1)
        p = rot_z(p, 0.15 * t)
        p[:, :2] += R[:, 2:4] * 0.02
        inten = smooth(-13.5, -7.0, z) * (1 - smooth(-1.0, 1.4, z)) * 0.7
        col = np.where((k % 4 == 0)[:, None], PAL["ember_hi"], np.where((k % 2 == 0)[:, None], PAL["b1"], PAL["ice"]))
        return p, col * (0.9 + 0.2 * R[:, 4:5]), inten

    def _lorenz(self):
        M = 70000
        s, rho, b = 10.0, 28.0, 8.0 / 3.0
        x, y, z = 1.0, 1.0, 20.0
        dt = 0.004
        out = np.empty((M + 2000, 3))

        def f(x, y, z):
            return s * (y - x), x * (rho - z) - y, x * y - b * z
        for i in range(M + 2000):
            a1, b1, c1 = f(x, y, z)
            a2, b2, c2 = f(x + dt / 2 * a1, y + dt / 2 * b1, z + dt / 2 * c1)
            a3, b3, c3 = f(x + dt / 2 * a2, y + dt / 2 * b2, z + dt / 2 * c2)
            a4, b4, c4 = f(x + dt * a3, y + dt * b3, z + dt * c3)
            x += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4)
            y += dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4)
            z += dt / 6 * (c1 + 2 * c2 + 2 * c3 + c4)
            out[i] = (x, y, z)
        tr = out[2000:]
        self.lor = np.stack([tr[:, 0] / 22.0, (tr[:, 2] - 25.0) / 22.0, tr[:, 1] / 22.0], 1)
        self.lor_c = colors(self.rng, N, [("ice", 3), ("b1", 3), ("b2", 2), ("ember_hi", 0.5)])

    def f_lorenz(self, t):
        M = len(self.lor)
        f = (self.R[:, 0] * M + 700.0 * t) % (M - 1)
        i = f.astype(int)
        w = (f - i)[:, None]
        p = self.lor[i] * (1 - w) + self.lor[i + 1] * w
        p = rot_x(rot_y(p, 0.45 * np.sin(0.35 * t)), 0.15)
        p = place(p, DROP_S * 0.95, (0.0, 0.34, 0.0))
        hot = self.R[:, 5] < 0.04
        return p, self.lor_c, np.where(hot, 1.8, 0.6)

    def f_swarm(self, t):
        """Murmuration: one twisting ribbon made of many tiny agents."""
        R = self.R
        u = R[:, 0]
        v = R[:, 1] * 2 - 1
        tw = 2 * np.pi * u
        c = np.stack([1.55 * np.sin(tw + 0.35 * t), 0.42 * np.sin(2 * tw + 0.8 * t) + 0.1 * np.sin(5 * tw - t),
                      0.6 * np.cos(tw + 0.5 * t)], 1)
        dc = np.stack([1.55 * np.cos(tw + 0.35 * t), 0.84 * np.cos(2 * tw + 0.8 * t), -0.6 * np.sin(tw + 0.5 * t)], 1)
        dc /= np.linalg.norm(dc, axis=1, keepdims=True)
        n1 = np.cross(dc, np.array([0.0, 1.0, 0.0]))
        n1 /= np.linalg.norm(n1, axis=1, keepdims=True) + 1e-6
        n2 = np.cross(dc, n1)
        phi = 3 * tw + 1.2 * t
        nrm = n1 * np.cos(phi)[:, None] + n2 * np.sin(phi)[:, None]
        width = 0.16 + 0.13 * np.sin(3 * tw - 1.1 * t)
        p = c + nrm * (v * width)[:, None] + (R[:, 2:5] - 0.5) * 0.035
        p += 0.012 * np.sin(6 * t + 6.28 * R[:, 3:6])
        p = place(p, DROP_S * 1.05, DROP_OFF)
        col = np.where((R[:, 6] < 0.08)[:, None], PAL["ember_hi"], np.where((R[:, 6] < 0.55)[:, None], PAL["b1"], PAL["ice"]))
        return p, col * (0.85 + 0.3 * R[:, 7:8]), np.full(N, 0.55)

    def _quantum(self):
        r = self.rng
        n1, n2 = int(N * 0.25), int(N * 0.45)
        n3 = N - n1 - n2
        s1 = r.normal(0, 0.16, (n1, 3))
        ax = r.integers(0, 3, n2)
        sign = np.where(r.random(n2) < 0.5, -1, 1)
        s2 = r.normal(0, 0.11, (n2, 3))
        s2[np.arange(n2), ax] = sign * np.abs(r.normal(0.5, 0.17, n2))
        th = r.uniform(0, 2 * np.pi, n3)
        s3 = np.stack([0.62 * np.cos(th), r.normal(0, 0.04, n3), 0.62 * np.sin(th)], 1) + r.normal(0, 0.05, (n3, 3))
        self.q_p = np.concatenate([s1, s2, s3])
        self.q_c = np.concatenate([colors(r, n1, [("white", 1), ("ice", 2)]), colors(r, n2, [("b1", 3), ("ice", 1), ("ember_hi", 0.6)]),
                                   colors(r, n3, [("b2", 2), ("b1", 2)])])

    def f_quantum(self, t):
        fr = int(round(t * TL.FPS))
        rf = np.random.default_rng(fr + 999)
        p = self.q_p + rf.normal(0, 0.012, (N, 3))
        tele = rf.random(N) < 0.06
        p[tele] = self.q_p[rf.integers(0, N, tele.sum())]
        p = rot_x(rot_y(p, 0.6 * t), 0.5)
        p = place(p, DROP_S * 1.15, DROP_OFF)
        return p, self.q_c, 0.15 + 1.2 * rf.random(N) ** 2

    def _puppet(self):
        r = self.rng
        n_s = int(N * 0.42)
        off, s, _ = HEADS["puppet"]
        target = HEAD_BRAIN * s + np.array(off)
        segs = []
        for k in range(18):
            src = np.array([r.uniform(-3.4, -1.4), r.uniform(-1.6, 1.8), r.uniform(-3.0, 0.3)])
            mid = (src + target) / 2 + np.array([0, r.uniform(-0.6, 0.6), 0])
            ss = np.linspace(0, 1, 40)[:, None]
            segs.append((1 - ss) ** 2 * src + 2 * (1 - ss) * ss * mid + ss ** 2 * target)
        p, pick, u = poly_sample(r, n_s, segs, 0.004)
        self.pup_sp = p
        self.pup_s = (pick % 39 + u) / 39
        self.pup_k = pick // 39
        self.pup_phase = r.random(18)
        self.pup_c = colors(r, n_s, [("b2", 3), ("b3", 2), ("b1", 1)])
        self.pup_n = n_s

    def f_puppet(self, t):
        ph, col_h, ih = self._head_fn("puppet", t)
        n_s = self.pup_n
        pp = (t * 0.55 + self.pup_phase[self.pup_k]) % 1.0
        boost = 3.0 * np.exp(-((self.pup_s - pp) / 0.035) ** 2)
        cs = self.pup_c + (PAL["ember_hi"] - self.pup_c) * np.clip(boost / 2, 0, 1)[:, None]
        p = np.concatenate([ph[n_s:], self.pup_sp])
        col = np.concatenate([col_h[n_s:], cs])
        inten = np.concatenate([ih[n_s:], 0.35 * (1 + boost)])
        return p, col, inten

    def _pyramid(self):
        r = self.rng
        apex = np.array([0, 0.75, 0])
        base = [np.array([np.cos(a), -0.55, np.sin(a)]) * [0.85, 1, 0.85] for a in np.arange(4) * np.pi / 2 + np.pi / 4]
        n_f, n_e = int(N * 0.6), int(N * 0.25)
        n_a = N - n_f - n_e
        fi = r.integers(0, 4, n_f)
        u, v = r.random(n_f), r.random(n_f)
        m = u + v > 1
        u[m], v[m] = 1 - u[m], 1 - v[m]
        B0 = np.stack(base)[fi]
        B1 = np.stack(base)[(fi + 1) % 4]
        pf = apex + (B0 - apex) * u[:, None] + (B1 - apex) * v[:, None]
        rows = np.round((pf[:, 1] + 0.55) / 1.3 * 16) / 16 * 1.3 - 0.55
        pf[:, 1] = rows + r.normal(0, 0.006, n_f)
        segs = [np.stack([apex, b]) for b in base] + [np.stack([base[i], base[(i + 1) % 4]]) for i in range(4)]
        pe, _, _ = poly_sample(r, n_e, segs, 0.006)
        pa = apex + r.normal(0, 0.05, (n_a, 3))
        self.pyr_p = np.concatenate([pf, pe, pa])
        self.pyr_c = np.concatenate([colors(r, n_f, [("b2", 3), ("b3", 2), ("b1", 1)]),
                                     colors(r, n_e, [("ice", 2), ("b1", 2)]),
                                     colors(r, n_a, [("gold", 2), ("ember_hi", 2), ("white", 1)])])
        self.pyr_i = np.concatenate([np.full(n_f, 0.45), np.full(n_e, 0.75), np.full(n_a, 1.0)])
        gx, gz = np.meshgrid(np.linspace(-3.2, 3.2, 200), np.linspace(-5.0, 1.6, 120))
        g = np.stack([gx.ravel(), np.zeros(gx.size), gz.ravel()], 1)
        self.plain_p = g[r.integers(0, len(g), N)] + r.normal(0, 0.006, (N, 3))
        self.plain_c = colors(r, N, [("b1", 3), ("ice", 2), ("b2", 2)])

    def f_pyramid(self, t):
        p = rot_x(rot_y(self.pyr_p, 0.5 * t), 0.12)
        return place(p, 0.68, (0.0, -0.32, 0.0)), self.pyr_c, self.pyr_i

    def f_plain(self, t):
        p = self.plain_p.copy()
        p[:, 1] = -0.5 + 0.025 * np.sin(3 * p[:, 0] + 2.0 * t) * np.sin(2 * p[:, 2] + t)
        inten = 0.55 * smooth(-5.0, -3.5, p[:, 2])
        return p, self.plain_c, inten

    # ------------------------------------------------------------ misc
    def _misc(self):
        r = self.rng
        self.fire_c = colors(r, N, [("ember", 4), ("ember_hi", 3), ("gold", 1.5), ("white", 0.3)])
        self.blue_c = colors(r, N, [("b1", 3), ("ice", 2), ("b2", 2)])
        self.hot_c = colors(r, N, [("ember_hi", 3), ("ember", 3), ("gold", 1), ("white", 0.4)])
        self.vort_c = colors(r, N, [("ice", 3), ("b1", 3), ("white", 1), ("ember_hi", 1)])

    def f_fire(self, t):
        """A pyre: five swaying flame tongues plus embers that rise and drift."""
        R = self.R
        ember = R[:, 7] < 0.4
        k = (R[:, 0] * 5).astype(int)
        u = (t * (1.1 + 0.6 * R[:, 1]) + R[:, 2]) % 1.0
        bx = (k - 2) * 0.13 + 0.05 * np.sin(1.3 * t + k)
        sway = 0.09 * np.sin(6 * u - 5 * t + k * 1.7) * u
        spread = (R[:, 3] - 0.5) * 0.22 * (1 - u) ** 0.6
        height = 0.55 + 0.55 * np.exp(-((k - 2) / 1.4) ** 2)
        fx = bx * (1 - 0.5 * u) + sway + spread
        fy = -0.3 + u * height
        ue = (t * (0.22 + 0.3 * R[:, 1]) + R[:, 2]) % 1.0
        ex = (R[:, 3] - 0.5) * 0.6 + 0.22 * np.sin(3 * ue + 6.28 * R[:, 4] + 0.6 * t) * ue
        ey = -0.2 + ue * 1.65
        x = np.where(ember, ex, fx)
        y = np.where(ember, ey, fy)
        z = (R[:, 5] - 0.5) * np.where(ember, 0.6, 0.2)
        p = np.stack([x * 1.5, y, z], 1)
        fl = 0.7 + 0.3 * np.sin(23 * t + 40 * R[:, 6])
        body = (1 - u) ** 1.3 * 0.95
        spark = (1 - ue) ** 0.7 * (0.5 + 2.4 * (R[:, 5] < 0.25))
        inten = np.where(ember, spark, body) * fl
        hot = (u < 0.22) & ~ember
        col = np.where(hot[:, None], PAL["gold"], self.fire_c)
        return p, col, inten

    def f_stream(self, t):
        R = self.R
        tau = t - T(44)
        if tau < 1:
            xh, v = -2.4 + 1.6 * tau, 1.6
        elif tau < 2:
            q = tau - 1
            xh, v = -0.8 + 1.6 * q - 0.8 * q * q, 1.6 - 1.6 * q
        else:
            xh, v = 0.0, 0.0
        s = R[:, 0] ** 1.8
        tail = 0.15 + 1.6 * v / 1.6
        jitter = 0.05 + 0.08 * s
        agit = 0.03 * (1 - v / 2) * np.sin(31 * t + 50 * R[:, 1:4])
        p = np.stack([xh - s * tail, 0.3 + (R[:, 4] - 0.5) * 2 * jitter, (R[:, 5] - 0.5) * 2 * jitter], 1) + agit
        clump = (1 - v / 1.6)
        d = np.stack([np.cos(6.28 * R[:, 6]) * np.sqrt(1 - (2 * R[:, 7] - 1) ** 2),
                      np.sin(6.28 * R[:, 6]) * np.sqrt(1 - (2 * R[:, 7] - 1) ** 2), 2 * R[:, 7] - 1], 1)
        g = d * (0.34 * R[:, 1:2] ** 0.6) + 0.03 * np.sin(29 * t + 60 * R[:, 2:5])
        p = p * (1 - clump) + (np.array([0, 0.3, 0]) + g) * clump
        return p, self.hot_c, (1.05 - s) ** 1.2 * (0.75 - 0.4 * clump)

    def f_contain(self, t):
        R = self.R
        m = R[:, 0] < 0.5
        g = np.stack([np.cos(6.28 * R[:, 1]) * np.sqrt(1 - (2 * R[:, 2] - 1) ** 2),
                      np.sin(6.28 * R[:, 1]) * np.sqrt(1 - (2 * R[:, 2] - 1) ** 2), 2 * R[:, 2] - 1], 1)
        core = g * (0.36 * R[:, 3:4] ** 0.6) + 0.035 * np.sin(29 * t + 60 * R[:, 4:7])
        th = 6.28 * R[:, 5]
        ring_id = (R[:, 6] < 0.5)
        ring = np.stack([0.66 * np.cos(th), 0.66 * np.sin(th), R[:, 7] * 0.02], 1)
        ring = np.where(ring_id[:, None], rot_x(rot_y(ring, 0.6 * t), 1.1), rot_y(rot_x(ring, -0.9), -0.45 * t + 1.0))
        p = np.where(m[:, None], core, ring) + np.array([0, 0.3, 0])
        col = np.where(m[:, None], self.hot_c, self.blue_c)
        hl = 0.5 + 0.5 * np.cos(th - 2.5 * t) ** 8
        inten = np.where(m, 0.3 + 0.2 * np.sin(17 * t + 9 * R[:, 2]), 0.35 + 1.0 * hl)
        return p, col, inten

    def f_vortex(self, t):
        R = self.R
        tau = max(0.0, t - T(50))
        u = min(1.0, tau / 4.0)
        phase = 0.6 * tau + tau ** 3 / 16.0
        rad = (1.75 - 0.95 * u ** 1.5)
        rho = 0.04 + R[:, 0] ** 0.7
        arm = (R[:, 1] * 4).astype(int)
        th = arm * np.pi / 2 + 2.6 * np.log(1 + 4 * rho) + phase * (0.6 / (rho + 0.25)) + (R[:, 2] - 0.5) * 0.35
        p = np.stack([rad * rho * np.cos(th), rad * rho * np.sin(th), (R[:, 3] - 0.5) * 0.08], 1)
        p = rot_x(p, 1.05)
        inten = 0.45 + 0.7 * u + 1.2 * np.exp(-rho / 0.08)
        return p, self.vort_c, inten * (0.8 + 0.2 * R[:, 4])
