/* =============================================================
   Interactive assignments - shared behaviour
   Every page includes:
     <script type="application/json" id="series">
       {"id":"oop-restaurant","title":"...","parts":[{"title":"...","href":"part-1.html"}, ...]}
     </script>
     <body data-part="1">
   and is otherwise plain markup:
     .stage[data-stage][data-title][data-min]   -> ticket line + "done" checkbox
     #reminder[data-min] containing .quiz       -> ticket line ticked when the quiz is answered
     .quiz > script[type=application/json]      -> [{q, a:[...], c, h, ex}]  (`code` in backticks)
     .predict[data-key] + next sibling .reveal  -> predict-then-reveal
         input[type=number][data-answer][data-label]
         .col-guess[data-label] input[type=checkbox][data-correct]
     pre code.cs / pre code.xml                 -> highlighted + copy button
     .checklist input[id]                       -> remembered
   Progress lives in localStorage under "csa:<series id>" (one origin is shared
   with the rest of the site, so keys are always namespaced).
   ============================================================= */
(function () {
  "use strict";

  /* ---------- series + storage ---------- */
  var seriesEl = document.getElementById("series");
  var SERIES = { id: "assignment", title: "", parts: [] };
  try { if (seriesEl) SERIES = JSON.parse(seriesEl.textContent); } catch (e) {}
  var PART = String(document.body.getAttribute("data-part") || "1");
  var KEY = "csa:" + SERIES.id;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = load();
  state.parts = state.parts || {};
  state.predict = state.predict || {};
  var me = state.parts[PART] = state.parts[PART] || {};
  me.done = me.done || {};
  me.checks = me.checks || {};

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  /* text with `code` spans -> DOM, never innerHTML */
  function fill(el, text) {
    String(text).split("`").forEach(function (part, k) {
      if (k % 2) { var c = document.createElement("code"); c.textContent = part; el.appendChild(c); }
      else if (part) el.appendChild(document.createTextNode(part));
    });
  }

  /* ---------- highlighters ---------- */
  var KW = ("public private protected internal partial class static void return if else for foreach while do in is as new " +
            "base this override virtual abstract using namespace true false null get set value const bool int double string " +
            "char object out break continue switch case default").split(" ");
  var TY = ("MenuItem Dish Drink Dessert Order Table Billing List Console Program MainWindow Window MessageBox " +
            "RoutedEventArgs SelectionChangedEventArgs InvalidCastException NullReferenceException Math " +
            "Side IDiscountable IComparable InvalidOperationException Stack Queue Cafe").split(" ");
  function highlightCs(src) {
    var re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)')|([A-Za-z_][A-Za-z0-9_]*)/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += '<span class="tok-cm">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-st">' + esc(m[2]) + "</span>";
      else if (KW.indexOf(m[3]) >= 0) out += '<span class="tok-kw">' + m[3] + "</span>";
      else if (TY.indexOf(m[3]) >= 0) out += '<span class="tok-ty">' + m[3] + "</span>";
      else out += m[3];
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function highlightXml(src) {
    var re = /(<!--[\s\S]*?-->)|(<\/?[\w.:]+)|([\w.:]+)(?==")|("[^"\n]*")/g;
    var out = "", last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += '<span class="tok-cm">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="tok-kw">' + esc(m[2]) + "</span>";
      else if (m[3]) out += '<span class="tok-ty">' + m[3] + "</span>";
      else out += '<span class="tok-st">' + esc(m[4]) + "</span>";
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  document.querySelectorAll("pre code.cs, pre code.xml").forEach(function (el) {
    el.dataset.raw = el.textContent;
    el.innerHTML = el.classList.contains("xml") ? highlightXml(el.textContent) : highlightCs(el.textContent);
  });

  /* ---------- copy buttons (code only, not console output) ---------- */
  document.querySelectorAll(".code").forEach(function (card) {
    var code = card.querySelector("pre code.cs, pre code.xml");
    var bar = card.querySelector(".bar");
    if (!code || !bar) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "copy"; b.textContent = "העתקה";
    b.addEventListener("click", function () {
      var text = code.dataset.raw;
      function ok() { b.textContent = "הועתק"; setTimeout(function () { b.textContent = "העתקה"; }, 1400); }
      function fallback() {
        var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
      else fallback();
    });
    bar.appendChild(b);
  });

  /* ---------- crumbs + part navigation ---------- */
  var nParts = SERIES.parts.length, pIdx = parseInt(PART, 10) - 1;
  var crumbs = document.querySelector(".crumbs");
  if (crumbs) {
    if (nParts > 1) {
      var pill = document.createElement("span"); pill.className = "part-pill";
      pill.textContent = "חלק " + (pIdx + 1) + " מתוך " + nParts;
      crumbs.appendChild(pill);
    }
  }
  var pnav = document.querySelector(".part-nav");
  if (pnav && nParts > 1) {
    if (pIdx > 0) {
      var pv = document.createElement("a"); pv.href = SERIES.parts[pIdx - 1].href;
      pv.textContent = "חלק " + pIdx + ": " + SERIES.parts[pIdx - 1].title;
      pnav.appendChild(pv);
    }
    if (pIdx < nParts - 1) {
      var nx = document.createElement("a"); nx.className = "next"; nx.href = SERIES.parts[pIdx + 1].href;
      nx.textContent = "לחלק " + (pIdx + 2) + ": " + SERIES.parts[pIdx + 1].title;
      pnav.appendChild(nx);
    }
  }

  /* ---------- done rows on every stage ---------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll(".stage[data-stage]"));
  me.total = stages.length;
  stages.forEach(function (st) {
    var k = st.getAttribute("data-stage");
    var row = st.querySelector(".done-row");
    if (!row) {
      row = document.createElement("div"); row.className = "done-row";
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "done-" + k;
      var lb = document.createElement("label"); lb.htmlFor = cb.id;
      lb.textContent = st.getAttribute("data-done") || ("סיימתי את שלב " + k);
      row.appendChild(cb); row.appendChild(lb); st.appendChild(row);
    }
    var input = row.querySelector("input");
    input.checked = !!me.done[k];
    input.addEventListener("change", function () { me.done[k] = input.checked; save(); renderTicket(); });
  });
  document.querySelectorAll(".checklist input[id]").forEach(function (cb) {
    cb.checked = !!me.checks[cb.id];
    cb.addEventListener("change", function () { me.checks[cb.id] = cb.checked; save(); });
  });

  /* ---------- progress ticket ---------- */
  var reminder = document.getElementById("reminder");
  var hasQuiz = reminder && reminder.querySelector(".quiz");
  var aside = document.querySelector("aside.ticket-col");
  var lineEls = [];
  function buildTicket() {
    if (!aside) return;
    aside.setAttribute("aria-label", "התקדמות");
    var t = document.createElement("div"); t.className = "ticket";
    var head = document.createElement("div"); head.className = "t-head";
    var hb = document.createElement("b"); hb.textContent = "פתק התקדמות";
    var hs = document.createElement("span"); hs.textContent = nParts > 1 ? (pIdx + 1) + "/" + nParts : "";
    head.appendChild(hb); head.appendChild(hs); t.appendChild(head);
    var ul = document.createElement("ul"); ul.className = "t-lines";
    function line(key, href, name, min) {
      var li = document.createElement("li"); li.dataset.key = key;
      var a = document.createElement("a"); a.href = href;
      var box = document.createElement("span"); box.className = "box";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = name;
      var mn = document.createElement("span"); mn.className = "min"; mn.textContent = min ? min + "'" : "";
      a.appendChild(box); a.appendChild(nm); a.appendChild(mn); li.appendChild(a); ul.appendChild(li);
      lineEls.push(li);
    }
    if (hasQuiz) line("r", "#reminder", reminder.getAttribute("data-title") || "תזכורת ובוחן", reminder.getAttribute("data-min"));
    stages.forEach(function (st) {
      line(st.getAttribute("data-stage"), "#" + st.id, st.getAttribute("data-title") || "", st.getAttribute("data-min"));
    });
    t.appendChild(ul);
    var tot = document.createElement("div"); tot.className = "t-total";
    tot.innerHTML = '<div class="row"><span>שלבים שהושלמו</span><b class="t-count"></b></div><div class="meter" aria-hidden="true"><i></i></div>';
    t.appendChild(tot);
    if (nParts > 1) {
      var pl = document.createElement("ul"); pl.className = "t-parts";
      SERIES.parts.forEach(function (p, i) {
        var li = document.createElement("li"); if (i === pIdx) li.className = "here";
        var a = document.createElement("a"); a.href = p.href; a.textContent = "חלק " + (i + 1) + ": " + p.title;
        var s = document.createElement("span"); s.className = "p-count"; s.dataset.part = String(i + 1);
        li.appendChild(a); li.appendChild(s); pl.appendChild(li);
      });
      t.appendChild(pl);
    }
    aside.appendChild(t);
  }
  function countDone(p) {
    var n = 0, d = p.done || {};
    for (var k in d) if (k !== "r" && d[k]) n++;
    return n;
  }
  function renderTicket() {
    if (!aside) return;
    lineEls.forEach(function (li) { li.classList.toggle("done", !!me.done[li.dataset.key]); });
    var n = countDone(me);
    var c = aside.querySelector(".t-count"); if (c) c.textContent = n + " / " + stages.length;
    var m = aside.querySelector(".meter i"); if (m) m.style.width = (stages.length ? n / stages.length * 100 : 0) + "%";
    aside.querySelectorAll(".p-count").forEach(function (s) {
      var p = state.parts[s.dataset.part];
      s.textContent = p && p.total ? countDone(p) + "/" + p.total : "";
    });
  }
  buildTicket();
  renderTicket();
  save();

  /* ---------- quiz ---------- */
  document.querySelectorAll(".quiz").forEach(function (box) {
    var data = [];
    var src = box.querySelector('script[type="application/json"]');
    try { data = JSON.parse(src.textContent); } catch (e) { return; }
    var answered = {}, right = 0;
    var score = document.createElement("p"); score.className = "score"; score.setAttribute("aria-live", "polite");
    data.forEach(function (item, i) {
      var d = document.createElement("div"); d.className = "q";
      var fs = document.createElement("fieldset");
      var lg = document.createElement("legend"); fill(lg, (i + 1) + ". " + item.q); fs.appendChild(lg);
      var fb = document.createElement("div"); fb.className = "fb"; fb.setAttribute("aria-live", "polite");
      var name = "q-" + Math.random().toString(36).slice(2, 8);
      item.a.forEach(function (opt, j) {
        var lb = document.createElement("label");
        var inp = document.createElement("input"); inp.type = "radio"; inp.name = name; inp.value = j;
        var sp = document.createElement("span"); fill(sp, opt);
        lb.appendChild(inp); lb.appendChild(sp); fs.appendChild(lb);
        inp.addEventListener("change", function () {
          fs.querySelectorAll("label").forEach(function (l) { l.classList.remove("right", "wrong"); });
          fb.innerHTML = "";
          var tag = document.createElement("b");
          var ok = j === item.c;
          lb.classList.add(ok ? "right" : "wrong");
          tag.className = ok ? "ok" : "no"; tag.textContent = ok ? "נכון. " : "לא בדיוק. ";
          if (!answered[i]) { answered[i] = true; if (ok) right++; }
          fb.appendChild(tag);
          fill(fb, ok ? item.ex : "נסו שוב. רמז: " + item.h);
          fb.classList.add("show");
          if (Object.keys(answered).length === data.length) {
            score.textContent = "נכון בניסיון הראשון: " + right + " מתוך " + data.length + "." +
              (right < data.length ? " כדאי לעבור שוב על התזכורת לפני שממשיכים." : " אפשר להמשיך.");
            if (hasQuiz && reminder.contains(box) && !me.done.r) { me.done.r = true; save(); renderTicket(); }
          }
        });
      });
      d.appendChild(fs); d.appendChild(fb); box.appendChild(d);
    });
    box.appendChild(score);
  });

  /* ---------- predict, then reveal ---------- */
  document.querySelectorAll(".predict[data-key]").forEach(function (pr) {
    var key = pr.getAttribute("data-key");
    var reveal = pr.nextElementSibling && pr.nextElementSibling.classList.contains("reveal") ? pr.nextElementSibling : null;
    var btn = pr.querySelector("button");
    var msg = pr.querySelector(".g-msg");
    var nums = Array.prototype.slice.call(pr.querySelectorAll("input[type=number]"));
    var groups = Array.prototype.slice.call(pr.querySelectorAll(".col-guess"));
    if (!reveal || !btn) return;
    var res = reveal.querySelector(".g-result");
    if (!res) { res = document.createElement("div"); res.className = "g-result"; reveal.insertBefore(res, reveal.firstChild); }
    res.setAttribute("aria-live", "polite");

    function para(ok, text) {
      var p = document.createElement("p"), b = document.createElement("span");
      b.className = ok ? "ok" : "no"; b.textContent = ok ? "צדקתם. " : "לא בדיוק. ";
      p.appendChild(b); fill(p, text); res.appendChild(p);
    }
    function ticks(list) { return list.map(function (v) { return "`" + v + "`"; }).join(", "); }
    function show(saved) {
      res.innerHTML = "";
      groups.forEach(function (g, gi) {
        var boxes = Array.prototype.slice.call(g.querySelectorAll("input[type=checkbox]"));
        var picked = saved.groups[gi] || [];
        var correct = boxes.filter(function (b) { return b.hasAttribute("data-correct"); }).map(function (b) { return b.value; });
        var extra = picked.filter(function (v) { return correct.indexOf(v) < 0; });
        var missed = correct.filter(function (v) { return picked.indexOf(v) < 0; });
        var label = g.getAttribute("data-label") || "התשובה";
        if (!extra.length && !missed.length) para(true, label + ": " + ticks(correct) + ".");
        else para(false, label + ": " + ticks(correct) + "." +
                  (extra.length ? " סימנתם גם: " + ticks(extra) + "." : "") +
                  (missed.length ? " פספסתם: " + ticks(missed) + "." : ""));
        boxes.forEach(function (b) { b.checked = picked.indexOf(b.value) >= 0; b.disabled = true; });
      });
      nums.forEach(function (inp, ni) {
        var v = saved.nums[ni], ans = inp.getAttribute("data-answer"), label = inp.getAttribute("data-label") || "";
        inp.value = v; inp.disabled = true;
        if (Number(v) === Number(ans)) para(true, label + ": " + ans + ".");
        else para(false, label + ": ניחשתם " + v + ", בפועל " + ans + ".");
      });
      reveal.hidden = false;
      btn.disabled = true; btn.textContent = "הניחוש נשמר";
    }
    btn.addEventListener("click", function () {
      var saved = { nums: [], groups: [] }, missing = false;
      nums.forEach(function (inp) { if (inp.value === "") missing = true; saved.nums.push(inp.value); });
      groups.forEach(function (g) {
        var picked = [];
        g.querySelectorAll("input[type=checkbox]").forEach(function (b) { if (b.checked) picked.push(b.value); });
        if (!picked.length) missing = true;
        saved.groups.push(picked);
      });
      if (missing) { if (msg) msg.textContent = "ענו על כל החלקים של הניחוש לפני שמציגים את התשובה."; return; }
      if (msg) msg.textContent = "";
      state.predict[key] = saved; save();
      show(saved);
    });
    if (state.predict[key]) show(state.predict[key]);
  });
})();
