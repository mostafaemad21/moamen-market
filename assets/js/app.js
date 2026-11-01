/* ============================================================
   سوبر ماركت مؤمن — منطق الصفحة
   (مش محتاج تعدّل هنا، كل الإعدادات في config.js)
   ============================================================ */
(function () {
  "use strict";

  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function toAr(v) {
    return String(v).replace(/\d/g, function (d) { return AR_DIGITS[+d]; });
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function digits(v) {
    return String(v || "").replace(/[^\d+]/g, "");
  }

  function telHref(raw) {
    var d = digits(raw).replace(/^\+/, "");
    if (d.indexOf("00") === 0) d = d.slice(2);
    if (d.charAt(0) === "0") d = "20" + d.slice(1);
    return "tel:+" + d;
  }

  function waHref(raw, text) {
    var d = digits(raw).replace(/^\+/, "");
    if (d.indexOf("00") === 0) d = d.slice(2);
    if (d.charAt(0) === "0") d = "20" + d.slice(1);
    return "https://wa.me/" + d + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function mapSearchUrl() {
    if (S.mapUrl) return S.mapUrl;
    return (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(S.mapQuery || S.name)
    );
  }

  function mapEmbedUrl() {
    return (
      "https://www.google.com/maps?q=" +
      encodeURIComponent(S.mapQuery || S.name) +
      "&hl=ar&z=16&output=embed"
    );
  }

  function directionsUrl() {
    return (
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(S.mapQuery || S.name)
    );
  }

  function haptic(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms || 12);
    } catch (e) {}
  }

  /* ---------------- Toast ---------------- */
  var toastEl, toastTimer;
  function toast(msg, icon) {
    if (!toastEl) toastEl = $("#toast");
    if (!toastEl) return;
    $(".toast-text", toastEl).textContent = msg;
    var use = $("use", toastEl);
    if (use) use.setAttribute("href", icon || "#i-check");
    toastEl.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-open");
    }, 2800);
  }

  /* ---------------- Clipboard ---------------- */
  function copyText(text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(
          function () { resolve(true); },
          function () { resolve(fallbackCopy(text)); }
        );
        return;
      }
      resolve(fallbackCopy(text));
    });
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ---------------- Time / hours ---------------- */
  function cairoNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === "hour") h = parseInt(p.value, 10);
        if (p.type === "minute") m = parseInt(p.value, 10);
      });
      if (h === 24) h = 0;
      return { h: h, m: m, mins: h * 60 + m };
    } catch (e) {
      var d = new Date();
      return { h: d.getHours(), m: d.getMinutes(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function formatHour(h) {
    var hr = h % 24;
    var pm = hr >= 12;
    var display = hr % 12;
    if (display === 0) display = 12;
    return toAr(display) + (pm ? " م" : " ص");
  }

  function isOpenNow() {
    var open = Number(S.hours && S.hours.open);
    var close = Number(S.hours && S.hours.close);
    if (isNaN(open) || isNaN(close)) return true;
    var now = cairoNow().mins;
    var o = open * 60;
    var c = close * 60;
    if (c === 1440) c = 1439;
    if (c > o) return now >= o && now < c;
    return now >= o || now < c; // شيفت ليلي
  }

  function todayIndexCairo() {
    var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    try {
      var wd = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Cairo",
        weekday: "long"
      }).format(new Date());
      return names.indexOf(wd);
    } catch (e) {
      return new Date().getDay();
    }
  }

  /* ---------------- Header ---------------- */
  function renderHeader() {
    var nameEl = $("#siteName");
    if (nameEl && S.name) nameEl.textContent = S.name;
    var tag = $("#tagline");
    if (tag && S.tagline) tag.textContent = S.tagline;

    var pill = $("#statusPill");
    if (pill) {
      var open = isOpenNow();
      pill.classList.toggle("is-closed", !open);
      var txt = $(".status-text", pill);
      if (txt) txt.textContent = open ? "مفتوح الآن" : "مقفول الآن";
      pill.title = S.hoursText || "";
    }
  }

  /* ---------------- Hub: شبكة الأيقونات ---------------- */
  function renderHub() {
    var host = $("#hubList");
    if (!host) return;

    var items = [];

    (S.socials || []).forEach(function (s) {
      var soon = !s.url || s.soon;
      items.push({
        cls: s.id,
        label: s.name,
        icon: s.id,
        filled: s.id === "facebook" || s.id === "tiktok",
        href: soon ? "" : s.url,
        soon: soon,
        blank: true
      });
    });

    items.push({
      cls: "whatsapp",
      label: "واتساب",
      icon: "whatsapp",
      filled: true,
      href: waHref(S.whatsapp, S.whatsappText),
      blank: true
    });
    items.push({ cls: "phone", label: "اتصال", icon: "phone", href: telHref(S.phone) });
    items.push({ cls: "map", label: "الموقع", icon: "pin", href: directionsUrl(), blank: true });
    items.push({ cls: "share", label: "مشاركة", icon: "share", action: "share" });

    host.innerHTML = items
      .map(function (it) {
        var inner =
          '<span class="hub-ic ' + esc(it.cls) + (it.filled ? " filled" : "") + '">' +
          '<svg><use href="#i-' + esc(it.icon) + '"/></svg>' +
          (it.soon ? '<i class="hub-soon">قريبًا</i>' : "") +
          "</span>" +
          '<span class="hub-label">' + esc(it.label) + "</span>";

        if (it.soon) {
          return '<button class="hub-item" type="button" data-soon="1">' + inner + "</button>";
        }
        if (it.action) {
          return (
            '<button class="hub-item" type="button" data-action="' +
            esc(it.action) +
            '">' +
            inner +
            "</button>"
          );
        }
        return (
          '<a class="hub-item" href="' +
          esc(it.href) +
          '"' +
          (it.blank ? ' target="_blank" rel="noopener"' : "") +
          ">" +
          inner +
          "</a>"
        );
      })
      .join("");
  }

  /* ---------------- Payments ---------------- */
  function renderPayments() {
    var host = $("#payList");
    if (!host) return;
    host.innerHTML = (S.payments || [])
      .map(function (p) {
        var active = !!p.active;
        var isLink = active && !!p.url;
        var canCopy = active && !isLink && !!p.value;
        var sub = active
          ? p.display || p.value || p.note || ""
          : "هيتم تفعيله قريبًا";

        var tag = isLink
          ? '<span class="pay-tag go"><svg><use href="#i-navigate"/></svg> افتح</span>'
          : canCopy
          ? '<span class="pay-tag"><svg><use href="#i-copy"/></svg> نسخ</span>'
          : '<span class="pay-tag soon">قريبًا</span>';

        var inner =
          '<span class="pay-logo" style="background:' + esc(p.color || "#9aa8a0") + '">' +
          esc(p.logo || (p.name || "").charAt(0)) +
          "</span>" +
          '<span class="pay-main">' +
          '<span class="pay-name">' + esc(p.name) + "</span>" +
          '<span class="pay-id">' + esc(sub) + "</span>" +
          "</span>" +
          tag;

        if (isLink) {
          return (
            '<a class="pay-row" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
            inner +
            "</a>"
          );
        }
        if (canCopy) {
          return (
            '<button class="pay-row" type="button" data-copy="' + esc(p.value) +
            '" data-label="' + esc(p.name) + '">' +
            inner +
            "</button>"
          );
        }
        return (
          '<button class="pay-row is-soon" type="button" data-soon="1">' +
          inner +
          "</button>"
        );
      })
      .join("");
  }

  /* ---------------- Categories & features ---------------- */
  function renderCategories() {
    var host = $("#catList");
    if (!host) return;
    host.innerHTML = (S.categories || [])
      .map(function (c) {
        return (
          '<article class="cat-card">' +
          '<div class="cat-emoji" aria-hidden="true">' + esc(c.emoji || "🛒") + "</div>" +
          '<h3 class="cat-name">' + esc(c.name) + "</h3>" +
          '<p class="cat-items">' + esc(c.items || "") + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderFeatures() {
    var host = $("#featureList");
    if (!host) return;
    host.innerHTML = (S.features || [])
      .map(function (f) {
        return (
          '<article class="feature">' +
          '<span class="feature-ic"><svg><use href="#i-' + esc(f.icon || "star") + '"/></svg></span>' +
          "<div>" +
          "<h3>" + esc(f.title) + "</h3>" +
          "<p>" + esc(f.text) + "</p>" +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------------- Hours ---------------- */
  function renderHours() {
    var host = $("#hoursList");
    if (host) {
      var days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
      // getDay(): 0=الأحد … 6=السبت
      var map = [1, 2, 3, 4, 5, 6, 0];
      var today = todayIndexCairo();
      var openH = Number(S.hours && S.hours.open) || 0;
      var closeH = Number(S.hours && S.hours.close) || 0;
      var time = formatHour(openH) + " — " + formatHour(closeH);
      if (closeH < openH) time += " (تاني يوم)";

      host.innerHTML = days
        .map(function (d, i) {
          var isToday = map[i] === today;
          return (
            '<div class="hour-row' + (isToday ? " is-today" : "") + '">' +
            '<span class="hour-day">' + esc(d) + "</span>" +
            '<span class="hour-time">' + esc(time) + "</span>" +
            "</div>"
          );
        })
        .join("");
    }

    var line = $("#hoursLine");
    if (line && S.hoursText) line.textContent = S.hoursText;
  }

  /* ---------------- Location & about ---------------- */
  function renderLocation() {
    var frame = $("#mapFrame");
    if (frame) frame.src = mapEmbedUrl();

    var btn = $("#btnMap");
    if (btn) btn.href = mapSearchUrl();

    var addr = $("#addrLine");
    if (addr) addr.textContent = [S.address, S.city].filter(Boolean).join(" — ");

    var about = $("#aboutText");
    if (about && S.about) about.textContent = S.about;
  }

  /* ---------------- Actions ---------------- */
  function sharePage() {
    haptic(12);
    var url = S.siteUrl || location.href;
    var data = { title: S.name, text: S.tagline || "", url: url };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else {
      copyText(url).then(function () {
        toast("تم نسخ رابط الصفحة 🔗", "#i-check");
      });
    }
  }

  function bindActions() {
    document.addEventListener("click", function (e) {
      var soon = e.target.closest("[data-soon]");
      if (soon) {
        e.preventDefault();
        haptic(14);
        toast("لسه مش متاح… قريبًا جدًا 💚", "#i-sparkle");
        return;
      }

      var action = e.target.closest("[data-action]");
      if (action) {
        e.preventDefault();
        if (action.getAttribute("data-action") === "share") sharePage();
        return;
      }

      var copyEl = e.target.closest("[data-copy]");
      if (copyEl) {
        e.preventDefault();
        var value = copyEl.getAttribute("data-copy");
        var label = copyEl.getAttribute("data-label") || "";
        haptic(12);
        copyText(value).then(function (ok) {
          if (ok) toast("تم نسخ " + label + " ✅", "#i-check");
          else toast("مقدرناش ننسخ… رقم: " + value, "#i-copy");
        });
      }
    });

    var copyAddr = $("#btnCopyAddr");
    if (copyAddr) {
      copyAddr.addEventListener("click", function () {
        haptic(12);
        var txt = [S.name, S.address, S.city].filter(Boolean).join(" — ");
        copyText(txt).then(function (ok) {
          toast(ok ? "تم نسخ العنوان 📍" : "مقدرناش ننسخ العنوان", "#i-check");
        });
      });
    }

    var vcard = $("#btnVcard");
    if (vcard) {
      vcard.addEventListener("click", function () {
        haptic(12);
        saveContact();
        toast("بيانات المحل اتحفظت في جهات الاتصال 👌", "#i-check");
      });
    }

    // إحساس اللمس على الأيقونات والتبويبات
    $$(".hub-item, .tab").forEach(function (b) {
      b.addEventListener("pointerdown", function () { haptic(8); });
    });
  }

  function saveContact() {
    var d = digits(S.phone).replace(/^\+/, "");
    if (d.indexOf("00") === 0) d = d.slice(2);
    if (d.charAt(0) === "0") d = "20" + d.slice(1);

    var lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:;" + (S.name || "") + ";;;",
      "FN:" + (S.name || ""),
      "ORG:" + (S.name || ""),
      "TEL;TYPE=CELL:+" + d,
      "ADR;TYPE=WORK:;;" + (S.address || "") + ";" + (S.city || "") + ";;;Egypt",
      S.siteUrl ? "URL:" + S.siteUrl : "URL:" + location.href,
      "NOTE:" + (S.tagline || ""),
      "END:VCARD"
    ];

    var blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "moamen-market.vcf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------------- Reveal ---------------- */
  function setupReveal() {
    var items = $$(".block");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    items.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Tabs ---------------- */
  function setupTabs() {
    var tabs = $$(".tab");
    var targets = tabs
      .map(function (t) { return { tab: t, el: document.getElementById(t.dataset.target) }; })
      .filter(function (t) { return !!t.el; });

    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY + window.innerHeight * 0.32;
      var current = targets[0];
      targets.forEach(function (t) {
        if (t.el.offsetTop <= y) current = t;
      });
      tabs.forEach(function (t) { t.classList.toggle("is-active", t === current.tab); });
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ---------------- SEO JSON-LD ---------------- */
  function syncJsonLd() {
    try {
      var tag = document.querySelector('script[type="application/ld+json"]');
      if (!tag) return;
      var data = JSON.parse(tag.textContent);
      data.name = S.name;
      data.telephone = "+" + digits(S.phone).replace(/^\+/, "").replace(/^0/, "20");
      if (data.address) {
        data.address.streetAddress = S.address;
        data.address.addressLocality = S.city;
      }
      tag.textContent = JSON.stringify(data, null, 2);
    } catch (e) {}
  }

  /* ---------------- Init ---------------- */
  function init() {
    renderHeader();
    renderHub();
    renderPayments();
    renderCategories();
    renderFeatures();
    renderHours();
    renderLocation();
    bindActions();
    setupReveal();
    setupTabs();
    syncJsonLd();

    var year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    setInterval(function () {
      var pill = $("#statusPill");
      if (!pill) return;
      var open = isOpenNow();
      pill.classList.toggle("is-closed", !open);
      var txt = $(".status-text", pill);
      if (txt) txt.textContent = open ? "مفتوح الآن" : "مقفول الآن";
    }, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
