// 户型数据（全部单位：毫米）
// 坐标原点 = ①轴 与 Ⓗ轴 的交点；X 向东（图纸右方），Z 向南（图纸下方），Y 向上。
// 所有数值由户型图按轴网比例换算（①–②–③–⑤ = 6250 / 4850 / 2250，Ⓗ–Ⓖ–Ⓔ–Ⓓ–Ⓒ = 2730 / 2470 / 2250 / 1150，
// 图纸约 12.9 mm/像素），再用图上标注的分尺寸（如 3200、2650、4650、2050、2400、1390 等）校正。

export const WALL_H = 2800;   // 墙高（无天花板，墙顶做剖切面处理）
export const DOOR_H = 2100;

export const AXES = {
  x: [{ id: '1', v: 0 }, { id: '2', v: 6250 }, { id: '3', v: 11100 }, { id: '5', v: 13350 }],
  z: [{ id: 'H', v: 0 }, { id: 'G', v: 2730 }, { id: 'E', v: 5200 }, { id: 'D', v: 7450 }, { id: 'C', v: 8600 }],
};

// 墙体：kind = struct（承重墙 / 柱，图中涂黑）| ext（外墙窗间墙）| part（内隔墙）
// open：沿墙长方向的洞口 a–b（毫米），y0–y1 为洞口底 / 顶标高
//   type: window 窗 | door 平开门 | slide 推拉门 | open 垭口
export const WALLS = [
  // —— 承重墙与柱 ——
  { id: 'W-west', kind: 'struct', x: [-200, 100], z: [-400, 9450],
    open: [{ a: 3880, b: 5200, y0: 900, y1: 2400, type: 'window', id: 'win-west', name: '衣帽间西窗', curtain: true }] },
  { id: 'C-NW', kind: 'struct', x: [100, 790], z: [-400, 710] },
  { id: 'C-SW', kind: 'struct', x: [100, 790], z: [8460, 9450] },
  { id: 'C-N2', kind: 'struct', x: [5340, 6350], z: [-400, 710] },
  { id: 'W-2N', kind: 'struct', x: [6060, 6350], z: [710, 2700] },
  { id: 'C-S2', kind: 'struct', x: [5350, 6350], z: [8460, 9450] },
  { id: 'W-2S', kind: 'struct', x: [6080, 6350], z: [4980, 8460] },
  { id: 'C-N3', kind: 'struct', x: [10440, 11270], z: [-400, 130] },
  { id: 'W-east', kind: 'struct', x: [13150, 13440], z: [-400, 2870] },
  { id: 'W-E', kind: 'struct', x: [10980, 13400], z: [5100, 5410] },
  { id: 'W-3S', kind: 'struct', x: [10980, 11300], z: [5410, 8610] },
  { id: 'C-S3', kind: 'struct', x: [10350, 11310], z: [8610, 9450] },
  { id: 'B-shaft-1', kind: 'struct', x: [100, 270], z: [710, 1190] },        // 主卫管井
  { id: 'B-shaft-2', kind: 'struct', x: [5690, 6060], z: [710, 1640] },      // 卫生间管井
  { id: 'B-shaft-3', kind: 'struct', x: [6060, 6350], z: [2700, 3810] },     // 洗手区管井
  { id: 'B-closet', kind: 'struct', x: [12480, 13150], z: [2870, 3810] },    // 入户设备间

  // —— 外墙（窗）——
  { id: 'E-N1', kind: 'ext', x: [790, 5340], z: [-70, 130], open: [
    { a: 900, b: 1560, y0: 1100, y1: 2300, type: 'window', id: 'win-mbath', name: '主卫北窗' },
    { a: 1880, b: 4300, y0: 500, y1: 2400, type: 'window', id: 'win-bed1', name: '次卧一北窗', curtain: true },
    { a: 4600, b: 5240, y0: 1100, y1: 2300, type: 'window', id: 'win-bath2', name: '卫生间北窗' },
  ] },
  { id: 'E-N2', kind: 'ext', x: [6350, 10440], z: [-70, 130], open: [
    { a: 6450, b: 8300, y0: 500, y1: 2400, type: 'window', id: 'win-study', name: '书房北窗', curtain: true },
    { a: 8600, b: 10340, y0: 900, y1: 2400, type: 'window', id: 'win-util', name: '生活阳台窗' },
  ] },
  { id: 'E-N3', kind: 'ext', x: [11270, 13150], z: [-70, 130], open: [
    { a: 11400, b: 12400, y0: 900, y1: 2300, type: 'window', id: 'win-kitchen', name: '厨房北窗' },
  ] },
  { id: 'E-S1', kind: 'ext', x: [790, 5350], z: [9000, 9200], open: [
    { a: 900, b: 3180, y0: 450, y1: 2500, type: 'window', id: 'win-master', name: '主卧南窗', curtain: true },
    { a: 3500, b: 5250, y0: 450, y1: 2500, type: 'window', id: 'win-bed2', name: '次卧二南窗', curtain: true },
  ] },
  { id: 'E-S2', kind: 'ext', x: [6350, 10350], z: [8650, 8850], open: [
    { a: 6450, b: 10250, y0: 100, y1: 2550, type: 'window', id: 'win-living', name: '客厅落地窗', curtain: true },
  ] },
  { id: 'E-door', kind: 'ext', x: [12480, 12600], z: [3810, 5100], open: [
    { a: 3900, b: 5050, y0: 0, y1: 2200, type: 'door', id: 'd-entry' },
  ] },

  // —— 内隔墙 ——
  { id: 'P-mbath-bed1', kind: 'part', x: [1660, 1780], z: [130, 3780] },
  { id: 'P-bed1-bath2', kind: 'part', x: [4400, 4500], z: [130, 3780] },
  { id: 'P-bath2-S', kind: 'part', x: [4500, 6060], z: [2580, 2700], open: [
    { a: 4520, b: 5320, y0: 0, y1: 2100, type: 'door', id: 'd-bath2' },
  ] },
  { id: 'P-mbath-S', kind: 'part', x: [100, 1660], z: [3180, 3300], open: [
    { a: 770, b: 1570, y0: 0, y1: 2100, type: 'door', id: 'd-mbath' },
  ] },
  { id: 'P-corr-N', kind: 'part', x: [1660, 6060], z: [3780, 3900], open: [
    { a: 3480, b: 4380, y0: 0, y1: 2100, type: 'door', id: 'd-bed1' },
    { a: 4560, b: 5610, y0: 0, y1: 2300, type: 'open', id: 'o-dry' },
  ] },
  { id: 'P-closet-E', kind: 'part', x: [2290, 2380], z: [3900, 5030] },
  { id: 'P-corr-S', kind: 'part', x: [2290, 6080], z: [5030, 5130], open: [
    { a: 2380, b: 3280, y0: 0, y1: 2100, type: 'door', id: 'd-master' },
    { a: 3470, b: 4370, y0: 0, y1: 2100, type: 'door', id: 'd-bed2' },
  ] },
  { id: 'P-master-bed2', kind: 'part', x: [3280, 3400], z: [5130, 9000] },
  { id: 'P-study-S', kind: 'part', x: [6350, 8500], z: [3810, 3900], open: [
    { a: 6890, b: 8020, y0: 0, y1: 2300, type: 'slide', id: 'sd-study-s' },
  ] },
  { id: 'P-study-E', kind: 'part', x: [8400, 8500], z: [130, 3810], open: [
    { a: 1550, b: 3330, y0: 0, y1: 2300, type: 'slide', id: 'sd-study-e' },
  ] },
  { id: 'P-util-S', kind: 'part', x: [8500, 10950], z: [1440, 1520], open: [
    { a: 8630, b: 10370, y0: 0, y1: 2300, type: 'slide', id: 'sd-util' },
  ] },
  { id: 'P-kitchen-W', kind: 'part', x: [10950, 11130], z: [130, 3810], open: [
    { a: 1540, b: 2870, y0: 0, y1: 2300, type: 'slide', id: 'sd-kitchen' },
  ] },
  { id: 'P-kitchen-S', kind: 'part', x: [11130, 12480], z: [3300, 3410] },
];

// 平开门：hinge = 'a' | 'b'（铰链在洞口哪一端），swing = +1 / -1（向坐标正 / 负方向开启）
export const DOORS = {
  'd-entry':  { name: '入户门', hinge: 'b', swing: -1, open: 0, thick: 70, style: 'entry',
    desc: '图纸标注净宽 1150 mm，内开。门扇做深胡桃木饰面配香槟金长拉手，比室内门更厚重，进门的第一印象就定下了整套房子的基调。' },
  'd-master': { name: '主卧门', hinge: 'b', swing: +1, open: 82,
    desc: '900 mm 宽平开门，向主卧内开启。与次卧二门之间只隔 200 mm 墙垛，两樘门并排处理成同一高度、同一饰面，过道立面更整齐。' },
  'd-bed2':   { name: '次卧二门', hinge: 'a', swing: +1, open: 82,
    desc: '900 mm 宽平开门，向次卧二内开启，开门后正对衣柜侧面，不会直接看到床。' },
  'd-bed1':   { name: '次卧一门', hinge: 'b', swing: -1, open: 82,
    desc: '900 mm 宽平开门，向北开向次卧一，门后贴着衣柜端头，开门不碰家具。' },
  'd-bath2':  { name: '卫生间门', hinge: 'a', swing: -1, open: 75,
    desc: '图纸标注 800 mm 门洞，向卫生间内开启。门外就是公共洗手区，干湿分离。' },
  'd-mbath':  { name: '主卫门', hinge: 'a', swing: -1, open: 75,
    desc: '800 mm 门洞（两侧各 70 mm 门套），从衣帽间进入主卫，形成「卧室 → 衣帽间 → 主卫」的套间动线。' },
};

export const SLIDERS = {
  'sd-study-s': { name: '书房南推拉门', leaves: 2, desc: '两扇玻璃推拉门，宽约 1130 mm，打开后书房与过道连通，关上又是安静的独立空间。' },
  'sd-study-e': { name: '书房东推拉门', leaves: 2, open: true, desc: '两扇玻璃推拉门，洞口约 1780 mm，正对餐厅。全部打开时书房、餐厅和客厅连成一个大的公共区。' },
  'sd-util':    { name: '生活阳台推拉门', leaves: 3, desc: '三联动玻璃推拉门，把洗衣、晾晒的生活阳台与餐厅隔开，既透光又挡住水汽和噪声。' },
  'sd-kitchen': { name: '厨房推拉门', leaves: 2, desc: '两扇长虹玻璃推拉门，洞口约 1330 mm。中式爆炒时关上隔油烟，平时打开与餐厅形成回游动线。' },
};

// 房间：poly 为净面积多边形（墙内皮）；面积由多边形自动计算
// floor：地面材质；wall：墙面默认饰面；feature：特色墙（side 为墙在房间的哪一侧）
// view：「进入房间」时的站位与视线（毫米）
export const ROOMS = [
  { id: 'entry', name: '玄关', en: 'ENTRANCE', zone: 'public',
    poly: [[11130, 3410], [12480, 3410], [12480, 5100], [10950, 5100], [10950, 3810], [11130, 3810]],
    floor: 'floorMarbleInlay', wall: 'paintWarm', label: [11720, 4450],
    view: { p: [12250, 4650], t: [9000, 4300] },
    desc: '入户门在东侧，净宽约 1150 mm。北面是一整面 400 mm 深的通顶鞋柜，中段留出开放台面放钥匙、香薰，柜底悬空方便放常穿的鞋。玄关没有隔墙，进门视线向西一直延伸到餐厅和客厅，小面积也不压抑。地面用浅色大理石拼花，标出「进门」的仪式感。' },
  { id: 'living', name: '会客厅', en: 'LIVING ROOM', zone: 'public',
    poly: [[6350, 5130], [10980, 5130], [10980, 8650], [6350, 8650]],
    floor: 'floorMarble', wall: 'paintWarm', label: [8650, 6900],
    feature: [{ side: 'W', finish: 'marbleSlab', from: 5130, to: 8650 }],
    view: { p: [10000, 5450], t: [6600, 7700] },
    desc: '图纸标注开间 4650 mm、进深约 3550 mm，是全屋最大的空间。西墙整面做大理石电视背景墙，下方是 400 mm 深的悬浮电视柜；东侧沿墙摆一组折线形模块沙发，围合出直径 1200 mm 的圆形大理石茶几，南侧两把单椅面向窗外的落地窗。北边不设隔墙，和餐厅、过道连成开放的公共区。' },
  { id: 'dining', name: '餐厅', en: 'DINING AREA', zone: 'public',
    poly: [[8500, 1520], [10950, 1520], [10950, 5130], [8500, 5130]],
    floor: 'floorMarble', wall: 'paintWarm', label: [9725, 3900],
    view: { p: [9200, 4900], t: [10200, 1900] },
    desc: '图纸标注 2500 × 2400 mm 的就餐区，加上南侧 1300 mm 的通行带。800 × 1800 mm 大理石餐桌居中，两侧各留 850 mm 放餐椅（6 人位）。北侧推拉门通生活阳台，东侧推拉门通厨房，西侧推拉门通书房，三扇门都打开时形成可以绕行的回游动线。' },
  { id: 'kitchen', name: '厨房', en: 'KITCHEN', zone: 'public',
    poly: [[11130, 130], [13150, 130], [13150, 2870], [12480, 2870], [12480, 3300], [11130, 3300]],
    floor: 'floorTileKitchen', wall: 'paintWarm', label: [11800, 1500], skirting: false,
    view: { p: [11450, 2500], t: [12900, 600] },
    desc: '图纸标注净宽 1390 mm 的操作通道加 600 mm 深台面，是一个 L 形厨房：北面临窗的台面放水槽（750 mm 槽位），东面是 800 mm 宽灶台和油烟机，两端是通顶高柜。南端是冰箱和嵌入式蒸烤箱高柜。洗、切、炒按「水槽 → 台面 → 灶台」顺序排布，动线最短。' },
  { id: 'utility', name: '生活阳台', en: 'UTILITY BALCONY', zone: 'public',
    poly: [[8500, 130], [10950, 130], [10950, 1440], [8500, 1440]],
    floor: 'floorTileBalcony', wall: 'paintWarm', label: [9500, 800], skirting: false,
    view: { p: [8800, 1300], t: [10700, 450] },
    desc: '图纸标注 1870 × 1300 mm 的通道加东侧 600 mm 设备位：洗衣机与拖把池上下水集中在这里。靠北窗装一组晾衣杆，与餐厅之间用三联动玻璃推拉门分隔。' },
  { id: 'study', name: '书房', en: 'STUDY', zone: 'private',
    poly: [[6350, 130], [8400, 130], [8400, 3810], [6350, 3810]],
    floor: 'floorWood', wall: 'paintGreige', label: [7450, 1300],
    view: { p: [8200, 3600], t: [6700, 800] },
    desc: '图纸标注净宽 2050 mm（350 书柜 + 550 + 600 书桌 + 550），进深约 3700 mm。西墙整面 350 mm 深通顶书柜，中间是一张 600 × 1700 mm 的独立书桌，坐在桌前面向东侧的推拉门，背靠书墙。南、东两面都是玻璃推拉门，可开可合。' },
  { id: 'corridor', name: '过道', en: 'CORRIDOR', zone: 'public',
    poly: [[2380, 3900], [8500, 3900], [8500, 5130], [6080, 5130], [6080, 5030], [2380, 5030]],
    floor: 'floorMarble', wall: 'paintWarm', label: [4700, 4470],
    view: { p: [2650, 4470], t: [8400, 4470] },
    desc: '图纸标注净宽 1100 mm，东西贯通，把私密区（主卧、次卧、卫生间）和公共区串起来。沿途依次是主卧门、次卧二门、次卧一门和公共洗手区，墙面挂画，夜间地脚灯引路。' },
  { id: 'master', name: '主卧', en: 'MASTER BEDROOM', zone: 'private',
    poly: [[100, 5130], [3280, 5130], [3280, 9000], [790, 9000], [790, 8460], [100, 8460]],
    floor: 'floorWood', wall: 'paintGreige', label: [1900, 7400],
    feature: [{ side: 'W', finish: 'panelFabric', from: 5250, to: 8400 }],
    view: { p: [3050, 8750], t: [500, 6300] },
    desc: '开间 3200 mm（图纸标注），南向大窗。1800 × 2000 mm 双人床床头靠西墙，两侧床头柜各配一盏台灯；床头墙做软包硬包组合，嵌香槟金细线。对面东墙挂电视。北侧与衣帽间相通，再往北就是主卫，组成完整的主卧套房。' },
  { id: 'closet', name: '衣帽间', en: 'WALK-IN CLOSET', zone: 'private',
    poly: [[100, 3300], [1660, 3300], [1660, 3900], [2290, 3900], [2290, 5130], [100, 5130]],
    floor: 'floorWood', wall: 'paintGreige', label: [1150, 4400],
    view: { p: [1200, 5050], t: [1100, 3500] },
    desc: '位于主卧与主卫之间。西墙是 600 mm 深的通长衣柜（图纸标注 1800 mm），东侧是 500 mm 深的高柜，中间留 1000 mm 通道。西墙开窗采光，柜内灯带在夜间自动点亮。' },
  { id: 'mbath', name: '主卫', en: 'MASTER BATHROOM', zone: 'private',
    poly: [[790, 130], [1660, 130], [1660, 3180], [100, 3180], [100, 710], [790, 710]],
    floor: 'floorTileBath', wall: 'tileMarble', label: [1000, 2200], skirting: false,
    view: { p: [1250, 3050], t: [450, 1200] },
    desc: '北段是 1350 × 900 mm 的淋浴区（图纸标注），玻璃隔断加石材坐凳；中段是壁挂马桶；南段靠门是 600 mm 深的浴室柜和镜柜。整间墙面通铺白色大理石纹瓷砖，五金统一用拉丝香槟金。' },
  { id: 'bed1', name: '次卧一', en: 'BEDROOM 1', zone: 'private',
    poly: [[1780, 130], [4400, 130], [4400, 3780], [1780, 3780]],
    floor: 'floorWood', wall: 'paintGreige', label: [3150, 2000],
    feature: [{ side: 'W', finish: 'panelFabric', from: 600, to: 3200 }],
    view: { p: [4150, 3450], t: [2100, 1400] },
    desc: '北向卧室，净宽约 2620 mm。1500 × 2000 mm 床头靠西墙，南墙是 1550 mm 宽通顶衣柜，东墙挂电视。窗边的设备箱推测为暖气分集水器检修位，做成与墙同色的检修柜。' },
  { id: 'bath2', name: '卫生间', en: 'BATHROOM', zone: 'private',
    poly: [[4500, 130], [5340, 130], [5340, 710], [6060, 710], [6060, 2580], [4500, 2580]],
    floor: 'floorTileBath', wall: 'tileMarble', label: [5100, 1800], skirting: false,
    view: { p: [4800, 2450], t: [5300, 600] },
    desc: '公共卫生间。北侧是 1240 × 950 mm 的淋浴区（两扇 620 mm 玻璃隔断），东墙是壁挂马桶，洗手台移到门外的洗手区，干湿分离，早高峰两个人可以同时使用。' },
  { id: 'dry', name: '公共洗手区', en: 'VANITY', zone: 'private',
    poly: [[4500, 2700], [6060, 2700], [6060, 3780], [4500, 3780]],
    floor: 'floorTileBath', wall: 'paintWarm', label: [5250, 3250], skirting: false,
    feature: [{ side: 'E', finish: 'tileMarble', from: 2700, to: 3780 }],
    view: { p: [4700, 3700], t: [6000, 3000] },
    desc: '卫生间门外的干区，进深 1100 mm（图纸标注），向过道敞开约 1050 mm。东侧是单盆浴室柜和背光镜，管井包进柜体。' },
  { id: 'bed2', name: '次卧二', en: 'BEDROOM 2', zone: 'private',
    poly: [[3400, 5130], [6080, 5130], [6080, 8460], [5350, 8460], [5350, 9000], [3400, 9000]],
    floor: 'floorWood', wall: 'paintGreige', label: [4500, 7500],
    feature: [{ side: 'E', finish: 'panelFabric', from: 6000, to: 8200 }],
    view: { p: [3650, 8750], t: [5800, 6400] },
    desc: '南向卧室，开间 2650 mm（图纸标注）。1500 × 2000 mm 床头靠东侧承重墙，北侧是通长衣柜，西墙挂电视，南面大窗。' },
];

// 家具：x, z 为中心点（毫米）；rot 为绕竖轴转角（度），0 = 正面朝南（+Z），90 = 朝东，-90 = 朝西，180 = 朝北
// 讲解中的尺寸以户型图标注为准，材质为意式轻奢方案
export const FURNITURE = [
  // —— 主卧 ——
  { id: 'bed-master', room: 'master', type: 'bed', name: '双人床', x: 1150, z: 6840, rot: 90, w: 1800, d: 2100, h: 1150,
    mat: '燕麦色绒布软包床 · 香槟金底框 · 亚麻床品',
    desc: '图纸上床长约 2000 mm、宽 1800 mm，床头靠西墙。床头板做竖向绗缝软包，底框用拉丝香槟金包边，床尾留出约 1180 mm 的通道到电视墙。' },
  { id: 'ns-master-1', room: 'master', type: 'nightstand', name: '床头柜（北）', x: 340, z: 5640, rot: 90, w: 520, d: 450, h: 520, lamp: true,
    mat: '胡桃木柜体 · 爵士白大理石台面 · 金属脚', desc: '两抽床头柜，配一盏布艺灯罩台灯；夜间模式下台灯会自动亮起。' },
  { id: 'ns-master-2', room: 'master', type: 'nightstand', name: '床头柜（南）', x: 340, z: 8040, rot: 90, w: 520, d: 450, h: 520, lamp: true,
    mat: '胡桃木柜体 · 爵士白大理石台面 · 金属脚', desc: '与北侧床头柜对称布置，图纸上两侧都画了台灯。' },
  { id: 'tv-master', room: 'master', type: 'tv', name: '壁挂电视', x: 3245, z: 6840, rot: -90, w: 1450, h: 830, y: 1250,
    mat: '超薄壁挂电视 · 下挂胡桃木悬浮层板', desc: '挂在主卧与次卧二之间的隔墙上，正对床尾。' },
  { id: 'shelf-master', room: 'master', type: 'floatShelf', name: '悬浮层板', x: 3130, z: 6840, rot: -90, w: 1800, d: 280, h: 160, y: 520,
    mat: '胡桃木', desc: '电视下方的悬浮层板，内藏灯带。' },
  { id: 'rug-master', room: 'master', type: 'rug', name: '羊毛地毯', x: 1750, z: 6840, rot: 90, w: 2800, d: 2200, pattern: 'border',
    mat: '手工羊毛 · 浅灰褐', desc: '压在床的下半部分，起床脚下是软的。' },
  { id: 'art-master', room: 'master', type: 'art', name: '床头挂画', x: 112, z: 6840, rot: 90, w: 1300, h: 650, y: 1800, art: 'abstract1',
    mat: '装饰画 · 香槟金细框', desc: '床头上方的横幅抽象画，呼应床品的燕麦色。' },
  { id: 'rad-master', room: 'master', type: 'radiator', name: '暖气片', x: 1060, z: 8930, rot: 180, w: 460, h: 600,
    mat: '钢制柱式散热器', desc: '图纸在窗下画了暖气片，保留原位置。' },
  { id: 'chair-master', room: 'master', type: 'loungeChair', name: '阅读椅', x: 2650, z: 8400, rot: -140, w: 760, d: 800,
    fabric: 'velvetSage', mat: '鼠尾草绿丝绒 · 金属脚', desc: '靠窗角落的阅读椅，补充一个看书、晒太阳的位置（图纸此处为空，属于软装建议）。' },

  // —— 衣帽间 ——
  { id: 'wardrobe-closet', room: 'closet', type: 'walkinWardrobe', name: '通长衣柜', x: 400, z: 4215, rot: 90, w: 1790, d: 600, h: 2400,
    mat: '茶色玻璃柜门 · 胡桃木内胆 · 内置灯带', desc: '图纸标注 600 mm 深、约 1800 mm 长，挂衣与叠放分区。茶色玻璃门能看到衣物又不落灰，夜间柜内灯带亮起。' },
  { id: 'tall-closet', room: 'closet', type: 'tallCabinet', name: '高柜', x: 2020, z: 4465, rot: -90, w: 1130, d: 520, h: 2400,
    mat: '奶咖色哑光烤漆 · 香槟金拉手', desc: '图纸标注 500 mm 深，放换季被褥和行李箱；与衣柜之间保持 1000 mm 通道。' },
  { id: 'ottoman-closet', room: 'closet', type: 'pouf', name: '换衣凳', x: 1150, z: 4550, rot: 0, w: 520, d: 520, h: 420, round: true,
    fabric: 'velvetCaramel', mat: '焦糖色丝绒', desc: '衣帽间中间的小圆凳，换鞋、试衣时坐（软装建议）。' },

  // —— 主卫 ——
  { id: 'shower-mbath', room: 'mbath', type: 'shower', name: '淋浴区', x: 965, z: 940, rot: 0, w: 1390, d: 820, screenZ: 1550,
    x0: 270, x1: 1660, z1: 1550, mat: '超白玻璃隔断 · 香槟金五金 · 顶喷花洒', desc: '图纸标注 1350 × 900 mm。玻璃隔断加平开玻璃门，墙面嵌壁龛，北侧 900 × 600 mm 的凹位做成石材坐凳。' },
  { id: 'bench-mbath', room: 'mbath', type: 'stoneBench', name: '石材坐凳', x: 1225, z: 420, rot: 0, w: 870, d: 580, h: 450,
    mat: '鱼肚白大理石', desc: '利用淋浴区北侧 900 × 600 mm 的凹位做的坐凳，洗澡时可以坐着。' },
  { id: 'toilet-mbath', room: 'mbath', type: 'toilet', name: '壁挂马桶', x: 400, z: 1900, rot: 90,
    mat: '白色陶瓷 · 隐藏水箱 · 金色按板', desc: '图纸上马桶靠西墙。壁挂式让地面可以一拖到底，水箱藏进墙内的假墙。' },
  { id: 'vanity-mbath', room: 'mbath', type: 'vanity', name: '浴室柜', x: 380, z: 2720, rot: 90, w: 800, d: 560, h: 850, mirror: true,
    mat: '胡桃木悬浮柜 · 大理石台面 · 一体台盆 · 背光镜', desc: '图纸标注 600 mm 宽洗手台，靠西墙，门一开就在右手边。' },

  // —— 次卧一 ——
  { id: 'bed-bed1', room: 'bed1', type: 'bed', name: '双人床', x: 2830, z: 1950, rot: 90, w: 1500, d: 2100, h: 1100, fabric: 'fabricBlue',
    mat: '雾霾蓝绒布软包床 · 亚麻床品', desc: '图纸上床长 2000 mm、宽约 1500 mm，床头靠西墙，床侧留出到衣柜和电视的通道。' },
  { id: 'ns-bed1-1', room: 'bed1', type: 'nightstand', name: '床头柜（北）', x: 2010, z: 960, rot: 90, w: 460, d: 420, h: 500, lamp: true,
    mat: '胡桃木 · 大理石台面', desc: '图纸上床两侧都画了台灯。' },
  { id: 'ns-bed1-2', room: 'bed1', type: 'nightstand', name: '床头柜（南）', x: 2010, z: 2940, rot: 90, w: 460, d: 420, h: 500, lamp: true,
    mat: '胡桃木 · 大理石台面', desc: '与北侧对称。' },
  { id: 'wardrobe-bed1', room: 'bed1', type: 'wardrobe', name: '衣柜', x: 2625, z: 3505, rot: 180, w: 1550, d: 550, h: 2400,
    mat: '奶咖色哑光烤漆 · 香槟金竖拉手', desc: '图纸上沿南墙画了挂衣柜，约 1550 mm 宽。通顶做法不留积灰的柜顶。' },
  { id: 'tv-bed1', room: 'bed1', type: 'tv', name: '壁挂电视', x: 4365, z: 2100, rot: -90, w: 1230, h: 700, y: 1250,
    mat: '壁挂电视', desc: '图纸东墙画了 600 mm 的电视位。' },
  { id: 'eq-bed1', room: 'bed1', type: 'equipBox', name: '设备检修柜', x: 4130, z: 380, rot: 0, w: 470, d: 470, h: 900,
    mat: '与墙同色的检修柜', desc: '图纸在窗边画了一个设备箱，推测是暖气分集水器或管道检修位，做成与墙同色的矮柜，顶面可以放绿植。' },
  { id: 'rad-bed1', room: 'bed1', type: 'radiator', name: '暖气片', x: 3500, z: 200, rot: 0, w: 640, h: 600, mat: '钢制柱式散热器', desc: '窗下暖气片，图纸原位。' },
  { id: 'rug-bed1', room: 'bed1', type: 'rug', name: '地毯', x: 3100, z: 1950, rot: 90, w: 2300, d: 1700, pattern: 'plain', mat: '羊毛混纺', desc: '床下地毯。' },

  // —— 卫生间 ——
  { id: 'shower-bath2', room: 'bath2', type: 'shower', name: '淋浴区', x: 5095, z: 885, x0: 4500, x1: 5690, z1: 1640,
    mat: '两扇 620 mm 玻璃隔断 · 顶喷花洒', desc: '图纸标注 1240 × 950 mm，两扇 620 mm 玻璃隔断。北侧凹位（约 850 mm 宽）做置物壁龛。' },
  { id: 'toilet-bath2', room: 'bath2', type: 'toilet', name: '壁挂马桶', x: 5700, z: 2120, rot: -90,
    mat: '白色陶瓷 · 隐藏水箱', desc: '图纸上马桶靠东侧承重墙，标注 730 / 670 mm 的使用空间。' },
  { id: 'shelf-bath2', room: 'bath2', type: 'bathShelf', name: '毛巾架', x: 4520, z: 2050, rot: 90, w: 600, mat: '香槟金', desc: '西墙的双层毛巾架。' },

  // —— 公共洗手区 ——
  { id: 'vanity-dry', room: 'dry', type: 'vanity', name: '浴室柜', x: 5830, z: 3240, rot: -90, w: 950, d: 450, h: 850, mirror: true,
    mat: '胡桃木悬浮柜 · 大理石台面 · 背光镜', desc: '图纸上台盆靠东侧管井，单盆；镜子背后的管井做成检修门。' },

  // —— 次卧二 ——
  { id: 'bed-bed2', room: 'bed2', type: 'bed', name: '双人床', x: 5030, z: 7060, rot: -90, w: 1500, d: 2100, h: 1100, fabric: 'fabricSage',
    mat: '鼠尾草绿绒布软包床 · 亚麻床品', desc: '图纸标注床 1500 × 2000 mm，床头靠东侧承重墙，床尾到西墙约 650 mm 通道。' },
  { id: 'ns-bed2-1', room: 'bed2', type: 'nightstand', name: '床头柜（北）', x: 5850, z: 6040, rot: -90, w: 460, d: 420, h: 500, lamp: true, mat: '胡桃木 · 大理石台面', desc: '图纸床两侧都画了台灯。' },
  { id: 'ns-bed2-2', room: 'bed2', type: 'nightstand', name: '床头柜（南）', x: 5850, z: 8080, rot: -90, w: 460, d: 420, h: 500, lamp: true, mat: '胡桃木 · 大理石台面', desc: '与北侧对称。' },
  { id: 'wardrobe-bed2', room: 'bed2', type: 'wardrobe', name: '衣柜', x: 5320, z: 5420, rot: 0, w: 1500, d: 570, h: 2400,
    mat: '奶咖色哑光烤漆 · 香槟金竖拉手', desc: '图纸上沿北墙画了挂衣柜，约 1500 mm 宽。' },
  { id: 'tv-bed2', room: 'bed2', type: 'tv', name: '壁挂电视', x: 3435, z: 7060, rot: 90, w: 1230, h: 700, y: 1250, mat: '壁挂电视', desc: '图纸在西侧隔墙上画了电视位，正对床。' },
  { id: 'rad-bed2', room: 'bed2', type: 'radiator', name: '暖气片', x: 3740, z: 8930, rot: 180, w: 520, h: 600, mat: '钢制柱式散热器', desc: '窗下暖气片，图纸原位。' },
  { id: 'rug-bed2', room: 'bed2', type: 'rug', name: '地毯', x: 4700, z: 7060, rot: 90, w: 2300, d: 1700, pattern: 'plain', mat: '羊毛混纺', desc: '床下地毯。' },

  // —— 书房 ——
  { id: 'bookcase-study', room: 'study', type: 'bookcase', name: '通顶书柜', x: 6525, z: 2050, rot: 90, w: 3300, d: 350, h: 2400,
    mat: '胡桃木框架 · 香槟金层板包边 · 层板灯', desc: '图纸标注 350 mm 深，沿西墙通长布置。开放格与带门柜交替，层板下藏灯带。' },
  { id: 'desk-study', room: 'study', type: 'desk', name: '书桌', x: 7550, z: 2150, rot: 90, w: 1700, d: 620, h: 750,
    mat: '胡桃木桌面 · 皮革桌垫 · 金属桌腿', desc: '图纸标注 600 × 1700 mm 的独立书桌，左右各留 550 mm 通道，桌上画有台灯。' },
  { id: 'chair-study', room: 'study', type: 'officeChair', name: '书椅', x: 7000, z: 2150, rot: 90,
    mat: '焦糖色皮革 · 拉丝金属', desc: '图纸上椅子在书桌西侧，坐下来背对书墙、面向东侧推拉门。' },
  { id: 'rad-study', room: 'study', type: 'radiator', name: '暖气片', x: 6740, z: 200, rot: 0, w: 640, h: 600, mat: '钢制柱式散热器', desc: '窗下暖气片，图纸原位。' },
  { id: 'rug-study', room: 'study', type: 'rug', name: '地毯', x: 7450, z: 2150, rot: 90, w: 2400, d: 1600, pattern: 'border', mat: '羊毛', desc: '书桌下的地毯，减少拖椅子的噪声。' },

  // —— 生活阳台 ——
  { id: 'washer-util', room: 'utility', type: 'washer', name: '滚筒洗衣机', x: 10640, z: 1090, rot: -90, mat: '白色机身', desc: '图纸标注 600 × 700 mm 的洗衣机位，上下水就近接入。' },
  { id: 'sink-util', room: 'utility', type: 'mopSink', name: '拖把池', x: 10690, z: 420, rot: -90, w: 520, d: 480, mat: '白色陶瓷 · 不锈钢龙头', desc: '图纸标注 600 × 600 mm，靠窗一角。' },
  { id: 'cab-util', room: 'utility', type: 'wallCabinet', name: '吊柜', x: 10780, z: 760, rot: -90, w: 1200, d: 330, h: 650, y: 1750, mat: '防潮板哑光烤漆', desc: '洗衣机和拖把池上方的吊柜，放洗衣液、清洁工具。' },
  { id: 'rack-util', room: 'utility', type: 'dryingRack', name: '晾衣杆', x: 9300, z: 650, rot: 0, w: 1700, mat: '铝合金', desc: '靠窗的双杆晾衣架，阳光从北窗进来。' },
  { id: 'rad-dining', room: 'dining', type: 'radiator', name: '暖气片', x: 10620, z: 1600, rot: 0, w: 520, h: 600, mat: '钢制柱式散热器', desc: '图纸在推拉门南侧画了暖气片。' },

  // —— 餐厅 ——
  { id: 'table-dining', room: 'dining', type: 'diningTable', name: '大理石餐桌', x: 9725, z: 2800, rot: 0, w: 900, d: 1800, h: 750,
    mat: '卡拉卡塔大理石台面 · 香槟金斜腿', desc: '图纸标注 800 × 1800 mm，两侧各 850 mm 留给餐椅，6 人位。' },
  { id: 'chair-d1', room: 'dining', type: 'diningChair', name: '餐椅', x: 9030, z: 2200, rot: 90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'chair-d2', room: 'dining', type: 'diningChair', name: '餐椅', x: 9030, z: 2800, rot: 90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'chair-d3', room: 'dining', type: 'diningChair', name: '餐椅', x: 9030, z: 3400, rot: 90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'chair-d4', room: 'dining', type: 'diningChair', name: '餐椅', x: 10420, z: 2200, rot: -90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'chair-d5', room: 'dining', type: 'diningChair', name: '餐椅', x: 10420, z: 2800, rot: -90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'chair-d6', room: 'dining', type: 'diningChair', name: '餐椅', x: 10420, z: 3400, rot: -90, mat: '焦糖色皮革 · 黑色金属腿', desc: '六把同款餐椅之一。' },
  { id: 'pendant-dining', room: 'dining', type: 'pendant', name: '餐吊灯', x: 9725, z: 2800, rot: 0, w: 1300, y: 1650,
    mat: '香槟金灯体 · 磨砂玻璃', desc: '一字形吊灯，长度约为餐桌的 70%。无天花板展示时吊线一直通到墙顶标高。' },
  { id: 'side-dining', room: 'dining', type: 'sideboard', name: '餐边柜', x: 8700, z: 4500, rot: 90, w: 1100, d: 380, h: 900,
    mat: '胡桃木 · 大理石台面', desc: '靠书房外墙的矮餐边柜，放杯具与酒（软装建议，图纸此处为通行带边缘）。' },

  // —— 厨房 ——
  { id: 'counter-k-north', room: 'kitchen', type: 'kitchenRun', name: '临窗操作台', x: 11840, z: 430, rot: 0, w: 1420, d: 600, sink: 0.62, uppers: false,
    mat: '奶咖色哑光柜门 · 白色石英石台面 · 单槽水槽', desc: '图纸标注 510 + 750（水槽）+ 130 mm，水槽正对北窗。' },
  { id: 'counter-k-east', room: 'kitchen', type: 'kitchenRun', name: '灶台', x: 12850, z: 1825, rot: -90, w: 1150, d: 600, cooktop: true, uppers: true,
    mat: '嵌入式燃气灶 · 侧吸油烟机 · 石英石台面', desc: '图纸标注 800 mm 宽灶台。油烟机下方 650 mm 留给炒锅。' },
  { id: 'tall-k-ne', room: 'kitchen', type: 'tallCabinet', name: '高柜（北）', x: 12850, z: 690, rot: -90, w: 1120, d: 600, h: 2400, handle: 'edge',
    mat: '奶咖色哑光烤漆', desc: '图纸东北角两个通顶柜，放米面粮油和小家电。' },
  { id: 'tall-k-se', room: 'kitchen', type: 'ovenTower', name: '蒸烤箱高柜', x: 12850, z: 2635, rot: -90, w: 470, d: 600, h: 2400,
    mat: '嵌入式蒸烤一体机 · 黑玻面板', desc: '图纸东南角的 500 mm 高柜，嵌入蒸烤箱。' },
  { id: 'fridge-k', room: 'kitchen', type: 'fridge', name: '冰箱', x: 11460, z: 3000, rot: 180, w: 620, d: 600, h: 1850,
    mat: '不锈钢', desc: '图纸标注 REF（冰箱），靠厨房南墙。' },
  { id: 'tall-k-s', room: 'kitchen', type: 'tallCabinet', name: '储物高柜', x: 12100, z: 3000, rot: 180, w: 640, d: 600, h: 2400,
    mat: '奶咖色哑光烤漆', desc: '与冰箱并排的通顶储物柜，合计约 1050–1120 mm 宽（图纸标注 1050）。' },

  // —— 玄关 ——
  { id: 'shoe-entry', room: 'entry', type: 'shoeCabinet', name: '通顶鞋柜', x: 11805, z: 3610, rot: 0, w: 1330, d: 400, h: 2400,
    mat: '奶咖色哑光烤漆 · 中空台面 · 灯带', desc: '图纸标注 400 mm 深。中段 1000–1300 mm 高度开放，进门放钥匙；底部悬空 150 mm 放拖鞋。' },
  { id: 'bench-entry', room: 'entry', type: 'pouf', name: '换鞋凳', x: 11300, z: 4900, rot: 0, w: 700, d: 350, h: 450,
    fabric: 'leatherCognac', mat: '干邑色皮革', desc: '靠南墙的小换鞋凳（软装建议）。' },
  { id: 'art-entry', room: 'entry', type: 'art', name: '玄关端景画', x: 11700, z: 5092, rot: 180, w: 900, h: 1200, y: 1450, art: 'abstract2',
    mat: '装饰画', desc: '进门左手边的端景（软装建议）。' },

  // —— 会客厅 ——
  { id: 'tvcab-living', room: 'living', type: 'tvCabinet', name: '悬浮电视柜', x: 6560, z: 6880, rot: 90, w: 3000, d: 400, h: 380, y: 200,
    mat: '胡桃木 · 黑金花大理石台面 · 底部灯带', desc: '图纸标注 400 mm 深，沿西墙通长约 3000 mm。离地悬空 200 mm，下方灯带让柜体看起来像浮在大理石墙前。' },
  { id: 'tv-living', room: 'living', type: 'tv', name: '85 英寸电视', x: 6372, z: 6880, rot: 90, w: 1900, h: 1090, y: 1350,
    mat: '超薄壁挂电视', desc: '挂在大理石背景墙正中，离沙发约 3.6 m，适合 85 英寸。' },
  { id: 'sofa-living', room: 'living', type: 'sofa', name: '模块沙发', x: 10420, z: 6880, rot: -90, w: 1600, d: 1000, size: '总长约 3500 × 深 1000（中段 1600）',
    mat: '燕麦色羊绒混纺 · 香槟金底座', desc: '图纸上是一组靠东墙、两端向内折的模块沙发（总长约 3500 mm，标注 3500 / 895），三段式围合，朝向电视和茶几。' },
  { id: 'coffee-living-1', room: 'living', type: 'coffeeTable', name: '圆形茶几（大）', x: 8520, z: 6930, rot: 0, r: 600, h: 320,
    mat: '鱼肚白大理石 · 香槟金底座', desc: '图纸标注直径 1200 mm，客厅视觉中心。' },
  { id: 'coffee-living-2', room: 'living', type: 'coffeeTable', name: '圆形茶几（小）', x: 8460, z: 5980, rot: 0, r: 380, h: 420, top: 'marbleDark',
    mat: '黑金花大理石 · 香槟金底座', desc: '图纸上大茶几北侧还有一个小圆几，高低错落组成子母茶几。' },
  { id: 'lounge-1', room: 'living', type: 'loungeChair', name: '单人椅', x: 7470, z: 7920, rot: 160, w: 860, d: 880,
    fabric: 'leatherCognac', mat: '干邑色皮革 · 弧形扶手', desc: '图纸南侧两把弧形单椅之一，背向落地窗，面向茶几。' },
  { id: 'lounge-2', room: 'living', type: 'loungeChair', name: '单人椅', x: 9170, z: 7760, rot: -150, w: 860, d: 880,
    fabric: 'leatherCognac', mat: '干邑色皮革 · 弧形扶手', desc: '与另一把单椅成对，略向茶几方向转。' },
  { id: 'side-living-1', room: 'living', type: 'sideTable', name: '边几', x: 8300, z: 8050, rot: 0, r: 260, h: 520,
    mat: '香槟金 · 黑色大理石', desc: '图纸上两把单椅之间的小圆几。' },
  { id: 'pouf-living', room: 'living', type: 'pouf', name: '脚凳', x: 9640, z: 8150, rot: 30, w: 620, d: 440, h: 400,
    fabric: 'velvetSage', mat: '鼠尾草绿丝绒', desc: '图纸上沙发南端的小脚凳。' },
  { id: 'lamp-living', room: 'living', type: 'floorLamp', name: '落地灯', x: 10650, z: 5560, rot: -20,
    mat: '香槟金弧形灯杆 · 大理石底座', desc: '图纸东北角的小圆，这里放一盏弧形落地灯，灯罩伸到沙发上方。' },
  { id: 'rug-living', room: 'living', type: 'rug', name: '客厅地毯', x: 8850, z: 6930, rot: 0, w: 3400, d: 2800, pattern: 'border',
    mat: '手工羊毛 · 低饱和灰蓝边', desc: '把沙发、茶几、单椅压在同一块地毯上，会客区就被「框」出来了。' },
  { id: 'plant-living', room: 'living', type: 'plant', name: '橄榄树', x: 10600, z: 8250, rot: 0, h: 1700,
    mat: '陶土花盆', desc: '窗边一棵橄榄树，给大理石和皮革的冷硬加一点生气。' },
  { id: 'rad-living-1', room: 'living', type: 'radiator', name: '暖气片', x: 6560, z: 8560, rot: 180, w: 330, h: 600, mat: '钢制柱式散热器', desc: '图纸原位的窗边暖气片。' },
  { id: 'rad-living-2', room: 'living', type: 'radiator', name: '暖气片', x: 10690, z: 8560, rot: 180, w: 500, h: 600, mat: '钢制柱式散热器', desc: '图纸原位的窗边暖气片。' },

  // —— 过道 ——
  { id: 'art-corr-1', room: 'corridor', type: 'art', name: '过道挂画', x: 5220, z: 5022, rot: 180, w: 1200, h: 800, y: 1500, art: 'abstract3',
    mat: '装饰画 · 香槟金细框', desc: '次卧二门东侧 2000 mm 长的墙面，挂一幅横幅画做走廊端景。' },
  { id: 'art-corr-2', room: 'corridor', type: 'art', name: '过道挂画', x: 2350, z: 4470, rot: 90, w: 600, h: 900, y: 1500, art: 'abstract1',
    mat: '装饰画', desc: '过道西端尽头的竖幅画，站在客厅就能看到。' },
];

// 夜间室内灯光：每个房间一盏主光（相当于嵌入式筒灯的总效果），较大房间两盏（毫米）
export const ROOM_LIGHTS = [
  { room: 'living', x: 7700, z: 6900, i: 1.0 }, { room: 'living', x: 9900, z: 6900, i: 0.8 },
  { room: 'dining', x: 9725, z: 3400, i: 0.7 }, { room: 'kitchen', x: 11900, z: 1500, i: 0.8 },
  { room: 'entry', x: 11700, z: 4500, i: 0.6 }, { room: 'utility', x: 9700, z: 800, i: 0.5 },
  { room: 'study', x: 7400, z: 1900, i: 0.7 }, { room: 'corridor', x: 3600, z: 4470, i: 0.45 },
  { room: 'corridor', x: 7200, z: 4500, i: 0.45 }, { room: 'master', x: 1900, z: 7000, i: 0.7 },
  { room: 'closet', x: 1100, z: 4300, i: 0.45 }, { room: 'mbath', x: 950, z: 1900, i: 0.55 },
  { room: 'bed1', x: 3100, z: 1900, i: 0.65 }, { room: 'bath2', x: 5100, z: 1600, i: 0.5 },
  { room: 'dry', x: 5300, z: 3250, i: 0.4 }, { room: 'bed2', x: 4700, z: 7000, i: 0.65 },
];
