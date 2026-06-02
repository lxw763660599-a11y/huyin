// ===== 护隐 - 防偷拍安全助手 =====

// 数字滚动动画
function animateStats() {
  document.querySelectorAll('.stat-num').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-count'));
    var current = 0;
    var step = Math.ceil(target / 80);
    var timer = setInterval(function() {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current.toLocaleString();
    }, 20);
  });
}

// ===== 导航栏 =====
document.getElementById('hamburger').addEventListener('click', function() {
  document.getElementById('mobileMenu').classList.toggle('active');
});
document.querySelectorAll('.mobile-menu a').forEach(function(a) {
  a.addEventListener('click', function() {
    document.getElementById('mobileMenu').classList.remove('active');
  });
});
window.addEventListener('scroll', function() {
  var nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ===== 风险地图 =====
var map = null;
var markers = [];
var caseMarkers = [];
var currentFilter = 'all';
var showCases = true;

function initMap() {
  if (map) return;

  map = L.map('map', {
    center: [34.3, 108.9],
    zoom: 5,
    zoomControl: true
  });

  // 高德地图瓦片
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1','2','3','4'],
    attribution: '&copy; 高德地图',
    maxZoom: 18
  }).addTo(map);

  renderMarkers();
  renderCaseMarkers();
}

// 风险颜色
function getRiskColor(risk) {
  if (risk === '高') return '#dc2626';
  if (risk === '中') return '#f59e0b';
  return '#10b981';
}

// 风险圆点图标
function getRiskIcon(risk) {
  var color = getRiskColor(risk);
  return L.divIcon({
    className: '',
    html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color +
          ';border:2.5px solid #fff;box-shadow:0 0 10px ' + color + ', 0 0 20px ' + color + '40;"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });
}

// 过往案例灰色 X 图标
function getCaseIcon() {
  return L.divIcon({
    className: 'case-marker-icon',
    html: '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
          '<svg width="16" height="16" viewBox="0 0 16 16" style="pointer-events:none;">' +
          '<line x1="3" y1="3" x2="13" y2="13" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>' +
          '<line x1="13" y1="3" x2="3" y2="13" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>' +
          '</svg></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

// 地点弹窗
function buildPopup(loc) {
  var riskLabel = loc.risk === '高' ? '高风险（已报警）' : loc.risk === '中' ? '多人关注区域' : '疑似区域';
  var html = '<div style="font-family: sans-serif; min-width: 220px; max-width: 300px;">' +
    '<h4 style="margin:0 0 6px;font-size:15px;color:#fff;">' + loc.name + '</h4>' +
    '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;color:#fff;background:' + getRiskColor(loc.risk) + ';">' + riskLabel + '</span>' +
    '<span style="font-size:12px;color:#94a3b8;margin-left:6px;">' + loc.type + ' · ' + loc.city + '</span>' +
    '<p style="margin:10px 0 4px;font-size:13px;color:#cbd5e1;line-height:1.5;">' + loc.desc + '</p>' +
    '<small style="color:#64748b;">报告时间：' + loc.date + '</small>' +
    '</div>';
  return html;
}

// 过往案例弹窗
function buildCasePopup(c) {
  var hasUrl = c.url && c.url.trim() !== '';
  var titleHtml = hasUrl
    ? '<a href="' + c.url + '" target="_blank" rel="noopener" style="color:#93c5fd;font-size:13px;text-decoration:none;font-weight:500;">' + c.title + ' ↗</a>'
    : '<span style="color:#cbd5e1;font-size:13px;font-weight:500;">' + c.title + '</span>';

  return '<div style="font-family: sans-serif; min-width: 240px; max-width: 320px;">' +
    '<div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:4px;">📰 过往案例</div>' +
    titleHtml +
    '<div style="margin-top:6px;font-size:11px;color:#64748b;">' + c.source + ' · ' + c.date + ' · ' + c.city + '</div>' +
    '</div>';
}

// 渲染地点标记
function renderMarkers() {
  markers.forEach(function(m) { map.removeLayer(m); });
  markers = [];

  var filtered = currentFilter === 'all'
    ? hotspotLocations
    : hotspotLocations.filter(function(l) { return l.type === currentFilter; });

  filtered.forEach(function(loc) {
    var marker = L.marker([loc.lat, loc.lng], { icon: getRiskIcon(loc.risk) })
      .addTo(map)
      .bindPopup(buildPopup(loc));
    markers.push(marker);
  });
}

// 渲染过往案例标记
function renderCaseMarkers() {
  caseMarkers.forEach(function(m) { map.removeLayer(m); });
  caseMarkers = [];
  if (!showCases) return;

  newsCaseMarkers.forEach(function(c) {
    var marker = L.marker([c.lat, c.lng], { icon: getCaseIcon(), opacity: 0.75 })
      .addTo(map)
      .bindPopup(buildCasePopup(c));
    caseMarkers.push(marker);
  });
}

// 地图筛选
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentFilter = btn.getAttribute('data-type');
    renderMarkers();
  });
});

// 地图搜索
document.getElementById('mapSearch').addEventListener('input', function() {
  var query = this.value.trim().toLowerCase();
  if (!query) { renderMarkers(); renderCaseMarkers(); return; }

  markers.forEach(function(m) { map.removeLayer(m); });
  markers = [];
  caseMarkers.forEach(function(m) { map.removeLayer(m); });
  caseMarkers = [];

  hotspotLocations.forEach(function(loc) {
    if ((currentFilter === 'all' || loc.type === currentFilter) &&
        (loc.name.toLowerCase().indexOf(query) > -1 || loc.city.toLowerCase().indexOf(query) > -1)) {
      var marker = L.marker([loc.lat, loc.lng], { icon: getRiskIcon(loc.risk) })
        .addTo(map)
        .bindPopup(buildPopup(loc));
      markers.push(marker);
    }
  });

  if (showCases) {
    newsCaseMarkers.forEach(function(c) {
      if (c.city.toLowerCase().indexOf(query) > -1 || c.title.toLowerCase().indexOf(query) > -1) {
        var marker = L.marker([c.lat, c.lng], { icon: getCaseIcon(), opacity: 0.75 })
          .addTo(map)
          .bindPopup(buildCasePopup(c));
        caseMarkers.push(marker);
      }
    });
  }
});

// ===== 攻略弹窗 =====
var guideContents = {
  '入门检查': {
    title: '🔍 入门检查法 - 5分钟快速排查',
    content: '<h3>为什么住酒店要检查？</h3><p>偷拍设备最常出现在酒店客房、民宿、出租屋。进房间后的第一件事，就是花5分钟检查。</p>' +
      '<h3>第一步：重点区域扫描</h3><p>以下是最容易被安装摄像头的区域，逐一检查：</p><ul>' +
      '<li><strong>烟雾探测器</strong>：抬头看天花板，探测器有没有异常的小孔或反光</li>' +
      '<li><strong>电视机/机顶盒</strong>：检查正面和背面是否有异样的小孔</li>' +
      '<li><strong>空调出风口</strong>：关灯用手电筒照出风口内部</li>' +
      '<li><strong>插座面板</strong>：检查是否有微小的孔洞</li>' +
      '<li><strong>路由器和闹钟</strong>：检查设备上是否有不正常的指示灯或小孔</li>' +
      '<li><strong>壁画和装饰品</strong>：取下墙上的装饰物检查背面</li>' +
      '<li><strong>绿植和摆件</strong>：仔细查看叶子间和摆件的孔洞</li>' +
      '<li><strong>浴室镜子</strong>：手指甲触碰镜面，看是否有间距（双面镜有间距）</li>' +
      '</ul>' +
      '<h3>第二步：关灯测试</h3><p>关闭所有灯光，拉上窗帘，让房间完全黑暗。打开手机手电筒，缓慢扫描上述区域。如果看到蓝色或紫色反光点，可能是摄像头镜头。</p>' +
      '<h3>第三步：手机检测</h3><p>打开手机相机（关闭闪光灯），用镜头扫描房间。摄像头红外线在手机屏幕会显示为紫色光点。</p>'
  },
  '红外检测': {
    title: '📱 手机红外检测法',
    content: '<h3>原理</h3><p>大多数针孔摄像头使用红外夜视功能。红外光是人眼看不见的，但手机的摄像头传感器可以捕捉到红外光。</p>' +
      '<h3>操作步骤</h3><ol>' +
      '<li><strong>关闭所有灯光</strong>：拉上窗帘，确保房间完全黑暗</li>' +
      '<li><strong>打开手机后置摄像头</strong>，关闭闪光灯</li>' +
      '<li><strong>缓慢扫描</strong>：将摄像头对准每个可疑位置</li>' +
      '<li><strong>观察屏幕</strong>：出现紫色或白色光点就是红外摄像头</li>' +
      '</ol>' +
      '<h3>注意事项</h3><ul>' +
      '<li>部分高端手机加了红外滤镜可能检测不到，用遥控器对准手机摄像头测试</li>' +
      '<li>白天不开启红外的摄像头无法用此法检测</li>' +
      '</ul>'
  },
  'APP检测': {
    title: '📡 APP辅助检测',
    content: '<h3>推荐工具</h3>' +
      '<h3>1. Fing（免费）</h3><p>扫描局域网所有连接设备。操作：连接WiFi → 打开Fing → 扫描 → 查看含"Camera"关键词的设备。</p>' +
      '<h3>2. Hidden Camera Detector</h3><p>利用手机磁力传感器检测电子设备磁场。靠近可疑位置，磁场异常升高可能有隐藏设备。</p>' +
      '<h3>3. Network Analyzer</h3><p>更专业的网络分析工具，查看所有连接设备的IP、MAC、设备类型。</p>' +
      '<p style="color:#f59e0b;margin-top:12px;">⚠️ 这些工具只能辅助判断，最可靠的方法还是关灯+手电筒反光检查。</p>'
  },
  '反光排查': {
    title: '🔦 反光排查法',
    content: '<h3>为什么有效</h3><p>摄像头镜头是玻璃/塑料，光线照射会产生反光。这是最有效的检测方法。</p>' +
      '<h3>操作步骤</h3><ol>' +
      '<li><strong>彻底关灯</strong>：关闭所有光源，拉上窗帘</li>' +
      '<li><strong>等待30秒</strong>：让眼睛适应黑暗</li>' +
      '<li><strong>用手电筒扫描</strong>：对准每个可疑位置左右移动光线</li>' +
      '<li><strong>观察反光</strong>：蓝色/紫色/白色的小反光点就是镜头</li>' +
      '</ol>' +
      '<h3>重点位置</h3><ul><li>烟雾探测器、空调出风口、灯具</li><li>插座、壁画、挂钩</li><li>电视机、路由器、闹钟</li><li>绿植、摆件</li><li>浴室镜子、排气扇、沐浴露瓶</li></ul>'
  },
  '高发场景': {
    title: '⚠️ 高发场景识别',
    content: '<h3>最容易被偷拍的场所</h3>' +
      '<h3>1. 酒店/民宿（最高发）</h3><p>特别注意：价格异常便宜的房间、情侣酒店/主题酒店、网红民宿。</p>' +
      '<h3>2. 公共厕所/更衣室</h3><p>注意隔间顶部空隙和通风口。</p>' +
      '<h3>3. 试衣间</h3><p>进入前先抬头检查顶部和角落。</p>' +
      '<h3>4. 温泉/洗浴中心</h3><p>注意储物柜、吹风机附近。</p>' +
      '<h3>5. 出租屋</h3><p>长期出租的房间风险更高，入住前全面检查。</p>' +
      '<h3>出行建议</h3><ul><li>选择知名连锁酒店</li><li>自带便携式红外检测器</li><li>进房后先关灯检查</li></ul>'
  },
  '法律维权': {
    title: '⚖️ 发现偷拍设备后怎么办',
    content: '<h3>第一步：保护自己</h3><ul><li><strong>不要触碰设备</strong>：保留指纹证据</li><li><strong>保持冷静</strong>：不与可疑人员冲突</li><li><strong>立即离开</strong>：确保自身安全</li></ul>' +
      '<h3>第二步：取证</h3><ul><li>用手机拍照或录像记录设备位置和周围环境</li><li>记录房间号、地址</li></ul>' +
      '<h3>第三步：立即报警（110）</h3><ul><li>等待警方到场处理</li><li>配合调查取证</li></ul>' +
      '<h3>第四步：维权</h3><ul><li>要求酒店/场所管理方承担责治</li><li>向消费者协会投诉</li><li>提起民事诉讼要求赔偿</li></ul>' +
      '<h3>法律依据</h3><p>《治安管理处罚法》第四十二条：偷窥、偷拍、窃听、散布他人隐私的，处5日以下拘留或者500元以下罚款；情节较重的，处5日以上10日以下拘留。</p>' +
      '<p>《刑法》第二百八十四条：非法使用窃听、窃照专用器材，造成严重后果的，处二年以下有期徒刑、拘役或者管制。</p>' +
      '<div style="margin-top:16px;padding:16px;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);border-radius:8px;"><strong style="color:#dc2626;">📞 紧急求助：110</strong></div>'
  }
};

function openGuide(key) {
  var guide = guideContents[key];
  if (!guide) return;
  document.getElementById('modalContent').innerHTML = '<h2>' + guide.title + '</h2>' + guide.content;
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ===== 举报表单 =====
var cityCoordMap = {
  '北京':[39.9042,116.4074], '上海':[31.2304,121.4737], '广州':[23.1291,113.2644],
  '深圳':[22.5431,114.0579], '杭州':[30.2741,120.1551], '成都':[30.5728,104.0668],
  '武汉':[30.5928,114.3055], '南京':[32.0603,118.7969], '重庆':[29.5630,106.5516],
  '西安':[34.3416,108.9398], '长沙':[28.2282,112.9388], '天津':[39.3434,117.3616],
  '苏州':[31.2990,120.5853], '厦门':[24.4798,118.0894], '郑州':[34.7466,113.6254],
  '昆明':[25.0389,102.7183], '三亚':[18.2528,109.5120], '大理':[25.6065,100.2676],
  '青岛':[36.0671,120.3826], '丽江':[26.8721,100.2299], '合肥':[31.8206,117.2272],
  '福州':[26.0745,119.2965], '南昌':[28.6820,115.8579], '济南':[36.6512,117.1201],
  '沈阳':[41.8057,123.4328], '东莞':[23.0208,113.7518], '贵阳':[26.6470,106.6302],
  '珠海':[22.2707,113.5767], '南宁':[22.8170,108.3665], '兰州':[36.0611,103.8343],
  '呼和浩特':[40.8424,111.7490], '石家庄':[38.0428,114.5149],
  '佛山':[23.0215,113.1214], '无锡':[31.4912,120.3119], '常州':[31.8107,119.9736],
  '温州':[27.9939,120.6993], '大连':[38.9137,121.6147], '哈尔滨':[45.8023,126.5360],
  '长春':[43.8178,125.3235], '太原':[37.8706,112.5489], '乌鲁木齐':[43.8256,87.6168],
  '银川':[38.4872,106.2309], '海口':[20.0174,110.3492], '拉萨':[29.6500,91.1000],
  '安阳':[36.0977,114.3923], '乐山':[29.5521,103.7656]
};
function getCityLat(city) { return cityCoordMap[city] ? cityCoordMap[city][0] : 34.3; }
function getCityLng(city) { return cityCoordMap[city] ? cityCoordMap[city][1] : 108.9; }

document.getElementById('reportForm').addEventListener('submit', function(e) {
  e.preventDefault();
  var name = document.getElementById('reportName').value.trim();
  var type = document.getElementById('reportType').value;
  var city = document.getElementById('reportCity').value.trim();
  var address = document.getElementById('reportAddress').value.trim();
  var desc = document.getElementById('reportDesc').value.trim();
  var risk = document.querySelector('input[name="risk"]:checked').value;
  var newLocation = {
    name: name + (address ? ' - ' + address : ''),
    type: type, city: city,
    lat: getCityLat(city), lng: getCityLng(city),
    risk: risk, desc: desc,
    date: new Date().toISOString().split('T')[0]
  };
  hotspotLocations.push(newLocation);
  if (map) renderMarkers();
  this.reset();
  showToast('✅ 举报已提交，感谢你的贡献！');
});

function showToast(msg) {
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { document.body.removeChild(toast); }, 300);
  }, 3000);
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  animateStats();
  initMap();
  setTimeout(function() {
    if (map) map.invalidateSize();
  }, 500);
});

var mapObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting && !map) {
      initMap();
      mapObserver.disconnect();
    }
  });
}, { threshold: 0.1 });
var mapSection = document.getElementById('map-section');
if (mapSection) mapObserver.observe(mapSection);
